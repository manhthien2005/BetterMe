import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";

import {
  BLINK_INTERVAL_SECONDS,
  createInitialAnimationMachineState,
  evaluateBlendedPose,
  evaluateStatePose,
  HUMANOID_BONE_KEYS,
  stepAnimationStateMachine
} from "@/lib/world/animation-state-machine";
import {
  CHARACTER_ASSET_MANIFEST,
  resolveCharacterAssetEntry,
  validateVrmWebDistributionLicense
} from "@/lib/world/character-assets";
import { computeYawTowardPoint } from "@/lib/world/interaction";
import {
  applyPoseToVrm,
  disposeCharacterVrm,
  prepareLoadedVrm,
  sampleVrmBoneWorldPositions,
  type LoadedVrmCharacterRig
} from "@/lib/world/vrm-loader";

describe("Reading Quest V0.3-A — Character Asset Pipeline, Animation State Machine & VRM Rig", () => {
  let loadedRig: LoadedVrmCharacterRig;

  beforeAll(async () => {
    // Provide minimal ImageBitmap stub in Node/jsdom so GLTFLoader parses embedded PNG textures cleanly
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
        close() {}
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

    const outcome = prepareLoadedVrm(gltf.userData.vrm!, 42);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error(outcome.reason);
    }
    loadedRig = outcome.rig;
  });

  it("verifies the VRM character asset manifest, file integrity, and web redistribution license", () => {
    const entry = resolveCharacterAssetEntry("scholar-vrm1");
    expect(entry.id).toBe("scholar-vrm1");
    expect(entry.format).toBe("VRM-1.0");
    expect(entry.author).toBe("pixiv Inc.");
    expect(entry.permissions.allowRedistribution).toBe(true);
    expect(entry.permissions.avatarPermission).toBe("everyone");

    const diskPath = path.join(process.cwd(), "public", entry.url);
    expect(fs.existsSync(diskPath)).toBe(true);
    const bytes = fs.readFileSync(diskPath);
    expect(bytes.byteLength).toBe(entry.metrics.fileSizeBytes);

    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    expect(sha256).toBe(entry.metrics.sha256);

    const manifestJsonPath = path.join(
      process.cwd(),
      "public/models/characters/manifest.json"
    );
    const parsedManifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf8"));
    expect(parsedManifest.defaultCharacterId).toBe(
      CHARACTER_ASSET_MANIFEST.defaultCharacterId
    );

    expect(
      validateVrmWebDistributionLicense({
        avatarPermission: "everyone",
        allowRedistribution: true,
        licenseUrl: "https://vrm.dev/licenses/1.0/"
      }).valid
    ).toBe(true);

    expect(
      validateVrmWebDistributionLicense({
        avatarPermission: "onlyAuthor",
        allowRedistribution: true,
        licenseUrl: "https://vrm.dev/licenses/1.0/"
      }).valid
    ).toBe(false);

    expect(
      validateVrmWebDistributionLicense({
        avatarPermission: "everyone",
        allowRedistribution: false,
        licenseUrl: "https://vrm.dev/licenses/1.0/"
      }).valid
    ).toBe(false);
  });

  it("transitions smoothly across Idle, Walk, Run, Jump, Fall, Land, and Interact (Wave) with eye blinking", () => {
    const machine = createInitialAnimationMachineState();
    expect(machine.currentState).toBe("idle");

    // 1. Idle -> Walk
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: false,
        speed: 5.8,
        velocityY: 0
      },
      0.05
    );
    expect(machine.currentState).toBe("walk");
    expect(machine.previousState).toBe("idle");
    expect(machine.blendProgress).toBeLessThan(1);

    // Advance walk to preserve stride phase, then switch Walk -> Run
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: false,
        speed: 5.8,
        velocityY: 0
      },
      0.1
    );
    const phaseBeforeRun = machine.cyclePhase;
    expect(phaseBeforeRun).toBeGreaterThan(0);

    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: true,
        isRunning: true,
        speed: 9.8,
        velocityY: 0
      },
      0.05
    );
    expect(machine.currentState).toBe("run");
    expect(machine.cyclePhase).toBeGreaterThan(phaseBeforeRun);

    // 2. Run -> Jump (airborne upward velocity)
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: false,
        isMoving: true,
        isRunning: true,
        speed: 9.8,
        velocityY: 6.5
      },
      0.05
    );
    expect(machine.currentState).toBe("jump");

    // 3. Jump -> Fall (airborne downward velocity)
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: false,
        isMoving: true,
        isRunning: false,
        speed: 5.8,
        velocityY: -3.2
      },
      0.05
    );
    expect(machine.currentState).toBe("fall");

    // 4. Fall -> Land (touchdown on ground)
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0
      },
      0.05
    );
    expect(machine.currentState).toBe("land");

    // Wait out landing recovery -> Idle
    for (let i = 0; i < 6; i += 1) {
      stepAnimationStateMachine(
        machine,
        {
          isGrounded: true,
          isMoving: false,
          isRunning: false,
          speed: 0,
          velocityY: 0
        },
        0.05
      );
    }
    expect(machine.currentState).toBe("idle");

    // 5. Idle -> Interact (Wave to NPC), then closing dialogue returns immediately to Idle
    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0,
        interactRequested: true,
        isDialogueOpen: true
      },
      0.05
    );
    expect(machine.currentState).toBe("interact");
    expect(machine.expressions.happy).toBeGreaterThan(0.2);

    stepAnimationStateMachine(
      machine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0,
        interactRequested: false,
        isDialogueOpen: false
      },
      0.05
    );
    expect(machine.currentState).toBe("idle");

    // 6. Periodic eye blink in Idle when not smiling
    const blinkMachine = createInitialAnimationMachineState();
    blinkMachine.blinkTimer = BLINK_INTERVAL_SECONDS - 0.12;
    stepAnimationStateMachine(
      blinkMachine,
      {
        isGrounded: true,
        isMoving: false,
        isRunning: false,
        speed: 0,
        velocityY: 0
      },
      0.04
    );
    expect(blinkMachine.expressions.blink).toBeGreaterThan(0.5);
  });

  it("enforces anatomical joint constraints and actually moves VRM 1.0 humanoid bones in 3D world space", () => {
    // Verify knees never hyperextend (< 0) across all states and phases
    const states = ["idle", "walk", "run", "jump", "fall", "land", "interact"] as const;
    for (const stateId of states) {
      for (const phase of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
        const pose = evaluateStatePose(stateId, phase, 0.25);
        for (const boneKey of HUMANOID_BONE_KEYS) {
          expect(pose.bones[boneKey]).toHaveLength(3);
        }
        expect(pose.bones.leftLowerLeg[0]).toBeGreaterThanOrEqual(0);
        expect(pose.bones.rightLowerLeg[0]).toBeGreaterThanOrEqual(0);
      }
    }

    // 1. Apply Idle pose to actual VRM 1.0 model and verify A-pose arm placement
    const idleMachine = createInitialAnimationMachineState();
    for (let i = 0; i < 10; i += 1) {
      stepAnimationStateMachine(
        idleMachine,
        { isGrounded: true, isMoving: false, isRunning: false, speed: 0, velocityY: 0 },
        0.05
      );
      applyPoseToVrm(
        loadedRig,
        evaluateBlendedPose(idleMachine),
        idleMachine.expressions,
        0.05
      );
    }
    const idleSnapshot = sampleVrmBoneWorldPositions(loadedRig.vrm);
    // In T-pose, hands are at y = 1.274; in Idle A-pose, hands hang naturally below y = 0.96
    expect(idleSnapshot.leftHand[1]).toBeLessThan(0.96);
    expect(idleSnapshot.rightHand[1]).toBeLessThan(0.96);

    // 2. Apply Walk pose at quarter-cycle (s = +1) vs three-quarter-cycle (s = -1) and verify real foot stride
    const walkPhaseA = evaluateStatePose("walk", Math.PI * 0.5, 0.2);
    for (let i = 0; i < 8; i += 1) {
      applyPoseToVrm(loadedRig, walkPhaseA, idleMachine.expressions, 0.05);
    }
    const walkSnapA = sampleVrmBoneWorldPositions(loadedRig.vrm);

    const walkPhaseB = evaluateStatePose("walk", Math.PI * 1.5, 0.5);
    for (let i = 0; i < 8; i += 1) {
      applyPoseToVrm(loadedRig, walkPhaseB, idleMachine.expressions, 0.05);
    }
    const walkSnapB = sampleVrmBoneWorldPositions(loadedRig.vrm);

    // Left foot and right foot swap forward/backward Z positions across the walk stride
    expect(walkSnapA.leftFoot[2]).toBeGreaterThan(walkSnapA.rightFoot[2] + 0.15);
    expect(walkSnapB.rightFoot[2]).toBeGreaterThan(walkSnapB.leftFoot[2] + 0.15);

    // 3. Apply Run pose and verify wider stride than Walk
    const runPhaseA = evaluateStatePose("run", Math.PI * 0.5, 0.2);
    for (let i = 0; i < 8; i += 1) {
      applyPoseToVrm(loadedRig, runPhaseA, idleMachine.expressions, 0.05);
    }
    const runSnapA = sampleVrmBoneWorldPositions(loadedRig.vrm);
    const walkStrideSpan = Math.abs(walkSnapA.leftFoot[2] - walkSnapA.rightFoot[2]);
    const runStrideSpan = Math.abs(runSnapA.leftFoot[2] - runSnapA.rightFoot[2]);
    expect(runStrideSpan).toBeGreaterThan(walkStrideSpan + 0.08);

    // 4. Apply Interact (Wave) pose and verify right hand raises above shoulder and waves horizontally
    const wavePoseA = evaluateStatePose("interact", 0, 0.12);
    for (let i = 0; i < 8; i += 1) {
      applyPoseToVrm(loadedRig, wavePoseA, { blink: 0, happy: 0.85, relaxed: 0, surprised: 0, aa: 0.25 }, 0.05);
    }
    const waveSnapA = sampleVrmBoneWorldPositions(loadedRig.vrm);

    const wavePoseB = evaluateStatePose("interact", 0, 0.38);
    for (let i = 0; i < 8; i += 1) {
      applyPoseToVrm(loadedRig, wavePoseB, { blink: 0, happy: 0.85, relaxed: 0, surprised: 0, aa: 0.25 }, 0.05);
    }
    const waveSnapB = sampleVrmBoneWorldPositions(loadedRig.vrm);

    // Right hand is raised high (y > 1.25) and in front of shoulder (z > 0.1), while waving X/Y
    expect(waveSnapA.rightHand[1]).toBeGreaterThan(idleSnapshot.rightHand[1] + 0.35);
    expect(waveSnapA.rightHand[2]).toBeGreaterThan(0.1);
    expect(Math.hypot(
      waveSnapA.rightHand[0] - waveSnapB.rightHand[0],
      waveSnapA.rightHand[1] - waveSnapB.rightHand[1]
    )).toBeGreaterThan(0.03);

    disposeCharacterVrm(loadedRig.vrm);
  });

  it("computes horizontal facing yaw toward NPC and player accurately", () => {
    // Target due South (+Z): yaw = 0
    expect(computeYawTowardPoint(0, 0, 0, 5)).toBeCloseTo(0, 5);
    // Target due East (+X): yaw = +PI/2
    expect(computeYawTowardPoint(0, 0, 5, 0)).toBeCloseTo(Math.PI / 2, 5);
    // Target due West (-X): yaw = -PI/2
    expect(computeYawTowardPoint(0, 0, -5, 0)).toBeCloseTo(-Math.PI / 2, 5);
    // Coincident points return 0 safely
    expect(computeYawTowardPoint(2, -3, 2, -3)).toBe(0);
  });
});
