import { describe, expect, it } from "vitest";
import { createSoftAnnularMistSheetGeometry, PLAZA_MIST_VALLEY_DROP } from "./public-plaza-backdrop";

describe("summit mist descending into the valley", () => {
  const base = { innerOut: 4, outerOut: 240, baseY: -2, waveAmp: 0, phase: 0, segs: 16, radialRings: 32 };

  it("stays near the cliff, then descends continuously below the low terraces", () => {
    const geometry = createSoftAnnularMistSheetGeometry({ ...base, valleyDrop: PLAZA_MIST_VALLEY_DROP });
    const positions = geometry.getAttribute("position");
    const uv = geometry.getAttribute("uv");
    expect(positions.getY(0)).toBe(-2);
    expect(positions.getY(positions.count - 1)).toBe(-28);
    expect(uv.getY(0)).toBe(0);
    expect(uv.getY(uv.count - 1)).toBe(1);
    for (let ring = 1; ring <= base.radialRings; ring++) {
      const y = positions.getY(ring * (base.segs + 1));
      const previous = positions.getY((ring - 1) * (base.segs + 1));
      expect(y).toBeLessThanOrEqual(previous);
      expect(y).toBeGreaterThanOrEqual(-28);
      expect(previous - y).toBeLessThan(6);
    }
    geometry.dispose();
  });

  it("preserves the level sheet when no valley drop is requested", () => {
    const geometry = createSoftAnnularMistSheetGeometry(base);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) expect(positions.getY(i)).toBe(-2);
    geometry.dispose();
  });
});
