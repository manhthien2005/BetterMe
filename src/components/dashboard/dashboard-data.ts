import { DEFAULT_HABITS, habitIcon } from "@/lib/defaults";
import {
  addDaysIso,
  getMonthGrid,
  parseIsoDate,
  todayIso
} from "@/lib/date";
import { clamp } from "@/lib/utils";

const TARGET_COMPLETION_RATE = 0.8;
const BEST_STREAK_FLOOR = 26;
const HISTORY_DAYS = 45;

// Companion economy — gentle by design: nothing ever decays or is taken away.
const FOOD_CAP = 21;
const BOND_PER_FEED = 2;
const BOND_PER_PETTING = 1;
const PETTING_CAP_PER_DAY = 3;
const ALL_DONE_BOND_BONUS = 5;
const GIFT_FOOD = 3;
const GIFT_BOND = 3;
const GIFT_ABSENCE_DAYS = 2;
const FOOD_LEDGER_RETENTION_DAYS = 30;
const PET_STAGE_THRESHOLDS = [
  { stage: "baby", minDays: 0 },
  { stage: "kid", minDays: 5 },
  { stage: "junior", minDays: 15 },
  { stage: "teen", minDays: 30 },
  { stage: "adult", minDays: 50 }
] as const;
const BOND_TIER_THRESHOLDS = [0, 60, 180, 420, 840] as const;

export type DashboardHabit = {
  id: string;
  key: string;
  name: string;
  category: string;
  maxScore: number;
  description: string;
  iconName: string;
};

export type DashboardDayRecord = {
  date: string;
  completions: Record<string, boolean>;
};

export type DashboardEvent = {
  id: string;
  title: string;
  time: string;
  category: "habit" | "planning" | "reflection" | "personal";
};

export type PetSpecies = "dog" | "cat";

export type PetStage = "baby" | "kid" | "junior" | "teen" | "adult";

export type BondTier = 1 | 2 | 3 | 4 | 5;

export type CompanionPetState = {
  species: PetSpecies;
  name: string;
  adoptedOn: string;
  growthDays: number;
  bond: number;
  lastGrowthDate: string | null;
  petsToday: number;
  petsTodayDate: string | null;
};

export type CompanionState = {
  pets: Partial<Record<PetSpecies, CompanionPetState>>;
  activeSpecies: PetSpecies | null;
  food: number;
  foodGrantedByDate: Record<string, number>;
  allDoneBonusDates: Record<string, boolean>;
  lastSeenDate: string | null;
  pendingGift: boolean;
};

export type DashboardState = {
  habits: DashboardHabit[];
  records: Record<string, DashboardDayRecord>;
  events: DashboardEvent[];
  bestStreakFloor: number;
  companion: CompanionState;
};

export type DashboardStatus = "Good" | "Okay" | "Bad" | "Planned" | "No data";

export type DashboardHabitView = DashboardHabit & {
  completed: boolean;
};

export type DashboardCalendarDay = {
  date: string;
  day: number;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  status: DashboardStatus;
  fillRatio: number;
  completedHabits: number;
  totalHabits: number;
};

export type DashboardViewModel = {
  date: {
    iso: string;
    longLabel: string;
    monthLabel: string;
  };
  greeting: string;
  motivation: string;
  habits: DashboardHabitView[];
  today: {
    completedHabits: number;
    totalHabits: number;
    totalScore: number;
    maxScore: number;
    completionRate: number;
    status: DashboardStatus;
  };
  streak: {
    current: number;
    best: number;
    rhythm: number;
    chain: Array<{
      date: string;
      label: string;
      completed: boolean;
      status: DashboardStatus;
    }>;
    protectionMessage: string;
  };
  calendar: {
    monthCompletionRate: number;
    days: DashboardCalendarDay[];
  };
  analytics: {
    averageCompletionRate: number;
    changeFromPreviousPeriod: number;
    goodDays: number;
    totalCompletedHabits: number;
    mostConsistentHabitName: string | null;
    habitNeedingAttentionName: string | null;
    trend: Array<{
      date: string;
      label: string;
      completionRate: number;
      status: DashboardStatus;
    }>;
    habitPerformance: Array<{
      habitId: string;
      habitName: string;
      completionRate: number;
    }>;
  };
  events: DashboardEvent[];
  companion: CompanionViewModel;
};

export type CompanionPetView = {
  species: PetSpecies;
  name: string;
  stage: PetStage;
  bondTier: BondTier;
  bond: number;
  bondTierLabel: string;
  bondProgress: number;
  growthDays: number;
  daysToNextStage: number | null;
  isActive: boolean;
  canPetToday: boolean;
};

export type CompanionViewModel = {
  activePet: CompanionPetView | null;
  pets: CompanionPetView[];
  adoptedSpecies: PetSpecies[];
  food: number;
  foodCap: number;
  pendingGift: boolean;
};

export function getDashboardToday() {
  return todayIso();
}

export function createInitialDashboardState(today = getDashboardToday()): DashboardState {
  const habits = DEFAULT_HABITS.map((item) => ({
    id: item.key,
    key: item.key,
    name: item.name,
    category: item.category,
    maxScore: item.maxScore,
    description: item.description,
    iconName: habitIcon(item.key, item.category)
  }));
  const records: Record<string, DashboardDayRecord> = {};

  for (let offset = HISTORY_DAYS; offset >= 0; offset -= 1) {
    const date = addDaysIso(today, -offset);
    const completions: Record<string, boolean> = {};

    habits.forEach((habit, index) => {
      completions[habit.id] = isSeedHabitComplete(habit.key, index, offset);
    });

    records[date] = {
      date,
      completions
    };
  }

  return {
    habits,
    records,
    events: createSeedEvents(),
    bestStreakFloor: BEST_STREAK_FLOOR,
    companion: createInitialCompanionState()
  };
}

export function addHabitToState(
  state: DashboardState,
  input: { name: string; category: string }
): DashboardState {
  const name = input.name.trim();

  if (!name) return state;

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const existingIds = new Set(state.habits.map((habit) => habit.id));
  let id = `custom_${slug || "habit"}`;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `custom_${slug || "habit"}_${suffix}`;
    suffix += 1;
  }

  const habit: DashboardHabit = {
    id,
    key: id,
    name,
    category: input.category,
    maxScore: 1,
    description: "",
    iconName: habitIcon(id, input.category)
  };

  return {
    ...state,
    habits: [...state.habits, habit]
  };
}

export function removeHabitFromState(state: DashboardState, habitId: string): DashboardState {
  if (!state.habits.some((habit) => habit.id === habitId)) return state;

  return {
    ...state,
    habits: state.habits.filter((habit) => habit.id !== habitId)
  };
}

export function createInitialCompanionState(): CompanionState {
  return {
    pets: {},
    activeSpecies: null,
    food: 0,
    foodGrantedByDate: {},
    allDoneBonusDates: {},
    lastSeenDate: null,
    pendingGift: false
  };
}

/**
 * Upgrades a persisted v1 payload (no companion) to the v2 shape.
 * Nothing is dropped: habits, records, and events pass through untouched.
 */
export function migrateDashboardState(raw: unknown): DashboardState | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw as Partial<DashboardState>;

  if (!Array.isArray(candidate.habits) || typeof candidate.records !== "object") {
    return null;
  }

  return {
    habits: candidate.habits,
    records: candidate.records ?? {},
    events: Array.isArray(candidate.events) ? candidate.events : [],
    bestStreakFloor:
      typeof candidate.bestStreakFloor === "number"
        ? candidate.bestStreakFloor
        : BEST_STREAK_FLOOR,
    companion: normalizeCompanion(candidate.companion)
  };
}

function normalizeCompanion(companion: CompanionState | undefined): CompanionState {
  if (!companion || typeof companion !== "object") {
    return createInitialCompanionState();
  }

  const base = createInitialCompanionState();

  return {
    ...base,
    ...companion,
    pets: companion.pets ?? {},
    food: clamp(companion.food ?? 0, 0, FOOD_CAP),
    foodGrantedByDate: companion.foodGrantedByDate ?? {},
    allDoneBonusDates: companion.allDoneBonusDates ?? {}
  };
}

const DEFAULT_PET_NAMES: Record<PetSpecies, string> = {
  dog: "Xoài",
  cat: "Mochi"
};

export function adoptPet(
  state: DashboardState,
  species: PetSpecies,
  name: string,
  today = getDashboardToday()
): DashboardState {
  if (state.companion.pets[species]) {
    return switchActivePet(state, species);
  }

  const trimmed = name.trim().slice(0, 20);
  const pet: CompanionPetState = {
    species,
    name: trimmed || DEFAULT_PET_NAMES[species],
    adoptedOn: today,
    growthDays: 0,
    bond: 0,
    lastGrowthDate: null,
    petsToday: 0,
    petsTodayDate: null
  };

  return {
    ...state,
    companion: {
      ...state.companion,
      pets: { ...state.companion.pets, [species]: pet },
      activeSpecies: species
    }
  };
}

export function switchActivePet(state: DashboardState, species: PetSpecies): DashboardState {
  if (!state.companion.pets[species] || state.companion.activeSpecies === species) {
    return state;
  }

  return {
    ...state,
    companion: { ...state.companion, activeSpecies: species }
  };
}

/**
 * One treat per habit completed today, plus one bonus treat on a 100% day.
 * The per-day ledger means un-ticking and re-ticking never farms extra food.
 */
export function grantFoodForHabitCompletion(
  state: DashboardState,
  today: string,
  completedCountAfter: number,
  totalCount: number
): DashboardState {
  const companion = state.companion;
  const grantedToday = companion.foodGrantedByDate[today] ?? 0;
  const dailyCap = totalCount + 1;
  const isAllDone = totalCount > 0 && completedCountAfter >= totalCount;
  const wanted = isAllDone ? 2 : 1;
  const allowed = Math.min(wanted, Math.max(0, dailyCap - grantedToday));

  if (allowed <= 0) return state;

  return {
    ...state,
    companion: {
      ...companion,
      food: clamp(companion.food + allowed, 0, FOOD_CAP),
      foodGrantedByDate: pruneDateLedger(
        { ...companion.foodGrantedByDate, [today]: grantedToday + allowed },
        today
      )
    }
  };
}

export function feedActivePet(state: DashboardState, today = getDashboardToday()): DashboardState {
  const species = state.companion.activeSpecies;
  const pet = species ? state.companion.pets[species] : undefined;

  if (!species || !pet || state.companion.food <= 0) return state;

  const grown = withGrowthDay(pet, today);

  return {
    ...state,
    companion: {
      ...state.companion,
      food: state.companion.food - 1,
      pets: {
        ...state.companion.pets,
        [species]: { ...grown, bond: grown.bond + BOND_PER_FEED }
      }
    }
  };
}

export function petActivePet(state: DashboardState, today = getDashboardToday()): DashboardState {
  const species = state.companion.activeSpecies;
  const pet = species ? state.companion.pets[species] : undefined;

  if (!species || !pet) return state;

  const petsToday = pet.petsTodayDate === today ? pet.petsToday : 0;

  if (petsToday >= PETTING_CAP_PER_DAY) return state;

  return {
    ...state,
    companion: {
      ...state.companion,
      pets: {
        ...state.companion.pets,
        [species]: {
          ...pet,
          bond: pet.bond + BOND_PER_PETTING,
          petsToday: petsToday + 1,
          petsTodayDate: today
        }
      }
    }
  };
}

/** A day with any progress counts as one growth day for the active pet. */
export function recordGrowthDay(state: DashboardState, today = getDashboardToday()): DashboardState {
  const species = state.companion.activeSpecies;
  const pet = species ? state.companion.pets[species] : undefined;

  if (!species || !pet || pet.lastGrowthDate === today) return state;

  return {
    ...state,
    companion: {
      ...state.companion,
      pets: { ...state.companion.pets, [species]: withGrowthDay(pet, today) }
    }
  };
}

export function grantAllDoneBonus(state: DashboardState, today = getDashboardToday()): DashboardState {
  const species = state.companion.activeSpecies;
  const pet = species ? state.companion.pets[species] : undefined;

  if (!species || !pet || state.companion.allDoneBonusDates[today]) return state;

  return {
    ...state,
    companion: {
      ...state.companion,
      allDoneBonusDates: pruneDateLedger(
        { ...state.companion.allDoneBonusDates, [today]: true },
        today
      ),
      pets: {
        ...state.companion.pets,
        [species]: { ...pet, bond: pet.bond + ALL_DONE_BOND_BONUS }
      }
    }
  };
}

/**
 * Coming back after days away means the pet saved a present — never a guilt trip.
 */
export function checkComebackGift(state: DashboardState, today = getDashboardToday()): DashboardState {
  const companion = state.companion;
  const hasPet = companion.activeSpecies !== null;
  const lastSeen = companion.lastSeenDate;
  const awayLongEnough =
    hasPet && lastSeen !== null && today > addDaysIso(lastSeen, GIFT_ABSENCE_DAYS - 1);

  if (lastSeen === today && !awayLongEnough) return state;

  return {
    ...state,
    companion: {
      ...companion,
      lastSeenDate: today,
      pendingGift: companion.pendingGift || awayLongEnough
    }
  };
}

export function openGift(state: DashboardState): DashboardState {
  const companion = state.companion;
  const species = companion.activeSpecies;
  const pet = species ? companion.pets[species] : undefined;

  if (!companion.pendingGift || !species || !pet) return state;

  return {
    ...state,
    companion: {
      ...companion,
      pendingGift: false,
      food: clamp(companion.food + GIFT_FOOD, 0, FOOD_CAP),
      pets: {
        ...companion.pets,
        [species]: { ...pet, bond: pet.bond + GIFT_BOND }
      }
    }
  };
}

export function getPetStage(growthDays: number): PetStage {
  let stage: PetStage = "baby";

  for (const threshold of PET_STAGE_THRESHOLDS) {
    if (growthDays >= threshold.minDays) stage = threshold.stage;
  }

  return stage;
}

export function getBondTier(bond: number): BondTier {
  let tier: BondTier = 1;

  BOND_TIER_THRESHOLDS.forEach((threshold, index) => {
    if (bond >= threshold) tier = (index + 1) as BondTier;
  });

  return tier;
}

const BOND_TIER_LABELS: Record<BondTier, string> = {
  1: "Lạ lẫm",
  2: "Quen mặt",
  3: "Bạn thân",
  4: "Tri kỷ",
  5: "Gia đình"
};

function withGrowthDay(pet: CompanionPetState, today: string): CompanionPetState {
  if (pet.lastGrowthDate === today) return pet;

  return { ...pet, growthDays: pet.growthDays + 1, lastGrowthDate: today };
}

function pruneDateLedger<T>(ledger: Record<string, T>, today: string): Record<string, T> {
  const cutoff = addDaysIso(today, -FOOD_LEDGER_RETENTION_DAYS);
  const pruned: Record<string, T> = {};

  Object.keys(ledger).forEach((date) => {
    if (date >= cutoff) pruned[date] = ledger[date];
  });

  return pruned;
}

function buildCompanionViewModel(state: DashboardState, today: string): CompanionViewModel {
  const companion = state.companion;
  const pets = (Object.values(companion.pets) as CompanionPetState[]).map((pet) =>
    buildPetView(pet, companion.activeSpecies, today)
  );

  return {
    activePet: pets.find((pet) => pet.isActive) ?? null,
    pets,
    adoptedSpecies: pets.map((pet) => pet.species),
    food: companion.food,
    foodCap: FOOD_CAP,
    pendingGift: companion.pendingGift
  };
}

function buildPetView(
  pet: CompanionPetState,
  activeSpecies: PetSpecies | null,
  today: string
): CompanionPetView {
  const stage = getPetStage(pet.growthDays);
  const bondTier = getBondTier(pet.bond);
  const tierBounds: readonly number[] = BOND_TIER_THRESHOLDS;
  const tierStart = tierBounds[bondTier - 1];
  const tierEnd = bondTier < 5 ? tierBounds[bondTier] : null;
  const nextStage = PET_STAGE_THRESHOLDS.find((item) => item.minDays > pet.growthDays);
  const petsToday = pet.petsTodayDate === today ? pet.petsToday : 0;

  return {
    species: pet.species,
    name: pet.name,
    stage,
    bondTier,
    bond: pet.bond,
    bondTierLabel: BOND_TIER_LABELS[bondTier],
    bondProgress: tierEnd
      ? clamp((pet.bond - tierStart) / (tierEnd - tierStart), 0, 1)
      : 1,
    growthDays: pet.growthDays,
    daysToNextStage: nextStage ? nextStage.minDays - pet.growthDays : null,
    isActive: pet.species === activeSpecies,
    canPetToday: petsToday < PETTING_CAP_PER_DAY
  };
}

export function toggleHabitForDate(
  state: DashboardState,
  date: string,
  habitId: string
): DashboardState {
  const currentRecord = state.records[date] ?? {
    date,
    completions: Object.fromEntries(state.habits.map((habit) => [habit.id, false]))
  };

  return {
    ...state,
    records: {
      ...state.records,
      [date]: {
        date,
        completions: {
          ...currentRecord.completions,
          [habitId]: !currentRecord.completions[habitId]
        }
      }
    }
  };
}

export function buildDashboardViewModel(
  state: DashboardState,
  today = getDashboardToday()
): DashboardViewModel {
  const todayScore = scoreDate(state, today);
  const month = parseIsoDate(today).getMonth();
  const currentStreak = calculateCurrentStreak(state, today);
  const bestStreak = Math.max(state.bestStreakFloor, calculateBestStreak(state));
  const rhythm = calculateRollingRhythm(state, today);
  const analytics = buildAnalytics(state, today);
  const monthDays = getMonthGrid(today).map((date) => {
    const score = scoreDate(state, date);

    return {
      date,
      day: parseIsoDate(date).getDate(),
      label: formatEnglishCalendarDate(date),
      inCurrentMonth: parseIsoDate(date).getMonth() === month,
      isToday: date === today,
      status: score.status,
      fillRatio: score.completionRate,
      completedHabits: score.completedHabits,
      totalHabits: score.totalHabits
    };
  });
  const monthScores = monthDays
    .filter((day) => day.inCurrentMonth && state.records[day.date])
    .map((day) => day.fillRatio);
  const habitViews = state.habits.map((habit) => ({
    ...habit,
    completed: state.records[today]?.completions[habit.id] === true
  }));

  return {
    date: {
      iso: today,
      longLabel: formatEnglishLongDate(today),
      monthLabel: formatEnglishMonthLabel(today)
    },
    greeting: buildGreeting(),
    motivation: buildMotivation(todayScore, rhythm),
    habits: habitViews,
    today: todayScore,
    streak: {
      current: currentStreak,
      best: bestStreak,
      rhythm,
      chain: buildStreakChain(state, today),
      protectionMessage: buildProtectionMessage(todayScore.completionRate, rhythm)
    },
    calendar: {
      monthCompletionRate: average(monthScores),
      days: monthDays
    },
    analytics,
    events: state.events,
    companion: buildCompanionViewModel(state, today)
  };
}

function isSeedHabitComplete(key: string, index: number, offsetFromToday: number) {
  if (offsetFromToday <= 11) {
    return key !== "clean" || offsetFromToday % 3 !== 0;
  }

  if (offsetFromToday === 12) {
    return index < 2;
  }

  return (offsetFromToday + index) % 4 !== 0;
}

function createSeedEvents(): DashboardEvent[] {
  return [
    {
      id: "event-weekly-review",
      title: "Weekly review",
      time: "Tonight, 20:30",
      category: "reflection"
    },
    {
      id: "event-english-focus",
      title: "English speaking block",
      time: "Tomorrow, 07:45",
      category: "habit"
    },
    {
      id: "event-project-sprint",
      title: "Project deep work",
      time: "Tomorrow, 21:00",
      category: "planning"
    },
    {
      id: "event-reset",
      title: "Desk reset",
      time: "Monday, 19:15",
      category: "personal"
    }
  ];
}

function scoreDate(state: DashboardState, date: string) {
  const record = state.records[date];
  const maxScore = state.habits.reduce((sum, habit) => sum + habit.maxScore, 0);
  const totalScore = state.habits.reduce((sum, habit) => {
    return sum + (record?.completions[habit.id] ? habit.maxScore : 0);
  }, 0);
  const completedHabits = state.habits.filter(
    (habit) => record?.completions[habit.id] === true
  ).length;
  const completionRate = maxScore > 0 ? clamp(totalScore / maxScore, 0, 1) : 0;

  return {
    completedHabits,
    totalHabits: state.habits.length,
    totalScore,
    maxScore,
    completionRate,
    status: getStatus(record, completionRate)
  };
}

function getStatus(record: DashboardDayRecord | undefined, completionRate: number): DashboardStatus {
  if (!record) return "No data";
  if (completionRate >= TARGET_COMPLETION_RATE) return "Good";
  if (completionRate >= 0.5) return "Okay";
  return "Bad";
}

function calculateCurrentStreak(state: DashboardState, today: string) {
  let streak = 0;

  for (let date = today; state.records[date]; date = addDaysIso(date, -1)) {
    if (scoreDate(state, date).status !== "Good") break;
    streak += 1;
  }

  return streak;
}

function calculateBestStreak(state: DashboardState) {
  let best = 0;
  let current = 0;

  Object.keys(state.records)
    .sort()
    .forEach((date) => {
      if (scoreDate(state, date).status === "Good") {
        current += 1;
        best = Math.max(best, current);
        return;
      }

      current = 0;
    });

  return best;
}

function buildStreakChain(state: DashboardState, today: string) {
  return Array.from({ length: 7 }, (_, index) => addDaysIso(today, index - 6)).map(
    (date) => {
      const score = scoreDate(state, date);

      return {
        date,
        label: formatEnglishDayNumber(date),
        completed: score.status === "Good",
        status: score.status
      };
    }
  );
}

function buildAnalytics(state: DashboardState, today: string) {
  const trendDates = Array.from({ length: 14 }, (_, index) => addDaysIso(today, index - 13));
  const previousDates = Array.from({ length: 14 }, (_, index) => addDaysIso(today, index - 27));
  const trendScores = trendDates.map((date) => scoreDate(state, date));
  const previousScores = previousDates.map((date) => scoreDate(state, date));
  const averageCompletionRate = average(trendScores.map((score) => score.completionRate));
  const previousAverage = average(previousScores.map((score) => score.completionRate));

  return {
    averageCompletionRate,
    changeFromPreviousPeriod: averageCompletionRate - previousAverage,
    goodDays: trendScores.filter((score) => score.status === "Good").length,
    totalCompletedHabits: trendScores.reduce(
      (sum, score) => sum + score.completedHabits,
      0
    ),
    mostConsistentHabitName: findHabitByRate(state, trendDates, "highest"),
    habitNeedingAttentionName: findHabitByRate(state, trendDates, "lowest"),
    trend: trendDates.map((date) => {
      const score = scoreDate(state, date);

      return {
        date,
        label: formatEnglishTrendLabel(date),
        completionRate: score.completionRate,
        status: score.status
      };
    }),
    habitPerformance: state.habits.map((habit) => {
      const completionRate = average(
        trendDates.map((date) => (state.records[date]?.completions[habit.id] ? 1 : 0))
      );

      return {
        habitId: habit.id,
        habitName: habit.name,
        completionRate
      };
    })
  };
}

function findHabitByRate(
  state: DashboardState,
  dates: string[],
  mode: "highest" | "lowest"
) {
  if (!state.habits.length) return null;

  const ranked = state.habits
    .map((habit) => ({
      habit,
      rate: average(dates.map((date) => (state.records[date]?.completions[habit.id] ? 1 : 0)))
    }))
    .sort((a, b) => (mode === "highest" ? b.rate - a.rate : a.rate - b.rate));

  return ranked[0]?.habit.name ?? null;
}

function buildGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatEnglishLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishMonthLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishCalendarDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishDayNumber(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishTrendLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseIsoDate(date));
}

function calculateRollingRhythm(state: DashboardState, today: string) {
  const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
    addDaysIso(today, index - 6)
  );

  return average(
    lastSevenDays.map((date) => scoreDate(state, date).completionRate)
  );
}

// Nếp speaks here: gentle roommate voice, never guilt. Misses are rest days,
// and progress is anchored to the rolling 7-day rhythm, not a fragile streak.
function buildMotivation(
  todayScore: { completedHabits: number; completionRate: number },
  rhythm: number
) {
  if (todayScore.completionRate >= 1) {
    return "GIỎI QUÁ, Thiên! All done — my flower bloomed 🌸";
  }

  if (todayScore.completionRate >= TARGET_COMPLETION_RATE) {
    return "So close to a perfect day. One tiny habit left?";
  }

  if (todayScore.completedHabits > 0) {
    return "We're on our way. Pick the easiest one next?";
  }

  if (rhythm >= 0.5) {
    return `Our 7-day rhythm is ${Math.round(rhythm * 100)}%. One tiny habit to wake me up? ☀️`;
  }

  return "Chào Thiên! I saved your spot — today we start soft 🌱";
}

function buildProtectionMessage(completionRate: number, rhythm: number) {
  if (completionRate >= TARGET_COMPLETION_RATE) {
    return "Today is safe and cozy — the sprout is watered";
  }

  if (completionRate > 0) {
    return "One more habit keeps our rhythm going";
  }

  if (rhythm >= 0.5) {
    return "Yesterday counts as rest. Today we start soft";
  }

  return "One tiny check-in is enough to begin again";
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}
