import type { BetterMeData, DailyRecord } from "@/types";
import { buildDailyRecords } from "../../lib/scoring";

export function buildTrackingView(data: BetterMeData, now: Date): DailyRecord[] {
  return buildDailyRecords(data, now);
}
