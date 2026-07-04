import { buildTrackerSnapshot } from "@/lib/tracker";
import type { DailyEntry, HabitLog, TrackerSnapshot } from "@/lib/types";

function toDailyEntries(snapshot: TrackerSnapshot): DailyEntry[] {
  return snapshot.records
    .filter(
      (record) => record.dailyNote || record.problemToday || record.tomorrowFocus
    )
    .map((record) => ({
      userId: snapshot.profile.userId,
      date: record.date,
      dailyNote: record.dailyNote,
      problemToday: record.problemToday,
      tomorrowFocus: record.tomorrowFocus
    }));
}

function toHabitLogs(snapshot: TrackerSnapshot): HabitLog[] {
  return snapshot.records.flatMap((record) =>
    snapshot.habits
      .filter((habit) => record.habits[habit.id])
      .map((habit) => ({
        userId: snapshot.profile.userId,
        habitId: habit.id,
        date: record.date,
        done: true
      }))
  );
}

export function optimisticToggleHabit(
  snapshot: TrackerSnapshot,
  input: { date: string; habitId: string; done: boolean }
) {
  const logs = toHabitLogs(snapshot).filter(
    (log) => !(log.date === input.date && log.habitId === input.habitId)
  );

  if (input.done) {
    logs.push({
      userId: snapshot.profile.userId,
      habitId: input.habitId,
      date: input.date,
      done: true
    });
  }

  return buildTrackerSnapshot({
    profile: snapshot.profile,
    habits: snapshot.habits,
    dailyEntries: toDailyEntries(snapshot),
    habitLogs: logs,
    selectedDate: snapshot.selectedDate,
    today: snapshot.today
  });
}

export function optimisticDayEntry(
  snapshot: TrackerSnapshot,
  input: {
    date: string;
    dailyNote: string;
    problemToday: string;
    tomorrowFocus: string;
  }
) {
  const entries = toDailyEntries(snapshot).filter((entry) => entry.date !== input.date);

  entries.push({
    userId: snapshot.profile.userId,
    date: input.date,
    dailyNote: input.dailyNote,
    problemToday: input.problemToday,
    tomorrowFocus: input.tomorrowFocus
  });

  return buildTrackerSnapshot({
    profile: snapshot.profile,
    habits: snapshot.habits,
    dailyEntries: entries,
    habitLogs: toHabitLogs(snapshot),
    selectedDate: snapshot.selectedDate,
    today: snapshot.today
  });
}

export function optimisticHabitConfig(snapshot: TrackerSnapshot, habits: TrackerSnapshot["habits"]) {
  return buildTrackerSnapshot({
    profile: snapshot.profile,
    habits,
    dailyEntries: toDailyEntries(snapshot),
    habitLogs: toHabitLogs(snapshot),
    selectedDate: snapshot.selectedDate,
    today: snapshot.today
  });
}
