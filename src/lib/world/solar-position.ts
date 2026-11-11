import { HCMC_UTC_OFFSET_MS } from "@/lib/world/environment-time";
import { HCMC_COORDINATES } from "@/lib/world/environment-weather";

export interface PlazaSolarPosition {
  /** Azimuth in radians clockwise from North (-Z): 0 = North (-Z), π/2 = East (+X), π = South (+Z), 3π/2 = West (-X). */
  azimuthRad: number;
  /** Solar elevation angle in radians above (+) or below (-) the local horizon. */
  elevationRad: number;
  /** World-space unit vector pointing from the plaza toward the sun (+X = East, +Y = Up, -Z = North, +Z = South). */
  direction: readonly [number, number, number];
}

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const HCMC_LAT_RAD = HCMC_COORDINATES.latitude * DEG_TO_RAD;
const HCMC_TIMEZONE_HOURS = 7;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Computes Ho Chi Minh City (10.7769°N, 106.7009°E, Asia/Ho_Chi_Minh UTC+7) solar azimuth,
 * elevation, and world-space unit direction vector for a given UTC epoch timestamp
 * using the NOAA General Solar Position Calculations (solareqns.PDF).
 *
 * Host-timezone independent: all calendar math runs on UTC-shifted HCMC civil components.
 */
export function resolvePlazaSolarPosition(utcMs: number): PlazaSolarPosition {
  const safeUtcMs = Number.isFinite(utcMs) ? utcMs : Date.now();
  const hcmcDate = new Date(safeUtcMs + HCMC_UTC_OFFSET_MS);

  const year = hcmcDate.getUTCFullYear();
  const month0 = hcmcDate.getUTCMonth();
  const day = hcmcDate.getUTCDate();
  const hour = hcmcDate.getUTCHours();
  const minute = hcmcDate.getUTCMinutes();
  const second = hcmcDate.getUTCSeconds();
  const millisecond = hcmcDate.getUTCMilliseconds();

  const startOfYearUtc = Date.UTC(year, 0, 1);
  const currentDayUtc = Date.UTC(year, month0, day);
  const dayOfYear = Math.round((currentDayUtc - startOfYearUtc) / 86_400_000) + 1;
  const daysInYear = isLeapYear(year) ? 366 : 365;

  const localHour = hour + minute / 60 + second / 3600 + millisecond / 3_600_000;
  const gamma = (TWO_PI / daysInYear) * (dayOfYear - 1 + (localHour - 12) / 24);

  // NOAA Equation of Time (in minutes) and Solar Declination (in radians)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const localMinutes = hour * 60 + minute + second / 60 + millisecond / 60_000;
  const timeOffset = eqtime + 4 * HCMC_COORDINATES.longitude - 60 * HCMC_TIMEZONE_HOURS;
  const trueSolarTimeMinutes = localMinutes + timeOffset;
  const hourAngleDeg = trueSolarTimeMinutes / 4 - 180;
  const haRad = hourAngleDeg * DEG_TO_RAD;

  // Local horizontal topocentric unit vector (East, North, Up)
  const east = -Math.cos(decl) * Math.sin(haRad);
  const north =
    Math.cos(HCMC_LAT_RAD) * Math.sin(decl) -
    Math.sin(HCMC_LAT_RAD) * Math.cos(decl) * Math.cos(haRad);
  const up =
    Math.sin(HCMC_LAT_RAD) * Math.sin(decl) +
    Math.cos(HCMC_LAT_RAD) * Math.cos(decl) * Math.cos(haRad);

  const elevationRad = Math.asin(clamp(up, -1, 1));
  const rawAzimuthRad = Math.atan2(east, north);
  const azimuthRad = ((rawAzimuthRad % TWO_PI) + TWO_PI) % TWO_PI;

  const cosElev = Math.cos(elevationRad);
  const direction: [number, number, number] = [
    Math.sin(azimuthRad) * cosElev,
    Math.sin(elevationRad),
    -Math.cos(azimuthRad) * cosElev
  ];

  return {
    azimuthRad,
    elevationRad,
    direction
  };
}

export const PLAZA_CELESTIAL_DISTANCE = 119;
export const PLAZA_SHADOW_LIGHT_DISTANCE = 42;
export const PLAZA_MIN_SHADOW_ELEVATION_Y = 0.16;

export interface PlazaCelestialRigPose {
  /** Local position `[x, y, z]` of the celestial group inside the camera-following sky rig (`[camX, 0, camZ]`). */
  localPosition: [number, number, number];
  /** Resulting world-space position `[x, y, z]` of the celestial body after parent rig translation. */
  worldPosition: [number, number, number];
  /** Unit vector from `cameraPosition` to `worldPosition`. */
  viewDirection: [number, number, number];
  /** World-space position `[x, y, z]` of the shadow-casting directional light targeting `[0, 0, 0]`. */
  shadowLightPosition: [number, number, number];
  /** Whether the celestial disk should be rendered (`false` when the daytime sun is at or below the horizon). */
  visible: boolean;
}

/**
 * Computes the camera-offset-compensated celestial rig pose and directional shadow light position
 * for Public Plaza so that the final world-space vector from `cameraPosition` to the sun disk
 * matches `direction` (`plazaSun.direction`) with `< 0.1°` angular error across all camera heights.
 */
export function resolvePlazaCelestialRigPose(params: {
  direction: readonly [number, number, number];
  cameraPosition?: readonly [number, number, number];
  isNight: boolean;
  celestialDistance?: number;
  shadowLightDistance?: number;
}): PlazaCelestialRigPose {
  const [rawDx, rawDy, rawDz] = params.direction;
  const dLen = Math.hypot(rawDx, rawDy, rawDz) || 1;
  const dx = rawDx / dLen;
  const dy = rawDy / dLen;
  const dz = rawDz / dLen;

  const [camX, camY, camZ] = params.cameraPosition ?? [0, 0, 0];
  const radius = params.celestialDistance ?? PLAZA_CELESTIAL_DISTANCE;
  const shadowDist = params.shadowLightDistance ?? PLAZA_SHADOW_LIGHT_DISTANCE;

  // Parent `plaza-camera-sky-rig` sits at `[camX, 0, camZ]`.
  // Adding `camY` to the local Y coordinate places the celestial body at `camPos + direction * radius` in world space.
  const localPosition: [number, number, number] = [
    dx * radius,
    camY + dy * radius,
    dz * radius
  ];

  const worldPosition: [number, number, number] = [
    camX + localPosition[0],
    localPosition[1],
    camZ + localPosition[2]
  ];

  const vx = worldPosition[0] - camX;
  const vy = worldPosition[1] - camY;
  const vz = worldPosition[2] - camZ;
  const vLen = Math.hypot(vx, vy, vz) || 1;
  const viewDirection: [number, number, number] = [vx / vLen, vy / vLen, vz / vLen];

  let shadowLightPosition: [number, number, number];
  if (!params.isNight && dy > 0) {
    // Daytime above-horizon sun: keep shadow light strictly collinear with the true solar vector
    // so low-sun hours (e.g. 06:00 at ~2.31° and 17:20 at ~0.97°) cast long shadows matching the sun disk (< 0.1° error).
    shadowLightPosition = [dx * shadowDist, dy * shadowDist, dz * shadowDist];
  } else {
    const clampedShadowY = Math.max(dy, PLAZA_MIN_SHADOW_ELEVATION_Y);
    const sLen = Math.hypot(dx, clampedShadowY, dz) || 1;
    shadowLightPosition = [
      (dx / sLen) * shadowDist,
      (clampedShadowY / sLen) * shadowDist,
      (dz / sLen) * shadowDist
    ];
  }

  const visible = params.isNight ? true : dy > 0;

  return {
    localPosition,
    worldPosition,
    viewDirection,
    shadowLightPosition,
    visible
  };
}
