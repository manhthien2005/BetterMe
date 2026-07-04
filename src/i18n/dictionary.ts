import type { Locale } from "./locale";

export interface Dictionary {
  locale: Locale;
  localeName: string;
  languageNames: Record<Locale, string>;
  nav: {
    dashboard: string;
    tracker: string;
    calendar: string;
    habits: string;
    settings: string;
  };
  common: {
    appName: string;
    loading: string;
    noData: string;
    planned: string;
    notTracked: string;
    save: string;
    delete: string;
    clearLocalData: string;
    previousWeek: string;
    nextWeek: string;
  };
  status: {
    Good: string;
    Okay: string;
    Bad: string;
    Planned: string;
    none: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    subtitle: string;
    todayProgress: string;
    weekAverage: string;
    missedHabits: string;
    currentStreak: string;
    goodDays: (count: number) => string;
    missedCount: (count: number) => string;
    nothingMissed: string;
    streakHelper: string;
    weeklyQuestPreview: string;
  };
  tracker: {
    title: string;
    loading: string;
    weeklyTrackerLabel: string;
    weeklyQuestDays: string;
    selectedDay: string;
    status: string;
    score: string;
    streak: string;
    noRecord: string;
    dailyHabits: string;
    noActiveHabits: string;
    loadingTracker: string;
    reflectionSaved: string;
    dailyReflection: string;
    dailyNote: string;
    challengeToday: string;
    tomorrowFocus: string;
    saveReflection: string;
  };
  calendar: {
    title: string;
    loading: string;
    monthCalendar: string;
    selected: string;
    today: string;
  };
  habits: {
    title: string;
    loading: string;
    addHabit: string;
    newHabitName: string;
    newHabitCategory: string;
    newHabitScore: string;
    newHabitDescription: string;
    active: string;
    habitName: (name: string) => string;
    category: (name: string) => string;
    maxScore: (name: string) => string;
    description: (name: string) => string;
    activeLabel: (name: string) => string;
    moveUp: (name: string) => string;
    moveDown: (name: string) => string;
    deleteHabit: (name: string) => string;
    saveHabit: (name: string) => string;
    validation: {
      nameRequired: string;
      keyRequired: string;
      scoreNonNegative: string;
      duplicateKey: string;
    };
  };
  settings: {
    title: string;
    loading: string;
    localOnlyNote: string;
    timezone: string;
    startDate: string;
    selectedDate: string;
    trackingDays: string;
    targetCompletionRate: string;
    theme: string;
    language: string;
    saveSettings: string;
    settingsSaved: string;
    localDataReset: string;
    validation: {
      timezoneRequired: string;
      trackerDaysPositive: string;
      targetRateRange: string;
    };
  };
  theme: {
    cuteCat: string;
    studyCorner: string;
    modernFocus: string;
    minimalCalm: string;
  };
  charts: {
    thirtyDayProgressTitle: string;
    thirtyDayProgressDescription: string;
    selectedWeekHabitsTitle: string;
    selectedWeekHabitsDescription: string;
    dailyCompletionRate: string;
    completionRate: string;
    habitCompletion: string;
    daysCompleted: (completed: number, total: number) => string;
    noData: string;
  };
}
