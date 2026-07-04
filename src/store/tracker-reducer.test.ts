import { describe, expect, it } from "vitest";

import type { BetterMeData, Habit } from "@/types";
import { DEFAULT_HABIT_CONFIGS } from "../data/default-habits";
import { trackerReducer, type TrackerState } from "./tracker-reducer";

const initial: TrackerState = { data: data(), hydrated: true, saving: false, persistenceError: null, now: new Date("2026-01-02T00:00:00Z") };

describe("trackerReducer", () => {
  it("contains the seven legacy-derived default habits", () => {
    expect(DEFAULT_HABIT_CONFIGS).toHaveLength(7);
    expect(DEFAULT_HABIT_CONFIGS.map((habit) => habit.key)).toContain("study-english");
  });

  it("toggles one habit completion without mutating state", () => {
    const next = trackerReducer(initial, { type: "toggle-habit", date: "2026-01-02", habitId: "h1" });
    expect(next.data?.habitEntries[0].habitCompletions.h1).toBe(true);
    expect(initial.data?.habitEntries).toHaveLength(0);
    expect(trackerReducer(next, { type: "toggle-habit", date: "2026-01-02", habitId: "h1" }).data?.habitEntries[0].habitCompletions.h1).toBe(false);
  });

  it("upserts reflections, settings, and stable habit IDs", () => {
    const reflected = trackerReducer(initial, { type: "save-reflection", date: "2026-01-02", dailyNote: "Done", problemToday: "", tomorrowFocus: "Next" });
    expect(reflected.data?.reflections[0].dailyNote).toBe("Done");
    const settings = trackerReducer(reflected, { type: "update-settings", patch: { targetCompletionRate: 0.9 } });
    expect(settings.data?.settings.targetCompletionRate).toBe(0.9);
    const updated = trackerReducer(settings, { type: "save-habit", habit: { ...habit(), name: "Updated" } });
    expect(updated.data?.habits[0]).toMatchObject({ id: "h1", name: "Updated" });
  });
});

function data(): BetterMeData {
  return { schemaVersion: 1, habits: [habit()], habitEntries: [], reflections: [], settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 7, targetCompletionRate: 0.8, themeId: "cute-cat", locale: "en" }, updatedAt: "2026-01-01T00:00:00Z" };
}

function habit(): Habit {
  return { id: "h1", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
}
