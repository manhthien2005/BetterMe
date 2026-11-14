import { afterAll, describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPlazaStudyGeometry } from "./plaza-study-geometry";
import { PLAZA_STUDY_MAP_CONFIG } from "@/lib/world/plaza-study-config";
import { studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import { computeUnoccludedDistance } from "@/lib/world/camera";
import { resolveCircleAabbCollision } from "@/lib/world/physics";
import { collectMapColliders } from "@/lib/world/map-config";

const batches = createPlazaStudyGeometry();
const material = new MeshBasicMaterial();
const meshes = batches.map(b => new Mesh(b.geometry, material));
const topAt = (x: number, z: number, y = 7) =>
  new Raycaster(new Vector3(x, y, z), new Vector3(0, -1, 0)).intersectObjects(meshes)[0]?.point.y;
afterAll(() => { batches.forEach(b => b.geometry.dispose()); material.dispose(); });

describe("refined academy staircase", () => {
  it("keeps both handrails continuous through each incline and landing joint", () => {
    for (const side of [-1, 1]) for (const s of [1.1, 4.8, 4.97, 5.03, 6, 6.97, 7.03, 7.2, 10.1]) {
      const rise = s < 5 ? s * .4 : s < 7 ? 2 : 2 + (s - 7) * .4;
      const top = topAt(-25 + side * 3.77, 21 - s)!;
      expect(top, `handrail ${side} ${s}`).toBeGreaterThan(rise + 1.04);
      expect(top, `rail or joint post ${side} ${s}`).toBeLessThan(rise + 1.34);
    }
  });

  it("supports the outer post bases with solid cheeks", () => {
    for (const side of [-1, 1]) for (const s of [2.5, 5, 7, 9.5]) {
      const rise = s < 5 ? s * .4 : s < 7 ? 2 : 2 + (s - 7) * .4;
      // The short ray reaches the new supporting cheek, not the old 7 m core.
      const ray = new Raycaster(new Vector3(-25 + side * 4.2, rise - .2, 21 - s), new Vector3(-side, 0, 0), 0, .4);
      expect(ray.intersectObjects(meshes).length, `solid cheek ${side} ${s}`).toBeGreaterThan(0);
    }
  });

  it("softens the step nose inward without raising the flat walking surface", () => {
    // Third rise starts at s=1.5; bevel occupies its first 18 mm only.
    expect(topAt(-25.21, 21 - 1.506, 1)).toBeLessThan(.598);
    expect(topAt(-25.21, 21 - 1.506, 1)).toBeGreaterThan(.58);
    for (const s of [.25, 1.75, 4.75, 6, 7.75, 11.95]) {
      expect(topAt(-25.21, 21 - s, 4.2), `floor ${s}`).toBeCloseTo(studyGroundHeight(-25.21, 21 - s)!, 2);
    }
  });

  it("blocks solid stair edges without obstructing the three walking lanes", () => {
    const colliders = collectMapColliders(PLAZA_STUDY_MAP_CONFIG);
    const at = (x: number, z: number) => colliders.filter(c => !c.cameraOnly && x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ);
    for (const s of [1, 4.9, 6, 7.1, 11]) {
      for (const side of [-1, 1]) expect(at(-25 + side * 3.77, 21 - s).length).toBeGreaterThan(0);
      for (const lane of [-2.24, 0, 2.24]) expect(at(-25 + lane, 21 - s)).toEqual([]);
    }
    const edge = colliders.find(c => c.id === "academy-stair-edge-1-12")!;
    expect(resolveCircleAabbCollision(-21.3, 14.8, .35, edge, 2).x).toBeLessThanOrEqual(-21.85);
    expect(computeUnoccludedDistance(-25, 2.8, 14.8, 1, 0, 0, 6, colliders)).toBeLessThan(3.5);
  });

  it("has one visible face where the coping meets its cheek", () => {
    for (const side of [-1, 1]) {
      const ray = new Raycaster(new Vector3(-25 + side * 3.2, .61, 19.75), new Vector3(side, 0, 0), 0, .5);
      const atEdge = ray.intersectObjects(meshes).filter(hit => Math.abs(Math.abs(hit.point.x + 25) - 3.5) < .001);
      expect(atEdge, `coplanar inner edge ${side}`).toHaveLength(1);
    }
  });
});
