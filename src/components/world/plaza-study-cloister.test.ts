import { afterAll, describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPlazaStudyGeometry } from "./plaza-study-geometry";
import { collectMapColliders } from "@/lib/world/map-config";
import { PLAZA_STUDY_MAP_CONFIG } from "@/lib/world/plaza-study-config";
import { computeUnoccludedDistance } from "@/lib/world/camera";
import { resolveCircleAabbCollision } from "@/lib/world/physics";
import { createReadingCloisters } from "./plaza-study-cloister";

const batches = createPlazaStudyGeometry(), material = new MeshBasicMaterial();
const meshes = batches.map(b => new Mesh(b.geometry, material));
const stone = meshes.filter((_, i) => batches[i].material === "stone");
const colliders = collectMapColliders(PLAZA_STUDY_MAP_CONFIG);
const ray = (x: number, y: number, z: number, dx: number, dy: number, dz: number, far = 20) =>
  new Raycaster(new Vector3(x, y, z), new Vector3(dx, dy, dz), 0, far);
afterAll(() => { batches.forEach(b => b.geometry.dispose()); material.dispose(); });

describe("refined reading court cloisters", () => {
  it("keeps both wings within the 16k triangle budget", () => {
    const parts = createReadingCloisters();
    try {
      expect(parts.reduce((sum, p) => sum + (p.geometry.index?.count ?? p.geometry.getAttribute("position").count) / 3, 0)).toBeLessThanOrEqual(16000);
    } finally { parts.forEach(p => p.geometry.dispose()); }
  });
  it("gives both long roofs horizontal ridges instead of stretched pyramid peaks", () => {
    for (const points of [[[-35, -6], [-35, -3], [-35, 0]], [[-30, -11], [-28, -11], [-26, -11]]]) {
      const heights = points.map(([x, z]) => ray(x, 10.5, z, 0, -1, 0).intersectObjects(meshes)[0].point.y);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(.025);
    }
  });

  it("has solid eaves with outward faces and matching visible soffits", () => {
    for (const [x, z, roofY] of [[-37.62, -2.77, 8.1], [-27.77, -13.35, 8.8]]) {
      const top = ray(x, 10, z, 0, -1, 0).intersectObjects(stone)[0].point.y;
      const bottom = ray(x, roofY - .3, z, 0, 1, 0).intersectObjects(meshes)[0].point.y;
      expect(top - bottom).toBeGreaterThan(.14);
      expect(top - bottom).toBeLessThan(.25);
    }
    for (const [x, y, z, dx, dz] of [[-38.1, 8.2, -2.77, 1, 0], [-27.77, 8.9, -13.8, 0, 1]]) {
      const hit = ray(x, y, z, dx, 0, dz, .5).intersectObjects(meshes)[0];
      expect(hit).toBeDefined();
      expect(hit.face!.normal.dot(new Vector3(-dx, 0, -dz))).toBeGreaterThan(.9);
    }
  });

  it("steps the northwest roof junction apart without crossing either shell", () => {
    for (const x of [-33.95, -33.7, -33.4, -33.1, -32.3]) for (const z of [-9.95, -9.7, -9.3, -8.55]) {
      const tops = ray(x, 10.2, z, 0, -1, 0).intersectObjects(stone)
        .map(h => h.point.y).filter(y => y > 8 && y < 10);
      const levels = tops.filter((y, i) => i === 0 || Math.abs(y - tops[i - 1]) > .04);
      expect(levels, `two roofs ${x},${z}`).toHaveLength(2);
      expect(levels[0] - levels[1], `roof separation ${x},${z}`).toBeGreaterThan(.28);
    }
  });

  it("grounds the widened stone feet and protects their edges from the camera", () => {
    for (const [x, z] of [[-36.8, -3], [-33.2, -3], [-28, -12.5], [-23, -9.5]]) {
      expect(ray(x + .32, 4.5, z + .32, 0, -1, 0).intersectObjects(meshes)[0].point.y).toBeGreaterThan(4.13);
      const distance = computeUnoccludedDistance(x + 1, 4.12, z, -1, 0, 0, 1, colliders);
      expect(distance).toBeLessThan(.67);
    }
  });

  it("connects column capitals to the overhead bearing frames", () => {
    for (const [x, z, roofY] of [[-36.8, -3, 8.1], [-28, -12.5, 8.8]]) {
      for (const offset of [-.2, .1, .24])
        expect(ray(x + 1, roofY + offset, z, -1, 0, 0, 1).intersectObjects(meshes).length).toBeGreaterThan(0);
    }
  });

  it("keeps timber cross beams below the roof tiles at both hip ends", () => {
    for (const [x, z] of [[-34.7, -9], [-34.7, 3], [-33, -10.7], [-23, -10.7], [-37.3, 3], [-32.7, 3], [-23, -9.05]]) {
      const roof = ray(x, 10.4, z, 0, -1, 0).intersectObjects(stone)[0].point.y;
      const top = ray(x, 10.4, z, 0, -1, 0).intersectObjects(meshes)[0].point.y;
      expect(top - roof, `timber penetration ${x},${z}`).toBeLessThan(.026);
    }
  });

  it("fits every corner of the bracket stacks beneath the roof envelope", () => {
    const parts = createReadingCloisters();
    const roofs = parts.filter(p => p.color === "#4e6a78").map(p => new Mesh(p.geometry, material));
    const contacts = parts.filter(p => ["#ad8958", "#896243", "#ac8757", "#a48256"].includes(p.color));
    try {
      for (const part of contacts) {
        const positions = part.geometry.getAttribute("position");
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
          const top = ray(x, 12, z, 0, -1, 0).intersectObjects(roofs)[0]?.point.y;
          expect(top, `roof over bearing ${x},${z}`).toBeDefined();
          expect(y - top!, `exposed timber ${x},${y},${z}`).toBeLessThan(.005);
        }
      }
    } finally { parts.forEach(p => p.geometry.dispose()); }
  });

  it("preserves eye-level sightlines, headroom and the walking lanes", () => {
    expect(ray(-35, 5.65, 3, 0, 0, -1, 12).intersectObjects(meshes)).toHaveLength(0);
    expect(ray(-30, 5.65, -11, 1, 0, 0, 8).intersectObjects(meshes)).toHaveLength(0);
    for (const [x, z] of [[-35, 3], [-35, 0], [-35, -3], [-35, -7], [-29.9, -11], [-28, -11], [-24, -11]]) {
      expect(ray(x, 5.7, z, 0, 1, 0).intersectObjects(meshes)[0].point.y - 4).toBeGreaterThan(2.4);
      for (const c of colliders) {
        const result = resolveCircleAabbCollision(x, z, .45, c, 4);
        expect(Math.hypot(result.x - x, result.z - z), `${x},${z}/${c.id}`).toBeLessThan(.001);
      }
    }
  });

  it("blocks the camera before it penetrates shafts, soffits and ridge ornaments", () => {
    for (const [x, z] of [[-36.8, -3], [-28, -12.5]]) {
      const hit = ray(x + 1, 6, z, -1, 0, 0, 1).intersectObjects(meshes)[0];
      expect(computeUnoccludedDistance(x + 1, 6, z, -1, 0, 0, 1, colliders)).toBeLessThan(hit.distance);
    }
    for (const [x, z] of [[-35, -3], [-28, -11]]) {
      const ceiling = ray(x, 5.7, z, 0, 1, 0).intersectObjects(meshes)[0];
      expect(computeUnoccludedDistance(x, 5.7, z, 0, 1, 0, 6, colliders)).toBeLessThan(ceiling.distance);
      const roof = ray(x, 12, z, 0, -1, 0).intersectObjects(meshes)[0];
      expect(computeUnoccludedDistance(x, 12, z, 0, -1, 0, 6, colliders)).toBeLessThan(roof.distance);
    }
  });
});
