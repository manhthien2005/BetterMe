import { describe, expect, it } from "vitest";

import {
  addHabitToState,
  buildDashboardViewModel,
  createInitialDashboardState,
  removeHabitFromState,
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

  it("exposes a rolling seven day rhythm", () => {
    const state = createInitialDashboardState(today);
    const viewModel = buildDashboardViewModel(state, today);

    expect(viewModel.streak.rhythm).toBeGreaterThan(0);
    expect(viewModel.streak.rhythm).toBeLessThanOrEqual(1);
  });

  it("adds a custom habit with a stable slug id", () => {
    const state = createInitialDashboardState(today);
    const nextState = addHabitToState(state, {
      name: "Uống nước",
      category: "Health"
    });

    expect(nextState.habits).toHaveLength(state.habits.length + 1);

    const added = nextState.habits[nextState.habits.length - 1];

    expect(added.id).toBe("custom_uong_nuoc");
    expect(added.name).toBe("Uống nước");
    expect(added.category).toBe("Health");
    expect(added.maxScore).toBe(1);

    const viewModel = buildDashboardViewModel(nextState, today);

    expect(viewModel.today.totalHabits).toBe(8);
    expect(
      viewModel.habits.find((habit) => habit.id === added.id)?.completed
    ).toBe(false);
  });

  it("does not add blank habits and avoids id collisions", () => {
    const state = createInitialDashboardState(today);

    expect(addHabitToState(state, { name: "   ", category: "Health" })).toBe(state);

    const once = addHabitToState(state, { name: "Read", category: "Learning" });
    const twice = addHabitToState(once, { name: "Read", category: "Learning" });
    const ids = twice.habits.map((habit) => habit.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("removes a habit and recalculates today's totals", () => {
    const state = createInitialDashboardState(today);
    const target = state.habits[0];
    const nextState = removeHabitFromState(state, target.id);

    expect(nextState.habits.some((habit) => habit.id === target.id)).toBe(false);

    const viewModel = buildDashboardViewModel(nextState, today);

    expect(viewModel.today.totalHabits).toBe(state.habits.length - 1);
    expect(removeHabitFromState(nextState, "missing-id")).toBe(nextState);
  });
});
