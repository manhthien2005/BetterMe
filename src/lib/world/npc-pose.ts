import { evaluateStatePose, type HumanoidPose, type EulerTuple } from "./animation-state-machine";
import { decorateCharacterPose } from "./character-pose-details";

export type NpcGesture = "idle" | "notice" | "nearby" | "greet" | "explain" | "attentive" | "farewell";
export type NpcActivity = NpcGesture | "look-around" | "welcome" | "watch-gate" | "adjust-cuff" | "check-book" | "adjust-glasses" | "point" | "open-palm";

function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
function envelope(time: number, duration: number) {
  return smooth(time / .35) * smooth((duration - time) / .4);
}
function mix(from: EulerTuple, to: EulerTuple, amount: number): EulerTuple {
  return [from[0]+(to[0]-from[0])*amount, from[1]+(to[1]-from[1])*amount, from[2]+(to[2]-from[2])*amount];
}

/** Each role owns its upper-body performance; all actors keep the common VRM pipeline. */
export function evaluateNpcPose(input: {
  id: string; time: number; phaseOffset: number; gesture: NpcGesture;
  gestureTime: number; lineIndex: number | null; targetYaw: number;
  targetPitch: number; reducedMotion: boolean;
}): { pose: HumanoidPose; activity: NpcActivity } {
  const { gesture, gestureTime, reducedMotion } = input;
  const steward = input.id.includes("steward"), librarian = input.id.includes("librarian");
  const clock = input.time + input.phaseOffset;
  const base = evaluateStatePose("idle", 0, clock, reducedMotion);
  const bones = { ...base.bones };
  let activity: NpcActivity = gesture;
  const attentive = input.lineIndex !== null || gesture === "nearby" || gesture === "notice" || gesture === "farewell";
  const put = (key: keyof typeof bones, target: EulerTuple, weight: number) => { bones[key] = mix(bones[key], target, weight); };
  if (steward) {
    bones.hips = [0, 0, 0];
    bones.chest = [reducedMotion ? .005 : .005 + Math.sin(clock * 1.6) * .008, 0, 0];
    bones.rightUpperArm = [.02, 0, 1.20]; bones.leftUpperArm = [.02, 0, -1.20];
  }
  if (librarian) {
    bones.leftUpperArm = [-.22, 0, -.98]; bones.leftLowerArm = [0, -1.15, 0]; bones.leftHand = [0, 0, -.1];
    bones.head = [attentive ? 0 : .16, 0, 0];
  }
  if (gesture === "idle") {
    const cycle = clock % 18;
    const accent = !reducedMotion && cycle >= 12 && cycle < 15 ? envelope(cycle - 12, 3) : 0;
    activity = librarian ? "check-book" : steward ? "watch-gate" : "look-around";
    if (!reducedMotion && !librarian) bones.head = [.005, Math.sin(clock * .38) * (steward ? .22 : .16), 0];
    if (accent > 0) {
      activity = librarian ? "adjust-glasses" : steward ? "adjust-cuff" : "welcome";
      if (librarian) {
        put("rightUpperArm", [-.5, .5, .14], accent); put("rightLowerArm", [-.2, 2.1, -.5], accent);
        put("rightHand", [.94, .86, -.35], accent); put("head", [.03, 0, 0], accent);
      } else if (steward) {
        put("leftUpperArm", [-.35, 0, -.95], accent); put("leftLowerArm", [0, -1.12, 0], accent);
        put("rightUpperArm", [-.88, 1.19, 1.6], accent); put("rightLowerArm", [.2, 1.26, .07], accent);
        put("rightHand", [.44, -.18, -.1], accent);
        put("head", [.10, -.08, 0], accent);
      } else {
        put("rightUpperArm", [-.1, .1, .85], accent); put("rightLowerArm", [0, .75, -.1], accent);
        put("rightHand", [.08, -.2, -.15], accent);
      }
    }
  }
  if (attentive) {
    const yaw = Number.isFinite(input.targetYaw) ? Math.max(-.55, Math.min(.55, input.targetYaw)) : 0;
    const pitch = Number.isFinite(input.targetPitch) ? Math.max(-.22, Math.min(.22, input.targetPitch)) : 0;
    bones.neck = [pitch * .3, yaw * .3, 0]; bones.head = [pitch * .7, yaw * .7, 0];
  }
  if (!reducedMotion && (gesture === "greet" || gesture === "notice" || gesture === "farewell")) {
    const duration = gesture === "greet" ? 1.35 : gesture === "notice" ? 1.15 : .85;
    const amount = envelope(gestureTime, duration);
    if (steward) {
      bones.head = [bones.head[0] + .13 * amount, bones.head[1], 0]; bones.chest = [.025 * amount, 0, 0];
    } else if (librarian) {
      if (gesture !== "farewell") {
        put("rightUpperArm", [-.12, .12, .82], amount); put("rightLowerArm", [0, .8, -.35], amount);
        put("rightHand", [.03, -.12, -.1], amount);
      }
      bones.head = [bones.head[0] + .06 * amount, bones.head[1], 0];
    } else {
      const wave = evaluateStatePose("interact", 0, gestureTime * 1.35 / duration);
      const scale = gesture === "greet" ? 1 : .65;
      for (const key of ["rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand"] as const) put(key, wave.bones[key], scale);
      bones.head = [bones.head[0], bones.head[1], .025 * amount];
    }
  }
  const variant = (input.lineIndex ?? 0) % 2;
  const explaining = gesture === "explain" && !reducedMotion ? envelope(gestureTime, 1.8) : 0;
  if (explaining > 0) {
    activity = steward && variant === 0 ? "point" : "open-palm";
    const amount = explaining * (librarian ? .7 : 1);
    put("rightUpperArm", [-.22, variant ? -.12 : .1, variant ? .90 : .71], amount);
    put("rightLowerArm", [0, steward && variant === 0 ? .48 : .86, -.24], amount);
    put("rightHand", [.08, -.18, -.14], amount); put("chest", [.03, variant ? .025 : -.035, 0], amount);
  }
  const target = decorateCharacterPose({ ...base, bones }, "idle", 0);
  if (steward && variant === 0 && explaining > 0 && target.detailBones) {
    for (const joint of ["Proximal", "Intermediate", "Distal"] as const) {
      const key = `rightIndex${joint}` as const;
      target.detailBones[key] = mix(target.detailBones[key]!, [0, 0, .02], explaining);
      for (const finger of ["Middle", "Ring", "Little"] as const) {
        const key = `right${finger}${joint}` as const;
        target.detailBones[key] = mix(target.detailBones[key]!, [0, 0, .75], explaining);
      }
    }
  }
  return { pose: target, activity };
}
