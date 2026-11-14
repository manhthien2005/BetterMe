import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import {
  createDistantIslandGeometry, DISTANT_ISLANDS,
  PLAZA_VIEW_FAR, PLAZA_SKY_SCALE, PLAZA_REFLECTION_FAR
} from "./plaza-horizon";

describe("Plaza horizon composition", () => {
  it("keeps the sky and its reflection inside the camera range", () => {
    expect(126 * PLAZA_SKY_SCALE + 60).toBeLessThan(PLAZA_VIEW_FAR);
    expect(PLAZA_REFLECTION_FAR).toBeGreaterThan(2 * 126 * PLAZA_SKY_SCALE);
  });

  it("scatters small distant islands beyond the approved archipelago without filling one ring", () => {
    expect(DISTANT_ISLANDS.length).toBeGreaterThanOrEqual(10);
    const radii = DISTANT_ISLANDS.map(p => Math.hypot(p.position[0], p.position[2]));
    expect(Math.min(...radii)).toBeGreaterThan(300);
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(200);
    expect(new Set(DISTANT_ISLANDS.map(p => p.position[1])).size).toBeGreaterThan(6);
    expect(DISTANT_ISLANDS.some(p => p.position[2] > 0)).toBe(true);
    expect(DISTANT_ISLANDS.some(p => p.position[2] < 0)).toBe(true);
    for (const island of DISTANT_ISLANDS) {
      expect(Math.hypot(...island.position) + island.width * 2 + 60).toBeLessThan(112 * PLAZA_SKY_SCALE);
    }
  });

  it("builds repeatable low-cost rock and turf silhouettes with valid bounds", () => {
    const a = createDistantIslandGeometry(2.7), b = createDistantIslandGeometry(2.7);
    expect(Array.from(a.getAttribute("position").array)).toEqual(Array.from(b.getAttribute("position").array));
    const positions = a.getAttribute("position");
    expect(a.index!.count / 3).toBeLessThan(2000);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(a.getAttribute("normal").array).every(Number.isFinite)).toBe(true);
    expect(a.getAttribute("color").count).toBe(positions.count);
    a.computeBoundingBox();
    expect(a.boundingBox!.min.y).toBeLessThan(-0.8);
    expect(a.boundingBox!.max.y).toBeGreaterThan(0);
    expect(a.boundingBox!.max.x - a.boundingBox!.min.x).toBeLessThanOrEqual(2.4);
    a.dispose(); b.dispose();
  });

  it("keeps the turf facing upward and every rock triangle non-degenerate across the scatter", () => {
    for (const island of DISTANT_ISLANDS) {
      const geo = createDistantIslandGeometry(island.seed);
      const p = geo.getAttribute("position"), c = geo.getAttribute("color"), indices = geo.index!;
      const a = new Vector3(), b = new Vector3(), d = new Vector3();
      for (let i = 0; i < indices.count; i += 3) {
        const ids = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
        a.fromBufferAttribute(p, ids[0]); b.fromBufferAttribute(p, ids[1]); d.fromBufferAttribute(p, ids[2]);
        const face = b.sub(a).cross(d.sub(a));
        expect(face.lengthSq()).toBeGreaterThan(1e-10);
        if (ids.every(id => c.getY(id) > c.getZ(id) * 1.2)) expect(face.y).toBeGreaterThan(0);
      }
      geo.dispose();
    }
  });
});
