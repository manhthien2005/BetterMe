import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";
import { applyPoseToVrm, disposeCharacterVrm, resetCharacterVrmSprings, type LoadedVrmCharacterRig } from "./vrm-loader";

describe("relaxed locomotion posture on the shipped VRM", () => {
  let rig: LoadedVrmCharacterRig;
  beforeAll(async () => { rig = await loadWorldVrmFixture(true, true); });
  afterAll(() => disposeCharacterVrm(rig.vrm));

  it.each([30, 60, 120].flatMap(hz => [false, true].map(running => ({ hz, running }))))(
    "looks ahead with relaxed trunk lean: $hz Hz, running=$running", ({ hz, running }) => {
      rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
      rig.locomotion!.reset(); rig.actions!.reset(); resetCharacterVrmSprings(rig);
      const machine = createInitialAnimationMachineState(), dt = 1 / hz;
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
      const head = rig.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head)!;
      const neck = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Neck)!;
      const hips = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Hips)!;
      let minPitch = Infinity, maxPitch = -Infinity, minLean = Infinity, maxLean = -Infinity;
      let previous: Quaternion | undefined, maxAngularSpeed = 0;
      for (let i = 0; i < hz * 4; i++) {
        const moving = i < hz * 2.5, speed = moving ? running ? 4 : 2.2 : 0;
        rig.scene.position.z += speed * dt;
        stepAnimationStateMachine(machine, { isGrounded: true, isMoving: moving, isRunning: running, speed, velocityY: 0 }, dt);
        applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
        const q = head.getWorldQuaternion(new Quaternion());
        if (previous) maxAngularSpeed = Math.max(maxAngularSpeed, q.angleTo(previous) / dt);
        previous = q;
        if (i >= hz * .6 && moving) {
          const forward = new Vector3(0, 0, 1).applyQuaternion(q);
          const pitch = Math.atan2(-forward.y, Math.hypot(forward.x, forward.z)) * 180 / Math.PI;
          const trunk = neck.getWorldPosition(new Vector3()).sub(hips.getWorldPosition(new Vector3()));
          const lean = Math.atan2(trunk.z, trunk.y) * 180 / Math.PI;
          minPitch = Math.min(minPitch, pitch); maxPitch = Math.max(maxPitch, pitch);
          minLean = Math.min(minLean, lean); maxLean = Math.max(maxLean, lean);
        }
      }
      const evidence = JSON.stringify({ minPitch, maxPitch, minLean, maxLean, maxAngularSpeed });
      expect(maxPitch, evidence).toBeLessThan(running ? 10 : 8);
      expect(minPitch, evidence).toBeGreaterThan(-8);
      expect(maxLean, evidence).toBeLessThan(running ? 18 : 12);
      expect(minLean, evidence).toBeGreaterThan(running ? 2 : -5);
      expect(maxAngularSpeed, evidence).toBeLessThan(6);
      expect(machine.currentState).toBe("idle");
      expect(rig.locomotion!.sample(undefined, dt)).toBeNull();
    }
  );

  it.each([30, 60, 120])("keeps the head continuous through walk/run/stop/restart at %i Hz", hz => {
    rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
    rig.locomotion!.reset(); rig.actions!.reset(); resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState(), dt = 1 / hz;
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
    const head = rig.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head)!;
    let previous = head.getWorldQuaternion(new Quaternion()), maxAngularSpeed = 0;
    for (let i = 0; i < hz * 5; i++) {
      const t = i * dt, moving = t < 2 || (t >= 2.3 && t < 4);
      const running = (t >= 1 && t < 2) || (t >= 3.3 && t < 4);
      const speed = moving ? running ? 4 : 2.2 : 0;
      rig.scene.position.z += speed * dt;
      stepAnimationStateMachine(machine, { isGrounded: true, isMoving: moving, isRunning: running, speed, velocityY: 0 }, dt);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
      const q = head.getWorldQuaternion(new Quaternion());
      maxAngularSpeed = Math.max(maxAngularSpeed, q.angleTo(previous) / dt);
      previous = q;
    }
    expect(maxAngularSpeed).toBeLessThan(6);
    expect(machine.currentState).toBe("idle");
  });
});
