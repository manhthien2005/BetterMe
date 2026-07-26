/**
 * v2 → v3 migration for habits and log cells (spec §9.3). Every function here
 * is idempotent: running it on already-migrated data must be a no-op, because
 * it runs on every load, not once.
 */

import { habitEmoji } from "@/components/dashboard/habit-style";
import {
  ALL_WEEKDAYS,
  isEntryComplete,
  normalizeTimesOfDay,
  type HabitColor,
  type HabitTracking,
  type LogEntry,
  type TimeOfDay,
  type TrackingType
} from "@/components/dashboard/habit-model";

export type HabitV3Fields = {
  /** Emoji chosen by the user — an object of the world (spec §2.4). */
  icon: string;
  trackingType: TrackingType;
  target: number;
  unit: string | null;
  steps: string[] | null;
  repeatDays: number[];
  timesOfDay: TimeOfDay[];
  /** Optional "HH:mm" — display only, and it feeds Giờ vàng later (spec §5.1). */
  scheduledAt: string | null;
  color: HabitColor;
  motivation: string;
  pausedAt: string | null;
  archivedAt: string | null;
  /** Per-definition LWW stamp; null = epoch, always loses to a server value. */
  updatedAt: string | null;
};

/** What a habit carried over from v2 becomes: a plain daily checkbox. */
export function defaultHabitV3Fields(key: string, category: string): HabitV3Fields {
  return {
    icon: habitEmoji(key, category),
    trackingType: "check",
    target: 1,
    unit: null,
    steps: null,
    repeatDays: [...ALL_WEEKDAYS],
    timesOfDay: ["anytime"],
    scheduledAt: null,
    color: "clay",
    motivation: "",
    pausedAt: null,
    archivedAt: null,
    updatedAt: null
  };
}

function isTrackingType(value: unknown): value is TrackingType {
  return value === "check" || value === "count" || value === "duration" || value === "checklist";
}

function isHabitColor(value: unknown): value is HabitColor {
  return (
    value === "clay" ||
    value === "moss" ||
    value === "sky" ||
    value === "dusk" ||
    value === "sand" ||
    value === "rose"
  );
}

/** Keeps only real ISO weekday numbers; a fully corrupt list falls back to daily. */
function normalizeRepeatDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...ALL_WEEKDAYS];

  const days = value.filter(
    (day): day is number => typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7
  );

  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : [...ALL_WEEKDAYS];
}

function normalizeSteps(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const steps = value.filter((step): step is string => typeof step === "string");

  return steps.length > 0 ? steps : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Adds every v3 field a habit is missing, leaving the ones it already has
 * untouched. Safe to run on v2 habits, v3 habits, and half-written ones.
 */
export function migrateHabitFields<T extends { key?: string; category?: string }>(
  habit: T
): T & HabitV3Fields {
  const candidate = habit as T & Partial<HabitV3Fields>;
  const defaults = defaultHabitV3Fields(habit.key ?? "", habit.category ?? "");

  return {
    ...habit,
    icon: typeof candidate.icon === "string" && candidate.icon ? candidate.icon : defaults.icon,
    trackingType: isTrackingType(candidate.trackingType)
      ? candidate.trackingType
      : defaults.trackingType,
    target:
      typeof candidate.target === "number" && candidate.target > 0
        ? candidate.target
        : defaults.target,
    unit: optionalString(candidate.unit),
    steps: normalizeSteps(candidate.steps),
    repeatDays: normalizeRepeatDays(candidate.repeatDays),
    timesOfDay: normalizeTimesOfDay(
      (candidate as { timesOfDay?: unknown }).timesOfDay,
      (candidate as { timeOfDay?: unknown }).timeOfDay
    ),
    scheduledAt: optionalString(candidate.scheduledAt),
    color: isHabitColor(candidate.color) ? candidate.color : defaults.color,
    motivation: typeof candidate.motivation === "string" ? candidate.motivation : "",
    pausedAt: optionalString(candidate.pausedAt),
    archivedAt: optionalString(candidate.archivedAt),
    updatedAt: optionalString(candidate.updatedAt)
  };
}

function isLogEntry(value: unknown): value is LogEntry {
  if (value === null || typeof value !== "object") return false;

  const candidate = value as Partial<LogEntry>;

  return typeof candidate.value === "number" && Number.isFinite(candidate.value);
}

/**
 * The log cells of one day. `entries` wins when present — a v3 state reloaded
 * must not be rebuilt from its own derived boolean cache.
 */
export function migrateEntries(record: {
  completions?: unknown;
  entries?: unknown;
}): Record<string, LogEntry> {
  const entries: Record<string, LogEntry> = {};
  const source = record.entries;

  if (source !== null && typeof source === "object" && !Array.isArray(source)) {
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (isLogEntry(value)) entries[key] = value;
    }

    if (Object.keys(entries).length > 0) return entries;
  }

  const completions = record.completions;

  if (completions === null || typeof completions !== "object" || Array.isArray(completions)) {
    return entries;
  }

  for (const [key, value] of Object.entries(completions as Record<string, unknown>)) {
    if (typeof value === "boolean") entries[key] = { value: value ? 1 : 0 };
  }

  return entries;
}

/**
 * Rebuilds the derived boolean cache from the entries.
 *
 * A boolean ALREADY stored for a cell is kept exactly as it is: it records
 * "done under the rule in force when it was written". Re-deriving it would let
 * a later target change silently take away a day the user really did finish —
 * raise a water goal from 8 to 10 glasses and yesterday's 8 would turn red.
 * Spec §5.1 is explicit that history is never re-interpreted.
 *
 * Cells whose habit no longer exists are dropped — orphans must never survive
 * to be merged back.
 */
export function deriveCompletions(
  entries: Record<string, LogEntry>,
  trackingByKey: Map<string, HabitTracking>,
  stored?: Record<string, boolean>
): Record<string, boolean> {
  const completions: Record<string, boolean> = {};

  for (const [key, entry] of Object.entries(entries)) {
    const tracking = trackingByKey.get(key);

    if (!tracking) continue;

    completions[key] =
      typeof stored?.[key] === "boolean" ? stored[key] : isEntryComplete(tracking, entry);
  }

  return completions;
}
