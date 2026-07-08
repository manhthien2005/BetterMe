"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";
import type {
  CompanionSyncPayload,
  FetchSnapshotResult,
  PushMutationsResult,
  PushOutcome,
  ServerCompanionPet,
  ServerCompanionState,
  ServerHabit,
  ServerHabitLog,
  ServerSnapshot,
  SyncMutation
} from "@/lib/sync/types";
import type { PetSpecies } from "@/components/dashboard/dashboard-data";

/**
 * Sync server actions (spec §2.1). Unlike src/lib/server/actions.ts these
 * NEVER redirect or throw — sync is background-only, so every failure comes
 * back as data: { ok: false, reason } for transport-level failures, or a
 * per-mutation outcome so the client queue can drop permanent failures
 * without head-of-line blocking. Under the dev auth bypass (no Supabase
 * session) both no-op gracefully with { ok: false, reason: "no-session" }.
 */

// SQLSTATEs that mean "this mutation can never succeed" — the client drops it
// from the queue and moves on (spec §2.1). P0002/P0003/P0004 are raised
// explicitly by the RPCs; the constraint/coercion class (23514 check_violation,
// 23502 not_null, 22P02 invalid text, 22003 numeric overflow, 22007/22008
// datetime) covers malformed payload values that fail table constraints (e.g.
// habits.max_score check) — retrying them can never succeed. 23505
// unique_violation deliberately stays retryable: the documented
// concurrent-create race resolves on the next pass.
const PERMANENT_ERROR_CODES = new Set([
  "P0002",
  "P0003",
  "P0004",
  "23514",
  "23502",
  "22P02",
  "22003",
  "22007",
  "22008"
]);

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getAuthedClient(): Promise<SupabaseServerClient | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return supabase;
  } catch {
    // Missing env vars (dev bypass) or cookie store unavailable — no session.
    return null;
  }
}

export async function pushMutations(
  mutations: SyncMutation[],
  companionPayload: CompanionSyncPayload | null
): Promise<PushMutationsResult> {
  const supabase = await getAuthedClient();

  if (!supabase) return { ok: false, reason: "no-session" };
  if (!Array.isArray(mutations)) return { ok: false, reason: "bad-request" };

  const outcomes: PushOutcome[] = [];
  // Keys whose earlier mutation in THIS batch failed retryably or needs a
  // re-key: dependent mutations are deferred instead of attempted — otherwise
  // a log for a not-yet-created habit would come back P0002 and be dropped
  // permanently (data loss), or land on the wrong habit after a collision.
  const deferredKeys = new Set<string>();
  let companion: ServerCompanionState | null = null;
  let serverTime: string | undefined;

  for (const mutation of mutations) {
    const key = mutationHabitKey(mutation);

    if (key !== null && deferredKeys.has(key)) {
      outcomes.push({ status: "retry", message: "deferred-behind-failed-upsert" });
      continue;
    }

    const outcome = await applyMutation(supabase, mutation, companionPayload, (merged, time) => {
      companion = merged;
      serverTime = time ?? serverTime;
    });

    if (key !== null && (outcome.status === "retry" || outcome.status === "rekey-needed")) {
      deferredKeys.add(key);
    }

    outcomes.push(outcome);
  }

  return serverTime !== undefined
    ? { ok: true, outcomes, companion, serverTime }
    : { ok: true, outcomes, companion };
}

export async function fetchSyncSnapshot(): Promise<FetchSnapshotResult> {
  const supabase = await getAuthedClient();

  if (!supabase) return { ok: false, reason: "no-session" };

  try {
    const { data, error } = await supabase.rpc("get_sync_snapshot");

    if (error) return { ok: false, reason: error.message || "rpc-failed" };

    return { ok: true, snapshot: parseSnapshot(data ?? null) };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// ---------------------------------------------------------------------------
// Per-mutation dispatch
// ---------------------------------------------------------------------------

async function applyMutation(
  supabase: SupabaseServerClient,
  mutation: SyncMutation,
  companionPayload: CompanionSyncPayload | null,
  onCompanion: (merged: ServerCompanionState, serverTime: string | null) => void
): Promise<PushOutcome> {
  try {
    switch (mutation.kind) {
      case "setHabitLog": {
        const { error } = await supabase.rpc("apply_habit_log", {
          p_habit_key: mutation.habitKey,
          p_date: mutation.date,
          p_done: mutation.done,
          p_mutated_at: mutation.clientTs
        });

        return error ? classifyRpcError(error) : { status: "applied" };
      }
      case "upsertHabit": {
        const { data, error } = await supabase.rpc("upsert_habit", {
          p_key: mutation.habit.key,
          p_name: mutation.habit.name,
          p_category: mutation.habit.category,
          p_max_score: mutation.habit.maxScore,
          p_active: mutation.habit.active,
          p_description: mutation.habit.description,
          p_sort_order: mutation.habit.sortOrder,
          p_client_ts: mutation.clientTs,
          p_expect_create: mutation.expectCreate === true
        });

        if (error) return classifyRpcError(error);

        const result = asObject(data);

        if (result?.status === "name-collision") {
          const server = asObject(result.server);

          return {
            status: "rekey-needed",
            server: {
              key: asString(server?.key) ?? mutation.habit.key,
              name: asString(server?.name) ?? ""
            }
          };
        }

        // inserted | updated | stale-skipped | tombstone-blocked are all
        // terminal successes for the queue.
        return { status: "applied" };
      }
      case "deleteHabit": {
        const { error } = await supabase.rpc("delete_habit", {
          p_key: mutation.habitKey,
          p_deleted_at: mutation.deletedAt
        });

        // "deleted" and "skipped" both mean: drop the mutation.
        return error ? classifyRpcError(error) : { status: "applied" };
      }
      case "companionSnapshot": {
        if (!companionPayload) return { status: "applied" }; // nothing to send

        const { data, error } = await supabase.rpc("merge_companion_state", {
          p: companionPayload as unknown as Json
        });

        if (error) return classifyRpcError(error);

        const merged = parseCompanion(data ?? null);

        if (merged) onCompanion(merged, asString(asObject(data ?? null)?.serverTime));

        return { status: "applied" };
      }
    }
  } catch (error) {
    return { status: "retry", message: error instanceof Error ? error.message : "network" };
  }
}

function mutationHabitKey(mutation: SyncMutation): string | null {
  switch (mutation.kind) {
    case "setHabitLog":
    case "deleteHabit":
      return mutation.habitKey;
    case "upsertHabit":
      return mutation.habit.key;
    case "companionSnapshot":
      return null;
  }
}

function classifyRpcError(error: { code?: string | null; message?: string | null }): PushOutcome {
  const code = error.code ?? "";

  if (PERMANENT_ERROR_CODES.has(code)) {
    return { status: "permanent-error", code, message: error.message ?? "" };
  }

  // Everything else — network, 5xx, 23505 concurrent-create races, deadlocks,
  // P0001 auth hiccups — is retryable with backoff. Stale LWW writes are not
  // errors at all (the RPCs return success for them).
  return { status: "retry", message: error.message ?? "rpc-failed" };
}

// ---------------------------------------------------------------------------
// Defensive jsonb parsing (the RPC shapes are ours, but never trust the wire)
// ---------------------------------------------------------------------------

type JsonObject = { [key: string]: Json | undefined };

function asObject(value: Json | null | undefined): JsonObject | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) return value;

  return null;
}

function asString(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: Json | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: Json | undefined, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberMap(value: Json | undefined): Record<string, number> {
  const obj = asObject(value ?? null);
  const out: Record<string, number> = {};

  if (!obj) return out;

  Object.keys(obj).forEach((key) => {
    const entry = obj[key];

    if (typeof entry === "number" && Number.isFinite(entry)) out[key] = entry;
  });

  return out;
}

function booleanMap(value: Json | undefined): Record<string, boolean> {
  const obj = asObject(value ?? null);
  const out: Record<string, boolean> = {};

  if (!obj) return out;

  Object.keys(obj).forEach((key) => {
    if (obj[key] === true) out[key] = true;
  });

  return out;
}

function idSetMap(value: Json | undefined): Record<string, string[]> {
  const obj = asObject(value ?? null);
  const out: Record<string, string[]> = {};

  if (!obj) return out;

  Object.keys(obj).forEach((key) => {
    const entry = obj[key];

    if (!Array.isArray(entry)) return;

    const ids = entry.filter((id): id is string => typeof id === "string");

    if (ids.length > 0) out[key] = ids;
  });

  return out;
}

function parsePet(value: Json | undefined): ServerCompanionPet | null {
  const obj = asObject(value ?? null);

  if (!obj) return null;

  const adoptedOn = asString(obj.adoptedOn);

  if (adoptedOn === null) return null;

  return {
    name: asString(obj.name) ?? "",
    nameUpdatedAt: asString(obj.nameUpdatedAt),
    adoptedOn,
    growthDays: asNumber(obj.growthDays, 0),
    bond: asNumber(obj.bond, 0),
    lastGrowthDate: asString(obj.lastGrowthDate),
    petsToday: asNumber(obj.petsToday, 0),
    petsTodayDate: asString(obj.petsTodayDate),
    resetAt: asString(obj.resetAt)
  };
}

function parseCompanion(value: Json | null): ServerCompanionState | null {
  const obj = asObject(value);

  if (!obj) return null;

  const petsObj = asObject(obj.pets ?? null);
  const pets: Partial<Record<PetSpecies, ServerCompanionPet>> = {};

  (["dog", "cat"] as const).forEach((species) => {
    const pet = parsePet(petsObj?.[species]);

    if (pet) pets[species] = pet;
  });

  const activeSpecies = asString(obj.activeSpecies);

  return {
    activeSpecies: activeSpecies === "dog" || activeSpecies === "cat" ? activeSpecies : null,
    activeSpeciesUpdatedAt: asString(obj.activeSpeciesUpdatedAt),
    foodGrantedByDate: numberMap(obj.foodGrantedByDate),
    foodGiftsReceived: numberMap(obj.foodGiftsReceived),
    foodSpentEvents: idSetMap(obj.foodSpentEvents),
    foodCarryover: asNumber(obj.foodCarryover, 0),
    giftOverflowBondByDate: numberMap(obj.giftOverflowBondByDate),
    allDoneBonusDates: booleanMap(obj.allDoneBonusDates),
    lastSeenDate: asString(obj.lastSeenDate),
    pendingGift: asBoolean(obj.pendingGift, false),
    pets
  };
}

function parseHabit(value: Json): ServerHabit | null {
  const obj = asObject(value);

  if (!obj) return null;

  const key = asString(obj.key);
  const name = asString(obj.name);

  if (key === null || name === null) return null;

  return {
    key,
    name,
    category: asString(obj.category) ?? "",
    maxScore: asNumber(obj.maxScore, 1),
    active: asBoolean(obj.active, true),
    description: asString(obj.description) ?? "",
    sortOrder: asNumber(obj.sortOrder, 0),
    clientUpdatedAt: asString(obj.clientUpdatedAt),
    deletedAt: asString(obj.deletedAt)
  };
}

function parseLog(value: Json): ServerHabitLog | null {
  const obj = asObject(value);

  if (!obj) return null;

  const habitKey = asString(obj.habitKey);
  const date = asString(obj.date);
  const mutatedAt = asString(obj.mutatedAt);

  if (habitKey === null || date === null || mutatedAt === null) return null;

  return { habitKey, date, done: asBoolean(obj.done, false), mutatedAt };
}

function parseSnapshot(value: Json | null): ServerSnapshot {
  const obj = asObject(value);
  const habitsRaw = obj?.habits;
  const logsRaw = obj?.logs;
  const serverTime = asString(obj?.serverTime);

  const snapshot: ServerSnapshot = {
    habits: Array.isArray(habitsRaw)
      ? habitsRaw.map(parseHabit).filter((habit): habit is ServerHabit => habit !== null)
      : [],
    logs: Array.isArray(logsRaw)
      ? logsRaw.map(parseLog).filter((log): log is ServerHabitLog => log !== null)
      : [],
    companion: parseCompanion(obj?.companion ?? null)
  };

  // Old deployed schemas don't return serverTime — leave it absent, the
  // engine falls back to the client clock.
  if (serverTime !== null) snapshot.serverTime = serverTime;

  return snapshot;
}
