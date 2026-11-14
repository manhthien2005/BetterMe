import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { Quaternion, Vector3 } from "three";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, HUMANOID_BONE_KEYS, stepAnimationStateMachine } from "./animation-state-machine";
import { applyPoseToVrm, disposeCharacterVrm, resetCharacterVrmSprings, type LoadedVrmCharacterRig } from "./vrm-loader";
import { PUBLIC_PLAZA_MAP_CONFIG } from "./map-config";
import { createInitialPlayerState, stepPlayerKinematics } from "./physics";

describe("hands/jump on the real VRM", () => {
  let rig: LoadedVrmCharacterRig;
  beforeAll(async () => { rig = await loadWorldVrmFixture(true, true); });
  afterAll(() => disposeCharacterVrm(rig.vrm));
  it("preserves every accepted body bone at idle/walk/run, with a visibly curled hand", async () => {
    const old = await loadWorldVrmFixture(true);
    try {
      rig.scene.position.set(0, 0, 0); rig.actions!.reset(); rig.locomotion!.reset(); resetCharacterVrmSprings(rig);
      const machine = createInitialAnimationMachineState();
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
      applyPoseToVrm(old, evaluateBlendedPose(machine), machine.expressions, 0);
      for (let i = 0; i < 180; i++) {
        const moving = i >= 60, running = i >= 120, speed = moving ? running ? 4 : 2.2 : 0;
        rig.scene.position.z += speed / 60; old.scene.position.copy(rig.scene.position);
        stepAnimationStateMachine(machine, { isGrounded: true, isMoving: moving, isRunning: running, speed, velocityY: 0 }, 1 / 60);
        for (const actor of [rig, old]) applyPoseToVrm(actor, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
        for (const key of HUMANOID_BONE_KEYS) {
          const current = rig.vrm.humanoid.getNormalizedBoneNode(key as VRMHumanBoneName);
          const prior = old.vrm.humanoid.getNormalizedBoneNode(key as VRMHumanBoneName);
          if (current && prior) expect(current.quaternion.angleTo(prior.quaternion), key).toBeLessThan(1e-5);
        }
      }
      const finger = rig.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftIndexProximal)!;
      expect(finger.quaternion.angleTo(new Quaternion())).toBeGreaterThan(.5);
    } finally { disposeCharacterVrm(old.vrm); }
  });

  it.each([30, 60, 120].flatMap(hz => [false, true].map(moving => ({ hz, moving }))))(
    "articulates, clears the floor and returns to idle: $hz Hz moving=$moving", ({ hz, moving }) => {
      rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
      rig.actions!.reset(); rig.locomotion!.reset(); resetCharacterVrmSprings(rig);
      const machine = createInitialAnimationMachineState(), dt = 1 / hz;
      const map = PUBLIC_PLAZA_MAP_CONFIG, player = createInitialPlayerState(map);
      player.x = 0; player.z = 0;
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
      let maximumKnee = 0, minimumHip = 2, minFoot = 2, maxFootSpeed = 0, maxHandSpread = 0;
      let maxFootHeightSplit = 0, maxFootDepthSplit = 0, maxStanceWidth = 0;
      let maxKneeSpread = 0, forwardHandsAtApex = -Infinity;
      let landingTime = Infinity;
      let previous: Vector3 | undefined;
      for (let i = 0; i < hz * 3; i++) {
        const t = i / hz, wasGrounded = player.isGrounded;
        stepPlayerKinematics(player, {
          backward: moving && t < 1.4, forward: false, left: false, right: false,
          sprint: moving, jump: t >= .5 && t < .6
        }, [], map.bounds, map.player, dt);
        const airborne = !player.isGrounded;
        if (!wasGrounded && player.isGrounded) landingTime = t;
        rig.scene.position.set(player.x, player.y, player.z);
        const root = rig.scene.position.clone();
        stepAnimationStateMachine(machine, {
          isGrounded: player.isGrounded, isMoving: player.isMoving, isRunning: player.isRunning,
          speed: player.speed, velocityY: player.velocityY, jumpSpeed: map.player.jumpSpeed
        }, dt);
        applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
        expect(rig.scene.position.equals(root)).toBe(true);
        const foot = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftFoot)!.getWorldPosition(new Vector3());
        if (previous) maxFootSpeed = Math.max(maxFootSpeed, foot.distanceTo(previous) / dt);
        previous = foot;
        if (airborne && t > .6) {
          const rightFoot = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.RightFoot)!.getWorldPosition(new Vector3());
          maxFootHeightSplit = Math.max(maxFootHeightSplit, Math.abs(foot.y - rightFoot.y));
          maxFootDepthSplit = Math.max(maxFootDepthSplit, Math.abs(foot.z - rightFoot.z));
          maxStanceWidth = Math.max(maxStanceWidth, Math.abs(foot.x - rightFoot.x));
          for (const side of ["left", "right"] as const) {
            const knee = rig.vrm.humanoid.getNormalizedBoneNode(`${side}LowerLeg` as VRMHumanBoneName)!;
            maximumKnee = Math.max(maximumKnee, knee.quaternion.angleTo(new Quaternion()));
            const hand = rig.vrm.humanoid.getRawBoneNode(`${side}Hand` as VRMHumanBoneName)!.getWorldPosition(new Vector3());
            maxHandSpread = Math.max(maxHandSpread, Math.abs(hand.x - root.x));
            const rawKnee = rig.vrm.humanoid.getRawBoneNode(`${side}LowerLeg` as VRMHumanBoneName)!.getWorldPosition(new Vector3());
            maxKneeSpread = Math.max(maxKneeSpread, Math.abs(rawKnee.x - root.x));
          }
          if (Math.abs(player.velocityY) < .5) {
            const leftHand = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftHand)!.getWorldPosition(new Vector3());
            const rightHand = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.RightHand)!.getWorldPosition(new Vector3());
            forwardHandsAtApex = Math.max(forwardHandsAtApex, (leftHand.z + rightHand.z) / 2 - root.z);
          }
          expect(foot.y - root.y).toBeGreaterThan(.03);
        }
        if (t >= landingTime && t < landingTime + .4) {
          minimumHip = Math.min(minimumHip, rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Hips)!.getWorldPosition(new Vector3()).y);
          const rightFoot = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.RightFoot)!.getWorldPosition(new Vector3());
          minFoot = Math.min(minFoot, foot.y, rightFoot.y);
        }
        if (t > 2.5) {
          const local = rig.scene.worldToLocal(foot.clone());
          expect(Math.abs(local.z)).toBeLessThan(.12);
          expect(local.y).toBeLessThan(.14);
        }
      }
      expect(maximumKnee).toBeGreaterThan(.65);
      expect(maximumKnee).toBeLessThan(1.4);
      expect(maxHandSpread).toBeLessThan(.42);
      expect(minimumHip).toBeGreaterThan(.7);
      expect(minimumHip).toBeLessThan(.88);
      expect(minFoot).toBeGreaterThan(.06);
      expect(maxFootSpeed).toBeLessThan(20);
      expect(machine.currentState).toBe("idle");
      if (!moving) {
        // A standing hop should not retain the source's lifted-leg split stance.
        expect(maxFootHeightSplit).toBeLessThan(.04);
        expect(maxFootDepthSplit).toBeLessThan(.06);
        expect(maxStanceWidth).toBeLessThan(.3);
        expect(maxKneeSpread).toBeLessThan(.15);
        expect(forwardHandsAtApex).toBeGreaterThan(.08);
      }
    }
  );
  it("opens the greeting hand and restores its relaxed curl afterwards", () => {
    rig.scene.position.set(0, 0, 0);
    rig.actions!.reset(); rig.locomotion!.reset(); resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState();
    const input = { isGrounded: true, isMoving: false, isRunning: false, speed: 0, velocityY: 0 };
    const finger = rig.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexProximal)!;
    for (let i = 0; i < 45; i++) {
      stepAnimationStateMachine(machine, { ...input, interactRequested: i === 0 }, 1 / 60);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
    }
    expect(machine.currentState).toBe("interact");
    expect(finger.quaternion.angleTo(new Quaternion())).toBeLessThan(.15);
    for (let i = 0; i < 240; i++) {
      stepAnimationStateMachine(machine, input, 1 / 60);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
    }
    expect(machine.currentState).toBe("idle");
    expect(finger.quaternion.angleTo(new Quaternion())).toBeGreaterThan(.4);
  });
});
