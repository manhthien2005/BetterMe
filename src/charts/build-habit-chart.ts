import type { ChartData, DailyRecord, Habit, ISODateString } from "@/types";

// TODO: Transform selected-week habit completion during T-008.
export function buildSelectedWeekHabits(
  _records: readonly DailyRecord[],
  _habits: readonly Habit[],
  _weekStart: ISODateString
): ChartData {
  throw new Error("not implemented");
}
