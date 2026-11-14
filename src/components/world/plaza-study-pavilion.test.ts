import { afterAll, describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPlazaStudyGeometry } from "./plaza-study-geometry";
import { PLAZA_STUDY_MAP_CONFIG } from "@/lib/world/plaza-study-config";
import { collectMapColliders } from "@/lib/world/map-config";
import { computeUnoccludedDistance } from "@/lib/world/camera";
import { studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import { createReadingPavilion } from "./plaza-study-pavilion";

const batches = createPlazaStudyGeometry();
const material = new MeshBasicMaterial();
const meshes = batches.map(b => new Mesh(b.geometry, material));
const colliders = collectMapColliders(PLAZA_STUDY_MAP_CONFIG);
const vertical = (x: number, z: number, y: number, direction: number) =>
  new Raycaster(new Vector3(x, y, z), new Vector3(0, direction, 0)).intersectObjects(meshes)[0]?.point.y;
afterAll(() => { batches.forEach(b => b.geometry.dispose()); material.dispose(); });

describe("refined grand reading pavilion", () => {
  it("keeps the detailed asset within its 14k triangle budget", () => {
    const parts = createReadingPavilion();
    try {
      const triangles = parts.reduce((n, { geometry }) => n + (geometry.index?.count ?? geometry.getAttribute("position").count) / 3, 0);
      expect(triangles).toBeLessThanOrEqual(14000);
    } finally { parts.forEach(part => part.geometry.dispose()); }
  });
  it("has a solid eave visible from above and below on all four sides", () => {
    for (const [x, z] of [[-24.77, 4.5], [-24.77, -8.5], [-17.2, -1.77], [-32.8, -1.77]]) {
      const top = vertical(x, z, 15, -1)!;
      const bottom = vertical(x, z, 9.9, 1)!;
      expect(top, `roof ${x},${z}`).toBeGreaterThan(10.3);
      expect(top - bottom, `closed shell ${x},${z}`).toBeGreaterThan(.14);
      expect(top - bottom).toBeLessThan(.38);
    }
  });

  it("lifts the roof corners gently above the middle of each eave", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const corner = vertical(-25 + sx * 7.8, -2 + sz * 6.65, 15, -1)!;
      const middle = vertical(-25, -2 + sz * 6.65, 15, -1)!;
      expect(corner - middle).toBeGreaterThan(.2);
      expect(corner - middle).toBeLessThan(.75);
    }
  });

  it("closes each outer fascia with an outward-facing edge", () => {
    for (const [x, z, dx, dz] of [[-16, -1.77, -1, 0], [-34, -1.77, 1, 0], [-24.77, 6, 0, -1], [-24.77, -10, 0, 1]]) {
      const hit = new Raycaster(new Vector3(x, 10.57, z), new Vector3(dx, 0, dz), 0, 1).intersectObjects(meshes)[0];
      expect(hit, `closed fascia ${x},${z}`).toBeDefined();
      expect(hit!.face!.normal.dot(new Vector3(-dx, 0, -dz))).toBeGreaterThan(.9);
    }
  });

  it("supports the full stone feet and covers their wider edges with colliders", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = -25 + sx * 4.94, z = -2 + sz * 4.18;
      for (const dx of [-.42, .42]) for (const dz of [-.42, .42]) {
        expect(studyGroundHeight(x + dx, z + dz)).toBe(4);
        expect(vertical(x + dx, z + dz, 4.45, -1)!).toBeGreaterThan(4.12);
      }
      const hit = new Raycaster(new Vector3(x + 1, 4.12, z), new Vector3(-1, 0, 0), 0, 1).intersectObjects(meshes)[0];
      expect(hit?.distance).toBeLessThan(.56);
      expect(computeUnoccludedDistance(x + 1, 4.12, z, -1, 0, 0, 1, colliders)).toBeLessThan(.56);
    }
  });

  it("keeps open eye-level views and overhead clearance through the hall", () => {
    for (const x of [-26, -25, -24]) {
      const ray = new Raycaster(new Vector3(x, 5.65, 4), new Vector3(0, 0, -1), 0, 12);
      expect(ray.intersectObjects(meshes), `open reading hall ${x}`).toHaveLength(0);
      expect(vertical(x, -2, 6, 1)!).toBeGreaterThan(8.5);
    }
    expect(vertical(-25, -2, 4.5, -1)! - 4).toBeLessThan(.06);
  });

  it("connects each bracket stack up to the roof bearing frame", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = -25 + sx * 4.94, z = -2 + sz * 4.18;
      for (const y of [10.45, 10.65, 10.85]) {
        expect(new Raycaster(new Vector3(x + 1, y, z), new Vector3(-1, 0, 0), 0, 1)
          .intersectObjects(meshes).length, `bearing contact ${sx},${sz}/${y}`).toBeGreaterThan(0);
      }
    }
  });

  it("protects the soffit, lifted corners and finial from camera penetration", () => {
    for (const [x, z] of [[-25, 4.5], [-17.2, 4.65], [-32.8, -8.65], [-25, -2]]) {
      const hit = vertical(x, z, 9.9, 1)!;
      const distance = computeUnoccludedDistance(x, 9.9, z, 0, 1, 0, 6, colliders);
      expect(distance, `camera below roof ${x},${z}`).toBeLessThanOrEqual(hit - 9.9);
    }
    const top = vertical(-25, -2, 16, -1)!;
    expect(computeUnoccludedDistance(-25, 16, -2, 0, -1, 0, 5, colliders)).toBeLessThanOrEqual(16 - top);
  });
});
