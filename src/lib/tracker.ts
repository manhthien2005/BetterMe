import {
  DEFAULT_TARGET_COMPLETION_RATE,
  DEFAULT_TRACKER_DAYS,
  habitIcon
} from "@/lib/defaults";
import {
  addDaysIso,
  formatDisplayDate,
  getDayLabel,
  getMonthGrid,
  getWeekEndIso,
  getWeekStartIso,
  maxIsoDate,
  minIsoDate,
  parseIsoDate,
  todayIso
} from "@/lib/date";
import type {
  DailyEntry,
  Habit,
  HabitLog,
  HabitRatePoint,
  ProfileSettings,
  TrackerRecord,
  TrackerSnapshot
} from "@/lib/types";
import { formatPercent } from "@/lib/utils";

type BuildTrackerInput = {
  profile: ProfileSettings;
  habits: Habit[];
  dailyEntries: DailyEntry[];
  habitLogs: HabitLog[];
  selectedDate?: string;
  today?: string;
};

export function buildTrackerSnapshot({
  profile,
  habits,
  dailyEntries,
  habitLogs,
  selectedDate = profile.selectedDate,
  today = todayIso()
}: BuildTrackerInput): TrackerSnapshot {
  const activeHabits = habits.filter((habit) => habit.active);
  const trackerDays = Number(profile.trackerDays) || DEFAULT_TRACKER_DAYS;
  const targetRate =
    Number(profile.targetCompletionRate) || DEFAULT_TARGET_COMPLETION_RATE;
  const startDate = profile.startDate;
  const firstDate = minIsoDate(
    getWeekStartIso(startDate),
    getWeekStartIso(today),
    getWeekStartIso(selectedDate)
  );
  const configuredLastDate = addDaysIso(startDate, trackerDays - 1);
  const lastDate = maxIsoDate(
    configuredLastDate,
    getWeekEndIso(today),
    getWeekEndIso(selectedDate)
  );
  const entriesByDate = new Map(dailyEntries.map((entry) => [entry.date, entry]));
  const logsByKey = new Map(
    habitLogs.map((log) => [`${log.date}:${log.habitId}`, log])
  );
  const records: TrackerRecord[] = [];
  const maxScore = activeHabits.reduce((sum, habit) => sum + safeScore(habit.maxScore), 0);

  for (let date = firstDate; date <= lastDate; date = addDaysIso(date, 1)) {
    const entry = entriesByDate.get(date);
    const habitMap: Record<string, boolean> = {};
    const habitLogIds: Record<string, string> = {};
    const missedKeys: string[] = [];
    const missedNames: string[] = [];

    activeHabits.forEach((habit) => {
      const log = logsByKey.get(`${date}:${habit.id}`);
      const done = log?.done === true;
      habitMap[habit.id] = done;
      habitLogIds[habit.id] = habit.key;

      if (!done) {
        missedKeys.push(habit.key);
        missedNames.push(habit.name);
      }
    });

    const totalScore = activeHabits.reduce((sum, habit) => {
      return sum + (habitMap[habit.id] ? safeScore(habit.maxScore) : 0);
    }, 0);

    records.push({
      date,
      weekStart: getWeekStartIso(date),
      dayLabel: getDayLabel(date),
      habits: habitMap,
      habitLogIds,
      dailyNote: entry?.dailyNote || "",
      problemToday: entry?.problemToday || "",
      tomorrowFocus: entry?.tomorrowFocus || "",
      totalScore,
      maxScore,
      completionRate: null,
      status: "",
      streak: null,
      missedKeys,
      missedNames
    });
  }

  let streak = 0;

  records.forEach((record) => {
    if (record.date < startDate) {
      return;
    }

    if (record.date > today) {
      record.status = "Planned";
      return;
    }

    record.completionRate = maxScore > 0 ? record.totalScore / maxScore : 0;

    if (record.completionRate >= targetRate) {
      record.status = "Good";
    } else if (record.completionRate >= 0.5) {
      record.status = "Okay";
    } else {
      record.status = "Bad";
    }

    if (record.status === "Good") {
      streak += 1;
    } else {
      streak = 0;
    }

    record.streak = streak;
  });

  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const selectedWeekStart = getWeekStartIso(selectedDate);
  const selectedWeekEnd = getWeekEndIso(selectedDate);
  const selectedWeekRecords = records.filter(
    (record) =>
      record.date >= selectedWeekStart &&
      record.date <= selectedWeekEnd &&
      record.date >= startDate &&
      record.date <= today &&
      record.completionRate !== null
  );
  const todayRecord = recordsByDate.get(today) || null;
  const selectedDayRecord = recordsByDate.get(selectedDate) || null;
  const selectedWeekRate = average(
    selectedWeekRecords.map((record) => record.completionRate ?? 0)
  );
  const missedCount = selectedWeekRecords.reduce(
    (sum, record) => sum + record.missedKeys.length,
    0
  );
  const currentStreak = todayRecord?.streak ?? 0;
  const chartAnchor = selectedDate < today ? selectedDate : today;
  const dailyChart = Array.from({ length: 30 }, (_, index) => {
    const date = addDaysIso(chartAnchor, index - 29);
    const record = recordsByDate.get(date);

    return {
      date,
      label: formatDisplayDate(date),
      completion: record && date >= startDate ? record.completionRate : null
    };
  });
  const habitChart: HabitRatePoint[] = activeHabits.map((habit) => {
    const denominator = selectedWeekRecords.length;
    const completed = selectedWeekRecords.filter(
      (record) => record.habits[habit.id] === true
    ).length;

    return {
      habitId: habit.id,
      habitName: habit.name,
      icon: habitIcon(habit.key, habit.category),
      rate: denominator ? completed / denominator : 0
    };
  });
  const selectedMonth = parseIsoDate(selectedDate).getMonth();
  const calendar: TrackerSnapshot["calendar"] = getMonthGrid(selectedDate).map((date) => {
    const record = recordsByDate.get(date);

    return {
      date,
      day: parseIsoDate(date).getDate(),
      inCurrentMonth: parseIsoDate(date).getMonth() === selectedMonth,
      status: record?.status || "",
      completionRate: record?.completionRate ?? null
    };
  });

  return {
    profile: {
      ...profile,
      selectedDate
    },
    habits,
    activeHabits,
    records,
    today,
    selectedDate,
    selectedWeekStart,
    selectedWeekEnd,
    selectedWeekRecords,
    todayRecord,
    metrics: {
      todayProgress: todayRecord
        ? `${todayRecord.totalScore}/${todayRecord.maxScore} - ${formatPercent(
            todayRecord.completionRate ?? 0
          )}`
        : "0/0 - 0%",
      todayCompletionRate: todayRecord?.completionRate ?? 0,
      selectedWeekRate,
      missedCount,
      currentStreak,
      selectedDayScore: selectedDayRecord
        ? `${selectedDayRecord.totalScore}/${selectedDayRecord.maxScore}`
        : "0/0",
      selectedDayStatus: selectedDayRecord?.status || ""
    },
    dailyChart,
    habitChart,
    calendar
  };
}

function safeScore(value: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));

  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}
