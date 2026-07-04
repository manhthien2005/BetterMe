"use client";

import { createContext, createElement, useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";

import type { Habit, HabitConfig, ISODateString, StorageAdapter, TrackerSettings } from "@/types";
import { DEFAULT_HABIT_CONFIGS } from "../data/default-habits";
import { getZonedToday } from "../lib/date/index";
import { LocalStorageAdapter } from "../lib/storage/local-storage-adapter";
import { trackerReducer, type TrackerAction, type TrackerState } from "./tracker-reducer";
import { selectDailyRecords, selectSelectedWeek } from "./tracker-selectors";

export type { TrackerAction, TrackerState } from "./tracker-reducer";

export interface TrackerStoreApi {
  state: TrackerState;
  records: ReturnType<typeof selectDailyRecords>;
  selectedWeek: ReturnType<typeof selectSelectedWeek>;
  toggleHabit(date: ISODateString, habitId: string): void;
  saveReflection(date: ISODateString, values: { dailyNote: string; problemToday: string; tomorrowFocus: string }): void;
  setSelectedDate(date: ISODateString): void;
  updateSettings(patch: Partial<TrackerSettings>): void;
  saveHabit(config: HabitConfig, id?: string): void;
  removeHabit(habitId: string): void;
  reset(): Promise<void>;
  retrySave(): Promise<void>;
}

export const TrackerStoreContext = createContext<TrackerStoreApi | null>(null);

export function TrackerStoreProvider({ children, adapter, now }: { children: ReactNode; adapter?: StorageAdapter; now?: Date }) {
  const [stableNow] = useState(() => now ?? new Date());
  const storage = useMemo(() => adapter ?? new LocalStorageAdapter(), [adapter]);
  const [state, dispatch] = useReducer(trackerReducer, { data: null, hydrated: false, saving: false, persistenceError: null, now: stableNow });

  useEffect(() => {
    let active = true;
    void storage.load().then(async (loaded) => {
      const data = loaded ?? createDefaultData(stableNow);
      if (!loaded) await storage.save(data);
      if (active) dispatch({ type: "hydrate", data });
    }).catch((error: unknown) => {
      if (active) dispatch({ type: "save-failed", message: error instanceof Error ? error.message : "Unable to load local data" });
    });
    return () => { active = false; };
  }, [storage, stableNow]);

  const persist = useCallback((action: TrackerAction) => {
    const next = trackerReducer(state, action);
    dispatch(action);
    if (!next.data) return;
    dispatch({ type: "saving" });
    void storage.save(next.data)
      .then(() => dispatch({ type: "saved" }))
      .catch((error: unknown) => dispatch({ type: "save-failed", message: error instanceof Error ? error.message : "Unable to save local data" }));
  }, [state, storage]);

  const api = useMemo<TrackerStoreApi>(() => ({
    state,
    records: selectDailyRecords(state),
    selectedWeek: selectSelectedWeek(state),
    toggleHabit: (date, habitId) => persist({ type: "toggle-habit", date, habitId }),
    saveReflection: (date, values) => persist({ type: "save-reflection", date, ...values }),
    setSelectedDate: (date) => persist({ type: "update-settings", patch: { selectedDate: date } }),
    updateSettings: (patch) => persist({ type: "update-settings", patch }),
    saveHabit: (config, id) => {
      const timestamp = new Date().toISOString();
      const existing = state.data?.habits.find((habit) => habit.id === id);
      const habit: Habit = { ...config, id: existing?.id ?? id ?? `habit-${crypto.randomUUID()}`, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp };
      persist({ type: "save-habit", habit });
    },
    removeHabit: (habitId) => persist({ type: "remove-habit", habitId }),
    reset: async () => {
      await storage.clear();
      const data = createDefaultData(stableNow);
      await storage.save(data);
      dispatch({ type: "hydrate", data });
    },
    retrySave: async () => {
      if (!state.data) return;
      dispatch({ type: "saving" });
      try { await storage.save(state.data); dispatch({ type: "saved" }); }
      catch (error) { dispatch({ type: "save-failed", message: error instanceof Error ? error.message : "Unable to save local data" }); }
    }
  }), [stableNow, persist, state, storage]);

  return createElement(TrackerStoreContext.Provider, { value: api }, children);
}

export function createDefaultData(now: Date = new Date()) {
  const timestamp = now.toISOString();
  const timezone = "Asia/Ho_Chi_Minh";
  const today = getZonedToday(now, timezone);
  return {
    schemaVersion: 1 as const,
    habits: DEFAULT_HABIT_CONFIGS.map((config) => ({ ...config, id: `habit-${config.key}`, createdAt: timestamp, updatedAt: timestamp })),
    habitEntries: [],
    reflections: [],
    settings: { timezone, startDate: today, selectedDate: today, trackerDays: 90, targetCompletionRate: 0.8, themeId: "cute-cat" as const },
    updatedAt: timestamp
  };
}
