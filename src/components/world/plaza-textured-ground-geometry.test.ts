import { describe, expect, it } from "vitest";
import { createPlazaGroundGeometry } from "./plaza-textured-ground-geometry";

describe("textured Plaza ground", () => {
  it("faces upwards throughout the loop, court and planting beds with finite world-space UVs", () => {
    const geometries = createPlazaGroundGeometry();
    try {
      for (const geometry of Object.values(geometries)) {
        const p = geometry.getAttribute("position"), n = geometry.getAttribute("normal"), uv = geometry.getAttribute("uv");
        expect(p.count).toBeGreaterThan(0);
        for (let i = 0; i < p.count; i++) {
          expect([p.getX(i), p.getY(i), p.getZ(i), uv.getX(i), uv.getY(i)].every(Number.isFinite)).toBe(true);
          expect(n.getY(i)).toBeGreaterThan(.99);
          expect(uv.getX(i)).toBeCloseTo(p.getX(i) / 3, 4);
          expect(uv.getY(i)).toBeCloseTo(p.getZ(i) / 3, 4);
        }
      }
    } finally { Object.values(geometries).forEach(g => g.dispose()); }
  });
});
