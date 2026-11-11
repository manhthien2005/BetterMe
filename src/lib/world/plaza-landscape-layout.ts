import type { Aabb2D, Vec3Tuple } from "./types";

export type PlazaGardenKind = "tree" | "lantern" | "planter";
export type PlazaGardenAsset = {
  id: string;
  kind: PlazaGardenKind;
  position: Vec3Tuple;
  scale: number;
  rotation: number;
  blossom?: boolean;
};

/** Keep the central circulation and both NPC approaches open. */
export const PLAZA_GARDEN_ASSETS: readonly PlazaGardenAsset[] = [
  { id: "plaza-garden-nw-tree", kind: "tree", position: [-12.6, 0, -10.6], scale: 1.25, rotation: 0.3, blossom: true },
  { id: "plaza-garden-ne-tree", kind: "tree", position: [12.9, 0, -10.4], scale: 1.1, rotation: -1.1 },
  { id: "plaza-garden-sw-tree", kind: "tree", position: [-12.5, 0, 11.9], scale: 1.15, rotation: 2, blossom: true },
  { id: "plaza-garden-se-tree", kind: "tree", position: [12.8, 0, 11.5], scale: 0.95, rotation: -0.7 },
  { id: "plaza-garden-nw-planter", kind: "planter", position: [-8.5, 0, -10.6], scale: 1, rotation: 0 },
  { id: "plaza-garden-ne-planter", kind: "planter", position: [8.5, 0, -10.6], scale: 1, rotation: 0 },
  { id: "plaza-garden-sw-planter", kind: "planter", position: [-9.3, 0, 9], scale: 1, rotation: 0 },
  { id: "plaza-garden-se-planter", kind: "planter", position: [9.3, 0, 9], scale: 1, rotation: 0 },
  { id: "plaza-lantern-nw", kind: "lantern", position: [-4.8, 0, -11.6], scale: 1, rotation: 0 },
  { id: "plaza-lantern-ne", kind: "lantern", position: [4.8, 0, -11.6], scale: 1, rotation: 0 },
  { id: "plaza-lantern-west", kind: "lantern", position: [-8.9, 0, 0.8], scale: 1, rotation: 0 },
  { id: "plaza-lantern-east", kind: "lantern", position: [8.9, 0, 0.8], scale: 1, rotation: 0 },
  { id: "plaza-lantern-sw", kind: "lantern", position: [-5.6, 0, 11.6], scale: 1, rotation: 0 },
  { id: "plaza-lantern-se", kind: "lantern", position: [5.6, 0, 11.6], scale: 1, rotation: 0 }
];

export const PLAZA_LANDSCAPE_COLLIDERS: readonly Aabb2D[] = PLAZA_GARDEN_ASSETS.map((asset) => {
  const halfWidth = (asset.kind === "tree" ? 0.62 : asset.kind === "planter" ? 1.05 : 0.48) * asset.scale;
  const halfDepth = (asset.kind === "planter" ? 0.7 : asset.kind === "tree" ? 0.62 : 0.48) * asset.scale;
  return {
    id: asset.id,
    minX: asset.position[0] - halfWidth,
    maxX: asset.position[0] + halfWidth,
    minZ: asset.position[2] - halfDepth,
    maxZ: asset.position[2] + halfDepth,
    maxY: (asset.kind === "tree" ? 4.8 : asset.kind === "planter" ? 0.65 : 1.6) * asset.scale
  };
});
