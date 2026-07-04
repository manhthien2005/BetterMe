import type { ChartData, DailyRecord, ISODateString } from "@/types";

// TODO: Transform the 30-day record window during T-008.
export function buildThirtyDayProgress(
  _records: readonly DailyRecord[],
  _selectedDate: ISODateString,
  _today: ISODateString
): ChartData {
  throw new Error("not implemented");
}
