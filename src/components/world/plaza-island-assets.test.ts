import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../../../public/world/floating-islands/manifest.json";

describe("approved V2 runtime asset collection", () => {
  it("contains exactly the seven approved models and no legacy reference", () => {
    const ids = ["vuon-gio", "thien-vien", "thac-tang", "nguyet-ho", "song-dinh", "tan-may", "phong-dang"];
    expect(manifest.models.map(model => model.id).sort()).toEqual(ids.sort());
    expect(readdirSync("public/world/floating-islands").filter(file => file.endsWith(".glb")).sort())
      .toEqual(ids.map(id => `${id}.glb`).sort());
    expect(existsSync("public/world/floating-island/owner-rim-v4.glb")).toBe(false);
  });

  it("matches the delivered GLB fingerprints and the immutable Vườn Gió reference", () => {
    for (const model of manifest.models) {
      const bytes = readFileSync(`public/world/floating-islands/${model.id}.glb`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(model.sha256);
      expect(bytes.length).toBe(model.bytes);
    }
    expect(manifest.models.find(model => model.id === "vuon-gio")?.sha256)
      .toBe("dd9f43ba6dc4dc19220d6f77b4b14e1dabdf420638a05984c17a9dec3b44f779");
  });

  it("provides a separate distant collection within the transfer and triangle budget", () => {
    const file = "public/world/floating-islands/lod/manifest.json";
    expect(existsSync(file)).toBe(true);
    const lod = JSON.parse(readFileSync(file, "utf8")) as { models: { id: string; bytes: number; triangles: number; sha256: string; parentSha256: string }[]; textures: { file: string; bytes: number; sha256: string }[] };
    expect(lod.models.map(model => model.id)).toEqual(manifest.models.map(model => model.id));
    expect(lod.models.reduce((sum, model) => sum + model.bytes, 0) + lod.textures.reduce((sum, texture) => sum + texture.bytes, 0)).toBeLessThan(45_000_000);
    // Retain denser canopy silhouettes after the first distant-LOD visual comparison.
    expect(lod.models.reduce((sum, model) => sum + model.triangles, 0)).toBeLessThan(1_800_000);
    for (const texture of lod.textures) {
      const bytes = readFileSync(`public/world/floating-islands/lod/${texture.file}`);
      expect(bytes.length).toBe(texture.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(texture.sha256);
    }
    for (const model of lod.models) {
      const source = manifest.models.find(original => original.id === model.id)!;
      expect(model.parentSha256).toBe(source.sha256);
      const bytes = readFileSync(`public/world/floating-islands/lod/${model.id}.glb`);
      expect(bytes.length).toBe(model.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(model.sha256);
      const json = JSON.parse(bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)));
      const rawSource = readFileSync(`public/world/floating-islands/${model.id}.glb`);
      const original = JSON.parse(rawSource.toString("utf8", 20, 20 + rawSource.readUInt32LE(12)));
      expect(json.nodes).toEqual(original.nodes);
      expect(json.materials).toEqual(original.materials);
      expect(json.scenes).toEqual(original.scenes);
      expect(json.extensionsRequired).toContain("EXT_meshopt_compression");
      const triangles = json.nodes.reduce((sum: number, node: { mesh?: number }) => sum + (node.mesh === undefined ? 0 :
        json.meshes[node.mesh].primitives.reduce((n: number, p: { indices: number }) => n + json.accessors[p.indices].count / 3, 0)), 0);
      expect(triangles).toBe(model.triangles);
    }
  });
});
