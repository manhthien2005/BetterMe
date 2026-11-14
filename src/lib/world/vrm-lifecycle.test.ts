import { afterEach, describe, expect, it, vi } from "vitest";
import { VRMHumanBoneName, VRMUtils } from "@pixiv/three-vrm";
import { Group, Mesh, Quaternion } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose } from "./animation-state-machine";
import {
  applyPoseToVrm, disposeCharacterVrm, inspectVrmCapabilities,
  loadCharacterVrm, prepareLoadedVrm
} from "./vrm-loader";
import { createVrmFootContact } from "./vrm-foot-contact";

afterEach(() => vi.restoreAllMocks());

describe("independent avatar resources and optional rig capabilities", () => {
  it("keeps skeletons/materials independent and resets omitted finger poses", async () => {
    const first = await loadWorldVrmFixture(), second = await loadWorldVrmFixture();
    try {
      const node = first.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexProximal)!;
      const other = second.vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexProximal)!;
      const machine = createInitialAnimationMachineState();
      const pose = evaluateBlendedPose(machine);
      applyPoseToVrm(first, pose, machine.expressions, 0);
      expect(node.quaternion.angleTo(other.quaternion)).toBeGreaterThan(0.1);
      applyPoseToVrm(first, { bones: pose.bones, hipsOffsetY: 0 }, machine.expressions, 0);
      expect(node.quaternion.angleTo(new Quaternion())).toBeLessThan(0.001);
      const firstMesh = first.scene.getObjectsByProperty("isMesh", true)[0] as Mesh;
      const secondMesh = second.scene.getObjectsByProperty("isMesh", true)[0] as Mesh;
      expect(firstMesh.geometry).not.toBe(secondMesh.geometry);
      expect(firstMesh.material).not.toBe(secondMesh.material);
      const disposeOther = vi.spyOn(secondMesh.geometry, "dispose");
      disposeCharacterVrm(first.vrm);
      expect(disposeOther).not.toHaveBeenCalled();
      expect(() => applyPoseToVrm(second, pose, machine.expressions, 1 / 60)).not.toThrow();
    } finally {
      disposeCharacterVrm(second.vrm);
    }
  });

  it("reports missing optional bones and safely skips an incomplete leg", async () => {
    const rig = await loadWorldVrmFixture();
    try {
      const original = rig.vrm.humanoid.getNormalizedBoneNode.bind(rig.vrm.humanoid);
      vi.spyOn(rig.vrm.humanoid, "getNormalizedBoneNode").mockImplementation(name =>
        name === VRMHumanBoneName.LeftFoot || name === VRMHumanBoneName.RightIndexProximal
          ? null : original(name));
      const capabilities = inspectVrmCapabilities(rig.vrm);
      expect(capabilities.detailBones).not.toContain("rightIndexProximal");
      expect(capabilities.missingCoreBones).toContain("leftFoot");
      const controller = createVrmFootContact(rig.vrm);
      const machine = createInitialAnimationMachineState();
      expect(() => controller.update(evaluateBlendedPose(machine), 1 / 60)).not.toThrow();
      controller.reset();
    } finally {
      disposeCharacterVrm(rig.vrm);
    }
  });

  it("disposes a parsed asset rejected by license validation", async () => {
    const rig = await loadWorldVrmFixture();
    const meta = rig.vrm.meta as unknown as { allowRedistribution: boolean; };
    meta.allowRedistribution = false;
    const dispose = vi.spyOn(VRMUtils, "deepDispose");
    expect(prepareLoadedVrm(rig.vrm, 1).ok).toBe(false);
    expect(dispose).toHaveBeenCalledWith(rig.scene);
  });

  it("disposes a parsed GLB with no humanoid before reporting fallback", async () => {
    const scene = new Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue({ scene, userData: {} } as GLTF);
    const dispose = vi.spyOn(VRMUtils, "deepDispose");
    const result = await loadCharacterVrm("/models/invalid.vrm");
    expect(result.ok).toBe(false);
    expect(dispose).toHaveBeenCalledWith(scene);
  });
});
