import { describe, expect, it } from "vitest";

import {
  addHabitToState,
  adoptPet,
  buildDashboardViewModel,
  checkComebackGift,
  createInitialDashboardState,
  feedActivePet,
  getBondTier,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift,
  petActivePet,
  recordGrowthDay,
  removeHabitFromState,
  switchActivePet,
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

describe("companion pet system", () => {
  function adopted(species: "dog" | "cat" = "dog", name = "Xoài") {
    return adoptPet(createInitialDashboardState(today), species, name, today);
  }

  it("migrates a v1 payload without companion data and keeps records intact", () => {
    const v1 = createInitialDashboardState(today) as Record<string, unknown>;
    delete v1.companion;

    const migrated = migrateDashboardState(v1);

    expect(migrated).not.toBeNull();
    expect(migrated!.companion.activeSpecies).toBeNull();
    expect(migrated!.companion.food).toBe(0);
    expect(Object.keys(migrated!.records).length).toBeGreaterThan(40);
    expect(migrateDashboardState(null)).toBeNull();
    expect(migrateDashboardState("junk")).toBeNull();
    expect(migrateDashboardState({})).toBeNull();
  });

  it("adopts a pet, names it, and falls back to a default name", () => {
    const state = adopted("cat", "  Bơ  ");

    expect(state.companion.activeSpecies).toBe("cat");
    expect(state.companion.pets.cat?.name).toBe("Bơ");

    const unnamed = adoptPet(createInitialDashboardState(today), "dog", "   ", today);

    expect(unnamed.companion.pets.dog?.name).toBe("Xoài");
  });

  it("switches pets without losing per-pet bond and ignores unknown species", () => {
    let state = adopted("dog");
    state = feedActivePet(grantFoodForHabitCompletion(state, today, 1, 7), today);

    const dogBond = state.companion.pets.dog!.bond;

    state = adoptPet(state, "cat", "Mochi", today);

    expect(state.companion.activeSpecies).toBe("cat");
    expect(state.companion.pets.dog?.bond).toBe(dogBond);

    state = switchActivePet(state, "dog");

    expect(state.companion.activeSpecies).toBe("dog");
    expect(switchActivePet(state, "dog")).toBe(state);
  });

  it("grants one food per completion and cannot be farmed by re-toggling", () => {
    let state = adopted();

    state = grantFoodForHabitCompletion(state, today, 1, 7);
    expect(state.companion.food).toBe(1);

    // Simulate un-tick + re-tick 20 times: the day ledger caps at totalCount + 1.
    for (let i = 0; i < 20; i += 1) {
      state = grantFoodForHabitCompletion(state, today, 1, 7);
    }
    expect(state.companion.food).toBe(8);

    // A 100% day grants one extra treat.
    let fresh = adopted();
    fresh = grantFoodForHabitCompletion(fresh, today, 7, 7);
    expect(fresh.companion.food).toBe(2);
  });

  it("feeding consumes food, raises bond, and records a growth day once", () => {
    let state = adopted();

    expect(feedActivePet(state, today)).toBe(state); // no food yet

    state = grantFoodForHabitCompletion(state, today, 1, 7);
    state = grantFoodForHabitCompletion(state, today, 2, 7);
    state = feedActivePet(state, today);

    expect(state.companion.food).toBe(1);
    expect(state.companion.pets.dog?.bond).toBe(2);
    expect(state.companion.pets.dog?.growthDays).toBe(1);

    state = feedActivePet(state, today);

    expect(state.companion.pets.dog?.growthDays).toBe(1); // same day, still 1
    expect(state.companion.pets.dog?.bond).toBe(4);
  });

  it("caps petting at three per day and resets the next day", () => {
    let state = adopted();

    for (let i = 0; i < 5; i += 1) {
      state = petActivePet(state, today);
    }
    expect(state.companion.pets.dog?.bond).toBe(3);

    state = petActivePet(state, "2026-07-05");
    expect(state.companion.pets.dog?.bond).toBe(4);
  });

  it("grants the all-done bonus once per day", () => {
    let state = adopted();

    state = grantAllDoneBonus(state, today);
    state = grantAllDoneBonus(state, today);

    expect(state.companion.pets.dog?.bond).toBe(5);
  });

  it("records at most one growth day per date", () => {
    let state = adopted();

    state = recordGrowthDay(state, today);
    state = recordGrowthDay(state, today);
    state = recordGrowthDay(state, "2026-07-05");

    expect(state.companion.pets.dog?.growthDays).toBe(2);
  });

  it("saves a gift after absence instead of guilt, and opening it pays out", () => {
    let state = adopted();

    state = checkComebackGift(state, today);
    expect(state.companion.pendingGift).toBe(false);

    state = checkComebackGift(state, "2026-07-10");
    expect(state.companion.pendingGift).toBe(true);

    state = openGift(state);
    expect(state.companion.pendingGift).toBe(false);
    expect(state.companion.food).toBe(3);
    expect(state.companion.pets.dog?.bond).toBe(3);
    expect(openGift(state)).toBe(state);
  });

  it("does not flag a gift for a one-day rest", () => {
    let state = adopted();

    state = checkComebackGift(state, today);
    state = checkComebackGift(state, "2026-07-05");

    expect(state.companion.pendingGift).toBe(false);
  });

  it("maps growth days to stages and bond to tiers", () => {
    expect(getPetStage(0)).toBe("baby");
    expect(getPetStage(4)).toBe("baby");
    expect(getPetStage(5)).toBe("kid");
    expect(getPetStage(15)).toBe("junior");
    expect(getPetStage(30)).toBe("teen");
    expect(getPetStage(50)).toBe("adult");
    expect(getPetStage(500)).toBe("adult");

    expect(getBondTier(0)).toBe(1);
    expect(getBondTier(59)).toBe(1);
    expect(getBondTier(60)).toBe(2);
    expect(getBondTier(180)).toBe(3);
    expect(getBondTier(420)).toBe(4);
    expect(getBondTier(840)).toBe(5);
    expect(getBondTier(9999)).toBe(5);
  });

  it("exposes the companion in the view model", () => {
    const empty = buildDashboardViewModel(createInitialDashboardState(today), today);

    expect(empty.companion.activePet).toBeNull();
    expect(empty.companion.adoptedSpecies).toEqual([]);

    const state = adopted("cat", "Mochi");
    const viewModel = buildDashboardViewModel(state, today);

    expect(viewModel.companion.activePet?.name).toBe("Mochi");
    expect(viewModel.companion.activePet?.stage).toBe("baby");
    expect(viewModel.companion.activePet?.bondTier).toBe(1);
    expect(viewModel.companion.activePet?.bondTierLabel).toBe("Lạ lẫm");
    expect(viewModel.companion.activePet?.daysToNextStage).toBe(5);
    expect(viewModel.companion.activePet?.canPetToday).toBe(true);
  });
});
