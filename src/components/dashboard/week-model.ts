/**
 * The week grid model (spec §4.2, "Tuần này"): rows are habits, columns are
 * Monday→Sunday. Pure — no React, no clocks beyond the ISO strings handed in.
 *
 * A cell distinguishes three things that all look like "not done": a day the
 * habit was never scheduled for, a day that has not arrived yet, and a day the
 * user genuinely left empty. Only the last is an absence worth showing as one.
 */

import {
  habitTracking,
  type DashboardHabit,
  type DashboardState
} from "@/components/dashboard/dashboard-data";
import { entryProgress, isEntryComplete, isScheduledOn } from "@/components/dashboard/habit-model";
import { addDaysIso, getWeekStartIso, VI_WEEKDAY_LABELS } from "@/lib/date";

/**
 * What one square says.
 *
 *   done       → target reached
 *   partial    → some progress, target not reached (count/duration/checklist)
 *   empty      → TODAY, scheduled, nothing recorded yet — still the user's to
 *                spend. Deliberately distinct from `missed`: the grid must not
 *                mark the current day as a failure before it has ended.
 *   missed     → scheduled, the day has fully passed, nothing recorded
 *   off        → not scheduled that weekday, or paused/archived by then
 *   future     → later this week; says nothing about the user
 */
export type WeekCellState = "done" | "partial" | "empty" | "missed" | "off" | "future";

export type WeekCell = {
  date: string;
  state: WeekCellState;
  /** 0–1. Only meaningful for `partial`; `done` is always 1. */
  ratio: number;
  /**
   * Progress in the habit's OWN unit, so a tooltip can say "4/8 ly" instead of
   * a bare percentage. `done` counts ticked steps for a checklist.
   */
  done: number;
  target: number;
  isToday: boolean;
};

export type WeekDay = {
  date: string;
  /** Column header in the app's voice: T2…CN. */
  label: string;
  isToday: boolean;
  isFuture: boolean;
};

export type WeekRow = {
  habit: DashboardHabit;
  cells: WeekCell[];
};

export type WeekGrid = {
  /** Monday of the week containing `today`. */
  weekStart: string;
  /** Sunday of that same week. */
  weekEnd: string;
  days: WeekDay[];
  rows: WeekRow[];
  /**
   * `scheduled` counts only days that were scheduled AND have already
   * arrived. Counting future days would make Monday read "2/13" — eleven
   * failures before the week has had a chance to happen.
   */
  total: { done: number; scheduled: number };
};

/**
 * Re-exported, not redefined: the hero's seven dots and this grid must label
 * the same week the same way, so both read one array in `@/lib/date`.
 */
export const WEEKDAY_LABELS: readonly string[] = VI_WEEKDAY_LABELS;

export function buildWeekGrid(
  state: DashboardState,
  today: string,
  weekStart = getWeekStartIso(today)
): WeekGrid {
  const dates = Array.from({ length: 7 }, (_, index) => addDaysIso(weekStart, index));
  const days: WeekDay[] = dates.map((date, index) => ({
    date,
    label: WEEKDAY_LABELS[index],
    isToday: date === today,
    isFuture: date > today
  }));

  // A habit scheduled on no day of this week gets no row at all: an all-grey
  // stripe is noise, not information.
  const habits = state.habits.filter((habit) =>
    dates.some((date) => isScheduledOn(habitTracking(habit), date))
  );

  let done = 0;
  let scheduled = 0;

  const rows = habits.map((habit) => {
    const tracking = habitTracking(habit);

    const cells = dates.map((date): WeekCell => {
      const isToday = date === today;
      const entry = state.records[date]?.entries[habit.id];
      const progress = entryProgress(tracking, entry);
      const base = { date, done: progress.done, target: progress.target, isToday };

      if (!isScheduledOn(tracking, date)) {
        return { ...base, state: "off", ratio: 0, done: 0 };
      }

      // Future days count toward neither numerator nor denominator.
      if (date > today) {
        return { ...base, state: "future", ratio: progress.ratio };
      }

      scheduled += 1;

      if (isEntryComplete(tracking, entry)) {
        done += 1;

        return { ...base, state: "done", ratio: 1 };
      }

      if (progress.ratio > 0) {
        return { ...base, state: "partial", ratio: progress.ratio };
      }

      // Today with nothing on it yet is an open invitation, not a failure —
      // the day is still the user's to spend. Only a day that has fully passed
      // reads as missed.
      return { ...base, state: isToday ? "empty" : "missed", ratio: 0 };
    });

    return { habit, cells };
  });

  return { weekStart, weekEnd: dates[6], days, rows, total: { done, scheduled } };
}

/**
 * How many cells were finished in the week before the one containing `today`.
 * That week is entirely in the past, so its own Sunday is its "as of" date and
 * every day of it counts as arrived.
 */
export function countPreviousWeekDone(state: DashboardState, today: string): number {
  const previousStart = addDaysIso(getWeekStartIso(today), -7);

  return buildWeekGrid(state, addDaysIso(previousStart, 6), previousStart).total.done;
}

/**
 * This week against last week — the user's ONLY comparison (spec §4.2: "so
 * sánh với chính mình"), never against another person.
 *
 * Being behind is stated as a bare fact about last week, never as a deficit:
 * no "kém", no "ít hơn", no minus sign. The no-guilt invariant is not a tone
 * preference, it is test-enforced.
 */
export function compareWeekTotals(thisWeekDone: number, previousWeekDone: number): string {
  if (previousWeekDone === 0) return "tuần đầu tiên của nhịp này";
  if (thisWeekDone === previousWeekDone) return "bằng tuần trước";
  if (thisWeekDone > previousWeekDone) {
    return `hơn tuần trước +${thisWeekDone - previousWeekDone}`;
  }

  return `tuần trước ${previousWeekDone} lượt`;
}
