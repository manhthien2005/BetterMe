"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CirclePlus,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  addEventToState,
  addHabitToState,
  adoptPet,
  applyGiftToState,
  buildDashboardViewModel,
  buildHabitDetail,
  categoryLabel,
  checkComebackGift,
  createInitialDashboardState,
  feedActivePet,
  getBondTier,
  getDashboardToday,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift,
  petActivePet,
  recordGrowthDay,
  removeEventFromState,
  removeHabitFromState,
  STATUS_LABELS,
  switchActivePet,
  toggleHabitForDate,
  updateHabitInState,
  type DashboardCalendarDay,
  type DashboardEvent,
  type DashboardHabitView,
  type DashboardState,
  type DashboardStatus,
  type DashboardViewModel,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";
import { EventsCard } from "@/components/dashboard/events-card";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { FriendsCard } from "@/components/dashboard/friends-card";
import { GardenFairCard } from "@/components/dashboard/garden-fair";
import { GardenVisitOverlay } from "@/components/dashboard/garden-visit-overlay";
import { HabitDetailOverlay } from "@/components/dashboard/habit-detail-overlay";
import { habitEmoji, habitIconBubbleClass } from "@/components/dashboard/habit-style";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { getPetLine, type PetEvent } from "@/components/dashboard/pet-voice";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import {
  ackGardenVisits,
  bumpSharedRhythms,
  getPendingGardenVisits,
  refreshMySummary
} from "@/lib/server/social-actions";
import {
  loadSyncOptIn,
  saveSyncOptIn,
  shouldAskSyncOptIn,
  snoozeSyncAsk,
  SyncOnboarding
} from "@/components/dashboard/sync-onboarding";
import { Button } from "@/components/ui/button";
import { fetchSyncSnapshot, pushMutations } from "@/lib/server/sync-actions";
import { createSyncEngine, type SyncEngine } from "@/lib/sync/engine";
import { runSyncOnboarding, type InitialUploadMode } from "@/lib/sync/importer";
import type { SyncStatus } from "@/lib/sync/types";
import { cn, formatPercent } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "betterme.dashboard.v2";
const LEGACY_STORAGE_KEY = "betterme.dashboard.v1";

const HABIT_CATEGORIES = ["Discipline", "Learning", "Work", "Health", "Reflection"];

/** Vietnamese tooltip + emoji per sync status (spec §2.1 — discreet dot). */
const SYNC_DOT: Record<Exclude<SyncStatus, "disabled">, { emoji: string; label: string }> = {
  idle: { emoji: "☁️", label: "Đã lưu trên mây" },
  pending: { emoji: "⏳", label: "Đang đồng bộ…" },
  error: { emoji: "⚠️", label: "Chưa đồng bộ được — sẽ thử lại" }
};

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

// Mailbox celebration dedupe (spec §4.2.1): which garden-visit ids have already
// been celebrated, so a stuck/unacked visit never re-fires the toast + bubble
// on the next mount. Map visitId -> visitDate, pruned to a 30-day window to
// match the other ledger horizons.
const MAILBOX_SEEN_KEY = "betterme.mailboxseen.v1";
const MAILBOX_SEEN_RETENTION_DAYS = 30;

type MailboxSeen = Record<string, string>;

/** today − days as an ISO YYYY-MM-DD (UTC arithmetic; lexicographically ordered). */
function isoDaysBefore(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}

/** Load the celebrated-visit map, dropping entries older than the retention window. */
function loadMailboxSeen(today: string): MailboxSeen {
  try {
    const raw = window.localStorage.getItem(MAILBOX_SEEN_KEY);

    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cutoff = isoDaysBefore(today, MAILBOX_SEEN_RETENTION_DAYS);
    const seen: MailboxSeen = {};

    for (const [visitId, visitDate] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof visitDate === "string" && visitDate >= cutoff) seen[visitId] = visitDate;
    }

    return seen;
  } catch {
    return {};
  }
}

function saveMailboxSeen(seen: MailboxSeen) {
  try {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Best-effort: a full/blocked store just means we might re-celebrate later.
  }
}

export function DashboardClient({ userEmail }: { userEmail: string }) {
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
    const next = adoptPet(state, species, name, today);
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
    const next = openGift(state);

    if (next === state) return;

    speakAfter(next, state, "comeback");
    commitState(next);
    markCompanionDirty();
    toast.success("Quà để dành! +3 món ăn 🎁", {
      description: "Đi vắng mấy hôm cũng không sao — bé chỉ mong bạn về thôi."
    });
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2.5 font-display text-base font-bold text-plum"
          href="/dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-matcha-deep font-display text-sm text-white shadow-mochi">
            BM
          </span>
          BetterMe
        </Link>
        <ProfileMenu
          email={userEmail}
          onOpenProfile={handleOpenProfile}
          onOpenSettings={handleOpenSettings}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <HeroBanner
          bubble={bubble}
          celebrate={celebrate}
          eating={eating}
          onAdopt={handleAdopt}
          onFeed={feedPet}
          onOpenGift={handleOpenGift}
          onPet={petThePet}
          onSwitch={handleSwitchPet}
          viewModel={viewModel}
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[repeat(18,minmax(0,1fr))]">
            <TodaysHabits
              habits={viewModel.habits}
              onAdd={addHabit}
              onOpenDetail={setDetailHabitId}
              onRemove={removeHabit}
              onToggle={toggleHabit}
              viewModel={viewModel}
            />
            <CalendarPanel days={viewModel.calendar.days} viewModel={viewModel} />
            <EventsCard
              events={viewModel.events}
              onAdd={addEvent}
              onRemove={removeEvent}
              today={today}
            />
            <AnalyticsPanel viewModel={viewModel} />
            {/* Social layer rides on sync (spec §3.3): the card exists ONLY
                while the engine is enabled — live Supabase session + sync
                opt-in. Logged out / dev bypass: absent, zero layout change. */}
            {syncStatus !== "disabled" ? (
              <>
                <FriendsCard onVisitFriend={setVisitingFriendId} />
                <GardenFairCard
                  onOwnLantern={() => {
                    const species = stateRef.current.companion.activeSpecies;
                    const pet = species ? stateRef.current.companion.pets[species] : undefined;

                    if (species && pet) {
                      setBubble(getPetLine(species, getBondTier(pet.bond), "fairLantern"));
                    }
                  }}
                />
              </>
            ) : null}
          </div>
          <aside
            aria-label="Thời tiết và nhạc tập trung"
            className="grid gap-5 xl:sticky xl:top-5"
          >
            <WeatherCard />
            <SpotifyCard />
          </aside>
        </div>
      </div>

      <SiteFooter />

      <SyncStatusDot status={syncStatus} />

      {showSyncOnboarding ? (
        <SyncOnboarding onChoose={handleSyncChoice} onDismiss={handleSyncDismiss} />
      ) : null}

      {habitDetail ? (
        <HabitDetailOverlay
          categories={HABIT_CATEGORIES}
          detail={habitDetail}
          onClose={() => setDetailHabitId(null)}
          onRemove={(habitId) => {
            removeHabit(habitId);
            setDetailHabitId(null);
          }}
          onSave={saveHabitEdit}
        />
      ) : null}

      {visitingFriendId ? (
        <GardenVisitOverlay
          hostUserId={visitingFriendId}
          myFood={viewModel.companion.food}
          onClose={() => setVisitingFriendId(null)}
          // The gift RPC already appended the spend event server-side with an
          // id only the server knows — mirroring locally with a NEW id would
          // double-spend after union-merge. Re-hydrate instead: the merged
          // ledger carries the server's spend event (spec §4.2 + §2.3).
          onGiftSent={() => void engineRef.current?.hydrate()}
        />
      ) : null}
    </main>
  );
}

/**
 * Discreet sync indicator (spec §2.1), pinned to the footer corner. Hidden
 * entirely while sync is disabled (logged out / dev bypass); fixed positioning
 * means it never shifts the layout, appearing or changing state.
 */
function SyncStatusDot({ status }: { status: SyncStatus }) {
  if (status === "disabled") return null;

  const dot = SYNC_DOT[status];

  return (
    <span
      aria-label={dot.label}
      className={cn(
        "fixed bottom-3 right-3 z-40 flex h-8 w-8 select-none items-center justify-center rounded-full border border-wafer bg-mochi text-sm leading-none shadow-mochi",
        status === "idle" && "opacity-60"
      )}
      role="status"
      title={dot.label}
    >
      {dot.emoji}
    </span>
  );
}

function CalendarPanel({
  days,
  viewModel
}: {
  days: DashboardCalendarDay[];
  viewModel: DashboardViewModel;
}) {
  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/1/2/8]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">Lịch tháng</h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            {viewModel.date.monthLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-matcha/40 bg-matcha/10 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-matcha-deep">Tháng này</p>
          <p className="font-display text-lg font-bold text-matcha-deep">
            {formatPercent(viewModel.calendar.monthCompletionRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-mauve">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            aria-label={`${day.label}, xong ${day.completedHabits}/${day.totalHabits} thói quen, ${STATUS_LABELS[day.status]}`}
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-wafer text-xs font-bold sm:h-9 sm:w-9",
              day.inCurrentMonth ? "text-plum" : "border-wafer/50 text-mauve/40",
              day.fillRatio >= 1 &&
                day.inCurrentMonth &&
                "border-transparent text-white shadow-[0_2px_8px_rgba(76,122,67,0.28)]",
              day.isToday && "ring-2 ring-sakura-deep ring-offset-2"
            )}
            key={day.date}
            role="img"
            style={calendarCellStyle(day)}
            title={`${day.label}: ${day.completedHabits}/${day.totalHabits} thói quen`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </section>
  );
}

function TodaysHabits({
  habits,
  onAdd,
  onOpenDetail,
  onRemove,
  onToggle,
  viewModel
}: {
  habits: DashboardHabitView[];
  onAdd: (name: string, category: string) => void;
  onOpenDetail: (habitId: string) => void;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
  viewModel: DashboardViewModel;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(HABIT_CATEGORIES[0]);
  const easyWinId = findEasyWin(habits);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    onAdd(name, category);
    setName("");
    setShowForm(false);
  }

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/8/3/19]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">
            Thói quen hôm nay
          </h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            Xong {viewModel.today.completedHabits}/{viewModel.today.totalHabits} việc
          </p>
        </div>
        <StatusBadge status={viewModel.today.status} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-mauve">
          <span>Tiến độ hôm nay</span>
          <span className="text-plum">{formatPercent(viewModel.today.completionRate)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-wafer">
          <div
            className="h-full rounded-full bg-gradient-to-r from-matcha to-matcha-deep transition-all duration-500"
            style={{ width: `${viewModel.today.completionRate * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {habits.map((habit) => (
          <HabitRow
            editing={editing}
            habit={habit}
            isEasyWin={habit.id === easyWinId}
            key={habit.id}
            onOpenDetail={onOpenDetail}
            onRemove={onRemove}
            onToggle={onToggle}
          />
        ))}
      </div>

      {showForm ? (
        <form
          className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-wafer bg-rice/70 p-3"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="new-habit-name">
            Tên thói quen
          </label>
          <input
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Một thói quen nhỏ, vd. Uống đủ nước"
            value={name}
          />
          <label className="sr-only" htmlFor="new-habit-category">
            Nhóm
          </label>
          <select
            className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {HABIT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {categoryLabel(option)}
              </option>
            ))}
          </select>
          <Button type="submit">Trồng thôi 🌱</Button>
          <Button onClick={() => setShowForm(false)} type="button" variant="ghost">
            Để sau
          </Button>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setShowForm(true)} type="button" variant="outline">
            <CirclePlus className="h-4 w-4" />
            Thêm thói quen
          </Button>
          <Button
            aria-pressed={editing}
            onClick={() => setEditing((current) => !current)}
            type="button"
            variant="ghost"
          >
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? "Xong" : "Sửa"}
          </Button>
        </div>
      )}
    </section>
  );
}

function findEasyWin(habits: DashboardHabitView[]) {
  const remaining = habits.filter((habit) => !habit.completed);

  if (!remaining.length || remaining.length === habits.length) return null;

  return remaining.reduce((easiest, habit) =>
    habit.maxScore < easiest.maxScore ? habit : easiest
  ).id;
}

function HabitRow({
  editing,
  habit,
  isEasyWin,
  onOpenDetail,
  onRemove,
  onToggle
}: {
  editing: boolean;
  habit: DashboardHabitView;
  isEasyWin: boolean;
  onOpenDetail: (habitId: string) => void;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
}) {
  const emoji = habitEmoji(habit.key, habit.category);
  const doneThisWeek = habit.weekDots.filter((dot) => dot.done).length;

  return (
    <div className="relative flex items-stretch gap-2">
      <button
        aria-pressed={habit.completed}
        className={cn(
          "squishy grid min-h-16 w-full min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-white/80 p-3 text-left shadow-mochi transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2",
          habit.completed ? "border-matcha/50 bg-matcha/5" : "border-wafer"
        )}
        onClick={() => onToggle(habit.id)}
        type="button"
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition",
            habitIconBubbleClass(habit.key, habit.category)
          )}
        >
          <span
            aria-label={`Biểu tượng thói quen ${habit.name}`}
            className="text-2xl leading-none drop-shadow-sm"
            role="img"
          >
            {emoji}
          </span>
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "inline-block max-w-full truncate align-top text-sm font-bold",
              habit.completed ? "crayon-strike text-mauve" : "text-plum"
            )}
          >
            {habit.name}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs font-bold text-mauve">
            <span className="truncate">{categoryLabel(habit.category)}</span>
            {habit.streak >= 2 ? (
              <span
                className="shrink-0 rounded-full bg-butter/50 px-2 py-0.5 text-[10px] font-bold text-plum"
                title={`Chuỗi ${habit.streak} ngày liên tiếp`}
              >
                🔥 {habit.streak}
              </span>
            ) : null}
            {isEasyWin && !habit.completed ? (
              <span className="shrink-0 rounded-full bg-butter/50 px-2 py-0.5 text-[10px] font-bold text-plum">
                ✨ dễ bắt đầu
              </span>
            ) : null}
            <span
              aria-label={`Tuần này xong ${doneThisWeek}/7 ngày`}
              className="ml-auto hidden shrink-0 items-center gap-1 sm:flex"
              role="img"
              title={`Tuần này: ${doneThisWeek}/7 ngày`}
            >
              {habit.weekDots.map((dot) => (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    dot.done ? "bg-matcha" : "bg-wafer",
                    dot.isToday && "ring-1 ring-sakura-deep ring-offset-1"
                  )}
                  key={dot.date}
                />
              ))}
            </span>
          </span>
        </span>
        <span className="relative flex h-9 w-9 items-center justify-center">
          {habit.completed ? (
            <span
              aria-hidden="true"
              className="habit-done-ring absolute inset-0 rounded-full bg-matcha/30"
            />
          ) : null}
          <span
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
              habit.completed
                ? "check-pop border-matcha bg-matcha text-white"
                : "border-wafer bg-white text-transparent"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3.5} />
          </span>
        </span>
      </button>
      <button
        aria-label={`Chi tiết thói quen ${habit.name}`}
        className="squishy flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-wafer bg-white/80 py-2 text-mauve shadow-mochi transition hover:bg-white hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
        onClick={() => onOpenDetail(habit.id)}
        type="button"
      >
        <BarChart3 className="h-4 w-4" />
      </button>
      {editing ? (
        <button
          aria-label={`Xóa thói quen ${habit.name}`}
          className="squishy absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-sakura-deep text-white shadow-mochi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep focus-visible:ring-offset-2"
          onClick={() => onRemove(habit.id)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-2 text-sm font-bold",
        status === "Good" && "bg-matcha/15 text-matcha-deep",
        status === "Okay" && "bg-butter/40 text-[#8A5A17]",
        status === "Bad" && "bg-sakura/40 text-sakura-deep",
        status === "No data" && "bg-wafer text-mauve"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function calendarCellStyle(day: DashboardCalendarDay) {
  const fillPercent = Math.round(day.fillRatio * 100);
  const fillColor = getCalendarFill(day.status);
  const trackColor = day.inCurrentMonth
    ? "rgba(245,230,224,0.95)"
    : "rgba(245,230,224,0.45)";

  if (day.fillRatio >= 1 && day.inCurrentMonth) {
    return {
      background: "#4C7A43"
    };
  }

  return {
    background: `radial-gradient(circle at center, rgba(255,255,255,0.98) 82%, transparent 83%), conic-gradient(${fillColor} ${fillPercent}%, ${trackColor} 0)`
  };
}

function getCalendarFill(status: DashboardStatus) {
  if (status === "Good") return "rgb(127, 176, 105)";
  if (status === "Okay") return "rgb(242, 176, 76)";
  if (status === "Bad") return "rgb(246, 198, 206)";
  return "rgba(111, 96, 105, 0.22)";
}
