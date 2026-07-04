import type { ReflectionEntry } from "@/types";

export function normalizeReflection(entry: ReflectionEntry): ReflectionEntry {
  return {
    ...entry,
    dailyNote: entry.dailyNote.trim(),
    problemToday: entry.problemToday.trim(),
    tomorrowFocus: entry.tomorrowFocus.trim()
  };
}
