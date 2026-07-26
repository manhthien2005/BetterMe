"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { habitTracking, type DashboardHabit } from "@/components/dashboard/dashboard-data";
import {
  countSteps,
  entryProgress,
  isEntryComplete,
  toggleStep,
  type LogEntry
} from "@/components/dashboard/habit-model";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

/** Minutes added per press for a duration habit — a quick tap, not a timer. */
const DURATION_STEP = 5;

/**
 * The one place a habit is recorded, with a control per tracking type
 * (spec §4.2). It never decides *what* the new value means — it just hands a
 * number to `onSet`, and `setHabitEntry` owns the rest.
 */
export function HabitEntryControl({
  entry,
  habit,
  onAdjust,
  onSet
}: {
  entry: LogEntry | undefined;
  habit: DashboardHabit;
  /** Adds to today's value. Falls back to onSet when the caller omits it. */
  onAdjust?: (delta: number) => void;
  onSet: (value: number) => void;
}) {
  const tracking = habitTracking(habit);
  const done = isEntryComplete(tracking, entry);
  const progress = entryProgress(tracking, entry);

  if (habit.trackingType === "check") {
    return (
      <button
        aria-checked={done}
        aria-label={`${habit.name} — ${done ? "đã xong" : "chưa xong"}`}
        className="squishy flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        onClick={() => onSet(done ? 0 : 1)}
        role="checkbox"
        type="button"
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[9px] border-2 transition",
            done
              ? "check-pop border-success bg-success text-white"
              : "border-line-control bg-surface-card text-transparent"
          )}
        >
          <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3.5} />
        </span>
      </button>
    );
  }

  if (habit.trackingType === "checklist") {
    return (
      <ChecklistControl
        done={done}
        entry={entry}
        habit={habit}
        onSet={onSet}
        progress={progress}
      />
    );
  }

  // count + duration share one shape: a progress ring and one "add" button.
  const step = habit.trackingType === "duration" ? DURATION_STEP : 1;
  const unitLabel = habit.trackingType === "duration" ? "phút" : (habit.unit ?? "lần");

  return (
    <div className="flex items-center gap-2">
      <ProgressBadge done={done} label={`${progress.done}/${progress.target}`} progress={progress} />
      {done ? (
        <button
          aria-label={`Bỏ đánh dấu ${habit.name}`}
          className="squishy flex min-h-[44px] items-center rounded-pill border border-line-strong bg-surface-card px-3 text-xs font-semibold text-ink-soft transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
          onClick={() => onSet(0)}
          type="button"
        >
          Bỏ đánh dấu
        </button>
      ) : (
        <button
          className="squishy flex min-h-[44px] items-center rounded-pill bg-action px-3.5 text-xs font-semibold text-action-ink shadow-action transition hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
          onClick={() =>
            onAdjust ? onAdjust(step) : onSet(progress.done + step)
          }
          type="button"
        >
          {`+${step} ${unitLabel}`}
        </button>
      )}
    </div>
  );
}

function ChecklistControl({
  done,
  entry,
  habit,
  onSet,
  progress
}: {
  done: boolean;
  entry: LogEntry | undefined;
  habit: DashboardHabit;
  onSet: (value: number) => void;
  progress: { done: number; target: number; ratio: number };
}) {
  const [open, setOpen] = useState(false);
  const steps = habit.steps ?? [];
  const value = entry?.value ?? 0;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        aria-expanded={open}
        aria-label={open ? `Đóng các bước của ${habit.name}` : `Mở các bước của ${habit.name}`}
        className="squishy flex min-h-[44px] items-center gap-2 rounded-pill px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <ProgressBadge done={done} label={`${progress.done}/${progress.target}`} progress={progress} />
        <ChevronDown
          aria-hidden="true"
          className={cn("h-4 w-4 text-ink-soft transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul className="w-full min-w-[180px] space-y-1">
          {steps.map((step, index) => {
            const stepDone = (value & (1 << index)) !== 0;

            return (
              <li key={step}>
                <button
                  aria-checked={stepDone}
                  aria-label={step}
                  className="squishy flex min-h-[44px] w-full items-center gap-2 rounded-control px-2 text-left text-xs font-medium text-ink transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  onClick={() => onSet(toggleStep(value, index))}
                  role="checkbox"
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border-2 transition",
                      stepDone
                        ? "border-success bg-success text-white"
                        : "border-line-control bg-surface-card text-transparent"
                    )}
                  >
                    <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                  <span className={cn(stepDone && "text-ink-soft line-through")}>{step}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <span className="sr-only">{`${countSteps(value)} trên ${steps.length} bước đã xong`}</span>
    </div>
  );
}

/** A ring that fills as the day progresses; solid green once the target is met. */
function ProgressBadge({
  done,
  label,
  progress
}: {
  done: boolean;
  label: string;
  progress: { done: number; target: number };
}) {
  if (done) {
    return (
      <span className="check-pop flex h-9 w-9 items-center justify-center rounded-full bg-success text-white">
        <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3.5} />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <ProgressRing
      className="text-ink-soft"
      label={label}
      target={progress.target}
      value={progress.done}
    >
      {label}
    </ProgressRing>
  );
}
