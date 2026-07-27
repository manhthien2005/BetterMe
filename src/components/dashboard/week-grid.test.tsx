import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createInitialDashboardState } from "@/components/dashboard/dashboard-data";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";
import { WeekGridCard } from "@/components/dashboard/week-grid";
import { buildWeekGrid } from "@/components/dashboard/week-model";

const MONDAY = "2026-07-20";
const THURSDAY = "2026-07-23";

function habit(overrides: Record<string, unknown>) {
  return migrateHabitFields({
    id: "english",
    key: "english",
    name: "Học tiếng Anh",
    category: "Learning",
    maxScore: 1,
    description: "",
    iconName: "BookOpen",
    ...overrides
  });
}

/** A state with no seed history at all — every cell is the test's own doing. */
function stateWith(habits: ReturnType<typeof habit>[], records = {}) {
  return { ...createInitialDashboardState(MONDAY), habits, records };
}

function gridFor(habits: ReturnType<typeof habit>[], records = {}, today = THURSDAY) {
  return buildWeekGrid(stateWith(habits, records), today);
}

describe("WeekGridCard", () => {
  it("labels the columns T2 → CN, Monday first", () => {
    render(<WeekGridCard grid={gridFor([habit({})])} streaks={{}} />);

    const headers = screen.getAllByRole("columnheader").map((cell) => cell.textContent);

    // First column is the habit name, last is the streak — the seven between
    // them are the days, and they must read Monday first.
    expect(headers[0]).toBe("Thói quen");
    expect(headers.slice(1, -1)).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
    expect(headers[headers.length - 1]).toBe("Chuỗi");
  });

  it("is a real table, so a screen reader can navigate it by row and column", () => {
    render(<WeekGridCard grid={gridFor([habit({})])} streaks={{}} />);

    expect(screen.getByRole("table")).toBeTruthy();
    // One row per habit, plus the header row.
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("rowheader", { name: /Học tiếng Anh/ })).toBeTruthy();
  });

  it("gives every cell a text label — colour alone never carries the meaning", () => {
    const records = {
      [MONDAY]: {
        date: MONDAY,
        entries: { english: { value: 1 } },
        completions: { english: true }
      }
    };

    render(<WeekGridCard grid={gridFor([habit({})], records)} streaks={{}} />);

    // WCAG 1.4.1: the state is in the accessible name, not just the fill.
    expect(screen.getByLabelText("Học tiếng Anh, T2 20 tháng 7: đã xong")).toBeTruthy();
    expect(screen.getByLabelText("Học tiếng Anh, T3 21 tháng 7: chưa ghi")).toBeTruthy();
    expect(screen.getByLabelText("Học tiếng Anh, T5 23 tháng 7: hôm nay, chưa ghi")).toBeTruthy();
    expect(screen.getByLabelText("Học tiếng Anh, T6 24 tháng 7: chưa tới")).toBeTruthy();
  });

  it("names partial progress in the habit's own unit", () => {
    const records = {
      [MONDAY]: {
        date: MONDAY,
        entries: { water: { value: 4 } },
        completions: { water: false }
      }
    };
    const water = habit({
      id: "water",
      key: "water",
      name: "Uống nước",
      trackingType: "count",
      target: 8,
      unit: "ly"
    });

    render(<WeekGridCard grid={gridFor([water], records)} streaks={{}} />);

    expect(screen.getByLabelText("Uống nước, T2 20 tháng 7: 4/8 ly")).toBeTruthy();
  });

  it("says off-schedule for a weekday the habit does not repeat on", () => {
    const weekdaysOnly = habit({ repeatDays: [1, 2, 3, 4, 5] });

    render(<WeekGridCard grid={gridFor([weekdaysOnly])} streaks={{}} />);

    expect(screen.getByLabelText("Học tiếng Anh, T7 25 tháng 7: không theo lịch")).toBeTruthy();
  });

  it("marks today's column so the eye lands on it", () => {
    render(<WeekGridCard grid={gridFor([habit({})])} streaks={{}} />);

    const todayHeader = screen.getByRole("columnheader", { name: /T5/ });

    expect(todayHeader.getAttribute("aria-current")).toBe("date");
  });

  it("shows each habit's own streak at the end of its row", () => {
    render(<WeekGridCard grid={gridFor([habit({})])} streaks={{ english: 5 }} />);

    expect(screen.getByLabelText("Chuỗi Học tiếng Anh: 5 ngày")).toBeTruthy();
  });

  it("sums the week and compares it with last week, never with anyone else", () => {
    const records = {
      [MONDAY]: {
        date: MONDAY,
        entries: { english: { value: 1 } },
        completions: { english: true }
      }
    };

    render(
      <WeekGridCard grid={gridFor([habit({})], records)} previousDone={2} streaks={{}} />
    );

    const summary = screen.getByTestId("week-summary").textContent ?? "";

    expect(summary).toContain("1/4 lượt");
    expect(summary).toContain("tuần trước 2 lượt");
    expect(summary).not.toMatch(/kém|thua|ít hơn|tệ/);
  });

  it("invites the first habit instead of showing an empty table", () => {
    render(<WeekGridCard grid={gridFor([])} streaks={{}} />);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/chưa có thói quen nào/i)).toBeTruthy();
  });
});
