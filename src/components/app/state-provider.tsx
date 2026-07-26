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
  addEventToState,
  addHabitToState,
  adoptPet as adoptPetInState,
  applyGiftToState,
  buildDashboardViewModel,
  buildHabitDetail,
  checkComebackGift,
  createInitialDashboardState,
  feedActivePet,
  getBondTier,
  getDashboardToday,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift as openGiftInState,
  petActivePet,
  recordGrowthDay,
  removeEventFromState,
  removeHabitFromState,
  switchActivePet,
  toggleHabitForDate,
  updateHabitInState,
  type DashboardEvent,
  type DashboardState,
  type DashboardViewModel,
  type HabitDetail,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";
import { getPetLine, type PetEvent } from "@/components/dashboard/pet-voice";
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
import { fetchSyncSnapshot, pushMutations } from "@/lib/server/sync-actions";
import { loadMailboxSeen, saveMailboxSeen, type MailboxSeen } from "@/lib/social/mailbox-seen";
import { createClient } from "@/lib/supabase/client";
import { createSyncEngine, type SyncEngine } from "@/lib/sync/engine";
import { runSyncOnboarding, type InitialUploadMode } from "@/lib/sync/importer";
import type { SyncStatus } from "@/lib/sync/types";

const STORAGE_KEY = "betterme.dashboard.v2";
const LEGACY_STORAGE_KEY = "betterme.dashboard.v1";

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

export type AppState = {
  today: string;
  userEmail: string;
  hydrated: boolean;
  viewModel: DashboardViewModel;
  habitDetail: HabitDetail | null;
  syncStatus: SyncStatus;
  showSyncOnboarding: boolean;
  visitingFriendId: string | null;
  bubble: string | null;
  celebrate: boolean;
  eating: boolean;
  toggleHabit: (habitId: string) => void;
  addHabit: (name: string, category: string) => void;
  removeHabit: (habitId: string) => void;
  saveHabitEdit: (habitId: string, name: string, category: string) => void;
  openHabitDetail: (habitId: string) => void;
  closeHabitDetail: () => void;
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
  const habitDetail = useMemo(
    () => (detailHabitId ? buildHabitDetail(state, detailHabitId, today) : null),
    [detailHabitId, state, today]
  );

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
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
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

    let next = toggleHabitForDate(state, today, habitId);

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
      markSyncDirty({
        kind: "setHabitLog",
        habitKey: habitId,
        date: today,
        done: turningOn,
        clientTs: new Date().toISOString()
      });
    }

    // Ticking on feeds the companion economy (food/growth/all-done bonus) and
    // may advance a shared rhythm with a friend (spec §5.1).
    if (turningOn && state.companion.activeSpecies) {
      markCompanionDirty();
      maybeBumpSharedRhythms();
    }
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
      habit: {
        key: created.id,
        name: created.name,
        category: created.category,
        maxScore: created.maxScore,
        active: true,
        description: created.description,
        sortOrder: next.habits.length - 1
      },
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
        habit: {
          key: updated.id,
          name: updated.name,
          category: updated.category,
          maxScore: updated.maxScore,
          active: true,
          description: updated.description,
          sortOrder: next.habits.findIndex((habit) => habit.id === habitId)
        },
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
    viewModel,
    habitDetail,
    syncStatus,
    showSyncOnboarding,
    visitingFriendId,
    bubble,
    celebrate,
    eating,
    toggleHabit,
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
