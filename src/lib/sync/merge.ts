import { migrateHabitFields } from "@/components/dashboard/habit-migration";
import type { LogEntry } from "@/components/dashboard/habit-model";
import { habitIcon } from "@/lib/defaults";
import { clamp } from "@/lib/utils";
import {
  FOOD_CAP,
  deriveFoodBalance,
  rekeyHabit,
  type CompanionPetState,
  type CompanionState,
  type DashboardDayRecord,
  type DashboardHabit,
  type DashboardState,
  type HabitTombstone,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";

import { rekeyShadowCells } from "./shadow";
import { compareTs, tsToMs } from "./time";
import type {
  CompanionSyncPayload,
  ServerCompanionPet,
  ServerCompanionState,
  ServerHabit,
  ServerHabitLog,
  ServerSnapshot,
  ShadowMap,
  SyncMutation
} from "./types";

/**
 * Pure merge functions (spec §2.4) — no IO, no clocks. Everything the sync
 * engine decides is decided here so it can be unit-tested exhaustively.
 *
 * Scope guard: monotonic/no-decay applies to REWARD state (growth/bond/ledgers)
 * only. Raw completions are user-editable data — an untick is legitimate and
 * must propagate (per-cell LWW), it is never "protected".
 */

const PET_SPECIES: readonly PetSpecies[] = ["dog", "cat"];

export type ShadowUpdate = { date: string; habitKey: string; mutatedAt: string };

export type RekeyInstruction = { oldKey: string; newKey: string };

export type MergeResult = {
  state: DashboardState;
  /**
   * Stamps for cells the server won — fold into the shadow map AFTER applying
   * `rekeys` to it (rekeys move local stamps out of the server key's way first).
   */
  shadowUpdates: ShadowUpdate[];
  /** Slug collisions resolved locally: rewrite queue + shadow map with these. */
  rekeys: RekeyInstruction[];
  /**
   * True when the merged companion carries information the server does not
   * have yet — the engine should enqueue a companionSnapshot push.
   */
  companionAheadOfServer: boolean;
};

/** Suffix re-key, same idiom as addHabitToState ("custom_doc_sach_2", _3, ...). */
export function nextAvailableKey(baseKey: string, taken: ReadonlySet<string>): string {
  let suffix = 2;
  let candidate = `${baseKey}_${suffix}`;

  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${baseKey}_${suffix}`;
  }

  return candidate;
}

/**
 * Hydrate merge: local ⊕ server (spec §2.4).
 *
 * `pendingMutations` (the current sync queue) supplies the LOCAL side's habit
 * timestamps: a queued upsertHabit's clientTs is the only client-side stamp a
 * habit edit has (DashboardHabit itself carries none — a habit with no pending
 * edit merges as epoch, i.e. server fields win). A queued CREATE
 * (expectCreate) whose key exists live on the server under a different name is
 * a slug collision → the local habit is re-keyed, never silently merged.
 */
export function mergeServerIntoLocal(
  local: DashboardState,
  server: ServerSnapshot,
  shadow: ShadowMap,
  lastSyncedAt: string | null,
  pendingMutations: readonly SyncMutation[] = []
): MergeResult {
  const pendingUpserts = new Map<string, { clientTs: string; expectCreate: boolean }>();

  pendingMutations.forEach((mutation) => {
    if (mutation.kind === "upsertHabit") {
      pendingUpserts.set(mutation.habit.key, {
        clientTs: mutation.clientTs,
        expectCreate: mutation.expectCreate === true
      });
    }
  });

  // ---- 1. Slug collisions: re-key local habits out of the server key's way ----
  let state = local;
  const rekeys: RekeyInstruction[] = [];
  const serverKeys = new Set(server.habits.map((habit) => habit.key));

  server.habits.forEach((serverHabit) => {
    if (serverHabit.deletedAt !== null) return;

    const localHabit = state.habits.find((habit) => habit.id === serverHabit.key);
    const pending = pendingUpserts.get(serverHabit.key);

    if (localHabit && pending?.expectCreate && localHabit.name !== serverHabit.name) {
      const taken = new Set<string>([
        ...state.habits.map((habit) => habit.id),
        ...serverKeys
      ]);
      const newKey = nextAvailableKey(serverHabit.key, taken);

      state = rekeyHabit(state, serverHabit.key, newKey);
      rekeys.push({ oldKey: serverHabit.key, newKey });
      serverKeys.add(newKey);
    }
  });

  // After a slug collision, stamps recorded under the colliding key belong to
  // OUR habit (now at newKey) — the server's habit under oldKey merges vs epoch.
  const effectiveShadow = rekeys.reduce(
    (map, rekey) => rekeyShadowCells(map, rekey.oldKey, rekey.newKey),
    shadow
  );

  // ---- 2. Habits: union by key, tombstones, per-field LWW ----
  const tombstones = new Map<string, string>();

  state.deletedHabits.forEach((tombstone) => {
    const existing = tombstones.get(tombstone.key);

    if (!existing || compareTs(tombstone.deletedAt, existing) > 0) {
      tombstones.set(tombstone.key, tombstone.deletedAt);
    }
  });

  const habitsByKey = new Map(state.habits.map((habit) => [habit.id, habit]));
  const removedKeys = new Set<string>();
  const fieldUpdates = new Map<string, DashboardHabit>();
  const additions: Array<{ habit: DashboardHabit; sortOrder: number }> = [];

  server.habits.forEach((serverHabit) => {
    const key = serverHabit.key;
    const localHabit = habitsByKey.get(key);
    const pending = pendingUpserts.get(key);

    if (serverHabit.deletedAt !== null) {
      // Server tombstone: wins over anything strictly older than deletedAt.
      if (localHabit) {
        const localTs = pending?.clientTs ?? null;

        if (compareTs(localTs, serverHabit.deletedAt) > 0) {
          return; // local re-create/edit is newer — keep it, the push re-creates server-side
        }

        removedKeys.add(key);
      }

      const existing = tombstones.get(key);

      if (!existing || compareTs(serverHabit.deletedAt, existing) > 0) {
        tombstones.set(key, serverHabit.deletedAt);
      }

      return;
    }

    // Live server habit.
    const localTombstoneTs = tombstones.get(key) ?? null;

    if (!localHabit) {
      // Ties go to the tombstone, mirroring delete_habit server-side.
      if (localTombstoneTs !== null && compareTs(localTombstoneTs, serverHabit.clientUpdatedAt) >= 0) {
        return; // our pending delete wins — do not resurrect
      }

      tombstones.delete(key); // server re-created/edited after our tombstone
      additions.push({ habit: toDashboardHabit(serverHabit), sortOrder: serverHabit.sortOrder });

      return;
    }

    // Both live: field-level LWW — local stamp is the pending edit's clientTs
    // (epoch when no local edit is in flight, so server fields win).
    const localTs = pending?.clientTs ?? null;

    if (compareTs(serverHabit.clientUpdatedAt, localTs) > 0) {
      fieldUpdates.set(key, applyServerHabitFields(localHabit, serverHabit));
    }

    if (localTombstoneTs !== null && compareTs(serverHabit.clientUpdatedAt, localTombstoneTs) >= 0) {
      tombstones.delete(key); // the habit outlived our old tombstone on both sides
    }
  });

  additions.sort((a, b) => a.sortOrder - b.sortOrder);

  const habits = [
    ...state.habits
      .filter((habit) => !removedKeys.has(habit.id))
      .map((habit) => fieldUpdates.get(habit.id) ?? habit),
    ...additions.map((entry) => entry.habit)
  ];
  const liveKeys = new Set(habits.map((habit) => habit.id));

  // ---- 3. Completions: per-cell LWW (server wins iff strictly newer; ties → tick) ----
  let records = state.records;

  if (removedKeys.size > 0) {
    records = pruneRecordKeys(records, removedKeys);
  }

  const shadowUpdates: ShadowUpdate[] = [];
  const nextRecords: Record<string, DashboardDayRecord> = { ...records };
  let recordsChanged = false;

  server.logs.forEach((log) => {
    // Logs of tombstoned (or never-adopted) habits are pruned during merge.
    if (!liveKeys.has(log.habitKey)) return;

    const stamp = effectiveShadow[log.date]?.[log.habitKey] ?? null;
    const cmp = compareTs(log.mutatedAt, stamp);
    const serverWins = cmp > 0 || (cmp === 0 && log.done);

    if (!serverWins) return;

    const record = nextRecords[log.date] ?? { date: log.date, entries: {}, completions: {} };
    // One LWW stamp per cell: winning brings value, completedAt and done
    // across together. serverEntry() handles a server that only knows done.
    const previous = record.entries[log.habitKey];

    nextRecords[log.date] = {
      date: log.date,
      entries: { ...record.entries, [log.habitKey]: serverEntry(log, previous) },
      completions: { ...record.completions, [log.habitKey]: log.done }
    };
    recordsChanged = true;
    shadowUpdates.push({ date: log.date, habitKey: log.habitKey, mutatedAt: log.mutatedAt });
  });

  // ---- 4. Companion: monotonic reward merge + reset supremacy ----
  const companion = mergeCompanionWithServer(state.companion, server.companion, lastSyncedAt);
  const companionAheadOfServer =
    server.companion === null
      ? companionHasData(companion)
      : companionSignature(companion) !== companionSignature(server.companion);

  const deletedHabits: HabitTombstone[] = [...tombstones.entries()].map(([key, deletedAt]) => ({
    key,
    deletedAt
  }));

  // seedCutoverDate, bestStreakFloor and events are NEVER touched by merge
  // (they ride along from `state` untouched) and never uploaded.
  return {
    state: {
      ...state,
      habits,
      records: recordsChanged ? nextRecords : records,
      deletedHabits,
      companion
    },
    shadowUpdates,
    rekeys,
    companionAheadOfServer
  };
}

/**
 * Builds the merge_companion_state payload from the CURRENT state at flush
 * time. The derived `food` cache is deliberately absent — balance is never
 * sent, never merged (spec §2.3).
 */
export function buildCompanionSyncPayload(
  state: DashboardState,
  lastSyncedAt: string | null
): CompanionSyncPayload {
  const companion = state.companion;
  const pets: CompanionSyncPayload["pets"] = {};

  PET_SPECIES.forEach((species) => {
    const pet = companion.pets[species];

    if (!pet) return;

    pets[species] = {
      name: pet.name,
      nameUpdatedAt: pet.nameUpdatedAt,
      adoptedOn: pet.adoptedOn,
      growthDays: pet.growthDays,
      bond: pet.bond,
      lastGrowthDate: pet.lastGrowthDate,
      petsToday: pet.petsToday,
      petsTodayDate: pet.petsTodayDate
    };
  });

  return {
    lastSyncedAt,
    activeSpecies: companion.activeSpecies,
    activeSpeciesUpdatedAt: companion.activeSpeciesUpdatedAt,
    foodGrantedByDate: companion.foodGrantedByDate,
    foodGiftsReceived: companion.foodGiftsReceived,
    foodSpentEvents: companion.foodSpentEvents,
    foodCarryover: companion.foodCarryover,
    giftOverflowBondByDate: companion.giftOverflowBondByDate,
    allDoneBonusDates: companion.allDoneBonusDates,
    lastSeenDate: companion.lastSeenDate,
    pendingGift: companion.pendingGift,
    pets
  };
}

/**
 * Applies the state merge_companion_state RETURNED after a push. Contract: the
 * client adopts the returned ledgers + carryover wholesale (the server may
 * have folded >30-day days into carryover — union-merging would resurrect
 * pruned days and double-count them). Local ledger entries born BETWEEN
 * payload build and the response (`sent` is the diff base — e.g. a feed during
 * the network round-trip) are re-added on top, so no local spend is ever lost.
 * Pets/activeSpecies/lastSeen re-merge under the normal laws, which protects
 * mid-flight bond/growth increments (no local decay).
 */
export function applyCompanionPushResult(
  local: DashboardState,
  sent: CompanionSyncPayload,
  returned: ServerCompanionState,
  lastSyncedAt: string | null
): DashboardState {
  const current = local.companion;

  const merged: CompanionState = {
    ...current,
    pets: mergePets(current.pets, returned.pets, lastSyncedAt),
    ...mergeActiveSpecies(current, returned),
    ...mergeSeenAndGift(current, returned),
    foodGrantedByDate: adoptNumberLedger(
      returned.foodGrantedByDate,
      sent.foodGrantedByDate,
      current.foodGrantedByDate
    ),
    foodGiftsReceived: adoptNumberLedger(
      returned.foodGiftsReceived,
      sent.foodGiftsReceived,
      current.foodGiftsReceived
    ),
    giftOverflowBondByDate: adoptNumberLedger(
      returned.giftOverflowBondByDate,
      sent.giftOverflowBondByDate,
      current.giftOverflowBondByDate
    ),
    foodSpentEvents: adoptSpentLedger(
      returned.foodSpentEvents,
      sent.foodSpentEvents,
      current.foodSpentEvents
    ),
    allDoneBonusDates: adoptTrueLedger(
      returned.allDoneBonusDates,
      sent.allDoneBonusDates,
      current.allDoneBonusDates
    ),
    foodCarryover:
      current.foodCarryover === sent.foodCarryover
        ? clamp(returned.foodCarryover, 0, FOOD_CAP)
        : clamp(Math.max(returned.foodCarryover, current.foodCarryover), 0, FOOD_CAP)
  };

  merged.food = deriveFoodBalance(merged);

  return { ...local, companion: merged };
}

// ---------------------------------------------------------------------------
// Companion merge laws (shared by hydrate merge and push-result adoption)
// ---------------------------------------------------------------------------

function mergeCompanionWithServer(
  local: CompanionState,
  server: ServerCompanionState | null,
  lastSyncedAt: string | null
): CompanionState {
  if (server === null) return local;

  const merged: CompanionState = {
    ...local,
    pets: mergePets(local.pets, server.pets, lastSyncedAt),
    ...mergeActiveSpecies(local, server),
    ...mergeSeenAndGift(local, server),
    foodGrantedByDate: unionMaxLedger(local.foodGrantedByDate, server.foodGrantedByDate),
    foodGiftsReceived: unionMaxLedger(local.foodGiftsReceived, server.foodGiftsReceived),
    giftOverflowBondByDate: unionMaxLedger(
      local.giftOverflowBondByDate,
      server.giftOverflowBondByDate
    ),
    foodSpentEvents: unionSpentLedger(local.foodSpentEvents, server.foodSpentEvents),
    allDoneBonusDates: unionTrueLedger(local.allDoneBonusDates, server.allDoneBonusDates),
    foodCarryover: clamp(Math.max(local.foodCarryover, server.foodCarryover), 0, FOOD_CAP)
  };

  // Balance is DERIVED after merging ledgers — never merged itself (spec §2.3).
  merged.food = deriveFoodBalance(merged);

  return merged;
}

function mergePets(
  localPets: Partial<Record<PetSpecies, CompanionPetState>>,
  serverPets: Partial<Record<PetSpecies, ServerCompanionPet>>,
  lastSyncedAt: string | null
): Partial<Record<PetSpecies, CompanionPetState>> {
  const merged: Partial<Record<PetSpecies, CompanionPetState>> = { ...localPets };

  PET_SPECIES.forEach((species) => {
    const serverPet = serverPets[species];
    const localPet = localPets[species];

    if (!serverPet) return; // local-only pet stays (it will be pushed)

    // Reset supremacy (spec §2.4): a server reset newer than our last sync wins
    // wholesale — a stale device must not resurrect pre-reset values. With
    // lastSyncedAt = null (first sync), any reset wins.
    if (serverPet.resetAt !== null && compareTs(serverPet.resetAt, lastSyncedAt) > 0) {
      merged[species] = petFromServer(species, serverPet);
      return;
    }

    if (!localPet) {
      merged[species] = petFromServer(species, serverPet);
      return;
    }

    // Per-field LWW for name by its own stamp; tie → server wins (spec §2.4).
    const serverNameWins = compareTs(serverPet.nameUpdatedAt, localPet.nameUpdatedAt) >= 0;
    // petsToday follows the newer petsTodayDate; same day → max (mirrors SQL).
    const localDay = localPet.petsTodayDate ?? "";
    const serverDay = serverPet.petsTodayDate ?? "";
    let petsToday = localPet.petsToday;
    let petsTodayDate = localPet.petsTodayDate;

    if (serverDay > localDay) {
      petsToday = serverPet.petsToday;
      petsTodayDate = serverPet.petsTodayDate;
    } else if (serverDay === localDay) {
      petsToday = Math.max(localPet.petsToday, serverPet.petsToday);
    }

    merged[species] = {
      species,
      name: serverNameWins ? serverPet.name : localPet.name,
      nameUpdatedAt: serverNameWins ? serverPet.nameUpdatedAt : localPet.nameUpdatedAt,
      adoptedOn: minDate(localPet.adoptedOn, serverPet.adoptedOn),
      growthDays: Math.max(localPet.growthDays, serverPet.growthDays),
      bond: Math.max(localPet.bond, serverPet.bond),
      lastGrowthDate: maxNullableDate(localPet.lastGrowthDate, serverPet.lastGrowthDate),
      petsToday,
      petsTodayDate
    };
  });

  return merged;
}

function mergeActiveSpecies(
  local: Pick<CompanionState, "activeSpecies" | "activeSpeciesUpdatedAt">,
  server: Pick<ServerCompanionState, "activeSpecies" | "activeSpeciesUpdatedAt">
): Pick<CompanionState, "activeSpecies" | "activeSpeciesUpdatedAt"> {
  // Server species is null → local always stands (mirror of the SQL first-sync
  // exception). Otherwise LWW by the per-field stamp; tie → server wins; a null
  // local species yields to any real server species.
  if (server.activeSpecies === null) {
    return {
      activeSpecies: local.activeSpecies,
      activeSpeciesUpdatedAt: local.activeSpeciesUpdatedAt
    };
  }

  if (
    local.activeSpecies === null ||
    compareTs(server.activeSpeciesUpdatedAt, local.activeSpeciesUpdatedAt) >= 0
  ) {
    return {
      activeSpecies: server.activeSpecies,
      activeSpeciesUpdatedAt: server.activeSpeciesUpdatedAt
    };
  }

  return {
    activeSpecies: local.activeSpecies,
    activeSpeciesUpdatedAt: local.activeSpeciesUpdatedAt
  };
}

function mergeSeenAndGift(
  local: Pick<CompanionState, "lastSeenDate" | "pendingGift">,
  server: Pick<ServerCompanionState, "lastSeenDate" | "pendingGift">
): Pick<CompanionState, "lastSeenDate" | "pendingGift"> {
  const localSeen = local.lastSeenDate ?? "";
  const serverSeen = server.lastSeenDate ?? "";

  if (serverSeen > localSeen) {
    return { lastSeenDate: server.lastSeenDate, pendingGift: server.pendingGift };
  }

  if (serverSeen === localSeen) {
    return {
      lastSeenDate: local.lastSeenDate,
      pendingGift: local.pendingGift || server.pendingGift
    };
  }

  return { lastSeenDate: local.lastSeenDate, pendingGift: local.pendingGift };
}

function petFromServer(species: PetSpecies, pet: ServerCompanionPet): CompanionPetState {
  return {
    species,
    name: pet.name,
    adoptedOn: pet.adoptedOn,
    growthDays: pet.growthDays,
    bond: pet.bond,
    lastGrowthDate: pet.lastGrowthDate,
    petsToday: pet.petsToday,
    petsTodayDate: pet.petsTodayDate,
    nameUpdatedAt: pet.nameUpdatedAt
  };
}

// ---------------------------------------------------------------------------
// Ledger merges
// ---------------------------------------------------------------------------

/** Union of keys, value = max. The hydrate-side mirror of jsonb_union_max. */
function unionMaxLedger(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = {};

  Object.keys(a).forEach((key) => {
    if (Number.isFinite(a[key])) out[key] = a[key];
  });
  Object.keys(b).forEach((key) => {
    if (!Number.isFinite(b[key])) return;
    out[key] = key in out ? Math.max(out[key], b[key]) : b[key];
  });

  return out;
}

/**
 * Union of per-day spend-event id SETS — the only merge shape under which a
 * spend can never be refunded by a stale replica (spec §2.3).
 */
function unionSpentLedger(
  a: Record<string, string[]>,
  b: Record<string, string[]>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const dates = new Set([...Object.keys(a), ...Object.keys(b)]);

  dates.forEach((date) => {
    const ids = new Set<string>();

    (Array.isArray(a[date]) ? a[date] : []).forEach((id) => {
      if (typeof id === "string") ids.add(id);
    });
    (Array.isArray(b[date]) ? b[date] : []).forEach((id) => {
      if (typeof id === "string") ids.add(id);
    });

    if (ids.size > 0) out[date] = [...ids].sort();
  });

  return out;
}

function unionTrueLedger(
  a: Record<string, boolean>,
  b: Record<string, boolean>
): Record<string, boolean> {
  const out: Record<string, boolean> = {};

  Object.keys(a).forEach((key) => {
    if (a[key]) out[key] = true;
  });
  Object.keys(b).forEach((key) => {
    if (b[key]) out[key] = true;
  });

  return out;
}

/**
 * Push-result adoption: server verdict wholesale, EXCEPT keys whose local
 * value moved since `sent` (mid-flight grants) — those re-max on top.
 */
function adoptNumberLedger(
  returned: Record<string, number>,
  sent: Record<string, number>,
  current: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = {};

  Object.keys(returned).forEach((key) => {
    if (Number.isFinite(returned[key])) out[key] = returned[key];
  });
  Object.keys(current).forEach((key) => {
    if (!Number.isFinite(current[key])) return;
    if (sent[key] === current[key]) return; // unchanged since send: server's verdict (incl. pruning) stands

    out[key] = Math.max(out[key] ?? 0, current[key]);
  });

  return out;
}

function adoptSpentLedger(
  returned: Record<string, string[]>,
  sent: Record<string, string[]>,
  current: Record<string, string[]>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  Object.keys(returned).forEach((date) => {
    const ids = (Array.isArray(returned[date]) ? returned[date] : []).filter(
      (id): id is string => typeof id === "string"
    );

    if (ids.length > 0) out[date] = [...new Set(ids)].sort();
  });

  Object.keys(current).forEach((date) => {
    const sentIds = new Set(sent[date] ?? []);
    const newIds = (current[date] ?? []).filter(
      (id) => typeof id === "string" && !sentIds.has(id)
    );

    if (newIds.length === 0) return;

    out[date] = [...new Set([...(out[date] ?? []), ...newIds])].sort();
  });

  return out;
}

function adoptTrueLedger(
  returned: Record<string, boolean>,
  sent: Record<string, boolean>,
  current: Record<string, boolean>
): Record<string, boolean> {
  const out: Record<string, boolean> = {};

  Object.keys(returned).forEach((key) => {
    if (returned[key]) out[key] = true;
  });
  Object.keys(current).forEach((key) => {
    if (current[key] && !(key in sent)) out[key] = true;
  });

  return out;
}

// ---------------------------------------------------------------------------
// "Is local ahead of the server?" — canonical signature over the synced subset
// ---------------------------------------------------------------------------

type CompanionComparable = {
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
  pets: Partial<Record<PetSpecies, Omit<CompanionPetState, "species"> & { species?: PetSpecies }>>;
};

function companionSignature(companion: CompanionComparable): string {
  const pets: Record<string, unknown> = {};

  PET_SPECIES.forEach((species) => {
    const pet = companion.pets[species];

    if (!pet) return;

    pets[species] = {
      name: pet.name,
      nameUpdatedAt: tsToMs(pet.nameUpdatedAt),
      adoptedOn: pet.adoptedOn,
      growthDays: pet.growthDays,
      bond: pet.bond,
      lastGrowthDate: pet.lastGrowthDate,
      petsToday: pet.petsToday,
      petsTodayDate: pet.petsTodayDate
    };
  });

  return stableStringify({
    activeSpecies: companion.activeSpecies,
    activeSpeciesUpdatedAt: tsToMs(companion.activeSpeciesUpdatedAt),
    foodCarryover: companion.foodCarryover,
    foodGrantedByDate: companion.foodGrantedByDate,
    foodGiftsReceived: companion.foodGiftsReceived,
    foodSpentEvents: normalizeSpent(companion.foodSpentEvents),
    giftOverflowBondByDate: companion.giftOverflowBondByDate,
    allDoneBonusDates: unionTrueLedger(companion.allDoneBonusDates, {}),
    lastSeenDate: companion.lastSeenDate,
    pendingGift: companion.pendingGift,
    pets
  });
}

function companionHasData(companion: CompanionState): boolean {
  return (
    Object.keys(companion.pets).length > 0 ||
    companion.activeSpecies !== null ||
    companion.foodCarryover > 0 ||
    companion.lastSeenDate !== null ||
    companion.pendingGift ||
    Object.keys(companion.foodGrantedByDate).length > 0 ||
    Object.keys(companion.foodGiftsReceived).length > 0 ||
    Object.keys(companion.foodSpentEvents).length > 0 ||
    Object.keys(companion.giftOverflowBondByDate).length > 0 ||
    Object.keys(companion.allDoneBonusDates).length > 0
  );
}

function normalizeSpent(spent: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  Object.keys(spent).forEach((date) => {
    const ids = (Array.isArray(spent[date]) ? spent[date] : []).filter(
      (id): id is string => typeof id === "string"
    );

    if (ids.length > 0) out[date] = [...new Set(ids)].sort();
  });

  return out;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`
      );

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}

// ---------------------------------------------------------------------------
// Habit/record helpers
// ---------------------------------------------------------------------------

/**
 * The cell the server just won, as a LogEntry. One LWW stamp covers the whole
 * cell, so when the server wins it wins value + completedAt + done together.
 *
 * `value === null` means the server genuinely does not know the reading, only
 * the boolean — the row predates U1c, or the deployed schema does. Then the
 * pre-U1c contract still holds: a remote tick preserves whatever richer value
 * this device already had, so "8 glasses" is never flattened to a bare 1.
 */
function serverEntry(log: ServerHabitLog, previous: LogEntry | undefined): LogEntry {
  if (log.value === null) return log.done ? (previous ?? { value: 1 }) : { value: 0 };

  const entry: LogEntry = { value: Math.max(0, Math.trunc(log.value)) };

  if (log.completedAt) entry.completedAt = log.completedAt;

  return entry;
}

/**
 * A habit arriving from another device. The server's v3 fields go into
 * `migrateHabitFields` RAW: that is the single place which knows how to
 * normalise every one of them (an unknown tracking type falls back to check,
 * empty repeatDays means all seven, "Cả ngày" is exclusive). Validating here
 * as well would be a second rule set to keep in step with the first.
 */
function toDashboardHabit(habit: ServerHabit): DashboardHabit {
  return migrateHabitFields({
    id: habit.key,
    key: habit.key,
    name: habit.name,
    category: habit.category,
    maxScore: habit.maxScore,
    description: habit.description,
    iconName: habitIcon(habit.key, habit.category),
    ...serverV3Fields(habit)
  });
}

function applyServerHabitFields(local: DashboardHabit, server: ServerHabit): DashboardHabit {
  return migrateHabitFields({
    ...local,
    name: server.name,
    category: server.category,
    maxScore: server.maxScore,
    description: server.description,
    iconName: habitIcon(local.key, server.category),
    ...serverV3Fields(server)
  });
}

/**
 * The v3 slice of a server habit, still raw. `null` becomes `undefined`
 * because the wire spells "absent" as null while DashboardHabit spells it as
 * an absent optional — migrateHabitFields reads the latter.
 */
function serverV3Fields(habit: ServerHabit) {
  return {
    icon: habit.icon,
    trackingType: habit.trackingType,
    target: habit.target,
    unit: habit.unit ?? undefined,
    steps: habit.steps,
    repeatDays: habit.repeatDays,
    timesOfDay: habit.timesOfDay,
    scheduledAt: habit.scheduledAt ?? undefined,
    color: habit.color,
    motivation: habit.motivation,
    pausedAt: habit.pausedAt ?? undefined,
    archivedAt: habit.archivedAt ?? undefined
  };
}

function pruneRecordKeys(
  records: Record<string, DashboardDayRecord>,
  keys: ReadonlySet<string>
): Record<string, DashboardDayRecord> {
  const next: Record<string, DashboardDayRecord> = {};

  Object.keys(records).forEach((date) => {
    const record = records[date];
    const hasAny = [...Object.keys(record.entries), ...Object.keys(record.completions)].some(
      (key) => keys.has(key)
    );

    if (!hasAny) {
      next[date] = record;
      return;
    }

    const entries = { ...record.entries };
    const completions = { ...record.completions };

    keys.forEach((key) => {
      delete entries[key];
      delete completions[key];
    });
    next[date] = { ...record, entries, completions };
  });

  return next;
}

function minDate(a: string, b: string): string {
  return a <= b ? a : b;
}

function maxNullableDate(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;

  return a >= b ? a : b;
}
