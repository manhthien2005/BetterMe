import type { ChartData, DailyRecord, ISODateString } from "@/types";
import type { Dictionary } from "../i18n/dictionary";
import { en } from "../i18n/locales/en";
import { addDays } from "../lib/date/index";

export function buildThirtyDayProgress(
  records: readonly DailyRecord[],
  selectedDate: ISODateString,
  today: ISODateString,
  copy: Dictionary["charts"] = en.charts
): ChartData {
  const anchor = selectedDate < today ? selectedDate : today;
  const byDate = new Map(records.map((record) => [record.date, record]));
  const points = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(anchor, index - 29);
    return { key: date, label: `${date.slice(5, 7)}/${date.slice(8, 10)}`, value: byDate.get(date)?.completionRate ?? null, secondaryLabel: date };
  });
  return {
    id: "thirty-day-progress",
    title: copy.thirtyDayProgressTitle,
    description: copy.thirtyDayProgressDescription,
    kind: "line",
    xAxisLabel: "Date",
    yAxisLabel: copy.completionRate,
    series: [{ id: "completion", label: copy.dailyCompletionRate, colorToken: "chart-series-1", points }]
  };
}
