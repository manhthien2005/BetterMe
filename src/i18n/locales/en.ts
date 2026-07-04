import type { Dictionary } from "../dictionary";

export const en: Dictionary = {
  locale: "en",
  localeName: "English",
  languageNames: { en: "English", vi: "Tiếng Việt" },
  nav: { dashboard: "Dashboard", tracker: "Tracker", calendar: "Calendar", habits: "Habits", settings: "Settings" },
  common: {
    appName: "BetterMe",
    loading: "Loading...",
    noData: "No data",
    planned: "Planned",
    notTracked: "Not tracked",
    save: "Save",
    delete: "Delete",
    clearLocalData: "Clear local data",
    previousWeek: "Previous week",
    nextWeek: "Next week"
  },
  status: { Good: "Good", Okay: "Okay", Bad: "Bad", Planned: "Planned", none: "Not tracked" },
  dashboard: {
    eyebrow: "BetterMe",
    title: "Dashboard",
    subtitle: "Your tiny daily corner for study, movement, focus, and reflection.",
    todayProgress: "Today progress",
    weekAverage: "Week average",
    missedHabits: "Missed habits",
    currentStreak: "Current streak",
    goodDays: (count) => `${count} good ${count === 1 ? "day" : "days"}`,
    missedCount: (count) => `${count} missed`,
    nothingMissed: "Nothing missed",
    streakHelper: "Good days in a row",
    weeklyQuestPreview: "Weekly quest preview"
  },
  tracker: {
    title: "Weekly quest board",
    loading: "Loading weekly tracker...",
    weeklyTrackerLabel: "Weekly tracker",
    weeklyQuestDays: "Weekly quest days",
    selectedDay: "Selected day",
    status: "Status",
    score: "Score",
    streak: "Streak",
    noRecord: "No record for this day.",
    dailyHabits: "Daily habits",
    noActiveHabits: "No active habits yet.",
    loadingTracker: "Loading tracker...",
    reflectionSaved: "Reflection saved",
    dailyReflection: "Daily reflection",
    dailyNote: "Daily note",
    challengeToday: "Challenge today",
    tomorrowFocus: "Tomorrow focus",
    saveReflection: "Save reflection"
  },
  calendar: {
    title: "Calendar",
    loading: "Loading calendar...",
    monthCalendar: "Month calendar",
    selected: "selected",
    today: "today"
  },
  habits: {
    title: "Habit configuration",
    loading: "Loading habits...",
    addHabit: "Add habit",
    newHabitName: "New habit name",
    newHabitCategory: "New habit category",
    newHabitScore: "New habit score",
    newHabitDescription: "New habit description",
    active: "Active",
    habitName: (name) => `Habit name: ${name}`,
    category: (name) => `Category: ${name}`,
    maxScore: (name) => `Max score: ${name}`,
    description: (name) => `Description: ${name}`,
    activeLabel: (name) => `Active: ${name}`,
    moveUp: (name) => `Move ${name} up`,
    moveDown: (name) => `Move ${name} down`,
    deleteHabit: (name) => `Delete ${name}`,
    saveHabit: (name) => `Save ${name}`,
    validation: {
      nameRequired: "Habit name is required",
      keyRequired: "Habit key is required",
      scoreNonNegative: "Max score must be non-negative",
      duplicateKey: "Habit key already exists"
    }
  },
  settings: {
    title: "Settings",
    loading: "Loading settings...",
    localOnlyNote: "BetterMe is local-only in Phase 1. Your data is stored on this device until a future backend is added.",
    timezone: "Timezone",
    startDate: "Start date",
    selectedDate: "Selected date",
    trackingDays: "Tracking days",
    targetCompletionRate: "Target completion rate",
    theme: "Theme",
    language: "Language",
    saveSettings: "Save settings",
    settingsSaved: "Settings saved",
    localDataReset: "Local data reset",
    validation: {
      timezoneRequired: "Timezone is required",
      trackerDaysPositive: "Tracking days must be at least 1",
      targetRateRange: "Target completion rate must be between 0 and 100"
    }
  },
  theme: {
    cuteCat: "Cute Cat",
    studyCorner: "Study Corner",
    modernFocus: "Modern Focus",
    minimalCalm: "Minimal Calm"
  },
  charts: {
    thirtyDayProgressTitle: "30-day progress",
    thirtyDayProgressDescription: "Daily completion rate for the 30 days ending at the selected date.",
    selectedWeekHabitsTitle: "Selected-week habits",
    selectedWeekHabitsDescription: "Completion rate for each active habit in the selected week.",
    dailyCompletionRate: "Daily completion rate",
    completionRate: "Completion rate",
    habitCompletion: "Habit completion",
    daysCompleted: (completed, total) => `${completed} of ${total} days`,
    noData: "No data"
  }
};
