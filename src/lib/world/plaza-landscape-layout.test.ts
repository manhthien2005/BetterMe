import { describe, expect, it } from "vitest";

import { collectMapColliders, PERSONAL_WORLD_MAP_CONFIG, PUBLIC_PLAZA_MAP_CONFIG } from "./map-config";
import { resolveCircleAabbCollision } from "./physics";
import { PLAZA_GARDEN_ASSETS, PLAZA_LANDSCAPE_COLLIDERS } from "./plaza-landscape-layout";

describe("plaza landscape circulation", () => {
  it("expands only the public envelope while preserving interaction anchors", () => {
    expect(PUBLIC_PLAZA_MAP_CONFIG.bounds).toEqual({ minX: -28, maxX: 28, minZ: -24, maxZ: 24 });
    expect(PUBLIC_PLAZA_MAP_CONFIG.spawn.position).toEqual([0, 0, 5.8]);
    expect(PUBLIC_PLAZA_MAP_CONFIG.portals[0].position).toEqual([0, 0, -9.8]);
  });
  it("registers every garden solid in the plaza only", () => {
    expect(PLAZA_LANDSCAPE_COLLIDERS.length).toBeGreaterThan(4);
    for (const collider of PLAZA_LANDSCAPE_COLLIDERS) {
      expect(collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG)).toContainEqual(collider);
      expect(collectMapColliders(PERSONAL_WORLD_MAP_CONFIG).some((box) => box.id === collider.id)).toBe(false);
    }
    expect(new Set(PLAZA_GARDEN_ASSETS.map((asset) => asset.id)).size).toBe(PLAZA_GARDEN_ASSETS.length);
  });

  it("keeps spawn, both fountain bypasses, NPC approaches and portal free of added solids", () => {
    const points = [[0, 5.8], [-4.4, 4.5], [4.8, -6.5], [0, -9.8]];
    for (let z = -12; z <= 12; z += 0.5) points.push([-3.5, z], [3.5, z]);
    for (let x = -8; x <= 8; x += 0.5) points.push([x, 5.8]);
    for (const [x, z] of points) {
      for (const collider of PLAZA_LANDSCAPE_COLLIDERS) {
        expect(resolveCircleAabbCollision(x, z, 0.45, collider), `${collider.id} at ${x},${z}`).toEqual({ x, z });
      }
    }
  });

  it("places finite solids within bounds and prevents walking through their centers", () => {
    for (const collider of PLAZA_LANDSCAPE_COLLIDERS) {
      const x = (collider.minX + collider.maxX) / 2;
      const z = (collider.minZ + collider.maxZ) / 2;
      expect([collider.minX, collider.maxX, collider.minZ, collider.maxZ, collider.maxY].every(Number.isFinite)).toBe(true);
      expect(collider.minX).toBeGreaterThanOrEqual(-16);
      expect(collider.maxX).toBeLessThanOrEqual(16);
      expect(collider.minZ).toBeGreaterThanOrEqual(-15);
      expect(collider.maxZ).toBeLessThanOrEqual(15);
      expect(resolveCircleAabbCollision(x, z, 0.45, collider)).not.toEqual({ x, z });
    }
  });
});
