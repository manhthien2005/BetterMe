import fs from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

function model(name: string, directory = "public/models/characters") {
  const file = fs.readFileSync(`${directory}/${name}.vrm`);
  const jsonLength = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const binary = file.subarray(28 + jsonLength);
  const floats = (id: number): number[] => {
    const a = json.accessors[id], view = json.bufferViews[a.bufferView];
    return Array.from({ length: a.count * 3 }, (_, i) =>
      binary.readFloatLE((view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * 4));
  };
  return { file, json, binary, floats };
}

describe("Khoa male academy fitting", () => {
  it("uses the accepted mid-calf robe without a hood and mipmapped academy crests", () => {
    const khoa = model("academy-khoa-v1");
    const robe = khoa.json.meshes.find((mesh: { name: string }) => mesh.name === "Academy_Robe");
    const heights = robe.primitives.flatMap((primitive: { attributes: { POSITION: number } }) =>
      khoa.floats(primitive.attributes.POSITION).filter((_, index) => index % 3 === 1));
    expect(Math.min(...heights)).toBeGreaterThan(.25);
    expect(Math.min(...heights)).toBeLessThan(.39);
    expect(khoa.json.extras.khoaClothing.hood).toBe(false);
    for (const name of ["Khoa embroidered academy crest", "Khoa chest academy crest"]) {
      const material = khoa.json.materials.find((entry: { name: string }) => entry.name === name);
      expect(material).toBeDefined();
      const texture = khoa.json.textures[material.pbrMetallicRoughness.baseColorTexture.index];
      expect(khoa.json.samplers[texture.sampler].minFilter).toBe(9987);
    }
  });
  it("preserves the approved face, textured short hair, glasses and morph bytes", () => {
    const source = model("khoa-portrait-source", "scripts/assets"), khoa = model("academy-khoa-v1");
    expect(createHash("sha256").update(source.file).digest("hex"))
      .toBe("db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312");
    for (const name of ["Body", "Face", "Hair", "Academy_Glasses"]) {
      const before = source.json.meshes.find((mesh: { name: string }) => mesh.name === name);
      expect(before).toBeDefined();
      expect(khoa.json.meshes.find((mesh: { name: string }) => mesh.name === name)).toEqual(before);
    }
    expect(khoa.binary.subarray(0, source.json.buffers[0].byteLength)
      .equals(source.binary.subarray(0, source.json.buffers[0].byteLength))).toBe(true);
    expect(khoa.json.meshes.some((m: { name: string }) => m.name === "Academy_Skirt")).toBe(false);
  });

  it("pins the accepted player and current coordinated NPC fittings", () => {
    for (const [id, hash] of [
      ["academy-scholar-v1", "8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f"],
      ["academy-an-v1", "0b02133a385983dc88fbc2d618a0b558f514f981b3980e7f53a76d7d7fb6210d"],
      ["academy-minh-v1", "346976316274c1f48be2383864b77f9157e259cacaaa47486f631c97246c8ee0"]
    ]) {
      expect(createHash("sha256").update(fs.readFileSync(`public/models/characters/${id}.vrm`)).digest("hex")).toBe(hash);
    }
  });
});
