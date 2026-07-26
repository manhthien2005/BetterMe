import { describe, expect, it } from "vitest";

import {
  ALL_WEEKDAYS,
  CHECKLIST_MAX_STEPS,
  CHECKLIST_MIN_STEPS,
  countSteps,
  entryProgress,
  HABIT_COLORS,
  isEntryComplete,
  isScheduledOn,
  TIME_OF_DAY_ORDER,
  toggleStep,
  TRACKING_TYPES,
  weekdayIso,
  type HabitTracking
} from "@/components/dashboard/habit-model";

/** A `check` habit scheduled every day — the shape every v2 habit migrates to. */
function checkHabit(overrides: Partial<HabitTracking> = {}): HabitTracking {
  return { trackingType: "check", target: 1, repeatDays: [...ALL_WEEKDAYS], ...overrides };
}

describe("habit model constants", () => {
  it("lists the four tracking types from the spec", () => {
    expect(TRACKING_TYPES).toEqual(["check", "count", "duration", "checklist"]);
  });

  it("orders the day's parts morning → afternoon → evening → anytime", () => {
    expect(TIME_OF_DAY_ORDER).toEqual(["morning", "afternoon", "evening", "anytime"]);
  });

  it("offers exactly six card colours (spec §5.1)", () => {
    expect(HABIT_COLORS).toHaveLength(6);
    expect(new Set(HABIT_COLORS).size).toBe(6);
  });

  it("bounds a checklist at 2–7 steps", () => {
    expect(CHECKLIST_MIN_STEPS).toBe(2);
    expect(CHECKLIST_MAX_STEPS).toBe(7);
  });
});

describe("weekdayIso", () => {
  it("numbers Monday 1 through Sunday 7", () => {
    // 2026-07-27 is a Monday.
    expect(weekdayIso("2026-07-27")).toBe(1);
    expect(weekdayIso("2026-07-28")).toBe(2);
    expect(weekdayIso("2026-08-01")).toBe(6);
    expect(weekdayIso("2026-08-02")).toBe(7);
  });
});

describe("checklist bitmask", () => {
  it("counts the set bits", () => {
    expect(countSteps(0)).toBe(0);
    expect(countSteps(0b1)).toBe(1);
    expect(countSteps(0b1011)).toBe(3);
    expect(countSteps(0b1111111)).toBe(7);
  });

  it("flips one step without touching the others", () => {
    expect(toggleStep(0, 0)).toBe(0b1);
    expect(toggleStep(0b1, 2)).toBe(0b101);
    expect(toggleStep(0b101, 0)).toBe(0b100);
  });
});

describe("isEntryComplete", () => {
  it("treats a missing entry as not done, for every type", () => {
    expect(isEntryComplete(checkHabit(), undefined)).toBe(false);
    expect(
      isEntryComplete(checkHabit({ trackingType: "count", target: 8 }), undefined)
    ).toBe(false);
  });

  it("check: any value from 1 up is done", () => {
    expect(isEntryComplete(checkHabit(), { value: 0 })).toBe(false);
    expect(isEntryComplete(checkHabit(), { value: 1 })).toBe(true);
  });

  it("count: done only once the target is reached — partial never punishes", () => {
    const habit = checkHabit({ trackingType: "count", target: 8 });

    expect(isEntryComplete(habit, { value: 0 })).toBe(false);
    expect(isEntryComplete(habit, { value: 7 })).toBe(false);
    expect(isEntryComplete(habit, { value: 8 })).toBe(true);
    expect(isEntryComplete(habit, { value: 12 })).toBe(true);
  });

  it("duration: minutes behave exactly like a count", () => {
    const habit = checkHabit({ trackingType: "duration", target: 20 });

    expect(isEntryComplete(habit, { value: 19 })).toBe(false);
    expect(isEntryComplete(habit, { value: 20 })).toBe(true);
  });

  it("checklist: every step must be ticked", () => {
    const habit = checkHabit({
      trackingType: "checklist",
      target: 3,
      steps: ["Trải chiếu", "Ngồi 5 phút", "Ghi một dòng"]
    });

    expect(isEntryComplete(habit, { value: 0b011 })).toBe(false);
    expect(isEntryComplete(habit, { value: 0b111 })).toBe(true);
  });

  it("clamps a zero/absurd count target to 1 so any progress counts", () => {
    expect(isEntryComplete(checkHabit({ trackingType: "count", target: 0 }), { value: 1 })).toBe(
      true
    );
    expect(isEntryComplete(checkHabit({ trackingType: "count", target: -3 }), { value: 1 })).toBe(
      true
    );
  });

  it("a checklist missing its steps trusts `target` — never over-credits", () => {
    // Corrupt data: 3 steps expected, none listed. Falling back to "any
    // progress counts" would mark a 3-step habit done after one tick.
    const habit = checkHabit({ trackingType: "checklist", target: 3 });

    expect(isEntryComplete(habit, { value: 0b001 })).toBe(false);
    expect(isEntryComplete(habit, { value: 0b111 })).toBe(true);
  });
});

describe("entryProgress", () => {
  it("reports a count's progress as a clamped ratio", () => {
    const habit = checkHabit({ trackingType: "count", target: 8 });

    expect(entryProgress(habit, { value: 2 })).toEqual({ done: 2, target: 8, ratio: 0.25 });
    expect(entryProgress(habit, { value: 99 }).ratio).toBe(1);
    expect(entryProgress(habit, undefined)).toEqual({ done: 0, target: 8, ratio: 0 });
  });

  it("reports a checklist's progress in steps, not bitmask value", () => {
    const habit = checkHabit({
      trackingType: "checklist",
      target: 4,
      steps: ["a", "b", "c", "d"]
    });

    expect(entryProgress(habit, { value: 0b1011 })).toEqual({ done: 3, target: 4, ratio: 0.75 });
  });

  it("reports a check as 0/1 or 1/1", () => {
    expect(entryProgress(checkHabit(), { value: 1 })).toEqual({ done: 1, target: 1, ratio: 1 });
    expect(entryProgress(checkHabit(), undefined)).toEqual({ done: 0, target: 1, ratio: 0 });
  });
});

describe("isScheduledOn", () => {
  it("follows the repeat days (2026-07-27 is a Monday)", () => {
    const weekdaysOnly = checkHabit({ repeatDays: [1, 2, 3, 4, 5] });

    expect(isScheduledOn(weekdaysOnly, "2026-07-27")).toBe(true);
    expect(isScheduledOn(weekdaysOnly, "2026-08-01")).toBe(false);
  });

  it("drops out of the day from the pause date onward, and returns on resume", () => {
    const paused = checkHabit({ pausedAt: "2026-07-27" });

    expect(isScheduledOn(paused, "2026-07-26")).toBe(true);
    expect(isScheduledOn(paused, "2026-07-27")).toBe(false);
    expect(isScheduledOn(paused, "2026-07-28")).toBe(false);
    expect(isScheduledOn(checkHabit({ pausedAt: null }), "2026-07-28")).toBe(true);
  });

  it("leaves every view from the archive date onward, history untouched", () => {
    const archived = checkHabit({ archivedAt: "2026-07-27" });

    expect(isScheduledOn(archived, "2026-07-26")).toBe(true);
    expect(isScheduledOn(archived, "2026-07-27")).toBe(false);
  });

  it("treats an empty repeat list as 'never scheduled', not 'always'", () => {
    expect(isScheduledOn(checkHabit({ repeatDays: [] }), "2026-07-27")).toBe(false);
  });
});
