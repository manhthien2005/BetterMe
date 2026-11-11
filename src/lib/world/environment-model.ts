import {
  buildHcmcUtcEpochMs,
  HCMC_TIMEZONE,
  resolveDayPhase,
  resolveHcmcTimeSnapshot,
  resolveSunriseSunsetForDate,
  type DayPhaseId,
  type SeasonId
} from "@/lib/world/environment-time";
import {
  classifyWeatherCondition,
  evaluateWeatherFreshness,
  HCMC_COORDINATES,
  type HcmcWeatherReading,
  type WeatherConditionKind,
  type WeatherFetchStatus,
  type WeatherFreshness
} from "@/lib/world/environment-weather";
import {
  resolvePlazaSolarPosition,
  type PlazaSolarPosition
} from "@/lib/world/solar-position";

export type EnvironmentPresetId =
  | "phase_morning"
  | "phase_noon"
  | "phase_afternoon"
  | "phase_dusk"
  | "phase_night"
  | "season_spring"
  | "season_summer"
  | "season_autumn"
  | "season_winter";

export interface EnvironmentPreviewOverride {
  isoDate: string;
  time24h: string;
  weatherKind: WeatherConditionKind;
  cloudCoverPct: number;
  temperatureC: number;
  relativeHumidityPct: number;
}

export interface SceneLightingProfile {
  skyZenithHex: string;
  skyMidHex: string;
  skyHorizonHex: string;
  fogColorHex: string;
  fogNear: number;
  fogFar: number;
  ambientColorHex: string;
  ambientIntensity: number;
  hemisphereSkyHex: string;
  hemisphereGroundHex: string;
  hemisphereIntensity: number;
  directionalColorHex: string;
  directionalIntensity: number;
  sunPosition: [number, number, number];
  celestialColorHex: string;
  celestialEmissiveHex: string;
  celestialScale: number;
  starOpacity: number;
  cloudColorHex: string;
  cloudOpacity: number;
}

export interface EffectiveEnvironmentSnapshot {
  mode: "live" | "preview";
  isPreview: boolean;
  locationName: typeof HCMC_COORDINATES.name;
  timezone: typeof HCMC_TIMEZONE;
  isoDate: string;
  time24h: string;
  dateDisplay: string;
  minutesOfDay: number;
  season: SeasonId;
  seasonLabel: string;
  dayPhase: DayPhaseId;
  dayPhaseLabel: string;
  isNight: boolean;
  astronomySource: "live" | "fallback";
  sunriseDisplay: string;
  sunsetDisplay: string;
  weatherKind: WeatherConditionKind;
  weatherLabel: string;
  isRaining: boolean;
  cloudCoverPct: number;
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  temperatureDisplay: string;
  humidityDisplay: string;
  freshness: WeatherFreshness;
  freshnessLabel: string;
  updatedAtDisplay: string | null;
  lighting: SceneLightingProfile;
  plazaSun: PlazaSolarPosition | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const num = Number.parseInt(clean, 16);
  if (!Number.isFinite(num) || clean.length !== 6) {
    return [200, 220, 240];
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHexRgb(rgb: [number, number, number]): string {
  const [r, g, b] = rgb.map((c) => clamp(Math.round(c), 0, 255));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const ratio = clamp(t, 0, 1);
  const [r1, g1, b1] = parseHexRgb(hexA);
  const [r2, g2, b2] = parseHexRgb(hexB);
  return toHexRgb([
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio
  ]);
}

const PUBLIC_PLAZA_SUN_POSITIONS: Record<DayPhaseId, [number, number, number]> = {
  morning: [10.5, 6.9, -36],
  noon: [4, 18, -32],
  afternoon: [-10.5, 7.2, -36],
  dusk: [-10.8, 6.2, -36],
  night: [10.2, 6.8, -36]
};

const PHASE_BASE_LIGHTING: Record<DayPhaseId, SceneLightingProfile> = {
  morning: {
    skyZenithHex: "#7db8e8",
    skyMidHex: "#b9cbe6",
    skyHorizonHex: "#f6dec4",
    fogColorHex: "#efe3d2",
    fogNear: 28,
    fogFar: 92,
    ambientColorHex: "#fff5e8",
    ambientIntensity: 0.72,
    hemisphereSkyHex: "#cbe4f9",
    hemisphereGroundHex: "#8c9c7a",
    hemisphereIntensity: 0.56,
    directionalColorHex: "#ffe6bd",
    directionalIntensity: 1.05,
    sunPosition: [22, 16, 12],
    celestialColorHex: "#fff2cc",
    celestialEmissiveHex: "#ffd584",
    celestialScale: 1.05,
    starOpacity: 0,
    cloudColorHex: "#fffaf2",
    cloudOpacity: 0.84
  },
  noon: {
    skyZenithHex: "#5ea3e6",
    skyMidHex: "#96c5f1",
    skyHorizonHex: "#cfe7fb",
    fogColorHex: "#dcebf7",
    fogNear: 32,
    fogFar: 98,
    ambientColorHex: "#ffffff",
    ambientIntensity: 0.78,
    hemisphereSkyHex: "#dff0ff",
    hemisphereGroundHex: "#879b78",
    hemisphereIntensity: 0.62,
    directionalColorHex: "#fff8e8",
    directionalIntensity: 1.22,
    sunPosition: [6, 28, 10],
    celestialColorHex: "#fffbe6",
    celestialEmissiveHex: "#ffe89e",
    celestialScale: 1.0,
    starOpacity: 0,
    cloudColorHex: "#ffffff",
    cloudOpacity: 0.88
  },
  afternoon: {
    skyZenithHex: "#69a6df",
    skyMidHex: "#abc1d2",
    skyHorizonHex: "#eddcc4",
    fogColorHex: "#eadfce",
    fogNear: 28,
    fogFar: 92,
    ambientColorHex: "#fff4e4",
    ambientIntensity: 0.74,
    hemisphereSkyHex: "#d5e6f7",
    hemisphereGroundHex: "#8c9976",
    hemisphereIntensity: 0.58,
    directionalColorHex: "#ffe2b0",
    directionalIntensity: 1.12,
    sunPosition: [-18, 21, 14],
    celestialColorHex: "#ffefc2",
    celestialEmissiveHex: "#ffd07b",
    celestialScale: 1.05,
    starOpacity: 0,
    cloudColorHex: "#fff7ec",
    cloudOpacity: 0.86
  },
  dusk: {
    skyZenithHex: "#49588a",
    skyMidHex: "#9a797e",
    skyHorizonHex: "#eb9a72",
    fogColorHex: "#d99d82",
    fogNear: 25,
    fogFar: 86,
    ambientColorHex: "#f7d4c4",
    ambientIntensity: 0.62,
    hemisphereSkyHex: "#b89cc8",
    hemisphereGroundHex: "#6d7060",
    hemisphereIntensity: 0.5,
    directionalColorHex: "#ffae78",
    directionalIntensity: 0.82,
    sunPosition: [-26, 9, 12],
    celestialColorHex: "#ffc288",
    celestialEmissiveHex: "#ff8c52",
    celestialScale: 1.22,
    starOpacity: 0.28,
    cloudColorHex: "#f7cbb6",
    cloudOpacity: 0.82
  },
  night: {
    // Cozy readable night: unmistakably nocturnal sky, while keeping character, walkways & NPCs clear
    skyZenithHex: "#18233c",
    skyMidHex: "#223150",
    skyHorizonHex: "#2c3e63",
    fogColorHex: "#253554",
    fogNear: 26,
    fogFar: 84,
    ambientColorHex: "#b8cdf0",
    ambientIntensity: 0.54,
    hemisphereSkyHex: "#7694c9",
    hemisphereGroundHex: "#4b594e",
    hemisphereIntensity: 0.46,
    directionalColorHex: "#c9dcff",
    directionalIntensity: 0.56,
    sunPosition: [-14, 22, -12],
    celestialColorHex: "#eef4ff",
    celestialEmissiveHex: "#bcd2ff",
    celestialScale: 0.92,
    starOpacity: 0.88,
    cloudColorHex: "#495d82",
    cloudOpacity: 0.62
  }
};

/**
 * Public Plaza daytime lookdev sky palette anchored to `plaza-day-sky-direction-v1.png`:
 * - Deep azure zenith (`#176AD9` zone)
 * - Crisp luminous mid-sky blue (`#43AAFB` zone)
 * - Pale horizon cyan (`#B4EDFD` zone)
 * - Pearl-white sun core (`#FFFDF7`) with warm directional solar corona (`celestialEmissiveHex`)
 */
const PUBLIC_PLAZA_DAY_SKY_PROFILES: Record<
  "morning" | "noon" | "afternoon",
  {
    skyZenithHex: string;
    skyMidHex: string;
    skyHorizonHex: string;
    fogColorHex: string;
    celestialColorHex: string;
    celestialEmissiveHex: string;
    celestialScale: number;
    cloudColorHex: string;
  }
> = {
  morning: {
    skyZenithHex: "#186cd9",
    skyMidHex: "#44abfb",
    skyHorizonHex: "#b5edfd",
    fogColorHex: "#daf1fb",
    celestialColorHex: "#fffdf7",
    celestialEmissiveHex: "#fff6dc",
    celestialScale: 0.9,
    cloudColorHex: "#fffdf9"
  },
  noon: {
    skyZenithHex: "#176ad9",
    skyMidHex: "#43aafb",
    skyHorizonHex: "#b4edfd",
    fogColorHex: "#d6f0fb",
    celestialColorHex: "#fffdf7",
    celestialEmissiveHex: "#f2faff",
    celestialScale: 0.86,
    cloudColorHex: "#ffffff"
  },
  afternoon: {
    skyZenithHex: "#1a6ed9",
    skyMidHex: "#46abfa",
    skyHorizonHex: "#b7ecfc",
    fogColorHex: "#dcf0fa",
    celestialColorHex: "#fffdf6",
    celestialEmissiveHex: "#fff3d1",
    celestialScale: 0.9,
    cloudColorHex: "#fffcf6"
  }
};

const SEASON_TINTS: Record<
  SeasonId,
  { zenithTint: string; horizonTint: string; strength: number }
> = {
  spring: { zenithTint: "#8fd4c1", horizonTint: "#fae8d4", strength: 0.12 },
  summer: { zenithTint: "#5ca8f2", horizonTint: "#ffe7b8", strength: 0.12 },
  autumn: { zenithTint: "#7aa5d9", horizonTint: "#f5cba0", strength: 0.15 },
  winter: { zenithTint: "#89b3de", horizonTint: "#dce6f2", strength: 0.14 }
};

const PREVIEW_WEATHER_LABELS: Record<WeatherConditionKind, string> = {
  clear: "Trời quang",
  partly_cloudy: "Ít mây",
  overcast: "Nhiều mây",
  rain: "Có mưa"
};

function computeSceneLightingProfile(params: {
  dayPhase: DayPhaseId;
  season: SeasonId;
  weatherKind: WeatherConditionKind;
  cloudCoverPct: number;
  isPersonalSpace: boolean;
}): SceneLightingProfile {
  const base = PHASE_BASE_LIGHTING[params.dayPhase];
  const seasonTint = SEASON_TINTS[params.season];
  const cloudFactor = clamp(params.cloudCoverPct / 100, 0, 1);

  const isPlazaDaytime =
    !params.isPersonalSpace &&
    (params.dayPhase === "morning" ||
      params.dayPhase === "noon" ||
      params.dayPhase === "afternoon");

  if (isPlazaDaytime) {
    const plazaDay =
      PUBLIC_PLAZA_DAY_SKY_PROFILES[
        params.dayPhase as "morning" | "noon" | "afternoon"
      ];
    // Keep seasonal shift very subtle on Public Plaza daytime sky so `#176AD9 -> #43AAFB -> #B4EDFD` stays crisp
    let skyZenithHex = mixHex(
      plazaDay.skyZenithHex,
      seasonTint.zenithTint,
      seasonTint.strength * 0.14
    );
    let skyMidHex = mixHex(
      plazaDay.skyMidHex,
      seasonTint.zenithTint,
      seasonTint.strength * 0.12
    );
    let skyHorizonHex = plazaDay.skyHorizonHex;
    let fogColorHex = plazaDay.fogColorHex;
    let directionalIntensity = base.directionalIntensity;
    let ambientIntensity = base.ambientIntensity;
    let hemisphereIntensity = base.hemisphereIntensity;
    let fogNear = base.fogNear;
    let fogFar = base.fogFar;
    let cloudColorHex = plazaDay.cloudColorHex;
    let cloudOpacity = 0.94;

    if (params.weatherKind === "partly_cloudy") {
      const mute = 0.05 * cloudFactor;
      skyZenithHex = mixHex(skyZenithHex, "#2d80e3", mute);
      skyMidHex = mixHex(skyMidHex, "#5db4fb", mute);
      skyHorizonHex = mixHex(skyHorizonHex, "#c0effd", mute);
      directionalIntensity *= 1 - 0.08 * cloudFactor;
      cloudOpacity = 0.94;
    } else if (params.weatherKind === "overcast") {
      const overcastTone = "#8fa4ba";
      skyZenithHex = mixHex(skyZenithHex, overcastTone, 0.44);
      skyMidHex = mixHex(skyMidHex, "#9eb2c7", 0.42);
      skyHorizonHex = mixHex(skyHorizonHex, "#bfcedd", 0.44);
      fogColorHex = mixHex(fogColorHex, "#b8c7d6", 0.4);
      directionalIntensity *= 0.74;
      ambientIntensity = Math.max(ambientIntensity, 0.56);
      fogFar = Math.max(78, fogFar - 6);
      cloudColorHex = "#d8e2ec";
      cloudOpacity = 0.94;
    } else if (params.weatherKind === "rain") {
      const rainTone = "#78899c";
      skyZenithHex = mixHex(skyZenithHex, rainTone, 0.58);
      skyMidHex = mixHex(skyMidHex, "#8395a8", 0.55);
      skyHorizonHex = mixHex(skyHorizonHex, "#9aaaba", 0.54);
      fogColorHex = mixHex(fogColorHex, rainTone, 0.48);
      directionalIntensity *= 0.66;
      ambientIntensity = Math.max(ambientIntensity, 0.54);
      hemisphereIntensity = Math.max(hemisphereIntensity, 0.46);
      fogNear = Math.max(20, fogNear - 4);
      fogFar = Math.max(76, fogFar - 10);
      cloudColorHex = "#b2bfcc";
      cloudOpacity = 0.95;
    } else {
      // clear sky
      cloudOpacity = 0.9;
    }

    return {
      skyZenithHex,
      skyMidHex,
      skyHorizonHex,
      fogColorHex,
      fogNear,
      fogFar,
      ambientColorHex: base.ambientColorHex,
      ambientIntensity: Number(ambientIntensity.toFixed(2)),
      hemisphereSkyHex: base.hemisphereSkyHex,
      hemisphereGroundHex: base.hemisphereGroundHex,
      hemisphereIntensity: Number(hemisphereIntensity.toFixed(2)),
      directionalColorHex: base.directionalColorHex,
      directionalIntensity: Number(directionalIntensity.toFixed(2)),
      sunPosition: PUBLIC_PLAZA_SUN_POSITIONS[params.dayPhase],
      celestialColorHex: plazaDay.celestialColorHex,
      celestialEmissiveHex: plazaDay.celestialEmissiveHex,
      celestialScale: plazaDay.celestialScale,
      starOpacity: 0,
      cloudColorHex,
      cloudOpacity: Number(cloudOpacity.toFixed(2))
    };
  }

  let skyZenithHex = mixHex(base.skyZenithHex, seasonTint.zenithTint, seasonTint.strength);
  let skyHorizonHex = mixHex(base.skyHorizonHex, seasonTint.horizonTint, seasonTint.strength);
  let fogColorHex = mixHex(base.fogColorHex, seasonTint.horizonTint, seasonTint.strength * 0.8);
  let directionalIntensity = base.directionalIntensity;
  let ambientIntensity = base.ambientIntensity;
  let hemisphereIntensity = base.hemisphereIntensity;
  let fogNear = base.fogNear;
  let fogFar = base.fogFar;
  let cloudColorHex = base.cloudColorHex;
  let cloudOpacity = clamp(0.35 + cloudFactor * 0.58, 0.25, 0.95);
  let starOpacity = base.starOpacity;

  if (params.isPersonalSpace && params.dayPhase !== "night") {
    skyHorizonHex = mixHex(skyHorizonHex, "#f5e6c8", 0.14);
    fogColorHex = mixHex(fogColorHex, "#f2e4cb", 0.12);
  }

  // Weather modulation (clouds & rain soften direct sunlight and mute sky saturation)
  if (params.weatherKind === "partly_cloudy") {
    const mute = 0.12 * cloudFactor;
    skyZenithHex = mixHex(skyZenithHex, "#8fa6bf", mute);
    skyHorizonHex = mixHex(skyHorizonHex, "#cfd9e3", mute);
    directionalIntensity *= 1 - 0.12 * cloudFactor;
  } else if (params.weatherKind === "overcast") {
    const overcastTone = params.dayPhase === "night" ? "#26334d" : "#96a6b8";
    skyZenithHex = mixHex(skyZenithHex, overcastTone, 0.45);
    skyHorizonHex = mixHex(skyHorizonHex, overcastTone, 0.42);
    fogColorHex = mixHex(fogColorHex, overcastTone, 0.38);
    directionalIntensity *= 0.74;
    ambientIntensity = Math.max(ambientIntensity, 0.52);
    fogFar = Math.max(78, fogFar - 6);
    cloudColorHex = params.dayPhase === "night" ? "#3e4d69" : "#d4dde6";
    cloudOpacity = Math.max(cloudOpacity, 0.86);
    starOpacity *= 0.45;
  } else if (params.weatherKind === "rain") {
    const rainTone = params.dayPhase === "night" ? "#222f47" : "#78899c";
    skyZenithHex = mixHex(skyZenithHex, rainTone, 0.58);
    skyHorizonHex = mixHex(skyHorizonHex, rainTone, 0.52);
    fogColorHex = mixHex(fogColorHex, rainTone, 0.48);
    directionalIntensity *= 0.66;
    ambientIntensity = Math.max(ambientIntensity, 0.52);
    hemisphereIntensity = Math.max(hemisphereIntensity, 0.44);
    fogNear = Math.max(20, fogNear - 4);
    fogFar = Math.max(76, fogFar - 10);
    cloudColorHex = params.dayPhase === "night" ? "#35435c" : "#b2bfcc";
    cloudOpacity = Math.max(cloudOpacity, 0.92);
    starOpacity *= 0.25;
  } else {
    // clear sky
    cloudOpacity = clamp(0.2 + cloudFactor * 0.4, 0.18, 0.6);
  }

  // Enforce strict night legibility floor so character VRM, paths, and NPCs stay clear
  if (params.dayPhase === "night") {
    ambientIntensity = Math.max(0.5, ambientIntensity);
    hemisphereIntensity = Math.max(0.44, hemisphereIntensity);
    directionalIntensity = Math.max(0.48, directionalIntensity);
    fogFar = Math.max(78, fogFar);
    if (params.weatherKind === "clear" || params.weatherKind === "partly_cloudy") {
      starOpacity = Math.max(0.65, starOpacity);
    }
  }

  const skyMidHex = mixHex(skyZenithHex, skyHorizonHex, 0.52);

  return {
    skyZenithHex,
    skyMidHex,
    skyHorizonHex,
    fogColorHex,
    fogNear,
    fogFar,
    ambientColorHex: base.ambientColorHex,
    ambientIntensity: Number(ambientIntensity.toFixed(2)),
    hemisphereSkyHex: base.hemisphereSkyHex,
    hemisphereGroundHex: base.hemisphereGroundHex,
    hemisphereIntensity: Number(hemisphereIntensity.toFixed(2)),
    directionalColorHex: base.directionalColorHex,
    directionalIntensity: Number(directionalIntensity.toFixed(2)),
    sunPosition: params.isPersonalSpace
      ? base.sunPosition
      : PUBLIC_PLAZA_SUN_POSITIONS[params.dayPhase],
    celestialColorHex: base.celestialColorHex,
    celestialEmissiveHex: base.celestialEmissiveHex,
    celestialScale: base.celestialScale,
    starOpacity: Number(starOpacity.toFixed(2)),
    cloudColorHex,
    cloudOpacity: Number(cloudOpacity.toFixed(2))
  };
}

export function buildDefaultPreviewOverride(
  nowMs: number = Date.now(),
  liveReading: HcmcWeatherReading | null = null
): EnvironmentPreviewOverride {
  const timeSnap = resolveHcmcTimeSnapshot(nowMs);
  const liveCondition = liveReading
    ? classifyWeatherCondition(
        liveReading.weatherCode,
        liveReading.cloudCoverPct,
        liveReading.precipitationMm
      ).kind
    : "partly_cloudy";

  return {
    isoDate: timeSnap.isoDate,
    time24h: timeSnap.time24h,
    weatherKind: liveCondition,
    cloudCoverPct: liveReading?.cloudCoverPct ?? 40,
    temperatureC: liveReading?.temperatureC !== null && liveReading?.temperatureC !== undefined
      ? Math.round(liveReading.temperatureC)
      : 30,
    relativeHumidityPct: liveReading?.relativeHumidityPct ?? 70
  };
}

export function buildPreviewOverrideFromPreset(
  presetId: EnvironmentPresetId,
  nowMs: number = Date.now(),
  currentOverride?: Partial<EnvironmentPreviewOverride>
): EnvironmentPreviewOverride {
  const base = {
    ...buildDefaultPreviewOverride(nowMs),
    ...currentOverride
  };
  const year = resolveHcmcTimeSnapshot(nowMs).year;

  switch (presetId) {
    case "phase_morning":
      return { ...base, time24h: "07:30" };
    case "phase_noon":
      return { ...base, time24h: "12:15" };
    case "phase_afternoon":
      return { ...base, time24h: "15:30" };
    case "phase_dusk":
      return { ...base, time24h: "17:30" };
    case "phase_night":
      return { ...base, time24h: "20:30" };
    case "season_spring":
      return { ...base, isoDate: `${year}-04-15` };
    case "season_summer":
      return { ...base, isoDate: `${year}-07-15` };
    case "season_autumn":
      return { ...base, isoDate: `${year}-10-15` };
    case "season_winter":
      return { ...base, isoDate: `${year}-01-15` };
  }
}

export interface ResolveEffectiveEnvironmentParams {
  liveReading: HcmcWeatherReading | null;
  liveStatus: WeatherFetchStatus;
  previewOverride: EnvironmentPreviewOverride | null;
  nowMs?: number;
  isPersonalSpace?: boolean;
}

/**
 * Produces the single unified `EffectiveEnvironmentSnapshot` consumed by both the HUD
 * and the 3D WebGL scene renderer.
 */
export function resolveEffectiveEnvironmentSnapshot(
  params: ResolveEffectiveEnvironmentParams
): EffectiveEnvironmentSnapshot {
  const nowMs = params.nowMs ?? Date.now();
  const isPersonalSpace = params.isPersonalSpace ?? false;
  const preview = params.previewOverride;

  if (preview) {
    const previewEpochMs =
      buildHcmcUtcEpochMs(preview.isoDate, preview.time24h) ?? nowMs;
    const timeSnap = resolveHcmcTimeSnapshot(previewEpochMs);
    const astro = resolveSunriseSunsetForDate(
      timeSnap.isoDate,
      params.liveReading?.dailyAstronomy
    );
    const dayPhaseInfo = resolveDayPhase(
      timeSnap.minutesOfDay,
      astro.sunriseMinutes,
      astro.sunsetMinutes
    );

    const cloudCoverPct = clamp(Math.round(preview.cloudCoverPct), 0, 100);
    const temperatureC = clamp(Math.round(preview.temperatureC), 10, 45);
    const relativeHumidityPct = clamp(Math.round(preview.relativeHumidityPct), 10, 100);
    const weatherKind = preview.weatherKind;
    const weatherLabel = PREVIEW_WEATHER_LABELS[weatherKind];

    const lighting = computeSceneLightingProfile({
      dayPhase: dayPhaseInfo.id,
      season: timeSnap.season,
      weatherKind,
      cloudCoverPct,
      isPersonalSpace
    });

    return {
      mode: "preview",
      isPreview: true,
      locationName: HCMC_COORDINATES.name,
      timezone: HCMC_TIMEZONE,
      isoDate: timeSnap.isoDate,
      time24h: timeSnap.time24h,
      dateDisplay: timeSnap.dateDisplay,
      minutesOfDay: timeSnap.minutesOfDay,
      season: timeSnap.season,
      seasonLabel: timeSnap.seasonLabel,
      dayPhase: dayPhaseInfo.id,
      dayPhaseLabel: dayPhaseInfo.label,
      isNight: dayPhaseInfo.isNight,
      astronomySource: astro.source,
      sunriseDisplay: astro.sunriseDisplay,
      sunsetDisplay: astro.sunsetDisplay,
      weatherKind,
      weatherLabel,
      isRaining: weatherKind === "rain",
      cloudCoverPct,
      temperatureC,
      relativeHumidityPct,
      temperatureDisplay: `${temperatureC}°C`,
      humidityDisplay: `${relativeHumidityPct}%`,
      freshness: "fresh",
      freshnessLabel: "Đang xem thử",
      updatedAtDisplay: null,
      lighting,
      plazaSun: isPersonalSpace ? null : resolvePlazaSolarPosition(timeSnap.utcMs)
    };
  }

  // Live mode
  const timeSnap = resolveHcmcTimeSnapshot(nowMs);
  const freshness = evaluateWeatherFreshness(params.liveReading, nowMs);
  const astro = resolveSunriseSunsetForDate(
    timeSnap.isoDate,
    params.liveReading?.dailyAstronomy
  );
  const dayPhaseInfo = resolveDayPhase(
    timeSnap.minutesOfDay,
    astro.sunriseMinutes,
    astro.sunsetMinutes
  );

  const updatedAtDisplay = params.liveReading
    ? resolveHcmcTimeSnapshot(params.liveReading.fetchedAtMs).time24h
    : null;

  const isUsableReading =
    params.liveReading !== null && (freshness === "fresh" || freshness === "stale");

  let weatherKind: WeatherConditionKind = "partly_cloudy";
  let weatherLabel = "Thời tiết ôn hòa";
  let isRaining = false;
  let cloudCoverPct = 38;
  let temperatureC: number | null = null;
  let relativeHumidityPct: number | null = null;
  let freshnessLabel = "Chưa có dữ liệu thời tiết";

  if (isUsableReading && params.liveReading) {
    const cond = classifyWeatherCondition(
      params.liveReading.weatherCode,
      params.liveReading.cloudCoverPct,
      params.liveReading.precipitationMm
    );
    weatherKind = cond.kind;
    weatherLabel = cond.label;
    isRaining = cond.isRaining;
    cloudCoverPct = params.liveReading.cloudCoverPct ?? (cond.kind === "clear" ? 15 : 45);
    temperatureC = params.liveReading.temperatureC;
    relativeHumidityPct = params.liveReading.relativeHumidityPct;

    if (freshness === "fresh") {
      freshnessLabel = updatedAtDisplay
        ? `Cập nhật ${updatedAtDisplay}`
        : "Vừa cập nhật";
    } else {
      freshnessLabel = updatedAtDisplay
        ? `Dữ liệu cũ (${updatedAtDisplay})`
        : "Dữ liệu cũ";
    }
  } else if (freshness === "expired") {
    weatherKind = "partly_cloudy";
    weatherLabel = "Cảnh trung tính";
    freshnessLabel = "Dữ liệu quá 2 giờ · Cảnh trung tính";
  } else if (params.liveStatus === "loading") {
    weatherKind = "partly_cloudy";
    weatherLabel = "Đang tải thời tiết...";
    freshnessLabel = "Đang cập nhật thời tiết...";
  } else {
    weatherKind = "partly_cloudy";
    weatherLabel = "Cảnh trung tính";
    freshnessLabel = "Chưa có dữ liệu thời tiết";
  }

  const temperatureDisplay =
    temperatureC !== null ? `${Math.round(temperatureC)}°C` : "–";
  const humidityDisplay =
    relativeHumidityPct !== null ? `${Math.round(relativeHumidityPct)}%` : "–";

  const lighting = computeSceneLightingProfile({
    dayPhase: dayPhaseInfo.id,
    season: timeSnap.season,
    weatherKind,
    cloudCoverPct,
    isPersonalSpace
  });

  return {
    mode: "live",
    isPreview: false,
    locationName: HCMC_COORDINATES.name,
    timezone: HCMC_TIMEZONE,
    isoDate: timeSnap.isoDate,
    time24h: timeSnap.time24h,
    dateDisplay: timeSnap.dateDisplay,
    minutesOfDay: timeSnap.minutesOfDay,
    season: timeSnap.season,
    seasonLabel: timeSnap.seasonLabel,
    dayPhase: dayPhaseInfo.id,
    dayPhaseLabel: dayPhaseInfo.label,
    isNight: dayPhaseInfo.isNight,
    astronomySource: astro.source,
    sunriseDisplay: astro.sunriseDisplay,
    sunsetDisplay: astro.sunsetDisplay,
    weatherKind,
    weatherLabel,
    isRaining,
    cloudCoverPct,
    temperatureC,
    relativeHumidityPct,
    temperatureDisplay,
    humidityDisplay,
    freshness,
    freshnessLabel,
    updatedAtDisplay,
    lighting,
    plazaSun: isPersonalSpace ? null : resolvePlazaSolarPosition(timeSnap.utcMs)
  };
}
