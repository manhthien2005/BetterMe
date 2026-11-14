import { Group, type Mesh } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeNatureResources } from "./plaza-nature-resources";
import { prepareIslandV2 } from "./island-v2/prepare";

// Near foreground islands lead to the low three-tier island, then a distant skyline.
export const FLOATING_ISLAND_PLACEMENTS = [
  { id: "vuon-gio", url: "/world/floating-islands/lod/vuon-gio.glb", position: [-78, -9, -28], scale: .55, yaw: .3 },
  { id: "thien-vien", url: "/world/floating-islands/lod/thien-vien.glb", position: [-36, 20, -228], scale: 1.05, yaw: -.28 },
  { id: "thac-tang", url: "/world/floating-islands/lod/thac-tang.glb", position: [40, -16, -100], scale: 1, yaw: -.35 },
  { id: "nguyet-ho", url: "/world/floating-islands/lod/nguyet-ho.glb", position: [-48, 3, -64], scale: .60, yaw: .8 },
  { id: "song-dinh", url: "/world/floating-islands/lod/song-dinh.glb", position: [85, 22, -200], scale: .75, yaw: -1 },
  { id: "tan-may", url: "/world/floating-islands/lod/tan-may.glb", position: [-22, -5, -38], scale: .55, yaw: -.5 },
  { id: "phong-dang", url: "/world/floating-islands/lod/phong-dang.glb", position: [35, -2, -34], scale: .60, yaw: 2 }
] as const;

/** Owns one fresh GLTF and its placement; nothing enters a global asset cache. */
export function createFloatingIsland(source: Group, placement: typeof FLOATING_ISLAND_PLACEMENTS[number], allWaters: Mesh[] = []) {
  const placed = new Group();
  placed.position.fromArray(placement.position);
  placed.rotation.y = placement.yaw;
  placed.scale.setScalar(placement.scale);
  placed.add(source);
  // Water planes and effect anchors use the same baked world placement as meshes.
  const island = prepareIslandV2(placed, allWaters);
  island.root.name = `plaza-floating-island-${placement.id}`;
  island.root.userData.assetId = placement.id;
  return island;
}

/** A mount owns its pending loads too, so a late result cannot leak into another visit. */
export function loadFloatingIslands(parent: Group) {
  const islands: ReturnType<typeof createFloatingIsland>[] = [];
  const allWaters: Mesh[] = [];
  let cancelled = false;
  parent.userData.assetStatus = "loading";
  parent.userData.failedAssets = [];
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let cursor = 0;
  async function loadNext() {
   while (!cancelled && cursor < FLOATING_ISLAND_PLACEMENTS.length) {
    const placement = FLOATING_ISLAND_PLACEMENTS[cursor++];
    try {
      const gltf = await loader.loadAsync(placement.url);
      if (cancelled) { disposeNatureResources(gltf.scene); return; }
      const island = createFloatingIsland(gltf.scene, placement, allWaters);
      islands.push(island);
      parent.add(island.root);
    } catch {
      if (!cancelled) {
        parent.userData.failedAssets.push(placement.id);
        console.warn(`Plaza floating island scenery unavailable: ${placement.id}`);
      }
    }
   }
  }
  // Bound simultaneous parsing/batching of these detailed art assets.
  const settled = Promise.all([loadNext(), loadNext()]).then(() => {
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
