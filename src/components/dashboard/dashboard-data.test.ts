import { describe, expect, it } from "vitest";

import {
  buildDashboardViewModel,
  createInitialDashboardState,
  toggleHabitForDate
} from "@/components/dashboard/dashboard-data";

const today = "2026-07-04";

describe("dashboard habit data", () => {
  it("formats dashboard dates in English", () => {
    const state = createInitialDashboardState("2026-07-05");
    const viewModel = buildDashboardViewModel(state, "2026-07-05");

    expect(viewModel.date.longLabel).toBe("Sunday, July 5, 2026");
    expect(viewModel.date.monthLabel).toBe("July 2026");
    expect(viewModel.calendar.days.find((day) => day.date === "2026-07-05")?.label).toBe(
      "July 5, 2026"
    );
  });

  it("creates a self-habit dashboard with a twelve day current streak", () => {
    const state = createInitialDashboardState(today);
    const viewModel = buildDashboardViewModel(state, today);

    expect(viewModel.today.completedHabits).toBe(6);
    expect(viewModel.today.totalHabits).toBe(7);
    expect(viewModel.today.completionRate).toBe(0.875);
    expect(viewModel.streak.current).toBe(12);
    expect(viewModel.streak.best).toBe(26);
    expect(viewModel.streak.chain).toHaveLength(7);
    expect(viewModel.calendar.days).toHaveLength(42);
    expect(viewModel.analytics.goodDays).toBeGreaterThan(0);
  });

  it("updates today's progress when a habit is toggled", () => {
    const state = createInitialDashboardState(today);
    const viewModel = buildDashboardViewModel(state, today);
    const incompleteHabit = viewModel.habits.find((habit) => !habit.completed);

    expect(incompleteHabit).toBeTruthy();

    const nextState = toggleHabitForDate(state, today, incompleteHabit!.id);
    const nextViewModel = buildDashboardViewModel(nextState, today);

    expect(nextViewModel.today.completedHabits).toBe(7);
    expect(nextViewModel.today.completionRate).toBe(1);
  });
});
