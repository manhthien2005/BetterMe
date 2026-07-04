"use client";

import { formatDisplayDate } from "@/lib/date";
import type { TrackerSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function MiniCalendar({
  snapshot,
  onSelect
}: {
  snapshot: TrackerSnapshot;
  onSelect: (date: string) => void;
}) {
  return (
    <section className="soft-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black tracking-normal text-slate-950">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            {formatDisplayDate(snapshot.selectedDate, { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="rounded-md bg-white px-3 py-1 text-sm font-bold text-teal-700 shadow-sm">
          {snapshot.metrics.currentStreak} streak
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
        {labels.map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {snapshot.calendar.map((day) => (
          <button
            className={cn(
              "aspect-square rounded-md border text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm",
              day.inCurrentMonth ? "text-slate-800" : "text-slate-300",
              statusClass(day.status),
              day.date === snapshot.selectedDate && "ring-2 ring-teal-600 ring-offset-2"
            )}
            key={day.date}
            onClick={() => onSelect(day.date)}
            type="button"
          >
            {day.day}
          </button>
        ))}
      </div>
    </section>
  );
}

function statusClass(status: string) {
  if (status === "Good") return "border-emerald-200 bg-emerald-50";
  if (status === "Okay") return "border-amber-200 bg-amber-50";
  if (status === "Bad") return "border-rose-200 bg-rose-50";
  if (status === "Planned") return "border-sky-200 bg-sky-50";
  return "border-slate-200 bg-white/75";
}
