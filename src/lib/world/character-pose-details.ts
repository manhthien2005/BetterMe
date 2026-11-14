import type { CharacterAnimationStateId, EulerTuple, HumanoidPose } from "./animation-state-machine";

type Finger = "Index" | "Middle" | "Ring" | "Little";
type Joint = "Proximal" | "Intermediate" | "Distal";
export type DetailBoneKey = `${"left" | "right"}${Finger}${Joint}`
  | `${"left" | "right"}Thumb${"Metacarpal" | "Proximal" | "Distal"}`
  | "leftToes" | "rightToes";

export const DETAIL_BONE_KEYS: readonly DetailBoneKey[] = (["left", "right"] as const).flatMap(side => [
  ...(["Index", "Middle", "Ring", "Little"] as const).flatMap(finger =>
    (["Proximal", "Intermediate", "Distal"] as const).map(joint => `${side}${finger}${joint}` as DetailBoneKey)),
  `${side}ThumbMetacarpal`, `${side}ThumbProximal`, `${side}ThumbDistal`, `${side}Toes`
] as DetailBoneKey[]);

/** Optional VRM detail; core poses and non-humanoid fallbacks remain usable. */
export function decorateCharacterPose(
  pose: HumanoidPose, state: CharacterAnimationStateId, phase: number,
  frequency = 0
): HumanoidPose {
  const detailBones: Partial<Record<DetailBoneKey, EulerTuple>> = {};
  const fingers: Finger[] = ["Index", "Middle", "Ring", "Little"];
  for (const side of ["left", "right"] as const) {
    const sign = side === "left" ? -1 : 1;
    // Follow the already blended arm, so an interrupted wave also blends the fingers.
    const openness = side === "right" ? Math.max(0, Math.min(1, (1.16 - pose.bones.rightUpperArm[2]) / 0.91)) : 0;
    fingers.forEach((finger, index) => {
      const curl = (0.24 + index * 0.045) * (1 - openness * 0.93);
      detailBones[`${side}${finger}Proximal`] = [0, 0, sign * curl];
      detailBones[`${side}${finger}Intermediate`] = [0, 0, sign * curl * 1.15];
      detailBones[`${side}${finger}Distal`] = [0, 0, sign * curl * 0.65];
    });
    detailBones[`${side}ThumbMetacarpal`] = [0.1, sign * -0.15, sign * 0.12];
    detailBones[`${side}ThumbProximal`] = [0, 0, sign * 0.12 * (1 - openness)];
    detailBones[`${side}ThumbDistal`] = [0, 0, sign * 0.08 * (1 - openness)];
  }
  const moving = state === "walk" || state === "run";
  const airborne = state === "jump" || state === "fall";
  const leftPhase = ((phase / (2 * Math.PI) - 0.25) % 1 + 1) % 1;
  const rightPhase = (leftPhase + 0.5) % 1;
  const stance = state === "run" ? 0.45 : 0.54;
  for (const [side, gait] of [["left", leftPhase], ["right", rightPhase]] as const) {
    const push = moving && gait < stance ? Math.max(0, (gait / stance - 0.7) / 0.3) : 0;
    detailBones[`${side}Toes`] = [-0.22 * push, 0, 0];
  }
  return {
    ...pose, detailBones,
    footGait: moving && frequency > 0 ? {
      leftPhase, rightPhase, stance, frequency, lift: state === "run" ? 0.14 : 0.09
    } : undefined,
    footContacts: {
      left: !airborne && (!moving || leftPhase < stance),
      right: !airborne && (!moving || rightPhase < stance)
    }
  };
}
