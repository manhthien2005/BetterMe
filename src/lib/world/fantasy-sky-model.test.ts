import { describe, expect, it } from "vitest";
import { resolveFantasySkyLook } from "@/lib/world/fantasy-sky-model";

const rad = (degrees: number) => degrees * Math.PI / 180;

describe("fantasy sky solar/weather transitions", () => {
  it("opens a bright day and reserves stars for darkness", () => {
    const day = resolveFantasySkyLook(rad(60), 30, "partly_cloudy");
    const night = resolveFantasySkyLook(rad(-30), 30, "partly_cloudy");
    expect(day.dayWeight).toBe(1);
    expect(day.starOpacity).toBe(0);
    expect(night.nightWeight).toBe(1);
    expect(night.starOpacity).toBeGreaterThan(0.6);
    expect(night.cloudDensity).toBeLessThan(day.cloudDensity);
  });

  it("gives the low sun a warm twilight before opening the night sky", () => {
    const sunset = resolveFantasySkyLook(rad(-1), 12, "clear");
    expect(sunset.twilightWeight).toBeGreaterThan(0.8);
    expect(sunset.nightWeight).toBeLessThan(0.2);
    expect(sunset.dayWeight).toBe(0);
  });

  it("keeps storm clouds while suppressing stars, moon and aurora", () => {
    const clear = resolveFantasySkyLook(rad(-30), 12, "clear");
    const rain = resolveFantasySkyLook(rad(-30), 92, "rain");
    expect(rain.cloudDensity).toBeGreaterThan(clear.cloudDensity);
    expect(rain.starOpacity).toBeLessThan(0.1);
    expect(rain.celestialVisibility).toBeLessThan(clear.celestialVisibility);
    expect(rain.auroraOpacity).toBeLessThan(0.05);
  });

  it("does not pop colors or cloud coverage across solar boundaries", () => {
    for (const edge of [-14, -4, 0, 22]) {
      const before = resolveFantasySkyLook(rad(edge - 0.01), 42, "partly_cloudy");
      const after = resolveFantasySkyLook(rad(edge + 0.01), 42, "partly_cloudy");
      for (const key of Object.keys(before) as (keyof typeof before)[]) {
        expect(Math.abs(after[key] - before[key])).toBeLessThan(0.01);
      }
    }
  });

  it("keeps finite normalized weights at invalid and extreme input values", () => {
    for (const elevation of [NaN, Infinity, -Math.PI/2, Math.PI/2]) {
      for (const cover of [-100, NaN, 500]) {
        const look = resolveFantasySkyLook(elevation, cover, "partly_cloudy");
        expect(look.dayWeight + look.twilightWeight + look.nightWeight).toBeCloseTo(1);
        for (const value of Object.values(look)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
