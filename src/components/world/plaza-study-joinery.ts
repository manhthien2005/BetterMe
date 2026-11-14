import { ExtrudeGeometry, Quaternion, Shape, Vector3 } from "three";

type Point = readonly [number, number, number];

/** A small bevel on all edges, without the subdivisions of a rounded box. */
export function beveledBlock(w: number, h: number, d: number, bevel: number) {
  const x = w / 2 - bevel, y = h / 2 - bevel;
  const shape = new Shape().moveTo(-x, -y).lineTo(x, -y).lineTo(x, y).lineTo(-x, y);
  shape.closePath();
  return new ExtrudeGeometry(shape, {
    depth: d - 2 * bevel, steps: 1, bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 1
  }).translate(0, 0, -d / 2 + bevel);
}

/** Chamfered rectangular section; its length stays exact at rail joints. */
export function timberBeam(a: Point, b: Point, w: number, h: number) {
  const x = w / 2, y = h / 2, bevel = Math.min(.018, w / 5, h / 5);
  const shape = new Shape();
  [[-x + bevel, -y], [x - bevel, -y], [x, -y + bevel], [x, y - bevel],
    [x - bevel, y], [-x + bevel, y], [-x, y - bevel], [-x, -y + bevel]]
    .forEach(([px, py], i) => i ? shape.lineTo(px, py) : shape.moveTo(px, py));
  shape.closePath();
  const delta = new Vector3(...b).sub(new Vector3(...a));
  return new ExtrudeGeometry(shape, { depth: delta.length(), steps: 1, bevelEnabled: false })
    .applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), delta.normalize()))
    .translate(...a);
}
