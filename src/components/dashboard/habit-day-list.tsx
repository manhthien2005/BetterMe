"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CirclePlus } from "lucide-react";

import {
  habitTracking,
  type DashboardDayRecord,
  type DashboardHabit
} from "@/components/dashboard/dashboard-data";
import { HabitEntryControl } from "@/components/dashboard/habit-entry-control";
import {
  HABIT_COLOR_STYLES,
  isEntryComplete,
  TIME_OF_DAY_EMOJI,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  type TimeOfDay
} from "@/components/dashboard/habit-model";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

/** Above this many tasks in a day, Nếp says something — kindly (spec §5.1). */
const BUSY_DAY_THRESHOLD = 7;

function groupLabel(slot: TimeOfDay): string {
  const emoji = TIME_OF_DAY_EMOJI[slot];

  return emoji ? `${emoji} ${TIME_OF_DAY_LABELS[slot]}` : TIME_OF_DAY_LABELS[slot];
}

/**
 * The day's habits, grouped by the part of the day they belong to (spec §4.2).
 * A habit that sits in two parts appears in both groups — it is the same log
 * cell, so the repeat is labelled rather than left to look like a second task.
 */
export function HabitDayList({
  habits,
  onCreate,
  onMove,
  onOpenEditor,
  onSetEntry,
  record,
  streaks
}: {
  habits: DashboardHabit[];
  onCreate: () => void;
  onMove: (habitId: string, direction: -1 | 1) => void;
  onOpenEditor: (habitId: string) => void;
  onSetEntry: (habitId: string, value: number) => void;
  record: DashboardDayRecord | undefined;
  streaks: Record<string, number>;
}) {
  const [sorting, setSorting] = useState(false);
  const groups = TIME_OF_DAY_ORDER.map((slot) => ({
    slot,
    items: habits.filter((habit) => habit.timesOfDay.includes(slot))
  })).filter((group) => group.items.length > 0);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Thói quen hôm nay</h2>
        <div className="flex items-center gap-1">
          <Button
            aria-pressed={sorting}
            onClick={() => setSorting((current) => !current)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ArrowUpDown aria-hidden="true" className="h-4 w-4" />
            {sorting ? "Xong" : "Sắp xếp"}
          </Button>
          <Button onClick={onCreate} size="sm" type="button" variant="secondary">
            <CirclePlus aria-hidden="true" className="h-4 w-4" />
            Thêm thói quen
          </Button>
        </div>
      </div>

      {habits.length > BUSY_DAY_THRESHOLD ? (
        <p
          className="mt-3 rounded-control border border-line-honey bg-surface-warm px-3 py-2 text-xs font-medium text-action-hover"
          role="status"
        >
          {`🐌 Hôm nay ${habits.length} việc — nhiều đấy. Làm được bao nhiêu hay bấy nhiêu nhé.`}
        </p>
      ) : null}

      <div className="mt-4 space-y-5">
        {groups.map((group) => (
          <section key={group.slot}>
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-ink-soft">
              {groupLabel(group.slot)}
            </h3>
            <ul className="mt-2 space-y-2">
              {group.items.map((habit) => (
                <HabitRow
                  entry={record?.entries[habit.id]}
                  habit={habit}
                  key={`${group.slot}:${habit.id}`}
                  onMove={onMove}
                  onOpenEditor={onOpenEditor}
                  onSetEntry={onSetEntry}
                  slot={group.slot}
                  sorting={sorting}
                  streak={streaks[habit.id] ?? 0}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}

function HabitRow({
  entry,
  habit,
  onMove,
  onOpenEditor,
  onSetEntry,
  slot,
  sorting,
  streak
}: {
  entry: { value: number; completedAt?: string } | undefined;
  habit: DashboardHabit;
  onMove: (habitId: string, direction: -1 | 1) => void;
  onOpenEditor: (habitId: string) => void;
  onSetEntry: (habitId: string, value: number) => void;
  slot: TimeOfDay;
  sorting: boolean;
  streak: number;
}) {
  // Completion is the model's call, not the row's — a count habit at its
  // target is just as finished as a ticked checkbox.
  const done = isEntryComplete(habitTracking(habit), entry);
  const alsoIn = habit.timesOfDay.filter((item) => item !== slot);

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-3 rounded-control border p-3 transition",
          done
            ? "border-line-success bg-surface-success"
            : "border-line-strong bg-surface-card"
        )}
      >
        {sorting ? (
          <span className="flex flex-col">
            <button
              aria-label={`Đưa ${habit.name} lên`}
              className="squishy flex h-6 w-6 items-center justify-center rounded text-ink-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              onClick={() => onMove(habit.id, -1)}
              type="button"
            >
              <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label={`Đưa ${habit.name} xuống`}
              className="squishy flex h-6 w-6 items-center justify-center rounded text-ink-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              onClick={() => onMove(habit.id, 1)}
              type="button"
            >
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : null}

        <span
          aria-hidden="true"
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-xl",
            HABIT_COLOR_STYLES[habit.color].soft
          )}
        >
          {habit.icon}
        </span>

        <span className="min-w-0 flex-1">
          <button
            aria-label={`Sửa ${habit.name}`}
            className="squishy block max-w-full truncate text-left text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            onClick={() => onOpenEditor(habit.id)}
            type="button"
          >
            <span className={cn(done && "text-ink-soft line-through")}>{habit.name}</span>
          </button>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
            {habit.scheduledAt ? <span>{`🕘 ${habit.scheduledAt}`}</span> : null}
            {streak >= 2 ? <Chip tone="warm">{`🔥 ${streak}`}</Chip> : null}
            {alsoIn.length > 0 ? (
              <span>{`cũng ở ${alsoIn.map((item) => groupLabel(item)).join(", ")}`}</span>
            ) : null}
            {done ? <Chip tone="success">+1 🌾</Chip> : null}
          </span>
        </span>

        <HabitEntryControl
          entry={entry}
          habit={habit}
          onSet={(value) => onSetEntry(habit.id, value)}
        />
      </div>
    </li>
  );
}
