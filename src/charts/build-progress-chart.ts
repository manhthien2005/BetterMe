import type { ChartData, DailyRecord, ISODateString } from "@/types";
import { addDays } from "../lib/date/index";

export function buildThirtyDayProgress(
  records: readonly DailyRecord[],
  selectedDate: ISODateString,
  today: ISODateString
): ChartData {
  const anchor = selectedDate < today ? selectedDate : today;
  const byDate = new Map(records.map((record) => [record.date, record]));
  const points = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(anchor, index - 29);
    return { key: date, label: `${date.slice(5, 7)}/${date.slice(8, 10)}`, value: byDate.get(date)?.completionRate ?? null, secondaryLabel: date };
  });
  return {
    id: "thirty-day-progress",
    title: "30-day progress",
    description: "Daily completion rate for the 30 days ending at the selected date.",
    kind: "line",
    xAxisLabel: "Date",
    yAxisLabel: "Completion rate",
    series: [{ id: "completion", label: "Completion", colorToken: "chart-series-1", points }]
  };
}
