import type { BetterMeData, DailyRecord, StorageAdapter, WeekSummary } from "@/types";

export interface TrackerState {
  data: BetterMeData | null;
  hydrated: boolean;
  saving: boolean;
  persistenceError: string | null;
}

export interface TrackerStoreApi {
  state: TrackerState;
  records: DailyRecord[];
  selectedWeek: WeekSummary | null;
  retrySave(): Promise<void>;
}

// TODO: Implement reducer hydration and serialized saves during T-007.
export function createTrackerStore(_adapter: StorageAdapter): TrackerStoreApi {
  throw new Error("not implemented");
}
