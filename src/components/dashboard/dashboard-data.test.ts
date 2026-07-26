import { describe, expect, it } from "vitest";

import {
  addHabitToState,
  adoptPet,
  buildDashboardViewModel,
  buildHabitDetail,
  calculateHabitStreak,
  checkComebackGift,
  createInitialDashboardState,
  deriveFoodBalance,
  feedActivePet,
  getBondTier,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift,
  petActivePet,
  pruneFoodLedgers,
  recordGrowthDay,
  rekeyHabit,
  countCompletedOn,
  removeHabitFromState,
  setHabitEntry,
  switchActivePet,
  toggleHabitForDate,
  trackingIndex,
  updateHabitInState,
  type DashboardState
} from "@/components/dashboard/dashboard-data";
import { isEntryComplete } from "@/components/dashboard/habit-model";

const today = "2026-07-04";

describe("dashboard habit data", () => {
  it("formats dashboard dates in Vietnamese", () => {
    const state = createInitialDashboardState("2026-07-05");
    const viewModel = buildDashboardViewModel(state, "2026-07-05");

    expect(viewModel.date.longLabel).toBe("Chủ Nhật, 5 tháng 7, 2026");
    expect(viewModel.date.monthLabel).toBe("tháng 7 năm 2026");
    expect(viewModel.calendar.days.find((day) => day.date === "2026-07-05")?.label).toBe(
      "5 tháng 7, 2026"
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

describe("phase 0 sync groundwork", () => {
  const nowIso = "2026-07-04T10:00:00.000Z";

  function adopted(species: "dog" | "cat" = "dog", name = "Xoài") {
    return adoptPet(createInitialDashboardState(today), species, name, today, nowIso);
  }

  /** Simulates a pre-sync v2 payload: numeric food counter, no ledger fields, no provenance. */
  function legacyPayload(overrides: Record<string, unknown> = {}) {
    const base = createInitialDashboardState(today) as unknown as Record<string, unknown>;

    delete base.seedCutoverDate;
    delete base.deletedHabits;

    return {
      ...base,
      companion: {
        pets: {
          dog: {
            species: "dog",
            name: "Xoài",
            adoptedOn: "2026-06-20",
            growthDays: 3,
            bond: 10,
            lastGrowthDate: null,
            petsToday: 0,
            petsTodayDate: null
          }
        },
        activeSpecies: "dog",
        food: 5,
        foodGrantedByDate: { "2026-07-01": 4, "2026-07-03": 6 },
        allDoneBonusDates: {},
        lastSeenDate: "2026-07-03",
        pendingGift: false,
        ...overrides
      }
    };
  }

  it("stamps seedCutoverDate on creation", () => {
    expect(createInitialDashboardState(today).seedCutoverDate).toBe(today);
    expect(createInitialDashboardState(today).deletedHabits).toEqual([]);
  });

  it("backfills seedCutoverDate on migration from the earliest adoption", () => {
    const migrated = migrateDashboardState(legacyPayload(), today);

    expect(migrated?.seedCutoverDate).toBe("2026-06-20");

    // No pets: the migration day is the only safe cutover.
    const petless = migrateDashboardState(legacyPayload({ pets: {}, activeSpecies: null }), today);

    expect(petless?.seedCutoverDate).toBe(today);

    // An adoption "after" today never pushes the cutover into the future.
    const future = migrateDashboardState(
      legacyPayload({
        pets: {
          dog: { ...legacyPayload().companion.pets.dog, adoptedOn: "2026-08-01" }
        }
      }),
      today
    );

    expect(future?.seedCutoverDate).toBe(today);

    // A payload that already carries the stamp keeps it verbatim.
    const stamped = migrateDashboardState(
      { ...legacyPayload(), seedCutoverDate: "2026-05-05" },
      today
    );

    expect(stamped?.seedCutoverDate).toBe("2026-05-05");
  });

  it("appends a tombstone and prunes orphan completions on habit removal", () => {
    const state = createInitialDashboardState(today);
    const target = state.habits[0];
    const other = state.habits[1];
    const next = removeHabitFromState(state, target.id, nowIso);

    expect(next.deletedHabits).toEqual([{ key: target.id, deletedAt: nowIso }]);

    Object.values(next.records).forEach((record) => {
      expect(target.id in record.completions).toBe(false);
      expect(other.id in record.completions).toBe(true);
    });

    // Removing a second habit stacks tombstones instead of replacing them.
    const twice = removeHabitFromState(next, other.id, "2026-07-05T08:00:00.000Z");

    expect(twice.deletedHabits).toHaveLength(2);
    expect(removeHabitFromState(twice, "missing-id", nowIso)).toBe(twice);
  });

  it("rekeys a habit across the habit list and every day's completions", () => {
    let state = addHabitToState(createInitialDashboardState(today), {
      name: "Đọc sách",
      category: "Learning"
    });

    state = toggleHabitForDate(state, today, "custom_doc_sach");

    const rekeyed = rekeyHabit(state, "custom_doc_sach", "custom_doc_sach_2");
    const habit = rekeyed.habits.find((item) => item.id === "custom_doc_sach_2");

    expect(habit).toBeTruthy();
    expect(habit?.key).toBe("custom_doc_sach_2");
    expect(rekeyed.habits.some((item) => item.id === "custom_doc_sach")).toBe(false);
    expect(rekeyed.records[today].completions["custom_doc_sach_2"]).toBe(true);

    Object.values(rekeyed.records).forEach((record) => {
      expect("custom_doc_sach" in record.completions).toBe(false);
    });

    // Guard rails: unknown source, occupied target, and no-op rekeys return the same state.
    expect(rekeyHabit(state, "missing", "anything")).toBe(state);
    expect(rekeyHabit(state, "custom_doc_sach", state.habits[0].id)).toBe(state);
    expect(rekeyHabit(state, "custom_doc_sach", "custom_doc_sach")).toBe(state);
  });

  it("migrates the numeric food counter into carryover with an identical derived balance", () => {
    const migrated = migrateDashboardState(legacyPayload(), today);

    expect(migrated).not.toBeNull();
    expect(migrated!.companion.foodCarryover).toBe(5);
    expect(deriveFoodBalance(migrated!.companion)).toBe(5);
    expect(migrated!.companion.food).toBe(5);

    // Historical grants stay for the daily cap but are neutralised by
    // deterministic migration spend events, so nothing double-counts.
    expect(migrated!.companion.foodGrantedByDate).toEqual({
      "2026-07-01": 4,
      "2026-07-03": 6
    });
    expect(migrated!.companion.foodSpentEvents["2026-07-01"]).toHaveLength(4);
    expect(migrated!.companion.foodSpentEvents["2026-07-03"]).toHaveLength(6);

    // Re-migrating the migrated payload is a no-op (idempotent under retries).
    const twice = migrateDashboardState(migrated, today);

    expect(twice!.companion.foodCarryover).toBe(5);
    expect(twice!.companion.foodSpentEvents).toEqual(migrated!.companion.foodSpentEvents);
    expect(deriveFoodBalance(twice!.companion)).toBe(5);
  });

  it("defaults the new LWW stamps to null on migration", () => {
    const migrated = migrateDashboardState(legacyPayload(), today);

    expect(migrated!.companion.pets.dog?.nameUpdatedAt).toBeNull();
    expect(migrated!.companion.activeSpeciesUpdatedAt).toBeNull();
    expect(migrated!.companion.foodGiftsReceived).toEqual({});
    expect(migrated!.companion.giftOverflowBondByDate).toEqual({});
    expect(migrated!.deletedHabits).toEqual([]);
  });

  it("stamps nameUpdatedAt on adoption and activeSpeciesUpdatedAt on switching", () => {
    let state = adopted();

    expect(state.companion.pets.dog?.nameUpdatedAt).toBe(nowIso);
    expect(state.companion.activeSpeciesUpdatedAt).toBe(nowIso);

    state = adoptPet(state, "cat", "Mochi", today, "2026-07-04T11:00:00.000Z");

    expect(state.companion.pets.cat?.nameUpdatedAt).toBe("2026-07-04T11:00:00.000Z");
    expect(state.companion.activeSpeciesUpdatedAt).toBe("2026-07-04T11:00:00.000Z");
    // The dog's own name stamp is untouched by the cat's adoption.
    expect(state.companion.pets.dog?.nameUpdatedAt).toBe(nowIso);

    state = switchActivePet(state, "dog", "2026-07-04T12:00:00.000Z");

    expect(state.companion.activeSpecies).toBe("dog");
    expect(state.companion.activeSpeciesUpdatedAt).toBe("2026-07-04T12:00:00.000Z");

    // Adopting an already-adopted species is a switch and stamps accordingly.
    state = adoptPet(state, "cat", "ignored", today, "2026-07-04T13:00:00.000Z");

    expect(state.companion.activeSpeciesUpdatedAt).toBe("2026-07-04T13:00:00.000Z");
    expect(state.companion.pets.cat?.name).toBe("Mochi");
  });

  it("feeding appends a spend event and drops the derived balance by one", () => {
    let state = adopted();

    state = grantFoodForHabitCompletion(state, today, 1, 7);
    state = grantFoodForHabitCompletion(state, today, 2, 7);

    expect(deriveFoodBalance(state.companion)).toBe(2);

    state = feedActivePet(state, today, "evt-1");

    expect(state.companion.foodSpentEvents[today]).toEqual(["evt-1"]);
    expect(deriveFoodBalance(state.companion)).toBe(1);
    expect(state.companion.food).toBe(1);
  });

  it("dedupes a replayed feed event: same uuid twice counts once", () => {
    let state = adopted();

    state = grantFoodForHabitCompletion(state, today, 1, 7);
    state = grantFoodForHabitCompletion(state, today, 2, 7);
    state = feedActivePet(state, today, "evt-retry");

    const bondAfterFirst = state.companion.pets.dog!.bond;
    const replayed = feedActivePet(state, today, "evt-retry");

    expect(replayed).toBe(state);
    expect(replayed.companion.foodSpentEvents[today]).toEqual(["evt-retry"]);
    expect(replayed.companion.pets.dog?.bond).toBe(bondAfterFirst);
    expect(deriveFoodBalance(replayed.companion)).toBe(1);

    // A different event id is a genuine second feed.
    const second = feedActivePet(state, today, "evt-2");

    expect(second.companion.foodSpentEvents[today]).toEqual(["evt-retry", "evt-2"]);
    expect(deriveFoodBalance(second.companion)).toBe(0);
  });

  it("opening the comeback gift writes the gifts ledger idempotently", () => {
    let state = adopted();

    state = checkComebackGift(state, today);
    state = checkComebackGift(state, "2026-07-10");
    state = openGift(state, "2026-07-10");

    expect(state.companion.foodGiftsReceived).toEqual({ "2026-07-10:comeback": 3 });
    expect(state.companion.food).toBe(3);
    expect(deriveFoodBalance(state.companion)).toBe(3);
    expect(openGift(state, "2026-07-10")).toBe(state);
  });

  it("pruning old ledger days into carryover never changes the derived balance", () => {
    const base = adopted();
    const state: DashboardState = {
      ...base,
      companion: {
        ...base.companion,
        foodCarryover: 1,
        foodGrantedByDate: { "2026-05-01": 4, "2026-05-20": 2, "2026-07-01": 3 },
        foodGiftsReceived: { "2026-05-01:visit-9": 1 },
        foodSpentEvents: { "2026-05-01": ["a", "b"], "2026-07-01": ["c"] },
        giftOverflowBondByDate: { "2026-05-01": 2, "2026-07-01": 1 }
      }
    };
    const before = deriveFoodBalance(state.companion);

    expect(before).toBe(8); // 1 + (4+2+3) + 1 − (2+1)

    const pruned = pruneFoodLedgers(state, today);

    expect(deriveFoodBalance(pruned.companion)).toBe(before);
    expect(pruned.companion.food).toBe(before);

    // Expired days are folded away; recent days survive untouched.
    expect(pruned.companion.foodCarryover).toBe(6); // 1 + (4+1−2) + 2
    expect(pruned.companion.foodGrantedByDate).toEqual({ "2026-07-01": 3 });
    expect(pruned.companion.foodGiftsReceived).toEqual({});
    expect(pruned.companion.foodSpentEvents).toEqual({ "2026-07-01": ["c"] });
    expect(pruned.companion.giftOverflowBondByDate).toEqual({ "2026-07-01": 1 });

    // Nothing to prune -> same state reference (no useless re-renders).
    expect(pruneFoodLedgers(pruned, today)).toBe(pruned);
  });

  it("keeps the migrated balance intact through granting, feeding, and pruning", () => {
    const migrated = migrateDashboardState(legacyPayload(), today)!;
    let state = grantFoodForHabitCompletion(migrated, today, 1, 7);

    expect(state.companion.food).toBe(6); // 5 migrated + 1 fresh grant

    state = feedActivePet(state, today, "evt-after-migration");

    expect(state.companion.food).toBe(5);

    // 40 days later, everything old folds into carryover without moving the balance.
    const later = pruneFoodLedgers(state, "2026-08-13");

    expect(deriveFoodBalance(later.companion)).toBe(5);
    expect(later.companion.foodGrantedByDate).toEqual({});
    expect(later.companion.foodSpentEvents).toEqual({});
    expect(later.companion.foodCarryover).toBe(5);
  });
});

describe("habit detail", () => {
  function bareState(): DashboardState {
    const state = createInitialDashboardState(today);

    // Wipe seed history so every completion below is explicit.
    return { ...state, records: {} };
  }

  it("counts a per-habit streak without breaking on an unticked today", () => {
    let state = bareState();

    state = toggleHabitForDate(state, "2026-07-02", "wake_up");
    state = toggleHabitForDate(state, "2026-07-03", "wake_up");

    // Today (07-04) not ticked yet: the streak holds at 2, never drops to 0.
    expect(calculateHabitStreak(state, "wake_up", today)).toBe(2);

    state = toggleHabitForDate(state, today, "wake_up");
    expect(calculateHabitStreak(state, "wake_up", today)).toBe(3);

    // A gap on a PAST day does end the run.
    expect(calculateHabitStreak(state, "english", today)).toBe(0);
  });

  it("builds a Monday-aligned five-week heatmap with rates and totals", () => {
    let state = bareState();

    state = toggleHabitForDate(state, today, "wake_up");
    state = toggleHabitForDate(state, "2026-07-03", "wake_up");

    const detail = buildHabitDetail(state, "wake_up", today)!;

    expect(detail.habit.id).toBe("wake_up");
    expect(detail.completedToday).toBe(true);
    expect(detail.streak).toBe(2);
    expect(detail.weeks).toHaveLength(5);
    expect(detail.weeks.every((week) => week.length === 7)).toBe(true);
    // 2026-07-04 is a Saturday; the last row starts on Monday 2026-06-29.
    expect(detail.weeks[4][0].date).toBe("2026-06-29");
    expect(detail.weeks[4][5].date).toBe(today);
    expect(detail.weeks[4][5].isToday).toBe(true);
    expect(detail.weeks[4][5].done).toBe(true);
    expect(detail.weeks[4][6].isFuture).toBe(true);
    expect(detail.totalCompletions).toBe(2);
    expect(detail.rate7).toBeCloseTo(2 / 7);
    expect(detail.rate30).toBeCloseTo(2 / 30);
  });

  it("returns null for an unknown habit id", () => {
    expect(buildHabitDetail(bareState(), "ghost", today)).toBeNull();
  });

  it("renames and re-categorizes a habit without touching records or key", () => {
    const state = createInitialDashboardState(today);
    const next = updateHabitInState(state, "coding", {
      name: "Dự án BetterMe",
      category: "Learning"
    });

    const updated = next.habits.find((habit) => habit.id === "coding")!;

    expect(updated.name).toBe("Dự án BetterMe");
    expect(updated.category).toBe("Learning");
    expect(updated.key).toBe("coding");
    expect(next.records).toBe(state.records);
  });

  it("ignores empty names, unknown ids, and no-op edits", () => {
    const state = createInitialDashboardState(today);

    expect(updateHabitInState(state, "coding", { name: "   ", category: "Work" })).toBe(state);
    expect(updateHabitInState(state, "ghost", { name: "X", category: "Work" })).toBe(state);
    expect(
      updateHabitInState(state, "coding", { name: "Code / làm dự án", category: "Work" })
    ).toBe(state);
  });

  it("exposes streak and week dots on every habit view", () => {
    const viewModel = buildDashboardViewModel(createInitialDashboardState(today), today);
    const habit = viewModel.habits[0];

    expect(habit.weekDots).toHaveLength(7);
    expect(habit.weekDots[6].date).toBe(today);
    expect(habit.weekDots[6].isToday).toBe(true);
    expect(typeof habit.streak).toBe("number");
  });
});

describe("habit model v3", () => {
  it("gives every seeded habit a full v3 definition", () => {
    const state = createInitialDashboardState("2026-07-27");

    for (const habit of state.habits) {
      expect(habit.trackingType).toBe("check");
      expect(habit.target).toBe(1);
      expect(habit.repeatDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(habit.timesOfDay).toEqual(["anytime"]);
      expect(habit.icon.length).toBeGreaterThan(0);
    }
  });

  it("keeps the derived completions cache in step with the entries", () => {
    const state = createInitialDashboardState("2026-07-27");
    const tracking = trackingIndex(state.habits);

    for (const record of Object.values(state.records)) {
      for (const habit of state.habits) {
        const entry = record.entries[habit.id];
        const cached = record.completions[habit.id] === true;

        expect(cached, `${record.date}/${habit.id}`).toBe(
          isEntryComplete(tracking.get(habit.id)!, entry)
        );
      }
    }
  });

  it("migrates a v2 state — booleans become entries, habits gain v3 fields", () => {
    const migrated = migrateDashboardState(
      {
        habits: [
          {
            id: "wake_up",
            key: "wake_up",
            name: "Dậy đúng giờ",
            category: "Discipline",
            maxScore: 1,
            description: "",
            iconName: "AlarmClock"
          }
        ],
        records: {
          "2026-07-26": { date: "2026-07-26", completions: { wake_up: true } },
          "2026-07-25": { date: "2026-07-25", completions: { wake_up: false } }
        }
      },
      "2026-07-27"
    );

    expect(migrated).not.toBeNull();
    expect(migrated!.habits[0].trackingType).toBe("check");
    expect(migrated!.habits[0].icon).toBe("⏰");
    expect(migrated!.records["2026-07-26"].entries.wake_up).toEqual({ value: 1 });
    expect(migrated!.records["2026-07-26"].completions.wake_up).toBe(true);
    expect(migrated!.records["2026-07-25"].completions.wake_up).toBe(false);
  });

  it("migrating an already-v3 state changes nothing", () => {
    const once = migrateDashboardState(createInitialDashboardState("2026-07-27"), "2026-07-27");
    const twice = migrateDashboardState(once, "2026-07-27");

    expect(twice).toEqual(once);
  });

  it("drops entries whose habit was deleted", () => {
    const state = createInitialDashboardState("2026-07-27");
    const pruned = removeHabitFromState(state, "wake_up", "2026-07-27T08:00:00.000Z");

    for (const record of Object.values(pruned.records)) {
      expect(record.entries.wake_up).toBeUndefined();
      expect(record.completions.wake_up).toBeUndefined();
    }
  });
});

describe("setHabitEntry", () => {
  function stateWithCountHabit() {
    const base = createInitialDashboardState("2026-07-27");

    return {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up"
          ? { ...habit, trackingType: "count" as const, target: 8, unit: "ly" }
          : habit
      )
    };
  }

  it("writes the entry and the derived cache together", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 6);
    const record = next.records["2026-07-27"];

    expect(record.entries.wake_up.value).toBe(6);
    expect(record.completions.wake_up).toBe(false);
  });

  it("flips the cache the moment the target is met", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8);

    expect(next.records["2026-07-27"].completions.wake_up).toBe(true);
  });

  it("stamps the completion clock only when the cell becomes complete", () => {
    const partial = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 6, "20:15");
    const complete = setHabitEntry(partial, "2026-07-27", "wake_up", 8, "21:30");

    expect(partial.records["2026-07-27"].entries.wake_up.completedAt).toBeUndefined();
    expect(complete.records["2026-07-27"].entries.wake_up.completedAt).toBe("21:30");
  });

  it("keeps the first completion clock when a done cell grows further", () => {
    const done = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8, "21:30");
    const more = setHabitEntry(done, "2026-07-27", "wake_up", 10, "22:45");

    expect(more.records["2026-07-27"].entries.wake_up.completedAt).toBe("21:30");
  });

  it("clears the clock when the cell drops back below its target", () => {
    const done = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8, "21:30");
    const undone = setHabitEntry(done, "2026-07-27", "wake_up", 3, "22:00");

    expect(undone.records["2026-07-27"].entries.wake_up.completedAt).toBeUndefined();
    expect(undone.records["2026-07-27"].completions.wake_up).toBe(false);
  });

  it("never stores a negative value", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", -5);

    expect(next.records["2026-07-27"].entries.wake_up.value).toBe(0);
  });

  it("returns the same state for an unknown habit", () => {
    const state = stateWithCountHabit();

    expect(setHabitEntry(state, "2026-07-27", "ghost", 1)).toBe(state);
  });

  it("creates the day when it does not exist yet", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-08-09", "wake_up", 8);

    expect(next.records["2026-08-09"].completions.wake_up).toBe(true);
  });
});

describe("toggleHabitForDate on v3", () => {
  it("still flips a check habit both ways", () => {
    const state = createInitialDashboardState("2026-07-27");
    const on = setHabitEntry(state, "2026-07-27", "clean", 1);
    const off = toggleHabitForDate(on, "2026-07-27", "clean");

    expect(on.records["2026-07-27"].completions.clean).toBe(true);
    expect(off.records["2026-07-27"].completions.clean).toBe(false);
    expect(off.records["2026-07-27"].entries.clean.value).toBe(0);
  });

  it("untick empties a count habit rather than stepping it down by one", () => {
    const base = createInitialDashboardState("2026-07-27");
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, trackingType: "count" as const, target: 8 } : habit
      )
    };
    const done = setHabitEntry(state, "2026-07-27", "wake_up", 8);
    const off = toggleHabitForDate(done, "2026-07-27", "wake_up");

    expect(off.records["2026-07-27"].entries.wake_up.value).toBe(0);
  });

  it("tick fills a count habit straight to its target", () => {
    const base = createInitialDashboardState("2026-07-27");
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "clean" ? { ...habit, trackingType: "count" as const, target: 8 } : habit
      )
    };
    const emptied = setHabitEntry(state, "2026-07-27", "clean", 0);
    const on = toggleHabitForDate(emptied, "2026-07-27", "clean");

    expect(on.records["2026-07-27"].entries.clean.value).toBe(8);
    expect(on.records["2026-07-27"].completions.clean).toBe(true);
  });
});

describe("countCompletedOn", () => {
  it("counts the cells that meet their own target", () => {
    const base = createInitialDashboardState("2026-07-27");
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, trackingType: "count" as const, target: 8 } : habit
      )
    };
    const partial = setHabitEntry(state, "2026-07-27", "wake_up", 6);
    const full = setHabitEntry(state, "2026-07-27", "wake_up", 8);

    expect(countCompletedOn(full, "2026-07-27") - countCompletedOn(partial, "2026-07-27")).toBe(1);
  });
});

describe("calculateHabitStreak with a repeat schedule", () => {
  /** A state where `wake_up` runs only on the given ISO weekdays. */
  function scheduled(repeatDays: number[], doneDates: string[], today: string) {
    const base = createInitialDashboardState(today);
    const habits = base.habits.map((habit) =>
      habit.id === "wake_up" ? { ...habit, repeatDays } : habit
    );
    const records: typeof base.records = {};

    // Drive every cell from the test rather than the seed history.
    for (const [date, record] of Object.entries(base.records)) {
      records[date] = {
        date,
        entries: { ...record.entries, wake_up: { value: doneDates.includes(date) ? 1 : 0 } },
        completions: { ...record.completions, wake_up: doneDates.includes(date) }
      };
    }

    return { ...base, habits, records };
  }

  it("skips the days the habit is not scheduled for", () => {
    // 2026-07-27 Mon … 2026-08-02 Sun. Habit runs Mon/Wed/Fri only.
    const state = scheduled([1, 3, 5], ["2026-07-27", "2026-07-29", "2026-07-31"], "2026-07-31");

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(3);
  });

  it("a missed scheduled day starts a new rhythm", () => {
    const state = scheduled([1, 3, 5], ["2026-07-27", "2026-07-31"], "2026-07-31");

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(1);
  });

  it("today still counts as an open chance, never a break", () => {
    const state = scheduled([1, 3, 5], ["2026-07-27", "2026-07-29"], "2026-07-31");

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(2);
  });

  it("a paused habit freezes its streak instead of losing it", () => {
    const base = scheduled(
      [1, 2, 3, 4, 5, 6, 7],
      ["2026-07-25", "2026-07-26", "2026-07-27"],
      "2026-07-31"
    );
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, pausedAt: "2026-07-28" } : habit
      )
    };

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(3);
  });
});
