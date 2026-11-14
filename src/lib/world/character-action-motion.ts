import { Euler, Quaternion } from "three";
import { HUMANOID_BONE_KEYS, type CharacterAnimationStateId, type HumanoidBoneKey } from "./animation-state-machine";
import { DETAIL_BONE_KEYS, type DetailBoneKey } from "./character-pose-details";

export type ActionMotionIntent = {
  readonly state: CharacterAnimationStateId;
  readonly stateTime: number;
  readonly velocityY: number;
  readonly jumpSpeed: number;
  readonly moving: boolean;
};
type Bone = HumanoidBoneKey | DetailBoneKey;
const BONES: readonly Bone[] = [...HUMANOID_BONE_KEYS, ...DETAIL_BONE_KEYS];
export const FINGER_BONES = DETAIL_BONE_KEYS.filter(k => !k.endsWith("Toes"));
type ActionClip = { name: string; duration: number; frameCount: number; rotations: Record<Bone, number[]>; hips: number[] };
export type ActionMotionData = {
  version: 1;
  source: { license: string; hipsHeight: number };
  handRest: Record<DetailBoneKey, number[]>;
  clips: Record<"launch" | "air" | "land", ActionClip>;
};

export function parseActionMotion(value: unknown): ActionMotionData {
  const data = value as ActionMotionData;
  if (data?.version !== 1 || data.source?.license !== "CC0-1.0" || !Number.isFinite(data.source.hipsHeight) ||
    data.source.hipsHeight < .2 || data.source.hipsHeight > 2) throw new Error("Invalid action metadata");
  const validRotations = (values: unknown, length: number) => {
    if (!Array.isArray(values) || values.length !== length || !values.every(Number.isFinite)) return false;
    for (let i = 0; i < values.length; i += 4) {
      if (Math.abs(Math.hypot(values[i], values[i + 1], values[i + 2], values[i + 3]) - 1) > .001) return false;
    }
    return true;
  };
  for (const key of FINGER_BONES) if (!validRotations(data.handRest?.[key], 4)) throw new Error(`Invalid hand ${key}`);
  for (const kind of ["launch", "air", "land"] as const) {
    const c = data.clips?.[kind];
    if (!c || !Number.isInteger(c.frameCount) || c.frameCount < 2 || c.frameCount > 240 ||
      !Number.isFinite(c.duration) || c.duration <= 0 || c.duration > 5 || !Array.isArray(c.hips) ||
      c.hips.length !== c.frameCount + 1 || !c.hips.every(v => Number.isFinite(v) && Math.abs(v) < .6)) {
      throw new Error(`Invalid ${kind} clip`);
    }
    for (const bone of BONES) if (!validRotations(c.rotations?.[bone], (c.frameCount + 1) * 4)) throw new Error(`Invalid ${kind}/${bone}`);
  }
  return data;
}

export async function loadActionMotion(fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher("/models/animations/actions.json", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ok: true as const, data: parseActionMotion(await response.json()) };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : String(error) };
  }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t); };

/** Hands are a mask; only jump/recovery can affect the accepted body animation. */
export function createActionMotionPlayer(data: ActionMotionData, hipsHeight: number) {
  const rotations = Object.fromEntries(BONES.map(k => [k, new Quaternion()])) as Record<Bone, Quaternion>;
  const sampled = Object.fromEntries(BONES.map(k => [k, new Quaternion()])) as Record<Bone, Quaternion>;
  // Retain authored coordination around its settled pose, with quieter arms than legs.
  const hopBones = [...HUMANOID_BONE_KEYS, "leftToes", "rightToes"] as const;
  const settled = Object.fromEntries(hopBones.map(key => [key,
    new Quaternion().fromArray(data.clips.land.rotations[key], data.clips.land.frameCount * 4).normalize()
  ])) as Record<typeof hopBones[number], Quaternion>;
  const a = new Quaternion(), b = new Quaternion();
  const angles = new Euler();
  const result = { rotations, hipsOffsetY: 0, bodyWeight: 0, handWeight: 1, airborne: false };
  let previousState: CharacterAnimationStateId = "idle", recovery = Infinity, recoveryDuration = .34;
  const scale = hipsHeight / data.source.hipsHeight;

  function read(clip: ActionClip, time: number, target: Record<Bone, Quaternion>) {
    const frame = clamp01(time) * clip.frameCount;
    const i = Math.min(clip.frameCount - 1, Math.floor(frame)), alpha = frame - i;
    for (const key of BONES) target[key].fromArray(clip.rotations[key], i * 4)
      .slerp(b.fromArray(clip.rotations[key], (i + 1) * 4), alpha).normalize();
    return (clip.hips[i] + (clip.hips[i + 1] - clip.hips[i]) * alpha) * scale;
  }

  return {
    reset() { previousState = "idle"; recovery = Infinity; result.bodyWeight = 0; result.airborne = false; },
    sample(intent: ActionMotionIntent, delta: number) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.1, delta)) : 0;
      const airborne = intent.state === "jump" || intent.state === "fall";
      if (airborne) recovery = Infinity;
      else if (intent.state === "land" && previousState !== "land") {
        recovery = 0;
        // Releasing movement must not rewind a landing already in progress.
        recoveryDuration = intent.moving ? .24 : .34;
      }
      previousState = intent.state;
      result.airborne = airborne;
      const duration = recoveryDuration;
      if (Number.isFinite(recovery)) recovery += dt;
      const landing = recovery < duration;
      const targetWeight = airborne ? 1 : landing ? 1 - smooth((recovery / duration - .45) / .55) : 0;
      result.bodyWeight += (targetWeight - result.bodyWeight) * (1 - Math.exp(-35 * dt));
      if (result.bodyWeight < .001) result.bodyWeight = 0;
      if (intent.state === "jump") {
        const ascent = clamp01(1 - intent.velocityY / Math.max(1, intent.jumpSpeed));
        // Trim the grounded wind-up. Physics owns height and launch timing.
        read(data.clips.launch, .12 + .88 * ascent, rotations);
        result.hipsOffsetY = 0;
      } else if (intent.state === "fall") {
        const descent = clamp01(-intent.velocityY / Math.max(1, intent.jumpSpeed));
        read(data.clips.air, clamp01(intent.stateTime / data.clips.air.duration), rotations);
        read(data.clips.land, 0, sampled);
        for (const key of BONES) rotations[key].slerp(sampled[key], smooth(descent));
        result.hipsOffsetY = 0;
      } else if (landing) {
        const sourceHip = read(data.clips.land, recovery / duration * .9, rotations);
        const settledHip = data.clips.land.hips[data.clips.land.frameCount] * scale;
        result.hipsOffsetY = settledHip + (sourceHip - settledHip) * .28;
      }
      if (airborne || landing) {
        for (const key of hopBones) {
          const influence = key.endsWith("LowerArm") || key.endsWith("Hand") ? .65
            : key.endsWith("UpperArm") || key.endsWith("Shoulder") ? .4
            : key.endsWith("Leg") ? .5
            : key.endsWith("Foot") || key.endsWith("Toes") ? .7 : .45;
          rotations[key].slerp(settled[key], 1 - influence);
        }
        // The source is a split-leg jump; a standing hop needs paired support.
        const balance = intent.moving ? .8 : 1;
        for (const suffix of ["Shoulder", "UpperArm", "LowerArm", "Hand", "UpperLeg", "LowerLeg", "Foot", "Toes"] as const) {
          const left = rotations[`left${suffix}`], right = rotations[`right${suffix}`];
          a.copy(left).slerp(b.set(right.x, -right.y, -right.z, right.w), .5);
          left.slerp(a, balance);
          right.slerp(b.set(a.x, -a.y, -a.z, a.w), balance);
        }
        for (const key of ["hips", "spine", "chest", "upperChest", "neck", "head"] as const) {
          const q = rotations[key];
          q.slerp(b.set(q.x, -q.y, -q.z, q.w), balance * .5);
        }
        const lift = airborne ? Math.sin(Math.PI * clamp01((1 - intent.velocityY / Math.max(1, intent.jumpSpeed)) * .5)) : 0;
        for (const side of ["left", "right"] as const) {
          // Keep knee flexion in the travel plane instead of the source's wide stance.
          for (const suffix of ["UpperLeg", "LowerLeg", "Foot", "Toes"] as const) {
            const q = rotations[`${side}${suffix}`];
            angles.setFromQuaternion(q);
            angles.y *= .15; angles.z *= .15;
            q.setFromEuler(angles);
          }
          const arm = rotations[`${side}UpperArm`];
          angles.setFromQuaternion(arm);
          angles.x -= .5 * lift;
          angles.y *= .4;
          angles.z = (side === "left" ? -1 : 1) * Math.max(1.15, Math.abs(angles.z));
          arm.setFromEuler(angles);
        }
      }
      // Keep the source's finger relationships, soften its closed fist for this avatar.
      const curl = intent.state === "run" ? .68 : intent.state === "walk" ? .5 : .42;
      for (const key of FINGER_BONES) {
        a.identity().slerp(b.fromArray(data.handRest[key]).normalize(), curl);
        if (result.bodyWeight > 0) a.slerp(rotations[key], result.bodyWeight);
        rotations[key].copy(a);
      }
      return result;
    }
  };
}
