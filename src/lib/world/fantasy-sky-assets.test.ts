import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createFantasyStars,
  FANTASY_CLOUD_PLACEMENTS,
  FANTASY_CLOUD_SHAPES,
  FANTASY_SKY_PALETTES,
  FANTASY_SKY_SOURCE_ASSETS,
  sampleFantasyCloudDensity
} from "@/lib/world/fantasy-sky-assets";

describe("fantasy sky cloud assets", () => {
  it("authors eight distinct silhouettes with bounded lobe work and clear texture borders", () => {
    const shapes = Object.values(FANTASY_CLOUD_SHAPES);
    expect(shapes).toHaveLength(8);
    expect(new Set(shapes.map((shape) => shape.kind))).toEqual(
      new Set(["hero-cumulus", "layered-bank", "fine-wisp"])
    );
    for (const shape of shapes) {
      expect(shape.lobes.length).toBeGreaterThanOrEqual(4);
      expect(shape.lobes.length).toBeLessThanOrEqual(8);
      for (const lobe of shape.lobes) {
        expect(Math.abs(lobe.cx) + lobe.rx).toBeLessThanOrEqual(0.94);
        expect(Math.abs(lobe.cy) + lobe.ry).toBeLessThanOrEqual(0.94);
        expect(lobe.rx).toBeGreaterThan(0);
        expect(lobe.ry).toBeGreaterThan(0);
        expect(lobe.weight).toBeGreaterThan(0);
        expect(lobe.weight).toBeLessThanOrEqual(1);
      }
      let nonemptySamples = 0;
      for (let row = 0; row <= 40; row += 1) {
        for (let column = 0; column <= 40; column += 1) {
          const density = sampleFantasyCloudDensity(shape, column / 20 - 1, row / 20 - 1);
          expect(density).toBeGreaterThanOrEqual(0);
          expect(density).toBeLessThanOrEqual(1);
          if (row === 0 || column === 0 || row === 40 || column === 40) {
            expect(density).toBe(0);
          }
          if (density > 0.05) nonemptySamples += 1;
        }
      }
      expect(nonemptySamples).toBeGreaterThan(45);
    }
    expect(new Set(shapes.map((shape) => JSON.stringify(shape.lobes))).size).toBe(8);
  });

  it("keeps alpha continuous at each lobe's outer boundary", () => {
    const shape = FANTASY_CLOUD_SHAPES["cumulus-tower"];
    const lobe = shape.lobes[0];
    expect(sampleFantasyCloudDensity(shape, lobe.cx, lobe.cy)).toBeGreaterThan(0.4);
    expect(sampleFantasyCloudDensity(shape, -2, 0)).toBe(0);
    expect(sampleFantasyCloudDensity(shape, Number.NaN, 0)).toBe(0);
    expect(sampleFantasyCloudDensity(shape, 0, Number.POSITIVE_INFINITY)).toBe(0);
    const isolated = { ...shape, lobes: [lobe] };
    expect(sampleFantasyCloudDensity(isolated, lobe.cx + lobe.rx, lobe.cy)).toBe(0);
    expect(sampleFantasyCloudDensity(isolated, lobe.cx + lobe.rx * 0.999, lobe.cy)).toBeLessThan(0.001);
  });

  it("spans the compass with clear gaps, no nearby repeated silhouette, and thinner night clouds", () => {
    expect(FANTASY_CLOUD_PLACEMENTS.length).toBeLessThanOrEqual(24);
    expect(new Set(FANTASY_CLOUD_PLACEMENTS.map((cloud) => cloud.id)).size).toBe(
      FANTASY_CLOUD_PLACEMENTS.length
    );
    const visible = FANTASY_CLOUD_PLACEMENTS.filter((cloud) => cloud.minCloudCover <= 12);
    const quadrants = new Set<number>();
    for (const cloud of visible) {
      expect(FANTASY_CLOUD_SHAPES[cloud.shapeId]).toBeDefined();
      expect(Math.hypot(...cloud.position)).toBeGreaterThan(111.5);
      expect(Math.hypot(...cloud.position, cloud.scale[0] / 2, cloud.scale[1] / 2)).toBeLessThan(126);
      expect(cloud.opacity).toBeGreaterThan(0);
      expect(cloud.nightOpacity).toBeGreaterThan(0);
      expect(cloud.nightOpacity).toBeLessThan(cloud.opacity * 0.55);
      expect(cloud.position[1]).toBeGreaterThan(10);
      const angle = (Math.atan2(cloud.position[0], -cloud.position[2]) + Math.PI * 2) % (Math.PI * 2);
      quadrants.add(Math.floor(angle / (Math.PI / 2)));
      for (const other of visible) {
        if (other.id === cloud.id || other.shapeId !== cloud.shapeId) continue;
        const otherAngle = Math.atan2(other.position[0], -other.position[2]);
        const separation = Math.abs(Math.atan2(Math.sin(angle - otherAngle), Math.cos(angle - otherAngle)));
        expect(separation).toBeGreaterThan(Math.PI / 2);
      }
    }
    expect(quadrants.size).toBe(4);
    const heroWidth = visible
      .filter((cloud) => cloud.layer === "hero")
      .reduce((total, cloud) => total + 2 * Math.atan(cloud.scale[0] / (2 * Math.hypot(...cloud.position))), 0);
    expect(heroWidth).toBeLessThan(Math.PI);
  });
});

describe("fantasy sky stars and palettes", () => {
  it("repeats the same bounded 96-point field from a seed without using global randomness", () => {
    const stars = createFantasyStars(42);
    expect(stars).toHaveLength(96);
    expect(createFantasyStars(42)).toEqual(stars);
    expect(createFantasyStars(43)).not.toEqual(stars);
    expect(new Set(stars.map((star) => star.id)).size).toBe(96);
    expect(createFantasyStars(Number.NaN)).toEqual(createFantasyStars());
    for (const star of stars) {
      expect(Math.hypot(...star.position)).toBeCloseTo(123);
      expect(star.position[1] / 123).toBeGreaterThanOrEqual(Math.sin(Math.PI / 18));
      expect(star.sizePx).toBeGreaterThanOrEqual(0.8);
      expect(star.sizePx).toBeLessThanOrEqual(2);
      expect(star.brightness).toBeGreaterThanOrEqual(0.45);
      expect(star.brightness).toBeLessThanOrEqual(1);
      expect(star.twinklePeriodSeconds).toBeGreaterThanOrEqual(6);
      expect(star.twinklePeriodSeconds).toBeLessThanOrEqual(12);
      expect(star.twinkleAmplitude).toBeGreaterThanOrEqual(0);
      expect(star.twinkleAmplitude).toBeLessThanOrEqual(0.12);
    }
    expect(stars.filter((star) => star.twinkleAmplitude > 0)).toHaveLength(18);
    expect(stars.filter((star) => star.sizePx > 1.5).length).toBeLessThanOrEqual(12);
  });

  it("provides three complete lighting palettes and preserves source provenance", () => {
    expect(Object.keys(FANTASY_SKY_PALETTES)).toEqual(["day", "sunset", "night"]);
    for (const palette of Object.values(FANTASY_SKY_PALETTES)) {
      for (const value of Object.values(palette)) expect(value).toMatch(/^#[\da-f]{6}$/i);
      expect(palette.cloudLightHex).not.toEqual(palette.cloudShadowHex);
    }
    const sunset = FANTASY_SKY_PALETTES.sunset.cloudLightHex;
    expect(parseInt(sunset.slice(1, 3), 16)).toBeGreaterThan(parseInt(sunset.slice(5, 7), 16));
    expect(FANTASY_SKY_SOURCE_ASSETS.moon.credit).toContain("NASA");
    expect(FANTASY_SKY_SOURCE_ASSETS.moon.sourcePath).toContain("moon-lroc-color-2k.jpg");
    expect(FANTASY_SKY_SOURCE_ASSETS.aurora.sourcePath).toContain("aurora-ribbon-v1.png");
  });

  it("publishes the NASA moon unchanged with matching recorded integrity", () => {
    const moon = FANTASY_SKY_SOURCE_ASSETS.moon;
    const source = readFileSync(resolve(process.cwd(), moon.sourcePath));
    const published = readFileSync(resolve(process.cwd(), `public${moon.runtimePath}`));
    expect(published.equals(source)).toBe(true);
    expect(published.byteLength).toBe(moon.bytes);
    expect(createHash("sha256").update(published).digest("hex")).toBe(moon.sha256);
  });
});
