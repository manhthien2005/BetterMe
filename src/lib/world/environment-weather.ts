import {
  HCMC_TIMEZONE,
  parseTime24hToMinutes,
  type DailyAstronomyEntry
} from "@/lib/world/environment-time";

export const HCMC_COORDINATES = {
  name: "TP.HCM",
  latitude: 10.7769,
  longitude: 106.7009
} as const;

export const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const WEATHER_STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
export const WEATHER_EXPIRED_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
export const WEATHER_FETCH_TIMEOUT_MS = 8 * 1000; // 8 seconds

export type WeatherConditionKind = "clear" | "partly_cloudy" | "overcast" | "rain";
export type WeatherFreshness = "fresh" | "stale" | "expired" | "unavailable";
export type WeatherFetchStatus = "idle" | "loading" | "ready" | "error";

export interface HcmcWeatherReading {
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  weatherCode: number | null;
  cloudCoverPct: number | null;
  precipitationMm: number | null;
  precipitationUnit: "mm";
  precipitationIntervalSeconds: number | null;
  dailyAstronomy: DailyAstronomyEntry[];
  sourceTimeIso: string | null;
  fetchedAtMs: number;
}

export interface WeatherConditionSummary {
  kind: WeatherConditionKind;
  label: string;
  isRaining: boolean;
}

export interface CachedHcmcWeatherState {
  reading: HcmcWeatherReading | null;
  status: WeatherFetchStatus;
  failureCount: number;
  lastError: string | null;
}

const RAIN_WMO_CODES = new Set([
  51, 53, 55, 56, 57, // Drizzle
  61, 63, 65, 66, 67, // Rain
  80, 81, 82, // Rain showers
  95, 96, 99 // Thunderstorm with rain
]);

export function buildHcmcWeatherForecastUrl(): string {
  const params = new URLSearchParams({
    latitude: String(HCMC_COORDINATES.latitude),
    longitude: String(HCMC_COORDINATES.longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,cloud_cover,precipitation",
    daily: "sunrise,sunset",
    timezone: HCMC_TIMEZONE,
    forecast_days: "2"
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function validateNumberInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (value < min || value > max) {
    return null;
  }
  return value;
}

function parseIsoLocalClockMinutes(isoDateTime: unknown): { dateIso: string; minutes: number; rawIso: string } | null {
  if (typeof isoDateTime !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(isoDateTime.trim());
  if (!match) return null;
  const minutes = parseTime24hToMinutes(match[2]);
  if (minutes === null) return null;
  return {
    dateIso: match[1],
    minutes,
    rawIso: isoDateTime.trim()
  };
}

function parseDailyAstronomy(daily: unknown): DailyAstronomyEntry[] {
  if (!daily || typeof daily !== "object") return [];
  const record = daily as Record<string, unknown>;
  const times = Array.isArray(record.time) ? record.time : [];
  const sunrises = Array.isArray(record.sunrise) ? record.sunrise : [];
  const sunsets = Array.isArray(record.sunset) ? record.sunset : [];

  const entries: DailyAstronomyEntry[] = [];
  const count = Math.min(times.length, sunrises.length, sunsets.length, 7);

  for (let i = 0; i < count; i += 1) {
    const dateVal = times[i];
    const sunriseParsed = parseIsoLocalClockMinutes(sunrises[i]);
    const sunsetParsed = parseIsoLocalClockMinutes(sunsets[i]);

    if (
      typeof dateVal === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateVal) &&
      sunriseParsed &&
      sunsetParsed &&
      sunsetParsed.minutes > sunriseParsed.minutes + 180
    ) {
      entries.push({
        dateIso: dateVal,
        sunriseMinutes: sunriseParsed.minutes,
        sunsetMinutes: sunsetParsed.minutes,
        sunriseIso: sunriseParsed.rawIso,
        sunsetIso: sunsetParsed.rawIso
      });
    }
  }

  return entries;
}

/**
 * Validates and extracts numeric HCMC weather fields from an Open-Meteo response.
 * Missing or invalid fields become `null` — never parsed from UI strings or faked.
 * Note: `daily.precipitation_probability_max` and `current.is_day` are intentionally ignored.
 */
export function parseHcmcWeatherPayload(
  payload: unknown,
  fetchedAtMs: number = Date.now()
): HcmcWeatherReading | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  if (!root.current || typeof root.current !== "object") {
    return null;
  }

  const current = root.current as Record<string, unknown>;

  const temperatureC = validateNumberInRange(current.temperature_2m, -10, 60);
  const relativeHumidityPct = validateNumberInRange(current.relative_humidity_2m, 0, 100);
  const rawWeatherCode = validateNumberInRange(current.weather_code, 0, 1000);
  const weatherCode =
    rawWeatherCode !== null && Number.isInteger(rawWeatherCode) ? rawWeatherCode : null;
  const cloudCoverPct = validateNumberInRange(current.cloud_cover, 0, 100);
  const precipitationMm = validateNumberInRange(current.precipitation, 0, 500);
  const intervalRaw = validateNumberInRange(current.interval, 1, 86400);
  const precipitationIntervalSeconds =
    intervalRaw !== null ? Math.round(intervalRaw) : null;

  const sourceTimeIso =
    typeof current.time === "string" && current.time.trim().length > 0
      ? current.time.trim()
      : null;

  const dailyAstronomy = parseDailyAstronomy(root.daily);

  return {
    temperatureC,
    relativeHumidityPct:
      relativeHumidityPct !== null ? Math.round(relativeHumidityPct) : null,
    weatherCode,
    cloudCoverPct: cloudCoverPct !== null ? Math.round(cloudCoverPct) : null,
    precipitationMm,
    precipitationUnit: "mm",
    precipitationIntervalSeconds,
    dailyAstronomy,
    sourceTimeIso,
    fetchedAtMs: Number.isFinite(fetchedAtMs) ? fetchedAtMs : Date.now()
  };
}

/**
 * Classifies current weather condition from current `weather_code`, `cloud_cover`,
 * and `precipitation` (mm). Never uses daily precipitation probability.
 */
export function classifyWeatherCondition(
  weatherCode: number | null,
  cloudCoverPct: number | null,
  precipitationMm: number | null
): WeatherConditionSummary {
  const hasMeasurableRain = precipitationMm !== null && precipitationMm > 0;
  const isRainCode = weatherCode !== null && RAIN_WMO_CODES.has(weatherCode);

  if (isRainCode || hasMeasurableRain) {
    let label = "Có mưa";
    if (weatherCode !== null) {
      if (weatherCode >= 51 && weatherCode <= 57) {
        label = "Mưa phùn";
      } else if (weatherCode === 61 || weatherCode === 80) {
        label = "Mưa nhỏ";
      } else if (weatherCode === 63 || weatherCode === 81) {
        label = "Mưa rào";
      } else if (weatherCode >= 65) {
        label = "Mưa lớn";
      }
    }
    return {
      kind: "rain",
      label,
      isRaining: true
    };
  }

  if (weatherCode === 3) {
    return {
      kind: "overcast",
      label: "Nhiều mây",
      isRaining: false
    };
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return {
      kind: "overcast",
      label: "Sương mù nhẹ",
      isRaining: false
    };
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return {
      kind: "partly_cloudy",
      label: "Ít mây",
      isRaining: false
    };
  }

  if (weatherCode === 0) {
    if (cloudCoverPct !== null && cloudCoverPct >= 75) {
      return { kind: "overcast", label: "Nhiều mây", isRaining: false };
    }
    if (cloudCoverPct !== null && cloudCoverPct >= 35) {
      return { kind: "partly_cloudy", label: "Ít mây", isRaining: false };
    }
    return {
      kind: "clear",
      label: "Trời quang",
      isRaining: false
    };
  }

  // Fallback for unknown or missing weatherCode
  if (cloudCoverPct !== null) {
    if (cloudCoverPct >= 75) {
      return { kind: "overcast", label: "Nhiều mây", isRaining: false };
    }
    if (cloudCoverPct <= 20) {
      return { kind: "clear", label: "Trời quang", isRaining: false };
    }
    return { kind: "partly_cloudy", label: "Ít mây", isRaining: false };
  }

  return {
    kind: "partly_cloudy",
    label: "Thời tiết ôn hòa",
    isRaining: false
  };
}

/**
 * Evaluates cache freshness:
 * - unavailable: no reading
 * - fresh: age <= 30 minutes
 * - stale: 30 minutes < age <= 2 hours
 * - expired: age > 2 hours
 */
export function evaluateWeatherFreshness(
  reading: HcmcWeatherReading | null,
  nowMs: number = Date.now()
): WeatherFreshness {
  if (!reading || !Number.isFinite(reading.fetchedAtMs)) {
    return "unavailable";
  }
  const ageMs = Math.max(0, nowMs - reading.fetchedAtMs);
  if (ageMs <= WEATHER_STALE_THRESHOLD_MS) {
    return "fresh";
  }
  if (ageMs <= WEATHER_EXPIRED_THRESHOLD_MS) {
    return "stale";
  }
  return "expired";
}

/**
 * Bounded exponential backoff: 30s -> 60s -> 120s -> max 300s (5 minutes).
 */
export function computeWeatherRetryDelayMs(failureCount: number): number {
  const safeCount = Math.max(1, Math.floor(failureCount));
  const raw = 30_000 * Math.pow(2, Math.min(safeCount - 1, 4));
  return Math.min(300_000, raw);
}

// Module-level singleton cache & in-flight deduplication so switching spaces never refetches
let cachedState: CachedHcmcWeatherState = {
  reading: null,
  status: "idle",
  failureCount: 0,
  lastError: null
};
let inFlightPromise: Promise<CachedHcmcWeatherState> | null = null;

export function getCachedHcmcWeatherState(): CachedHcmcWeatherState {
  return { ...cachedState };
}

export function clearHcmcWeatherCacheForTests(): void {
  cachedState = {
    reading: null,
    status: "idle",
    failureCount: 0,
    lastError: null
  };
  inFlightPromise = null;
}

export interface FetchHcmcWeatherOptions {
  nowMs?: number;
  force?: boolean;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export async function fetchHcmcWeatherWithCache(
  options: FetchHcmcWeatherOptions = {}
): Promise<CachedHcmcWeatherState> {
  const nowMs = options.nowMs ?? Date.now();
  const force = options.force ?? false;

  if (
    !force &&
    cachedState.reading &&
    nowMs - cachedState.reading.fetchedAtMs < WEATHER_REFRESH_INTERVAL_MS
  ) {
    return { ...cachedState };
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  const fetcher = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== "function") {
    cachedState = {
      ...cachedState,
      status: "error",
      failureCount: cachedState.failureCount + 1,
      lastError: "fetch-unavailable"
    };
    return { ...cachedState };
  }

  cachedState = {
    ...cachedState,
    status: "loading"
  };

  inFlightPromise = (async (): Promise<CachedHcmcWeatherState> => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, WEATHER_FETCH_TIMEOUT_MS);

    const onCallerAbort = () => timeoutController.abort();
    options.signal?.addEventListener("abort", onCallerAbort, { once: true });

    try {
      const response = await fetcher(buildHcmcWeatherForecastUrl(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: timeoutController.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`open-meteo-status-${response.status}`);
      }

      const json: unknown = await response.json();
      const parsed = parseHcmcWeatherPayload(json, nowMs);
      if (!parsed) {
        throw new Error("open-meteo-invalid-payload");
      }

      cachedState = {
        reading: parsed,
        status: "ready",
        failureCount: 0,
        lastError: null
      };
      return { ...cachedState };
    } catch (error) {
      const message = error instanceof Error ? error.message : "open-meteo-network-error";
      cachedState = {
        ...cachedState,
        status: "error",
        failureCount: cachedState.failureCount + 1,
        lastError: message
      };
      return { ...cachedState };
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", onCallerAbort);
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}
