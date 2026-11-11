import type { WeatherConditionKind } from "@/lib/world/environment-weather";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (low: number, high: number, value: number) => {
  const t = clamp01((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};

/** Continuous visual weights; phase labels never switch sky layers on/off. */
export function resolveFantasySkyLook(
  elevationRad: number,
  cloudCoverPct: number,
  weatherKind: WeatherConditionKind
) {
  const elevation = Number.isFinite(elevationRad) ? elevationRad * 180 / Math.PI : 45;
  const cover = clamp01(Number.isFinite(cloudCoverPct) ? cloudCoverPct / 100 : 0.42);
  const dayWeight = smoothstep(0, 22, elevation);
  const nightWeight = 1 - smoothstep(-14, -4, elevation);
  const twilightWeight = 1 - dayWeight - nightWeight;
  const storm = weatherKind === "rain" ? 1 : weatherKind === "overcast" ? 0.8 : 0;
  const cloudiness = Math.max(cover, storm * 0.9);
  const celestialVisibility = (1 - smoothstep(0.3, 1, cloudiness)) * (1 - storm * 0.65);

  return {
    dayWeight,
    twilightWeight,
    nightWeight,
    cloudDensity: clamp01((0.28 + cloudiness * 0.72) * (1 - nightWeight * 0.66 * (1 - storm))),
    starOpacity: nightWeight * celestialVisibility,
    auroraOpacity: nightWeight * celestialVisibility * 0.18,
    celestialVisibility,
    stormWeight: storm,
    sunOpacity: smoothstep(-1.5, 2, elevation) * celestialVisibility
  };
}

export type FantasySkyLook = ReturnType<typeof resolveFantasySkyLook>;
