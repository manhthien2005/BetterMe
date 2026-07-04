import type { ChartData, DailyRecord, Habit, ISODateString } from "@/types";
import { getWeekEnd } from "../lib/date/index";

export function buildSelectedWeekHabits(
  records: readonly DailyRecord[],
  habits: readonly Habit[],
  weekStart: ISODateString
): ChartData {
  const weekEnd = getWeekEnd(weekStart);
  const eligible = records.filter((record) => record.date >= weekStart && record.date <= weekEnd && record.completionRate !== null);
  const points = habits
    .filter((habit) => habit.active)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .map((habit) => {
      const completed = eligible.filter((record) => record.habitCompletions[habit.id] === true).length;
      return { key: habit.id, label: habit.name, value: eligible.length ? completed / eligible.length : 0, secondaryLabel: `${completed} of ${eligible.length} days` };
    });
  return {
    id: "selected-week-habits",
    title: "Habit consistency",
    description: "Completion rate for each active habit in the selected week.",
    kind: "bar",
    xAxisLabel: "Habit",
    yAxisLabel: "Completion rate",
    series: [{ id: "habits", label: "Habit completion", colorToken: "chart-series-2", points }]
  };
}
