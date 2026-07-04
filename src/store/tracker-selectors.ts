import type { DailyRecord, WeekSummary } from "@/types";
import { getWeekStart } from "../lib/date/index";
import { buildDailyRecords, summarizeWeek } from "../lib/scoring/index";
import type { TrackerState } from "./tracker-reducer";

export function selectDailyRecords(state: TrackerState): DailyRecord[] {
  return state.data ? buildDailyRecords(state.data, state.now) : [];
}

export function selectSelectedWeek(state: TrackerState): WeekSummary | null {
  if (!state.data) return null;
  return summarizeWeek(selectDailyRecords(state), getWeekStart(state.data.settings.selectedDate));
}
