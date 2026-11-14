import {
  BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Matrix4,
  PlaneGeometry, Shape, Vector3
} from "three";
import { ACADEMY_STAIR, STAIR_POST_STATIONS, STAIR_RAIL_OFFSET, academyStairRise } from "@/lib/world/plaza-study-stair";
import type { PlazaAssetPart } from "./fantasy-plaza-assets";
import { beveledBlock, timberBeam } from "./plaza-study-joinery";

type StairPart = PlazaAssetPart & { groundStyle?: number };
type Point = readonly [number, number, number];

export function createAcademyStairDetails(): StairPart[] {
  const parts: StairPart[] = [];
  const point = (across: number, y: number, run: number): Point =>
    [ACADEMY_STAIR.from[0] + across, y, ACADEMY_STAIR.from[1] - run];
  const add = (geometry: BufferGeometry, material: PlazaAssetPart["material"], color: string, groundStyle = 0) =>
    parts.push({ geometry, material, color, groundStyle });
  const block = (across: number, y: number, run: number, w: number, h: number, d: number,
    material: PlazaAssetPart["material"], color: string, bevel = .018) =>
    add(beveledBlock(w, h, d, bevel).translate(...point(across, y, run)), material, color);
  const rail = (across: number, start: number, end: number, height: number, width: number, depth: number, color: string, material: PlazaAssetPart["material"] = "wood") =>
    add(timberBeam(point(across, academyStairRise(start) + height, start),
      point(across, academyStairRise(end) + height, end), width, depth), material, color);

  for (const side of [-1, 1]) {
    const across = side * STAIR_RAIL_OFFSET;
    // Continuous load-bearing cheeks support the bases outside the clear 7 m run.
    // Meet the coping underside; overlapping its vertical edge causes z-fighting.
    const shape = new Shape().moveTo(-.32, -.35).lineTo(12.32, -.35)
      .lineTo(12.32, 4.081).lineTo(12, 4.081).lineTo(7, 2.081)
      .lineTo(5, 2.081).lineTo(0, .081).lineTo(-.32, .081);
    shape.closePath();
    const transform = new Matrix4().makeBasis(new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(1, 0, 0));
    transform.setPosition(ACADEMY_STAIR.from[0] + across - .27, 0, ACADEMY_STAIR.from[1]);
    add(new ExtrudeGeometry(shape, { depth: .54, bevelEnabled: false, steps: 1 }).applyMatrix4(transform), "stone", "#b6b39c", 2);
    block(across, -.20, 6, .54, .18, 12.64, "stone", "#c9bea4", .025);

    for (const [start, end] of [[-.25, 0], [0, 5], [5, 7], [7, 12], [12, 12.25]]) {
      rail(across, start, end, .15, .54, .14, "#dfd3b8", "stone");
    }
    for (const [start, end] of [[0, 5], [5, 7], [7, 12]]) {
      rail(across, start, end, 1, .19, .16, "#826449");
      rail(across, start, end, .49, .11, .09, "#725641");
    }
    for (const s of STAIR_POST_STATIONS) {
      const y = academyStairRise(s), endPost = s === 0 || s === 12;
      block(across, y + .05, s, .54, .12, .54, "stone", "#c4baa0", .025);
      block(across, y + .19, s, .42, .22, .42, "stone", "#b3af99", .025);
      block(across, y + .31, s, .50, .10, .50, "stone", "#e3d8bf", .02);
      const width = endPost ? .32 : .27;
      add(timberBeam(point(across, y + .35, s), point(across, y + 1.13, s), width, width), "wood", "#785a41");
      add(new BoxGeometry(width + .045, .045, width + .045).translate(...point(across, y + 1.105, s)), "metal", "#ad966a");
      block(across, y + 1.15, s, width + .09, .055, width + .09, "metal", "#435960", .012);
      add(new CylinderGeometry(.13, endPost ? .31 : .28, .12, 4, 1)
        .rotateY(Math.PI / 4).translate(...point(across, y + 1.235, s)), "metal", "#61767b");
    }
    // Open, evenly spaced balusters; their feet and heads enter the two rails.
    for (let bay = 0; bay < STAIR_POST_STATIONS.length - 1; bay++) {
      const a = STAIR_POST_STATIONS[bay], b = STAIR_POST_STATIONS[bay + 1];
      for (const t of [1 / 3, 2 / 3]) {
        const s = a + (b - a) * t, y = academyStairRise(s);
        add(timberBeam(point(across, y + .48, s), point(across, y + 1.01, s), .065, .065), "wood", "#917354");
      }
    }
  }

  // A flush arrival apron joins the curved path to the full stair mouth.
  add(new PlaneGeometry(7, 1.3).rotateX(-Math.PI / 2)
    .translate(...point(0, .022, -.65)), "stone", "#d2c7ac", 1);
  // Thin inset joints and nosing bands do not add a second walking surface.
  for (let step = 1; step < 20; step++) {
    const run = step * .5 + (step > 10 ? 2 : 0), y = step * .2;
    add(new PlaneGeometry(6.96, .055).rotateX(-Math.PI / 2)
      .translate(...point(0, y + .002, run + .055)), "stone", "#e1d5ba");
    for (let slab = -2; slab <= 2; slab++) {
      const x = slab * 1.4 + (step % 2 ? .35 : -.35);
      add(new PlaneGeometry(.012, step === 10 ? 1.84 : .34).rotateX(-Math.PI / 2)
        .translate(...point(x, y + .0025, run + (step === 10 ? 1 : .29))), "stone", "#a9a591");
      add(new PlaneGeometry(.012, .14).translate(...point(x, y - .10, run - .001)), "stone", "#aaa48f");
    }
  }
  return parts;
}
