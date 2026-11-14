import { HUMANOID_BONE_KEYS, type CharacterExpressionWeights, type EulerTuple, type HumanoidPose } from "./animation-state-machine";
import { DETAIL_BONE_KEYS } from "./character-pose-details";
import { evaluateNpcPose, type NpcActivity, type NpcGesture } from "./npc-pose";
import type { Vec3Tuple } from "./types";

export function npcLookPitch(player: Vec3Tuple, npc: Vec3Tuple): number {
  return -Math.atan2(player[1] - npc[1], Math.max(0.5, Math.hypot(player[0] - npc[0], player[2] - npc[2])));
}

export type NpcMotionState = {
  id: string;
  time: number;
  phaseOffset: number;
  lineIndex: number | null;
  gesture: NpcGesture;
  activity: NpcActivity;
  gestureTime: number;
  playerNear: boolean;
  noticeCooldown: number;
  blendTime: number;
  from: HumanoidPose;
  pose: HumanoidPose;
  expressions: CharacterExpressionWeights;
};

export type NpcMotionInput = {
  lineIndex: number | null;
  targetYaw: number;
  targetPitch: number;
  reducedMotion: boolean;
  playerDistance?: number;
};

export function isNpcPlayerNearby(distance: number | undefined, wasNear: boolean) {
  return distance !== undefined && Number.isFinite(distance) && distance >= 0 && distance <= (wasNear ? 4.6 : 3.8);
}
function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
function blendAngles(from: EulerTuple, to: EulerTuple, weight: number): EulerTuple {
  if (weight === 0) return from;
  return [from[0] + (to[0] - from[0]) * weight, from[1] + (to[1] - from[1]) * weight, from[2] + (to[2] - from[2]) * weight];
}
export function createNpcMotionState(id: string): NpcMotionState {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const phaseOffset = (hash % 1000) / 137;
  const { pose, activity } = evaluateNpcPose({ id, time: 0, phaseOffset, lineIndex: null,
    gesture: "idle", gestureTime: 0, targetYaw: 0, targetPitch: 0, reducedMotion: false });
  return { id, time: 0, phaseOffset, lineIndex: null, gesture: "idle", activity,
    gestureTime: 0, playerNear: false, noticeCooldown: 0, blendTime: 1, from: pose, pose,
    expressions: { blink: 0, happy: 0, relaxed: .18, surprised: 0, aa: 0 } };
}

/** Dialogue outranks proximity; gestures are interruptible and never open dialogue themselves. */
export function stepNpcMotion(state: NpcMotionState, input: NpcMotionInput, delta: number): NpcMotionState {
  const dt = Number.isFinite(delta) ? Math.min(.1, Math.max(0, delta)) : 0;
  const wasNear = state.playerNear;
  state.playerNear = isNpcPlayerNearby(input.playerDistance, wasNear);
  state.noticeCooldown = Math.max(0, state.noticeCooldown - dt);
  const lineChanged = input.lineIndex !== state.lineIndex;
  let next = state.gesture;
  if (lineChanged) {
    next = input.lineIndex === null ? "farewell" : state.lineIndex === null ? "greet" : "explain";
    if (input.lineIndex !== null) state.noticeCooldown = 8;
  } else if (input.lineIndex !== null) {
    if (state.gesture === "greet" && state.gestureTime >= 1.35) next = "explain";
    else if (state.gesture === "explain" && state.gestureTime >= 1.8) next = "attentive";
  } else if (state.gesture === "farewell" && state.gestureTime < .85) {
    next = "farewell";
  } else if (state.playerNear && !wasNear && state.noticeCooldown === 0) {
    next = "notice";
    state.noticeCooldown = 8;
  } else if (state.gesture === "notice" && state.playerNear && state.gestureTime < 1.15) {
    next = "notice";
  } else {
    next = state.playerNear ? "nearby" : "idle";
  }
  if (next !== state.gesture || (lineChanged && next === "explain")) {
    state.from = state.pose;
    state.blendTime = 0;
    state.gestureTime = 0;
    state.gesture = next;
  }
  state.lineIndex = input.lineIndex;
  state.time += dt;
  state.gestureTime += dt;
  state.blendTime += dt;
  const { pose: target, activity } = evaluateNpcPose({ ...state, targetYaw: input.targetYaw,
    targetPitch: input.targetPitch, reducedMotion: input.reducedMotion });
  state.activity = activity;
  const weight = smooth(state.blendTime / .28), bones = { ...target.bones }, detailBones = { ...target.detailBones };
  for (const key of HUMANOID_BONE_KEYS) bones[key] = blendAngles(state.from.bones[key], target.bones[key], weight);
  for (const key of DETAIL_BONE_KEYS) detailBones[key] = blendAngles(state.from.detailBones?.[key] ?? [0, 0, 0], target.detailBones![key]!, weight);
  state.pose = { ...target, bones, detailBones, hipsOffsetY: state.from.hipsOffsetY + (target.hipsOffsetY - state.from.hipsOffsetY) * weight };
  const clock = state.time + state.phaseOffset, blinkPeriod = 3.8 + state.phaseOffset * .12;
  const blinkPhase = (clock % blinkPeriod) / .16;
  const engaged = input.lineIndex !== null || state.playerNear;
  const smile = state.id.includes("steward") ? .09 : state.id.includes("librarian") ? .12 : .2;
  state.expressions = {
    blink: blinkPhase < 1 ? Math.sin(blinkPhase * Math.PI) : 0,
    happy: state.expressions.happy + ((engaged ? smile : 0) - state.expressions.happy) * (1 - Math.exp(-8 * dt)),
    relaxed: .18, surprised: 0, aa: 0
  };
  return state;
}
