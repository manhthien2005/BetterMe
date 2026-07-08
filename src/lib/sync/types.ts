import type { PetSpecies } from "@/components/dashboard/dashboard-data";

/**
 * Sync layer types (spec §2.1–§2.4, docs/superpowers/specs/2026-07-08-social-garden-spec.md).
 *
 * Everything in this file is plain JSON-serializable data: mutations persist in
 * localStorage (betterme.syncqueue.v1) and cross the server-action boundary.
 */

/** Engine status, surfaced discreetly in the UI (spec §2.1). */
export type SyncStatus = "idle" | "pending" | "error" | "disabled";

// ---------------------------------------------------------------------------
// Mutations — all SET-based and idempotent (safe under retry/replay, spec §2.1)
// ---------------------------------------------------------------------------

export type SetHabitLogMutation = {
  kind: "setHabitLog";
  habitKey: string;
  /** YYYY-MM-DD */
  date: string;
  /** SET the value — never a flip. */
  done: boolean;
  /** ISO client stamp; also the LWW stamp for this cell (shadow map). */
  clientTs: string;
};

export type SyncHabitPayload = {
  key: string;
  name: string;
  category: string;
  maxScore: number;
  active: boolean;
  description: string;
  sortOrder: number;
};

export type UpsertHabitMutation = {
  kind: "upsertHabit";
  habit: SyncHabitPayload;
  clientTs: string;
  /**
   * true ONLY for mutations born from a local habit CREATE. It arms server-side
   * slug-collision detection (upsert_habit p_expect_create): a live same-key row
   * with a different name comes back as `rekey-needed` instead of merging two
   * different habits into one row (spec §2.2).
   */
  expectCreate?: boolean;
};

export type DeleteHabitMutation = {
  kind: "deleteHabit";
  habitKey: string;
  /** ISO tombstone stamp — beats any state strictly older than it (spec §2.4). */
  deletedAt: string;
};

/**
 * Marker mutation: the actual companion payload is built at flush time from the
 * CURRENT state (always latest); the queue keeps at most one of these.
 */
export type CompanionSnapshotMutation = {
  kind: "companionSnapshot";
  clientTs: string;
};

export type SyncMutation =
  | SetHabitLogMutation
  | UpsertHabitMutation
  | DeleteHabitMutation
  | CompanionSnapshotMutation;

// ---------------------------------------------------------------------------
// Shadow map — LWW stamps for completion cells, lives OUTSIDE DashboardState
// (localStorage betterme.syncmeta.v1, spec §2.1)
// ---------------------------------------------------------------------------

/** { [date]: { [habitKey]: mutatedAtIso } } — missing stamp = epoch. */
export type ShadowMap = Record<string, Record<string, string>>;

// ---------------------------------------------------------------------------
// Companion payload (merge_companion_state argument `p`)
// ---------------------------------------------------------------------------

export type CompanionPetPayload = {
  name: string;
  nameUpdatedAt: string | null;
  adoptedOn: string;
  growthDays: number;
  bond: number;
  lastGrowthDate: string | null;
  petsToday: number;
  petsTodayDate: string | null;
};

export type CompanionSyncPayload = {
  /** ISO ts of the client's last successful hydrate; null = first sync. */
  lastSyncedAt: string | null;
  activeSpecies: PetSpecies | null;
  activeSpeciesUpdatedAt: string | null;
  foodGrantedByDate: Record<string, number>;
  foodGiftsReceived: Record<string, number>;
  foodSpentEvents: Record<string, string[]>;
  foodCarryover: number;
  giftOverflowBondByDate: Record<string, number>;
  allDoneBonusDates: Record<string, boolean>;
  lastSeenDate: string | null;
  pendingGift: boolean;
  pets: Partial<Record<PetSpecies, CompanionPetPayload>>;
};

// ---------------------------------------------------------------------------
// Server snapshot (get_sync_snapshot / merge_companion_state return shapes)
// ---------------------------------------------------------------------------

export type ServerHabit = {
  key: string;
  name: string;
  category: string;
  maxScore: number;
  active: boolean;
  description: string;
  sortOrder: number;
  clientUpdatedAt: string | null;
  deletedAt: string | null;
};

export type ServerHabitLog = {
  habitKey: string;
  /** YYYY-MM-DD */
  date: string;
  done: boolean;
  mutatedAt: string;
};

export type ServerCompanionPet = CompanionPetPayload & {
  /** null = never reset. Newer than the client's lastSyncedAt ⇒ server wins wholesale. */
  resetAt: string | null;
};

export type ServerCompanionState = Omit<CompanionSyncPayload, "lastSyncedAt" | "pets"> & {
  pets: Partial<Record<PetSpecies, ServerCompanionPet>>;
};

export type ServerSnapshot = {
  habits: ServerHabit[];
  logs: ServerHabitLog[];
  /** null until the user's first merge_companion_state call. */
  companion: ServerCompanionState | null;
  /**
   * Server-clock now() at snapshot time — the client persists this as its
   * lastSyncedAt watermark. Reset supremacy compares reset_at (server clock)
   * against it, so a client-clock stamp would let skew resurrect resets.
   * Optional only for old deployed schemas; the engine falls back to now().
   */
  serverTime?: string;
};

// ---------------------------------------------------------------------------
// Transport contracts (implemented by src/lib/server/sync-actions.ts;
// injected into the engine so it stays testable without Next.js)
// ---------------------------------------------------------------------------

export type PushOutcome =
  | { status: "applied" }
  /** Dropped from the queue + logged locally — never blocks later mutations (spec §2.1). */
  | { status: "permanent-error"; code: string; message: string }
  /** Kept in the queue; the engine retries with backoff. */
  | { status: "retry"; message: string }
  /** Slug collision (spec §2.2): re-key locally with a suffix, rewrite queue, retry. */
  | { status: "rekey-needed"; server: { key: string; name: string } };

export type PushMutationsResult =
  | {
      ok: true;
      /** Aligned by index with the pushed mutations array. */
      outcomes: PushOutcome[];
      /**
       * Merged server companion state when a companionSnapshot was pushed —
       * the client must adopt the returned ledgers + carryover wholesale
       * (server prunes/folds), then re-derive the food balance.
       */
      companion: ServerCompanionState | null;
      /**
       * Server-clock now() from merge_companion_state — persisted as
       * lastSyncedAt when a companion state was adopted (same skew rationale
       * as ServerSnapshot.serverTime). Absent on old deployed schemas.
       */
      serverTime?: string;
    }
  | { ok: false; reason: "no-session" | string };

export type FetchSnapshotResult =
  | { ok: true; snapshot: ServerSnapshot }
  | { ok: false; reason: "no-session" | string };

export type PushMutationsFn = (
  mutations: SyncMutation[],
  companionPayload: CompanionSyncPayload | null
) => Promise<PushMutationsResult>;

export type FetchSnapshotFn = () => Promise<FetchSnapshotResult>;
