import { Group, Mesh, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { disposeNatureResources } from "./plaza-nature-resources";
import { createIslandWaterEffects } from "./plaza-island-water";

// Near foreground islands lead to the low three-tier island, then a distant skyline.
export const FLOATING_ISLAND_PLACEMENTS = [
  { id: "mach-nguon", url: "/world/floating-island/owner-rim-v4.glb", position: [-78, -9, -28], scale: .55, yaw: .3 },
  { id: "thien-vien", url: "/world/floating-islands/thien-vien.glb", position: [-36, 20, -228], scale: 1.05, yaw: -.28 },
  { id: "thac-tang", url: "/world/floating-islands/thac-tang.glb", position: [40, -16, -100], scale: 1, yaw: -.35 },
  { id: "nguyet-ho", url: "/world/floating-islands/nguyet-ho.glb", position: [-48, 3, -64], scale: .60, yaw: .8 },
  { id: "song-dinh", url: "/world/floating-islands/song-dinh.glb", position: [85, 22, -200], scale: .75, yaw: -1 },
  { id: "tan-may", url: "/world/floating-islands/tan-may.glb", position: [-22, -5, -38], scale: .55, yaw: -.5 },
  { id: "phong-dang", url: "/world/floating-islands/phong-dang.glb", position: [35, -2, -34], scale: .60, yaw: 2 }
] as const;

/** Owns one fresh GLTF and its placement; nothing enters a global asset cache. */
export function createFloatingIsland(source: Group, placement: typeof FLOATING_ISLAND_PLACEMENTS[number]) {
  const root = new Group();
  root.name = `plaza-floating-island-${placement.id}`;
  const batches = new Map<string, { source: Mesh; parts: BufferGeometry[] }>();
  source.updateMatrixWorld(true);
  source.traverse(object => {
    if (!(object instanceof Mesh)) return;
    if (object.userData.waterKind || Array.isArray(object.material)) {
      const copy = object.clone();
      object.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
      root.add(copy);
      return;
    }
    // Keep distinct vertex layouts (including the artist's second color layer).
    const key = `${object.material.uuid}:${Object.keys(object.geometry.attributes).sort().join(",")}`;
    let batch = batches.get(key);
    if (!batch) { batch = { source: object, parts: [] }; batches.set(key, batch); }
    batch.parts.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
  });
  try { for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.parts);
    if (!geometry) throw new Error("Cannot batch approved floating island geometry");
    const mesh = new Mesh(geometry, batch.source.material);
    mesh.name = `island-batch-${batch.source.material instanceof Array ? "multi" : batch.source.material.name}`;
    // Distant scenery lies outside the Plaza shadow camera; no extra shadow pass.
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
  } } catch (error) {
    root.add(source);
    disposeNatureResources(root);
    throw error;
  } finally {
    batches.forEach(batch => batch.parts.forEach(part => part.dispose()));
  }
  root.position.fromArray(placement.position);
  root.rotation.y = placement.yaw;
  root.scale.setScalar(placement.scale);
  const water = createIslandWaterEffects(root);
  let disposed = false;
  return {
    root, water,
    dispose() {
      if (disposed) return;
      disposed = true;
      water.dispose();
      // Includes original water materials and all shared source/batched resources.
      root.add(source);
      disposeNatureResources(root);
      root.clear();
    }
  };
}

/** A mount owns its pending loads too, so a late result cannot leak into another visit. */
export function loadFloatingIslands(parent: Group) {
  const islands: ReturnType<typeof createFloatingIsland>[] = [];
  let cancelled = false;
  parent.userData.assetStatus = "loading";
  parent.userData.failedAssets = [];
  const loader = new GLTFLoader();
  const settled = Promise.all(FLOATING_ISLAND_PLACEMENTS.map(async placement => {
    try {
      const gltf = await loader.loadAsync(placement.url);
      if (cancelled) { disposeNatureResources(gltf.scene); return; }
      const island = createFloatingIsland(gltf.scene, placement);
      islands.push(island);
      parent.add(island.root);
    } catch {
      if (!cancelled) {
        parent.userData.failedAssets.push(placement.id);
        console.warn(`Plaza floating island scenery unavailable: ${placement.id}`);
      }
    }
  })).then(() => {
    if (!cancelled) parent.userData.assetStatus = islands.length === FLOATING_ISLAND_PLACEMENTS.length
      ? "ready" : islands.length ? "partial" : "failed";
  });
  return {
    islands, settled,
    dispose() {
      if (cancelled) return;
      cancelled = true;
      islands.forEach(island => { parent.remove(island.root); island.dispose(); });
      islands.length = 0;
    }
  };
}
