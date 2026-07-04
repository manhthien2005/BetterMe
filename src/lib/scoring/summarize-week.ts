import type { DailyRecord, ISODateString, WeekSummary } from "@/types";
import { getWeekEnd } from "../date/index";

export function summarizeWeek(records: readonly DailyRecord[], weekStart: ISODateString): WeekSummary {
  const weekEnd = getWeekEnd(weekStart);
  const weekRecords = records
    .filter((record) => record.date >= weekStart && record.date <= weekEnd)
    .sort((left, right) => left.date.localeCompare(right.date));
  const eligible = weekRecords.filter((record) => record.completionRate !== null);
  const finalEligible = eligible.at(-1);
  return {
    weekStart,
    weekEnd,
    records: weekRecords,
    totalScore: eligible.reduce((total, record) => total + record.totalScore, 0),
    maxScore: eligible.reduce((total, record) => total + record.maxScore, 0),
    averageCompletionRate: eligible.length
      ? eligible.reduce((total, record) => total + (record.completionRate ?? 0), 0) / eligible.length
      : null,
    goodDayCount: eligible.filter((record) => record.status === "Good").length,
    missedHabitCount: eligible.reduce((total, record) => total + record.missedHabitKeys.length, 0),
    endingStreak: finalEligible?.streak ?? null
  };
}
