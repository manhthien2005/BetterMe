import { afterEach, describe, expect, it, vi } from "vitest";
import { Box3, BoxGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Quaternion, ShaderLib, Vector3, type WebGLRenderer } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MOUNTAIN_MODELS, MOUNTAIN_PLACEMENTS, createMountainInstances, loadPlazaMountains } from "./plaza-mountains";
import { FLOATING_ISLAND_PLACEMENTS } from "./plaza-floating-islands";
import islands from "../../../public/world/floating-islands/manifest.json";

function fixture() {
  const scene = new Group(), geometry = new BoxGeometry(20, 10, 12), material = new MeshStandardMaterial();
  scene.add(new Mesh(geometry, material));
  return { scene, geometry, material, gltf: { scene } as GLTF };
}
afterEach(() => vi.restoreAllMocks());

describe("authored mountains in Plaza", () => {
  it("ships the verified runtime derivatives within the whole-scene budget", () => {
    expect(MOUNTAIN_MODELS.map(m => m.id)).toEqual(["son-tru", "thach-linh", "khe-reu", "ban-thach", "van-son", "thien-mach", "cong-may", "doc-van", "thanh-son", "vien-phong"]);
    expect(MOUNTAIN_MODELS.reduce((sum, m) => sum + m.bytes, 0)).toBeLessThan(12_000_000);
    expect(MOUNTAIN_PLACEMENTS.reduce((sum, p) => sum + MOUNTAIN_MODELS.find(m => m.id === p.model)!.triangles, 0)).toBeLessThan(600_000);
    for (const model of MOUNTAIN_MODELS) {
      const bytes = readFileSync(`public/world/mountains/${model.id}.glb`);
      expect(bytes.length).toBe(model.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(model.sha256);
      expect(bytes.toString("utf8", 0, 4)).toBe("glTF");
    }
  });

  it("keeps Cong May's upper ridges narrower than their shoulders instead of two extruded columns", () => {
    const raw = readFileSync("public/world/mountains/cong-may.glb");
    const jsonLength = raw.readUInt32LE(12);
    const gltf = JSON.parse(raw.toString("utf8", 20, 20 + jsonLength));
    const rock = gltf.nodes.find((node: { extras?: { mountainRole?: string } }) => node.extras?.mountainRole === "rock");
    const positions: [number, number, number][] = [];
    for (const primitive of gltf.meshes[rock.mesh].primitives) {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      expect(accessor.componentType).toBe(5126);
      const view = gltf.bufferViews[accessor.bufferView];
      const start = 28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
      for (let i = 0; i < accessor.count; i++) {
        const offset = start + i * (view.byteStride ?? 12);
        positions.push([raw.readFloatLE(offset), raw.readFloatLE(offset + 4), raw.readFloatLE(offset + 8)]);
      }
    }
    const width = (points: number[][]) => Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0]));
    for (const left of [true, false]) {
      const lobe = positions.filter(p => (p[0] < 0) === left);
      const top = Math.max(...lobe.map(p => p[1]));
      const shoulderHeight = 12.3 + (top - 12.3) * .15;
      const shoulder = lobe.filter(p => Math.abs(p[1] - shoulderHeight) < .6);
      const crest = lobe.filter(p => p[1] > top - 2);
      expect(width(crest) / width(shoulder)).toBeLessThan(.72);
      expect(width(crest)).toBeGreaterThan(4); // Keep broad karst crests, not pointed cones.
    }
  });
  it("retains three distance bands with selective snow beyond the green foreground", () => {
    expect([0, 1, 2].map(band => MOUNTAIN_PLACEMENTS.filter(p => p.band === band).length)).toEqual([4, 4, 8]);
    expect(new Set(MOUNTAIN_PLACEMENTS.map(p => p.model)).size).toBe(10);
    const snowy = MOUNTAIN_PLACEMENTS.filter(p => p.snow > 0);
    expect(snowy.length).toBeGreaterThanOrEqual(2);
    expect(snowy.length).toBeLessThanOrEqual(4);
    expect(snowy.every(p => p.band > 0 && Math.hypot(p.position[0], p.position[2]) >= 400)).toBe(true);
    for (const p of MOUNTAIN_PLACEMENTS) {
      expect(p.scale.every(n => Number.isFinite(n) && n > 0)).toBe(true);
      expect(p.scale).toEqual([p.scale[0], p.scale[0], p.scale[0]]);
      const m = MOUNTAIN_MODELS.find(m => m.id === p.model)!;
      expect(m.band).toBe(["near", "mid", "far"][p.band]);
      const halfWidth = (m.bounds[1][0] - m.bounds[0][0]) * p.scale[0] / 2;
      const halfDepth = (m.bounds[1][2] - m.bounds[0][2]) * p.scale[2] / 2;
      expect(Math.hypot(p.position[0], p.position[2]) - Math.hypot(halfWidth, halfDepth)).toBeGreaterThan(150);
      expect(Math.hypot(...p.position) + Math.hypot(halfWidth, halfDepth, m.bounds[1][1] * p.scale[1])).toBeLessThan(1150);
    }
  });

  it("surrounds Plaza with staggered depth bands and deliberate sky gaps", () => {
    for (const band of [0, 1, 2]) {
      const items = MOUNTAIN_PLACEMENTS.filter(p => p.band === band);
      const angles = items.map(p => (Math.atan2(p.position[0], -p.position[2]) + Math.PI * 2) % (Math.PI * 2)).sort((a,b) => a-b);
      const gaps = angles.map((a,i) => ((angles[(i+1)%angles.length]-a)+Math.PI*2)%(Math.PI*2));
      expect(Math.max(...gaps)).toBeLessThan((band === 2 ? 65 : 115) * Math.PI / 180);
      expect(Math.min(...gaps)).toBeGreaterThan(25 * Math.PI / 180);
      expect(items.some(p => p.position[2] > 0)).toBe(true);
      expect(items.some(p => p.position[2] < 0)).toBe(true);
    }
  });

  it("keeps rotated mountain bounds clear of the seven floating islands", () => {
    const transform = (position: readonly number[], yaw: number, scale: number) => new Matrix4().compose(
      new Vector3(...position), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw), new Vector3(scale, scale, scale)
    );
    for (const p of MOUNTAIN_PLACEMENTS) {
      const model = MOUNTAIN_MODELS.find(m => m.id === p.model)!;
      const mountain = new Box3(new Vector3(...model.bounds[0]), new Vector3(...model.bounds[1]))
        .applyMatrix4(transform(p.position, p.yaw, p.scale[0]));
      for (const island of FLOATING_ISLAND_PLACEMENTS) {
        const [min, max] = islands.models.find(m => m.id === island.id)!.boundsBlender;
        // Approved island manifest uses Blender Z-up; GLTF is Y-up.
        const bounds = new Box3(new Vector3(min[0], min[2], -max[1]), new Vector3(max[0], max[2], -min[1]))
          .applyMatrix4(transform(island.position, island.yaw, island.scale)).expandByScalar(12);
        expect(mountain.intersectsBox(bounds), `${p.model} overlaps ${island.id}`).toBe(false);
      }
    }
  });

  it("preserves V6 canopy normals and applies snow only to rock, never foliage or ruins", () => {
    const source = fixture();source.scene.children[0].userData.mountainRole = "rock";
    const leaves = new MeshStandardMaterial();leaves.name = "Mountain island leaves";
    const canopy = new Mesh(source.geometry, leaves);canopy.userData.mountainRole = "tree";
    source.scene.add(canopy);
    const model = MOUNTAIN_MODELS.find(m => m.id === "vien-phong")!;
    const owned = createMountainInstances(source.scene, model);
    try {
      const meshes = owned.root.children as InstancedMesh[];
      const leafMesh = meshes.find(m => m.material === leaves)!;
      expect(Array.from(leafMesh.geometry.getAttribute("mountainSnow").array).every(n => n === 0)).toBe(true);
      expect(Array.from(meshes.find(m => m.material === source.material)!.geometry.getAttribute("mountainSnow").array).some(n => n > 0)).toBe(true);
      const shader = {uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader} as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
      leaves.onBeforeCompile(shader, {} as WebGLRenderer);
      expect(shader.fragmentShader).toContain("normal *= faceDirection");
    } finally { owned.dispose(); }
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
    const count = MOUNTAIN_MODELS.length;
    expect(pending).toHaveLength(count);
    pending[0].reject(new Error("missing"));
    pending.slice(1).forEach(p => p.resolve(fixture().gltf));
    await owned.settled;
    expect(parent.userData.assetStatus).toBe("partial");
    expect(parent.children).toHaveLength(count - 1);
    owned.dispose();owned.dispose();expect(parent.children).toHaveLength(0);
    const old = loadPlazaMountains(parent);old.dispose();
    const current = loadPlazaMountains(parent);
    const late = fixture(), released = vi.spyOn(late.geometry, "dispose");
    pending[count].resolve(late.gltf);pending.slice(count + 1, count * 2).forEach(p => p.resolve(fixture().gltf));
    await old.settled;
    expect(released).toHaveBeenCalledTimes(1);
    expect(parent.children).toHaveLength(0);
    expect(parent.userData.assetStatus).toBe("loading");
    pending.slice(count * 2).forEach(p => p.resolve(fixture().gltf));await current.settled;
    expect(parent.userData.assetStatus).toBe("ready");expect(parent.children).toHaveLength(count);
    current.dispose();
  });
});
