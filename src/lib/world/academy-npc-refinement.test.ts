import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("An and Minh coordinated academy clothing", () => {
  it.each(["an", "minh"])("gives %s a compact collar and garment-bound academy crests", (role) => {
    const file = fs.readFileSync(`public/models/characters/academy-${role}-v1.vrm`);
    const length = file.readUInt32LE(12);
    const gltf = JSON.parse(file.subarray(20, 20 + length).toString());
    const binary = file.subarray(28 + length);
    const collarMaterial = gltf.materials.findIndex((m: { name: string }) => m.name === "Academy compact collar");
    expect(collarMaterial).toBeGreaterThan(-1);
    const uniform = gltf.meshes.find((m: { name: string }) => m.name === "Academy_Uniform");
    const collar = uniform.primitives.find((p: { material: number }) => p.material === collarMaterial);
    const accessor = gltf.accessors[collar.attributes.POSITION];
    const offset = (gltf.bufferViews[accessor.bufferView].byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const points = Array.from({ length: accessor.count * 3 }, (_, i) => binary.readFloatLE(offset + i * 4));
    const xs = points.filter((_, i) => i % 3 === 0), ys = points.filter((_, i) => i % 3 === 1);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(.09);
    expect(Math.min(...ys)).toBeGreaterThan(1.25);
    const embroidery = gltf.meshes.find((m: { name: string }) => m.name === "Academy_Embroidery");
    expect(embroidery).toBeDefined();
    for (const name of ["Academy back crest", "Academy chest crest"]) {
      const materialId = gltf.materials.findIndex((m: { name: string }) => m.name === name);
      expect(materialId).toBeGreaterThan(-1);
      const material = gltf.materials[materialId];
      expect(material.alphaMode).toBe("MASK");
      const texture = gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index];
      expect(gltf.samplers[texture.sampler].minFilter).toBe(9987);
      const primitive = embroidery.primitives.find((p: { material: number }) => p.material === materialId);
      expect(primitive.attributes.JOINTS_0).toBeTypeOf("number");
      expect(primitive.attributes.WEIGHTS_0).toBeTypeOf("number");
    }
    const triangles = embroidery.primitives.reduce((total: number, p: { indices: number }) =>
      total + gltf.accessors[p.indices].count / 3, 0);
    expect(triangles).toBeLessThan(1500);
    expect(gltf.meshes.some((m: { name: string }) => m.name === "Academy_RoleDetails")).toBe(true);
  });
});
