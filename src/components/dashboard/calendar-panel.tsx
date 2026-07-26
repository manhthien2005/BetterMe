"use client";

import {
  STATUS_LABELS,
  type DashboardCalendarDay,
  type DashboardStatus,
  type DashboardViewModel
} from "@/components/dashboard/dashboard-data";
import { cn, formatPercent } from "@/lib/utils";

export function CalendarPanel({
  days,
  viewModel
}: {
  days: DashboardCalendarDay[];
  viewModel: DashboardViewModel;
}) {
  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">Lịch tháng</h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            {viewModel.date.monthLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-matcha/40 bg-matcha/10 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-matcha-deep">Tháng này</p>
          <p className="font-display text-lg font-bold text-matcha-deep">
            {formatPercent(viewModel.calendar.monthCompletionRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-mauve">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            aria-label={`${day.label}, xong ${day.completedHabits}/${day.totalHabits} thói quen, ${STATUS_LABELS[day.status]}`}
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-wafer text-xs font-bold sm:h-9 sm:w-9",
              day.inCurrentMonth ? "text-plum" : "border-wafer/50 text-mauve/40",
              day.fillRatio >= 1 &&
                day.inCurrentMonth &&
                "border-transparent text-white shadow-[0_2px_8px_rgba(76,122,67,0.28)]",
              day.isToday && "ring-2 ring-sakura-deep ring-offset-2"
            )}
            key={day.date}
            role="img"
            style={calendarCellStyle(day)}
            title={`${day.label}: ${day.completedHabits}/${day.totalHabits} thói quen`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </section>
  );
}

function calendarCellStyle(day: DashboardCalendarDay) {
  const fillPercent = Math.round(day.fillRatio * 100);
  const fillColor = getCalendarFill(day.status);
  const trackColor = day.inCurrentMonth
    ? "rgba(245,230,224,0.95)"
    : "rgba(245,230,224,0.45)";

  if (day.fillRatio >= 1 && day.inCurrentMonth) {
    return {
      background: "#4C7A43"
    };
  }

  return {
    background: `radial-gradient(circle at center, rgba(255,255,255,0.98) 82%, transparent 83%), conic-gradient(${fillColor} ${fillPercent}%, ${trackColor} 0)`
  };
}

function getCalendarFill(status: DashboardStatus) {
  if (status === "Good") return "rgb(127, 176, 105)";
  if (status === "Okay") return "rgb(242, 176, 76)";
  if (status === "Bad") return "rgb(246, 198, 206)";
  return "rgba(111, 96, 105, 0.22)";
}
