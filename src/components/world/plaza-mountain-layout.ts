export type MountainPlacement = {
  model: string; band: number; position: [number, number, number];
  scale: [number, number, number]; yaw: number; snow: number;
};

function peak(model: string, band: number, bearing: number, radius: number, base: number, scale: number, turn = 0, snow = 0): MountainPlacement {
  const angle = bearing * Math.PI / 180;
  return {
    model, band, position: [Math.sin(angle) * radius, base, -Math.cos(angle) * radius],
    scale: [scale, scale, scale], yaw: -angle + turn, snow
  };
}

// Stagger the three bands around the islands, leaving sky between silhouettes.
// Uniform scale keeps the authored trees, ruin footings and rock proportions intact.
export const MOUNTAIN_PLACEMENTS: MountainPlacement[] = [
  peak("son-tru", 0, -64, 260, -48, 3.6, .12),
  peak("thach-linh", 0, 47, 285, -43, 3.6, -.18),
  peak("khe-reu", 0, 139, 235, -44, 3.2, .25),
  peak("ban-thach", 0, -131, 270, -48, 3.6, -.12),

  peak("van-son", 1, -12, 450, -66, 5.2, -.1),
  peak("thien-mach", 1, 83, 480, -66, 5.4, .15),
  peak("cong-may", 1, 176, 420, -50, 5, .1),
  peak("doc-van", 1, -100, 455, -62, 5.8, .18),

  peak("thanh-son", 2, -166, 710, -82, 8.2, .18),
  peak("vien-phong", 2, -122, 780, -82, 5.8, -.12, .85),
  peak("thanh-son", 2, -78, 660, -78, 8.8, -.18),
  peak("vien-phong", 2, -33, 820, -82, 6.1, .22, 1),
  peak("thanh-son", 2, 12, 730, -80, 8.5, .12),
  peak("vien-phong", 2, 57, 790, -82, 5.5, -.2),
  peak("thanh-son", 2, 102, 680, -78, 9, -.12),
  peak("vien-phong", 2, 146, 760, -82, 5.9, .15, .7)
];
