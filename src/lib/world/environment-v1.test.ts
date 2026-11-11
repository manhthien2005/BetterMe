import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPreviewOverrideFromPreset,
  resolveEffectiveEnvironmentSnapshot,
  type EnvironmentPreviewOverride
} from "@/lib/world/environment-model";
import {
  FALLBACK_SUNRISE_MINUTES,
  FALLBACK_SUNSET_MINUTES,
  HCMC_TIMEZONE,
  resolveDayPhase,
  resolveHcmcTimeSnapshot,
  resolveSeasonForMonth,
  resolveSunriseSunsetForDate
} from "@/lib/world/environment-time";
import {
  buildHcmcWeatherForecastUrl,
  classifyWeatherCondition,
  clearHcmcWeatherCacheForTests,
  computeWeatherRetryDelayMs,
  evaluateWeatherFreshness,
  fetchHcmcWeatherWithCache,
  getCachedHcmcWeatherState,
  HCMC_COORDINATES,
  parseHcmcWeatherPayload,
  WEATHER_EXPIRED_THRESHOLD_MS,
  WEATHER_REFRESH_INTERVAL_MS,
  WEATHER_STALE_THRESHOLD_MS,
  type HcmcWeatherReading
} from "@/lib/world/environment-weather";

const SAMPLE_OPEN_METEO_PAYLOAD = {
  latitude: 10.7769,
  longitude: 106.7009,
  timezone: "Asia/Ho_Chi_Minh",
  current_units: {
    time: "iso8601",
    interval: "seconds",
    temperature_2m: "°C",
    relative_humidity_2m: "%",
    weather_code: "wmo code",
    cloud_cover: "%",
    precipitation: "mm"
  },
  current: {
    time: "2026-11-07T14:30",
    interval: 900,
    temperature_2m: 31.4,
    relative_humidity_2m: 72,
    weather_code: 2,
    cloud_cover: 48,
    precipitation: 0,
    is_day: 1
  },
  daily: {
    time: ["2026-11-07", "2026-11-08"],
    sunrise: ["2026-11-07T05:48", "2026-11-08T05:49"],
    sunset: ["2026-11-07T17:27", "2026-11-08T17:27"],
    precipitation_probability_max: [95, 90]
  }
};

const BANNED_GUILT_WORDS = [
  "thất vọng",
  "buồn vì cậu",
  "buồn vì sếp",
  "tại cậu",
  "tại sếp",
  "bỏ rơi",
  "đói lắm",
  "thua",
  "kém hơn",
  "xếp cuối",
  "bét",
  "chậm hơn"
];

describe("World Environment V1 — HCMC Time, Season & Astronomy (environment-time)", () => {
  it("computes Asia/Ho_Chi_Minh local date and 24h time from UTC epoch independent of device timezone", () => {
    expect(HCMC_TIMEZONE).toBe("Asia/Ho_Chi_Minh");

    // 2026-11-07T16:59:30Z -> 2026-11-07 23:59:30 in HCMC (UTC+7)
    const beforeMidnightUtc = Date.UTC(2026, 10, 7, 16, 59, 30);
    const snapBefore = resolveHcmcTimeSnapshot(beforeMidnightUtc);
    expect(snapBefore.isoDate).toBe("2026-11-07");
    expect(snapBefore.year).toBe(2026);
    expect(snapBefore.month).toBe(11);
    expect(snapBefore.day).toBe(7);
    expect(snapBefore.hour).toBe(23);
    expect(snapBefore.minute).toBe(59);
    expect(snapBefore.second).toBe(30);
    expect(snapBefore.time24h).toBe("23:59");
    expect(snapBefore.season).toBe("autumn");
    expect(snapBefore.seasonLabel).toBe("Mùa Thu");

    // 1 second later: 2026-11-07T17:00:00Z -> 2026-11-08 00:00:00 in HCMC
    const atMidnightUtc = Date.UTC(2026, 10, 7, 17, 0, 0);
    const snapAfter = resolveHcmcTimeSnapshot(atMidnightUtc);
    expect(snapAfter.isoDate).toBe("2026-11-08");
    expect(snapAfter.day).toBe(8);
    expect(snapAfter.hour).toBe(0);
    expect(snapAfter.minute).toBe(0);
    expect(snapAfter.time24h).toBe("00:00");
  });

  it("handles year boundaries, season boundaries (3-5 Xuân, 6-8 Hạ, 9-11 Thu, 12-2 Đông), and leap years", () => {
    expect(resolveSeasonForMonth(3).id).toBe("spring");
    expect(resolveSeasonForMonth(5).id).toBe("spring");
    expect(resolveSeasonForMonth(6).id).toBe("summer");
    expect(resolveSeasonForMonth(8).id).toBe("summer");
    expect(resolveSeasonForMonth(9).id).toBe("autumn");
    expect(resolveSeasonForMonth(11).id).toBe("autumn");
    expect(resolveSeasonForMonth(12).id).toBe("winter");
    expect(resolveSeasonForMonth(1).id).toBe("winter");
    expect(resolveSeasonForMonth(2).id).toBe("winter");

    // New Year Eve in UTC (17:00Z Dec 31, 2026) is already Jan 1, 2027 00:00 in HCMC
    const newYearHcmc = resolveHcmcTimeSnapshot(Date.UTC(2026, 11, 31, 17, 0, 0));
    expect(newYearHcmc.isoDate).toBe("2027-01-01");
    expect(newYearHcmc.year).toBe(2027);
    expect(newYearHcmc.month).toBe(1);
    expect(newYearHcmc.season).toBe("winter");

    // Leap year 2028: Feb 28 17:30Z -> Feb 29 00:30 HCMC (Winter); Feb 29 17:30Z -> Mar 01 00:30 HCMC (Spring)
    const leapDayHcmc = resolveHcmcTimeSnapshot(Date.UTC(2028, 1, 28, 17, 30, 0));
    expect(leapDayHcmc.isoDate).toBe("2028-02-29");
    expect(leapDayHcmc.season).toBe("winter");

    const marchFirstHcmc = resolveHcmcTimeSnapshot(Date.UTC(2028, 1, 29, 17, 30, 0));
    expect(marchFirstHcmc.isoDate).toBe("2028-03-01");
    expect(marchFirstHcmc.season).toBe("spring");
  });

  it("resolves sunrise/sunset from today or tomorrow astronomy, falling back to 06:00/18:00 when missing", () => {
    const parsed = parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, Date.UTC(2026, 10, 7, 7, 30));
    expect(parsed).not.toBeNull();

    const todayAstro = resolveSunriseSunsetForDate("2026-11-07", parsed!.dailyAstronomy);
    expect(todayAstro.source).toBe("live");
    expect(todayAstro.sunriseMinutes).toBe(5 * 60 + 48);
    expect(todayAstro.sunsetMinutes).toBe(17 * 60 + 27);

    // Crossing midnight into 2026-11-08 uses tomorrow's astronomy seamlessly
    const tomorrowAstro = resolveSunriseSunsetForDate("2026-11-08", parsed!.dailyAstronomy);
    expect(tomorrowAstro.source).toBe("live");
    expect(tomorrowAstro.sunriseMinutes).toBe(5 * 60 + 49);
    expect(tomorrowAstro.sunsetMinutes).toBe(17 * 60 + 27);

    // Missing or out-of-range date uses documented 06:00 / 18:00 fallback
    const fallbackAstro = resolveSunriseSunsetForDate("2026-11-12", parsed!.dailyAstronomy);
    expect(fallbackAstro.source).toBe("fallback");
    expect(fallbackAstro.sunriseMinutes).toBe(FALLBACK_SUNRISE_MINUTES);
    expect(fallbackAstro.sunsetMinutes).toBe(FALLBACK_SUNSET_MINUTES);

    // Phases across the day with sunrise=05:48 (348m), sunset=17:27 (1047m)
    expect(resolveDayPhase(5 * 60 + 30, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("night");
    expect(resolveDayPhase(6 * 60 + 15, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("morning");
    expect(resolveDayPhase(12 * 60 + 0, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("noon");
    expect(resolveDayPhase(15 * 60 + 0, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("afternoon");
    expect(resolveDayPhase(17 * 60 + 10, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("dusk");
    expect(resolveDayPhase(18 * 60 + 0, todayAstro.sunriseMinutes, todayAstro.sunsetMinutes).id).toBe("night");
  });
});

describe("World Environment V1 — Open-Meteo Weather Validation, Cache & Freshness (environment-weather)", () => {
  beforeEach(() => {
    clearHcmcWeatherCacheForTests();
  });

  it("builds fixed HCMC Open-Meteo forecast URL without geolocation and validates numeric domain fields", () => {
    const url = buildHcmcWeatherForecastUrl();
    expect(url).toContain(`latitude=${HCMC_COORDINATES.latitude}`);
    expect(url).toContain(`longitude=${HCMC_COORDINATES.longitude}`);
    expect(url).toContain("timezone=Asia%2FHo_Chi_Minh");
    expect(url).toContain("current=temperature_2m%2Crelative_humidity_2m%2Cweather_code%2Ccloud_cover%2Cprecipitation");
    expect(url).toContain("daily=sunrise%2Csunset");
    expect(url).toContain("forecast_days=2");

    const fetchedAt = Date.UTC(2026, 10, 7, 7, 35, 0);
    const reading = parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, fetchedAt);
    expect(reading).not.toBeNull();
    expect(reading!.temperatureC).toBeCloseTo(31.4, 2);
    expect(reading!.relativeHumidityPct).toBe(72);
    expect(reading!.weatherCode).toBe(2);
    expect(reading!.cloudCoverPct).toBe(48);
    expect(reading!.precipitationMm).toBe(0);
    expect(reading!.precipitationUnit).toBe("mm");
    expect(reading!.precipitationIntervalSeconds).toBe(900);
    expect(reading!.sourceTimeIso).toBe("2026-11-07T14:30");
    expect(reading!.fetchedAtMs).toBe(fetchedAt);

    // Even though daily.precipitation_probability_max is [95, 90], current weather is WMO 2 and precip 0 -> NOT raining!
    const condition = classifyWeatherCondition(reading!.weatherCode, reading!.cloudCoverPct, reading!.precipitationMm);
    expect(condition.kind).toBe("partly_cloudy");
    expect(condition.isRaining).toBe(false);
    expect(condition.label).toBe("Ít mây");
  });

  it("coerces missing, NaN, or out-of-bounds fields to null without inventing fake numbers and handles unknown WMO codes", () => {
    const partialPayload = {
      current: {
        time: "2026-11-07T15:00",
        temperature_2m: "32°C", // invalid string
        relative_humidity_2m: 140, // out of [0..100]
        weather_code: 999, // unknown WMO code
        cloud_cover: null,
        precipitation: -2 // negative invalid
      },
      daily: {
        time: ["2026-11-07"],
        sunrise: ["invalid-date"],
        sunset: [null]
      }
    };

    const reading = parseHcmcWeatherPayload(partialPayload, 1_700_000_000_000);
    expect(reading).not.toBeNull();
    expect(reading!.temperatureC).toBeNull();
    expect(reading!.relativeHumidityPct).toBeNull();
    expect(reading!.weatherCode).toBe(999);
    expect(reading!.cloudCoverPct).toBeNull();
    expect(reading!.precipitationMm).toBeNull();
    expect(reading!.dailyAstronomy).toEqual([]);

    const cond = classifyWeatherCondition(reading!.weatherCode, reading!.cloudCoverPct, reading!.precipitationMm);
    expect(cond.kind).toBe("partly_cloudy");
    expect(cond.isRaining).toBe(false);
    expect(cond.label).toBe("Thời tiết ôn hòa");
  });

  it("evaluates freshness across fresh (<=30m), stale (30m..2h), expired (>2h), and unavailable states", () => {
    const baseMs = Date.UTC(2026, 10, 7, 8, 0, 0);
    const reading = parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, baseMs)!;

    expect(evaluateWeatherFreshness(null, baseMs)).toBe("unavailable");
    expect(evaluateWeatherFreshness(reading, baseMs + 10 * 60_000)).toBe("fresh");
    expect(evaluateWeatherFreshness(reading, baseMs + WEATHER_STALE_THRESHOLD_MS)).toBe("fresh");
    expect(evaluateWeatherFreshness(reading, baseMs + WEATHER_STALE_THRESHOLD_MS + 1_000)).toBe("stale");
    expect(evaluateWeatherFreshness(reading, baseMs + WEATHER_EXPIRED_THRESHOLD_MS)).toBe("stale");
    expect(evaluateWeatherFreshness(reading, baseMs + WEATHER_EXPIRED_THRESHOLD_MS + 1_000)).toBe("expired");
  });

  it("deduplicates concurrent fetches, reuses fresh cache across space switches, and applies bounded backoff on failure", async () => {
    let fetchCount = 0;
    const baseMs = Date.UTC(2026, 10, 7, 8, 0, 0);

    const mockFetcher = vi.fn(async () => {
      fetchCount += 1;
      await new Promise((r) => setTimeout(r, 15));
      return new Response(JSON.stringify(SAMPLE_OPEN_METEO_PAYLOAD), { status: 200 });
    });

    // Two concurrent calls (e.g. rapid remount or space switch) share a single network call
    const [res1, res2] = await Promise.all([
      fetchHcmcWeatherWithCache({ nowMs: baseMs, fetchImpl: mockFetcher }),
      fetchHcmcWeatherWithCache({ nowMs: baseMs + 100, fetchImpl: mockFetcher })
    ]);

    expect(fetchCount).toBe(1);
    expect(res1.status).toBe("ready");
    expect(res2.status).toBe("ready");
    expect(res1.reading?.temperatureC).toBeCloseTo(31.4, 2);

    // Calling again 5 minutes later (within 15m refresh window) returns cached reading without fetching
    const res3 = await fetchHcmcWeatherWithCache({
      nowMs: baseMs + 5 * 60_000,
      fetchImpl: mockFetcher
    });
    expect(fetchCount).toBe(1);
    expect(res3.reading?.fetchedAtMs).toBe(baseMs);

    // Calling after 16 minutes (> WEATHER_REFRESH_INTERVAL_MS) triggers a fresh fetch
    await fetchHcmcWeatherWithCache({
      nowMs: baseMs + WEATHER_REFRESH_INTERVAL_MS + 60_000,
      fetchImpl: mockFetcher
    });
    expect(fetchCount).toBe(2);

    // Bounded exponential backoff check
    expect(computeWeatherRetryDelayMs(1)).toBe(30_000);
    expect(computeWeatherRetryDelayMs(2)).toBe(60_000);
    expect(computeWeatherRetryDelayMs(3)).toBe(120_000);
    expect(computeWeatherRetryDelayMs(10)).toBe(300_000);
  });
});

describe("World Environment V1 — Unified Snapshot, Night Legibility & Preview Mode (environment-model)", () => {
  beforeEach(() => {
    clearHcmcWeatherCacheForTests();
  });

  it("ignores stale snapshot is_day=1 when computing night lighting and guarantees night legibility across seasons", () => {
    // Reading fetched at 14:30 when is_day=1, now evaluated at 14:50 (still fresh < 30m) OR evaluated at 21:00
    const nightNowMs = Date.UTC(2026, 10, 7, 14, 0, 0); // 21:00 in HCMC!
    const readingWithIsDayOne: HcmcWeatherReading = {
      ...parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, nightNowMs - 10 * 60_000)!
    };

    const snapshot = resolveEffectiveEnvironmentSnapshot({
      liveReading: readingWithIsDayOne,
      liveStatus: "ready",
      previewOverride: null,
      nowMs: nightNowMs,
      isPersonalSpace: false
    });

    expect(snapshot.dayPhase).toBe("night");
    expect(snapshot.dayPhaseLabel).toBe("Ban đêm");
    expect(snapshot.isNight).toBe(true);

    // Night legibility guarantees: dark cozy night sky, but character, paths & NPCs remain clearly lit
    expect(snapshot.lighting.ambientIntensity).toBeGreaterThanOrEqual(0.46);
    expect(snapshot.lighting.hemisphereIntensity).toBeGreaterThanOrEqual(0.4);
    expect(snapshot.lighting.directionalIntensity).toBeGreaterThanOrEqual(0.44);
    expect(snapshot.lighting.fogFar).toBeGreaterThanOrEqual(76);
    expect(snapshot.lighting.starOpacity).toBeGreaterThan(0.5);
  });

  it("hides expired (>2h) weather values instead of presenting old readings as current, while keeping clock and day-night working", () => {
    const fetchedAtMs = Date.UTC(2026, 10, 7, 5, 0, 0); // 12:00 HCMC
    const reading = parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, fetchedAtMs)!;

    // 3 hours later (15:00 HCMC) -> expired!
    const nowMs = fetchedAtMs + 3 * 3600_000;
    const snap = resolveEffectiveEnvironmentSnapshot({
      liveReading: reading,
      liveStatus: "ready",
      previewOverride: null,
      nowMs,
      isPersonalSpace: true
    });

    expect(snap.freshness).toBe("expired");
    expect(snap.time24h).toBe("15:00");
    expect(snap.dayPhase).toBe("afternoon");
    // Must NOT present 3-hour-old 31.4°C or 72% humidity as current
    expect(snap.temperatureC).toBeNull();
    expect(snap.relativeHumidityPct).toBeNull();
    expect(snap.temperatureDisplay).toBe("–");
    expect(snap.humidityDisplay).toBe("–");
    expect(snap.weatherKind).toBe("partly_cloudy");
  });

  it("isolates Preview Mode overrides from live cache and restores live state cleanly on exit", () => {
    const liveNowMs = Date.UTC(2026, 10, 7, 7, 30, 0); // 2026-11-07 14:30 HCMC (Autumn, Afternoon, 31.4°C)
    const liveReading = parseHcmcWeatherPayload(SAMPLE_OPEN_METEO_PAYLOAD, liveNowMs)!;

    const preview: EnvironmentPreviewOverride = {
      ...buildPreviewOverrideFromPreset("season_spring", liveNowMs),
      weatherKind: "rain",
      cloudCoverPct: 92,
      temperatureC: 24,
      relativeHumidityPct: 88
    };

    const previewSnap = resolveEffectiveEnvironmentSnapshot({
      liveReading,
      liveStatus: "ready",
      previewOverride: preview,
      nowMs: liveNowMs,
      isPersonalSpace: false
    });

    expect(previewSnap.mode).toBe("preview");
    expect(previewSnap.isPreview).toBe(true);
    expect(previewSnap.season).toBe("spring");
    expect(previewSnap.weatherKind).toBe("rain");
    expect(previewSnap.isRaining).toBe(true);
    expect(previewSnap.weatherLabel).toContain("mưa");
    expect(previewSnap.temperatureC).toBe(24);
    expect(previewSnap.relativeHumidityPct).toBe(88);

    // Live reading object and module cache remain untouched
    expect(liveReading.temperatureC).toBeCloseTo(31.4, 2);
    expect(getCachedHcmcWeatherState().reading).toBeNull();

    // Exiting preview (previewOverride = null) immediately restores live HCMC state
    const restoredSnap = resolveEffectiveEnvironmentSnapshot({
      liveReading,
      liveStatus: "ready",
      previewOverride: null,
      nowMs: liveNowMs,
      isPersonalSpace: false
    });

    expect(restoredSnap.mode).toBe("live");
    expect(restoredSnap.isPreview).toBe(false);
    expect(restoredSnap.season).toBe("autumn");
    expect(restoredSnap.weatherKind).toBe("partly_cloudy");
    expect(restoredSnap.temperatureC).toBeCloseTo(31.4, 2);
    expect(restoredSnap.relativeHumidityPct).toBe(72);
  });

  it("respects BetterMe invariant 1 (no-guilt copy) across all time, season, weather and freshness labels", () => {
    const presets = [
      "phase_morning",
      "phase_noon",
      "phase_afternoon",
      "phase_dusk",
      "phase_night",
      "season_spring",
      "season_summer",
      "season_autumn",
      "season_winter"
    ] as const;

    const nowMs = Date.UTC(2026, 10, 7, 7, 30, 0);
    const texts: string[] = [];

    for (const preset of presets) {
      const override = buildPreviewOverrideFromPreset(preset, nowMs);
      const snap = resolveEffectiveEnvironmentSnapshot({
        liveReading: null,
        liveStatus: "error",
        previewOverride: override,
        nowMs,
        isPersonalSpace: false
      });
      texts.push(
        snap.dayPhaseLabel,
        snap.seasonLabel,
        snap.weatherLabel,
        snap.freshnessLabel,
        snap.dateDisplay
      );
    }

    const joined = texts.join(" ").toLowerCase();
    for (const banned of BANNED_GUILT_WORDS) {
      expect(joined).not.toContain(banned);
    }
  });

  it("modulates V1 rain lighting/clouds/sky and preserves pre-Moc-B sun positions for Personal World while using sky-aligned positions for Public Plaza", () => {
    const nowMs = Date.UTC(2026, 9, 15, 0, 30, 0); // 07:30 HCMC Morning
    const clearOverride: EnvironmentPreviewOverride = {
      isoDate: "2026-10-15",
      time24h: "07:30",
      weatherKind: "clear",
      cloudCoverPct: 15,
      temperatureC: 28,
      relativeHumidityPct: 65
    };
    const rainOverride: EnvironmentPreviewOverride = {
      ...clearOverride,
      weatherKind: "rain",
      cloudCoverPct: 92
    };

    const plazaClear = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: clearOverride,
      nowMs,
      isPersonalSpace: false
    });
    const plazaRain = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: rainOverride,
      nowMs,
      isPersonalSpace: false
    });
    const personalMorning = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: clearOverride,
      nowMs,
      isPersonalSpace: true
    });

    // V1 Rain modulates sky colors, cloud color/opacity, and softens directional sunlight
    expect(plazaRain.isRaining).toBe(true);
    expect(plazaRain.lighting.skyZenithHex).not.toBe(plazaClear.lighting.skyZenithHex);
    expect(plazaRain.lighting.skyHorizonHex).not.toBe(plazaClear.lighting.skyHorizonHex);
    expect(plazaRain.lighting.cloudColorHex).toBe("#b2bfcc");
    expect(plazaRain.lighting.cloudOpacity).toBeGreaterThanOrEqual(0.92);
    expect(plazaRain.lighting.directionalIntensity).toBeLessThan(
      plazaClear.lighting.directionalIntensity
    );

    // Public Plaza uses Moc-B sky-aligned sunPosition and exposes NOAA plazaSun; Personal World preserves pre-Moc-B sunPosition and plazaSun=null
    expect(plazaClear.lighting.sunPosition).toEqual([10.5, 6.9, -36]);
    expect(plazaClear.plazaSun).not.toBeNull();
    expect(plazaClear.plazaSun!.direction[0]).toBeGreaterThan(0);
    expect(plazaClear.plazaSun!.elevationRad).toBeGreaterThan(0);

    expect(personalMorning.lighting.sunPosition).toEqual([22, 16, 12]);
    expect(personalMorning.plazaSun).toBeNull();
  });

  it("synchronizes plazaSun with HCMC live and preview epochs while keeping Personal World plazaSun null", () => {
    const morningEpoch = Date.parse("2026-11-09T07:30:00+07:00");
    const afternoonOverride: EnvironmentPreviewOverride = {
      isoDate: "2026-11-09",
      time24h: "16:30",
      weatherKind: "partly_cloudy",
      cloudCoverPct: 35,
      temperatureC: 30,
      relativeHumidityPct: 68
    };

    const livePlazaMorning = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: null,
      nowMs: morningEpoch,
      isPersonalSpace: false
    });
    const previewPlazaAfternoon = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: afternoonOverride,
      nowMs: morningEpoch,
      isPersonalSpace: false
    });
    const previewPersonalAfternoon = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: afternoonOverride,
      nowMs: morningEpoch,
      isPersonalSpace: true
    });

    expect(livePlazaMorning.plazaSun).not.toBeNull();
    expect(livePlazaMorning.plazaSun!.direction[0]).toBeGreaterThan(0); // East in morning
    expect(previewPlazaAfternoon.plazaSun).not.toBeNull();
    expect(previewPlazaAfternoon.plazaSun!.direction[0]).toBeLessThan(0); // West in afternoon
    expect(previewPersonalAfternoon.plazaSun).toBeNull();
  });

  it("applies the Public Plaza daytime lookdev 3-stop sky palette (#176ad9 -> #43aafb -> #b4edfd zone) while keeping Personal World unchanged", () => {
    const noonEpoch = Date.parse("2026-11-09T12:15:00+07:00");
    const noonClearOverride: EnvironmentPreviewOverride = {
      isoDate: "2026-11-09",
      time24h: "12:15",
      weatherKind: "clear",
      cloudCoverPct: 12,
      temperatureC: 31,
      relativeHumidityPct: 62
    };
    const morningPartlyOverride: EnvironmentPreviewOverride = {
      isoDate: "2026-11-09",
      time24h: "07:30",
      weatherKind: "partly_cloudy",
      cloudCoverPct: 42,
      temperatureC: 28,
      relativeHumidityPct: 70
    };

    const plazaNoonClear = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: noonClearOverride,
      nowMs: noonEpoch,
      isPersonalSpace: false
    });
    const plazaMorningPartly = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: morningPartlyOverride,
      nowMs: noonEpoch,
      isPersonalSpace: false
    });
    const personalNoonClear = resolveEffectiveEnvironmentSnapshot({
      liveReading: null,
      liveStatus: "ready",
      previewOverride: noonClearOverride,
      nowMs: noonEpoch,
      isPersonalSpace: true
    });

    // Public Plaza daytime 3-stop azure -> mid sky blue -> pale cyan horizon + pearl-white sun core
    expect(plazaNoonClear.lighting.skyHorizonHex).toBe("#b4edfd");
    expect(plazaNoonClear.lighting.skyMidHex).toBeDefined();
    expect(plazaNoonClear.lighting.celestialColorHex).toBe("#fffdf7");
    expect(plazaNoonClear.lighting.cloudColorHex).toBe("#ffffff");
    expect(plazaNoonClear.lighting.cloudOpacity).toBeGreaterThanOrEqual(0.88);

    expect(plazaMorningPartly.lighting.skyHorizonHex).not.toBe(
      personalNoonClear.lighting.skyHorizonHex
    );
    expect(plazaMorningPartly.lighting.celestialColorHex).toBe("#fffdf7");
    expect(plazaMorningPartly.lighting.cloudOpacity).toBeGreaterThanOrEqual(0.9);

    // Personal World preserves its warm pre-Moc-B sky & cloud opacity behavior
    expect(personalNoonClear.lighting.celestialColorHex).toBe("#fffbe6");
    expect(personalNoonClear.lighting.cloudOpacity).toBeLessThan(0.5);
  });
});
