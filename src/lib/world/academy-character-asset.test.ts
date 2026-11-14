import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { CHARACTER_ASSET_MANIFEST, resolveCharacterAssetEntry, resolveNpcCharacterAsset } from "./character-assets";
import { SkinnedMesh, Vector3 } from "three";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";
import { applyPoseToVrm, disposeCharacterVrm } from "./vrm-loader";

function readGlb(name: string) {
  const buffer = fs.readFileSync(`public/models/characters/${name}.vrm`);
  const length = buffer.readUInt32LE(12);
  return { json: JSON.parse(buffer.subarray(20, 20 + length).toString()), binary: buffer.subarray(28 + length) };
}

describe("academy player fitting asset", () => {
  it("selects the player fitting, keeps unknown NPC fallback and records real file metrics", () => {
    const entry = resolveCharacterAssetEntry();
    expect(entry.id).toBe("academy-scholar-v1");
    expect(resolveCharacterAssetEntry("unknown").id).toBe(entry.id);
    expect(resolveNpcCharacterAsset("unknown").id).toBe("scholar-vrm1");
    const bytes = fs.readFileSync(`public${entry.url}`);
    expect(entry.metrics.fileSizeBytes).toBe(bytes.length);
    expect(entry.metrics.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    expect(entry.metrics.sha256).toBe("8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f");
    expect(JSON.parse(fs.readFileSync("public/models/characters/manifest.json", "utf8"))).toEqual(CHARACTER_ASSET_MANIFEST);
  });
  it("uses mipmaps so the silver crest stays continuous at gameplay distance", () => {
    const { json } = readGlb("academy-scholar-v1");
    for (const name of ["Player academy crest", "Player small academy crest"]) {
      const material = json.materials.find((entry: { name: string }) => entry.name === name);
      expect(material).toBeDefined();
      expect(material.alphaMode).toBe("MASK");
      const texture = json.textures[material.pbrMetallicRoughness.baseColorTexture.index];
      expect(json.samplers[texture.sampler].minFilter).toBe(9987);
    }
  });
  it.each(["academy-scholar-v1", "academy-an-v1", "academy-khoa-v1", "academy-minh-v1"])("preserves the licensed base rig and expressions for %s", (assetId) => {
    const source = readGlb("scholar-vrm1").json;
    const derived = readGlb(assetId).json;
    const before = source.extensions.VRMC_vrm, after = derived.extensions.VRMC_vrm;
    expect(after.humanoid).toEqual(before.humanoid);
    expect(after.expressions).toEqual(before.expressions);
    for (const field of ["licenseUrl", "copyrightInformation", "avatarPermission", "modification", "commercialUsage", "allowRedistribution"]) {
      expect(after.meta[field]).toEqual(before.meta[field]);
    }
    expect(after.meta.authors).toContain("pixiv Inc.");
    const parts = derived.meshes.map((mesh: { name: string }) => mesh.name);
    expect(parts).toEqual(expect.arrayContaining(["Academy_Robe", "Academy_Lining", "Academy_Uniform"]));
    expect(parts).toContain(assetId.includes("khoa") || assetId.includes("minh") ? "Academy_RoleDetails" : "Academy_Skirt");
    expect(derived.buffers).toHaveLength(1);
    expect(derived.buffers[0].uri).toBeUndefined();
    expect(derived.images.every((image: { bufferView?: number }) => Number.isInteger(image.bufferView))).toBe(true);
    for (const material of derived.materials.filter((material: { name: string }) => material.name.startsWith("Academy"))) {
      // MToon 1.0 ignores vertex colour by default; fabric shading must travel in a texture.
      expect(material.pbrMetallicRoughness.baseColorTexture?.index).toBeTypeOf("number");
    }
  });

  it.each(["academy-scholar-v1", "academy-an-v1", "academy-khoa-v1", "academy-minh-v1"])("has valid geometry and normalized skin weights for %s", (assetId) => {
    const { json, binary } = readGlb(assetId);
    const read = (id: number) => {
      const accessor = json.accessors[id], view = json.bufferViews[accessor.bufferView];
      const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type as string] ?? 0;
      const bytes = accessor.componentType === 5123 ? 2 : 4;
      return Array.from({ length: accessor.count * components }, (_, index) => {
        const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + index * bytes;
        return accessor.componentType === 5123 ? binary.readUInt16LE(offset)
          : accessor.componentType === 5125 ? binary.readUInt32LE(offset) : binary.readFloatLE(offset);
      });
    };
    for (const node of json.nodes.filter((node: { name?: string }) => node.name?.startsWith("Academy_"))) {
      const skin = json.skins[node.skin];
      expect(skin).toBeDefined();
      for (const primitive of json.meshes[node.mesh].primitives) {
        const positions = read(primitive.attributes.POSITION);
        expect(positions.every(Number.isFinite)).toBe(true);
        expect(read(primitive.indices).every(index => index >= 0 && index < positions.length / 3)).toBe(true);
        const weights = read(primitive.attributes.WEIGHTS_0), joints = read(primitive.attributes.JOINTS_0);
        for (let i = 0; i < weights.length; i += 4) {
          expect(weights.slice(i, i + 4).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 5);
        }
        expect(weights.every(weight => weight >= 0 && weight <= 1)).toBe(true);
        expect(joints.every(joint => joint >= 0 && joint < skin.joints.length)).toBe(true);
      }
    }
  });

  it("deforms the outfit through real walk/run/jump poses without detached or invalid vertices", async () => {
    const rig = await loadWorldVrmFixture(true, true);
    try {
      const garments: SkinnedMesh[] = [];
      rig.scene.traverse(node => { if (node instanceof SkinnedMesh && node.name.startsWith("Academy_")) garments.push(node); });
      expect(garments.length).toBeGreaterThan(4);
      const machine = createInitialAnimationMachineState(), point = new Vector3();
      let minimum = Infinity, maximum = -Infinity;
      for (let frame = 0; frame < 150; frame++) {
        const moving = frame >= 20 && frame < 100, running = frame >= 50;
        const airborne = frame >= 100 && frame < 125;
        stepAnimationStateMachine(machine, {
          isGrounded: !airborne, isMoving: moving, isRunning: moving && running,
          speed: moving ? running ? 4 : 2.2 : 0,
          velocityY: airborne ? (frame < 112 ? 2 : -2) : 0, jumpSpeed: 4.8
        }, 1 / 60);
        applyPoseToVrm(rig, evaluateBlendedPose(machine), machine.expressions, 1 / 60);
        rig.scene.updateWorldMatrix(true, true);
        if (frame % 5 !== 0) continue;
        for (const mesh of garments) {
          mesh.skeleton.update();
          const positions = mesh.geometry.attributes.position;
          let allVerticesFinite = true, maximumDistance = 0;
          for (let i = 0; i < positions.count; i += 11) {
            mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
            allVerticesFinite &&= Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
            maximumDistance = Math.max(maximumDistance, point.length());
            minimum = Math.min(minimum, point.y); maximum = Math.max(maximum, point.y);
          }
          expect(allVerticesFinite, mesh.name).toBe(true);
          expect(maximumDistance, mesh.name).toBeLessThan(2.5);
        }
      }
      expect(minimum).toBeGreaterThan(-0.03);
      expect(maximum).toBeGreaterThan(1.15);
    } finally { disposeCharacterVrm(rig.vrm); }
  });
});
