import { describe, expect, it } from "vitest";

import type { DailyRecord, Habit } from "@/types";
import { buildSelectedWeekHabits } from "./build-habit-chart";
import { buildThirtyDayProgress } from "./build-progress-chart";

describe("chart transforms", () => {
  it("builds a 30-day line ending at the earlier selected date or today", () => {
    const chart = buildThirtyDayProgress([record("2026-01-05", 0.75)], "2026-01-10", "2026-01-05");
    expect(chart).toMatchObject({ id: "thirty-day-progress", kind: "line" });
    expect(chart.series[0].points).toHaveLength(30);
    expect(chart.series[0].points.at(-1)).toMatchObject({ key: "2026-01-05", value: 0.75 });
    expect(chart.series[0].points[0].key).toBe("2025-12-07");
  });

  it("calculates per-habit rates using only eligible selected-week days", () => {
    const records = [
      { ...record("2026-01-05", 1), habitCompletions: { h1: true } },
      { ...record("2026-01-06", 0), habitCompletions: { h1: false } },
      { ...record("2026-01-07", null), status: "Planned" as const, habitCompletions: { h1: true } }
    ];
    const chart = buildSelectedWeekHabits(records, [habit()], "2026-01-05");
    expect(chart).toMatchObject({ id: "selected-week-habits", kind: "bar" });
    expect(chart.series[0].points).toEqual([{ key: "h1", label: "Study", value: 0.5, secondaryLabel: "1 of 2 days" }]);
  });
});

function record(date: DailyRecord["date"], rate: number | null): DailyRecord {
  return { date, weekStart: "2026-01-05", dayLabel: "Mon", habitCompletions: {}, reflection: null, totalScore: rate ?? 0, maxScore: 1, completionRate: rate, status: rate === null ? "Planned" : rate >= 0.8 ? "Good" : "Bad", streak: rate === null ? null : 0, missedHabitKeys: [], missedHabitNames: [] };
}

function habit(): Habit {
  return { id: "h1", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" };
}
