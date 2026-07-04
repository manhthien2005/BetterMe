import type { ChartData, DailyRecord, Habit, ISODateString } from "@/types";
import type { Dictionary } from "../i18n/dictionary";
import { en } from "../i18n/locales/en";
import { getWeekEnd } from "../lib/date/index";

export function buildSelectedWeekHabits(
  records: readonly DailyRecord[],
  habits: readonly Habit[],
  weekStart: ISODateString,
  copy: Dictionary["charts"] = en.charts
): ChartData {
  const weekEnd = getWeekEnd(weekStart);
  const eligible = records.filter((record) => record.date >= weekStart && record.date <= weekEnd && record.completionRate !== null);
  const points = habits
    .filter((habit) => habit.active)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .map((habit) => {
      const completed = eligible.filter((record) => record.habitCompletions[habit.id] === true).length;
      return { key: habit.id, label: habit.name, value: eligible.length ? completed / eligible.length : 0, secondaryLabel: copy.daysCompleted(completed, eligible.length) };
    });
  return {
    id: "selected-week-habits",
    title: copy.selectedWeekHabitsTitle,
    description: copy.selectedWeekHabitsDescription,
    kind: "bar",
    xAxisLabel: "Habit",
    yAxisLabel: copy.completionRate,
    series: [{ id: "habits", label: copy.habitCompletion, colorToken: "chart-series-2", points }]
  };
}
