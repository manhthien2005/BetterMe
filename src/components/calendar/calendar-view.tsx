"use client";

import type { ISODateString } from "@/types";
import { useTracker } from "../../hooks/use-tracker";
import { useI18n } from "../i18n/locale-provider";
import { SelectedDayDetail } from "../tracker/selected-day-detail";
import { MonthGrid } from "./month-grid";

export interface CalendarViewProps {
  selectedDate?: ISODateString;
}

export function CalendarView({ selectedDate }: CalendarViewProps) {
  const tracker = useTracker();
  const { dictionary } = useI18n();
  const effectiveSelectedDate = tracker.state.data?.settings.selectedDate ?? selectedDate;

  if (!tracker.state.hydrated || !tracker.state.data || !effectiveSelectedDate) {
    return (
      <section aria-label={dictionary.calendar.title}>
        <h1>{dictionary.calendar.title}</h1>
        <p>{dictionary.calendar.loading}</p>
      </section>
    );
  }

  return (
    <section aria-label={dictionary.calendar.title} className="calendar-view">
      <h1>{dictionary.calendar.title}</h1>
      <MonthGrid selectedDate={effectiveSelectedDate} />
      <SelectedDayDetail date={effectiveSelectedDate} />
    </section>
  );
}
