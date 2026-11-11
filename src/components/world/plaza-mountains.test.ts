import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxGeometry, Color, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MOUNTAIN_MODELS, MOUNTAIN_PLACEMENTS, createMountainInstances, loadPlazaMountains } from "./plaza-mountains";

function fixture() {
  const scene = new Group(), geometry = new BoxGeometry(20, 10, 12), material = new MeshStandardMaterial();
  scene.add(new Mesh(geometry, material));
  return { scene, geometry, material, gltf: { scene } as GLTF };
}
afterEach(() => vi.restoreAllMocks());

describe("authored mountains in Plaza", () => {
  it("ships the verified runtime derivatives within the whole-scene budget", () => {
    expect(MOUNTAIN_MODELS.reduce((sum, m) => sum + m.bytes, 0)).toBeLessThan(20_000_000);
    expect(MOUNTAIN_PLACEMENTS.reduce((sum, p) => sum + MOUNTAIN_MODELS.find(m => m.id === p.model)!.triangles, 0)).toBeLessThan(500_000);
    for (const model of MOUNTAIN_MODELS) {
      const bytes = readFileSync(`public/world/mountains/${model.id}.glb`);
      expect(bytes.length).toBe(model.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(model.sha256);
      expect(bytes.toString("utf8", 0, 4)).toBe("glTF");
    }
  });
  it("retains three distance bands with selective snow beyond the green foreground", () => {
    expect([0, 1, 2].map(band => MOUNTAIN_PLACEMENTS.filter(p => p.band === band).length)).toEqual([5, 9, 17]);
    expect(new Set(MOUNTAIN_PLACEMENTS.map(p => p.model)).size).toBe(6);
    const snowy = MOUNTAIN_PLACEMENTS.filter(p => p.snow > 0);
    expect(snowy.length).toBeGreaterThanOrEqual(4);
    expect(snowy.length).toBeLessThan(12);
    expect(snowy.every(p => p.band > 0 && Math.hypot(p.position[0], p.position[2]) >= 400)).toBe(true);
    for (const p of MOUNTAIN_PLACEMENTS) {
      expect(p.scale.every(n => Number.isFinite(n) && n > 0)).toBe(true);
      const m = MOUNTAIN_MODELS.find(m => m.id === p.model)!;
      const halfWidth = (m.bounds[1][0] - m.bounds[0][0]) * p.scale[0] / 2;
      const halfDepth = (m.bounds[1][2] - m.bounds[0][2]) * p.scale[2] / 2;
      expect(Math.hypot(p.position[0], p.position[2]) - Math.hypot(halfWidth, halfDepth)).toBeGreaterThan(150);
      expect(Math.hypot(...p.position) + Math.hypot(halfWidth, halfDepth, m.bounds[1][1] * p.scale[1])).toBeLessThan(1150);
    }
  });

  it("instances each material once and owns source and generated buffers exactly once", () => {
    const source = fixture(), release = vi.spyOn(source.geometry, "dispose"), releaseMat = vi.spyOn(source.material, "dispose");
    const owned = createMountainInstances(source.scene, MOUNTAIN_MODELS[0]);
    expect(owned.root.children).toHaveLength(1);
    const mesh = owned.root.children[0] as InstancedMesh;
    expect(mesh.isInstancedMesh).toBe(true);
    expect(mesh.count).toBe(MOUNTAIN_PLACEMENTS.filter(p => p.model === MOUNTAIN_MODELS[0].id).length);
    expect(mesh.geometry.getAttribute("mountainSnow").count).toBe(mesh.count);
    expect(mesh.castShadow).toBe(false);
    expect((mesh.material as MeshStandardMaterial).fog).toBe(false);
    const mergedRelease = vi.spyOn(mesh.geometry, "dispose"), instanceRelease = vi.spyOn(mesh, "dispose");
    owned.dispose(); owned.dispose();
    for (const spy of [release, releaseMat, mergedRelease, instanceRelease]) expect(spy).toHaveBeenCalledTimes(1);
  });

  it("starts at the current night palette and then smoothly follows environment changes", () => {
    const owned = createMountainInstances(fixture().scene, MOUNTAIN_MODELS[0]);
    const night = new Color("#182538"), day = new Color("#c7e7ef");
    owned.setAtmosphere(night, night, .2, .1);
    expect(owned.uniforms.mountainHorizon.value.equals(night)).toBe(true);
    expect(owned.uniforms.mountainSky.value.equals(night)).toBe(true);
    owned.setAtmosphere(day, day, .3, .25);
    expect(owned.uniforms.mountainHorizon.value.equals(night.clone().lerp(day, .25))).toBe(true);
    expect(owned.uniforms.mountainSky.value.equals(night.clone().lerp(day, .25))).toBe(true);
    expect(owned.uniforms.mountainHaze.value).toBe(.3);
    owned.dispose();
  });

  it("keeps solid rock in the opaque depth pass and preserves foliage cutouts", () => {
    const source = fixture(), leaves = new MeshStandardMaterial({ alphaTest: .4 });
    source.scene.add(new Mesh(source.geometry, leaves));
    const owned = createMountainInstances(source.scene, MOUNTAIN_MODELS[0]);
    try {
      for (const object of owned.root.children as InstancedMesh[]) {
        const material = object.material as MeshStandardMaterial;
        expect(material.transparent).toBe(false);
        expect(material.depthWrite).toBe(true);
        expect(material.opacity).toBe(1);
      }
      expect(leaves.alphaTest).toBe(.4);
      expect(source.material.alphaTest).toBe(0);
    } finally { owned.dispose(); }
  });

  it("releases a malformed source even when validation fails before batching", () => {
    const source = fixture(), bad = new MeshBasicMaterial();
    source.scene.add(new Mesh(source.geometry, bad));
    const release = vi.spyOn(source.geometry, "dispose"), badRelease = vi.spyOn(bad, "dispose");
    expect(() => createMountainInstances(source.scene, MOUNTAIN_MODELS[0])).toThrow("Unexpected mountain material");
    expect(release).toHaveBeenCalledTimes(1);expect(badRelease).toHaveBeenCalledTimes(1);
  });

  it("keeps successful models after one failure and releases pending results after unmount", async () => {
    const pending: { resolve: (g: GLTF) => void; reject: (e: Error) => void }[] = [];
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockImplementation(() => new Promise<GLTF>((resolve, reject) => pending.push({ resolve, reject })));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const parent = new Group(), owned = loadPlazaMountains(parent);
    expect(pending).toHaveLength(6);
    pending[0].reject(new Error("missing"));
    pending.slice(1).forEach(p => p.resolve(fixture().gltf));
    await owned.settled;
    expect(parent.userData.assetStatus).toBe("partial");
    expect(parent.children).toHaveLength(5);
    owned.dispose();owned.dispose();expect(parent.children).toHaveLength(0);
    const old = loadPlazaMountains(parent);old.dispose();
    const current = loadPlazaMountains(parent);
    const late = fixture(), released = vi.spyOn(late.geometry, "dispose");
    pending[6].resolve(late.gltf);pending.slice(7, 12).forEach(p => p.resolve(fixture().gltf));
    await old.settled;
    expect(released).toHaveBeenCalledTimes(1);
    expect(parent.children).toHaveLength(0);
    expect(parent.userData.assetStatus).toBe("loading");
    pending.slice(12).forEach(p => p.resolve(fixture().gltf));await current.settled;
    expect(parent.userData.assetStatus).toBe("ready");expect(parent.children).toHaveLength(6);
    current.dispose();
  });
});
