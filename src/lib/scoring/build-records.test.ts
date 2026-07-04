import { describe, expect, it } from "vitest";

import type { BetterMeData, Habit } from "@/types";
import { buildDailyRecords } from "./build-records";

describe("buildDailyRecords", () => {
  it("joins source entries and reflections into chronological scored records", () => {
    const data: BetterMeData = {
      schemaVersion: 1,
      habits: [habit()],
      habitEntries: [{ date: "2026-01-02", habitCompletions: { h1: true }, updatedAt: "x" }],
      reflections: [{ date: "2026-01-02", dailyNote: "Solid", problemToday: "None", tomorrowFocus: "Repeat", updatedAt: "x" }],
      settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 3, targetCompletionRate: 1, themeId: "cute-cat", locale: "en" },
      updatedAt: "x"
    };
    const records = buildDailyRecords(data, new Date("2026-01-02T12:00:00.000Z"));
    const selected = records.find((record) => record.date === "2026-01-02");
    expect(records[0].date).toBe("2025-12-29");
    expect(selected).toMatchObject({ dayLabel: "Fri", status: "Good", streak: 1, totalScore: 2, habitCompletions: { h1: true } });
    expect(selected?.reflection?.dailyNote).toBe("Solid");
    expect(records.find((record) => record.date === "2026-01-01")?.streak).toBe(0);
  });
});

function habit(): Habit {
  return { id: "h1", key: "study", name: "Study", category: "growth", maxScore: 2, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" };
}
