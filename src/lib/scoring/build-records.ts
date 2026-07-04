import type { BetterMeData, DailyRecord, ISODateString } from "@/types";
import { buildTrackingRange, getWeekStart, getZonedToday } from "../date/index";
import { calculateScore } from "./calculate-score";
import { applyStreaks } from "./calculate-streak";

const DAY_LABELS: DailyRecord["dayLabel"][] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildDailyRecords(data: BetterMeData, now: Date): DailyRecord[] {
  const today = getZonedToday(now, data.settings.timezone);
  const entries = new Map(data.habitEntries.map((entry) => [entry.date, entry]));
  const reflections = new Map(data.reflections.map((entry) => [entry.date, entry]));
  const records = buildTrackingRange(data.settings, now).map((date) => {
    const entry = entries.get(date);
    const score = calculateScore(entry, data.habits, {
      startDate: data.settings.startDate,
      targetCompletionRate: data.settings.targetCompletionRate
    }, date, today);
    return {
      ...score,
      date,
      weekStart: getWeekStart(date),
      dayLabel: getDayLabel(date),
      habitCompletions: { ...(entry?.habitCompletions ?? {}) },
      reflection: reflections.get(date) ?? null,
      streak: null
    } satisfies DailyRecord;
  });
  return applyStreaks(records);
}

function getDayLabel(date: ISODateString): DailyRecord["dayLabel"] {
  const [year, month, day] = date.split("-").map(Number);
  return DAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
