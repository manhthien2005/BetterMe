import { Color, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import {
  CLOUD_FRAGMENT_SHADER,
  computeSpriteSpaceSunDirection,
  PLAZA_V2_CLOUD_SPRITES,
  PLAZA_V2_CLOUD_TEXTURE_PATHS,
  sampleLocalSkyColorForCloud
} from "@/components/world/public-plaza-sky-clouds";
import { buildHcmcUtcEpochMs, resolveHcmcTimeSnapshot } from "@/lib/world/environment-time";
import {
  resolvePlazaCelestialRigPose,
  resolvePlazaSolarPosition
} from "@/lib/world/solar-position";

const RAD_TO_DEG = 180 / Math.PI;

function angleBetweenDegrees(
  a: readonly [number, number, number],
  b: readonly [number, number, number]
): number {
  const lenA = Math.hypot(a[0], a[1], a[2]) || 1;
  const lenB = Math.hypot(b[0], b[1], b[2]) || 1;
  const dot = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (lenA * lenB);
  const clamped = Math.max(-1, Math.min(1, dot));
  return Math.acos(clamped) * RAD_TO_DEG;
}

describe("resolvePlazaSolarPosition (Ho Chi Minh City NOAA solar position)", () => {
  it("places the morning sun in the East (direction[0] > 0) at 2026-11-09 07:30 ICT", () => {
    const utcMs = Date.parse("2026-11-09T07:30:00+07:00");
    const sun = resolvePlazaSolarPosition(utcMs);

    expect(sun.direction[0]).toBeGreaterThan(0);
    expect(sun.direction[1]).toBeGreaterThan(0);
    expect(sun.elevationRad).toBeGreaterThan(0);
  });

  it("places the afternoon sun in the West (direction[0] < 0) at 2026-11-09 16:30 ICT", () => {
    const utcMs = Date.parse("2026-11-09T16:30:00+07:00");
    const sun = resolvePlazaSolarPosition(utcMs);

    expect(sun.direction[0]).toBeLessThan(0);
    expect(sun.direction[1]).toBeGreaterThan(0);
    expect(sun.elevationRad).toBeGreaterThan(0);
  });

  it("computes higher solar elevation at 12:00 than at 07:30 and 16:30 on 2026-11-09", () => {
    const morning = resolvePlazaSolarPosition(Date.parse("2026-11-09T07:30:00+07:00"));
    const noon = resolvePlazaSolarPosition(Date.parse("2026-11-09T12:00:00+07:00"));
    const afternoon = resolvePlazaSolarPosition(Date.parse("2026-11-09T16:30:00+07:00"));

    expect(noon.elevationRad).toBeGreaterThan(morning.elevationRad);
    expect(noon.elevationRad).toBeGreaterThan(afternoon.elevationRad);
    expect(noon.direction[1]).toBeGreaterThan(morning.direction[1]);
    expect(noon.direction[1]).toBeGreaterThan(afternoon.direction[1]);
  });

  it("places the night sun below the horizon (elevationRad < 0, direction[1] < 0) at 2026-11-09 22:00 ICT", () => {
    const night = resolvePlazaSolarPosition(Date.parse("2026-11-09T22:00:00+07:00"));

    expect(night.elevationRad).toBeLessThan(0);
    expect(night.direction[1]).toBeLessThan(0);
  });

  it("produces different morning azimuths across seasons (June solstice vs December solstice at 06:30 ICT)", () => {
    const summerMorning = resolvePlazaSolarPosition(Date.parse("2026-06-21T06:30:00+07:00"));
    const winterMorning = resolvePlazaSolarPosition(Date.parse("2026-12-21T06:30:00+07:00"));

    expect(summerMorning.direction[0]).toBeGreaterThan(0);
    expect(winterMorning.direction[0]).toBeGreaterThan(0);
    // In June (declination +23.4°N), sun rises North-of-East (-Z < 0);
    // in December (declination -23.4°S), sun rises South-of-East (+Z > 0).
    expect(summerMorning.direction[2]).toBeLessThan(0);
    expect(winterMorning.direction[2]).toBeGreaterThan(0);
    expect(Math.abs(summerMorning.azimuthRad - winterMorning.azimuthRad)).toBeGreaterThan(0.5);
  });

  it("returns a finite unit vector matching the spherical azimuth/elevation formula", () => {
    const timestamps = [
      Date.parse("2026-11-09T07:30:00+07:00"),
      Date.parse("2026-11-09T12:15:00+07:00"),
      Date.parse("2026-11-09T17:30:00+07:00"),
      Date.parse("2026-11-09T22:00:00+07:00")
    ];

    for (const utcMs of timestamps) {
      const { azimuthRad, elevationRad, direction } = resolvePlazaSolarPosition(utcMs);
      expect(Number.isFinite(azimuthRad)).toBe(true);
      expect(Number.isFinite(elevationRad)).toBe(true);
      expect(direction.every((c) => Number.isFinite(c))).toBe(true);

      const length = Math.hypot(direction[0], direction[1], direction[2]);
      expect(length).toBeCloseTo(1, 6);

      expect(direction[0]).toBeCloseTo(Math.sin(azimuthRad) * Math.cos(elevationRad), 6);
      expect(direction[1]).toBeCloseTo(Math.sin(elevationRad), 6);
      expect(direction[2]).toBeCloseTo(-Math.cos(azimuthRad) * Math.cos(elevationRad), 6);
    }
  });

  it("matches independent NOAA Solar Calculation reference values for HCMC (10.7769N, 106.7009E) on 2026-11-09", () => {
    // Reference computed directly from NOAA Solar Calculation equations (solareqns.PDF):
    // At 2026-11-09 07:30 ICT (00:30 UTC), dayOfYear = 313, gamma = 5.367605 rad:
    // eqtime = +16.01 min, decl = -0.289785 rad (-16.60°), tst = 472.82 min, ha = -61.80°:
    // elevation ≈ +23.05° (0.4022 rad), azimuth ≈ 113.44° clockwise from North (1.9799 rad)
    // direction ≈ [0.8445, 0.3915, 0.3654]
    const morning0730 = resolvePlazaSolarPosition(Date.parse("2026-11-09T07:30:00+07:00"));
    expect(morning0730.elevationRad).toBeCloseTo(0.4022, 2);
    expect(morning0730.azimuthRad).toBeCloseTo(1.9799, 2);
    expect(morning0730.direction[0]).toBeCloseTo(0.8445, 2);
    expect(morning0730.direction[1]).toBeCloseTo(0.3915, 2);
    expect(morning0730.direction[2]).toBeCloseTo(0.3654, 2);

    // At 2026-11-09 12:00 ICT (05:00 UTC):
    // tst ≈ 742.82 min, ha ≈ +5.70° (just past solar noon ~11:37 ICT because 106.7°E is East of 105°E + eqtime +16m)
    // elevation ≈ +62.08° (1.0835 rad), azimuth ≈ 191.6° (3.344 rad, SSW)
    const noon1200 = resolvePlazaSolarPosition(Date.parse("2026-11-09T12:00:00+07:00"));
    expect(noon1200.elevationRad).toBeCloseTo(1.0835, 2);
    expect(noon1200.azimuthRad).toBeCloseTo(3.344, 2);
    expect(noon1200.direction[0]).toBeLessThan(0); // slightly West of meridian at 12:00 civil because solar noon is ~11:37
    expect(noon1200.direction[1]).toBeCloseTo(0.8836, 2);
    expect(noon1200.direction[2]).toBeCloseTo(0.4589, 2);
  });

  it("works deterministically with preview date/time epochs regardless of host timezone", () => {
    const previewEpochMs = buildHcmcUtcEpochMs("2026-11-09", "07:30");
    expect(previewEpochMs).not.toBeNull();
    const previewTime = resolveHcmcTimeSnapshot(previewEpochMs!);
    const fromPreview = resolvePlazaSolarPosition(previewTime.utcMs);
    const fromIso = resolvePlazaSolarPosition(Date.parse("2026-11-09T07:30:00+07:00"));

    expect(fromPreview.azimuthRad).toBeCloseTo(fromIso.azimuthRad, 6);
    expect(fromPreview.elevationRad).toBeCloseTo(fromIso.elevationRad, 6);
    expect(fromPreview.direction).toEqual(fromIso.direction);
  });

  it("aligns the celestial rig world vector and daytime shadow light with plazaSun.direction within < 0.1° at 06:00, 07:30, 12:15, 15:30, and 17:20 on 2026-11-09", () => {
    const checkpoints: readonly {
      label: string;
      iso: string;
      expectedElevationDeg: number;
    }[] = [
      { label: "06:00 low morning", iso: "2026-11-09T06:00:00+07:00", expectedElevationDeg: 2.31 },
      { label: "07:30 morning", iso: "2026-11-09T07:30:00+07:00", expectedElevationDeg: 23.05 },
      { label: "12:15 noon", iso: "2026-11-09T12:15:00+07:00", expectedElevationDeg: 61.02 },
      { label: "15:30 afternoon", iso: "2026-11-09T15:30:00+07:00", expectedElevationDeg: 26.24 },
      { label: "17:20 low dusk-edge", iso: "2026-11-09T17:20:00+07:00", expectedElevationDeg: 0.97 }
    ];

    const cameraPositions: readonly [number, number, number][] = [
      [0, 2.45, 11.2],
      [-6.4, 5.8, -9.1],
      [12.0, 8.2, 14.5]
    ];

    for (const cp of checkpoints) {
      const sun = resolvePlazaSolarPosition(Date.parse(cp.iso));
      const trueElevationDeg = sun.elevationRad * RAD_TO_DEG;
      expect(trueElevationDeg).toBeCloseTo(cp.expectedElevationDeg, 1);

      for (const camPos of cameraPositions) {
        const pose = resolvePlazaCelestialRigPose({
          direction: sun.direction,
          cameraPosition: camPos,
          isNight: false
        });

        expect(pose.visible).toBe(true);

        // Vector from cameraPosition to worldPosition after parent rig [camX, 0, camZ] translation
        const camToSun: [number, number, number] = [
          pose.worldPosition[0] - camPos[0],
          pose.worldPosition[1] - camPos[1],
          pose.worldPosition[2] - camPos[2]
        ];
        const sunAngleErrorDeg = angleBetweenDegrees(camToSun, sun.direction);
        expect(sunAngleErrorDeg).toBeLessThan(0.1);

        // Resulting elevation of the sun disk from the camera must match true solar elevation within < 0.1°
        const diskElevationDeg =
          Math.asin(
            camToSun[1] / Math.hypot(camToSun[0], camToSun[1], camToSun[2])
          ) * RAD_TO_DEG;
        expect(Math.abs(diskElevationDeg - trueElevationDeg)).toBeLessThan(0.1);

        // Shadow-casting directional light vector must also match plazaSun.direction within < 0.1°
        const shadowAngleErrorDeg = angleBetweenDegrees(
          pose.shadowLightPosition,
          sun.direction
        );
        expect(shadowAngleErrorDeg).toBeLessThan(0.1);

        const shadowElevationDeg =
          Math.asin(
            pose.shadowLightPosition[1] /
              Math.hypot(
                pose.shadowLightPosition[0],
                pose.shadowLightPosition[1],
                pose.shadowLightPosition[2]
              )
          ) * RAD_TO_DEG;
        expect(Math.abs(shadowElevationDeg - diskElevationDeg)).toBeLessThan(0.1);
      }
    }
  });

  it("enforces strictly increasing smoothstep(edge0, edge1, x) thresholds (edge0 < edge1) in CLOUD_FRAGMENT_SHADER", () => {
    const smoothstepRegex = /smoothstep\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,/g;
    const matches = [...CLOUD_FRAGMENT_SHADER.matchAll(smoothstepRegex)];
    expect(matches.length).toBeGreaterThanOrEqual(4);

    for (const match of matches) {
      const edge0 = Number(match[1]);
      const edge1 = Number(match[2]);
      expect(Number.isFinite(edge0)).toBe(true);
      expect(Number.isFinite(edge1)).toBe(true);
      expect(edge0).toBeLessThan(edge1);
    }
  });

  it("hides the solar disk (visible = false) when the sun is below the horizon (elevationRad <= 0)", () => {
    const nightSun = resolvePlazaSolarPosition(Date.parse("2026-11-09T22:00:00+07:00"));
    expect(nightSun.elevationRad).toBeLessThan(0);

    const solarPose = resolvePlazaCelestialRigPose({
      direction: nightSun.direction,
      cameraPosition: [0, 2.45, 11.2],
      isNight: false
    });
    expect(solarPose.visible).toBe(false);
  });

  it("uses all 12 independent V2 cloud textures across 3 depth layers with progressive skyBlend factors", () => {
    const usedTextureIds = new Set(PLAZA_V2_CLOUD_SPRITES.map((s) => s.textureId));
    expect(usedTextureIds.size).toBe(12);
    for (const texId of Object.keys(PLAZA_V2_CLOUD_TEXTURE_PATHS)) {
      expect(usedTextureIds.has(texId as keyof typeof PLAZA_V2_CLOUD_TEXTURE_PATHS)).toBe(true);
    }

    for (const sprite of PLAZA_V2_CLOUD_SPRITES) {
      if (sprite.layer === "hero") {
        expect(sprite.skyBlend).toBeGreaterThanOrEqual(0.1);
        expect(sprite.skyBlend).toBeLessThanOrEqual(0.18);
      } else if (sprite.layer === "mid") {
        expect(sprite.skyBlend).toBeGreaterThanOrEqual(0.22);
        expect(sprite.skyBlend).toBeLessThanOrEqual(0.32);
      } else {
        expect(sprite.skyBlend).toBeGreaterThanOrEqual(0.4);
        expect(sprite.skyBlend).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it("shifts sprite-space solar direction from East-lit (07:30) to top-lit (12:15) to West-lit (15:30) on northern clouds", () => {
    const northCloudPos: [number, number, number] = [-38, 10.2, -106.5];
    const sun0730 = resolvePlazaSolarPosition(Date.parse("2026-11-09T07:30:00+07:00"));
    const sun1215 = resolvePlazaSolarPosition(Date.parse("2026-11-09T12:15:00+07:00"));
    const sun1530 = resolvePlazaSolarPosition(Date.parse("2026-11-09T15:30:00+07:00"));

    const spriteSun0730 = computeSpriteSpaceSunDirection(
      northCloudPos,
      sun0730.direction,
      new Vector3()
    );
    const spriteSun1215 = computeSpriteSpaceSunDirection(
      northCloudPos,
      sun1215.direction,
      new Vector3()
    );
    const spriteSun1530 = computeSpriteSpaceSunDirection(
      northCloudPos,
      sun1530.direction,
      new Vector3()
    );

    // At 07:30, sun is to the right (East) of the North cloud; at 15:30, sun is to the left (West); at 12:15, sun is highest (y)
    expect(spriteSun0730.x).toBeGreaterThan(0.45);
    expect(spriteSun1530.x).toBeLessThan(-0.35);
    expect(spriteSun1215.y).toBeGreaterThan(spriteSun0730.y);
    expect(spriteSun1215.y).toBeGreaterThan(spriteSun1530.y);

    // Local sky color at high altitude (y = 24.5m) is deeper blue than low horizon altitude (y = 7.4m)
    const lowSky = sampleLocalSkyColorForCloud({
      spritePosition: [-56, 7.4, -102],
      fogColor: new Color("#daf1fb"),
      horizonColor: new Color("#b5edfd"),
      midColor: new Color("#44abfb"),
      zenithColor: new Color("#186cd9"),
      sunGlowColor: new Color("#fff6dc"),
      sunDirection: sun0730.direction,
      sunGlowStrength: 0.68,
      outColor: new Color()
    });
    const highSky = sampleLocalSkyColorForCloud({
      spritePosition: [2, 24.5, -114.5],
      fogColor: new Color("#daf1fb"),
      horizonColor: new Color("#b5edfd"),
      midColor: new Color("#44abfb"),
      zenithColor: new Color("#186cd9"),
      sunGlowColor: new Color("#fff6dc"),
      sunDirection: sun0730.direction,
      sunGlowStrength: 0.68,
      outColor: new Color()
    });
    expect(lowSky.r).toBeGreaterThan(highSky.r);
    expect(lowSky.g).toBeGreaterThan(highSky.g);
  });
});
