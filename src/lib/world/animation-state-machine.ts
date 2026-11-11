import { DEFAULT_PLAYER_MOVEMENT_CONFIG } from "@/lib/world/map-config";

export type CharacterAnimationStateId =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fall"
  | "land"
  | "interact";

export type EulerTuple = readonly [number, number, number];

export type HumanoidBoneKey =
  | "hips"
  | "spine"
  | "chest"
  | "upperChest"
  | "neck"
  | "head"
  | "leftShoulder"
  | "leftUpperArm"
  | "leftLowerArm"
  | "leftHand"
  | "rightShoulder"
  | "rightUpperArm"
  | "rightLowerArm"
  | "rightHand"
  | "leftUpperLeg"
  | "leftLowerLeg"
  | "leftFoot"
  | "rightUpperLeg"
  | "rightLowerLeg"
  | "rightFoot";

export const HUMANOID_BONE_KEYS: readonly HumanoidBoneKey[] = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot"
];

export type HumanoidPose = {
  readonly bones: Readonly<Record<HumanoidBoneKey, EulerTuple>>;
  readonly hipsOffsetY: number;
};

export type CharacterExpressionWeights = {
  blink: number;
  happy: number;
  relaxed: number;
  surprised: number;
  aa: number;
};

export type AnimationMachineInput = {
  readonly isGrounded: boolean;
  readonly isMoving: boolean;
  readonly isRunning: boolean;
  readonly speed: number;
  readonly velocityY: number;
  readonly walkSpeed?: number;
  readonly runSpeed?: number;
  readonly jumpSpeed?: number;
  readonly interactRequested?: boolean;
  readonly isDialogueOpen?: boolean;
};

export type AnimationPoseContext = {
  readonly ambientTime?: number;
  readonly groundSpeed?: number;
  readonly velocityY?: number;
  readonly walkSpeed?: number;
  readonly runSpeed?: number;
  readonly jumpSpeed?: number;
  readonly landProgress?: number;
  readonly impactScale?: number;
  readonly isMovingDuringLand?: boolean;
  readonly isRunningDuringLand?: boolean;
};

export type AnimationMachineState = {
  currentState: CharacterAnimationStateId;
  previousState: CharacterAnimationStateId;
  stateTime: number;
  previousStateTime: number;
  ambientTime: number;
  cyclePhase: number;
  blendProgress: number;
  blendDuration: number;
  blendOffset: HumanoidPose;
  blendOffsetReduced: HumanoidPose;
  groundSpeed: number;
  velocityY: number;
  walkSpeed: number;
  runSpeed: number;
  jumpSpeed: number;
  peakFallSpeed: number;
  impactScale: number;
  isMovingOnGround: boolean;
  isRunningOnGround: boolean;
  landTimer: number;
  interactTimer: number;
  blinkTimer: number;
  wasGrounded: boolean;
  isDialogueOpen: boolean;
  expressions: CharacterExpressionWeights;
};

export const ANIMATION_STATE_LABELS: Readonly<Record<CharacterAnimationStateId, string>> = {
  idle: "Đứng nghỉ (Idle)",
  walk: "Đi bộ (Walk)",
  run: "Chạy (Run)",
  jump: "Nhảy lên (Jump)",
  fall: "Đang rơi (Fall)",
  land: "Tiếp đất (Land)",
  interact: "Chào NPC (Wave)"
};

export const DEFAULT_BLEND_DURATION_SECONDS = 0.18;
export const LAND_RECOVERY_DURATION_SECONDS = 0.25;
export const INTERACT_WAVE_DURATION_SECONDS = 1.35;
export const BLINK_INTERVAL_SECONDS = 3.6;
export const BLINK_DURATION_SECONDS = 0.16;
export const LOCOMOTION_MIN_SPEED = 0.12;
export const LOCOMOTION_MIN_SPEED_MPS = LOCOMOTION_MIN_SPEED;

const APEX_TRANSITION_VELOCITY_Y = 0.15;
const WALK_BASE_FREQ_HZ = 1.38;
const RUN_BASE_FREQ_HZ = 2.08;

const ZERO_EULER: EulerTuple = [0, 0, 0];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(t: number): number {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

function dampValue(current: number, target: number, lambda: number, dt: number): number {
  const alpha = 1 - Math.exp(-lambda * dt);
  return current + (target - current) * alpha;
}

function hermite1D(p0: number, v0: number, p1: number, v1: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * p0 + h10 * v0 + h01 * p1 + h11 * v1;
}

function createZeroPose(): HumanoidPose {
  return {
    bones: {
      hips: ZERO_EULER,
      spine: ZERO_EULER,
      chest: ZERO_EULER,
      upperChest: ZERO_EULER,
      neck: ZERO_EULER,
      head: ZERO_EULER,
      leftShoulder: ZERO_EULER,
      leftUpperArm: ZERO_EULER,
      leftLowerArm: ZERO_EULER,
      leftHand: ZERO_EULER,
      rightShoulder: ZERO_EULER,
      rightUpperArm: ZERO_EULER,
      rightLowerArm: ZERO_EULER,
      rightHand: ZERO_EULER,
      leftUpperLeg: ZERO_EULER,
      leftLowerLeg: ZERO_EULER,
      leftFoot: ZERO_EULER,
      rightUpperLeg: ZERO_EULER,
      rightLowerLeg: ZERO_EULER,
      rightFoot: ZERO_EULER
    },
    hipsOffsetY: 0
  };
}

function subtractPose(a: HumanoidPose, b: HumanoidPose): HumanoidPose {
  const bones = {} as Record<HumanoidBoneKey, EulerTuple>;
  for (const key of HUMANOID_BONE_KEYS) {
    const ba = a.bones[key];
    const bb = b.bones[key];
    bones[key] = [ba[0] - bb[0], ba[1] - bb[1], ba[2] - bb[2]];
  }
  return {
    bones,
    hipsOffsetY: a.hipsOffsetY - b.hipsOffsetY
  };
}

function createNeutralBoneMap(): Record<HumanoidBoneKey, EulerTuple> {
  return {
    hips: ZERO_EULER,
    spine: ZERO_EULER,
    chest: ZERO_EULER,
    upperChest: ZERO_EULER,
    neck: ZERO_EULER,
    head: ZERO_EULER,
    // Natural A-pose arms brought down from VRM T-pose so character never stands in a stiff T-pose
    leftShoulder: [0, 0, -0.05],
    leftUpperArm: [0.04, 0, -1.16],
    leftLowerArm: [0, -0.18, 0],
    leftHand: [0, 0, -0.06],
    rightShoulder: [0, 0, 0.05],
    rightUpperArm: [0.04, 0, 1.16],
    rightLowerArm: [0, 0.18, 0],
    rightHand: [0, 0, 0.06],
    leftUpperLeg: ZERO_EULER,
    leftLowerLeg: ZERO_EULER,
    leftFoot: ZERO_EULER,
    rightUpperLeg: ZERO_EULER,
    rightLowerLeg: ZERO_EULER,
    rightFoot: ZERO_EULER
  };
}

function sanitizeSpeed(speed: number): number {
  return Number.isFinite(speed) ? Math.max(0, speed) : 0;
}

function resolveWalkSpeed(candidate?: number): number {
  return candidate !== undefined && Number.isFinite(candidate) && candidate > 0.05
    ? candidate
    : DEFAULT_PLAYER_MOVEMENT_CONFIG.walkSpeed;
}

function resolveRunSpeed(candidate: number | undefined, walkSpeed: number): number {
  return candidate !== undefined && Number.isFinite(candidate) && candidate > walkSpeed
    ? candidate
    : Math.max(walkSpeed + 0.4, DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed);
}

function resolveJumpSpeed(candidate?: number): number {
  return candidate !== undefined && Number.isFinite(candidate) && candidate > 0.5
    ? candidate
    : DEFAULT_PLAYER_MOVEMENT_CONFIG.jumpSpeed;
}

function buildPoseContextFromMachine(state: AnimationMachineState): AnimationPoseContext {
  const landProgress = clamp01(1 - state.landTimer / LAND_RECOVERY_DURATION_SECONDS);
  return {
    ambientTime: state.ambientTime,
    groundSpeed: state.groundSpeed,
    velocityY: state.velocityY,
    walkSpeed: state.walkSpeed,
    runSpeed: state.runSpeed,
    jumpSpeed: state.jumpSpeed,
    landProgress,
    impactScale: state.impactScale,
    isMovingDuringLand: state.isMovingOnGround,
    isRunningDuringLand: state.isRunningOnGround
  };
}

/**
 * Asymmetric stance/swing leg solver calibrated to cozy VRM 1.0 leg proportions (~0.75 world units):
 * - `g = 0`: Heel strike (front contact, thigh pitched forward `-frontHip`).
 * - `g in [0, stanceFraction]`: Stance phase — thigh sweeps linearly backward to `+backHip` at
 *   constant angular velocity while knee absorbs impact lightly and keeps sole grounded.
 * - `g in [stanceFraction, 1)`: Swing phase — knee flexes cleanly (`> 0`) to clear the ground while
 *   cubic Hermite swing brings the thigh smoothly forward with late-swing retraction before strike.
 */
function evaluateAsymmetricLegGait(
  gRaw: number,
  isRun: boolean,
  strideScale: number
): {
  hipPitch: number;
  kneeBend: number;
  footPitch: number;
} {
  const g = ((gRaw % 1) + 1) % 1;
  const stanceFraction = isRun ? 0.45 : 0.54;
  const frontHip = -(isRun ? 0.74 : 0.48) * strideScale;
  const backHip = (isRun ? 0.66 : 0.44) * strideScale;
  const span = backHip - frontHip;

  if (g <= stanceFraction) {
    const s = g / stanceFraction;
    const hipPitch = frontHip + span * s;

    // Soft grounded stance knee with gentle heel-strike cushion and pre-swing bend
    const loadingBump =
      Math.sin(Math.min(1, s / 0.3) * Math.PI) * (isRun ? 0.14 : 0.065) * strideScale;
    const preSwingBend =
      smoothstep01((s - 0.78) / 0.22) * (isRun ? 0.38 : 0.24) * strideScale;
    const kneeBend = Math.max(0.04, 0.04 + loadingBump + preSwingBend);

    // Heel-first strike -> flat sole contact through mid-stance -> plantarflexion toe push-off
    const heelStrikeLift = (1 - smoothstep01(s / 0.18)) * -0.12 * strideScale;
    const flatContact = -(hipPitch + kneeBend) * 0.82 * (1 - smoothstep01((s - 0.78) / 0.22));
    const pushOff = smoothstep01((s - 0.7) / 0.3) * (isRun ? 0.32 : 0.2) * strideScale;
    const footPitch = heelStrikeLift + flatContact + pushOff;

    return { hipPitch, kneeBend, footPitch };
  }

  const w = (g - stanceFraction) / (1 - stanceFraction);
  const boundaryTangent = 0.28 * span;
  const hipPitch = hermite1D(backHip, boundaryTangent, frontHip, boundaryTangent, w);

  const startKnee = 0.04 + (isRun ? 0.38 : 0.24) * strideScale;
  const endKnee = 0.04;
  const swingArch = Math.sin(w * Math.PI) * (isRun ? 1.04 : 0.72) * strideScale;
  const kneeBend = Math.max(
    0.04,
    startKnee * (1 - smoothstep01(w)) + endKnee * smoothstep01(w) + swingArch
  );

  // Dorsiflex toes during mid-to-late swing so foot clears ground cleanly before heel strike
  const toeOffTrail = (1 - smoothstep01(w / 0.22)) * (isRun ? 0.32 : 0.2) * strideScale;
  const swingClearance = -Math.sin(w * Math.PI) * (isRun ? 0.22 : 0.16) * strideScale;
  const prepareStrike = smoothstep01((w - 0.8) / 0.2) * (-0.12 - frontHip * 0.82) * strideScale;
  const footPitch = toeOffTrail + swingClearance + prepareStrike;

  return { hipPitch, kneeBend, footPitch };
}

/** Creates the initial animation state machine in grounded Idle state. */
export function createInitialAnimationMachineState(): AnimationMachineState {
  return {
    currentState: "idle",
    previousState: "idle",
    stateTime: 0,
    previousStateTime: 0,
    ambientTime: 0,
    cyclePhase: 0,
    blendProgress: 1,
    blendDuration: DEFAULT_BLEND_DURATION_SECONDS,
    blendOffset: createZeroPose(),
    blendOffsetReduced: createZeroPose(),
    groundSpeed: 0,
    velocityY: 0,
    walkSpeed: DEFAULT_PLAYER_MOVEMENT_CONFIG.walkSpeed,
    runSpeed: DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed,
    jumpSpeed: DEFAULT_PLAYER_MOVEMENT_CONFIG.jumpSpeed,
    peakFallSpeed: 0,
    impactScale: 1,
    isMovingOnGround: false,
    isRunningOnGround: false,
    landTimer: 0,
    interactTimer: 0,
    blinkTimer: 0.9,
    wasGrounded: true,
    isDialogueOpen: false,
    expressions: {
      blink: 0,
      happy: 0,
      relaxed: 0.18,
      surprised: 0,
      aa: 0
    }
  };
}

/** Resolves which animation state should be active given current timers and post-collision speed. */
export function resolveTargetAnimationState(
  state: Pick<AnimationMachineState, "landTimer" | "interactTimer">,
  input: AnimationMachineInput
): CharacterAnimationStateId {
  if (!input.isGrounded) {
    return input.velocityY > APEX_TRANSITION_VELOCITY_Y ? "jump" : "fall";
  }

  if (state.landTimer > 0) {
    return "land";
  }

  const walkSpeed = resolveWalkSpeed(input.walkSpeed);
  const runSpeed = resolveRunSpeed(input.runSpeed, walkSpeed);
  const runMinActualSpeed = walkSpeed + (runSpeed - walkSpeed) * 0.32;
  const safeSpeed = sanitizeSpeed(input.speed);
  const effectivelyMoving = input.isMoving && safeSpeed >= LOCOMOTION_MIN_SPEED;

  if (state.interactTimer > 0 && !effectivelyMoving) {
    return "interact";
  }

  if (effectivelyMoving) {
    return input.isRunning && safeSpeed >= runMinActualSpeed ? "run" : "walk";
  }

  return "idle";
}

/**
 * Advances the Character Animation State Machine by `dtSeconds`.
 * Captures inertialized pose offsets whenever a transition interrupts an active blend
 * so target poses remain C0/C1 continuous across all frame rates and dt=0 boundaries.
 */
export function stepAnimationStateMachine(
  state: AnimationMachineState,
  input: AnimationMachineInput,
  dtSeconds: number
): AnimationMachineState {
  const dt = Number.isFinite(dtSeconds) ? Math.min(Math.max(dtSeconds, 0), 0.1) : 0;
  const walkSpeed = resolveWalkSpeed(input.walkSpeed);
  const runSpeed = resolveRunSpeed(input.runSpeed, walkSpeed);
  const jumpSpeed = resolveJumpSpeed(input.jumpSpeed);
  const runMinActualSpeed = walkSpeed + (runSpeed - walkSpeed) * 0.32;
  const safeSpeed = sanitizeSpeed(input.speed);
  const effectivelyMoving = input.isMoving && safeSpeed >= LOCOMOTION_MIN_SPEED;
  const effectivelyRunning =
    effectivelyMoving && input.isRunning && safeSpeed >= runMinActualSpeed;

  let nextLandTimer = state.landTimer;
  let nextInteractTimer = state.interactTimer;
  let nextPeakFallSpeed = state.peakFallSpeed;
  let nextImpactScale = state.impactScale;

  if (!input.isGrounded) {
    nextPeakFallSpeed = Math.max(state.peakFallSpeed, Math.max(0, -input.velocityY));
    nextLandTimer = 0;
    nextInteractTimer = 0;
  } else {
    if (!state.wasGrounded) {
      nextLandTimer = LAND_RECOVERY_DURATION_SECONDS;
      nextImpactScale = Math.max(0.45, Math.min(1.12, (nextPeakFallSpeed || 5.2) / 7.2));
      nextPeakFallSpeed = 0;
    } else if (nextLandTimer > 0) {
      const landDecayRate = effectivelyMoving ? 1.35 : 1.0;
      nextLandTimer = Math.max(0, nextLandTimer - dt * landDecayRate);
    }
  }

  const nextDialogueOpen = Boolean(input.isDialogueOpen);
  if (state.isDialogueOpen && !nextDialogueOpen) {
    nextInteractTimer = 0;
  }

  if (input.isGrounded) {
    if (input.interactRequested) {
      nextInteractTimer = INTERACT_WAVE_DURATION_SECONDS;
    } else if (nextInteractTimer > 0) {
      if (effectivelyMoving) {
        nextInteractTimer = 0;
      } else {
        nextInteractTimer = Math.max(0, nextInteractTimer - dt);
      }
    }
  }

  const nextState = resolveTargetAnimationState(
    { landTimer: nextLandTimer, interactTimer: nextInteractTimer },
    input
  );
  const retriggeredWave =
    Boolean(input.interactRequested) &&
    state.currentState === "interact" &&
    nextState === "interact";

  if (nextState !== state.currentState || retriggeredWave) {
    // Snapshot exact currently rendered blended poses BEFORE mutating state fields
    const poseBefore = evaluateBlendedPose(state, false);
    const poseBeforeReduced = evaluateBlendedPose(state, true);

    state.wasGrounded = input.isGrounded;
    state.isDialogueOpen = nextDialogueOpen;
    state.landTimer = nextLandTimer;
    state.interactTimer = nextInteractTimer;
    state.peakFallSpeed = nextPeakFallSpeed;
    state.impactScale = nextImpactScale;
    state.groundSpeed = safeSpeed;
    state.velocityY = Number.isFinite(input.velocityY) ? input.velocityY : 0;
    state.walkSpeed = walkSpeed;
    state.runSpeed = runSpeed;
    state.jumpSpeed = jumpSpeed;
    state.isMovingOnGround = effectivelyMoving;
    state.isRunningOnGround = effectivelyRunning;

    state.previousState = state.currentState;
    state.previousStateTime = state.stateTime;
    state.currentState = nextState;
    state.stateTime = 0;
    state.blendDuration =
      nextState === "jump"
        ? 0.065
        : nextState === "land" || nextState === "fall"
          ? 0.1
          : DEFAULT_BLEND_DURATION_SECONDS;

    const targetStartContext = buildPoseContextFromMachine(state);
    const targetAtStart = evaluateStatePose(
      nextState,
      state.cyclePhase,
      0,
      false,
      targetStartContext
    );
    const targetAtStartReduced = evaluateStatePose(
      nextState,
      state.cyclePhase,
      0,
      true,
      targetStartContext
    );

    state.blendOffset = subtractPose(poseBefore, targetAtStart);
    state.blendOffsetReduced = subtractPose(poseBeforeReduced, targetAtStartReduced);
    state.blendProgress = Math.min(1, dt / Math.max(0.04, state.blendDuration));
    state.stateTime = dt;
    state.ambientTime += dt;
  } else {
    state.wasGrounded = input.isGrounded;
    state.isDialogueOpen = nextDialogueOpen;
    state.landTimer = nextLandTimer;
    state.interactTimer = nextInteractTimer;
    state.peakFallSpeed = nextPeakFallSpeed;
    state.impactScale = nextImpactScale;
    state.groundSpeed = safeSpeed;
    state.velocityY = Number.isFinite(input.velocityY) ? input.velocityY : 0;
    state.walkSpeed = walkSpeed;
    state.runSpeed = runSpeed;
    state.jumpSpeed = jumpSpeed;
    state.isMovingOnGround = effectivelyMoving;
    state.isRunningOnGround = effectivelyRunning;

    state.stateTime += dt;
    state.previousStateTime += dt;
    state.ambientTime += dt;
    if (state.blendProgress < 1) {
      state.blendProgress = Math.min(
        1,
        state.blendProgress + dt / Math.max(0.04, state.blendDuration)
      );
    }
  }

  // Advance locomotion stride phase strictly from actual ground displacement speed (zero minimum floor)
  if (
    state.currentState === "walk" ||
    state.currentState === "run" ||
    (state.currentState === "land" && effectivelyMoving)
  ) {
    const isRunCadence =
      state.currentState === "run" ||
      (state.currentState === "land" && effectivelyRunning);
    const baseSpeed = isRunCadence ? runSpeed : walkSpeed;
    const baseFreqHz = isRunCadence ? RUN_BASE_FREQ_HZ : WALK_BASE_FREQ_HZ;
    const speedRatio = Math.min(1.45, safeSpeed / baseSpeed);
    state.cyclePhase =
      (state.cyclePhase + dt * baseFreqHz * speedRatio * Math.PI * 2) % (Math.PI * 2);
  } else if (state.currentState === "idle" && state.blendProgress >= 1) {
    state.cyclePhase = 0;
  }

  // Facial expressions + natural periodic eye blinking
  state.blinkTimer = (state.blinkTimer + dt) % BLINK_INTERVAL_SECONDS;
  const blinkWindowStart = BLINK_INTERVAL_SECONDS - BLINK_DURATION_SECONDS;
  let rawBlink = 0;
  if (state.blinkTimer >= blinkWindowStart) {
    const blinkPhase = (state.blinkTimer - blinkWindowStart) / BLINK_DURATION_SECONDS;
    rawBlink = Math.sin(blinkPhase * Math.PI);
  }

  const isGreeting = state.currentState === "interact";
  const isConversing = nextDialogueOpen && !effectivelyMoving;
  const isAirborne = state.currentState === "jump" || state.currentState === "fall";

  const targetHappy = isGreeting ? 0.85 : isConversing ? 0.52 : 0;
  const targetRelaxed = !isGreeting && !isConversing && !isAirborne ? 0.18 : 0;
  const targetSurprised = isAirborne ? 0.25 : 0;
  const targetMouthAa = isGreeting
    ? 0.22 + Math.max(0, Math.sin(state.stateTime * 9.5)) * 0.25
    : 0;

  state.expressions.happy = dampValue(state.expressions.happy, targetHappy, 12, dt);
  state.expressions.relaxed = dampValue(state.expressions.relaxed, targetRelaxed, 10, dt);
  state.expressions.surprised = dampValue(state.expressions.surprised, targetSurprised, 14, dt);
  state.expressions.aa = dampValue(state.expressions.aa, targetMouthAa, 14, dt);
  // Suppress full eyelid blink while smiling (`happy`) to prevent VRM morph target double-closure
  state.expressions.blink = clamp01(rawBlink * (1 - state.expressions.happy * 0.9));

  return state;
}

/**
 * Evaluates the target VRM humanoid skeletal pose for a single animation state.
 * Sign conventions verified on `@pixiv/three-vrm` VRM 1.0 normalized bones:
 * - UpperLeg X < 0 swings thigh forward (+Z); X > 0 swings thigh backward (-Z).
 * - LowerLeg X > 0 bends knee backward (-Z); never < 0 (prevents flamingo knee hyperextension).
 * - Spine/Chest/Neck/Head X > 0 pitches torso/head forward (+Z).
 * - LeftUpperArm Z = -1.16, RightUpperArm Z = +1.16 brings arms down from T-pose into natural A-pose.
 */
export function evaluateStatePose(
  stateId: CharacterAnimationStateId,
  cyclePhase: number,
  stateTime: number,
  reducedMotion = false,
  context?: AnimationPoseContext
): HumanoidPose {
  const bones = createNeutralBoneMap();

  if (reducedMotion) {
    if (stateId === "interact") {
      bones.rightShoulder = [0, 0, -0.1];
      bones.rightUpperArm = [0.35, 0.55, 0.25];
      bones.rightLowerArm = [0, 0.65, -1.2];
      bones.rightHand = [0, 0, -0.15];
    }
    return { bones, hipsOffsetY: 0 };
  }

  const twoPi = Math.PI * 2;

  switch (stateId) {
    case "idle": {
      const idleClock = context?.ambientTime ?? stateTime;
      const breath = Math.sin(idleClock * 1.95);
      const weightShift = Math.sin(idleClock * 0.78);
      const microLook = Math.sin(idleClock * 0.52 + 0.6);

      // Gentle lateral weight shift with subtle contralateral knee softness
      const leftRelaxKnee = Math.max(0, weightShift) * 0.065;
      const rightRelaxKnee = Math.max(0, -weightShift) * 0.065;

      bones.hips = [0.01, weightShift * 0.028, weightShift * 0.022];
      bones.spine = [0.018 + breath * 0.016, -weightShift * 0.018, -weightShift * 0.014];
      bones.chest = [0.015 + breath * 0.022, 0, -weightShift * 0.008];
      bones.upperChest = [breath * 0.01, 0, 0];
      bones.neck = [-0.012 + breath * 0.008, microLook * 0.028, 0];
      bones.head = [breath * 0.014, microLook * 0.035, weightShift * 0.012];

      bones.leftShoulder = [0, 0, -0.05 - breath * 0.01];
      bones.rightShoulder = [0, 0, 0.05 + breath * 0.01];
      bones.leftUpperArm = [0.04 + breath * 0.014, 0, -1.17 - Math.max(0, breath) * 0.018];
      bones.rightUpperArm = [0.04 + breath * 0.014, 0, 1.17 + Math.max(0, breath) * 0.018];
      bones.leftLowerArm = [0, -0.19 - breath * 0.018, 0];
      bones.rightLowerArm = [0, 0.19 + breath * 0.018, 0];

      bones.leftUpperLeg = [-leftRelaxKnee * 0.5, 0, -weightShift * 0.018];
      bones.leftLowerLeg = [leftRelaxKnee, 0, 0];
      bones.leftFoot = [-leftRelaxKnee * 0.45, 0, weightShift * 0.015];

      bones.rightUpperLeg = [-rightRelaxKnee * 0.5, 0, -weightShift * 0.018];
      bones.rightLowerLeg = [rightRelaxKnee, 0, 0];
      bones.rightFoot = [-rightRelaxKnee * 0.45, 0, weightShift * 0.015];

      return {
        bones,
        hipsOffsetY: breath * 0.006 - Math.abs(weightShift) * 0.004
      };
    }

    case "walk": {
      const walkBaseSpeed = resolveWalkSpeed(context?.walkSpeed);
      const speed =
        context?.groundSpeed !== undefined
          ? sanitizeSpeed(context.groundSpeed)
          : walkBaseSpeed;
      const strideScale =
        speed <= 0
          ? 0
          : Math.max(0.28, Math.min(1.06, speed / (walkBaseSpeed * 0.88)));

      // At cyclePhase = PI/2, gLeft = 0 (Left heel strike forward) and gRight = 0.5 (Right toe-off back)
      const gLeft = (((cyclePhase / twoPi) - 0.25) % 1 + 1) % 1;
      const gRight = (gLeft + 0.5) % 1;
      const leftLeg = evaluateAsymmetricLegGait(gLeft, false, strideScale);
      const rightLeg = evaluateAsymmetricLegGait(gRight, false, strideScale);

      const s = Math.sin(cyclePhase);
      const c = Math.cos(cyclePhase);
      // Slight phase lag on upper torso & arms so hips lead and shoulders follow naturally
      const upperLagSin = Math.sin(cyclePhase - 0.22);
      const armLagSin = Math.sin(cyclePhase - 0.14);

      bones.hips = [
        0.024 * strideScale,
        -s * 0.068 * strideScale,
        c * 0.026 * strideScale
      ];
      bones.spine = [
        0.034 * strideScale,
        upperLagSin * 0.042 * strideScale,
        -c * 0.018 * strideScale
      ];
      bones.chest = [
        0.026 * strideScale,
        upperLagSin * 0.048 * strideScale,
        -c * 0.01 * strideScale
      ];
      bones.upperChest = [0.012 * strideScale, upperLagSin * 0.02 * strideScale, 0];
      bones.neck = [-0.02 * strideScale, -upperLagSin * 0.032 * strideScale, 0];
      bones.head = [-0.016 * strideScale, -upperLagSin * 0.035 * strideScale, c * 0.008 * strideScale];

      // Relaxed cozy contralateral arm swing
      bones.leftShoulder = [armLagSin * 0.024 * strideScale, 0, -0.055];
      bones.rightShoulder = [-armLagSin * 0.024 * strideScale, 0, 0.055];
      bones.leftUpperArm = [armLagSin * 0.26 * strideScale, 0, -1.15];
      bones.rightUpperArm = [-armLagSin * 0.26 * strideScale, 0, 1.15];
      bones.leftLowerArm = [0, -0.22 - Math.max(0, -armLagSin) * 0.18 * strideScale, 0];
      bones.rightLowerArm = [0, 0.22 + Math.max(0, armLagSin) * 0.18 * strideScale, 0];

      bones.leftUpperLeg = [leftLeg.hipPitch, 0, -c * 0.014 * strideScale];
      bones.leftLowerLeg = [leftLeg.kneeBend, 0, 0];
      bones.leftFoot = [leftLeg.footPitch, 0, 0];

      bones.rightUpperLeg = [rightLeg.hipPitch, 0, -c * 0.014 * strideScale];
      bones.rightLowerLeg = [rightLeg.kneeBend, 0, 0];
      bones.rightFoot = [rightLeg.footPitch, 0, 0];

      // Gentle double-frequency vertical oscillation matching cozy stroll
      const verticalWave = 0.5 * (1 + Math.cos(cyclePhase * 2));
      return {
        bones,
        hipsOffsetY: (-0.034 + 0.028 * verticalWave) * strideScale
      };
    }

    case "run": {
      const walkBaseSpeed = resolveWalkSpeed(context?.walkSpeed);
      const runBaseSpeed = resolveRunSpeed(context?.runSpeed, walkBaseSpeed);
      const speed =
        context?.groundSpeed !== undefined
          ? sanitizeSpeed(context.groundSpeed)
          : runBaseSpeed;
      const strideScale =
        speed <= 0
          ? 0
          : Math.max(0.55, Math.min(1.08, speed / (runBaseSpeed * 0.92)));

      const gLeft = (((cyclePhase / twoPi) - 0.25) % 1 + 1) % 1;
      const gRight = (gLeft + 0.5) % 1;
      const leftLeg = evaluateAsymmetricLegGait(gLeft, true, strideScale);
      const rightLeg = evaluateAsymmetricLegGait(gRight, true, strideScale);

      const s = Math.sin(cyclePhase);
      const c = Math.cos(cyclePhase);
      const upperLagSin = Math.sin(cyclePhase - 0.24);
      const armLagSin = Math.sin(cyclePhase - 0.15);

      bones.hips = [
        0.075 * strideScale,
        -s * 0.1 * strideScale,
        c * 0.038 * strideScale
      ];
      bones.spine = [
        0.095 * strideScale,
        upperLagSin * 0.068 * strideScale,
        -c * 0.026 * strideScale
      ];
      bones.chest = [
        0.075 * strideScale,
        upperLagSin * 0.076 * strideScale,
        -c * 0.015 * strideScale
      ];
      bones.upperChest = [0.035 * strideScale, upperLagSin * 0.03 * strideScale, 0];
      bones.neck = [-0.068 * strideScale, -upperLagSin * 0.048 * strideScale, 0];
      bones.head = [-0.056 * strideScale, -upperLagSin * 0.05 * strideScale, c * 0.012 * strideScale];

      bones.leftShoulder = [armLagSin * 0.04 * strideScale, 0, -0.07];
      bones.rightShoulder = [-armLagSin * 0.04 * strideScale, 0, 0.07];
      bones.leftUpperArm = [armLagSin * 0.54 * strideScale, 0, -1.06];
      bones.rightUpperArm = [-armLagSin * 0.54 * strideScale, 0, 1.06];
      bones.leftLowerArm = [0, -0.62 - Math.max(0, -armLagSin) * 0.28 * strideScale, 0];
      bones.rightLowerArm = [0, 0.62 + Math.max(0, armLagSin) * 0.28 * strideScale, 0];

      bones.leftUpperLeg = [leftLeg.hipPitch, 0, -c * 0.018 * strideScale];
      bones.leftLowerLeg = [leftLeg.kneeBend, 0, 0];
      bones.leftFoot = [leftLeg.footPitch, 0, 0];

      bones.rightUpperLeg = [rightLeg.hipPitch, 0, -c * 0.018 * strideScale];
      bones.rightLowerLeg = [rightLeg.kneeBend, 0, 0];
      bones.rightFoot = [rightLeg.footPitch, 0, 0];

      const aerialBounce = 0.5 * (1 + Math.cos(cyclePhase * 2 - 0.42));
      return {
        bones,
        hipsOffsetY: (-0.026 + 0.046 * aerialBounce) * strideScale
      };
    }

    case "jump": {
      const walkBaseSpeed = resolveWalkSpeed(context?.walkSpeed);
      const runBaseSpeed = resolveRunSpeed(context?.runSpeed, walkBaseSpeed);
      const jumpBaseSpeed = resolveJumpSpeed(context?.jumpSpeed);
      const vy =
        context?.velocityY ?? Math.max(APEX_TRANSITION_VELOCITY_Y, jumpBaseSpeed - stateTime * 20);
      const moveRatio = clamp01(sanitizeSpeed(context?.groundSpeed ?? 0) / runBaseSpeed);
      const leadSign = Math.sin(cyclePhase) >= 0 ? 1 : -1;

      // 1. Launch push-off (vy near jumpSpeed): ankle plantarflexion + upward arm drive, zero Space delay
      const pushOff = 1 - smoothstep01((jumpBaseSpeed - vy) / 1.85);
      // 2. Ascent progression (0 at takeoff -> 1 approaching apex)
      const ascentProgress = smoothstep01(
        (jumpBaseSpeed - vy) / Math.max(1, jumpBaseSpeed - APEX_TRANSITION_VELOCITY_Y)
      );
      // 3. Soft mid-ascent lift envelope that opens gently near apex so handoff to "fall" is seamless
      const tuckEnvelope = Math.sin(ascentProgress * Math.PI * 0.78);

      const moveSpineLean = 0.115 * moveRatio;
      const moveChestLean = 0.085 * moveRatio;

      bones.hips = [
        0.02 + ascentProgress * 0.035 + moveRatio * 0.04,
        -leadSign * 0.045 * moveRatio,
        0
      ];
      bones.spine = [
        -0.045 * (1 - ascentProgress) + 0.04 * ascentProgress + moveSpineLean,
        leadSign * 0.035 * moveRatio,
        0
      ];
      bones.chest = [
        -0.04 * (1 - ascentProgress) + 0.03 * ascentProgress + moveChestLean,
        leadSign * 0.03 * moveRatio,
        0
      ];
      bones.upperChest = [-0.02 * (1 - ascentProgress) + 0.015 * moveRatio, 0, 0];
      bones.neck = [-0.025 * (1 - ascentProgress) - 0.035 * moveRatio, 0, 0];
      bones.head = [-0.045 + ascentProgress * 0.085 - 0.04 * moveRatio, 0, 0];

      // Cheerful upward & outward arm lift from sides during launch, settling into soft float at apex
      const armLiftSpread = 0.94 - 0.3 * Math.sin(ascentProgress * Math.PI * 0.62);
      const armForwardPitch = -0.22 - 0.28 * (1 - ascentProgress * 0.65);
      const armStrideSwing = 0.18 * moveRatio * leadSign;

      bones.leftShoulder = [0, 0, -0.08 - 0.04 * tuckEnvelope];
      bones.rightShoulder = [0, 0, 0.08 + 0.04 * tuckEnvelope];
      bones.leftUpperArm = [armForwardPitch - armStrideSwing, 0, -armLiftSpread];
      bones.rightUpperArm = [armForwardPitch + armStrideSwing, 0, armLiftSpread];
      bones.leftLowerArm = [0, -0.26 - 0.16 * tuckEnvelope, 0];
      bones.rightLowerArm = [0, 0.26 + 0.16 * tuckEnvelope, 0];

      // Balanced cozy hop tuck when standing; natural lead/trail stride split when jumping on the move
      const baseLeftThigh = -0.14 - 0.34 * tuckEnvelope - 0.1 * ascentProgress;
      const baseRightThigh = -0.1 - 0.25 * tuckEnvelope - 0.08 * ascentProgress;
      const strideSplit = 0.18 * moveRatio * leadSign;

      bones.leftUpperLeg = [baseLeftThigh - strideSplit, 0, -0.025];
      bones.leftLowerLeg = [
        Math.max(0.05, 0.14 + 0.52 * tuckEnvelope + 0.08 * moveRatio * Math.max(0, -leadSign)),
        0,
        0
      ];
      bones.leftFoot = [0.3 * pushOff - 0.08 * ascentProgress, 0, 0];

      bones.rightUpperLeg = [baseRightThigh + strideSplit, 0, 0.025];
      bones.rightLowerLeg = [
        Math.max(0.05, 0.12 + 0.42 * tuckEnvelope + 0.08 * moveRatio * Math.max(0, leadSign)),
        0,
        0
      ];
      bones.rightFoot = [0.3 * pushOff - 0.08 * ascentProgress, 0, 0];

      return {
        bones,
        hipsOffsetY: -0.015 * pushOff + 0.036 * tuckEnvelope
      };
    }

    case "fall": {
      const walkBaseSpeed = resolveWalkSpeed(context?.walkSpeed);
      const runBaseSpeed = resolveRunSpeed(context?.runSpeed, walkBaseSpeed);
      const moveRatio = clamp01(sanitizeSpeed(context?.groundSpeed ?? 0) / runBaseSpeed);
      const leadSign = Math.sin(cyclePhase) >= 0 ? 1 : -1;

      const fallSpeed = Math.max(
        0,
        APEX_TRANSITION_VELOCITY_Y - (context?.velocityY ?? -2.5)
      );
      const fallProgress = smoothstep01(Math.max(fallSpeed / 7.2, stateTime / 0.34));
      const airyDrift = Math.sin(stateTime * 7.5) * 0.022;

      bones.hips = [
        0.055 + fallProgress * 0.02 + moveRatio * 0.035,
        -leadSign * 0.035 * moveRatio * (1 - fallProgress * 0.4),
        0
      ];
      bones.spine = [
        0.04 + fallProgress * 0.035 + 0.1 * moveRatio,
        leadSign * 0.025 * moveRatio * (1 - fallProgress * 0.4),
        0
      ];
      bones.chest = [0.03 + fallProgress * 0.025 + 0.075 * moveRatio, 0, 0];
      bones.upperChest = [0.015 * moveRatio, 0, 0];
      bones.neck = [0.015 * fallProgress - 0.03 * moveRatio, 0, 0];
      bones.head = [0.04 + fallProgress * 0.045 - 0.03 * moveRatio, 0, 0];

      // Arms float gently outward from apex pose to balance descent before landing
      const armSpread = 0.68 - 0.1 * fallProgress + airyDrift;
      const armPitch = -0.32 + 0.16 * fallProgress;
      const armStride = 0.12 * moveRatio * leadSign * (1 - fallProgress * 0.5);

      bones.leftShoulder = [0, 0, -0.1 + 0.03 * fallProgress];
      bones.rightShoulder = [0, 0, 0.1 - 0.03 * fallProgress];
      bones.leftUpperArm = [armPitch - armStride, 0, -armSpread];
      bones.rightUpperArm = [armPitch + armStride, 0, armSpread];
      bones.leftLowerArm = [0, -0.36 + 0.08 * fallProgress, 0];
      bones.rightLowerArm = [0, 0.36 - 0.08 * fallProgress, 0];

      // Legs progressively extend downward from apex float to anticipate & cushion ground contact
      const strideSplit = 0.14 * moveRatio * leadSign * (1 - fallProgress * 0.45);
      bones.leftUpperLeg = [-0.42 + 0.24 * fallProgress - strideSplit, 0, -0.028];
      bones.leftLowerLeg = [Math.max(0.05, 0.46 - 0.24 * fallProgress), 0, 0];
      bones.leftFoot = [-0.08 + 0.24 * fallProgress, 0, 0];

      bones.rightUpperLeg = [-0.32 + 0.18 * fallProgress + strideSplit, 0, 0.028];
      bones.rightLowerLeg = [Math.max(0.05, 0.38 - 0.18 * fallProgress), 0, 0];
      bones.rightFoot = [-0.08 + 0.24 * fallProgress, 0, 0];

      return {
        bones,
        hipsOffsetY: 0.022 * (1 - fallProgress)
      };
    }

    case "land": {
      // C1-smooth absorption curve synced 1:1 to landTimer so recovery finishes cleanly at 0 when timer ends
      const p =
        context?.landProgress ?? clamp01(stateTime / LAND_RECOVERY_DURATION_SECONDS);
      const rawCurve =
        p < 0.34 ? smoothstep01(p / 0.34) : 1 - smoothstep01((p - 0.34) / 0.66);
      const impact = context?.impactScale ?? 1.0;

      if (context?.isMovingDuringLand) {
        // Layer landing knee/hip absorption onto the live walk/run stride so movement never freezes or snaps
        const baseLocoPose = evaluateStatePose(
          context.isRunningDuringLand ? "run" : "walk",
          cyclePhase,
          stateTime,
          false,
          context
        );
        const crouch = rawCurve * impact * 0.62;
        const layeredBones = {} as Record<HumanoidBoneKey, EulerTuple>;
        for (const key of HUMANOID_BONE_KEYS) {
          layeredBones[key] = [...baseLocoPose.bones[key]] as EulerTuple;
        }

        layeredBones.hips = [
          baseLocoPose.bones.hips[0] + 0.09 * crouch,
          baseLocoPose.bones.hips[1],
          baseLocoPose.bones.hips[2]
        ];
        layeredBones.spine = [
          baseLocoPose.bones.spine[0] + 0.085 * crouch,
          baseLocoPose.bones.spine[1],
          baseLocoPose.bones.spine[2]
        ];
        layeredBones.chest = [
          baseLocoPose.bones.chest[0] + 0.065 * crouch,
          baseLocoPose.bones.chest[1],
          baseLocoPose.bones.chest[2]
        ];
        layeredBones.head = [
          baseLocoPose.bones.head[0] - 0.055 * crouch,
          baseLocoPose.bones.head[1],
          baseLocoPose.bones.head[2]
        ];
        layeredBones.leftUpperLeg = [
          baseLocoPose.bones.leftUpperLeg[0] - 0.24 * crouch,
          baseLocoPose.bones.leftUpperLeg[1],
          baseLocoPose.bones.leftUpperLeg[2]
        ];
        layeredBones.leftLowerLeg = [
          Math.max(0.04, baseLocoPose.bones.leftLowerLeg[0] + 0.42 * crouch),
          0,
          0
        ];
        layeredBones.leftFoot = [
          baseLocoPose.bones.leftFoot[0] - 0.16 * crouch,
          0,
          0
        ];
        layeredBones.rightUpperLeg = [
          baseLocoPose.bones.rightUpperLeg[0] - 0.24 * crouch,
          baseLocoPose.bones.rightUpperLeg[1],
          baseLocoPose.bones.rightUpperLeg[2]
        ];
        layeredBones.rightLowerLeg = [
          Math.max(0.04, baseLocoPose.bones.rightLowerLeg[0] + 0.42 * crouch),
          0,
          0
        ];
        layeredBones.rightFoot = [
          baseLocoPose.bones.rightFoot[0] - 0.16 * crouch,
          0,
          0
        ];

        return {
          bones: layeredBones,
          hipsOffsetY: baseLocoPose.hipsOffsetY - 0.058 * crouch
        };
      }

      const crouch = rawCurve * impact;

      bones.hips = [0.13 * crouch, 0, 0];
      bones.spine = [0.115 * crouch, 0, 0];
      bones.chest = [0.085 * crouch, 0, 0];
      bones.neck = [-0.03 * crouch, 0, 0];
      bones.head = [-0.065 * crouch, 0, 0];

      // Arms follow through downward/outward softly to cushion touchdown, returning to A-pose at p=1
      bones.leftShoulder = [0, 0, -0.05 - 0.03 * crouch];
      bones.rightShoulder = [0, 0, 0.05 + 0.03 * crouch];
      bones.leftUpperArm = [0.04 + 0.16 * crouch, 0, -1.16 + 0.2 * crouch];
      bones.rightUpperArm = [0.04 + 0.16 * crouch, 0, 1.16 - 0.2 * crouch];
      bones.leftLowerArm = [0, -0.18 - 0.18 * crouch, 0];
      bones.rightLowerArm = [0, 0.18 + 0.18 * crouch, 0];

      bones.leftUpperLeg = [-0.38 * crouch, 0, -0.015 * crouch];
      bones.leftLowerLeg = [Math.max(0.03 * crouch, 0.66 * crouch), 0, 0];
      bones.leftFoot = [-0.24 * crouch, 0, 0];

      bones.rightUpperLeg = [-0.36 * crouch, 0, 0.015 * crouch];
      bones.rightLowerLeg = [Math.max(0.03 * crouch, 0.64 * crouch), 0, 0];
      bones.rightFoot = [-0.23 * crouch, 0, 0];

      return {
        bones,
        hipsOffsetY: -0.088 * crouch
      };
    }

    case "interact": {
      // Smooth envelope at start/end of greeting wave so raising and lowering the arm feels organic
      const envIn = smoothstep01(stateTime / 0.16);
      const envOut = smoothstep01((INTERACT_WAVE_DURATION_SECONDS - stateTime) / 0.24);
      const waveEnv = Math.min(envIn, envOut);
      const waveOsc = Math.sin(stateTime * 11.2) * waveEnv;
      const nod = Math.sin(Math.min(stateTime * 4.5, Math.PI));

      bones.hips = [0, -0.05 * waveEnv, 0.02 * waveEnv];
      bones.spine = [0.06 * nod, 0.06 * waveEnv, -0.025 * waveEnv];
      bones.chest = [0.05 * nod, 0.06 * waveEnv, -0.025 * waveEnv];
      bones.neck = [0.055 * nod, 0.04 * waveEnv, 0];
      bones.head = [0.075 * nod, 0.05 * waveEnv, 0.055 * waveEnv];

      // Left arm rests warmly near hip
      bones.leftUpperArm = [0.06, 0, -1.16];
      bones.leftLowerArm = [0, -0.24, 0];

      // Right arm raises smoothly to wave and lowers cleanly as waveEnv -> 0
      bones.rightShoulder = [0, 0, 0.05 + (-0.17 - 0.05) * waveEnv];
      bones.rightUpperArm = [
        0.04 + (0.35 - 0.04) * waveEnv,
        0.55 * waveEnv,
        1.16 + (0.25 - 1.16) * waveEnv
      ];
      bones.rightLowerArm = [
        0,
        0.18 + (0.65 - 0.18) * waveEnv,
        (-1.22 + waveOsc * 0.28) * waveEnv
      ];
      bones.rightHand = [0, 0.08 * waveEnv, 0.06 + (waveOsc * 0.24 - 0.06) * waveEnv];

      return {
        bones,
        hipsOffsetY: Math.sin(stateTime * 4.2) * 0.01 * waveEnv
      };
    }
  }
}

/**
 * Evaluates the inertialized humanoid pose using decaying pose-offset blending
 * so interrupted transitions remain continuous to floating-point precision.
 */
export function evaluateBlendedPose(
  machine: AnimationMachineState,
  reducedMotion = false
): HumanoidPose {
  const context = buildPoseContextFromMachine(machine);
  const currentPose = evaluateStatePose(
    machine.currentState,
    machine.cyclePhase,
    machine.stateTime,
    reducedMotion,
    context
  );

  if (machine.blendProgress >= 1) {
    return currentPose;
  }

  const offset = reducedMotion ? machine.blendOffsetReduced : machine.blendOffset;
  const decay = 1 - smoothstep01(machine.blendProgress);
  const blendedBones = {} as Record<HumanoidBoneKey, EulerTuple>;

  for (const key of HUMANOID_BONE_KEYS) {
    const curr = currentPose.bones[key];
    const delta = offset.bones[key];
    const rx = curr[0] + delta[0] * decay;
    const ry = curr[1] + delta[1] * decay;
    const rz = curr[2] + delta[2] * decay;
    blendedBones[key] =
      key === "leftLowerLeg" || key === "rightLowerLeg"
        ? [Math.max(0, rx), ry, rz]
        : [rx, ry, rz];
  }

  return {
    bones: blendedBones,
    hipsOffsetY: currentPose.hipsOffsetY + offset.hipsOffsetY * decay
  };
}
