import type { Aabb2D, Vec3Tuple } from "./types";

export const PLAZA_HALF_EXTENTS = { x: 28, z: 24 } as const;
export const PLAZA_NATURE_MODELS = ["rock_moss_set_02", "fern_02", "tree_stump_01", "tree_small_02", "fir_sapling", "namaqualand_cliff_02"] as const;
export type PlazaNatureModel = typeof PLAZA_NATURE_MODELS[number];
export type NaturePlacement = {
  id: string; model: PlazaNatureModel; variant: number; position: Vec3Tuple;
  scale: Vec3Tuple; yaw: number; solidRadius?: number;
};

// Explicit pockets leave a 3m-wide outer loop at x=±23 / z=±19 and clear spokes.
export const PLAZA_PLANTING_BEDS = [
  { x: -11.5, z: .5, rx: 2.7, rz: 2.1 }, { x: 11.5, z: .5, rx: 2.7, rz: 2.1 },
  { x: -12.6, z: -10.6, rx: 2.6, rz: 2.2 }, { x: 12.9, z: -10.4, rx: 2.8, rz: 2.3 },
  { x: -12.5, z: 11.9, rx: 2.8, rz: 2.1 }, { x: 12.8, z: 11.5, rx: 2.7, rz: 2.4 },
  { x: -19, z: 8, rx: 2.8, rz: 4.2 }, { x: 18, z: -5, rx: 3.2, rz: 4.8 },
  { x: -8, z: -16, rx: 3.2, rz: 1.7 }, { x: 8, z: -16, rx: 3.2, rz: 1.7 },
  { x: 0, z: 15.7, rx: 5.2, rz: 1.4 }
] as const;

function placement(id: string, model: PlazaNatureModel, position: Vec3Tuple, scale: number | Vec3Tuple, yaw = 0, variant = 0, solidRadius?: number): NaturePlacement {
  return { id, model, position, scale: typeof scale === "number" ? [scale, scale, scale] : scale, yaw, variant, solidRadius };
}

export const PLAZA_NATURE_PLACEMENTS: readonly NaturePlacement[] = [
  placement("tree-west", "tree_small_02", [-11.5, -.04, .5], 1.25, 1.5),
  placement("tree-east", "tree_small_02", [11.5, -.04, .5], 1.1, -.4),
  placement("tree-nw", "tree_small_02", [-12.6, -.04, -10.6], 1.35, .3),
  placement("tree-sw", "tree_small_02", [-12.5, -.04, 11.9], 1.2, 2),
  placement("fir-ne", "fir_sapling", [12.9, -.03, -10.4], 3.8, -1.1),
  placement("fir-se", "fir_sapling", [12.8, -.03, 11.5], 3.4, -.7),
  placement("fir-north-west", "fir_sapling", [-8, -.03, -16], 4.2, .8, 0, .6),
  placement("fir-north-east", "fir_sapling", [8, -.03, -16], 3.7, 2, 0, .6),
  placement("fir-west-garden", "fir_sapling", [-19, -.03, 8], 3.9, 1, 0, .6),
  placement("fir-water-garden", "fir_sapling", [18, -.03, -7], 3.5, 2.4, 0, .6),
  ...[[-11.5, .5], [11.5, .5], [-12.6, -10.6], [-12.5, 11.9]].map(([x, z], i) =>
    placement(`root-${i}`, "tree_stump_01", [x, -.04, z], [.5, .32, .5], i * 1.7)),
  ...PLAZA_PLANTING_BEDS.flatMap((bed, i) => [0, 1, 2].map(j => {
    const a = i * 2.4 + j * 2.05;
    return placement(`fern-${i}-${j}`, "fern_02", [bed.x + Math.cos(a) * bed.rx * .65, .02, bed.z + Math.sin(a) * bed.rz * .65], .7 + (i % 3) * .14, a, j % 2);
  })),
  // Small ground-contact rocks around planted islands, away from circulation.
  ...PLAZA_PLANTING_BEDS.slice(0, 10).flatMap((bed, i) => [0, 1].map(j =>
    placement(`bed-rock-${i}-${j}`, "rock_moss_set_02", [bed.x + (j ? 1 : -1) * bed.rx * .62, -.08, bed.z + bed.rz * .45], [.65, .5, .65], i * 1.3 + j, (i + j) % 3, .5))),
  // Broken natural rim, not a solid wall: overlooks remain open.
  ...Array.from({ length: 16 }, (_, i) => {
    const side = Math.floor(i / 4), along = -18 + (i % 4) * 12;
    return placement(`rim-rock-${i}`, "rock_moss_set_02", [side < 2 ? (side ? 27 : -27) : along, -.15, side < 2 ? along : (side === 2 ? -23 : 23)], [1.3, .8, 1.1], i * 1.37, i % 3, .9);
  }),
  ...[[-22, -27, 0], [0, -27, 0], [22, -27, 0], [-30, 7, Math.PI / 2], [30, 7, -Math.PI / 2], [0, 27, Math.PI]].map(([x, z, yaw], i) =>
    placement(`cliff-${i}`, "namaqualand_cliff_02", [x, -5.5, z], [1, .77, .8], yaw))
];

export const PLAZA_RIM_LANTERNS: readonly Vec3Tuple[] = [[-21, 0, 12], [21, 0, 12], [-7, 0, 20.8], [7, 0, 20.8], [-21, 0, -16], [21, 0, -16]];

export const PLAZA_NATURE_COLLIDERS: readonly Aabb2D[] = [...PLAZA_NATURE_PLACEMENTS.flatMap(p => p.solidRadius ? [{
  id: p.id, minX: p.position[0] - p.solidRadius, maxX: p.position[0] + p.solidRadius,
  minZ: p.position[2] - p.solidRadius, maxZ: p.position[2] + p.solidRadius, maxY: p.model === "fir_sapling" ? 5.5 : 1.1
}] : []), ...PLAZA_RIM_LANTERNS.map(([x, , z], i) => ({
  id: `rim-lantern-${i}`, minX: x - .3, maxX: x + .3, minZ: z - .3, maxZ: z + .3, maxY: 1.35
}))];

// Pavilion has a flush floor; side railings, four posts and roof match the visual.
export const PLAZA_PAVILION_COLLIDERS: readonly Aabb2D[] = [
  ...[-2.1952, 2.1952].map(z => ({ id: `pavilion-rail-${z}`, minX: -21.55, maxX: -18.45, minZ: -6.3 + z - .08, maxZ: -6.3 + z + .08, maxY: .86, blockCamera: true })),
  ...[-1.6576, 1.6576].flatMap(x => [-2.1952, 2.1952].map(z => ({
    id: `pavilion-post-${x}-${z}`, minX: -20 + x - .32, maxX: -20 + x + .32, minZ: -6.3 + z - .32, maxZ: -6.3 + z + .32, maxY: 4.2, blockCamera: true
  }))),
  { id: "pavilion-roof", minX: -22.8, maxX: -17.2, minZ: -9.8, maxZ: -2.8, minY: 3.8, maxY: 6, cameraOnly: true, blockCamera: true }
];
