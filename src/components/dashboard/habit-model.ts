/**
 * Habit model v3 (spec §5): four ways to track a habit, a repeat schedule, a
 * part of the day, and a pause/archive lifecycle. Everything here is pure —
 * no React, no storage, no dates beyond the ISO strings handed in.
 */

import { parseIsoDate } from "@/lib/date";

export type TrackingType = "check" | "count" | "duration" | "checklist";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type HabitColor = "clay" | "moss" | "sky" | "dusk" | "sand" | "rose";

/**
 * One habit on one day.
 *
 * `value` reads differently per tracking type:
 *   check     → 0 or 1
 *   count     → units done (e.g. 6 glasses)
 *   duration  → minutes done
 *   checklist → bitmask of finished steps (bit i = steps[i])
 *
 * `completedAt` is a LOCAL "HH:mm" — the day already lives in the record key,
 * and keeping it clock-only sidesteps timezone drift when it later syncs.
 */
export type LogEntry = {
  value: number;
  completedAt?: string;
};

/** The subset of a habit these predicates need — keeps them trivially testable. */
export type HabitTracking = {
  trackingType: TrackingType;
  target: number;
  steps?: string[];
  repeatDays: number[];
  pausedAt?: string | null;
  archivedAt?: string | null;
};

export const TRACKING_TYPES: readonly TrackingType[] = [
  "check",
  "count",
  "duration",
  "checklist"
];

export const TIME_OF_DAY_ORDER: readonly TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "anytime"
];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Sáng",
  afternoon: "Chiều",
  evening: "Tối",
  anytime: "Cả ngày"
};

/** Emoji are objects of the world (spec §2.4). "Cả ngày" deliberately has none. */
export const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string | null> = {
  morning: "☀️",
  afternoon: "🌤",
  evening: "🌙",
  anytime: null
};

export const HABIT_COLORS: readonly HabitColor[] = [
  "clay",
  "moss",
  "sky",
  "dusk",
  "sand",
  "rose"
];

/** ISO weekday numbers: 1 = Monday … 7 = Sunday (matches the T2→CN grid). */
export const ALL_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

export const CHECKLIST_MIN_STEPS = 2;
export const CHECKLIST_MAX_STEPS = 7;

export function weekdayIso(date: string): number {
  const day = parseIsoDate(date).getDay();

  return day === 0 ? 7 : day;
}

export function countSteps(value: number): number {
  let bits = Math.max(0, Math.trunc(value));
  let total = 0;

  while (bits > 0) {
    total += bits & 1;
    bits >>>= 1;
  }

  return total;
}

export function toggleStep(value: number, index: number): number {
  return Math.max(0, Math.trunc(value)) ^ (1 << index);
}

/** How many units of the target this entry has reached, in the type's own unit. */
function doneUnits(habit: HabitTracking, entry: LogEntry | undefined): number {
  if (!entry) return 0;

  const value = Math.max(0, entry.value);

  return habit.trackingType === "checklist" ? countSteps(value) : value;
}

/** The target in the same unit as `doneUnits`. Checklists trust their steps. */
function targetUnits(habit: HabitTracking): number {
  if (habit.trackingType === "check") return 1;

  if (habit.trackingType === "checklist") {
    return habit.steps?.length ?? Math.max(1, habit.target);
  }

  return Math.max(1, habit.target);
}

/**
 * Completion per spec §5.2: count/duration hit their target, a checklist needs
 * every step. Partial progress is shown, never punished.
 */
export function isEntryComplete(habit: HabitTracking, entry: LogEntry | undefined): boolean {
  if (!entry) return false;

  return doneUnits(habit, entry) >= targetUnits(habit);
}

export function entryProgress(
  habit: HabitTracking,
  entry: LogEntry | undefined
): { done: number; target: number; ratio: number } {
  const target = targetUnits(habit);
  const done = doneUnits(habit, entry);

  return { done, target, ratio: Math.min(1, target > 0 ? done / target : 0) };
}

/**
 * Is this habit part of that day at all? Paused and archived habits leave the
 * day from their stamp onward — history before it stays exactly as it was
 * (spec §5.1).
 */
export function isScheduledOn(habit: HabitTracking, date: string): boolean {
  if (habit.archivedAt && date >= habit.archivedAt) return false;
  if (habit.pausedAt && date >= habit.pausedAt) return false;

  return habit.repeatDays.includes(weekdayIso(date));
}
