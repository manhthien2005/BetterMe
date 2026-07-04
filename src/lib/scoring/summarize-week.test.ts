import { describe, expect, it } from "vitest";

import type { DailyRecord } from "@/types";
import { summarizeWeek } from "./summarize-week";

describe("summarizeWeek", () => {
  it("aggregates eligible rates and uses the final eligible streak", () => {
    const summary = summarizeWeek([
      record("2026-01-05", 1, "Good", 1, 1),
      record("2026-01-06", 0.5, "Okay", 0, 2),
      record("2026-01-07", null, "Planned", null, 3),
      record("2026-01-12", 1, "Good", 1, 0)
    ], "2026-01-05");
    expect(summary).toMatchObject({ weekStart: "2026-01-05", weekEnd: "2026-01-11", totalScore: 3, maxScore: 4, averageCompletionRate: 0.75, goodDayCount: 1, missedHabitCount: 3, endingStreak: 0 });
    expect(summary.records).toHaveLength(3);
  });

  it("returns null aggregates when the week has no eligible day", () => {
    const summary = summarizeWeek([record("2026-01-05", null, "Planned", null, 0)], "2026-01-05");
    expect(summary.averageCompletionRate).toBeNull();
    expect(summary.endingStreak).toBeNull();
  });
});

function record(date: DailyRecord["date"], completionRate: number | null, status: DailyRecord["status"], streak: number | null, missed: number): DailyRecord {
  return { date, weekStart: "2026-01-05", dayLabel: "Mon", habitCompletions: {}, reflection: null, totalScore: completionRate === null ? 0 : completionRate * 2, maxScore: 2, completionRate, status, streak, missedHabitKeys: Array.from({ length: missed }, (_, i) => `h${i}`), missedHabitNames: Array.from({ length: missed }, (_, i) => `Habit ${i}`) };
}
