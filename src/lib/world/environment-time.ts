import { VI_WEEKDAY_LABELS } from "@/lib/date";

export const HCMC_TIMEZONE = "Asia/Ho_Chi_Minh" as const;
export const HCMC_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export const FALLBACK_SUNRISE_MINUTES = 6 * 60; // 06:00
export const FALLBACK_SUNSET_MINUTES = 18 * 60; // 18:00

export type SeasonId = "spring" | "summer" | "autumn" | "winter";
export type DayPhaseId = "morning" | "noon" | "afternoon" | "dusk" | "night";

export interface SeasonInfo {
  id: SeasonId;
  label: string;
  shortLabel: string;
}

export interface DayPhaseInfo {
  id: DayPhaseId;
  label: string;
  shortLabel: string;
  isNight: boolean;
  phaseProgress: number;
}

export interface DailyAstronomyEntry {
  dateIso: string;
  sunriseMinutes: number;
  sunsetMinutes: number;
  sunriseIso: string;
  sunsetIso: string;
}

export interface HcmcTimeSnapshot {
  utcMs: number;
  isoDate: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  minutesOfDay: number;
  time24h: string;
  weekdayShortLabel: string;
  dateDisplay: string;
  season: SeasonId;
  seasonLabel: string;
}

export interface ResolvedAstronomy {
  source: "live" | "fallback";
  sunriseMinutes: number;
  sunsetMinutes: number;
  sunriseDisplay: string;
  sunsetDisplay: string;
}

const SEASON_METADATA: Record<SeasonId, SeasonInfo> = {
  spring: { id: "spring", label: "Mùa Xuân", shortLabel: "Xuân" },
  summer: { id: "summer", label: "Mùa Hạ", shortLabel: "Hạ" },
  autumn: { id: "autumn", label: "Mùa Thu", shortLabel: "Thu" },
  winter: { id: "winter", label: "Mùa Đông", shortLabel: "Đông" }
};

function pad2(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatMinutesAsTime24h(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function parseTime24hToMinutes(time24h: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time24h.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Seasons by local month in Asia/Ho_Chi_Minh:
 * - Xuân: 3–5
 * - Hạ: 6–8
 * - Thu: 9–11
 * - Đông: 12–2
 */
export function resolveSeasonForMonth(month: number): SeasonInfo {
  if (month >= 3 && month <= 5) {
    return SEASON_METADATA.spring;
  }
  if (month >= 6 && month <= 8) {
    return SEASON_METADATA.summer;
  }
  if (month >= 9 && month <= 11) {
    return SEASON_METADATA.autumn;
  }
  return SEASON_METADATA.winter;
}

/**
 * Computes HCMC (Asia/Ho_Chi_Minh, UTC+7, no DST) calendar date and 24h time
 * purely from a UTC epoch timestamp, completely independent of the host machine's timezone.
 */
export function resolveHcmcTimeSnapshot(nowMs: number): HcmcTimeSnapshot {
  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const hcmcShiftedDate = new Date(safeNowMs + HCMC_UTC_OFFSET_MS);

  const year = hcmcShiftedDate.getUTCFullYear();
  const month = hcmcShiftedDate.getUTCMonth() + 1;
  const day = hcmcShiftedDate.getUTCDate();
  const utcDayOfWeek = hcmcShiftedDate.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const hour = hcmcShiftedDate.getUTCHours();
  const minute = hcmcShiftedDate.getUTCMinutes();
  const second = hcmcShiftedDate.getUTCSeconds();

  const isoDate = `${year}-${pad2(month)}-${pad2(day)}`;
  const time24h = `${pad2(hour)}:${pad2(minute)}`;
  const minutesOfDay = hour * 60 + minute + second / 60;

  const weekdayShortLabel = VI_WEEKDAY_LABELS[utcDayOfWeek === 0 ? 6 : utcDayOfWeek - 1];
  const dateDisplay = `${weekdayShortLabel}, ${pad2(day)}/${pad2(month)}/${year}`;

  const seasonInfo = resolveSeasonForMonth(month);

  return {
    utcMs: safeNowMs,
    isoDate,
    year,
    month,
    day,
    hour,
    minute,
    second,
    minutesOfDay,
    time24h,
    weekdayShortLabel,
    dateDisplay,
    season: seasonInfo.id,
    seasonLabel: seasonInfo.label
  };
}

/**
 * Converts an HCMC local ISO date ("YYYY-MM-DD") and 24h time ("HH:mm") into a UTC epoch timestamp.
 */
export function buildHcmcUtcEpochMs(isoDate: string, time24h: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  const minutes = parseTime24hToMinutes(time24h);
  if (!dateMatch || minutes === null) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return Date.UTC(year, month - 1, day, hour, minute, 0) - HCMC_UTC_OFFSET_MS;
}

/**
 * Resolves sunrise and sunset minutes for the given HCMC date from daily astronomy entries,
 * falling back to 06:00 (360) and 18:00 (1080) when unavailable.
 */
export function resolveSunriseSunsetForDate(
  isoDate: string,
  dailyAstronomy?: readonly DailyAstronomyEntry[] | null
): ResolvedAstronomy {
  if (dailyAstronomy && dailyAstronomy.length > 0) {
    const matched = dailyAstronomy.find((entry) => entry.dateIso === isoDate);
    if (
      matched &&
      Number.isFinite(matched.sunriseMinutes) &&
      Number.isFinite(matched.sunsetMinutes) &&
      matched.sunsetMinutes > matched.sunriseMinutes + 180
    ) {
      const sunriseMinutes = clamp(Math.round(matched.sunriseMinutes), 270, 450);
      const sunsetMinutes = clamp(Math.round(matched.sunsetMinutes), 990, 1170);
      return {
        source: "live",
        sunriseMinutes,
        sunsetMinutes,
        sunriseDisplay: formatMinutesAsTime24h(sunriseMinutes),
        sunsetDisplay: formatMinutesAsTime24h(sunsetMinutes)
      };
    }
  }

  return {
    source: "fallback",
    sunriseMinutes: FALLBACK_SUNRISE_MINUTES,
    sunsetMinutes: FALLBACK_SUNSET_MINUTES,
    sunriseDisplay: formatMinutesAsTime24h(FALLBACK_SUNRISE_MINUTES),
    sunsetDisplay: formatMinutesAsTime24h(FALLBACK_SUNSET_MINUTES)
  };
}

/**
 * Resolves the 5 V1 day phases from HCMC minutes-of-day and sunrise/sunset:
 * - morning (Sáng): [sunrise, 11:00)
 * - noon (Trưa): [11:00, 14:00)
 * - afternoon (Chiều): [14:00, sunset - 45m)
 * - dusk (Hoàng hôn): [sunset - 45m, sunset + 20m)
 * - night (Đêm): [sunset + 20m, 24:00) U [00:00, sunrise)
 */
export function resolveDayPhase(
  minutesOfDay: number,
  sunriseMinutes: number = FALLBACK_SUNRISE_MINUTES,
  sunsetMinutes: number = FALLBACK_SUNSET_MINUTES
): DayPhaseInfo {
  const m = ((minutesOfDay % 1440) + 1440) % 1440;
  const noonStart = 11 * 60; // 660
  const afternoonStart = 14 * 60; // 840
  const duskStart = Math.max(afternoonStart + 30, sunsetMinutes - 45);
  const nightStart = Math.min(1435, sunsetMinutes + 20);

  if (m >= sunriseMinutes && m < noonStart) {
    return {
      id: "morning",
      label: "Buổi sáng",
      shortLabel: "Sáng",
      isNight: false,
      phaseProgress: clamp((m - sunriseMinutes) / Math.max(1, noonStart - sunriseMinutes), 0, 1)
    };
  }

  if (m >= noonStart && m < afternoonStart) {
    return {
      id: "noon",
      label: "Buổi trưa",
      shortLabel: "Trưa",
      isNight: false,
      phaseProgress: clamp((m - noonStart) / (afternoonStart - noonStart), 0, 1)
    };
  }

  if (m >= afternoonStart && m < duskStart) {
    return {
      id: "afternoon",
      label: "Buổi chiều",
      shortLabel: "Chiều",
      isNight: false,
      phaseProgress: clamp((m - afternoonStart) / Math.max(1, duskStart - afternoonStart), 0, 1)
    };
  }

  if (m >= duskStart && m < nightStart) {
    return {
      id: "dusk",
      label: "Hoàng hôn",
      shortLabel: "Hoàng hôn",
      isNight: false,
      phaseProgress: clamp((m - duskStart) / Math.max(1, nightStart - duskStart), 0, 1)
    };
  }

  const totalNightDuration = 1440 - nightStart + sunriseMinutes;
  const elapsedNight = m >= nightStart ? m - nightStart : 1440 - nightStart + m;

  return {
    id: "night",
    label: "Ban đêm",
    shortLabel: "Đêm",
    isNight: true,
    phaseProgress: clamp(elapsedNight / Math.max(1, totalNightDuration), 0, 1)
  };
}
