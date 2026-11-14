import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";
import { applyPoseToVrm, disposeCharacterVrm, resetCharacterVrmSprings, type LoadedVrmCharacterRig } from "./vrm-loader";

describe("ground contact on the shipped VRM rig", () => {
  let rig: LoadedVrmCharacterRig;
  beforeAll(async () => { rig = await loadWorldVrmFixture(); });
  afterAll(() => disposeCharacterVrm(rig.vrm));
  const stops = [30, 60, 120].flatMap(hz => [false, true].flatMap(running =>
    [0.35, 0.7, 1.1].map(moveSeconds => ({ hz, running, moveSeconds }))));
  it.each(stops)("returns to idle: $hz Hz, running=$running, stop=$moveSeconds s", ({ hz, running, moveSeconds }) => {
    rig.scene.position.set(0, 0, 0);
    rig.scene.rotation.set(0, 0, 0);
    resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState();
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
    const dt = 1 / hz;
    const speed = running ? 4 : 2.2;
    for (let i = 0; i < Math.ceil(hz * moveSeconds); i++) {
      rig.scene.position.z += speed * dt;
      stepAnimationStateMachine(machine, {
        isGrounded: true, isMoving: true, isRunning: running, speed, velocityY: 0
      }, dt);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
    }
    const stoppedRoot = rig.scene.position.clone();
    const previousFeet = [VRMHumanBoneName.LeftFoot, VRMHumanBoneName.RightFoot].map(name =>
      rig.vrm.humanoid.getRawBoneNode(name)!.getWorldPosition(new Vector3()));
    let maxStopFootSpeed = 0;
    for (let i = 0; i < hz * 3; i++) {
      stepAnimationStateMachine(machine, {
        isGrounded: true, isMoving: false, isRunning: false, speed: 0, velocityY: 0
      }, dt);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
      [VRMHumanBoneName.LeftFoot, VRMHumanBoneName.RightFoot].forEach((name, index) => {
        const position = rig.vrm.humanoid.getRawBoneNode(name)!.getWorldPosition(new Vector3());
        maxStopFootSpeed = Math.max(maxStopFootSpeed, position.distanceTo(previousFeet[index]) / dt);
        previousFeet[index].copy(position);
      });
      if (i < hz) continue;
      // Assert the rendered raw skeleton, not just the state-machine label.
      for (const side of ["left", "right"] as const) {
        const foot = rig.vrm.humanoid.getRawBoneNode(`${side}Foot` as VRMHumanBoneName)!;
        const local = rig.scene.worldToLocal(foot.getWorldPosition(new Vector3()));
        expect(Math.abs(local.z), `${running ? "run" : "walk"}, stop at ${moveSeconds}s, ${side}`)
          .toBeLessThan(0.12);
        expect(local.y).toBeLessThan(0.14);
      }
      expect(rig.scene.position.equals(stoppedRoot)).toBe(true);
    }
    expect(machine.currentState).toBe("idle");
    expect(maxStopFootSpeed, `${running ? "run" : "walk"}, stop at ${moveSeconds}s`)
      .toBeLessThan(running ? 16 : 10);
  });
  it.each([30, 60, 120])("holds planted feet within 5 cm at %i Hz, without moving the root", hz => {
    for (const running of [false, true]) {
      rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
      resetCharacterVrmSprings(rig);
      const machine = createInitialAnimationMachineState();
      const speed = running ? 4 : 2.2, dt = 1 / hz;
      const anchors: Partial<Record<"left" | "right", Vector3>> = {};
      let worst = 0, samples = 0;
      let diagnostic: unknown;
      for (let i = 0;i < hz * 4;i++) {
        rig.scene.position.z += speed * dt;
        stepAnimationStateMachine(machine, { isGrounded: true, isMoving: true, isRunning: running, speed, velocityY: 0 }, dt);
        const pose = evaluateBlendedPose(machine);
        const root = rig.scene.position.clone();
        applyPoseToVrm(rig, pose, machine.expressions, dt);
        expect(rig.scene.position.equals(root)).toBe(true);
        for (const side of ["left", "right"] as const) {
          const foot = rig.vrm.humanoid.getRawBoneNode(side === "left" ? VRMHumanBoneName.LeftFoot : VRMHumanBoneName.RightFoot)!;
          const p = foot.getWorldPosition(new Vector3());
          if (pose.footContacts?.[side] && i > hz) {
            if (anchors[side]) {
              const error = p.distanceTo(anchors[side]!);
              if (error > worst) {
                const upper = rig.vrm.humanoid.getNormalizedBoneNode(side === "left" ? VRMHumanBoneName.LeftUpperLeg : VRMHumanBoneName.RightUpperLeg)!;
                const lower = rig.vrm.humanoid.getNormalizedBoneNode(`${side}LowerLeg` as VRMHumanBoneName)!;
                const normalized = rig.vrm.humanoid.getNormalizedBoneNode(`${side}Foot` as VRMHumanBoneName)!;
                diagnostic = { i, side, p: p.toArray(), anchor: anchors[side]!.toArray(), upper: upper.getWorldPosition(new Vector3()).toArray(), normalized: normalized.getWorldPosition(new Vector3()).toArray(), lengths: [upper.getWorldPosition(new Vector3()).distanceTo(lower.getWorldPosition(new Vector3())), lower.getWorldPosition(new Vector3()).distanceTo(normalized.getWorldPosition(new Vector3()))] };
              }
              worst = Math.max(worst, error); samples++;
            }
            else anchors[side] = p.clone();
          } else delete anchors[side];
        }
      }
      expect(samples).toBeGreaterThan(hz);
      expect(worst, JSON.stringify({ running, diagnostic })).toBeLessThanOrEqual(0.05);
    }
  });
  it.each([30, 60, 120])("joins swing to stance without a foot snap at %i Hz", hz => {
    for (const running of [false, true]) {
      rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
      resetCharacterVrmSprings(rig);
      const machine = createInitialAnimationMachineState();
      const dt = 1 / hz, speed = running ? 4 : 2.2;
      const previous: Partial<Record<"left" | "right", Vector3>> = {};
      let maxSpeed = 0, maxLift = 0;
      for (let i = 0;i < hz * 4;i++) {
        rig.scene.position.z += speed * dt;
        stepAnimationStateMachine(machine, { isGrounded: true, isMoving: true, isRunning: running, speed, velocityY: 0 }, dt);
        const pose = evaluateBlendedPose(machine);
        applyPoseToVrm(rig, pose, machine.expressions, dt);
        for (const side of ["left", "right"] as const) {
          const foot = rig.vrm.humanoid.getRawBoneNode(side === "left" ? VRMHumanBoneName.LeftFoot : VRMHumanBoneName.RightFoot)!;
          const p = foot.getWorldPosition(new Vector3());
          if (i > hz && previous[side]) maxSpeed = Math.max(maxSpeed, p.distanceTo(previous[side]!) / dt);
          if (i > hz && !pose.footContacts?.[side]) maxLift = Math.max(maxLift, p.y);
          previous[side] = p;
        }
      }
      // A continuous gait stays bounded as the frame rate increases. An instantaneous
      // touchdown correction instead doubles its measured speed at 120 Hz.
      expect(maxSpeed, JSON.stringify({ running, maxSpeed })).toBeLessThan(running ? 16 : 10);
      expect(maxLift).toBeGreaterThan(0.12);
    }
  });
  it("releases old anchors on teleport, turn, jump and a stalled frame", () => {
    const machine = createInitialAnimationMachineState();
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
    rig.scene.position.set(20, 0, 20); rig.scene.rotation.y = Math.PI;
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0.5);
    const foot = rig.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftFoot)!;
    expect(foot.getWorldPosition(new Vector3()).distanceTo(rig.scene.position)).toBeLessThan(1.5);
    stepAnimationStateMachine(machine, { isGrounded: false, isMoving: false, isRunning: false, speed: 0, velocityY: 7.4 }, 1 / 60);
    rig.scene.position.y = 1;
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
    expect(foot.getWorldPosition(new Vector3()).y).toBeGreaterThan(0.8);
  });
});
