"use client";

import type { ISODateString } from "@/types";
import { addDays, getWeekEnd, getWeekStart } from "../../lib/date/index";
import { useTracker } from "../../hooks/use-tracker";
import { SelectedDayDetail } from "./selected-day-detail";
import { WeekNavigation } from "./week-navigation";

export interface WeeklyQuestBoardProps {
  weekStart?: ISODateString;
}

export function WeeklyQuestBoard({ weekStart }: WeeklyQuestBoardProps) {
  const tracker = useTracker();
  const selectedDate = tracker.state.data?.settings.selectedDate;
  const currentWeekStart = weekStart ?? (selectedDate ? getWeekStart(selectedDate) : null);

  if (!tracker.state.hydrated || !tracker.state.data || !selectedDate || !currentWeekStart) {
    return (
      <section aria-label="Weekly tracker">
        <h1>Weekly quest board</h1>
        <p>Loading weekly tracker...</p>
      </section>
    );
  }

  const weekEnd = getWeekEnd(currentWeekStart);
  const records = tracker.records.filter((record) => record.date >= currentWeekStart && record.date <= weekEnd);

  return (
    <section aria-label="Weekly tracker" className="weekly-quest-board">
      <h1>Weekly quest board</h1>
      <WeekNavigation
        weekStart={currentWeekStart}
        onPrevious={() => tracker.setSelectedDate(addDays(currentWeekStart, -7))}
        onNext={() => tracker.setSelectedDate(addDays(currentWeekStart, 7))}
      />
      <ul aria-label="Weekly quest days" className="weekly-quest-board__days">
        {records.map((record) => (
          <li key={record.date}>
            <button
              aria-label={formatDateButton(record.date)}
              aria-pressed={record.date === selectedDate}
              onClick={() => tracker.setSelectedDate(record.date)}
              type="button"
            >
              <span>{record.dayLabel}</span>
              <strong>{record.status ?? "Not tracked"}</strong>
              <span>{formatRate(record.completionRate)}</span>
            </button>
          </li>
        ))}
      </ul>
      <SelectedDayDetail date={selectedDate} />
    </section>
  );
}

function formatDateButton(date: ISODateString) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function formatRate(rate: number | null) {
  return rate === null ? "Planned" : `${Math.round(rate * 100)}%`;
}
