import { getDashboardToday, type DashboardState } from "@/components/dashboard/dashboard-data";

import type { SyncEngine } from "./engine";
import { habitSyncPayload, logSyncMutation } from "./payloads";
import type { SyncMutation } from "./types";

/**
 * Onboarding importer (spec §2.5) — builds the one-time initial upload when
 * the user turns sync on. Neither choice ever touches on-device data.
 *
 *   - "fresh"    (A, "Vườn mây mới tinh 🌱", default): habits + companion +
 *                records from TODAY onward.
 *   - "memories" (B, "Đem kỷ niệm lên mây ☁️"): records with
 *                date > seedCutoverDate.
 *
 * HARD INVARIANT (both modes): records with date <= seedCutoverDate are seed
 * fiction and never leave the device — provenance comes from the stamp only,
 * NEVER inferred from record content. `bestStreakFloor` and `events` have no
 * mutation kind at all, so they provably cannot be uploaded.
 */

export type InitialUploadMode = "fresh" | "memories";

export function buildInitialUpload(
  state: DashboardState,
  mode: InitialUploadMode,
  today = getDashboardToday(),
  nowIso = new Date().toISOString()
): SyncMutation[] {
  const mutations: SyncMutation[] = [];
  // Belt-and-braces vs tombstones: a habit whose key is tombstoned (e.g. a
  // server delete merged in by hydrate) must never be re-CREATEd by the
  // initial upload — expectCreate would resurrect it (spec §2.4/§2.5).
  const tombstonedKeys = new Set(state.deletedHabits.map((tombstone) => tombstone.key));

  // Habits first: their creates must land before any log referencing them.
  // expectCreate arms server-side slug-collision detection (spec §2.2).
  state.habits.filter((habit) => !tombstonedKeys.has(habit.id)).forEach((habit, index) => {
    mutations.push({
      kind: "upsertHabit",
      habit: habitSyncPayload(habit, index),
      clientTs: nowIso,
      expectCreate: true
    });
  });

  const habitIds = new Set(
    state.habits.map((habit) => habit.id).filter((id) => !tombstonedKeys.has(id))
  );
  const includedDates = Object.keys(state.records)
    .filter((date) => {
      if (date <= state.seedCutoverDate) return false; // provenance invariant — absolute
      if (mode === "fresh" && date < today) return false;

      return true;
    })
    .sort();

  includedDates.forEach((date) => {
    const record = state.records[date];

    Object.keys(record.completions).forEach((habitKey) => {
      // Only real, currently-existing habits; only explicit ticks — a fresh
      // cloud garden reads absence as false, so false cells add nothing.
      if (!habitIds.has(habitKey)) return;
      if (record.completions[habitKey] !== true) return;

      mutations.push(
        logSyncMutation(habitKey, date, true, record.entries[habitKey], nowIso)
      );
    });
  });

  // The pet is real — the user raised it. Payload is built at flush time.
  mutations.push({ kind: "companionSnapshot", clientTs: nowIso });

  return mutations;
}

/**
 * The onboarding choose-flow (spec §2.5), order-critical: hydrate FIRST so
 * server truth (tombstones, habits, companion) merges into local state, THEN
 * build the initial upload from the CURRENT post-hydrate state. A fresh
 * device's seed defaults must never reach the server before the merge — the
 * old order re-created habits the user had deleted elsewhere and re-seeded
 * defaults into an established cloud garden.
 */
export async function runSyncOnboarding(
  engine: SyncEngine,
  getState: () => DashboardState,
  mode: InitialUploadMode,
  today = getDashboardToday(),
  nowIso = new Date().toISOString()
): Promise<void> {
  await engine.hydrate();

  // hydrate() already flushed anything it enqueued; these land in a fresh pass.
  buildInitialUpload(getState(), mode, today, nowIso).forEach((mutation) =>
    engine.markDirty(mutation)
  );
  await engine.flush();
}
