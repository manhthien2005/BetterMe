import type {
  Habit,
  HabitCompletionEntry,
  ISODateString,
  ScoreSummary
} from "@/types";

export interface ScoringPolicy {
  startDate: ISODateString;
  targetCompletionRate: number;
}

// TODO: Implement the legacy weighted scoring rules under TDD during T-004.
export function calculateScore(
  _entry: HabitCompletionEntry | undefined,
  _habits: readonly Habit[],
  _policy: ScoringPolicy,
  _date: ISODateString,
  _today: ISODateString
): ScoreSummary {
  throw new Error("not implemented");
}
