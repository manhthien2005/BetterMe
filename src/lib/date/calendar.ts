import type { ISODateString, TrackerSettings } from "@/types";

// TODO: Implement timezone-aware date operations under TDD during T-003.
export function getZonedToday(_now: Date, _timezone: string): ISODateString {
  throw new Error("not implemented");
}

export function addDays(_date: ISODateString, _days: number): ISODateString {
  throw new Error("not implemented");
}

export function getWeekStart(_date: ISODateString): ISODateString {
  throw new Error("not implemented");
}

export function getWeekEnd(_date: ISODateString): ISODateString {
  throw new Error("not implemented");
}

export function buildMonthGrid(_date: ISODateString): ISODateString[] {
  throw new Error("not implemented");
}

export function buildTrackingRange(_settings: TrackerSettings, _now: Date): ISODateString[] {
  throw new Error("not implemented");
}
