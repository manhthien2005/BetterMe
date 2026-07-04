import type { DailyRecord, WeekSummary } from "@/types";

export interface DashboardOverviewProps {
  today: DailyRecord | null;
  selectedWeek: WeekSummary;
}

// TODO: Render canonical dashboard metrics and progress during T-013.
export function DashboardOverview(_props: DashboardOverviewProps) {
  return null;
}
