import { DEFAULT_HABITS, habitIcon } from "@/lib/defaults";
import {
  addDaysIso,
  getMonthGrid,
  minIsoDate,
  parseIsoDate,
  todayIso
} from "@/lib/date";
import { clamp } from "@/lib/utils";

const TARGET_COMPLETION_RATE = 0.8;
const BEST_STREAK_FLOOR = 26;
const HISTORY_DAYS = 45;

// Companion economy — gentle by design: nothing ever decays or is taken away.
export const FOOD_CAP = 21;
const BOND_PER_FEED = 2;
const BOND_PER_PETTING = 1;
const PETTING_CAP_PER_DAY = 3;
const ALL_DONE_BOND_BONUS = 5;
const GIFT_FOOD = 3;
const GIFT_BOND = 3;
const GIFT_ABSENCE_DAYS = 2;
/** Spec §4.2.1: friend gifts can push the host's bond at most +2/day total. */
export const GIFT_OVERFLOW_BOND_PER_DAY = 2;
export const FOOD_LEDGER_RETENTION_DAYS = 30;
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
  /** Thời điểm ISO local "YYYY-MM-DDTHH:mm" — người dùng tự tạo, không sync. */
  at: string;
  category: "habit" | "planning" | "reflection" | "personal";
};

const EVENT_CATEGORIES: ReadonlyArray<DashboardEvent["category"]> = [
  "habit",
  "planning",
  "reflection",
  "personal"
];

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
  /** Per-field LWW stamp for `name` (sync §2.1/2.4). null = epoch: always loses to a server-stamped value. */
  nameUpdatedAt: string | null;
};

export type CompanionState = {
  pets: Partial<Record<PetSpecies, CompanionPetState>>;
  activeSpecies: PetSpecies | null;
  /** Per-field LWW stamp for `activeSpecies` (sync §2.1/2.4). null = epoch: always loses to a server-stamped value. */
  activeSpeciesUpdatedAt: string | null;
  /**
   * Derived cache of `deriveFoodBalance` kept in sync by every ledger mutation.
   * The ledgers (carryover + granted + gifts − spent) are the source of truth;
   * never merge this field across devices — recompute it after merging ledgers.
   */
  food: number;
  foodGrantedByDate: Record<string, number>;
  /** Union-merge ledger keyed "date:visitId" (comeback gift uses "date:comeback"). */
  foodGiftsReceived: Record<string, number>;
  /** Append-only spend ledger: date -> unique event ids (one per feed). Deduped on append. */
  foodSpentEvents: Record<string, string[]>;
  /** Net balance of ledger days folded away by pruneFoodLedgers. 0..FOOD_CAP. */
  foodCarryover: number;
  /** date -> bond granted from gift overflow (Phase 2), capped per day. */
  giftOverflowBondByDate: Record<string, number>;
  allDoneBonusDates: Record<string, boolean>;
  lastSeenDate: string | null;
  pendingGift: boolean;
};

export type HabitTombstone = {
  key: string;
  deletedAt: string;
};

export type DashboardState = {
  habits: DashboardHabit[];
  records: Record<string, DashboardDayRecord>;
  events: DashboardEvent[];
  bestStreakFloor: number;
  /**
   * Provenance stamp (sync §2.5): records with date <= seedCutoverDate are seed
   * fiction and must never leave the device. Never inferred from record content.
   */
  seedCutoverDate: string;
  /** Habit tombstones (sync §2.4): a delete beats any state older than deletedAt. */
  deletedHabits: HabitTombstone[];
  companion: CompanionState;
};

export type DashboardStatus = "Good" | "Okay" | "Bad" | "Planned" | "No data";

// Status values are stable English keys (logic + tests compare them); the UI
// renders them through this map. "Bad" reads as a garden that needs watering —
// never blame (invariant 1).
export const STATUS_LABELS: Record<DashboardStatus, string> = {
  Good: "Tốt",
  Okay: "Tạm ổn",
  Bad: "Cần tưới thêm",
  Planned: "Dự định",
  "No data": "Chưa có dữ liệu"
};

// Category values are stable English keys (stored in state + DB, icon lookups);
// the UI shows these labels.
export const CATEGORY_LABELS: Record<string, string> = {
  Discipline: "Kỷ luật",
  Learning: "Học tập",
  Work: "Công việc",
  Health: "Sức khỏe",
  Reflection: "Suy ngẫm"
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export const EVENT_CATEGORY_LABELS: Record<DashboardEvent["category"], string> = {
  habit: "thói quen",
  planning: "kế hoạch",
  reflection: "suy ngẫm",
  personal: "cá nhân"
};

export type HabitWeekDot = {
  date: string;
  done: boolean;
  isToday: boolean;
};

export type DashboardHabitView = DashboardHabit & {
  completed: boolean;
  /** Chuỗi ngày liên tiếp đã hoàn thành (hôm nay chưa tick KHÔNG làm đứt chuỗi). */
  streak: number;
  /** 7 ngày gần nhất, cũ → mới, cho dải chấm trên dòng. */
  weekDots: HabitWeekDot[];
};

export type HabitHeatCell = {
  date: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type HabitDetail = {
  habit: DashboardHabit;
  completedToday: boolean;
  streak: number;
  rate7: number;
  rate30: number;
  totalCompletions: number;
  /** 5 hàng tuần × 7 cột T2→CN; tuần hiện tại là hàng cuối. */
  weeks: HabitHeatCell[][];
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
    // Sự kiện là dữ liệu thật của người dùng — không có seed fiction.
    events: [],
    bestStreakFloor: BEST_STREAK_FLOOR,
    seedCutoverDate: today,
    deletedHabits: [],
    companion: createInitialCompanionState()
  };
}

/** Chỉ giữ event hợp lệ theo shape mới ({at} ISO); seed cũ ({time} text) bị loại. */
function normalizeEvents(raw: unknown): DashboardEvent[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter((item): item is DashboardEvent => {
    if (item === null || typeof item !== "object") return false;

    const candidate = item as Partial<DashboardEvent>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(candidate.at) &&
      EVENT_CATEGORIES.includes(candidate.category as DashboardEvent["category"])
    );
  });
}

export function addEventToState(
  state: DashboardState,
  input: { title: string; at: string; category: DashboardEvent["category"] }
): DashboardState {
  const title = input.title.trim().slice(0, 80);

  if (!title || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input.at)) return state;

  const event: DashboardEvent = {
    id: `event_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    at: input.at.slice(0, 16),
    category: input.category
  };

  return { ...state, events: [...state.events, event] };
}

export function removeEventFromState(state: DashboardState, eventId: string): DashboardState {
  if (!state.events.some((event) => event.id === eventId)) return state;

  return { ...state, events: state.events.filter((event) => event.id !== eventId) };
}

const EVENT_DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

/** "Hôm nay · 20:30", "Ngày mai · 07:45", còn lại "T2 28/07 · 19:15". */
export function formatEventTime(at: string, today = getDashboardToday()): string {
  const date = at.slice(0, 10);
  const time = at.slice(11, 16);

  if (date === today) return `Hôm nay · ${time}`;
  if (date === addDaysIso(today, 1)) return `Ngày mai · ${time}`;

  const parsed = parseIsoDate(date);
  const dayLabel = EVENT_DAY_LABELS[parsed.getDay()];
  const dayMonth = `${String(parsed.getDate()).padStart(2, "0")}/${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}`;

  return `${dayLabel} ${dayMonth} · ${time}`;
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

export function removeHabitFromState(
  state: DashboardState,
  habitId: string,
  nowIso = new Date().toISOString()
): DashboardState {
  if (!state.habits.some((habit) => habit.id === habitId)) return state;

  // Prune the habit's completions everywhere: orphan completions must not
  // survive to be LWW-merged back after a sync (spec §2.4 tombstones).
  const records: Record<string, DashboardDayRecord> = {};

  Object.keys(state.records).forEach((date) => {
    const record = state.records[date];

    if (!(habitId in record.completions)) {
      records[date] = record;
      return;
    }

    const completions = { ...record.completions };

    delete completions[habitId];
    records[date] = { ...record, completions };
  });

  return {
    ...state,
    habits: state.habits.filter((habit) => habit.id !== habitId),
    records,
    deletedHabits: [...state.deletedHabits, { key: habitId, deletedAt: nowIso }]
  };
}

/**
 * Rewrites a habit's id/key everywhere it appears (habit list + every day's
 * completions). Used by the sync boundary to resolve slug collisions (spec §2.2):
 * the local habit is re-keyed with a suffix, never silently merged into a
 * different habit that happens to share the slug.
 */
export function rekeyHabit(state: DashboardState, oldKey: string, newKey: string): DashboardState {
  if (!newKey || oldKey === newKey) return state;
  if (!state.habits.some((habit) => habit.id === oldKey)) return state;
  if (state.habits.some((habit) => habit.id === newKey)) return state;

  const habits = state.habits.map((habit) =>
    habit.id === oldKey ? { ...habit, id: newKey, key: newKey } : habit
  );
  const records: Record<string, DashboardDayRecord> = {};

  Object.keys(state.records).forEach((date) => {
    const record = state.records[date];

    if (!(oldKey in record.completions)) {
      records[date] = record;
      return;
    }

    const completions = { ...record.completions };

    completions[newKey] = completions[oldKey];
    delete completions[oldKey];
    records[date] = { ...record, completions };
  });

  return { ...state, habits, records };
}

export function createInitialCompanionState(): CompanionState {
  return {
    pets: {},
    activeSpecies: null,
    activeSpeciesUpdatedAt: null,
    food: 0,
    foodGrantedByDate: {},
    foodGiftsReceived: {},
    foodSpentEvents: {},
    foodCarryover: 0,
    giftOverflowBondByDate: {},
    allDoneBonusDates: {},
    lastSeenDate: null,
    pendingGift: false
  };
}

/**
 * Upgrades any persisted payload (v1 without companion, or an older v2 shape)
 * to the current shape. Nothing is dropped: habits, records, and events pass
 * through untouched. `today` only feeds backfills (seedCutoverDate) — pass it
 * explicitly in tests; the default is the call-boundary clock.
 */
export function migrateDashboardState(
  raw: unknown,
  today = getDashboardToday()
): DashboardState | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw as Partial<DashboardState>;

  if (!Array.isArray(candidate.habits) || typeof candidate.records !== "object") {
    return null;
  }

  const companion = normalizeCompanion(candidate.companion);

  return {
    habits: candidate.habits,
    records: candidate.records ?? {},
    events: normalizeEvents(candidate.events),
    bestStreakFloor:
      typeof candidate.bestStreakFloor === "number"
        ? candidate.bestStreakFloor
        : BEST_STREAK_FLOOR,
    seedCutoverDate:
      typeof candidate.seedCutoverDate === "string"
        ? candidate.seedCutoverDate
        : backfillSeedCutoverDate(companion, today),
    deletedHabits: Array.isArray(candidate.deletedHabits) ? candidate.deletedHabits : [],
    companion
  };
}

/**
 * Older states predate the provenance stamp: the safest honest cutover is the
 * earliest real signal we have — the first pet adoption — never later than the
 * day the migration runs (spec §2.5).
 */
function backfillSeedCutoverDate(companion: CompanionState, today: string): string {
  const adoptedDates = (Object.values(companion.pets) as CompanionPetState[])
    .map((pet) => pet.adoptedOn)
    .filter((date) => typeof date === "string" && date.length > 0);

  return minIsoDate(...adoptedDates, today);
}

function normalizeCompanion(companion: CompanionState | undefined): CompanionState {
  if (!companion || typeof companion !== "object") {
    return createInitialCompanionState();
  }

  const base = createInitialCompanionState();
  const pets: Partial<Record<PetSpecies, CompanionPetState>> = {};

  (Object.values(companion.pets ?? {}) as CompanionPetState[]).forEach((pet) => {
    pets[pet.species] = { ...pet, nameUpdatedAt: pet.nameUpdatedAt ?? null };
  });

  const foodGrantedByDate = companion.foodGrantedByDate ?? {};
  // Payloads written before the ledger economy carried a numeric food counter
  // and no foodCarryover field. Bank that counter into carryover, and neutralise
  // the historical grant ledger (already reflected in the counter) with
  // deterministic "migrated" spend events so the derived balance equals exactly
  // what the user had — and re-migrating the same payload is a no-op.
  const isLegacyCounterEconomy = typeof companion.foodCarryover !== "number";
  const foodCarryover = isLegacyCounterEconomy
    ? clamp(companion.food ?? 0, 0, FOOD_CAP)
    : clamp(companion.foodCarryover, 0, FOOD_CAP);
  const foodSpentEvents = isLegacyCounterEconomy
    ? synthesizeMigrationSpends(foodGrantedByDate)
    : companion.foodSpentEvents ?? {};

  return withDerivedFood({
    ...base,
    ...companion,
    pets,
    activeSpecies: companion.activeSpecies ?? null,
    activeSpeciesUpdatedAt: companion.activeSpeciesUpdatedAt ?? null,
    foodGrantedByDate,
    foodGiftsReceived: companion.foodGiftsReceived ?? {},
    foodSpentEvents,
    foodCarryover,
    giftOverflowBondByDate: companion.giftOverflowBondByDate ?? {},
    allDoneBonusDates: companion.allDoneBonusDates ?? {}
  });
}

function synthesizeMigrationSpends(
  granted: Record<string, number>
): Record<string, string[]> {
  const spends: Record<string, string[]> = {};

  Object.keys(granted).forEach((date) => {
    const count = Math.floor(granted[date]);

    if (!Number.isFinite(count) || count <= 0) return;

    spends[date] = Array.from({ length: count }, (_, index) => `migrated:${date}:${index}`);
  });

  return spends;
}

const DEFAULT_PET_NAMES: Record<PetSpecies, string> = {
  dog: "Xoài",
  cat: "Mochi"
};

/**
 * Naming only happens here (there is no separate rename function), so this is
 * the single place `nameUpdatedAt` gets stamped. Adoption also switches the
 * active pet, so `activeSpeciesUpdatedAt` is stamped too.
 */
export function adoptPet(
  state: DashboardState,
  species: PetSpecies,
  name: string,
  today = getDashboardToday(),
  nowIso = new Date().toISOString()
): DashboardState {
  if (state.companion.pets[species]) {
    return switchActivePet(state, species, nowIso);
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
    petsTodayDate: null,
    nameUpdatedAt: nowIso
  };

  return {
    ...state,
    companion: {
      ...state.companion,
      pets: { ...state.companion.pets, [species]: pet },
      activeSpecies: species,
      activeSpeciesUpdatedAt: nowIso
    }
  };
}

export function switchActivePet(
  state: DashboardState,
  species: PetSpecies,
  nowIso = new Date().toISOString()
): DashboardState {
  if (!state.companion.pets[species] || state.companion.activeSpecies === species) {
    return state;
  }

  return {
    ...state,
    companion: {
      ...state.companion,
      activeSpecies: species,
      activeSpeciesUpdatedAt: nowIso
    }
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
  const companion = foldExpiredFoodDays(state.companion, today);
  const grantedToday = companion.foodGrantedByDate[today] ?? 0;
  const dailyCap = totalCount + 1;
  const isAllDone = totalCount > 0 && completedCountAfter >= totalCount;
  const wanted = isAllDone ? 2 : 1;
  const allowed = Math.min(wanted, Math.max(0, dailyCap - grantedToday));

  if (allowed <= 0) return state;

  return {
    ...state,
    companion: withDerivedFood({
      ...companion,
      foodGrantedByDate: { ...companion.foodGrantedByDate, [today]: grantedToday + allowed }
    })
  };
}

/**
 * Feeding appends one spend event to the ledger instead of decrementing a
 * counter — spends survive every sync order (spec §2.3). Appends are deduped
 * on eventId, so replaying the same mutation (retry after a flaky flush) is a
 * no-op: no double spend, no double bond.
 */
export function feedActivePet(
  state: DashboardState,
  today = getDashboardToday(),
  eventId?: string
): DashboardState {
  const companion = state.companion;
  const species = companion.activeSpecies;
  const pet = species ? companion.pets[species] : undefined;

  if (!species || !pet) return state;

  const spentToday = companion.foodSpentEvents[today] ?? [];
  const id = eventId ?? generateSpendEventId();

  if (spentToday.includes(id)) return state;
  if (deriveFoodBalance(companion) <= 0) return state;

  const grown = withGrowthDay(pet, today);

  return {
    ...state,
    companion: withDerivedFood({
      ...companion,
      foodSpentEvents: { ...companion.foodSpentEvents, [today]: [...spentToday, id] },
      pets: {
        ...companion.pets,
        [species]: { ...grown, bond: grown.bond + BOND_PER_FEED }
      }
    })
  };
}

function generateSpendEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `feed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
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

export function openGift(state: DashboardState, today = getDashboardToday()): DashboardState {
  const companion = state.companion;
  const species = companion.activeSpecies;
  const pet = species ? companion.pets[species] : undefined;

  if (!companion.pendingGift || !species || !pet) return state;

  // The comeback gift lands in the gifts ledger (not foodGrantedByDate) so it
  // never eats into the daily habit-earn cap, and the fixed "date:comeback"
  // key makes it idempotent under union-merge across devices.
  return {
    ...state,
    companion: withDerivedFood({
      ...companion,
      pendingGift: false,
      foodGiftsReceived: {
        ...companion.foodGiftsReceived,
        [`${today}:comeback`]: GIFT_FOOD
      },
      pets: {
        ...companion.pets,
        [species]: { ...pet, bond: pet.bond + GIFT_BOND }
      }
    })
  };
}

/** One mailbox gift from a friend's garden visit (spec §4.2.1). */
export type GardenGiftVisit = {
  visitId: string;
  /** Date label the visit was stamped with (visitor's calendar). */
  visitDate: string;
  giftedFood: number;
};

export type ApplyGiftResult = {
  state: DashboardState;
  /**
   * true = the visit is fully absorbed (or carried no food) and safe to ack;
   * false = no room anywhere today — leave applied_at null, the gift waits in
   * the mailbox and applies on a later day ("quà không bao giờ mất trắng").
   */
  applied: boolean;
};

/**
 * Applies one friend's gift from the garden_visits mailbox as a plain local
 * mutation (spec §4.2.1). Ledger key `visitDate:visitId` makes the whole thing
 * idempotent: a visit already in foodGiftsReceived is a no-op (re-ack only).
 * Order of preference: food ledger while below FOOD_CAP; else +1 bond via the
 * gift-overflow ledger (cap GIFT_OVERFLOW_BOND_PER_DAY across all friends);
 * else the gift stays in the mailbox — never lost, never guilt.
 */
export function applyGiftToState(
  state: DashboardState,
  visit: GardenGiftVisit,
  today = getDashboardToday()
): ApplyGiftResult {
  // Visits without food (pure pet/cheer) have nothing to absorb — just ack.
  if (visit.giftedFood <= 0) return { state, applied: true };

  const companion = state.companion;
  const key = `${visit.visitDate}:${visit.visitId}`;

  // Idempotent: the ledger key dedupes (reload before a lost ack re-acks only).
  if (key in companion.foodGiftsReceived) return { state, applied: true };

  if (deriveFoodBalance(companion) < FOOD_CAP) {
    return {
      state: {
        ...state,
        companion: withDerivedFood({
          ...companion,
          foodGiftsReceived: { ...companion.foodGiftsReceived, [key]: visit.giftedFood }
        })
      },
      applied: true
    };
  }

  // Pantry is full — overflow becomes +1 bond for the active pet, capped/day.
  const species = companion.activeSpecies;
  const pet = species ? companion.pets[species] : undefined;
  const overflowToday = companion.giftOverflowBondByDate[today] ?? 0;

  if (!species || !pet || overflowToday >= GIFT_OVERFLOW_BOND_PER_DAY) {
    return { state, applied: false };
  }

  return {
    state: {
      ...state,
      companion: withDerivedFood({
        ...companion,
        // Value 0: the key marks the visit as absorbed without adding food.
        foodGiftsReceived: { ...companion.foodGiftsReceived, [key]: 0 },
        giftOverflowBondByDate: {
          ...companion.giftOverflowBondByDate,
          [today]: overflowToday + 1
        },
        pets: { ...companion.pets, [species]: { ...pet, bond: pet.bond + 1 } }
      })
    },
    applied: true
  };
}

/**
 * The displayed food balance is derived from the ledgers — never stored,
 * never merged (spec §2.3): clamp(carryover + Σgranted + Σgifts − Σ|spent|).
 */
export function deriveFoodBalance(companion: CompanionState): number {
  const granted = Object.values(companion.foodGrantedByDate).reduce(
    (sum, count) => sum + count,
    0
  );
  const gifts = Object.values(companion.foodGiftsReceived).reduce(
    (sum, count) => sum + count,
    0
  );
  const spent = Object.values(companion.foodSpentEvents).reduce(
    (sum, events) => sum + events.length,
    0
  );

  return clamp(companion.foodCarryover + granted + gifts - spent, 0, FOOD_CAP);
}

/** Keeps the cached `food` field equal to the ledger-derived balance. */
function withDerivedFood(companion: CompanionState): CompanionState {
  return { ...companion, food: deriveFoodBalance(companion) };
}

/**
 * Folds food-ledger days older than FOOD_LEDGER_RETENTION_DAYS into
 * foodCarryover pair-wise (per day: net = granted + gifts − spent, clamped into
 * carryover) and then deletes those keys, so the derived balance is unchanged
 * by pruning. Expired gift-overflow-bond days are dropped too (bond was
 * already applied; the ledger only exists as a daily cap).
 */
export function pruneFoodLedgers(state: DashboardState, today = getDashboardToday()): DashboardState {
  const folded = foldExpiredFoodDays(state.companion, today);

  if (folded === state.companion) return state;

  return { ...state, companion: withDerivedFood(folded) };
}

function giftKeyDate(key: string): string {
  const separator = key.indexOf(":");

  return separator === -1 ? key : key.slice(0, separator);
}

function foldExpiredFoodDays(companion: CompanionState, today: string): CompanionState {
  const cutoff = addDaysIso(today, -FOOD_LEDGER_RETENTION_DAYS);
  const expiredDays = new Set<string>();

  Object.keys(companion.foodGrantedByDate).forEach((date) => {
    if (date < cutoff) expiredDays.add(date);
  });
  Object.keys(companion.foodSpentEvents).forEach((date) => {
    if (date < cutoff) expiredDays.add(date);
  });
  Object.keys(companion.foodGiftsReceived).forEach((key) => {
    const date = giftKeyDate(key);
    if (date < cutoff) expiredDays.add(date);
  });

  const hasExpiredOverflow = Object.keys(companion.giftOverflowBondByDate).some(
    (date) => date < cutoff
  );

  if (expiredDays.size === 0 && !hasExpiredOverflow) return companion;

  let foodCarryover = companion.foodCarryover;
  const foodGrantedByDate = { ...companion.foodGrantedByDate };
  const foodGiftsReceived = { ...companion.foodGiftsReceived };
  const foodSpentEvents = { ...companion.foodSpentEvents };

  [...expiredDays].sort().forEach((day) => {
    const giftKeys = Object.keys(foodGiftsReceived).filter((key) => giftKeyDate(key) === day);
    const net =
      (foodGrantedByDate[day] ?? 0) +
      giftKeys.reduce((sum, key) => sum + foodGiftsReceived[key], 0) -
      (foodSpentEvents[day]?.length ?? 0);

    foodCarryover = clamp(foodCarryover + net, 0, FOOD_CAP);
    delete foodGrantedByDate[day];
    delete foodSpentEvents[day];
    giftKeys.forEach((key) => delete foodGiftsReceived[key]);
  });

  const giftOverflowBondByDate: Record<string, number> = {};

  Object.keys(companion.giftOverflowBondByDate).forEach((date) => {
    if (date >= cutoff) giftOverflowBondByDate[date] = companion.giftOverflowBondByDate[date];
  });

  return {
    ...companion,
    foodCarryover,
    foodGrantedByDate,
    foodGiftsReceived,
    foodSpentEvents,
    giftOverflowBondByDate
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
    food: deriveFoodBalance(companion),
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

function isHabitDone(state: DashboardState, date: string, habitId: string): boolean {
  return state.records[date]?.completions[habitId] === true;
}

/**
 * Chuỗi ngày liên tiếp một thói quen được hoàn thành. Ngày đang diễn ra chưa
 * tick KHÔNG làm đứt chuỗi (vẫn còn cơ hội) — chuỗi chỉ đứt khi một ngày ĐÃ
 * QUA bị bỏ trống (invariant 1: không dọa mất chuỗi giữa ngày).
 */
export function calculateHabitStreak(
  state: DashboardState,
  habitId: string,
  today = getDashboardToday()
): number {
  let streak = 0;
  let date = isHabitDone(state, today, habitId) ? today : addDaysIso(today, -1);

  while (isHabitDone(state, date, habitId)) {
    streak += 1;
    date = addDaysIso(date, -1);
  }

  return streak;
}

function habitCompletionRateOver(
  state: DashboardState,
  habitId: string,
  days: number,
  today: string
): number {
  const window = Array.from({ length: days }, (_, index) => addDaysIso(today, index - (days - 1)));

  return average(window.map((date) => (isHabitDone(state, date, habitId) ? 1 : 0)));
}

/** Thứ Hai của tuần chứa `date` (tuần hiển thị T2 → CN). */
function mondayOf(date: string): string {
  const offsetFromMonday = (parseIsoDate(date).getDay() + 6) % 7;

  return addDaysIso(date, -offsetFromMonday);
}

/** Dữ liệu cho panel chi tiết một thói quen. null nếu id không tồn tại. */
export function buildHabitDetail(
  state: DashboardState,
  habitId: string,
  today = getDashboardToday()
): HabitDetail | null {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) return null;

  const start = addDaysIso(mondayOf(today), -28);
  const weeks = Array.from({ length: 5 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDaysIso(start, week * 7 + day);

      return {
        date,
        done: isHabitDone(state, date, habitId),
        isToday: date === today,
        isFuture: date > today
      };
    })
  );
  const totalCompletions = Object.values(state.records).reduce(
    (sum, record) => sum + (record.completions[habitId] === true ? 1 : 0),
    0
  );

  return {
    habit,
    completedToday: isHabitDone(state, today, habitId),
    streak: calculateHabitStreak(state, habitId, today),
    rate7: habitCompletionRateOver(state, habitId, 7, today),
    rate30: habitCompletionRateOver(state, habitId, 30, today),
    totalCompletions,
    weeks
  };
}

/**
 * Đổi tên / nhóm một thói quen (immutable). Tên rỗng hoặc không đổi gì → trả
 * về state cũ nguyên vẹn. Id/key giữ nguyên — records và sync không xáo trộn.
 */
export function updateHabitInState(
  state: DashboardState,
  habitId: string,
  input: { name: string; category: string }
): DashboardState {
  const habit = state.habits.find((item) => item.id === habitId);
  const name = input.name.trim().slice(0, 60);

  if (!habit || !name) return state;
  if (habit.name === name && habit.category === input.category) return state;

  return {
    ...state,
    habits: state.habits.map((item) =>
      item.id === habitId
        ? { ...item, name, category: input.category, iconName: habitIcon(item.key, input.category) }
        : item
    )
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
      label: formatVietnameseCalendarDate(date),
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
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => addDaysIso(today, index - 6));
  const habitViews = state.habits.map((habit) => ({
    ...habit,
    completed: state.records[today]?.completions[habit.id] === true,
    streak: calculateHabitStreak(state, habit.id, today),
    weekDots: lastSevenDays.map((date) => ({
      date,
      done: isHabitDone(state, date, habit.id),
      isToday: date === today
    }))
  }));

  return {
    date: {
      iso: today,
      longLabel: formatVietnameseLongDate(today),
      monthLabel: formatVietnameseMonthLabel(today)
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
    // Chỉ hiện sự kiện của hôm nay trở đi, gần nhất trước.
    events: state.events
      .filter((event) => event.at.slice(0, 10) >= today)
      .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)),
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
        label: formatVietnameseDayNumber(date),
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
        label: formatVietnameseTrendLabel(date),
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
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatVietnameseLongDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatVietnameseMonthLabel(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatVietnameseCalendarDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatVietnameseDayNumber(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric"
  }).format(parseIsoDate(date));
}

function formatVietnameseTrendLabel(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "numeric",
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

// Giọng của khu vườn: bạn cùng nhà dịu dàng, không bao giờ trách móc. Ngày lỡ
// nhịp là ngày nghỉ, và tiến bộ neo vào nhịp 7 ngày, không phải streak mong manh.
function buildMotivation(
  todayScore: { completedHabits: number; completionRate: number },
  rhythm: number
) {
  if (todayScore.completionRate >= 1) {
    return "GIỎI QUÁ Sếp ơi! Trọn vẹn hôm nay — vườn mình nở hoa rồi 🌸";
  }

  if (todayScore.completionRate >= TARGET_COMPLETION_RATE) {
    return "Sắp trọn vẹn một ngày rồi. Còn một thói quen nhỏ xíu thôi?";
  }

  if (todayScore.completedHabits > 0) {
    return "Mình đang trên đà rồi. Chọn việc dễ nhất làm tiếp nha?";
  }

  if (rhythm >= 0.5) {
    return `Nhịp 7 ngày của mình đang ${Math.round(rhythm * 100)}%. Một việc nhỏ để khởi động hôm nay nè ☀️`;
  }

  return "Chào Sếp! Chỗ của Sếp vẫn luôn ở đây — hôm nay mình bắt đầu nhẹ thôi 🌱";
}

function buildProtectionMessage(completionRate: number, rhythm: number) {
  if (completionRate >= TARGET_COMPLETION_RATE) {
    return "Hôm nay ấm áp đủ đầy — mầm cây đã được tưới";
  }

  if (completionRate > 0) {
    return "Thêm một thói quen nữa là giữ tròn nhịp hôm nay";
  }

  if (rhythm >= 0.5) {
    return "Hôm qua tính là ngày nghỉ ngơi. Hôm nay mình bắt đầu nhẹ nhàng";
  }

  return "Chỉ cần một lần tick nhỏ để bắt đầu lại";
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}
