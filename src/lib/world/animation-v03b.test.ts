import fs from "node:fs";
import path from "node:path";

import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import { Group, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createInitialAnimationMachineState,
  evaluateBlendedPose,
  HUMANOID_BONE_KEYS,
  LAND_RECOVERY_DURATION_SECONDS,
  stepAnimationStateMachine,
  type HumanoidPose
} from "@/lib/world/animation-state-machine";
import { resolveCharacterAssetEntry } from "@/lib/world/character-assets";
import {
  DEFAULT_PLAYER_MOVEMENT_CONFIG,
  PUBLIC_PLAZA_MAP_CONFIG
} from "@/lib/world/map-config";
import {
  computeAnimationGroundSpeed,
  createInitialPlayerState,
  stepPlayerKinematics
} from "@/lib/world/physics";
import type { Aabb2D, MovementInput } from "@/lib/world/types";
import {
  applyPoseToVrm,
  disposeCharacterVrm,
  prepareLoadedVrm,
  resetCharacterVrmSprings,
  sampleVrmBoneWorldPositions,
  type LoadedVrmCharacterRig
} from "@/lib/world/vrm-loader";

const IDLE_MOVE_INPUT: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false
};

function maxPoseBoneDeltaRad(a: HumanoidPose, b: HumanoidPose): {
  maxRad: number;
  bone: string;
  axis: number;
  hipsDelta: number;
} {
  let maxRad = 0;
  let worstBone = "hips";
  let worstAxis = 0;

  for (const key of HUMANOID_BONE_KEYS) {
    for (let axis = 0; axis < 3; axis += 1) {
      const diff = Math.abs(a.bones[key][axis] - b.bones[key][axis]);
      if (diff > maxRad) {
        maxRad = diff;
        worstBone = key;
        worstAxis = axis;
      }
    }
  }

  return {
    maxRad,
    bone: worstBone,
    axis: worstAxis,
    hipsDelta: Math.abs(a.hipsOffsetY - b.hipsOffsetY)
  };
}

describe("Reading Quest V0.3-B — Animation Continuity, Ground-Speed Sync & Gait Polish", () => {
  let loadedRig: LoadedVrmCharacterRig;

  beforeAll(async () => {
    const globalAny = globalThis as unknown as {
      self?: unknown;
      createImageBitmap?: () => Promise<{ width: number; height: number; close: () => void }>;
    };
    if (!globalAny.self) {
      globalAny.self = globalThis;
    }
    if (typeof globalAny.createImageBitmap !== "function") {
      globalAny.createImageBitmap = async () => ({
        width: 1,
        height: 1,
        close() { }
      });
    }

    const entry = resolveCharacterAssetEntry();
    const vrmDiskPath = path.join(process.cwd(), "public", entry.url);
    const buffer = fs.readFileSync(vrmDiskPath);
    const realmArrayBuffer = new Uint8Array(buffer).buffer;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await new Promise<{ userData: { vrm?: VRM } }>((resolve, reject) => {
      loader.parse(
        realmArrayBuffer,
        "",
        (parsed) => resolve(parsed as unknown as { userData: { vrm?: VRM } }),
        (err) => reject(err)
      );
    });

    const outcome = prepareLoadedVrm(gltf.userData.vrm!, 30);
    if (!outcome.ok) {
      throw new Error(outcome.reason);
    }
    loadedRig = outcome.rig;
  });

  afterAll(() => {
    disposeCharacterVrm(loadedRig?.vrm);
  });

  it("P1-A: eliminates mid-blend pose discontinuity on Sol's exact reproducer (40f walk -> 4f run -> idle at dt=0)", () => {
    const machine = createInitialAnimationMachineState();
    const dt = 1 / 60;

    // 1. Walk 40 frames at 60 Hz
    for (let i = 0; i < 40; i += 1) {
      stepAnimationStateMachine(
        machine,
        { isGrounded: true, isMoving: true, isRunning: false, speed: 5.8, velocityY: 0 },
        dt
      );
    }
    expect(machine.currentState).toBe("walk");

    // 2. Switch to Run for 4 frames at 60 Hz (mid-blend!)
    for (let i = 0; i < 4; i += 1) {
      stepAnimationStateMachine(
        machine,
        { isGrounded: true, isMoving: true, isRunning: true, speed: 9.8, velocityY: 0 },
        dt
      );
    }
    expect(machine.currentState).toBe("run");
    expect(machine.blendProgress).toBeGreaterThan(0);
    expect(machine.blendProgress).toBeLessThan(1);

    const poseBeforeIdle = evaluateBlendedPose(machine);

    // 3. Switch to Idle with dt = 0 — pose MUST remain continuous within floating-point epsilon
    stepAnimationStateMachine(
      machine,
      { isGrounded: true, isMoving: false, isRunning: false, speed: 0, velocityY: 0 },
      0
    );
    expect(machine.currentState).toBe("idle");

    const poseAfterIdle = evaluateBlendedPose(machine);
    const diff = maxPoseBoneDeltaRad(poseBeforeIdle, poseAfterIdle);
    expect(diff.maxRad).toBeLessThan(1e-6);
    expect(diff.hipsDelta).toBeLessThan(1e-6);
  });

  it("P1-A: preserves pose continuity across interrupted jump/fall, interrupted interact wave, walk<->run phase, and 30/60/120 Hz", () => {
    for (const hz of [30, 60, 120]) {
      const dt = 1 / hz;
      const machine = createInitialAnimationMachineState();

      // Idle -> Interact (wave) for 3 frames -> interrupted by Walk -> 3 frames -> Run -> 2 frames -> Jump -> Fall
      for (let i = 0; i < 3; i += 1) {
        stepAnimationStateMachine(
          machine,
          {
            isGrounded: true,
            isMoving: false,
            isRunning: false,
            speed: 0,
            velocityY: 0,
            interactRequested: i === 0,
            isDialogueOpen: true
          },
          dt
        );
      }
      expect(machine.currentState).toBe("interact");

      const beforeWalkFromWave = evaluateBlendedPose(machine);
      stepAnimationStateMachine(
        machine,
        {
          isGrounded: true,
          isMoving: true,
          isRunning: false,
          speed: 5.8,
          velocityY: 0,
          isDialogueOpen: false
        },
        0
      );
      expect(machine.currentState).toBe("walk");
      expect(maxPoseBoneDeltaRad(beforeWalkFromWave, evaluateBlendedPose(machine)).maxRad).toBeLessThan(
        1e-6
      );

      // Step 3 frames in Walk, record stride phase, switch to Run
      for (let i = 0; i < 3; i += 1) {
        stepAnimationStateMachine(
          machine,
          { isGrounded: true, isMoving: true, isRunning: false, speed: 5.8, velocityY: 0 },
          dt
        );
      }
      const walkPhase = machine.cyclePhase;
      const beforeRun = evaluateBlendedPose(machine);

      // Zero-dt boundary Walk -> Run
      stepAnimationStateMachine(
        machine,
        { isGrounded: true, isMoving: true, isRunning: true, speed: 9.8, velocityY: 0 },
        0
      );
      expect(machine.currentState).toBe("run");
      expect(machine.cyclePhase).toBeCloseTo(walkPhase, 6);
      expect(maxPoseBoneDeltaRad(beforeRun, evaluateBlendedPose(machine)).maxRad).toBeLessThan(1e-6);

      // Advance 2 frames in Run, then interrupt mid-blend with Jump -> 2 frames -> Fall
      for (let i = 0; i < 2; i += 1) {
        stepAnimationStateMachine(
          machine,
          { isGrounded: true, isMoving: true, isRunning: true, speed: 9.8, velocityY: 0 },
          dt
        );
      }
      expect(machine.cyclePhase).toBeGreaterThan(walkPhase);

      const beforeJump = evaluateBlendedPose(machine);
      stepAnimationStateMachine(
        machine,
        { isGrounded: false, isMoving: true, isRunning: true, speed: 9.8, velocityY: 7.2 },
        0
      );
      expect(machine.currentState).toBe("jump");
      expect(maxPoseBoneDeltaRad(beforeJump, evaluateBlendedPose(machine)).maxRad).toBeLessThan(1e-6);

      stepAnimationStateMachine(
        machine,
        { isGrounded: false, isMoving: true, isRunning: true, speed: 9.8, velocityY: 5.0 },
        dt
      );
      const beforeFall = evaluateBlendedPose(machine);
      stepAnimationStateMachine(
        machine,
        { isGrounded: false, isMoving: true, isRunning: true, speed: 9.8, velocityY: -1.5 },
        0
      );
      expect(machine.currentState).toBe("fall");
      expect(maxPoseBoneDeltaRad(beforeFall, evaluateBlendedPose(machine)).maxRad).toBeLessThan(1e-6);

      // Single-step evolution at 30/60/120 Hz remains smooth without sudden > 35 deg snap
      const poseBeforeStep = evaluateBlendedPose(machine);
      stepAnimationStateMachine(
        machine,
        { isGrounded: false, isMoving: true, isRunning: true, speed: 9.8, velocityY: -2.2 },
        dt
      );
      const stepDelta = maxPoseBoneDeltaRad(poseBeforeStep, evaluateBlendedPose(machine));
      expect(stepDelta.maxRad).toBeLessThan(0.6);
    }
  });

  it("P1-B: computes post-collision animation ground speed safely and stops stepping when blocked by a wall", () => {
    // 1. Guard divide-by-zero, negative dt, and teleportation spikes
    expect(computeAnimationGroundSpeed(0, 0, 1, 0, 0, 9.8)).toBe(0);
    expect(computeAnimationGroundSpeed(0, 0, 1, 0, -0.016, 9.8)).toBe(0);
    expect(computeAnimationGroundSpeed(0, 0, 12, -8, 1 / 60, 9.8, true)).toBe(0);
    // Unflagged teleport way beyond max sprint step is also suppressed
    expect(computeAnimationGroundSpeed(0, 0, 10, 10, 1 / 60, 9.8, false)).toBe(0);

    // 2. Cardinal vs Diagonal open-ground movement produces identical animation speed
    const wallBox: Aabb2D = {
      id: "north-wall",
      minX: -10,
      maxX: 10,
      minZ: -1,
      maxZ: 0
    };
    const bounds = PUBLIC_PLAZA_MAP_CONFIG.bounds;
    const cfg = PUBLIC_PLAZA_MAP_CONFIG.player;
    const dt = 1 / 60;

    const cardinalPlayer = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    const cPrevX = cardinalPlayer.x;
    const cPrevZ = cardinalPlayer.z;
    stepPlayerKinematics(cardinalPlayer, { ...IDLE_MOVE_INPUT, right: true }, [], bounds, cfg, dt, 0);
    const cardinalSpeed = computeAnimationGroundSpeed(
      cPrevX,
      cPrevZ,
      cardinalPlayer.x,
      cardinalPlayer.z,
      dt,
      cfg.runSpeed
    );

    const diagPlayer = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    const dPrevX = diagPlayer.x;
    const dPrevZ = diagPlayer.z;
    stepPlayerKinematics(
      diagPlayer,
      { ...IDLE_MOVE_INPUT, forward: true, right: true },
      [],
      bounds,
      cfg,
      dt,
      0
    );
    const diagonalSpeed = computeAnimationGroundSpeed(
      dPrevX,
      dPrevZ,
      diagPlayer.x,
      diagPlayer.z,
      dt,
      cfg.runSpeed
    );
    expect(cardinalSpeed).toBeCloseTo(cfg.walkSpeed, 4);
    expect(diagonalSpeed).toBeCloseTo(cfg.walkSpeed, 4);

    // 3. Head-on wall block -> actual speed becomes 0 -> animation transitions to "idle" and stops cyclePhase!
    const blockedPlayer = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    blockedPlayer.x = 0;
    blockedPlayer.z = wallBox.maxZ + cfg.radius; // 0.45, touching south face of wallBox
    const machine = createInitialAnimationMachineState();

    // Start in Walk first
    for (let i = 0; i < 15; i += 1) {
      stepAnimationStateMachine(
        machine,
        { isGrounded: true, isMoving: true, isRunning: false, speed: cfg.walkSpeed, velocityY: 0 },
        dt
      );
    }
    expect(machine.currentState).toBe("walk");

    // Push straight North into wallBox for 20 frames while holding W (p.isMoving === true, but displacement === 0)
    for (let i = 0; i < 20; i += 1) {
      const px = blockedPlayer.x;
      const pz = blockedPlayer.z;
      stepPlayerKinematics(
        blockedPlayer,
        { ...IDLE_MOVE_INPUT, forward: true },
        [wallBox],
        bounds,
        cfg,
        dt,
        0
      );
      expect(blockedPlayer.isMoving).toBe(true); // Kinematics contract unchanged
      const animSpeed = computeAnimationGroundSpeed(
        px,
        pz,
        blockedPlayer.x,
        blockedPlayer.z,
        dt,
        cfg.runSpeed
      );
      expect(animSpeed).toBeLessThan(0.01);

      stepAnimationStateMachine(
        machine,
        {
          isGrounded: blockedPlayer.isGrounded,
          isMoving: blockedPlayer.isMoving,
          isRunning: blockedPlayer.isRunning,
          speed: animSpeed,
          velocityY: blockedPlayer.velocityY
        },
        dt
      );
    }
    expect(machine.currentState).toBe("idle");
    const phaseAfterStop = machine.cyclePhase;
    stepAnimationStateMachine(
      machine,
      { isGrounded: true, isMoving: true, isRunning: false, speed: 0, velocityY: 0 },
      dt
    );
    expect(machine.cyclePhase).toBe(phaseAfterStop);

    // 4. Sliding diagonally (45 deg) along wallBox -> speed is ~cos(45)*walkSpeed and cadence scales proportionally
    const slidePlayer = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    slidePlayer.x = 0;
    slidePlayer.z = wallBox.maxZ + cfg.radius;
    const slideMachine = createInitialAnimationMachineState();
    const openMachine = createInitialAnimationMachineState();

    for (let i = 0; i < 18; i += 1) {
      const sx = slidePlayer.x;
      const sz = slidePlayer.z;
      stepPlayerKinematics(
        slidePlayer,
        { ...IDLE_MOVE_INPUT, forward: true, right: true },
        [wallBox],
        bounds,
        cfg,
        dt,
        0
      );
      const slideSpeed = computeAnimationGroundSpeed(
        sx,
        sz,
        slidePlayer.x,
        slidePlayer.z,
        dt,
        cfg.runSpeed
      );
      expect(slideSpeed).toBeCloseTo(cfg.walkSpeed * Math.SQRT1_2, 2);

      stepAnimationStateMachine(
        slideMachine,
        { isGrounded: true, isMoving: true, isRunning: false, speed: slideSpeed, velocityY: 0 },
        dt
      );
      stepAnimationStateMachine(
        openMachine,
        { isGrounded: true, isMoving: true, isRunning: false, speed: cfg.walkSpeed, velocityY: 0 },
        dt
      );
    }
    expect(slideMachine.currentState).toBe("walk");
    expect(slideMachine.cyclePhase / openMachine.cyclePhase).toBeCloseTo(Math.SQRT1_2, 2);

    // 5. Very slow creeping (0.20 world units/s) does NOT hit an artificial 0.65 speedRatio floor
    const creepMachine = createInitialAnimationMachineState();
    stepAnimationStateMachine(
      creepMachine,
      { isGrounded: true, isMoving: true, isRunning: false, speed: 0.2, velocityY: 0 },
      0.1
    );
    const fullWalkMachine = createInitialAnimationMachineState();
    stepAnimationStateMachine(
      fullWalkMachine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: false,
        speed: DEFAULT_PLAYER_MOVEMENT_CONFIG.walkSpeed,
        velocityY: 0
      },
      0.1
    );
    expect(creepMachine.cyclePhase).toBeLessThan(fullWalkMachine.cyclePhase * 0.15);
  });

  it("P2-A & P2-B: reduces VRM stance-foot world drift, evolves jump/land crouch cleanly while moving, and never sticks interact wave", () => {
    const dt = 1 / 60;
    const walkMachine = createInitialAnimationMachineState();
    let worldZ = 0;
    const leftFootFrames: { z: number; y: number }[] = [];

    loadedRig.scene.position.set(0, 0, 0);
    loadedRig.scene.rotation.set(0, 0, 0);

    // Warm up 20 frames into steady walk, then record 120 frames (2.0s) moving forward along +Z at configured walkSpeed
    const walkSpeed = DEFAULT_PLAYER_MOVEMENT_CONFIG.walkSpeed;
    for (let i = 0; i < 140; i += 1) {
      worldZ += walkSpeed * dt;
      loadedRig.scene.position.set(0, 0, worldZ);
      stepAnimationStateMachine(
        walkMachine,
        {
          isGrounded: true,
          isMoving: true,
          isRunning: false,
          speed: walkSpeed,
          velocityY: 0
        },
        dt
      );
      applyPoseToVrm(loadedRig, evaluateBlendedPose(walkMachine), walkMachine.expressions, dt);
      if (i >= 20) {
        const snap = sampleVrmBoneWorldPositions(loadedRig.vrm);
        leftFootFrames.push({ z: snap.leftFoot[2], y: snap.leftFoot[1] });
      }
    }

    const minY = Math.min(...leftFootFrames.map((f) => f.y));
    const maxY = Math.max(...leftFootFrames.map((f) => f.y));
    expect(maxY - minY).toBeGreaterThan(0.06); // Distinct swing clearance vs grounded stance

    const stanceThresholdY = minY + (maxY - minY) * 0.3;
    const runs: { z: number; y: number }[][] = [];
    let currentRun: { z: number; y: number }[] = [];
    for (const f of leftFootFrames) {
      if (f.y <= stanceThresholdY) {
        currentRun.push(f);
      } else if (currentRun.length > 0) {
        if (currentRun.length >= 4) runs.push(currentRun);
        currentRun = [];
      }
    }
    if (currentRun.length >= 4) runs.push(currentRun);
    expect(runs.length).toBeGreaterThanOrEqual(2);

    const avgStanceDrift =
      runs.reduce((acc, r) => acc + Math.abs(r[r.length - 1].z - r[0].z), 0) / runs.length;
    // In P0 baseline, stance foot drifted ~1.56 m forward per step due to inverted swing/stance knee phase!
    // With proper backward linear stance sweep + swing knee lift, stance drift must drop well below 0.85 m.
    expect(avgStanceDrift).toBeLessThan(0.85);

    loadedRig.scene.position.set(0, 0, 0);

    // Dynamic Jump pose evolves between launch (velocityY = 7.4) and apex (velocityY = 0.6)
    const jumpMachine = createInitialAnimationMachineState();
    stepAnimationStateMachine(
      jumpMachine,
      { isGrounded: false, isMoving: false, isRunning: false, speed: 0, velocityY: 7.4 },
      0.18
    );
    const launchJumpPose = evaluateBlendedPose(jumpMachine);
    stepAnimationStateMachine(
      jumpMachine,
      { isGrounded: false, isMoving: false, isRunning: false, speed: 0, velocityY: 0.6 },
      0.18
    );
    const apexJumpPose = evaluateBlendedPose(jumpMachine);
    expect(maxPoseBoneDeltaRad(launchJumpPose, apexJumpPose).maxRad).toBeGreaterThan(0.05);

    // Moving Landing crouch completes smoothly to ~0 at exit instead of truncating at 90% crouch
    stepAnimationStateMachine(
      jumpMachine,
      { isGrounded: false, isMoving: true, isRunning: false, speed: 5.8, velocityY: -6.5 },
      dt
    );
    expect(jumpMachine.currentState).toBe("fall");

    // Touchdown while moving
    stepAnimationStateMachine(
      jumpMachine,
      { isGrounded: true, isMoving: true, isRunning: false, speed: 5.8, velocityY: 0 },
      dt
    );
    expect(jumpMachine.currentState).toBe("land");

    let lastLandHipsOffset = 0;
    let guard = 0;
    while (jumpMachine.currentState === "land" && guard < 40) {
      lastLandHipsOffset = evaluateBlendedPose(jumpMachine).hipsOffsetY;
      stepAnimationStateMachine(
        jumpMachine,
        { isGrounded: true, isMoving: true, isRunning: false, speed: 5.8, velocityY: 0 },
        dt
      );
      guard += 1;
    }
    expect(jumpMachine.currentState).toBe("walk");
    expect(guard).toBeLessThanOrEqual(Math.ceil((LAND_RECOVERY_DURATION_SECONDS / dt) * 1.1));
    // Last frame of "land" before entering "walk" has already recovered close to standing/walking height (not -0.085m peak crouch!)
    expect(Math.abs(lastLandHipsOffset)).toBeLessThan(0.038);

    // NPC wave cancelled by brief movement even if dialogue was still open -> never re-raises arm on stop
    const npcMachine = createInitialAnimationMachineState();
    stepAnimationStateMachine(
      npcMachine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0,
        interactRequested: true,
        isDialogueOpen: true
      },
      0.1
    );
    expect(npcMachine.currentState).toBe("interact");

    // Take a step while still in dialogue radius -> switches to walk AND clears interactTimer
    stepAnimationStateMachine(
      npcMachine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: false,
        speed: 5.8,
        velocityY: 0,
        isDialogueOpen: true
      },
      0.1
    );
    expect(npcMachine.currentState).toBe("walk");

    // Stop moving -> stays in idle, does NOT pop arm back into interact!
    stepAnimationStateMachine(
      npcMachine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0,
        isDialogueOpen: false
      },
      0.25
    );
    expect(npcMachine.currentState).toBe("idle");
    expect(npcMachine.expressions.happy).toBeLessThan(0.1);
  });

  it("V0.3-B.2: uses cozy walk/run speeds from single config source, keeps diagonal equal to cardinal, and stops cleanly on key release", () => {
    expect(DEFAULT_PLAYER_MOVEMENT_CONFIG.walkSpeed).toBeCloseTo(2.2, 2);
    expect(DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed).toBeCloseTo(4.0, 2);

    const bounds = PUBLIC_PLAZA_MAP_CONFIG.bounds;
    const cfg = PUBLIC_PLAZA_MAP_CONFIG.player;
    const dt = 1 / 60;

    // Cardinal vs Diagonal Run at new 4.0 world units/s
    const pCard = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    const pDiag = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    stepPlayerKinematics(
      pCard,
      { ...IDLE_MOVE_INPUT, forward: true, sprint: true },
      [],
      bounds,
      cfg,
      dt,
      0
    );
    stepPlayerKinematics(
      pDiag,
      { ...IDLE_MOVE_INPUT, forward: true, left: true, sprint: true },
      [],
      bounds,
      cfg,
      dt,
      0
    );
    const cardDist = Math.hypot(
      pCard.x - PUBLIC_PLAZA_MAP_CONFIG.spawn.position[0],
      pCard.z - PUBLIC_PLAZA_MAP_CONFIG.spawn.position[2]
    );
    const diagDist = Math.hypot(
      pDiag.x - PUBLIC_PLAZA_MAP_CONFIG.spawn.position[0],
      pDiag.z - PUBLIC_PLAZA_MAP_CONFIG.spawn.position[2]
    );
    expect(cardDist / dt).toBeCloseTo(cfg.runSpeed, 4);
    expect(diagDist / dt).toBeCloseTo(cfg.runSpeed, 4);

    // Single source of truth: running at cfg.runSpeed (4.0) enters "run" (not stuck in "walk" due to old 6.6 constant!)
    const machine = createInitialAnimationMachineState();
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: true,
        speed: cfg.runSpeed,
        velocityY: 0
      },
      dt
    );
    expect(machine.currentState).toBe("run");

    // Releasing keys immediately drops kinematic speed to 0 (no slippery coasting drift)
    const prevX = pCard.x;
    const prevZ = pCard.z;
    stepPlayerKinematics(pCard, IDLE_MOVE_INPUT, [], bounds, cfg, dt, 0);
    expect(pCard.speed).toBe(0);
    expect(pCard.x).toBe(prevX);
    expect(pCard.z).toBe(prevZ);
  });

  it("V0.3-B.2: distinguishes standing vs moving jump, evolves smoothly across apex & landing without snap, and stays consistent across 30/60/120 Hz", () => {
    // 1. Standing jump vs Moving jump pose distinction
    const standJump = createInitialAnimationMachineState();
    const moveJump = createInitialAnimationMachineState();
    moveJump.cyclePhase = Math.PI * 0.45;

    for (let i = 0; i < 10; i += 1) {
      stepAnimationStateMachine(
        standJump,
        {
          isGrounded: false,
          isMoving: false,
          isRunning: false,
          speed: 0,
          velocityY: 4.8
        },
        1 / 60
      );
      stepAnimationStateMachine(
        moveJump,
        {
          isGrounded: false,
          isMoving: true,
          isRunning: true,
          speed: DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed,
          velocityY: 4.8
        },
        1 / 60
      );
    }

    const standPose = evaluateBlendedPose(standJump);
    const movePose = evaluateBlendedPose(moveJump);
    // Moving jump leans torso forward noticeably more than standing jump, without extreme exaggeration
    const standTorsoPitch = standPose.bones.spine[0] + standPose.bones.chest[0];
    const moveTorsoPitch = movePose.bones.spine[0] + movePose.bones.chest[0];
    expect(moveTorsoPitch - standTorsoPitch).toBeGreaterThan(0.08);
    expect(moveTorsoPitch - standTorsoPitch).toBeLessThan(0.55);

    // 2. Full jump arc at 30 / 60 / 120 Hz: no frozen mid-air pose, no apex snap, no double jump, no stuck state
    const runTimesByHz: number[] = [];
    for (const hz of [30, 60, 120]) {
      const dt = 1 / hz;
      const cfg = PUBLIC_PLAZA_MAP_CONFIG.player;
      const bounds = PUBLIC_PLAZA_MAP_CONFIG.bounds;
      const player = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
      const machine = createInitialAnimationMachineState();

      let prevPose = evaluateBlendedPose(machine);
      let maxFrameStepRad = 0;
      const midAirPoses: HumanoidPose[] = [];
      let totalTime = 0;

      // Press Space on frame 0 and keep holding Space mid-air (must NOT double jump) while walking forward
      for (let step = 0; step < Math.ceil(1.35 * hz); step += 1) {
        const px = player.x;
        const pz = player.z;
        stepPlayerKinematics(
          player,
          { ...IDLE_MOVE_INPUT, forward: true, jump: step < Math.ceil(0.4 * hz) },
          [],
          bounds,
          cfg,
          dt,
          0
        );
        const groundSpeed = computeAnimationGroundSpeed(
          px,
          pz,
          player.x,
          player.z,
          dt,
          cfg.runSpeed
        );
        stepAnimationStateMachine(
          machine,
          {
            isGrounded: player.isGrounded,
            isMoving: player.isMoving,
            isRunning: player.isRunning,
            speed: groundSpeed,
            velocityY: player.velocityY
          },
          dt
        );
        const curPose = evaluateBlendedPose(machine);
        maxFrameStepRad = Math.max(
          maxFrameStepRad,
          maxPoseBoneDeltaRad(prevPose, curPose).maxRad
        );
        if (!player.isGrounded) {
          midAirPoses.push(curPose);
        }
        prevPose = curPose;
        totalTime += dt;

        if (step > 4 && player.isGrounded && machine.currentState === "walk") {
          runTimesByHz.push(totalTime);
          break;
        }
      }

      expect(machine.currentState).toBe("walk");
      expect(midAirPoses.length).toBeGreaterThan(8);
      // Verify pose continuously evolves across early ascent -> apex -> late descent
      const earlyAir = midAirPoses[2]!;
      const midAir = midAirPoses[Math.floor(midAirPoses.length * 0.5)]!;
      const lateAir = midAirPoses[midAirPoses.length - 2]!;
      expect(maxPoseBoneDeltaRad(earlyAir, midAir).maxRad).toBeGreaterThan(0.08);
      expect(maxPoseBoneDeltaRad(midAir, lateAir).maxRad).toBeGreaterThan(0.08);
      // No abrupt bone snap across apex or landing at any refresh rate
      expect(maxFrameStepRad).toBeLessThan(0.55);
    }

    // 30 / 60 / 120 Hz total jump + land recovery time matches within 2 frames (~0.07s)
    expect(runTimesByHz).toHaveLength(3);
    expect(Math.max(...runTimesByHz) - Math.min(...runTimesByHz)).toBeLessThan(0.08);
  });

  it("V0.3-B.2: tunes hair & cloth springbones selectively without freezing, stops horizontal hair flyout, and resets cleanly on space switch", () => {
    const parentGroup = new Group();
    parentGroup.add(loadedRig.scene);
    parentGroup.position.set(0, 0, 5.8);
    parentGroup.rotation.set(0, Math.PI, 0); // Facing North (-Z)
    parentGroup.updateMatrixWorld(true);
    resetCharacterVrmSprings(loadedRig);

    const idleMachine = createInitialAnimationMachineState();
    for (let i = 0; i < 25; i += 1) {
      parentGroup.updateMatrixWorld(true);
      applyPoseToVrm(loadedRig, evaluateBlendedPose(idleMachine), idleMachine.expressions, 1 / 60);
    }
    parentGroup.updateMatrixWorld(true);

    const restDirs = new Map<string, Vector3>();
    const joints = Array.from(loadedRig.vrm.springBoneManager?.joints ?? []);
    expect(joints.length).toBeGreaterThan(20);

    for (const j of joints) {
      if (!j.child) continue;
      const p1 = new Vector3();
      const p2 = new Vector3();
      j.bone.getWorldPosition(p1);
      j.child.getWorldPosition(p2);
      restDirs.set(j.bone.name, p2.sub(p1).normalize());
    }

    // Run North (-Z) at cozy runSpeed (4.0 world units/s) for 90 frames (1.5s)
    const runMachine = createInitialAnimationMachineState();
    const dt = 1 / 60;
    for (let i = 0; i < 90; i += 1) {
      parentGroup.position.z -= DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed * dt;
      parentGroup.updateMatrixWorld(true);
      stepAnimationStateMachine(
        runMachine,
        {
          isGrounded: true,
          isMoving: true,
          isRunning: true,
          speed: DEFAULT_PLAYER_MOVEMENT_CONFIG.runSpeed,
          velocityY: 0
        },
        dt
      );
      applyPoseToVrm(loadedRig, evaluateBlendedPose(runMachine), runMachine.expressions, dt);
    }
    parentGroup.updateMatrixWorld(true);

    let maxBackHairFromVerticalDeg = 0;
    let maxHairSwayFromRestDeg = 0;
    const downVec = new Vector3(0, -1, 0);
    for (const j of joints) {
      if (!j.child || !j.bone.name.toLowerCase().includes("hair")) continue;
      const p1 = new Vector3();
      const p2 = new Vector3();
      j.bone.getWorldPosition(p1);
      j.child.getWorldPosition(p2);
      const dir = p2.sub(p1).normalize();
      if (j.bone.name.endsWith("_05") || j.bone.name.endsWith("_07")) {
        const degVertical = (Math.acos(Math.max(-1, Math.min(1, dir.dot(downVec)))) * 180) / Math.PI;
        maxBackHairFromVerticalDeg = Math.max(maxBackHairFromVerticalDeg, degVertical);
      }
      const rest = restDirs.get(j.bone.name)!;
      const degRest = (Math.acos(Math.max(-1, Math.min(1, dir.dot(rest)))) * 180) / Math.PI;
      maxHairSwayFromRestDeg = Math.max(maxHairSwayFromRestDeg, degRest);
    }

    // Simulation MUST stay active (> 5 deg natural lag), NEVER fly horizontal (< 45 deg from vertical, vs 88 deg before!)
    expect(maxHairSwayFromRestDeg).toBeGreaterThan(5);
    expect(maxBackHairFromVerticalDeg).toBeLessThan(45);

    // Space-switch teleport (+20 units instant jump) + resetCharacterVrmSprings produces zero whip
    parentGroup.position.set(0, 0, 9.2);
    parentGroup.updateMatrixWorld(true);
    for (let i = 0; i < 12; i += 1) {
      applyPoseToVrm(loadedRig, evaluateBlendedPose(idleMachine), idleMachine.expressions, 0);
    }
    resetCharacterVrmSprings(loadedRig);
    applyPoseToVrm(loadedRig, evaluateBlendedPose(idleMachine), idleMachine.expressions, dt);
    parentGroup.updateMatrixWorld(true);

    let maxPostTeleportDeg = 0;
    for (const j of joints) {
      if (!j.child || !j.bone.name.toLowerCase().includes("hair")) continue;
      const p1 = new Vector3();
      const p2 = new Vector3();
      j.bone.getWorldPosition(p1);
      j.child.getWorldPosition(p2);
      const dir = p2.sub(p1).normalize();
      const rest = restDirs.get(j.bone.name)!;
      const degRest = (Math.acos(Math.max(-1, Math.min(1, dir.dot(rest)))) * 180) / Math.PI;
      maxPostTeleportDeg = Math.max(maxPostTeleportDeg, degRest);
    }
    expect(maxPostTeleportDeg).toBeLessThan(12);

    parentGroup.remove(loadedRig.scene);
    loadedRig.scene.position.set(0, 0, 0);
    loadedRig.scene.rotation.set(0, 0, 0);
  });
});
