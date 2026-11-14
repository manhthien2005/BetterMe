import { BoxGeometry, BufferGeometry, CylinderGeometry, DodecahedronGeometry, Float32BufferAttribute, Quaternion, Vector3 } from "three";
import { READING_PAVILION, READING_PAVILION_COLUMNS, READING_PAVILION_FOOT } from "@/lib/world/plaza-study-pavilion";
import { studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import type { PlazaAssetPart } from "./fantasy-plaza-assets";
import { beveledBlock, timberBeam } from "./plaza-study-joinery";

type Point = readonly [number, number, number];
const PROFILE = [[1, .26], [.94, .07], [.84, .08], [.69, .4], [.51, .91], [.32, 1.48], [.12, 1.96]];
const CORNERS = [[-1, -1], [-1, 1], [1, 1], [1, -1]];

/** Two solid roof tiers and exposed joinery, in the existing study material kit. */
export function createReadingPavilion(): PlazaAssetPart[] {
  const p = READING_PAVILION, floor = studyGroundHeight(p.x, p.z)!;
  const parts: PlazaAssetPart[] = [];
  const add = (geometry: BufferGeometry, material: PlazaAssetPart["material"], color: string) =>
    parts.push({ geometry: geometry.translate(p.x, floor, p.z), material, color });
  const block = (x: number, y: number, z: number, w: number, h: number, d: number,
    material: PlazaAssetPart["material"], color: string, bevel = .025) =>
    add(beveledBlock(w, h, d, bevel).translate(x, y, z), material, color);
  const beam = (a: Point, b: Point, w: number, h: number, color = "#806047") =>
    add(timberBeam(a, b, w, h), "wood", color);
  const surface = (vertices: number[], indices: number[]) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  // Flush approach: the polished edge is only 3 cm above the terrace.
  block(0, -.1, 0, p.width + 2, .26, p.depth + 2, "stone", "#dfd2b4", .025);
  add(new BoxGeometry(p.width, .02, p.depth).translate(0, .035, 0), "stone", "#c4bca3");
  for (const { x: wx, z: wz, sx, sz } of READING_PAVILION_COLUMNS) {
    const x = wx - p.x, z = wz - p.z;
    block(x, .13, z, READING_PAVILION_FOOT, .2, READING_PAVILION_FOOT, "stone", "#e6d9bd", .045);
    block(x, .35, z, .77, .28, .77, "stone", "#c9bb9e", .04);
    block(x, .57, z, .87, .16, .87, "stone", "#e4d4b2", .025);
    block(x, 3.24, z, .58, 5.2, .58, "wood", "#684c39", .035);
    for (const y of [.77, 5.45]) block(x, y, z, .61, .09, .61, "metal", "#ae8c54", .012);
    block(x, 5.72, z, .86, .28, .86, "wood", "#9a7953");
    // Crossing bracket arms spread the roof load out beyond each column.
    block(x, 5.98, z, 1.7, .22, .42, "wood", "#98724d");
    block(x, 6.15, z, .42, .22, 1.7, "wood", "#98724d");
    block(x, 6.64, z, .64, .7, .64, "wood", "#886343");
    for (const side of [-1, 1]) {
      block(x + side * .64, 6.14, z, .28, .24, .5, "wood", "#c09a65");
      block(x, 6.28, z + side * .64, .5, .24, .28, "wood", "#c09a65");
    }
    beam([x, 4.7, z], [x - sx * 1.35, 5.9, z], .24, .28, "#9b754f");
    beam([x, 4.7, z], [x, 5.9, z - sz * 1.35], .24, .28, "#9b754f");
  }
  const px = p.width * .38, pz = p.depth * .38;
  for (const side of [-1, 1]) {
    beam([-px - .7, 5.98, side * pz], [px + .7, 5.98, side * pz], .42, .44, "#70503c");
    beam([side * px, 6.17, -pz - .7], [side * px, 6.17, pz + .7], .42, .38, "#70503c");
    beam([-px, 6.8, side * pz], [px, 6.8, side * pz], .24, .26, "#99754d");
    beam([side * px, 6.8, -pz], [side * px, 6.8, pz], .24, .26, "#99754d");
    block(0, 5.99, side * (pz + .225), 8.8, .055, .035, "metal", "#b99760", .008);
  }
  // A light coffer grid remains well above a standing reader's sightline.
  for (const x of [-3.3, 0, 3.3]) beam([x, 6.28, -pz], [x, 6.28, pz], .2, .24, "#a58258");
  for (const z of [-2.7, 0, 2.7]) beam([-px, 6.39, z], [px, 6.39, z], .16, .18, "#a58258");

  function roof(width: number, depth: number, base: number, rise: number, divisions: number) {
    const point = (scale: number, side: number, t: number, offset = 0): Point => {
      const a = CORNERS[side], b = CORNERS[(side + 1) % 4];
      let row = 0;
      while (row < PROFILE.length - 2 && scale < PROFILE[row + 1][0]) row++;
      const [s0, y0] = PROFILE[row], [s1, y1] = PROFILE[row + 1];
      const u = (s0 - scale) / (s0 - s1);
      const y = ((1 - u) * y0 + u * y1) * rise / 2;
      const lift = .5 * Math.pow(scale, 4) * Math.pow(2 * t - 1, 6) * rise / 2;
      return [(a[0] + (b[0] - a[0]) * t) * width * scale / 2, base + y + lift + offset,
        (a[1] + (b[1] - a[1]) * t) * depth * scale / 2];
    };
    const ring = (scale: number, offset: number) => CORNERS.flatMap((_, side) =>
      Array.from({ length: divisions }, (_, j) => point(scale, side, j / divisions, offset))).flat();
    const count = divisions * 4;
    const skin = (offset: number, underside: boolean) => {
      const vertices = PROFILE.flatMap(([scale]) => ring(scale, offset)), indices: number[] = [];
      for (let row = 0; row < PROFILE.length - 1; row++) for (let i = 0; i < count; i++) {
        const a = row * count + i, b = row * count + (i + 1) % count;
        const c = b + count, d = a + count;
        if (underside) indices.push(a, c, b, a, d, c);
        else indices.push(a, b, c, a, c, d);
      }
      // Close the small crown; the second tier and finial sit above this face.
      const center = vertices.length / 3;
      vertices.push(0, base + 1.96 * rise / 2 + offset, 0);
      for (let i = 0; i < count; i++) {
        const a = (PROFILE.length - 1) * count + i, b = (PROFILE.length - 1) * count + (i + 1) % count;
        indices.push(...(underside ? [a, center, b] : [a, b, center]));
      }
      add(surface(vertices, indices), underside ? "wood" : "stone", underside ? "#806449" : "#4e6a78");
    };
    skin(0, false);
    skin(-.18, true);
    // Closed fascia follows the same corner lift as the tiles and soffit.
    const fascia = (lower: number, upper: number, color: string, material: PlazaAssetPart["material"]) => {
      const scale = material === "metal" ? 1.001 : 1;
      const vertices = [...ring(scale, lower), ...ring(scale, upper)], indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        indices.push(i, next, next + count, i, next + count, i + count);
      }
      add(surface(vertices, indices), material, color);
    };
    fascia(-.18, 0, "#624a37", "wood");
    fascia(-.04, -.005, "#bea06b", "metal");
    const strip = (s0: number, s1: number, side: number, t0: number, t1: number, color: string) => {
      add(surface([...point(s0, side, t0, .022), ...point(s0, side, t1, .022),
        ...point(s1, side, t1, .022), ...point(s1, side, t0, .022)], [0, 1, 2, 0, 2, 3]), "stone", color);
    };
    // Low-relief seams read as roof courses without thousands of individual tiles.
    for (let side = 0; side < 4; side++) {
      for (let j = 1; j < divisions; j++) for (let row = 0; row < PROFILE.length - 1; row++)
        strip(PROFILE[row][0], PROFILE[row + 1][0], side, (j - .035) / divisions, (j + .035) / divisions, "#69828a");
      for (const s of [.94, .84, .69, .51, .32]) for (let j = 0; j < divisions; j++)
        strip(s, s - .004, side, j / divisions, (j + 1) / divisions, "#3d5666");
      for (let row = 0; row < PROFILE.length - 1; row++)
        beam(point(PROFILE[row][0], side, 0, .045), point(PROFILE[row + 1][0], side, 0, .045), .11, .1, "#9b835d");
      // Each rafter follows the underside from the eave to the bearing line.
      for (let j = 1; j < divisions; j += 2) {
        const t = j / divisions;
        for (let row = 0; row < 4; row++) {
          const a = new Vector3(...point(PROFILE[row][0], side, t, -.23));
          const b = new Vector3(...point(PROFILE[row + 1][0], side, t, -.23));
          const delta = b.clone().sub(a), center = a.clone().add(b).multiplyScalar(.5);
          add(new BoxGeometry(.10, .13, delta.length())
            .applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), delta.normalize()))
            .translate(center.x, center.y, center.z), "wood", "#ab885a");
        }
      }
    }
  }
  roof(p.width * 1.3, p.depth * 1.3, p.height, 2, 20);
  roof(p.width * .62, p.depth * .62, p.height + 1.75, 1.25, 12);
  block(0, 9.44, 0, .8, .16, .8, "metal", "#b19560");
  add(new CylinderGeometry(.13, .26, .32, 8).translate(0, 9.67, 0), "metal", "#b99a61");
  add(new DodecahedronGeometry(.23).scale(1, 1.8, 1).translate(0, 10.02, 0), "metal", "#cbb079");
  return parts;
}
