import { readJson, writeJson } from "./storage";
import { compareTs } from "./time";
import type { SetHabitLogMutation, SyncMutation } from "./types";

/**
 * Sync queue (spec §2.1): an ordered array of SET-based mutations persisted in
 * localStorage so offline work survives reloads. Pure coalescing rules keep it
 * small and idempotent:
 *   - setHabitLog: one entry per (habitKey, date) cell — replaced by newer.
 *   - companionSnapshot: at most one (payload is built at flush time anyway).
 *   - upsertHabit: one entry per key — replaced, expectCreate is sticky.
 *   - deleteHabit: cancels every queued mutation touching that key (spec §2.4 —
 *     otherwise LWW merge would resurrect orphan completions).
 */

export const SYNC_QUEUE_STORAGE_KEY = "betterme.syncqueue.v1";

export function isSyncMutation(value: unknown): value is SyncMutation {
  if (!value || typeof value !== "object") return false;

  const m = value as Record<string, unknown>;

  switch (m.kind) {
    case "setHabitLog":
      return (
        typeof m.habitKey === "string" &&
        typeof m.date === "string" &&
        typeof m.done === "boolean" &&
        typeof m.clientTs === "string"
      );
    case "upsertHabit": {
      if (typeof m.clientTs !== "string") return false;
      if (!m.habit || typeof m.habit !== "object") return false;

      const habit = m.habit as Record<string, unknown>;

      return (
        typeof habit.key === "string" &&
        typeof habit.name === "string" &&
        typeof habit.category === "string" &&
        typeof habit.maxScore === "number" &&
        typeof habit.active === "boolean" &&
        typeof habit.description === "string" &&
        typeof habit.sortOrder === "number"
      );
    }
    case "deleteHabit":
      return typeof m.habitKey === "string" && typeof m.deletedAt === "string";
    case "companionSnapshot":
      return typeof m.clientTs === "string";
    default:
      return false;
  }
}

/** Corrupt/foreign JSON falls back to [] — the queue self-heals, never throws. */
export function loadQueue(): SyncMutation[] {
  const raw = readJson<unknown>(SYNC_QUEUE_STORAGE_KEY);

  if (!Array.isArray(raw)) return [];

  return raw.filter(isSyncMutation);
}

export function saveQueue(queue: readonly SyncMutation[]): void {
  writeJson(SYNC_QUEUE_STORAGE_KEY, queue);
}

/** True when the mutation references the habit key (companionSnapshot never does). */
export function mutationTouchesHabit(mutation: SyncMutation, habitKey: string): boolean {
  switch (mutation.kind) {
    case "setHabitLog":
    case "deleteHabit":
      return mutation.habitKey === habitKey;
    case "upsertHabit":
      return mutation.habit.key === habitKey;
    case "companionSnapshot":
      return false;
  }
}

/** Pure coalescing enqueue — appends at the tail to preserve causal order. */
export function coalesceEnqueue(
  queue: readonly SyncMutation[],
  mutation: SyncMutation
): SyncMutation[] {
  switch (mutation.kind) {
    case "setHabitLog": {
      const existing = queue.find(
        (m): m is SetHabitLogMutation =>
          m.kind === "setHabitLog" &&
          m.habitKey === mutation.habitKey &&
          m.date === mutation.date
      );

      // Same cell: keep only the newer SET (an out-of-order older write never
      // downgrades the queue).
      if (existing && compareTs(existing.clientTs, mutation.clientTs) > 0) {
        return [...queue];
      }

      return [
        ...queue.filter(
          (m) =>
            !(
              m.kind === "setHabitLog" &&
              m.habitKey === mutation.habitKey &&
              m.date === mutation.date
            )
        ),
        mutation
      ];
    }
    case "companionSnapshot":
      return [...queue.filter((m) => m.kind !== "companionSnapshot"), mutation];
    case "upsertHabit": {
      const existing = queue.find(
        (m) => m.kind === "upsertHabit" && m.habit.key === mutation.habit.key
      );
      // expectCreate is sticky: if the queued mutation was a CREATE that has not
      // reached the server yet, its replacement is still a create (collision
      // detection must stay armed).
      const merged: SyncMutation =
        existing?.kind === "upsertHabit" && existing.expectCreate === true
          ? { ...mutation, expectCreate: true }
          : mutation;

      return [
        ...queue.filter(
          (m) => !(m.kind === "upsertHabit" && m.habit.key === mutation.habit.key)
        ),
        merged
      ];
    }
    case "deleteHabit":
      return [
        ...queue.filter((m) => !mutationTouchesHabit(m, mutation.habitKey)),
        mutation
      ];
  }
}

/** Load → coalesce → save. Returns the new queue. */
export function enqueue(mutation: SyncMutation): SyncMutation[] {
  const queue = coalesceEnqueue(loadQueue(), mutation);

  saveQueue(queue);

  return queue;
}

/** Rewrites every queued mutation from oldKey to newKey (slug-collision re-key, spec §2.2). */
export function rekeyQueueMutations(
  queue: readonly SyncMutation[],
  oldKey: string,
  newKey: string
): SyncMutation[] {
  return queue.map((mutation) => {
    if (!mutationTouchesHabit(mutation, oldKey)) return mutation;

    switch (mutation.kind) {
      case "setHabitLog":
      case "deleteHabit":
        return { ...mutation, habitKey: newKey };
      case "upsertHabit":
        return { ...mutation, habit: { ...mutation.habit, key: newKey } };
      default:
        return mutation;
    }
  });
}
