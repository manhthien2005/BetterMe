// @vitest-environment node
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PLAZA_NATURE_PLACEMENTS } from "@/lib/world/plaza-nature-layout";

const root = path.resolve("public/world/plaza-nature");
describe("shipped textured Plaza kit", () => {
  it("anchors trees at the foot of the trunk, not the asymmetric canopy", () => {
    for (const [id, primitive] of [["tree_small_02", 2], ["fir_sapling", 0]] as const) {
      const gltf = JSON.parse(readFileSync(path.join(root, id, "model.gltf"), "utf8"));
      const binary = readFileSync(path.join(root, id, "model.bin"));
      const a = gltf.accessors[gltf.meshes[0].primitives[primitive].attributes.POSITION];
      const view = gltf.bufferViews[a.bufferView];
      const min = [Infinity, Infinity], max = [-Infinity, -Infinity];
      let count = 0;
      for (let i = 0; i < a.count; i++) {
        const offset = view.byteOffset + i * 12;
        if (binary.readFloatLE(offset + 4) > .05) continue;
        count++;
        for (const [axis, component] of [0, 2].entries()) {
          const value = binary.readFloatLE(offset + component * 4);
          min[axis] = Math.min(min[axis], value);
          max[axis] = Math.max(max[axis], value);
        }
      }
      expect(count).toBeGreaterThan(3);
      for (let axis = 0; axis < 2; axis++) expect(Math.abs((min[axis] + max[axis]) / 2), id).toBeLessThan(.025);
    }
  });
  it("matches the shipped hashes and keeps every placed variant under the triangle budget", () => {
    const provenance = JSON.parse(readFileSync(path.join(root, "provenance.json"), "utf8"));
    for (const entry of [...provenance.models, ...provenance.surfaces]) for (const file of entry.shippedFiles) {
      const bytes = readFileSync(path.join(root, file.path));
      expect(bytes.length).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
    }
    let total = 0;
    for (const p of PLAZA_NATURE_PLACEMENTS) {
      const model = provenance.models.find((m: { id: string }) => m.id === p.model);
      expect(model.variants[p.variant]).toBeDefined();
      total += model.variants[p.variant].triangles;
    }
    expect(total).toBeLessThan(300000);
  });
  it("ships locally referenced UV/normal-mapped meshes and provenance under 25MB", () => {
    const provenance = JSON.parse(readFileSync(path.join(root, "provenance.json"), "utf8"));
    expect(provenance.models.length).toBeGreaterThanOrEqual(5);
    let bytes = 0;
    function count(dir: string) {
      for (const name of readdirSync(dir)) {
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) count(file);
        else bytes += statSync(file).size;
      }
    }
    count(root);
    expect(bytes).toBeLessThan(25 * 1024 * 1024);
    for (const model of provenance.models) {
      expect(model.license).toBe("CC0-1.0");
      expect(model.sourceFiles.every((f: { md5: string }) => /^[a-f0-9]{32}$/.test(f.md5))).toBe(true);
      const gltf = JSON.parse(readFileSync(path.join(root, model.id, "model.gltf"), "utf8"));
      const binary = readFileSync(path.join(root, model.id, "model.bin"));
      for (const file of [...gltf.buffers, ...gltf.images]) {
        expect(file.uri).not.toMatch(/https?:/);
        expect(file.uri.includes("..")).toBe(false);
        expect(statSync(path.join(root, model.id, file.uri)).size).toBeGreaterThan(0);
      }
      for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
        expect(p.attributes.TEXCOORD_0).toBeDefined();
        expect(p.attributes.NORMAL).toBeDefined();
        const m = gltf.materials[p.material];
        expect(m.normalTexture).toBeDefined();
        expect(m.pbrMetallicRoughness.baseColorTexture).toBeDefined();
        expect(gltf.accessors[p.indices].count / 3).toBeLessThanOrEqual(18000);
        const vertexCount = gltf.accessors[p.attributes.POSITION].count;
        const a = gltf.accessors[p.indices], v = gltf.bufferViews[a.bufferView];
        let indicesValid = true;
        for (let i = 0; i < a.count; i++) if (binary.readUInt32LE(v.byteOffset + i * 4) >= vertexCount) indicesValid = false;
        expect(indicesValid).toBe(true);
        for (const index of Object.values(p.attributes) as number[]) {
          const attr = gltf.accessors[index], view = gltf.bufferViews[attr.bufferView];
          expect(attr.count).toBe(vertexCount);
          let finite = true;
          for (let offset = view.byteOffset; offset < view.byteOffset + view.byteLength; offset += 4) if (!Number.isFinite(binary.readFloatLE(offset))) finite = false;
          expect(finite).toBe(true);
        }
      }
    }
  });
});
