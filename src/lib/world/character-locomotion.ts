import { Quaternion } from "three";
import { HUMANOID_BONE_KEYS, type HumanoidBoneKey } from "./animation-state-machine";

export type LocomotionIntent = { readonly kind: "walk" | "run"; readonly speed: number };
export type LocomotionBone = HumanoidBoneKey | "leftToes" | "rightToes";
const BONES: readonly LocomotionBone[] = [...HUMANOID_BONE_KEYS, "leftToes", "rightToes"];
// Degrees in normalized parent space: open the upper back, then rebalance gaze.
const POSTURE_PITCH = [
  ["chest", -1, -2], ["upperChest", -5, -8],
  ["neck", 2, 3], ["head", -7, -6]
] as const;
type Clip = {
  name: string;
  duration: number;
  frameCount: number;
  strideLength: number;
  rotations: Record<LocomotionBone, number[]>;
  hips: number[];
};
export type LocomotionClips = {
  version: 1;
  source: { license: string; hipsHeight: number };
  clips: { walk: Clip; run: Clip };
};

export function parseLocomotionClips(value: unknown): LocomotionClips {
  const data = value as LocomotionClips;
  const finiteArray = (v: unknown, length: number) => Array.isArray(v) && v.length === length && v.every(Number.isFinite);
  if (data?.version !== 1 || data.source?.license !== "CC0-1.0" ||
    !Number.isFinite(data.source.hipsHeight) || data.source.hipsHeight < 0.2 || data.source.hipsHeight > 2) {
    throw new Error("Invalid locomotion metadata");
  }
  for (const kind of ["walk", "run"] as const) {
    const c = data.clips?.[kind];
    if (!c || !Number.isInteger(c.frameCount) || c.frameCount < 2 || c.frameCount > 240 ||
      !Number.isFinite(c.duration) || c.duration <= 0 || c.duration > 5 ||
      !Number.isFinite(c.strideLength) || c.strideLength < 0.5 || c.strideLength > 6 ||
      !finiteArray(c.hips, c.frameCount + 1) || c.hips.some(y => Math.abs(y) > 0.5)) {
      throw new Error(`Invalid ${kind} locomotion clip`);
    }
    for (const bone of BONES) {
      const q = c.rotations?.[bone];
      if (!finiteArray(q, (c.frameCount + 1) * 4)) throw new Error(`Invalid ${kind}/${bone} track`);
      for (let i = 0; i < q.length; i += 4) {
        if (Math.abs(Math.hypot(q[i], q[i + 1], q[i + 2], q[i + 3]) - 1) > 0.001) {
          throw new Error(`Non-unit ${kind}/${bone} rotation`);
        }
      }
    }
  }
  return data;
}

export type LocomotionLoadResult = { ok: true; clips: LocomotionClips } | { ok: false; reason: string };
export async function loadLocomotionClips(fetcher: typeof fetch = fetch): Promise<LocomotionLoadResult> {
  try {
    const response = await fetcher("/models/animations/locomotion.json", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ok: true, clips: parseLocomotionClips(await response.json()) };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Immutable shared clips; phase, blend and sampled quaternions belong to one actor. */
export function createLocomotionPlayer(data: LocomotionClips, hipsHeight: number) {
  const scale = hipsHeight / data.source.hipsHeight;
  const rotations = Object.fromEntries(BONES.map(k => [k, new Quaternion()])) as Record<LocomotionBone, Quaternion>;
  const a = new Quaternion(), b = new Quaternion(), next = new Quaternion();
  let phase = 0, weight = 0, runWeight = 0;
  const sample = { rotations, hipsOffsetY: 0, weight: 0, contacts: { left: false, right: false } };

  function sampleRotation(clip: Clip, bone: LocomotionBone, out: Quaternion) {
    const frame = phase * clip.frameCount, i = Math.floor(frame), alpha = frame - i;
    return out.fromArray(clip.rotations[bone], i * 4).slerp(next.fromArray(clip.rotations[bone], (i + 1) * 4), alpha).normalize();
  }
  function sampleHips(clip: Clip) {
    const frame = phase * clip.frameCount, i = Math.floor(frame);
    return clip.hips[i] + (clip.hips[i + 1] - clip.hips[i]) * (frame - i);
  }
  return {
    get phase() { return phase; },
    get contacts() { return { ...sample.contacts }; },
    reset() { phase = 0; weight = 0; runWeight = 0; sample.contacts.left = false; sample.contacts.right = false; },
    sample(intent: LocomotionIntent | undefined, delta: number) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
      const active = intent && Number.isFinite(intent.speed) && intent.speed >= 0.12;
      const alpha = 1 - Math.exp(-20 * dt);
      weight += (Number(Boolean(active)) - weight) * alpha;
      if (weight < 0.001) { weight = 0; sample.contacts.left = false; sample.contacts.right = false; return null; }
      if (active) {
        runWeight += (Number(intent.kind === "run") - runWeight) * alpha;
        const stride = (data.clips.walk.strideLength * (1 - runWeight) + data.clips.run.strideLength * runWeight) * scale;
        phase = (phase + intent.speed * dt / stride) % 1;
      }
      for (const bone of BONES) {
        sampleRotation(data.clips.walk, bone, a);
        sampleRotation(data.clips.run, bone, b);
        rotations[bone].copy(a).slerp(b, runWeight);
      }
      for (const [bone, walk, run] of POSTURE_PITCH) {
        const halfPitch = (walk + (run - walk) * runWeight) * Math.PI / 360;
        rotations[bone].premultiply(a.set(Math.sin(halfPitch), 0, 0, Math.cos(halfPitch)));
      }
      sample.hipsOffsetY = (sampleHips(data.clips.walk) * (1 - runWeight) + sampleHips(data.clips.run) * runWeight) * scale;
      sample.weight = weight;
      // Only the flat mid-stance interval is pinned. Heel/toe roll and swing stay authored.
      const stanceEnd = 0.23 * (1 - runWeight) + 0.16 * runWeight;
      sample.contacts.left = Boolean(active) && phase > 0.025 && phase < stanceEnd;
      const rightPhase = (phase + 0.5) % 1;
      sample.contacts.right = Boolean(active) && rightPhase > 0.025 && rightPhase < stanceEnd;
      return sample;
    }
  };
}
