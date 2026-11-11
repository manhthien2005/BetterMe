import { BufferGeometry, CatmullRomCurve3, CircleGeometry, Float32BufferAttribute, PlaneGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLAZA_PLANTING_BEDS } from "@/lib/world/plaza-nature-layout";

function worldUvs(geometry: BufferGeometry) {
  const p = geometry.getAttribute("position"), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 3; uv[i * 2 + 1] = p.getZ(i) / 3; }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return geometry;
}

function loopGeometry() {
  const curve = new CatmullRomCurve3([[-23, -14], [-18, -19], [18, -19], [23, -14], [23, 14], [18, 19], [-18, 19], [-23, 14]].map(([x, z]) => new Vector3(x, .015, z)), true, "centripetal");
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 160; i++) {
    const p = curve.getPointAt(i / 160), tangent = curve.getTangentAt(i / 160);
    for (const side of [-1, 1]) positions.push(p.x + tangent.z * 1.4 * side, .015, p.z - tangent.x * 1.4 * side);
    if (i < 160) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setIndex(indices); g.computeVertexNormals();
  return worldUvs(g);
}

/** Fresh caller-owned geometry; all walkable paving is flat and upward-facing. */
export function createPlazaGroundGeometry() {
  const earth = worldUvs(new PlaneGeometry(56.6, 48.6).rotateX(-Math.PI / 2).translate(0, -.004, 0));
  const paths = [loopGeometry(), worldUvs(new PlaneGeometry(30, 28).rotateX(-Math.PI / 2).translate(0, .006, 0)), worldUvs(new PlaneGeometry(3, 10).rotateX(-Math.PI / 2).translate(0, .016, -16)), worldUvs(new PlaneGeometry(3, 10).rotateX(-Math.PI / 2).translate(-6, .016, 16)), ...[-1, 1].map(side => worldUvs(new PlaneGeometry(10, 2.8).rotateX(-Math.PI / 2).translate(side * 19.5, .016, 5.8))), worldUvs(new PlaneGeometry(10, 3).rotateX(-Math.PI / 2).translate(-19.5, .017, -6.3))];
  const paving = mergeGeometries(paths)!; paths.forEach(p => p.dispose());
  const beds = PLAZA_PLANTING_BEDS.map((b, j) => {
    const g = new CircleGeometry(1, 32).rotateX(-Math.PI / 2);
    const p = g.getAttribute("position");
    for (let i = 1; i < p.count; i++) { const s = 1 + Math.sin(i * 1.8 + j) * .07; p.setXYZ(i, p.getX(i) * s, 0, p.getZ(i) * s); }
    return worldUvs(g.scale(b.rx, 1, b.rz).translate(b.x, .023, b.z));
  });
  const planting = mergeGeometries(beds)!; beds.forEach(g => g.dispose());
  return { earth, paving, planting };
}
