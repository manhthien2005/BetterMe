import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";
import { npcLookPitch } from "./npc-motion";
import { applyPoseToVrm, disposeCharacterVrm, resetCharacterVrmSprings, type LoadedVrmCharacterRig } from "./vrm-loader";

describe("NPC gaze on Plaza terraces", () => {
  it.each([-2, 0, 4, 7])("uses relative height at %i metres", ground => {
    expect(npcLookPitch([0, ground, 2], [0, ground, 0])).toBeCloseTo(0);
    expect(npcLookPitch([0, ground + 1, 2], [0, ground, 0])).toBeCloseTo(-Math.atan2(1, 2));
    expect(Number.isFinite(npcLookPitch([0, ground, 0], [0, ground, 0]))).toBe(true);
  });
});

describe("VRM contact stays relative to the supporting terrace", () => {
  let rig: LoadedVrmCharacterRig;
  beforeAll(async () => { rig = await loadWorldVrmFixture(true, true); });
  afterAll(() => disposeCharacterVrm(rig.vrm));

  function sample(ground: number, hz: number, authored: boolean, rising = false) {
    const locomotion = rig.locomotion, actions = rig.actions;
    locomotion?.reset(); actions?.reset();
    if (!authored) { rig.locomotion = undefined; rig.actions = undefined; }
    rig.scene.position.set(0, ground, 0); rig.scene.rotation.set(0, 0, 0);
    resetCharacterVrmSprings(rig);
    const machine = createInitialAnimationMachineState(), points: Vector3[] = [];
    applyPoseToVrm(rig, { ...evaluateBlendedPose(machine), footGroundY: ground }, machine.expressions, 0);
    try {
      for (let frame = 0; frame < hz * 3; frame++) {
        const time = frame / hz, moving = time < 1.8;
        const jumpTime = time - 1, airborne = jumpTime >= 0 && jumpTime < .6;
        const support = ground + (rising ? Math.min(time, 1) * .2 : 0);
        const height = airborne ? Math.sin(jumpTime / .6 * Math.PI) : 0;
        rig.scene.position.y = support + height;
        if (moving) rig.scene.position.z += 2.2 / hz;
        stepAnimationStateMachine(machine, { isGrounded: !airborne, isMoving: moving,
          isRunning: false, speed: moving ? 2.2 : 0, velocityY: airborne ? jumpTime < .3 ? 4 : -4 : 0 }, 1 / hz);
        const root = rig.scene.position.clone();
        applyPoseToVrm(rig, { ...evaluateBlendedPose(machine), footGroundY: support }, machine.expressions, 1 / hz);
        expect(rig.scene.position.equals(root)).toBe(true);
        for (const name of [VRMHumanBoneName.LeftFoot, VRMHumanBoneName.RightFoot]) {
          const p = rig.vrm.humanoid.getRawBoneNode(name)!.getWorldPosition(new Vector3());
          p.y -= support; expect(p.toArray().every(Number.isFinite)).toBe(true); points.push(p);
        }
      }
      expect(machine.currentState).toBe("idle");
      return points;
    } finally { rig.locomotion = locomotion; rig.actions = actions; }
  }

  it.each([30, 60, 120].flatMap(hz => [false, true].map(authored => ({ hz, authored }))))(
    "preserves gait, stop, jump and landing at $hz Hz authored=$authored", ({ hz, authored }) => {
      const baseline = sample(0, hz, authored);
      for (const ground of [-2, 4, 7]) {
        const raised = sample(ground, hz, authored);
        const error = Math.max(...raised.map((point, i) => point.distanceTo(baseline[i])));
        expect(error, `ground=${ground}`).toBeLessThan(.002);
      }
    });
  it("releases contact from the previous supporting height", () => {
    const baseline = sample(0, 60, true, true), raised = sample(4, 60, true, true);
    expect(Math.max(...raised.map((point, i) => point.distanceTo(baseline[i])))).toBeLessThan(.002);
    expect(Math.min(...raised.slice(-60).map(p => p.y))).toBeGreaterThan(0);
  });
});
