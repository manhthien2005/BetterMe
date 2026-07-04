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

export function calculateScore(
  entry: HabitCompletionEntry | undefined,
  habits: readonly Habit[],
  policy: ScoringPolicy,
  date: ISODateString,
  today: ISODateString
): ScoreSummary {
  if (!Number.isFinite(policy.targetCompletionRate) || policy.targetCompletionRate < 0 || policy.targetCompletionRate > 1) {
    throw new RangeError("targetCompletionRate must be between 0 and 1");
  }
  for (const habit of habits) {
    if (!Number.isFinite(habit.maxScore) || habit.maxScore < 0) {
      throw new RangeError(`Habit ${habit.id} has an invalid maxScore`);
    }
  }

  const activeHabits = habits
    .filter((habit) => habit.active)
    .sort((left, right) => left.sortOrder - right.sortOrder || compareAscii(left.id, right.id));
  const maxScore = activeHabits.reduce((total, habit) => total + habit.maxScore, 0);
  const totalScore = activeHabits.reduce(
    (total, habit) => total + (entry?.habitCompletions[habit.id] === true ? habit.maxScore : 0),
    0
  );
  const missed = activeHabits.filter((habit) => entry?.habitCompletions[habit.id] !== true);

  let completionRate: number | null = maxScore > 0 ? totalScore / maxScore : 0;
  let status: ScoreSummary["status"];
  if (date < policy.startDate) {
    completionRate = null;
    status = null;
  } else if (date > today) {
    completionRate = null;
    status = "Planned";
  } else if (completionRate >= policy.targetCompletionRate) {
    status = "Good";
  } else if (completionRate >= 0.5) {
    status = "Okay";
  } else {
    status = "Bad";
  }

  return {
    totalScore,
    maxScore,
    completionRate,
    status,
    missedHabitKeys: missed.map((habit) => habit.key),
    missedHabitNames: missed.map((habit) => habit.name)
  };
}

function compareAscii(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
