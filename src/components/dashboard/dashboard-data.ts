import { DEFAULT_HABITS, habitIcon } from "@/lib/defaults";
import {
  addDaysIso,
  getMonthGrid,
  parseIsoDate,
  todayIso
} from "@/lib/date";
import { clamp } from "@/lib/utils";

const TARGET_COMPLETION_RATE = 0.8;
const BEST_STREAK_FLOOR = 26;
const HISTORY_DAYS = 45;

export type DashboardHabit = {
  id: string;
  key: string;
  name: string;
  category: string;
  maxScore: number;
  description: string;
  iconName: string;
};

export type DashboardDayRecord = {
  date: string;
  completions: Record<string, boolean>;
};

export type DashboardEvent = {
  id: string;
  title: string;
  time: string;
  category: "habit" | "planning" | "reflection" | "personal";
};

export type DashboardState = {
  habits: DashboardHabit[];
  records: Record<string, DashboardDayRecord>;
  events: DashboardEvent[];
  bestStreakFloor: number;
};

export type DashboardStatus = "Good" | "Okay" | "Bad" | "Planned" | "No data";

export type DashboardHabitView = DashboardHabit & {
  completed: boolean;
};

export type DashboardCalendarDay = {
  date: string;
  day: number;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  status: DashboardStatus;
  fillRatio: number;
  completedHabits: number;
  totalHabits: number;
};

export type DashboardViewModel = {
  date: {
    iso: string;
    longLabel: string;
    monthLabel: string;
  };
  greeting: string;
  motivation: string;
  habits: DashboardHabitView[];
  today: {
    completedHabits: number;
    totalHabits: number;
    totalScore: number;
    maxScore: number;
    completionRate: number;
    status: DashboardStatus;
  };
  streak: {
    current: number;
    best: number;
    chain: Array<{
      date: string;
      label: string;
      completed: boolean;
      status: DashboardStatus;
    }>;
    protectionMessage: string;
  };
  calendar: {
    monthCompletionRate: number;
    days: DashboardCalendarDay[];
  };
  analytics: {
    averageCompletionRate: number;
    changeFromPreviousPeriod: number;
    goodDays: number;
    totalCompletedHabits: number;
    mostConsistentHabitName: string | null;
    habitNeedingAttentionName: string | null;
    trend: Array<{
      date: string;
      label: string;
      completionRate: number;
      status: DashboardStatus;
    }>;
    habitPerformance: Array<{
      habitId: string;
      habitName: string;
      completionRate: number;
    }>;
  };
  events: DashboardEvent[];
};

export function getDashboardToday() {
  return todayIso();
}

export function createInitialDashboardState(today = getDashboardToday()): DashboardState {
  const habits = DEFAULT_HABITS.map((item) => ({
    id: item.key,
    key: item.key,
    name: item.name,
    category: item.category,
    maxScore: item.maxScore,
    description: item.description,
    iconName: habitIcon(item.key, item.category)
  }));
  const records: Record<string, DashboardDayRecord> = {};

  for (let offset = HISTORY_DAYS; offset >= 0; offset -= 1) {
    const date = addDaysIso(today, -offset);
    const completions: Record<string, boolean> = {};

    habits.forEach((habit, index) => {
      completions[habit.id] = isSeedHabitComplete(habit.key, index, offset);
    });

    records[date] = {
      date,
      completions
    };
  }

  return {
    habits,
    records,
    events: createSeedEvents(),
    bestStreakFloor: BEST_STREAK_FLOOR
  };
}

export function toggleHabitForDate(
  state: DashboardState,
  date: string,
  habitId: string
): DashboardState {
  const currentRecord = state.records[date] ?? {
    date,
    completions: Object.fromEntries(state.habits.map((habit) => [habit.id, false]))
  };

  return {
    ...state,
    records: {
      ...state.records,
      [date]: {
        date,
        completions: {
          ...currentRecord.completions,
          [habitId]: !currentRecord.completions[habitId]
        }
      }
    }
  };
}

export function buildDashboardViewModel(
  state: DashboardState,
  today = getDashboardToday()
): DashboardViewModel {
  const todayScore = scoreDate(state, today);
  const month = parseIsoDate(today).getMonth();
  const currentStreak = calculateCurrentStreak(state, today);
  const bestStreak = Math.max(state.bestStreakFloor, calculateBestStreak(state));
  const analytics = buildAnalytics(state, today);
  const monthDays = getMonthGrid(today).map((date) => {
    const score = scoreDate(state, date);

    return {
      date,
      day: parseIsoDate(date).getDate(),
      label: formatEnglishCalendarDate(date),
      inCurrentMonth: parseIsoDate(date).getMonth() === month,
      isToday: date === today,
      status: score.status,
      fillRatio: score.completionRate,
      completedHabits: score.completedHabits,
      totalHabits: score.totalHabits
    };
  });
  const monthScores = monthDays
    .filter((day) => day.inCurrentMonth && state.records[day.date])
    .map((day) => day.fillRatio);
  const habitViews = state.habits.map((habit) => ({
    ...habit,
    completed: state.records[today]?.completions[habit.id] === true
  }));

  return {
    date: {
      iso: today,
      longLabel: formatEnglishLongDate(today),
      monthLabel: formatEnglishMonthLabel(today)
    },
    greeting: buildGreeting(),
    motivation: buildMotivation(todayScore.status, todayScore.completionRate),
    habits: habitViews,
    today: todayScore,
    streak: {
      current: currentStreak,
      best: bestStreak,
      chain: buildStreakChain(state, today),
      protectionMessage: buildProtectionMessage(currentStreak, todayScore.completionRate)
    },
    calendar: {
      monthCompletionRate: average(monthScores),
      days: monthDays
    },
    analytics,
    events: state.events
  };
}

function isSeedHabitComplete(key: string, index: number, offsetFromToday: number) {
  if (offsetFromToday <= 11) {
    return key !== "clean" || offsetFromToday % 3 !== 0;
  }

  if (offsetFromToday === 12) {
    return index < 2;
  }

  return (offsetFromToday + index) % 4 !== 0;
}

function createSeedEvents(): DashboardEvent[] {
  return [
    {
      id: "event-weekly-review",
      title: "Weekly review",
      time: "Tonight, 20:30",
      category: "reflection"
    },
    {
      id: "event-english-focus",
      title: "English speaking block",
      time: "Tomorrow, 07:45",
      category: "habit"
    },
    {
      id: "event-project-sprint",
      title: "Project deep work",
      time: "Tomorrow, 21:00",
      category: "planning"
    },
    {
      id: "event-reset",
      title: "Desk reset",
      time: "Monday, 19:15",
      category: "personal"
    }
  ];
}

function scoreDate(state: DashboardState, date: string) {
  const record = state.records[date];
  const maxScore = state.habits.reduce((sum, habit) => sum + habit.maxScore, 0);
  const totalScore = state.habits.reduce((sum, habit) => {
    return sum + (record?.completions[habit.id] ? habit.maxScore : 0);
  }, 0);
  const completedHabits = state.habits.filter(
    (habit) => record?.completions[habit.id] === true
  ).length;
  const completionRate = maxScore > 0 ? clamp(totalScore / maxScore, 0, 1) : 0;

  return {
    completedHabits,
    totalHabits: state.habits.length,
    totalScore,
    maxScore,
    completionRate,
    status: getStatus(record, completionRate)
  };
}

function getStatus(record: DashboardDayRecord | undefined, completionRate: number): DashboardStatus {
  if (!record) return "No data";
  if (completionRate >= TARGET_COMPLETION_RATE) return "Good";
  if (completionRate >= 0.5) return "Okay";
  return "Bad";
}

function calculateCurrentStreak(state: DashboardState, today: string) {
  let streak = 0;

  for (let date = today; state.records[date]; date = addDaysIso(date, -1)) {
    if (scoreDate(state, date).status !== "Good") break;
    streak += 1;
  }

  return streak;
}

function calculateBestStreak(state: DashboardState) {
  let best = 0;
  let current = 0;

  Object.keys(state.records)
    .sort()
    .forEach((date) => {
      if (scoreDate(state, date).status === "Good") {
        current += 1;
        best = Math.max(best, current);
        return;
      }

      current = 0;
    });

  return best;
}

function buildStreakChain(state: DashboardState, today: string) {
  return Array.from({ length: 7 }, (_, index) => addDaysIso(today, index - 6)).map(
    (date) => {
      const score = scoreDate(state, date);

      return {
        date,
        label: formatEnglishDayNumber(date),
        completed: score.status === "Good",
        status: score.status
      };
    }
  );
}

function buildAnalytics(state: DashboardState, today: string) {
  const trendDates = Array.from({ length: 14 }, (_, index) => addDaysIso(today, index - 13));
  const previousDates = Array.from({ length: 14 }, (_, index) => addDaysIso(today, index - 27));
  const trendScores = trendDates.map((date) => scoreDate(state, date));
  const previousScores = previousDates.map((date) => scoreDate(state, date));
  const averageCompletionRate = average(trendScores.map((score) => score.completionRate));
  const previousAverage = average(previousScores.map((score) => score.completionRate));

  return {
    averageCompletionRate,
    changeFromPreviousPeriod: averageCompletionRate - previousAverage,
    goodDays: trendScores.filter((score) => score.status === "Good").length,
    totalCompletedHabits: trendScores.reduce(
      (sum, score) => sum + score.completedHabits,
      0
    ),
    mostConsistentHabitName: findHabitByRate(state, trendDates, "highest"),
    habitNeedingAttentionName: findHabitByRate(state, trendDates, "lowest"),
    trend: trendDates.map((date) => {
      const score = scoreDate(state, date);

      return {
        date,
        label: formatEnglishTrendLabel(date),
        completionRate: score.completionRate,
        status: score.status
      };
    }),
    habitPerformance: state.habits.map((habit) => {
      const completionRate = average(
        trendDates.map((date) => (state.records[date]?.completions[habit.id] ? 1 : 0))
      );

      return {
        habitId: habit.id,
        habitName: habit.name,
        completionRate
      };
    })
  };
}

function findHabitByRate(
  state: DashboardState,
  dates: string[],
  mode: "highest" | "lowest"
) {
  if (!state.habits.length) return null;

  const ranked = state.habits
    .map((habit) => ({
      habit,
      rate: average(dates.map((date) => (state.records[date]?.completions[habit.id] ? 1 : 0)))
    }))
    .sort((a, b) => (mode === "highest" ? b.rate - a.rate : a.rate - b.rate));

  return ranked[0]?.habit.name ?? null;
}

function buildGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatEnglishLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishMonthLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishCalendarDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishDayNumber(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric"
  }).format(parseIsoDate(date));
}

function formatEnglishTrendLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseIsoDate(date));
}

function buildMotivation(status: DashboardStatus, completionRate: number) {
  if (status === "Good" && completionRate === 1) return "Clean sweep. Keep the day light.";
  if (status === "Good") return "You are above target. One small finish makes it cleaner.";
  if (status === "Okay") return "You are close. Pick the easiest remaining habit first.";
  return "Restart gently. One honest check-in is enough to regain momentum.";
}

function buildProtectionMessage(currentStreak: number, completionRate: number) {
  if (completionRate >= TARGET_COMPLETION_RATE) {
    return "Protected for today";
  }

  if (currentStreak > 0) {
    return "Finish one more habit to protect the streak";
  }

  return "Start a new streak with one completed habit";
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}
