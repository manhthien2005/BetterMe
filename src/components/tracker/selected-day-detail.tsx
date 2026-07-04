"use client";

import type { ISODateString } from "@/types";
import { localeToIntl } from "../../i18n/locale";
import { useTracker } from "../../hooks/use-tracker";
import { formatScoreSummary } from "../../features/scoring";
import { useI18n } from "../i18n/locale-provider";
import { DailyTracker } from "./daily-tracker";
import { ReflectionEditor } from "./reflection-editor";

export interface SelectedDayDetailProps {
  date: ISODateString;
}

export function SelectedDayDetail({ date }: SelectedDayDetailProps) {
  const tracker = useTracker();
  const { dictionary, locale } = useI18n();
  const record = tracker.records.find((candidate) => candidate.date === date);

  if (!tracker.state.hydrated) return <section aria-label={dictionary.tracker.selectedDay}><p>{dictionary.common.loading}</p></section>;
  if (!record) return <section aria-label={dictionary.tracker.selectedDay}><h2>{formatDisplayDate(date, locale)}</h2><p>{dictionary.tracker.noRecord}</p></section>;

  return (
    <section aria-label={dictionary.tracker.selectedDay}>
      <h2>{formatDisplayDate(date, locale)}</h2>
      <dl>
        <div>
          <dt>{dictionary.tracker.status}</dt>
          <dd>{record.status ? dictionary.status[record.status] : dictionary.status.none}</dd>
        </div>
        <div>
          <dt>{dictionary.tracker.score}</dt>
          <dd>{formatScoreSummary(record)}</dd>
        </div>
        <div>
          <dt>{dictionary.tracker.streak}</dt>
          <dd>{record.streak ?? 0}</dd>
        </div>
      </dl>
      <DailyTracker date={date} />
      <ReflectionEditor date={date} entry={record.reflection} />
    </section>
  );
}

function formatDisplayDate(date: ISODateString, locale: ReturnType<typeof useI18n>["locale"]) {
  return new Intl.DateTimeFormat(localeToIntl(locale), { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
