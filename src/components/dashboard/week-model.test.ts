import { describe, expect, it } from "vitest";

import {
  buildWeekGrid,
  compareWeekTotals,
  type WeekCellState
} from "@/components/dashboard/week-model";
import {
  createInitialDashboardState,
  type DashboardHabit,
  type DashboardState
} from "@/components/dashboard/dashboard-data";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";

/**
 * Monday 2026-07-20 → Sunday 2026-07-26. "Today" sits mid-week on Thursday
 * 2026-07-23 so past / today / future are all present in one grid.
 */
const MONDAY = "2026-07-20";
const THURSDAY = "2026-07-23";
const SUNDAY = "2026-07-26";

function habit(overrides: Partial<DashboardHabit> & { id: string }): DashboardHabit {
  return migrateHabitFields({
    key: overrides.id,
    name: "Học tiếng Anh",
    category: "Learning",
    maxScore: 1,
    description: "",
    iconName: "BookOpen",
    ...overrides
  }) as DashboardHabit;
}

function stateWith(habits: DashboardHabit[], records: DashboardState["records"] = {}): DashboardState {
  return { ...createInitialDashboardState(MONDAY), habits, records };
}

function cellStates(row: { cells: Array<{ state: WeekCellState }> }): WeekCellState[] {
  return row.cells.map((cell) => cell.state);
}

describe("buildWeekGrid — the seven columns", () => {
  it("runs Monday to Sunday whatever day you ask from", () => {
    const grid = buildWeekGrid(stateWith([habit({ id: "english" })]), THURSDAY);

    expect(grid.weekStart).toBe(MONDAY);
    expect(grid.weekEnd).toBe(SUNDAY);
    expect(grid.days).toHaveLength(7);
    expect(grid.days.map((day) => day.date)).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26"
    ]);
    expect(grid.days.map((day) => day.label)).toEqual([
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "CN"
    ]);
  });

  it("marks exactly one column as today, and only the later ones as future", () => {
    const grid = buildWeekGrid(stateWith([habit({ id: "english" })]), THURSDAY);

    expect(grid.days.filter((day) => day.isToday)).toHaveLength(1);
    expect(grid.days.find((day) => day.isToday)?.date).toBe(THURSDAY);
    expect(grid.days.filter((day) => day.isFuture).map((day) => day.date)).toEqual([
      "2026-07-24",
      "2026-07-25",
      "2026-07-26"
    ]);
  });

  it("asked from a Sunday, still starts that week's Monday", () => {
    const grid = buildWeekGrid(stateWith([habit({ id: "english" })]), SUNDAY);

    expect(grid.weekStart).toBe(MONDAY);
    expect(grid.days.find((day) => day.isToday)?.date).toBe(SUNDAY);
    expect(grid.days.filter((day) => day.isFuture)).toHaveLength(0);
  });
});

describe("buildWeekGrid — what a cell says", () => {
  it("a finished check habit reads done", () => {
    const state = stateWith(
      [habit({ id: "english" })],
      {
        "2026-07-20": {
          date: "2026-07-20",
          entries: { english: { value: 1 } },
          completions: { english: true }
        }
      }
    );
    const grid = buildWeekGrid(state, THURSDAY);

    expect(cellStates(grid.rows[0])[0]).toBe("done");
  });

  it("partial progress on a count habit reads partial, and carries its ratio", () => {
    const state = stateWith(
      [habit({ id: "water", trackingType: "count", target: 8, unit: "ly" })],
      {
        "2026-07-21": {
          date: "2026-07-21",
          entries: { water: { value: 4 } },
          completions: { water: false }
        }
      }
    );
    const grid = buildWeekGrid(state, THURSDAY);
    const tuesday = grid.rows[0].cells[1];

    expect(tuesday.state).toBe("partial");
    expect(tuesday.ratio).toBeCloseTo(0.5);
    expect(tuesday.done).toBe(4);
    expect(tuesday.target).toBe(8);
  });

  it("a day the habit does not repeat on is off-schedule, not a miss", () => {
    // Weekdays only: Saturday (6) and Sunday (7) are not this habit's days.
    const state = stateWith([habit({ id: "english", repeatDays: [1, 2, 3, 4, 5] })]);
    const grid = buildWeekGrid(state, SUNDAY);

    expect(cellStates(grid.rows[0])).toEqual([
      "missed",
      "missed",
      "missed",
      "missed",
      "missed",
      "off",
      "off"
    ]);
  });

  it("a day still to come is future, never a miss", () => {
    const grid = buildWeekGrid(stateWith([habit({ id: "english" })]), THURSDAY);

    expect(cellStates(grid.rows[0])).toEqual([
      "missed",
      "missed",
      "missed",
      "empty",
      "future",
      "future",
      "future"
    ]);
  });

  it("today with nothing recorded yet is empty — an open invitation, not a failure", () => {
    const grid = buildWeekGrid(stateWith([habit({ id: "english" })]), THURSDAY);
    const thursday = grid.rows[0].cells[3];

    expect(thursday.state).toBe("empty");
    expect(thursday.isToday).toBe(true);
  });

  it("a paused habit's days from the pause onward are off-schedule", () => {
    const state = stateWith([habit({ id: "english", pausedAt: "2026-07-22" })]);
    const grid = buildWeekGrid(state, SUNDAY);

    expect(cellStates(grid.rows[0])).toEqual([
      "missed",
      "missed",
      "off",
      "off",
      "off",
      "off",
      "off"
    ]);
  });
});

describe("buildWeekGrid — rows", () => {
  it("gives one row per habit scheduled anywhere in the week, in habit order", () => {
    const state = stateWith([
      habit({ id: "english", name: "Học tiếng Anh" }),
      habit({ id: "water", name: "Uống nước", trackingType: "count", target: 8 })
    ]);
    const grid = buildWeekGrid(state, THURSDAY);

    expect(grid.rows.map((row) => row.habit.id)).toEqual(["english", "water"]);
    expect(grid.rows).toHaveLength(2);
    grid.rows.forEach((row) => expect(row.cells).toHaveLength(7));
  });

  it("leaves out a habit archived before the week began", () => {
    const state = stateWith([
      habit({ id: "english" }),
      habit({ id: "old", archivedAt: "2026-07-01" })
    ]);
    const grid = buildWeekGrid(state, THURSDAY);

    expect(grid.rows.map((row) => row.habit.id)).toEqual(["english"]);
  });

  it("keeps a habit archived mid-week — the days before it still happened", () => {
    const state = stateWith([habit({ id: "english", archivedAt: "2026-07-22" })]);
    const grid = buildWeekGrid(state, SUNDAY);

    expect(grid.rows).toHaveLength(1);
    expect(cellStates(grid.rows[0])).toEqual([
      "missed",
      "missed",
      "off",
      "off",
      "off",
      "off",
      "off"
    ]);
  });
});

describe("buildWeekGrid — the week's own total", () => {
  it("counts completions over scheduled days only, so an off day never inflates the denominator", () => {
    const state = stateWith(
      [habit({ id: "english", repeatDays: [1, 2, 3] })],
      {
        "2026-07-20": {
          date: "2026-07-20",
          entries: { english: { value: 1 } },
          completions: { english: true }
        }
      }
    );
    const grid = buildWeekGrid(state, SUNDAY);

    // Scheduled Mon/Tue/Wed = 3 slots; one done.
    expect(grid.total).toEqual({ done: 1, scheduled: 3 });
  });

  it("does not count days still to come — the week is not over yet", () => {
    const state = stateWith(
      [habit({ id: "english" })],
      {
        "2026-07-20": {
          date: "2026-07-20",
          entries: { english: { value: 1 } },
          completions: { english: true }
        }
      }
    );
    const grid = buildWeekGrid(state, THURSDAY);

    // Mon–Thu are in play (4), Fri–Sun are not counted yet.
    expect(grid.total).toEqual({ done: 1, scheduled: 4 });
  });
});

describe("compareWeekTotals — measured against your own last week", () => {
  it("says how many more when this week is ahead", () => {
    expect(compareWeekTotals(11, 8)).toBe("hơn tuần trước +3");
  });

  it("stays neutral and never scolds when this week is behind", () => {
    const line = compareWeekTotals(5, 9);

    expect(line).toBe("tuần trước 9 lượt");
    expect(line).not.toMatch(/kém|thua|ít hơn|tệ|giảm/);
  });

  it("names a tie plainly", () => {
    expect(compareWeekTotals(7, 7)).toBe("bằng tuần trước");
  });

  it("says nothing about last week when there is no last week", () => {
    expect(compareWeekTotals(4, 0)).toBe("tuần đầu tiên của nhịp này");
  });
});
