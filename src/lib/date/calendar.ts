import type { ISODateString, TrackerSettings } from "@/types";
import { formatInTimeZone } from "date-fns-tz";

export function getZonedToday(now: Date, timezone: string): ISODateString {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd") as ISODateString;
}

export function addDays(date: ISODateString, days: number): ISODateString {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

export function getWeekStart(date: ISODateString): ISODateString {
  const day = parseDate(date).getUTCDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
}

export function getWeekEnd(date: ISODateString): ISODateString {
  return addDays(getWeekStart(date), 6);
}

export function buildMonthGrid(date: ISODateString): ISODateString[] {
  const [year, month] = date.split("-");
  const first = `${year}-${month}-01` as ISODateString;
  const gridStart = getWeekStart(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function buildTrackingRange(settings: TrackerSettings, now: Date): ISODateString[] {
  const today = getZonedToday(now, settings.timezone);
  const configuredEnd = addDays(settings.startDate, Math.max(1, settings.trackerDays) - 1);
  const firstDate = minDate(
    getWeekStart(settings.startDate),
    getWeekStart(today),
    getWeekStart(settings.selectedDate)
  );
  const lastDate = maxDate(
    configuredEnd,
    getWeekEnd(today),
    getWeekEnd(settings.selectedDate)
  );
  const length = differenceInDays(firstDate, lastDate) + 1;
  return Array.from({ length }, (_, index) => addDays(firstDate, index));
}

function parseDate(date: ISODateString): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`Invalid ISO date: ${date}`);
  const value = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatDate(value) !== date) throw new RangeError(`Invalid ISO date: ${date}`);
  return value;
}

function formatDate(date: Date): ISODateString {
  return date.toISOString().slice(0, 10) as ISODateString;
}

function differenceInDays(from: ISODateString, to: ISODateString): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

function minDate(...dates: ISODateString[]): ISODateString {
  return dates.reduce((minimum, date) => (date < minimum ? date : minimum));
}

function maxDate(...dates: ISODateString[]): ISODateString {
  return dates.reduce((maximum, date) => (date > maximum ? date : maximum));
}
