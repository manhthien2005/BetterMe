"use client";

import type { ISODateString } from "@/types";
import { useTracker } from "../../hooks/use-tracker";
import { SelectedDayDetail } from "../tracker/selected-day-detail";
import { MonthGrid } from "./month-grid";

export interface CalendarViewProps {
  selectedDate?: ISODateString;
}

export function CalendarView({ selectedDate }: CalendarViewProps) {
  const tracker = useTracker();
  const effectiveSelectedDate = tracker.state.data?.settings.selectedDate ?? selectedDate;

  if (!tracker.state.hydrated || !tracker.state.data || !effectiveSelectedDate) {
    return (
      <section aria-label="Calendar">
        <h1>Calendar</h1>
        <p>Loading calendar...</p>
      </section>
    );
  }

  return (
    <section aria-label="Calendar" className="calendar-view">
      <h1>Calendar</h1>
      <MonthGrid selectedDate={effectiveSelectedDate} />
      <SelectedDayDetail date={effectiveSelectedDate} />
    </section>
  );
}
