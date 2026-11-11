import { describe, expect, it } from "vitest";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";

import { createPlazaLandscapeGeometry } from "./plaza-landscape-geometry";
import { computeUnoccludedDistance } from "@/lib/world/camera";
import { collectMapColliders, PUBLIC_PLAZA_MAP_CONFIG } from "@/lib/world/map-config";

describe("authored plaza landscape geometry", () => {
  it("keeps the fountain stone inlay above the textured paving plane", () => {
    const batches = createPlazaLandscapeGeometry();
    const material = new MeshBasicMaterial({ side: DoubleSide });
    try {
      const stone = batches.find(b => b.material === "stone")!;
      const hits = new Raycaster(new Vector3(2.3, 1, 0), new Vector3(0, -1, 0)).intersectObject(new Mesh(stone.geometry, material));
      expect(hits[0].point.y).toBeGreaterThan(.009);
    } finally { batches.forEach(b => b.geometry.dispose()); material.dispose(); }
  });
  it("stops elevated camera rays before the new gate roof, including its projecting eaves", () => {
    const batches = createPlazaLandscapeGeometry();
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const meshes = batches.map(({ geometry }) => new Mesh(geometry, material));
    const colliders = collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG);
    const rays = [
      { origin: [0, 1.25, -4.8], direction: [0, 3.25, -5] },
      { origin: [0, 4.5, -7], direction: [0, 0, -1] },
      { origin: [2.25, 4.7, -12], direction: [0, 0, 1] }
    ];
    try {
      for (const { origin, direction } of rays) {
        const start = new Vector3(...origin);
        const ray = new Vector3(...direction).normalize();
        const [hit] = new Raycaster(start, ray, 0, 8).intersectObjects(meshes, false);
        expect(hit, `roof ray from ${origin}`).toBeDefined();
        const safeDistance = computeUnoccludedDistance(
          start.x, start.y, start.z, ray.x, ray.y, ray.z, 8, colliders
        );
        expect(safeDistance, `camera must stop before roof from ${origin}`).toBeLessThan(hit.distance);
      }
    } finally {
      batches.forEach(({ geometry }) => geometry.dispose());
      material.dispose();
    }
  });

  it("builds finite bounded batches with lit normals and a modest geometry budget", () => {
    const batches = createPlazaLandscapeGeometry();
    let triangles = 0;
    expect(batches.length).toBeGreaterThan(4);
    for (const { geometry } of batches) {
      const position = geometry.getAttribute("position");
      const normal = geometry.getAttribute("normal");
      expect(position.count).toBeGreaterThan(0);
      expect(Array.from(position.array).every(Number.isFinite)).toBe(true);
      expect(Array.from(normal.array).every(Number.isFinite)).toBe(true);
      geometry.computeBoundingBox();
      expect(geometry.boundingBox!.min.y).toBeGreaterThan(-2);
      expect(geometry.boundingBox!.max.y).toBeLessThan(9);
      triangles += (geometry.index?.count ?? position.count) / 3;
      geometry.dispose();
    }
    expect(triangles).toBeLessThan(65000);
    expect(batches.length).toBeLessThanOrEqual(10);
  });
});
