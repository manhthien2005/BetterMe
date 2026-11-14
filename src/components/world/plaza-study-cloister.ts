import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Quaternion, Vector3 } from "three";
import { cloisterFootWidth, READING_CLOISTERS } from "@/lib/world/plaza-study-cloister";
import { studyColonnadePosts } from "@/lib/world/plaza-study-architecture";
import { studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import type { PlazaAssetPart } from "./fantasy-plaza-assets";
import { beveledBlock, timberBeam } from "./plaza-study-joinery";

type Point = readonly [number, number, number];
const PROFILE = [[1, .18], [.92, .04], [.78, .12], [.52, .6], [.25, 1.1], [.035, 1.34]];
const CORNERS = [[-1, -1], [-1, 1], [1, 1], [1, -1]];

/** Low, ridged timber wings framing the taller reading hall. */
export function createReadingCloisters(): PlazaAssetPart[] {
  const parts: PlazaAssetPart[] = [];
  for (const c of READING_CLOISTERS) {
    const alongX = c.width > c.depth, yaw = alongX ? 0 : Math.PI / 2;
    const length = Math.max(c.width, c.depth), width = Math.min(c.width, c.depth);
    const floor = studyGroundHeight(c.x, c.z)!, h = c.height;
    const add = (geometry: BufferGeometry, material: PlazaAssetPart["material"], color: string) =>
      parts.push({ geometry: geometry.rotateY(yaw).translate(c.x, floor, c.z), material, color });
    const block = (u: number, y: number, v: number, w: number, height: number, d: number,
      material: PlazaAssetPart["material"], color: string, bevel = .02) =>
      add(beveledBlock(w, height, d, bevel).translate(u, y, v), material, color);
    const beam = (a: Point, b: Point, w: number, height: number, color = "#99754f") =>
      add(timberBeam(a, b, w, height), "wood", color);
    const surface = (vertices: number[], indices: number[], material: PlazaAssetPart["material"], color: string) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      add(geometry, material, color);
    };

    add(new BoxGeometry(length + .7, .03, width + .7).translate(0, .015, 0), "stone", "#d6ccb2");
    // Inlaid strips remain flush with the existing threshold.
    for (const side of [-1, 1]) add(new BoxGeometry(length + .5, .008, .085)
      .translate(0, .034, side * (width / 2 + .15)), "stone", "#b1a78e");
    for (const p of studyColonnadePosts(c)) {
      const u = alongX ? p.x - c.x : c.z - p.z;
      const v = alongX ? p.z - c.z : p.x - c.x;
      const foot = cloisterFootWidth(c, p);
      block(u, .12, v, foot, .18, foot, "stone", "#e3d5b9", .025);
      block(u, .28, v, foot * .77, .18, foot * .77, "stone", "#c5b79d", .025);
      block(u, .42, v, foot * .89, .12, foot * .89, "stone", "#e0d1b2", .02);
      block(u, (.46 + h - .28) / 2, v, .35, h - .74, .35, "wood", "#6d4f3b", .025);
      for (const y of [.59, h - .62]) block(u, y, v, .38, .055, .38, "metal", "#b19360", .008);
      block(u, h - .33, v, .6, .22, .6, "wood", "#a28258");
      block(u, h - .1, v, 1.15, .2, .32, "wood", "#94704c");
      block(u, h - .005, v, .32, .16, 1.1, "wood", "#ad8958");
      block(u, h + (alongX ? .18 : .13), v, .28, .32, .28, "wood", "#896243");
      for (const side of [-1, 1]) {
        beam([u, h - 1.05, v], [u + side * .75, h - .18, v], .13, .17);
      }
      beam([u, h - .85, v], [u, h - .08, v - Math.sign(v) * .65], .13, .17);
    }
    for (const side of [-1, 1]) {
      beam([-length / 2 - .2, h - .1, side * width / 2], [length / 2 + .2, h - .1, side * width / 2], .22, .24, "#73533d");
      beam([-length / 2, h + .17, side * width / 2], [length / 2, h + .17, side * width / 2], .18, .2, "#a48256");
      block(0, h - .08, side * (width / 2 + .12), length, .045, .025, "metal", "#b19664", .005);
    }
    for (const u of [-length / 2, 0, length / 2]) {
      beam([u, h + .02, -width / 2], [u, h + .02, width / 2], .22, .24, "#896649");
      beam([u, h + .17, -width / 2], [u, h + .17, width / 2], .14, .18, "#ac8757");
    }

    const halfW = width / 2 + 1, ridgeHalf = (length - width) / 2, divisions = 12;
    const count = divisions * 4;
    const point = (s: number, side: number, t: number, offset = 0): Point => {
      let row = 0;
      while (row < PROFILE.length - 2 && s < PROFILE[row + 1][0]) row++;
      const [s0, y0] = PROFILE[row], [s1, y1] = PROFILE[row + 1], f = (s0 - s) / (s0 - s1);
      const a = CORNERS[side], b = CORNERS[(side + 1) % 4];
      return [(a[0] + (b[0] - a[0]) * t) * (ridgeHalf + halfW * s),
        h + y0 + (y1 - y0) * f + .26 * s ** 4 * (2 * t - 1) ** 6 + offset,
        (a[1] + (b[1] - a[1]) * t) * halfW * s];
    };
    const ring = (s: number, offset: number) => CORNERS.flatMap((_, side) =>
      Array.from({ length: divisions }, (_, j) => point(s, side, j / divisions, offset))).flat();
    for (const underside of [false, true]) {
      const offset = underside ? -.16 : 0;
      const vertices = PROFILE.flatMap(([s]) => ring(s, offset)), indices: number[] = [];
      for (let row = 0; row < PROFILE.length - 1; row++) for (let i = 0; i < count; i++) {
        const a = row * count + i, b = row * count + (i + 1) % count;
        if (underside) indices.push(a, b + count, b, a, a + count, b + count);
        else indices.push(a, b, b + count, a, b + count, a + count);
      }
      const center = vertices.length / 3;
      vertices.push(0, h + 1.34 + offset, 0);
      for (let i = 0; i < count; i++) {
        const a = (PROFILE.length - 1) * count + i, b = (PROFILE.length - 1) * count + (i + 1) % count;
        indices.push(...(underside ? [a, center, b] : [a, b, center]));
      }
      surface(vertices, indices, underside ? "wood" : "stone", underside ? "#82664a" : "#4e6a78");
    }
    for (const metal of [false, true]) {
      const s = metal ? 1.002 : 1;
      const vertices = [...ring(s, metal ? -.035 : -.16), ...ring(s, metal ? -.005 : 0)], indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        indices.push(i, j, j + count, i, j + count, i + count);
      }
      surface(vertices, indices, metal ? "metal" : "wood", metal ? "#bea06b" : "#674c38");
    }
    const strip = (s0: number, s1: number, side: number, t0: number, t1: number, color: string) =>
      surface([...point(s0, side, t0, .018), ...point(s0, side, t1, .018),
        ...point(s1, side, t1, .018), ...point(s1, side, t0, .018)], [0, 1, 2, 0, 2, 3], "stone", color);
    for (let side = 0; side < 4; side++) {
      for (let row = 0; row < PROFILE.length - 1; row++) {
        beam(point(PROFILE[row][0], side, 0, .04), point(PROFILE[row + 1][0], side, 0, .04), .09, .09, "#a48a60");
        for (let j = 1; j < divisions; j++)
          strip(PROFILE[row][0], PROFILE[row + 1][0], side, (j - .025) / divisions, (j + .025) / divisions, "#6a838b");
      }
      for (const s of [.92, .78, .52, .25]) for (let j = 0; j < divisions; j++)
        strip(s, s - .004, side, j / divisions, (j + 1) / divisions, "#3c5664");
      // Small rafters use plain sections; a bevel here would not read at walking distance.
      for (let j = 1; j < divisions; j += 2) for (let row = 0; row < 4; row++) {
        const a = new Vector3(...point(PROFILE[row][0], side, j / divisions, -.2));
        const b = new Vector3(...point(PROFILE[row + 1][0], side, j / divisions, -.2));
        const delta = b.clone().sub(a), mid = a.clone().add(b).multiplyScalar(.5);
        add(new BoxGeometry(.085, .11, delta.length())
          .applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), delta.normalize()))
          .translate(mid.x, mid.y, mid.z), "wood", "#aa875b");
      }
    }
    block(0, h + 1.37, 0, ridgeHalf * 2 + .35, .14, .24, "stone", "#3e5968");
    block(0, h + 1.45, 0, ridgeHalf * 2 + .28, .035, .12, "metal", "#b29967", .008);
    for (const side of [-1, 1]) beam([side * ridgeHalf, h + 1.4, 0], [side * (ridgeHalf + .38), h + 1.63, 0], .15, .16, "#ad9161");
  }
  return parts;
}
