"use client";

import { Flame } from "lucide-react";

import { HABIT_COLOR_STYLES } from "@/components/dashboard/habit-model";
import { Card } from "@/components/ui/card";
import type { WeekCell, WeekGrid } from "@/components/dashboard/week-model";
import { formatDisplayDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * "Tuần này" (spec §4.2): rows are habits, columns are T2→CN.
 *
 * A real <table> rather than a div grid — a week of habits IS tabular data, and
 * a screen reader user needs to move by row and column. Every cell carries its
 * meaning in text (its accessible name), because the fill alone would put the
 * whole view behind colour vision (WCAG 1.4.1).
 */
export function WeekGridCard({
  grid,
  previousDone,
  streaks
}: {
  grid: WeekGrid;
  /** Cells finished last week. Omit when there is no last week to compare to. */
  previousDone?: number;
  streaks: Record<string, number>;
}) {
  if (grid.rows.length === 0) {
    return (
      <Card className="p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-ink">Tuần này</h2>
        <p className="mt-2 text-sm font-medium text-ink-mid">
          Tuần này chưa có thói quen nào trên lịch. Trồng một cái là lưới sẽ mọc lên.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold text-ink">Tuần này</h2>

      {/* Mobile: the grid scrolls inside the card, never widening the page. */}
      <div className="-mx-1 mt-4 overflow-x-auto px-1">
        <table className="w-full min-w-[420px] border-separate border-spacing-y-1">
          <caption className="sr-only">
            Thói quen theo ngày trong tuần, từ Thứ Hai đến Chủ Nhật
          </caption>
          <thead>
            <tr>
              <th className="w-[38%] min-w-[132px] text-left text-xs font-bold uppercase tracking-wide text-ink-soft" scope="col">
                Thói quen
              </th>
              {grid.days.map((day) => (
                <th
                  aria-current={day.isToday ? "date" : undefined}
                  className={cn(
                    "px-0.5 text-center text-xs font-bold",
                    day.isToday ? "text-action" : "text-ink-soft"
                  )}
                  key={day.date}
                  scope="col"
                >
                  {day.label}
                </th>
              ))}
              <th className="px-1 text-center text-xs font-bold uppercase tracking-wide text-ink-soft" scope="col">
                Chuỗi
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => {
              const colour = HABIT_COLOR_STYLES[row.habit.color];
              const streak = streaks[row.habit.id] ?? 0;

              return (
                <tr key={row.habit.id}>
                  <th className="text-left font-normal" scope="row">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-sm",
                          colour.soft
                        )}
                      >
                        {row.habit.icon}
                      </span>
                      <span className="truncate text-sm font-semibold text-ink">
                        {row.habit.name}
                      </span>
                    </span>
                  </th>

                  {row.cells.map((cell, index) => (
                    <td className="px-0.5 text-center align-middle" key={cell.date}>
                      <WeekSquare
                        cell={cell}
                        dayLabel={grid.days[index].label}
                        habitName={row.habit.name}
                        strong={colour.strong}
                        unit={row.habit.unit}
                      />
                    </td>
                  ))}

                  <td className="px-1 text-center align-middle">
                    <span
                      aria-label={`Chuỗi ${row.habit.name}: ${streak} ngày`}
                      className="inline-flex items-center gap-0.5 text-xs font-bold text-action"
                    >
                      <Flame aria-hidden="true" className="h-3 w-3" />
                      {streak}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm font-semibold text-ink-mid" data-testid="week-summary">
        Tuần này {grid.total.done}/{grid.total.scheduled} lượt
        {previousDone === undefined ? "" : ` — ${comparisonPhrase(grid.total.done, previousDone)}`}
      </p>
    </Card>
  );
}

/**
 * The comparison is always against the user's own last week (spec §4.2).
 * Behind is stated as a fact about last week, never as a judgement about the
 * user — the no-guilt invariant applies to numbers too.
 */
function comparisonPhrase(done: number, previousDone: number): string {
  if (previousDone === 0) return "tuần đầu tiên của nhịp này";
  if (done > previousDone) return `hơn tuần trước +${done - previousDone}`;
  if (done === previousDone) return "bằng tuần trước";

  return `tuần trước ${previousDone} lượt`;
}

/** "T2 20 tháng 7" — the weekday label plus a real date, for the cell's name. */
function dayName(date: string, label: string): string {
  return `${label} ${formatDisplayDate(date, { day: "numeric", month: "long" })}`;
}

function cellMeaning(cell: WeekCell, unit: string | null | undefined): string {
  switch (cell.state) {
    case "done":
      return "đã xong";
    case "partial":
      return `${cell.done}/${cell.target}${unit ? ` ${unit}` : ""}`;
    case "off":
      return "không theo lịch";
    case "future":
      return "chưa tới";
    case "empty":
      return "hôm nay, chưa ghi";
    case "missed":
      return "chưa ghi";
  }
}

function WeekSquare({
  cell,
  dayLabel,
  habitName,
  strong,
  unit
}: {
  cell: WeekCell;
  /** The column's T2…CN label — the row does not recompute the weekday. */
  dayLabel: string;
  habitName: string;
  /** The habit's own colour, used for the filled state. */
  strong: string;
  unit: string | null | undefined;
}) {
  const label = `${habitName}, ${dayName(cell.date, dayLabel)}: ${cellMeaning(cell, unit)}`;

  return (
    <span
      aria-label={label}
      className={cn(
        "mx-auto flex h-7 w-7 items-center justify-center rounded-control text-[11px] font-bold",
        cell.state === "done" && cn(strong, "text-white"),
        cell.state === "partial" && "border border-line-strong bg-surface-warm text-ink",
        cell.state === "missed" && "border border-line bg-surface-page",
        cell.state === "empty" && "border-2 border-dashed border-action/60 bg-surface-card",
        cell.state === "off" && "bg-surface-page/60",
        cell.state === "future" && "border border-dashed border-line"
      )}
      role="img"
      title={label}
    >
      {/* A partial cell shows how far along it is as a fraction of the square's
          height — a number like "4" inside a 28px box is unreadable, and the
          exact reading is already in the accessible name and the tooltip. */}
      {cell.state === "done" ? "✓" : null}
      {cell.state === "partial" ? (
        <span
          aria-hidden="true"
          className={cn("w-full self-end rounded-b-control", strong)}
          style={{ height: `${Math.max(15, Math.round(cell.ratio * 100))}%` }}
        />
      ) : null}
      {cell.state === "off" ? <span aria-hidden="true" className="text-ink-soft">·</span> : null}
    </span>
  );
}
