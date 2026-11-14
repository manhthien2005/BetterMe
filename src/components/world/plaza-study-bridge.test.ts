import { afterAll, describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPlazaStudyGeometry } from "./plaza-study-geometry";
import { collectMapColliders } from "@/lib/world/map-config";
import { PLAZA_STUDY_MAP_CONFIG } from "@/lib/world/plaza-study-config";
import { STUDY_CONNECTORS, studyConnectorHeight, studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import { resolveCircleAabbCollision } from "@/lib/world/physics";
import { computeUnoccludedDistance } from "@/lib/world/camera";

const batches = createPlazaStudyGeometry();
const material = new MeshBasicMaterial();
const meshes = batches.map(b => new Mesh(b.geometry, material));
const colliders = collectMapColliders(PLAZA_STUDY_MAP_CONFIG);
// Independent survey frame for the approved 12,-5 diagonal (13 m long).
const curveHeight = (run: number) => {
  const t = Math.max(0, Math.min(1, run / 13));
  return 4 + 3 * t * t * (3 - 2 * t) + 13.6 * t * t * (1 - t) * (1 - t);
};
const point = (across: number, run: number, offset = 0) =>
  new Vector3(-20 + 12 / 13 * run + 5 / 13 * across,
    curveHeight(run) + offset, -12 - 5 / 13 * run + 12 / 13 * across);
const down = (across: number, run: number, offset: number) =>
  new Raycaster(point(across, run, offset), new Vector3(0, -1, 0)).intersectObjects(meshes)[0]?.point.y;
afterAll(() => { batches.forEach(b => b.geometry.dispose()); material.dispose(); });

describe("refined sky bridge", () => {
  it("raises the middle into a gentle arch with level tangents at both landings", () => {
    const bridge = STUDY_CONNECTORS.find(c => c.id === "sky-bridge")!;
    expect(studyConnectorHeight(bridge, 0)).toBe(4);
    expect(studyConnectorHeight(bridge, 1)).toBe(7);
    expect(studyConnectorHeight(bridge, .5)).toBeCloseTo(6.35, 6);
    expect(studyConnectorHeight(bridge, .25)).toBeCloseTo(4.946875, 6);
    expect(studyConnectorHeight(bridge, .75)).toBeCloseTo(7.009375, 6);
    const heights = Array.from({length: 131}, (_, i) => studyConnectorHeight(bridge, i / 130));
    expect(Math.max(...heights)).toBeLessThan(7.06);
    expect(Math.abs(heights[1] - heights[0]) / .1).toBeLessThan(.02);
    expect(Math.abs(heights[130] - heights[129]) / .1).toBeLessThan(.02);
  });
  it("keeps continuous handrails and capped posts outside the clear deck", () => {
    for (const side of [-1, 1]) {
      for (const run of [0, 3.25, 6.5, 9.75, 13]) {
        expect(down(side * 2.22, run, 1.6)! - point(0, run).y, `cap ${side}/${run}`).toBeGreaterThan(1.2);
      }
      for (const run of [.8, 2.9, 3.6, 6.1, 6.9, 9.35, 10.15, 12.2]) {
        const height = down(side * 2.22, run, 1.5)! - point(0, run).y;
        expect(height, `rail ${side}/${run}`).toBeGreaterThan(1.04);
        expect(height, `rail ${side}/${run}`).toBeLessThan(1.15);
      }
    }
  });

  it("supports the open span with solid timber ribs below the deck", () => {
    for (const side of [-1, 1]) for (const run of [3.25, 6.5, 9.75]) {
      const origin = point(side * 2.8, run, -.8 - 1.25 * (2 * run / 13 - 1) ** 2);
      const ray = new Raycaster(origin, new Vector3(-side * 5 / 13, 0, -side * 12 / 13), 0, .9);
      expect(ray.intersectObjects(meshes).length, `rib ${side}/${run}`).toBeGreaterThan(0);
    }
  });

  it("keeps board tops and seams on the curved walking surface in all lanes", () => {
    for (const run of [.02, .24, .497, .503, 3.2, 6.5, 8.003, 12.98]) for (const across of [-1.6, 0, 1.6]) {
      const p = point(across, run);
      // Existing terrace paving is 18 mm proud and reaches just over the upper seam.
      const tolerance = run > 12.95 ? .025 : .021;
      expect(Math.abs(down(across, run, .3)! - studyGroundHeight(p.x, p.z)!), `${across}/${run}`).toBeLessThan(tolerance);
    }
  });

  it("supports the full post base on the steep curved bays", () => {
    for (const side of [-1, 1]) for (const run of [3.25, 6.5, 9.75]) {
      // Just above the beam, a short horizontal ray must hit the pedestal foot.
      const underBase = point(side * 2.8, run - .20, .025);
      const hit = new Raycaster(underBase, new Vector3(-side * 5 / 13, 0, -side * 12 / 13), 0, .42).intersectObjects(meshes);
      expect(hit.length, `supported base ${side}/${run}`).toBeGreaterThan(0);
    }
  });

  it("shows one outer face where the stone feet overlap the supporting timber", () => {
    for (const side of [-1, 1]) for (const run of [3.31, 6.56]) {
      const ray = new Raycaster(point(side * 2.8, run, -.10),
        new Vector3(-side * 5 / 13, 0, -side * 12 / 13), 0, .6);
      const coincident = ray.intersectObjects(meshes).filter(hit => {
        const across = ((hit.point.x + 20) * 5 + (hit.point.z + 12) * 12) / 13;
        return Math.abs(Math.abs(across) - 2.44) < .001;
      });
      expect(coincident, `foot face ${side}/${run}`).toHaveLength(1);
    }
  });

  it("clears the full upper deck width of the old terrace corner and its wall", () => {
    for (const run of [8.5, 9.5, 10.5, 11.5, 12.5]) for (const across of [-1.85, 0, 1.85]) {
      expect(Math.abs(down(across, run, 2)! - point(across, run).y), `upper deck ${across}/${run}`).toBeLessThan(.021);
    }
  });

  it("stops side passage and camera clipping while leaving approach lanes clear", () => {
    for (const run of [.1, 3.25, 6.5, 9.75, 12.9]) {
      for (const across of [-1.28, 0, 1.28]) {
        const p = point(across, run);
        for (const c of colliders) {
          const result = resolveCircleAabbCollision(p.x, p.z, .35, c, p.y);
          expect(Math.hypot(result.x - p.x, result.z - p.z), `lane ${across}/${run}/${c.id}`).toBeLessThan(.001);
        }
      }
      for (const side of [-1, 1]) {
        const p = point(side * 2.16, run);
        expect(colliders.some(c => {
          const result = resolveCircleAabbCollision(p.x, p.z, .35, c, p.y);
          return Math.hypot(result.x - p.x, result.z - p.z) > .01;
        }), `edge ${side}/${run}`).toBe(true);
        const center = point(0, run, .8);
        expect(computeUnoccludedDistance(center.x, center.y, center.z,
          side * 5 / 13, 0, side * 12 / 13, 4, colliders)).toBeLessThan(2.3);
      }
    }
  });

  it("protects the protruding end-post bases when the camera looks sideways at either mouth", () => {
    for (const run of [-.2, 13.2]) for (const side of [-1, 1]) {
      const p = point(0, run, .05);
      const direction = new Vector3(side * 5 / 13, 0, side * 12 / 13);
      expect(new Raycaster(p, direction, 0, 2.5).intersectObjects(meshes).length).toBeGreaterThan(0);
      expect(computeUnoccludedDistance(p.x, p.y, p.z, direction.x, 0, direction.z, 4, colliders),
        `post base ${side}/${run}`).toBeLessThan(2.5);
    }
  });
});
