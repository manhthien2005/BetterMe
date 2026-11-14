import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";
import { applyPoseToVrm, disposeCharacterVrm, resetCharacterVrmSprings, type LoadedVrmCharacterRig } from "./vrm-loader";

describe("authored clips on the shipped VRM", () => {
  let rig: LoadedVrmCharacterRig;
  beforeAll(async () => { rig = await loadWorldVrmFixture(true); });
  afterAll(() => disposeCharacterVrm(rig.vrm));
  const stops = [30, 60, 120].flatMap(hz => [false, true].flatMap(running =>
    [0.35, 0.7, 1.1, 4].map(seconds => ({ hz, running, seconds }))));
  it.each(stops)("stance <=5 cm and idle: $hz Hz, running=$running, stop=$seconds s", ({ hz, running, seconds }) => {
    rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
    rig.locomotion!.reset(); resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState();
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
    const dt = 1 / hz, speed = running ? 4 : 2.2;
    const anchors: Partial<Record<"left" | "right", Vector3>> = {};
    const previous: Partial<Record<"left" | "right", Vector3>> = {};
    let drift = 0, footSpeed = 0, swingRotation = 0, contactSamples = 0;
    let previousRotation: Quaternion | undefined;
    for (let i = 0; i < Math.ceil((seconds + 2) * hz); i++) {
      const moving = i < Math.ceil(seconds * hz);
      if (moving) rig.scene.position.z += speed * dt;
      const root = rig.scene.position.clone();
      stepAnimationStateMachine(machine, { isGrounded: true, isMoving: moving, isRunning: running, speed: moving ? speed : 0, velocityY: 0 }, dt);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
      expect(rig.scene.position.equals(root)).toBe(true);
      for (const side of ["left", "right"] as const) {
        const foot = rig.vrm.humanoid.getRawBoneNode(`${side}Foot` as VRMHumanBoneName)!;
        const p = foot.getWorldPosition(new Vector3());
        if (previous[side]) footSpeed = Math.max(footSpeed, p.distanceTo(previous[side]!) / dt);
        previous[side] = p.clone();
        if (moving && i > hz && rig.locomotion!.contacts[side]) {
          if (anchors[side]) { drift = Math.max(drift, p.distanceTo(anchors[side]!)); contactSamples++; }
          else anchors[side] = p.clone();
        } else delete anchors[side];
        if (!moving && i > (seconds + 1) * hz) {
          const local = rig.scene.worldToLocal(p);
          expect(Math.abs(local.z)).toBeLessThan(0.12);
          expect(local.y).toBeLessThan(0.14);
        }
        if (moving && side === "left" && !rig.locomotion!.contacts.left) {
          const q = foot.getWorldQuaternion(new Quaternion());
          if (previousRotation) swingRotation += q.angleTo(previousRotation);
          previousRotation = q;
        }
      }
    }
    expect(machine.currentState).toBe("idle");
    expect(footSpeed, JSON.stringify({ running, seconds, footSpeed })).toBeLessThan(running ? 16 : 10);
    expect(drift, JSON.stringify({ running, seconds, drift })).toBeLessThanOrEqual(0.05);
    if (seconds === 4) {
      expect(contactSamples).toBeGreaterThan(10);
      expect(swingRotation).toBeGreaterThan(1);
    }
  });
  it.each([30, 60, 120])("handles repeated walk/run/turn/jump/land interruptions at %i Hz", hz => {
    rig.scene.position.set(0, 0, 0); rig.scene.rotation.set(0, 0, 0);
    rig.locomotion!.reset(); resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState(), dt = 1 / hz;
    applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 0);
    let previous = new Quaternion(), maxAngularSpeed = 0, worstTime = 0;
    for (let i = 0; i < hz * 6; i++) {
      const time = i * dt;
      const jumping = time >= 2 && time < 2.7;
      const moving = time < 4;
      const running = Math.floor(time * 3) % 2 === 1;
      const speed = moving ? running ? 4 : 2.2 : 0;
      rig.scene.rotation.y += ((time > 1 ? Math.PI : 0) - rig.scene.rotation.y) * (1 - Math.exp(-14 * dt));
      rig.scene.position.z += speed * dt;
      rig.scene.position.y = jumping ? Math.sin((time - 2) / 0.7 * Math.PI) : 0;
      stepAnimationStateMachine(machine, { isGrounded: !jumping, isMoving: moving, isRunning: running, speed, velocityY: jumping ? (time < 2.35 ? 4 : -4) : 0 }, dt);
      applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, dt);
      const node = rig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftFoot)!;
      // Measure pose continuity relative to the actor; the unchanged controller can
      // rotate the entire actor at ~44 rad/s at the start of a 180-degree turn.
      const q = rig.scene.getWorldQuaternion(new Quaternion()).invert()
        .multiply(node.getWorldQuaternion(new Quaternion()));
      if (i > 0 && q.angleTo(previous) / dt > maxAngularSpeed) {
        maxAngularSpeed = q.angleTo(previous) / dt; worstTime = time;
      }
      previous = q;
      expect(node.getWorldPosition(new Vector3()).toArray().every(Number.isFinite)).toBe(true);
      if (time > 2.2 && time < 2.5) expect(node.getWorldPosition(new Vector3()).y).toBeGreaterThan(0.5);
    }
    expect(maxAngularSpeed, JSON.stringify({ maxAngularSpeed, worstTime })).toBeLessThan(40);
    expect(machine.currentState).toBe("idle");
  });
});
