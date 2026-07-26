import { describe, expect, it } from "vitest";

import {
  createHabitInState,
  createInitialDashboardState,
  setHabitEntry,
  type DashboardState,
  type DashboardDayRecord,
} from "@/components/dashboard/dashboard-data";

import { buildInitialUpload } from "./importer";
import type { SetHabitLogMutation } from "./types";

/** A v3 day record built from plain booleans — every habit here is `check`. */
function dayRecord(date: string, completions: Record<string, boolean>): DashboardDayRecord {
  return {
    date,
    entries: Object.fromEntries(
      Object.entries(completions).map(([key, done]) => [key, { value: done ? 1 : 0 }])
    ),
    completions
  };
}


const TODAY = "2026-07-04";
const NOW = "2026-07-04T10:00:00.000Z";

/**
 * A state that looks like a real long-time user: seed fiction up to and
 * including seedCutoverDate, real records after it.
 */
function makeSeededState(): DashboardState {
  const state = createInitialDashboardState("2026-06-20"); // 45 days of seed fiction, cutover = 2026-06-20

  // Real history after the cutover.
  state.records["2026-06-25"] = dayRecord("2026-06-25", { english: true, clean: false });
  state.records["2026-07-01"] = dayRecord("2026-07-01", { english: true });
  state.records[TODAY] = dayRecord(TODAY, { english: true, coding: true });

  return state;
}

function logDates(mutations: ReturnType<typeof buildInitialUpload>): string[] {
  return mutations
    .filter((m): m is SetHabitLogMutation => m.kind === "setHabitLog")
    .map((m) => m.date);
}

describe("buildInitialUpload — provenance invariant (spec §2.5)", () => {
  it("'memories' uploads only records with date > seedCutoverDate", () => {
    const state = makeSeededState();
    const mutations = buildInitialUpload(state, "memories", TODAY, NOW);
    const dates = logDates(mutations);

    expect(dates.length).toBeGreaterThan(0);
    dates.forEach((date) => {
      expect(date > state.seedCutoverDate).toBe(true);
    });
    expect(new Set(dates)).toEqual(new Set(["2026-06-25", "2026-07-01", TODAY]));
  });

  it("'fresh' uploads records from today only (and still respects the cutover)", () => {
    const state = makeSeededState();
    const dates = logDates(buildInitialUpload(state, "fresh", TODAY, NOW));

    expect(new Set(dates)).toEqual(new Set([TODAY]));
  });

  it("NEVER leaks a record with date <= seedCutoverDate in either mode", () => {
    const state = makeSeededState();

    (["fresh", "memories"] as const).forEach((mode) => {
      logDates(buildInitialUpload(state, mode, TODAY, NOW)).forEach((date) => {
        expect(date <= state.seedCutoverDate).toBe(false);
      });
    });
  });

  it("a brand-new state (cutover = today) uploads zero records — today is still seed fiction", () => {
    const state = createInitialDashboardState(TODAY);

    expect(logDates(buildInitialUpload(state, "fresh", TODAY, NOW))).toEqual([]);
    expect(logDates(buildInitialUpload(state, "memories", TODAY, NOW))).toEqual([]);
  });
});

describe("buildInitialUpload — payload shape", () => {
  it("uploads all habits as CREATEs (collision detection armed) before any log", () => {
    const state = makeSeededState();
    const mutations = buildInitialUpload(state, "memories", TODAY, NOW);
    const firstLogIndex = mutations.findIndex((m) => m.kind === "setHabitLog");
    const upserts = mutations.filter((m) => m.kind === "upsertHabit");

    expect(upserts).toHaveLength(state.habits.length);
    upserts.forEach((m, index) => {
      expect(m.expectCreate).toBe(true);
      expect(m.habit.sortOrder).toBe(index);
      expect(mutations.indexOf(m)).toBeLessThan(firstLogIndex);
    });
  });

  it("uploads only explicit ticks — false cells stay implicit", () => {
    const state = makeSeededState();
    const logs = buildInitialUpload(state, "memories", TODAY, NOW).filter(
      (m): m is SetHabitLogMutation => m.kind === "setHabitLog"
    );

    expect(logs.every((m) => m.done === true)).toBe(true);
    expect(
      logs.some((m) => m.date === "2026-06-25" && m.habitKey === "clean")
    ).toBe(false); // clean was false that day
  });

  it("skips cells of habits that no longer exist", () => {
    const state = makeSeededState();

    state.records["2026-07-01"].completions.ghost_habit = true;

    const logs = buildInitialUpload(state, "memories", TODAY, NOW).filter(
      (m) => m.kind === "setHabitLog"
    ) as SetHabitLogMutation[];

    expect(logs.some((m) => m.habitKey === "ghost_habit")).toBe(false);
  });

  it("ends with exactly one companionSnapshot (the pet is real)", () => {
    const state = makeSeededState();
    const mutations = buildInitialUpload(state, "fresh", TODAY, NOW);

    expect(mutations.filter((m) => m.kind === "companionSnapshot")).toHaveLength(1);
    expect(mutations[mutations.length - 1].kind).toBe("companionSnapshot");
  });

  it("skips habits (and their cells) whose key is tombstoned in deletedHabits", () => {
    const state = makeSeededState();

    // Belt-and-braces vs the hydrate merge: even if a tombstoned habit is
    // still sitting in state.habits, the initial upload must not re-create it.
    state.deletedHabits = [{ key: "english", deletedAt: NOW }];

    const mutations = buildInitialUpload(state, "memories", TODAY, NOW);

    expect(
      mutations.some((m) => m.kind === "upsertHabit" && m.habit.key === "english")
    ).toBe(false);
    expect(
      mutations.some((m) => m.kind === "setHabitLog" && m.habitKey === "english")
    ).toBe(false);
    // The other habits still upload normally.
    expect(
      mutations.some((m) => m.kind === "upsertHabit" && m.habit.key === "coding")
    ).toBe(true);
  });

  it("never references bestStreakFloor or events anywhere in the upload", () => {
    const state = makeSeededState();

    (["fresh", "memories"] as const).forEach((mode) => {
      const serialized = JSON.stringify(buildInitialUpload(state, mode, TODAY, NOW));

      expect(serialized).not.toContain("bestStreakFloor");
      expect(serialized).not.toContain("event-weekly-review"); // seed event ids
      expect(serialized).not.toContain('"events"');
    });
  });
});

describe("the initial upload carries the v3 shape (U1c)", () => {
  it("a habit uploads its full definition, not a v2 shadow", () => {
    const state = createHabitInState(createInitialDashboardState(TODAY), {
      name: "Đọc sách",
      category: "Growth",
      icon: "📚",
      trackingType: "duration",
      target: 20,
      unit: null,
      steps: [],
      repeatDays: [2, 4, 6],
      timesOfDay: ["evening"],
      scheduledAt: "21:00",
      color: "dusk",
      motivation: "Mỗi tối một chương"
    });

    const upsert = buildInitialUpload(state, "fresh", TODAY, NOW).find(
      (mutation) => mutation.kind === "upsertHabit" && mutation.habit.name === "Đọc sách"
    );

    if (upsert?.kind !== "upsertHabit") throw new Error("expected an upsertHabit");

    expect(upsert.habit).toMatchObject({
      icon: "📚",
      trackingType: "duration",
      target: 20,
      repeatDays: [2, 4, 6],
      timesOfDay: ["evening"],
      scheduledAt: "21:00",
      color: "dusk",
      motivation: "Mỗi tối một chương"
    });
  });

  it("a completed cell uploads its reading and its clock", () => {
    // Built off the seeded state: on a fresh one seedCutoverDate IS today, so
    // today's record is seed fiction and provably never leaves the device.
    const base = makeSeededState();
    const habitId = base.habits[0].id;
    const state = setHabitEntry(base, TODAY, habitId, 1, "06:10");

    const log = buildInitialUpload(state, "fresh", TODAY, NOW).find(
      (mutation) => mutation.kind === "setHabitLog" && mutation.habitKey === habitId
    );

    if (log?.kind !== "setHabitLog") throw new Error("expected a setHabitLog");

    expect(log.value).toBe(1);
    expect(log.completedAt).toBe("06:10");
  });
});
