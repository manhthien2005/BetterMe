import { describe, expect, it } from "vitest";

import type { DailyRecord } from "@/types";
import { applyStreaks } from "./calculate-streak";

describe("applyStreaks", () => {
  it("increments on Good days, resets otherwise, and keeps untracked days null", () => {
    const result = applyStreaks([
      record("2026-01-04", "Planned"),
      record("2026-01-02", "Good"),
      record("2026-01-01", "Good"),
      record("2026-01-03", "Okay"),
      record("2025-12-31", null)
    ]);
    expect(result.map(({ date, streak }) => [date, streak])).toEqual([
      ["2025-12-31", null],
      ["2026-01-01", 1],
      ["2026-01-02", 2],
      ["2026-01-03", 0],
      ["2026-01-04", null]
    ]);
  });
});

function record(date: DailyRecord["date"], status: DailyRecord["status"]): DailyRecord {
  return { date, weekStart: "2025-12-29", dayLabel: "Mon", habitCompletions: {}, reflection: null, totalScore: 0, maxScore: 1, completionRate: status === "Planned" || status === null ? null : 0, status, streak: null, missedHabitKeys: [], missedHabitNames: [] };
}
