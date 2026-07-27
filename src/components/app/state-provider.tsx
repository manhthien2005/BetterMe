"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { toast } from "sonner";

import {
  activeHabits,
  addEventToState,
  addHabitToState,
  adoptPet as adoptPetInState,
  applyGiftToState,
  buildDashboardViewModel,
  buildHabitDetail,
  checkComebackGift,
  calculateHabitStreak,
  countCompletedOn,
  createHabitInState,
  createInitialDashboardState,
  deleteHabitPermanently,
  feedActivePet,
  getBondTier,
  getDashboardToday,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  moveHabitInState,
  openGift as openGiftInState,
  petActivePet,
  recordGrowthDay,
  removeEventFromState,
  removeHabitFromState,
  setHabitArchived,
  setHabitEntry as setHabitEntryInState,
  setHabitPaused,
  switchActivePet,
  toggleHabitForDate,
  updateHabitFieldsInState,
  updateHabitInState,
  type DashboardDayRecord,
  type DashboardHabit,
  type DashboardEvent,
  type HabitDraft,
  type DashboardState,
  type DashboardViewModel,
  type HabitDetail,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";
import { getPetLine, type PetEvent } from "@/components/dashboard/pet-voice";
import {
  buildWeekGrid,
  countPreviousWeekDone,
  type WeekGrid
} from "@/components/dashboard/week-model";
import {
  loadSyncOptIn,
  saveSyncOptIn,
  shouldAskSyncOptIn,
  snoozeSyncAsk
} from "@/components/dashboard/sync-onboarding";
import {
  ackGardenVisits,
  bumpSharedRhythms,
  getPendingGardenVisits,
  refreshMySummary
} from "@/lib/server/social-actions";
import { fetchWeather, type WeatherSnapshot } from "@/components/dashboard/weather-data";
import {
  DEFAULT_WEATHER_PLACE,
  loadWidgetSettings,
  saveWidgetSettings,
  type WeatherPlace
} from "@/components/dashboard/widget-settings";
import { fetchSyncSnapshot, pushMutations } from "@/lib/server/sync-actions";
import { loadMailboxSeen, saveMailboxSeen, type MailboxSeen } from "@/lib/social/mailbox-seen";
import { createClient } from "@/lib/supabase/client";
import { createSyncEngine, type SyncEngine } from "@/lib/sync/engine";
import { habitSyncPayload, logSyncMutation } from "@/lib/sync/payloads";
import { runSyncOnboarding, type InitialUploadMode } from "@/lib/sync/importer";
import type { SyncStatus } from "@/lib/sync/types";

const STORAGE_KEY = "betterme.dashboard.v3";
/**
 * Read-only from U1a on: migrated once into v3, then left exactly as they were
 * so the owner keeps a working rollback snapshot on disk (spec §9.3).
 */
const LEGACY_STORAGE_KEYS = ["betterme.dashboard.v2", "betterme.dashboard.v1"] as const;

/** Local wall clock as "HH:mm" — the stamp a completed cell carries (spec §6.3). */
function clockHHmm(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * True only when a real Supabase browser session exists. Under the dev auth
 * bypass, in tests (no env vars — createClient throws), or when signed out
 * this resolves false and the sync layer stays fully disabled.
 */
async function hasSupabaseSession(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    return data.session !== null;
  } catch {
    return false;
  }
}

export type WeatherStatus = "loading" | "ready" | "error";

/**
 * The one weather reading in the app. The hero's date line and the weather
 * card both read this, so they can never disagree about the temperature.
 */
export type AppWeather = {
  status: WeatherStatus;
  snapshot: WeatherSnapshot | null;
  place: WeatherPlace;
};

export type AppState = {
  today: string;
  userEmail: string;
  hydrated: boolean;
  weather: AppWeather;
  setWeatherPlace: (place: WeatherPlace) => void;
  /** The card's manual retry — refetches the current place. */
  refreshWeather: () => void;
  viewModel: DashboardViewModel;
  habitDetail: HabitDetail | null;
  syncStatus: SyncStatus;
  showSyncOnboarding: boolean;
  visitingFriendId: string | null;
  bubble: string | null;
  celebrate: boolean;
  eating: boolean;
  /** Unseen garden visits found in this session's mailbox pass. */
  newSocialCount: number;
  clearSocialBadge: () => void;
  toggleHabit: (habitId: string) => void;
  addHabit: (name: string, category: string) => void;
  removeHabit: (habitId: string) => void;
  saveHabitEdit: (habitId: string, name: string, category: string) => void;
  openHabitDetail: (habitId: string) => void;
  closeHabitDetail: () => void;
  /** Direct write for count / duration / checklist controls (spec §4.2). */
  setHabitEntry: (habitId: string, value: number) => void;
  /**
   * Add to today's value. Reads the CURRENT state rather than the rendered
   * one, so two quick taps in the same React batch both land.
   */
  adjustHabitEntry: (habitId: string, delta: number) => void;
  /** Habits that belong to today — schedule, pauses and archives applied. */
  todaysHabits: DashboardHabit[];
  /** Today's log cells. Undefined until the first thing is recorded. */
  todayRecord: DashboardDayRecord | undefined;
  /** Every habit, including the archived ones — the archive screen reads this. */
  allHabits: DashboardHabit[];
  /** Per-habit streak, keyed by habit id, for the day list's 🔥 chips. */
  habitStreaks: Record<string, number>;
  /** This week, T2→CN — rows are habits, columns are days (spec §4.2). */
  weekGrid: WeekGrid;
  /**
   * Cells finished in the week BEFORE this one. The week view compares against
   * this and nothing else — the user's only yardstick is their own last week.
   */
  lastWeekDone: number;
  /** null = the sheet is closed; "" = creating; an id = editing that habit. */
  editingHabitId: string | null;
  openHabitEditor: (habitId: string | null) => void;
  closeHabitEditor: () => void;
  submitHabitDraft: (draft: HabitDraft) => void;
  pauseHabit: (habitId: string, paused: boolean) => void;
  archiveHabit: (habitId: string, archived: boolean) => void;
  moveHabit: (habitId: string, direction: -1 | 1) => void;
  deleteHabitForever: (habitId: string) => void;
  addEvent: (input: {
    title: string;
    at: string;
    category: DashboardEvent["category"];
  }) => void;
  removeEvent: (eventId: string) => void;
  feedPet: () => void;
  petThePet: () => void;
  adoptPet: (species: PetSpecies, name: string) => void;
  switchPet: (species: PetSpecies) => void;
  openGift: () => void;
  visitFriend: (friendUserId: string) => void;
  closeFriendVisit: () => void;
  onGiftSent: () => void;
  speakFairLantern: () => void;
  chooseSync: (mode: InitialUploadMode) => void;
  dismissSync: () => void;
  signOut: () => Promise<void>;
  openProfile: () => void;
  openSettings: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

/** Every consumer must sit under the provider — a null context is a bug. */
export function useAppState(): AppState {
  const value = useContext(AppStateContext);

  if (!value) throw new Error("useAppState must be used inside a StateProvider");

  return value;
}

/**
 * Owns all app state: the local-first dashboard state, the sync engine, the
 * companion's voice, and every overlay's open/closed flag. Lifted out of the
 * old dashboard-client so the four spaces (spec §3) can each read what they
 * need without owning any of it.
 */
export function StateProvider({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const today = useMemo(() => getDashboardToday(), []);
  const [state, setState] = useState<DashboardState>(() =>
    createInitialDashboardState(today)
  );
  const [hydrated, setHydrated] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [eating, setEating] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("disabled");
  const [showSyncOnboarding, setShowSyncOnboarding] = useState(false);
  const [visitingFriendId, setVisitingFriendId] = useState<string | null>(null);
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null);
  const [newSocialCount, setNewSocialCount] = useState(0);
  // null = closed · "" = creating a new habit · an id = editing that habit.
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  // Weather lives here so there is exactly ONE fetch for the whole app: the
  // hero's date line (spec §4.1) and the weather card read the same state, so
  // they can never show two different temperatures. `refreshKey` is the card's
  // manual retry button.
  const [weatherPlace, setWeatherPlaceState] = useState<WeatherPlace>(DEFAULT_WEATHER_PLACE);
  const [weatherSnapshot, setWeatherSnapshot] = useState<WeatherSnapshot | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("loading");
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);
  // The engine reads state through this ref so merges/flushes always see the
  // latest value synchronously — even mid-flush, before React re-renders.
  const stateRef = useRef(state);
  const engineRef = useRef<SyncEngine | null>(null);
  // One mailbox delivery per mount — re-runs happen on the next visit anyway.
  const mailboxDeliveredRef = useRef(false);
  // Shared-rhythm bump fires at most once per day per mount (spec §5.1).
  const bumpedDateRef = useRef<string | null>(null);
  const viewModel = useMemo(() => buildDashboardViewModel(state, today), [state, today]);
  const activePet = viewModel.companion.activePet;
  const todaysHabits = useMemo(() => activeHabits(state, today), [state, today]);
  const habitStreaks = useMemo(
    () =>
      Object.fromEntries(
        todaysHabits.map((habit) => [habit.id, calculateHabitStreak(state, habit.id, today)])
      ),
    [state, today, todaysHabits]
  );
  const habitDetail = useMemo(
    () => (detailHabitId ? buildHabitDetail(state, detailHabitId, today) : null),
    [detailHabitId, state, today]
  );
  const weekGrid = useMemo(() => buildWeekGrid(state, today), [state, today]);
  // Recomputed from state rather than cached: a late edit to last week (an
  // untick on Sunday, say) must move the comparison, not leave it stale.
  const lastWeekDone = useMemo(() => countPreviousWeekDone(state, today), [state, today]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** setState + keep the engine's synchronous view of state in step. */
  const commitState = useCallback((next: DashboardState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Lazily creates the sync engine (spec §2.1). Idempotent per mount. */
  const startSyncEngine = useCallback((): SyncEngine => {
    if (engineRef.current) return engineRef.current;

    const engine = createSyncEngine({
      getState: () => stateRef.current,
      // Merged state goes through the exact same path as a user mutation:
      // setState + the existing localStorage persist effect.
      applyMerged: commitState,
      push: pushMutations,
      fetchSnapshot: fetchSyncSnapshot,
      onStatus: setSyncStatus
    });

    engineRef.current = engine;
    setSyncStatus(engine.getStatus());

    return engine;
  }, [commitState]);

  /** No-op while sync is disabled — zero behavior change when logged out. */
  const markSyncDirty = useCallback((mutation: Parameters<SyncEngine["markDirty"]>[0]) => {
    engineRef.current?.markDirty(mutation);
  }, []);

  const markCompanionDirty = useCallback(() => {
    markSyncDirty({ kind: "companionSnapshot", clientTs: new Date().toISOString() });
  }, [markSyncDirty]);

  // Stable identity: the Bạn vườn effect depends on it.
  const clearSocialBadge = useCallback(() => setNewSocialCount(0), []);

  /**
   * Mailbox delivery (spec §4.2.1): after the sync hydrate, fetch my pending
   * garden_visits (applied_at IS NULL), absorb each one into local state via
   * applyGiftToState (ledger key `date:visitId` dedupes — same visit twice is
   * a no-op), ack the absorbed ones, and greet the owner with one collective,
   * name-free toast — but ONLY for visits not yet celebrated (persisted in
   * betterme.mailboxseen.v1). Visits that found no room (pantry + overflow both
   * full) stay un-acked and retry silently on a later day.
   */
  const deliverGardenMailbox = useCallback(async () => {
    if (mailboxDeliveredRef.current) return;

    mailboxDeliveredRef.current = true;

    const result = await getPendingGardenVisits();

    if (!result.ok || result.visits.length === 0) return;

    // Which visits have we already celebrated? (persisted, pruned to 30d.)
    const seen = loadMailboxSeen(today);
    const unseen = result.visits.filter((visit) => seen[visit.visitId] === undefined);

    // The nav badge counts exactly what the collective toast greets (spec §3).
    setNewSocialCount(unseen.length);

    let next = stateRef.current;
    const appliedIds: string[] = [];
    let giftApplied = false;

    for (const visit of result.visits) {
      const before = next;
      const outcome = applyGiftToState(
        next,
        { visitId: visit.visitId, visitDate: visit.visitDate, giftedFood: visit.giftedFood },
        today
      );

      if (outcome.applied) appliedIds.push(visit.visitId);

      // A fresh gift for the celebration voice = an UNSEEN visit whose gift
      // newly entered the ledger this pass (state actually changed). The
      // date:visitId dedupe key means an already-absorbed gift is a no-op —
      // not a fresh gift — so it must never flip the 🎁 variant (spec §7).
      if (
        seen[visit.visitId] === undefined &&
        visit.giftedFood > 0 &&
        outcome.state !== before
      ) {
        giftApplied = true;
      }

      next = outcome.state;
    }

    if (next !== stateRef.current) {
      commitState(next);
      markCompanionDirty();
    }

    if (appliedIds.length > 0) {
      void ackGardenVisits(appliedIds);
    }

    // Nothing new to celebrate — but we still ran the apply/ack loop above so
    // stuck gifts keep retrying silently.
    if (unseen.length === 0) return;

    // Mark EVERY fetched visit celebrated (applied or not): a stuck gift must
    // not re-toast next mount, and a fire-and-forget ack that fails must not
    // replay the celebration either.
    const nextSeen: MailboxSeen = { ...seen };

    for (const visit of result.visits) nextSeen[visit.visitId] = visit.visitDate;

    saveMailboxSeen(nextSeen);

    // Collective and gentle — no individual names (spec §4.2.1).
    const visitorCount = new Set(unseen.map((visit) => visit.visitorUserId)).size;

    toast(`${visitorCount} bạn đã ghé thăm vườn 🌸`);

    // friendVisit voice for EVERY unseen batch, gift or not — the kind picks
    // the variant (🎁 only with a real gift, spec §4.2.1/§7).
    const species = next.companion.activeSpecies;
    const pet = species ? next.companion.pets[species] : undefined;

    if (species && pet) {
      setBubble(
        getPetLine(
          species,
          getBondTier(pet.bond),
          giftApplied ? "friendVisitGift" : "friendVisit"
        )
      );
    }
  }, [commitState, markCompanionDirty, today]);

  /**
   * Shared rhythm (spec §5.1): after my first tick of the day, ask the server
   * to advance any shared rhythms (a day both gardens tended). Fire-and-forget,
   * once per day per mount; the RPC is idempotent (last_counted_date guards
   * double counts) and returns only counts. advanced > 0 cues the sharedRhythm
   * voice line — never an absence/"waiting" frame (invariant 2, structural).
   */
  const maybeBumpSharedRhythms = useCallback(() => {
    if (!engineRef.current) return; // sync disabled -> no social calls
    if (bumpedDateRef.current === today) return;

    bumpedDateRef.current = today;

    void bumpSharedRhythms().then((result) => {
      if (!result.ok || result.advanced <= 0) return;

      const species = stateRef.current.companion.activeSpecies;
      const pet = species ? stateRef.current.companion.pets[species] : undefined;

      if (species && pet) {
        setBubble(getPetLine(species, getBondTier(pet.bond), "sharedRhythm"));
      }
    });
  }, [today]);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(
        (value) => value !== null
      ) ??
      null;
    let loaded: DashboardState | null = null;

    if (saved) {
      try {
        loaded = migrateDashboardState(JSON.parse(saved));
      } catch {
        loaded = null;
      }
    }

    if (loaded) {
      const welcomed = checkComebackGift(loaded, today);

      commitState(welcomed);

      const species = welcomed.companion.activeSpecies;
      const pet = species ? welcomed.companion.pets[species] : undefined;

      if (species && pet) {
        const hour = new Date().getHours();
        const event: PetEvent = hour < 12 ? "morning" : hour >= 21 ? "night" : "idle";

        setBubble(getPetLine(species, getBondTier(pet.bond), event));
      }
    }

    setHydrated(true);
  }, [commitState, today]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    const stored = loadWidgetSettings().weather;

    if (stored) setWeatherPlaceState(stored);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setWeatherStatus("loading");

    fetchWeather(weatherPlace, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setWeatherSnapshot(result);
        setWeatherStatus(result ? "ready" : "error");
      })
      .catch(() => {
        if (!controller.signal.aborted) setWeatherStatus("error");
      });

    return () => controller.abort();
  }, [weatherPlace, weatherRefreshKey]);

  const setWeatherPlace = useCallback((next: WeatherPlace) => {
    saveWidgetSettings({ ...loadWidgetSettings(), weather: next });
    setWeatherPlaceState(next);
  }, []);

  const refreshWeather = useCallback(() => {
    setWeatherRefreshKey((key) => key + 1);
  }, []);

  // Sync bootstrap (spec §2.1/§2.5): render never waits for this. With a
  // session + prior opt-in the engine hydrates in the background; with a
  // session but no opt-in we ask once per day; otherwise sync stays disabled.
  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    void (async () => {
      if (!(await hasSupabaseSession()) || cancelled) return;

      if (loadSyncOptIn()) {
        // Mailbox gifts land AFTER the sync hydrate (spec §4.2.1) so they are
        // absorbed into the merged state, never a pre-merge snapshot.
        void startSyncEngine()
          .hydrate()
          .then(() => {
            if (!cancelled) void deliverGardenMailbox();
          });
      } else if (shouldAskSyncOptIn(today)) {
        setShowSyncOnboarding(true);
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [deliverGardenMailbox, hydrated, startSyncEngine, today]);

  /**
   * Spec §2.5 — the user picked how their garden goes to the cloud.
   * Hydrate BEFORE uploading: the initial upload is built from the merged
   * post-hydrate state, never from the pre-hydrate (possibly seed) snapshot.
   */
  function handleSyncChoice(mode: InitialUploadMode) {
    saveSyncOptIn(mode);
    setShowSyncOnboarding(false);

    const engine = startSyncEngine();

    void runSyncOnboarding(engine, () => stateRef.current, mode, today);
  }

  function handleSyncDismiss() {
    snoozeSyncAsk(today);
    setShowSyncOnboarding(false);
  }

  /** Applies pet reactions to a state transition and picks the matching line. */
  function speakAfter(next: DashboardState, before: DashboardState, event: PetEvent) {
    const species = next.companion.activeSpecies;

    if (!species) return;

    const pet = next.companion.pets[species];
    const previous = before.companion.pets[species];

    if (!pet) return;

    const evolved =
      previous && getPetStage(previous.growthDays) !== getPetStage(pet.growthDays);

    setBubble(getPetLine(species, getBondTier(pet.bond), evolved ? "evolve" : event));
  }

  function toggleHabit(habitId: string) {
    const habit = viewModel.habits.find((item) => item.id === habitId);
    const turningOn = habit ? !habit.completed : false;
    const completesTheDay =
      turningOn &&
      viewModel.today.completedHabits === viewModel.today.totalHabits - 1;

    if (completesTheDay) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1300);
    }

    let next = toggleHabitForDate(state, today, habitId, clockHHmm());

    if (turningOn && state.companion.activeSpecies) {
      next = grantFoodForHabitCompletion(
        next,
        today,
        viewModel.today.completedHabits + 1,
        viewModel.today.totalHabits
      );
      next = recordGrowthDay(next, today);

      if (completesTheDay) next = grantAllDoneBonus(next, today);

      speakAfter(next, state, completesTheDay ? "allDone" : "habitDone");
    }

    commitState(next);

    if (habit) {
      // SET-based, idempotent (spec §2.1): the engine stamps the shadow cell.
      markSyncDirty(
        logSyncMutation(
          habitId,
          today,
          turningOn,
          next.records[today]?.entries[habitId],
          new Date().toISOString()
        )
      );
    }

    // Ticking on feeds the companion economy (food/growth/all-done bonus) and
    // may advance a shared rhythm with a friend (spec §5.1).
    if (turningOn && state.companion.activeSpecies) {
      markCompanionDirty();
      maybeBumpSharedRhythms();
    }
  }

  /**
   * Direct write for count / duration / checklist controls (spec §4.2).
   * Reaching a target IS completing the habit, so this must feed the companion
   * economy on exactly the same terms as a tick (spec §5.2) — otherwise a
   * count habit would silently earn nothing. `grantFoodForHabitCompletion`
   * caps per day, so paying on both paths can never double-reward.
   */
  function setEntry(habitId: string, value: number) {
    // `stateRef` rather than `state`: a second press inside the same React
    // batch must build on the first one's result, not on the rendered state.
    const base = stateRef.current;
    const before = countCompletedOn(base, today);
    let next = setHabitEntryInState(base, today, habitId, value, clockHHmm());
    const after = countCompletedOn(next, today);
    const previousEntry = base.records[today]?.entries[habitId];
    const nextEntry = next.records[today]?.entries[habitId];
    const cellChanged =
      previousEntry?.value !== nextEntry?.value ||
      previousEntry?.completedAt !== nextEntry?.completedAt;

    if (!cellChanged) return;

    const total = viewModel.today.totalHabits;
    const justCompleted = after > before;
    const completesTheDay = justCompleted && total > 0 && after >= total;

    if (completesTheDay) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1300);
    }

    if (justCompleted && base.companion.activeSpecies) {
      next = grantFoodForHabitCompletion(next, today, after, total);
      next = recordGrowthDay(next, today);

      if (completesTheDay) next = grantAllDoneBonus(next, today);

      speakAfter(next, base, completesTheDay ? "allDone" : "habitDone");
    }

    commitState(next);

    // Enqueued whenever THIS CELL changed, not when the day's completed count
    // changed. Under the old guard, 3 -> 4 glasses of an eight-glass goal left
    // the count alone and that reading never left the device.
    markSyncDirty(
      logSyncMutation(
        habitId,
        today,
        next.records[today]?.completions[habitId] === true,
        nextEntry,
        new Date().toISOString()
      )
    );

    if (justCompleted && state.companion.activeSpecies) {
      markCompanionDirty();
      maybeBumpSharedRhythms();
    }
  }

  /**
   * Creating and editing share one submit path — the sheet does not know
   * which it is doing, only what the draft says.
   */
  function submitHabitDraft(draft: HabitDraft) {
    const editing = editingHabitId !== null && editingHabitId !== "";
    const next = editing
      ? updateHabitFieldsInState(state, editingHabitId, draft)
      : createHabitInState(state, draft);

    if (next === state) return;

    const habit = editing
      ? next.habits.find((item) => item.id === editingHabitId)
      : next.habits[next.habits.length - 1];

    commitState(next);
    setEditingHabitId(null);

    if (habit) {
      markSyncDirty({
        kind: "upsertHabit",
        habit: habitSyncPayload(
          habit,
          next.habits.findIndex((item) => item.id === habit.id)
        ),
        clientTs: new Date().toISOString(),
        ...(editing ? {} : { expectCreate: true })
      });
    }

    toast.success(editing ? "Đã cập nhật thói quen 🌿" : "Đã trồng thói quen mới 🌱");
  }

  /**
   * Pause, archive and reorder all change a habit's DEFINITION, so each has to
   * push an upsert. Until U1c gave the wire a pausedAt/archivedAt/sortOrder to
   * carry, these three had nothing to send and enqueued nothing — pausing on
   * the phone stayed on the phone.
   */
  function syncHabitDefinition(next: DashboardState, habitId: string) {
    const habit = next.habits.find((item) => item.id === habitId);

    if (!habit) return;

    // No expectCreate: the key already exists on the server, and arming
    // collision detection on an edit would read a rename as a rival habit.
    markSyncDirty({
      kind: "upsertHabit",
      habit: habitSyncPayload(
        habit,
        next.habits.findIndex((item) => item.id === habitId)
      ),
      clientTs: new Date().toISOString()
    });
  }

  function pauseHabit(habitId: string, paused: boolean) {
    const next = setHabitPaused(state, habitId, paused ? today : null);

    if (next === state) return;

    commitState(next);
    setEditingHabitId(null);
    syncHabitDefinition(next, habitId);
    toast(paused ? "Đã tạm dừng — chuỗi vẫn giữ nguyên 🍃" : "Chào mừng quay lại 🌱");
  }

  function archiveHabit(habitId: string, archived: boolean) {
    const next = setHabitArchived(state, habitId, archived ? today : null);

    if (next === state) return;

    commitState(next);
    setEditingHabitId(null);
    syncHabitDefinition(next, habitId);
    toast(archived ? "Đã cất vào Lưu trữ — lịch sử vẫn còn nguyên 🗃" : "Đã đưa trở lại 🌱");
  }

  function moveHabit(habitId: string, direction: -1 | 1) {
    const from = state.habits.findIndex((habit) => habit.id === habitId);
    const next = moveHabitInState(state, habitId, direction);

    if (next === state) return;

    commitState(next);
    // A swap moves TWO habits, so both are pushed. Sending only the one the
    // user grabbed would leave its neighbour holding the same sort_order on
    // the server, and the order there would be decided by a tiebreak nobody
    // chose. The queue coalesces per key, so an arrow held down still sends
    // one upsert per habit.
    syncHabitDefinition(next, habitId);

    const swapped = next.habits[from];

    if (swapped && swapped.id !== habitId) syncHabitDefinition(next, swapped.id);
  }

  /** Destructive, and only reachable from the archive screen behind a confirm. */
  function deleteHabitForever(habitId: string) {
    const deletedAt = new Date().toISOString();
    const next = deleteHabitPermanently(state, habitId, deletedAt);

    if (next === state) return;

    commitState(next);
    // Tombstone (sync §2.4): the delete must beat any stale remote copy.
    markSyncDirty({ kind: "deleteHabit", habitKey: habitId, deletedAt });
  }

  /**
   * "+1 ly" pressed twice before React re-renders must count twice. Reading
   * `state` from the render closure would make both presses compute the same
   * new value and silently drop one; `stateRef` is always current.
   */
  function adjustEntry(habitId: string, delta: number) {
    const current = stateRef.current.records[today]?.entries[habitId]?.value ?? 0;

    setEntry(habitId, current + delta);
  }

  function feedPet() {
    if (state.companion.food <= 0 || eating) return;

    const next = feedActivePet(state, today);

    if (next === state) return;

    setEating(true);
    window.setTimeout(() => setEating(false), 1300);
    speakAfter(next, state, "feeding");
    commitState(next);
    markCompanionDirty();
  }

  function petThePet() {
    const next = petActivePet(state, today);

    speakAfter(next === state ? state : next, state, "petting");

    if (next !== state) {
      commitState(next);
      markCompanionDirty();
    }
  }

  function handleAdopt(species: PetSpecies, name: string) {
    const next = adoptPetInState(state, species, name, today);
    const adoptedName = next.companion.pets[species]?.name ?? name;

    commitState(next);
    markCompanionDirty();
    setBubble(getPetLine(species, 1, "morning"));
    toast.success(`${adoptedName} đã về nhà 💕`, {
      description:
        species === "dog"
          ? "Hoàn thành habit để kiếm bánh thưởng cho bé nhé."
          : "Hoàn thành habit để kiếm cá cho hoàng thượng nhé."
    });
  }

  function handleSwitchPet(species: PetSpecies) {
    const next = switchActivePet(state, species);

    if (next === state) return;

    const pet = next.companion.pets[species];

    commitState(next);
    markCompanionDirty();

    // Companion-state hook (spec §4.1): the published summary derives pet
    // species/stage/bond from the ACTIVE pet — refresh it in the background.
    // Fire-and-forget: silent failure is fine, it self-heals on next refresh.
    if (engineRef.current) void refreshMySummary();

    if (pet) setBubble(getPetLine(species, getBondTier(pet.bond), "idle"));
  }

  function handleOpenGift() {
    const next = openGiftInState(state);

    if (next === state) return;

    speakAfter(next, state, "comeback");
    commitState(next);
    markCompanionDirty();
    toast.success("Quà để dành! +3 món ăn 🎁", {
      description: "Đi vắng mấy hôm cũng không sao — bé chỉ mong bạn về thôi."
    });
  }

  /** The fair's own lantern lit — Nếp says so (spec §7). */
  function speakFairLantern() {
    const species = stateRef.current.companion.activeSpecies;
    const pet = species ? stateRef.current.companion.pets[species] : undefined;

    if (species && pet) {
      setBubble(getPetLine(species, getBondTier(pet.bond), "fairLantern"));
    }
  }

  function addHabit(name: string, category: string) {
    const next = addHabitToState(state, { name, category });

    if (next === state) return;

    const created = next.habits[next.habits.length - 1];

    commitState(next);
    // expectCreate arms server-side slug-collision detection (spec §2.2).
    markSyncDirty({
      kind: "upsertHabit",
      habit: habitSyncPayload(created, next.habits.length - 1),
      clientTs: new Date().toISOString(),
      expectCreate: true
    });
    toast.success("Đã trồng thói quen mới 🌱", {
      description: activePet
        ? `${activePet.name} sẽ cổ vũ bạn từ hôm nay.`
        : "Bé cưng trong vườn sẽ cổ vũ bạn từ hôm nay."
    });
  }

  function removeHabit(habitId: string) {
    const deletedAt = new Date().toISOString();
    const next = removeHabitFromState(state, habitId, deletedAt);

    if (next === state) return;

    commitState(next);
    // Tombstone (spec §2.4): the same stamp lives in state.deletedHabits.
    markSyncDirty({ kind: "deleteHabit", habitKey: habitId, deletedAt });
  }

  function saveHabitEdit(habitId: string, name: string, category: string) {
    const next = updateHabitInState(state, habitId, { name, category });

    if (next === state) return;

    const updated = next.habits.find((habit) => habit.id === habitId);

    commitState(next);

    if (updated) {
      // Same-key upsert = rename, never a create — no expectCreate (spec §2.2).
      markSyncDirty({
        kind: "upsertHabit",
        habit: habitSyncPayload(
          updated,
          next.habits.findIndex((habit) => habit.id === habitId)
        ),
        clientTs: new Date().toISOString()
      });
    }

    toast.success("Đã cập nhật thói quen 🌿");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  // Sự kiện là dữ liệu local-only (không sync) — chỉ cần commitState là đủ.
  function addEvent(input: { title: string; at: string; category: DashboardEvent["category"] }) {
    const next = addEventToState(state, input);

    if (next === state) return;

    commitState(next);
    toast.success("Đã ghi sự kiện vào lịch 🌿");
  }

  function removeEvent(eventId: string) {
    const next = removeEventFromState(state, eventId);

    if (next !== state) commitState(next);
  }

  function handleOpenProfile() {
    toast("Trang hồ sơ đang được ươm mầm 🌱", {
      description: "Sắp có nơi để bạn khoe khu vườn của mình."
    });
  }

  function handleOpenSettings() {
    toast("Trang cài đặt đang được ươm mầm 🌱", {
      description: "Vài tuỳ chỉnh nhỏ xinh sẽ sớm có mặt."
    });
  }

  // A fresh object every render — exactly the render behaviour the single
  // dashboard-client component had. Memoising it would risk handing out stale
  // closures over `state`, and buys nothing at this size.
  const value: AppState = {
    today,
    userEmail,
    hydrated,
    weather: { status: weatherStatus, snapshot: weatherSnapshot, place: weatherPlace },
    setWeatherPlace,
    refreshWeather,
    viewModel,
    habitDetail,
    syncStatus,
    showSyncOnboarding,
    visitingFriendId,
    bubble,
    celebrate,
    eating,
    newSocialCount,
    clearSocialBadge,
    toggleHabit,
    setHabitEntry: setEntry,
    adjustHabitEntry: adjustEntry,
    todaysHabits,
    todayRecord: state.records[today],
    allHabits: state.habits,
    habitStreaks,
    weekGrid,
    lastWeekDone,
    editingHabitId,
    openHabitEditor: setEditingHabitId,
    closeHabitEditor: () => setEditingHabitId(null),
    submitHabitDraft,
    pauseHabit,
    archiveHabit,
    moveHabit,
    deleteHabitForever,
    addHabit,
    removeHabit,
    saveHabitEdit,
    openHabitDetail: setDetailHabitId,
    closeHabitDetail: () => setDetailHabitId(null),
    addEvent,
    removeEvent,
    feedPet,
    petThePet,
    adoptPet: handleAdopt,
    switchPet: handleSwitchPet,
    openGift: handleOpenGift,
    visitFriend: setVisitingFriendId,
    closeFriendVisit: () => setVisitingFriendId(null),
    onGiftSent: () => void engineRef.current?.hydrate(),
    speakFairLantern,
    chooseSync: handleSyncChoice,
    dismissSync: handleSyncDismiss,
    signOut: handleSignOut,
    openProfile: handleOpenProfile,
    openSettings: handleOpenSettings
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
