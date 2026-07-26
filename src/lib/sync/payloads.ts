import type { DashboardHabit } from "@/components/dashboard/dashboard-data";
import type { LogEntry } from "@/components/dashboard/habit-model";

import type { SetHabitLogMutation, SyncHabitPayload } from "./types";

/**
 * Local state -> wire payload. Both builders live here rather than at their
 * call sites because there are several of each: the onboarding importer and
 * five separate edit paths in the provider. A hand-written mapping repeated
 * per call site is exactly how a field ends up syncing on create but staying
 * silent on edit.
 */

/**
 * `sortOrder` is passed in, not read off the habit: order is a property of the
 * list, and the caller is the one holding the list.
 */
export function habitSyncPayload(habit: DashboardHabit, sortOrder: number): SyncHabitPayload {
  return {
    key: habit.id,
    name: habit.name,
    category: habit.category,
    maxScore: habit.maxScore,
    // `active` predates the v3 lifecycle and is kept in step with it rather
    // than left to drift: an archived habit is not active.
    active: habit.archivedAt == null,
    description: habit.description,
    sortOrder,
    icon: habit.icon,
    trackingType: habit.trackingType,
    target: habit.target,
    // undefined -> null throughout: this is JSON on a wire, and an absent key
    // would let the RPC fall back to its SQL default instead of clearing.
    unit: habit.unit ?? null,
    steps: habit.steps ?? [],
    repeatDays: habit.repeatDays,
    timesOfDay: habit.timesOfDay,
    scheduledAt: habit.scheduledAt ?? null,
    color: habit.color,
    motivation: habit.motivation,
    pausedAt: habit.pausedAt ?? null,
    archivedAt: habit.archivedAt ?? null
  };
}

/**
 * One log cell as a mutation. `done` is passed in rather than derived here:
 * the caller already holds the habit's tracking rule and has computed it, and
 * recomputing from `entry` alone would need the rule all over again.
 */
export function logSyncMutation(
  habitKey: string,
  date: string,
  done: boolean,
  entry: LogEntry | undefined,
  clientTs: string
): SetHabitLogMutation {
  const mutation: SetHabitLogMutation = {
    kind: "setHabitLog",
    habitKey,
    date,
    done,
    value: entry?.value ?? (done ? 1 : 0),
    clientTs
  };

  if (entry?.completedAt) mutation.completedAt = entry.completedAt;

  return mutation;
}
