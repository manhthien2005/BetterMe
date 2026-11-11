import { describe, expect, it } from "vitest";
import { PLAZA_NATURE_COLLIDERS, PLAZA_NATURE_PLACEMENTS, PLAZA_PAVILION_COLLIDERS } from "./plaza-nature-layout";
import { resolveCircleAabbCollision } from "./physics";
import { collectMapColliders, PUBLIC_PLAZA_MAP_CONFIG } from "./map-config";

describe("expanded Plaza nature placement", () => {
  it("blocks the new lantern bases and pavilion post feet without a tall invisible railing", () => {
    const colliders = collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG);
    for (const [x, z] of [[-21, 12], [21, 12], [-7, 20.8], [7, 20.8], [-21, -16], [21, -16]]) {
      expect(colliders.some(b => !b.cameraOnly && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ)).toBe(true);
    }
    const posts = PLAZA_PAVILION_COLLIDERS.filter(b => b.id.startsWith("pavilion-post-"));
    expect(posts).toHaveLength(4);
    for (const rail of PLAZA_PAVILION_COLLIDERS.filter(b => b.id.startsWith("pavilion-rail-"))) expect(rail.maxY).toBeLessThan(1);
  });
  it("has unique deterministic transforms and local modeled variants", () => {
    expect(new Set(PLAZA_NATURE_PLACEMENTS.map(p => p.id)).size).toBe(PLAZA_NATURE_PLACEMENTS.length);
    for (const p of PLAZA_NATURE_PLACEMENTS) {
      expect([...p.position, ...p.scale, p.yaw].every(Number.isFinite)).toBe(true);
      expect(p.scale.every(n => n > 0)).toBe(true);
    }
  });
  it("keeps the outer loop, spokes, NPC approaches, portal and pavilion entrance clear", () => {
    const points = [[0, 5.8], [-4.4, 4.5], [4.8, -6.5], [0, -9.8], [-20, -6.3]];
    for (let z = -19; z <= 19; z += .5) points.push([-23, z], [23, z], [0, z]);
    for (let x = -23; x <= 23; x += .5) points.push([x, -19], [x, 19], [x, 5.8]);
    for (let x = -23; x < -14; x += .5) points.push([x, -6.3]);
    for (const [x, z] of points) for (const box of [...PLAZA_NATURE_COLLIDERS, ...PLAZA_PAVILION_COLLIDERS].filter(b => !b.cameraOnly)) {
      expect(resolveCircleAabbCollision(x, z, .45, box), `${box.id} at ${x},${z}`).toEqual({ x, z });
    }
  });
});
