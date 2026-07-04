"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { HabitIcon } from "@/components/dashboard/habit-icon";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { addDaysIso, formatDisplayDate } from "@/lib/date";
import type { Habit, TrackerRecord } from "@/lib/types";
import { cn, formatPercent } from "@/lib/utils";

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function WeeklyBoard({
  habits,
  selectedDate,
  selectedWeekStart,
  records,
  onToggle,
  pendingKey
}: {
  habits: Habit[];
  selectedDate: string;
  selectedWeekStart: string;
  records: TrackerRecord[];
  onToggle: (date: string, habitId: string, done: boolean) => void;
  pendingKey?: string;
}) {
  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const weekDates = Array.from({ length: 7 }, (_, index) => addDaysIso(selectedWeekStart, index));

  return (
    <section className="soft-panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b bg-white/70 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-black tracking-normal text-slate-950">
            Weekly Quest Board
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDisplayDate(selectedWeekStart)} - {formatDisplayDate(weekDates[6])}
          </p>
        </div>
        <StatusBadge status={recordsByDate.get(selectedDate)?.status || ""} />
      </div>
      <div className="scrollbar-soft overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950 text-white">
              <th className="sticky left-0 z-10 w-64 bg-slate-950 px-4 py-3 text-left font-semibold">
                Daily Quest
              </th>
              {weekDates.map((date, index) => (
                <th
                  className={cn(
                    "w-[96px] px-3 py-3 text-center font-semibold",
                    date === selectedDate && "bg-teal-700"
                  )}
                  key={date}
                >
                  <span className="block">{dayNames[index]}</span>
                  <span className="text-xs font-medium text-white/70">{formatDisplayDate(date)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, habitIndex) => (
              <tr className={habitIndex % 2 ? "bg-sky-50/35" : "bg-white/82"} key={habit.id}>
                <th className="sticky left-0 z-10 border-b bg-inherit px-4 py-3 text-left font-semibold text-slate-800">
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm">
                      <HabitIcon category={habit.category} habitKey={habit.key} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{habit.name}</span>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {habit.maxScore} điểm
                      </span>
                    </span>
                  </span>
                </th>
                {weekDates.map((date) => {
                  const record = recordsByDate.get(date);
                  const checked = record?.habits[habit.id] === true;
                  const key = `${date}:${habit.id}`;

                  return (
                    <td
                      className={cn(
                        "border-b px-3 py-3 text-center",
                        date === selectedDate && "bg-teal-50"
                      )}
                      key={key}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={pendingKey === key}
                        onCheckedChange={(value) => onToggle(date, habit.id, value === true)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-white">
              <th className="sticky left-0 z-10 border-b bg-white px-4 py-3 text-left font-black text-slate-900">
                Score
              </th>
              {weekDates.map((date) => {
                const record = recordsByDate.get(date);
                return (
                  <td className="border-b px-3 py-3 text-center font-black" key={date}>
                    {record ? `${record.totalScore}/${record.maxScore}` : "0/0"}
                  </td>
                );
              })}
            </tr>
            <tr className="bg-white">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-black text-slate-900">
                Progress
              </th>
              {weekDates.map((date) => {
                const record = recordsByDate.get(date);
                return (
                  <td className="px-3 py-3 text-center font-semibold" key={date}>
                    {record?.completionRate !== null && record?.completionRate !== undefined
                      ? formatPercent(record.completionRate)
                      : "-"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
