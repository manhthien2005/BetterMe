"use client";

import type { DailyRecord, ISODateString } from "@/types";
import { localeToIntl } from "../../i18n/locale";
import { addDays, buildMonthGrid, getZonedToday } from "../../lib/date/index";
import { useTracker } from "../../hooks/use-tracker";
import { useI18n } from "../i18n/locale-provider";

export interface MonthGridProps {
  selectedDate: ISODateString;
}

export function MonthGrid({ selectedDate }: MonthGridProps) {
  const tracker = useTracker();
  const { dictionary, locale } = useI18n();
  const recordsByDate = new Map(tracker.records.map((record) => [record.date, record]));
  const today = tracker.state.data ? getZonedToday(tracker.state.now, tracker.state.data.settings.timezone) : selectedDate;
  const dates = buildMonthGrid(selectedDate);

  return (
    <div aria-label={dictionary.calendar.monthCalendar} className="month-grid" role="grid">
      {dates.map((date) => {
        const record = recordsByDate.get(date);
        const selected = date === selectedDate;
        const current = date === today;

        return (
          <div key={date} role="gridcell">
            <button
              aria-label={formatDateButton(date, record, selected, current, dictionary, locale)}
              aria-pressed={selected}
              onClick={() => tracker.setSelectedDate(date)}
              onKeyDown={(event) => handleKeyDown(event, date, tracker.setSelectedDate)}
              type="button"
            >
              <span>{Number(date.slice(8, 10))}</span>
              <strong>{record?.status ? dictionary.status[record.status] : dictionary.status.none}</strong>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function handleKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  date: ISODateString,
  setSelectedDate: (date: ISODateString) => void
) {
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  const offset = offsets[event.key];
  if (offset === undefined) return;
  event.preventDefault();
  setSelectedDate(addDays(date, offset));
}

function formatDateButton(
  date: ISODateString,
  record: DailyRecord | undefined,
  selected: boolean,
  current: boolean,
  dictionary: ReturnType<typeof useI18n>["dictionary"],
  locale: ReturnType<typeof useI18n>["locale"]
) {
  const label = new Intl.DateTimeFormat(localeToIntl(locale), { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return [label, selected ? dictionary.calendar.selected : null, current ? dictionary.calendar.today : null, record?.status ? dictionary.status[record.status] : dictionary.status.none].filter(Boolean).join(" ");
}
