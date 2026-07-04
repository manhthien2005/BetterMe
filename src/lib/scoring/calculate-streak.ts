import type { DailyRecord } from "@/types";

export function applyStreaks(records: readonly DailyRecord[]): DailyRecord[] {
  let running = 0;
  return [...records]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((record) => {
      if (record.status === null || record.status === "Planned") {
        return { ...record, streak: null };
      }
      running = record.status === "Good" ? running + 1 : 0;
      return { ...record, streak: running };
    });
}
