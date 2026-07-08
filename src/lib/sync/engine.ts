import { rekeyHabit, type DashboardState } from "@/components/dashboard/dashboard-data";

import {
  applyCompanionPushResult,
  buildCompanionSyncPayload,
  mergeServerIntoLocal,
  nextAvailableKey
} from "./merge";
import {
  coalesceEnqueue,
  enqueue,
  loadQueue,
  mutationTouchesHabit,
  rekeyQueueMutations,
  saveQueue
} from "./queue";
import {
  applyShadowUpdates,
  loadShadowMap,
  pruneShadowMap,
  rekeyShadowCells,
  saveShadowMap,
  stampCell
} from "./shadow";
import { readJson, writeJson } from "./storage";
import type {
  FetchSnapshotFn,
  PushMutationsFn,
  PushOutcome,
  SyncMutation,
  SyncStatus
} from "./types";

/**
 * The sync engine (spec §2.1) — the ONLY stateful piece of the sync layer.
 * Plain TS, callback-driven, no React: the UI wires it up with getState /
 * applyMerged and renders from localStorage exactly as before. Every public
 * method is exception-safe — sync failures degrade to console.warn + status,
 * they never reach the render path.
 */

export const LAST_SYNCED_AT_STORAGE_KEY = "betterme.synclast.v1";

const FLUSH_DEBOUNCE_MS = 2_000;
const BACKOFF_SCHEDULE_MS = [2_000, 8_000, 30_000] as const;

export type SyncEngineOptions = {
  /** Current dashboard state (localStorage-backed source of truth). */
  getState: () => DashboardState;
  /** Applies a merged/re-keyed state: setState + persist, exactly like a user mutation. */
  applyMerged: (state: DashboardState) => void;
  /** Transport — pass the server actions from src/lib/server/sync-actions.ts. */
  push: PushMutationsFn;
  fetchSnapshot: FetchSnapshotFn;
  onStatus?: (status: SyncStatus) => void;
  /** Injectable ISO clock (tests). */
  now?: () => string;
  debounceMs?: number;
  backoffMs?: readonly number[];
};

export type SyncEngine = {
  /** Enqueue a mutation (+ shadow stamp for setHabitLog) and schedule a debounced flush. */
  markDirty: (mutation: SyncMutation) => void;
  /** Drain the queue now. Safe to call any time; never throws. */
  flush: () => Promise<void>;
  /** Fetch server snapshot → merge → applyMerged → push back what's newer locally. */
  hydrate: () => Promise<void>;
  getStatus: () => SyncStatus;
  dispose: () => void;
};

export function loadLastSyncedAt(): string | null {
  const value = readJson<unknown>(LAST_SYNCED_AT_STORAGE_KEY);

  return typeof value === "string" ? value : null;
}

function saveLastSyncedAt(iso: string): void {
  writeJson(LAST_SYNCED_AT_STORAGE_KEY, iso);
}

export function createSyncEngine(options: SyncEngineOptions): SyncEngine {
  const {
    getState,
    applyMerged,
    push,
    fetchSnapshot,
    onStatus,
    now = () => new Date().toISOString(),
    debounceMs = FLUSH_DEBOUNCE_MS,
    backoffMs = BACKOFF_SCHEDULE_MS
  } = options;

  let status: SyncStatus = "idle";
  let disposed = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempt = 0;
  let inFlight: Promise<void> | null = null;
  let followUp = false;

  function setStatus(next: SyncStatus): void {
    if (status === next) return;

    status = next;

    try {
      onStatus?.(next);
    } catch {
      // status listeners must never break the engine
    }
  }

  function clearTimer(timer: ReturnType<typeof setTimeout> | null): null {
    if (timer !== null) clearTimeout(timer);

    return null;
  }

  function scheduleDebouncedFlush(): void {
    if (disposed) return;

    debounceTimer = clearTimer(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void flush();
    }, debounceMs);
  }

  function scheduleRetry(): void {
    if (disposed) return;

    const delay = backoffMs[Math.min(retryAttempt, backoffMs.length - 1)] ?? FLUSH_DEBOUNCE_MS;

    retryAttempt += 1;
    retryTimer = clearTimer(retryTimer);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void flush();
    }, delay);
  }

  function markDirty(mutation: SyncMutation): void {
    if (disposed || typeof window === "undefined") return;

    try {
      if (mutation.kind === "setHabitLog") {
        // Every local touch stamps the shadow map so a stale server value can
        // never overwrite it on hydrate (per-cell LWW, spec §2.1/§2.4).
        stampCell(mutation.date, mutation.habitKey, mutation.clientTs);

        // Provenance invariant (spec §2.5): records with
        // date <= seedCutoverDate NEVER leave the device — not even via the
        // live toggle path. The edit stays local (and stays protected above).
        if (mutation.date <= getState().seedCutoverDate) return;
      }

      enqueue(mutation);
      setStatus("pending");
      scheduleDebouncedFlush();
    } catch (error) {
      console.warn("[sync] markDirty failed", error);
    }
  }

  async function flush(): Promise<void> {
    if (disposed || typeof window === "undefined") return;

    debounceTimer = clearTimer(debounceTimer);

    if (inFlight) {
      followUp = true;

      return inFlight;
    }

    inFlight = runFlush().finally(() => {
      inFlight = null;

      if (followUp && !disposed) {
        followUp = false;
        scheduleDebouncedFlush();
      }
    });

    return inFlight;
  }

  async function runFlush(): Promise<void> {
    try {
      const queue = loadQueue();

      if (queue.length === 0) {
        setStatus("idle");

        return;
      }

      setStatus("pending");

      const lastSyncedAt = loadLastSyncedAt();
      // The companion payload is built from the CURRENT state at flush time —
      // always the latest, which is why the queue only ever holds one marker.
      const sentPayload = queue.some((m) => m.kind === "companionSnapshot")
        ? buildCompanionSyncPayload(getState(), lastSyncedAt)
        : null;

      let result;

      try {
        result = await push(queue, sentPayload);
      } catch (error) {
        console.warn("[sync] push failed, will retry", error);
        setStatus("error");
        scheduleRetry();

        return;
      }

      if (!result.ok) {
        if (result.reason === "no-session") {
          // Dev bypass / signed out: keep the queue, stop hammering. The next
          // markDirty or hydrate() will try again.
          setStatus("disabled");

          return;
        }

        setStatus("error");
        scheduleRetry();

        return;
      }

      // Per-mutation outcomes: drop applied + permanent, keep retryable —
      // the queue never head-of-line-blocks (spec §2.1).
      const resolved: SyncMutation[] = [];
      const rekeyNeeded: Array<{ mutation: SyncMutation; oldKey: string }> = [];
      let hasRetryable = false;

      result.outcomes.forEach((outcome: PushOutcome | undefined, index: number) => {
        const mutation = queue[index];

        if (!mutation || !outcome) return;

        switch (outcome.status) {
          case "applied":
            resolved.push(mutation);
            break;
          case "permanent-error":
            console.warn(
              `[sync] dropping mutation (${outcome.code} ${outcome.message})`,
              mutation
            );
            resolved.push(mutation);
            break;
          case "retry":
            hasRetryable = true;
            break;
          case "rekey-needed":
            if (mutation.kind === "upsertHabit") {
              rekeyNeeded.push({ mutation, oldKey: mutation.habit.key });
            }
            break;
        }
      });

      // Remove resolved mutations from the CURRENT stored queue by identity —
      // anything coalesced/replaced while the push was in flight stays queued.
      let stored = loadQueue();
      const resolvedIds = new Set(resolved.map((m) => JSON.stringify(m)));

      stored = stored.filter((m) => !resolvedIds.delete(JSON.stringify(m)));

      // Slug collisions (spec §2.2): re-key with a suffix, rewrite local
      // state + records + queue + shadow, then retry under the new key.
      for (const { oldKey } of rekeyNeeded) {
        const state = getState();
        const taken = new Set<string>([
          ...state.habits.map((habit) => habit.id),
          ...stored.map((m) => queueKeyOf(m)).filter((k): k is string => k !== null)
        ]);
        const newKey = nextAvailableKey(oldKey, taken);

        applyMerged(rekeyHabit(state, oldKey, newKey));
        stored = rekeyQueueMutations(stored, oldKey, newKey);
        saveShadowMap(rekeyShadowCells(loadShadowMap(), oldKey, newKey));
      }

      saveQueue(stored);

      // Adopt the merged companion state the server returned: returned
      // ledgers + carryover wholesale, reward fields via monotonic merge.
      if (result.companion && sentPayload) {
        applyMerged(
          applyCompanionPushResult(getState(), sentPayload, result.companion, lastSyncedAt)
        );
        // Watermark from the SERVER clock: reset supremacy compares reset_at
        // against lastSyncedAt, so a skewed client stamp would resurrect
        // resets. now() only covers old schemas without serverTime.
        saveLastSyncedAt(result.serverTime ?? now());
      }

      if (hasRetryable) {
        setStatus("error");
        scheduleRetry();

        return;
      }

      retryAttempt = 0;

      if (stored.length > 0) {
        // Re-keyed mutations wait for the next pass.
        setStatus("pending");
        scheduleDebouncedFlush();
      } else {
        setStatus("idle");
      }
    } catch (error) {
      console.warn("[sync] flush failed", error);
      setStatus("error");
      scheduleRetry();
    }
  }

  async function hydrate(): Promise<void> {
    if (disposed || typeof window === "undefined") return;

    try {
      setStatus("pending");

      let result;

      try {
        result = await fetchSnapshot();
      } catch (error) {
        console.warn("[sync] hydrate fetch failed", error);
        setStatus("error");

        return;
      }

      if (!result.ok) {
        setStatus(result.reason === "no-session" ? "disabled" : "error");

        return;
      }

      // Load queue/shadow AFTER the await — mutations made during the fetch
      // must be part of the merge's "local knowledge".
      const shadow = pruneShadowMap(loadShadowMap());
      const pending = loadQueue();
      const lastSyncedAt = loadLastSyncedAt();
      const merge = mergeServerIntoLocal(
        getState(),
        result.snapshot,
        shadow,
        lastSyncedAt,
        pending
      );

      // Order matters: rekeys move existing stamps first, then server-won
      // cells are stamped (see MergeResult.shadowUpdates).
      let shadowMap = shadow;
      let stored = pending;

      merge.rekeys.forEach(({ oldKey, newKey }) => {
        shadowMap = rekeyShadowCells(shadowMap, oldKey, newKey);
        stored = rekeyQueueMutations(stored, oldKey, newKey);
      });
      shadowMap = applyShadowUpdates(shadowMap, merge.shadowUpdates);
      saveShadowMap(shadowMap);

      if (merge.rekeys.length > 0) saveQueue(stored);

      applyMerged(merge.state);
      // Server-clock watermark (see runFlush) — client-clock fallback only
      // for old deployed schemas that don't return serverTime.
      saveLastSyncedAt(result.snapshot.serverTime ?? now());

      if (merge.companionAheadOfServer) {
        saveQueue(coalesceEnqueue(loadQueue(), { kind: "companionSnapshot", clientTs: now() }));
      }

      await flush();
    } catch (error) {
      console.warn("[sync] hydrate failed", error);
      setStatus("error");
    }
  }

  const handleOnline = (): void => {
    void flush();
  };
  const handleOffline = (): void => {
    // No point burning the backoff schedule while offline.
    retryTimer = clearTimer(retryTimer);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }

  return {
    markDirty,
    flush,
    hydrate,
    getStatus: () => status,
    dispose: () => {
      disposed = true;
      debounceTimer = clearTimer(debounceTimer);
      retryTimer = clearTimer(retryTimer);

      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    }
  };
}

function queueKeyOf(mutation: SyncMutation): string | null {
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

// Re-export the storage-key constants the wiring layer needs in one place.
export { SYNC_QUEUE_STORAGE_KEY } from "./queue";
export { SYNC_SHADOW_STORAGE_KEY } from "./shadow";
export { mutationTouchesHabit };
