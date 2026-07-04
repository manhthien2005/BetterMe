"use client";

import type { ISODateString } from "@/types";
import { useTracker } from "../../hooks/use-tracker";
import { formatScoreSummary } from "../../features/scoring";
import { DailyTracker } from "./daily-tracker";
import { ReflectionEditor } from "./reflection-editor";

export interface SelectedDayDetailProps {
  date: ISODateString;
}

export function SelectedDayDetail({ date }: SelectedDayDetailProps) {
  const tracker = useTracker();
  const record = tracker.records.find((candidate) => candidate.date === date);

  if (!tracker.state.hydrated) return <section aria-label="Selected day"><p>Loading selected day...</p></section>;
  if (!record) return <section aria-label="Selected day"><h2>{formatDisplayDate(date)}</h2><p>No record for this day.</p></section>;

  return (
    <section aria-label="Selected day">
      <h2>{formatDisplayDate(date)}</h2>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>{record.status ?? "Not tracked"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{formatScoreSummary(record)}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{record.streak ?? 0}</dd>
        </div>
      </dl>
      <DailyTracker date={date} />
      <ReflectionEditor date={date} entry={record.reflection} />
    </section>
  );
}

function formatDisplayDate(date: ISODateString) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
