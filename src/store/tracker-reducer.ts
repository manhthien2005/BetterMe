import type { BetterMeData, Habit, ISODateString, TrackerSettings } from "@/types";

export interface TrackerState {
  data: BetterMeData | null;
  hydrated: boolean;
  saving: boolean;
  persistenceError: string | null;
  now: Date;
}

export type TrackerAction =
  | { type: "hydrate"; data: BetterMeData }
  | { type: "toggle-habit"; date: ISODateString; habitId: string }
  | { type: "save-reflection"; date: ISODateString; dailyNote: string; problemToday: string; tomorrowFocus: string }
  | { type: "update-settings"; patch: Partial<TrackerSettings> }
  | { type: "save-habit"; habit: Habit }
  | { type: "remove-habit"; habitId: string }
  | { type: "saving" }
  | { type: "saved" }
  | { type: "save-failed"; message: string };

export function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  if (action.type === "hydrate") return { ...state, data: structuredClone(action.data), hydrated: true, persistenceError: null };
  if (action.type === "saving") return { ...state, saving: true, persistenceError: null };
  if (action.type === "saved") return { ...state, saving: false, persistenceError: null };
  if (action.type === "save-failed") return { ...state, saving: false, persistenceError: action.message };
  if (!state.data) return state;

  const timestamp = state.now.toISOString();
  const data = structuredClone(state.data);
  data.updatedAt = timestamp;

  if (action.type === "toggle-habit") {
    let entry = data.habitEntries.find((candidate) => candidate.date === action.date);
    if (!entry) {
      entry = { date: action.date, habitCompletions: {}, updatedAt: timestamp };
      data.habitEntries.push(entry);
    }
    entry.habitCompletions[action.habitId] = entry.habitCompletions[action.habitId] !== true;
    entry.updatedAt = timestamp;
  } else if (action.type === "save-reflection") {
    const entry = { date: action.date, dailyNote: action.dailyNote, problemToday: action.problemToday, tomorrowFocus: action.tomorrowFocus, updatedAt: timestamp };
    const index = data.reflections.findIndex((candidate) => candidate.date === action.date);
    if (index === -1) data.reflections.push(entry); else data.reflections[index] = entry;
  } else if (action.type === "update-settings") {
    data.settings = { ...data.settings, ...action.patch };
  } else if (action.type === "save-habit") {
    const index = data.habits.findIndex((candidate) => candidate.id === action.habit.id);
    if (index === -1) data.habits.push(structuredClone(action.habit)); else data.habits[index] = structuredClone(action.habit);
  } else if (action.type === "remove-habit") {
    data.habits = data.habits.filter((habit) => habit.id !== action.habitId);
  }
  return { ...state, data };
}
