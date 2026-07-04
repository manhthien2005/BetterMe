import type { Habit } from "@/lib/types";

export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_TRACKER_DAYS = 90;
export const DEFAULT_TARGET_COMPLETION_RATE = 0.8;

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const DEFAULT_HABITS = [
  {
    key: "wake_up",
    name: "Wake up on time",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Wake up at the time you planned."
  },
  {
    key: "english",
    name: "Study English",
    category: "Learning",
    maxScore: 1,
    active: true,
    description: "Spend focused time practicing English."
  },
  {
    key: "coding",
    name: "Code / project work",
    category: "Work",
    maxScore: 2,
    active: true,
    description: "Build, code, practice, or move a project forward."
  },
  {
    key: "exercise",
    name: "Exercise / sports",
    category: "Health",
    maxScore: 1,
    active: true,
    description: "Move your body, train, walk, stretch, or play sports."
  },
  {
    key: "focus",
    name: "Avoid wasting time",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Stay focused and reduce distractions."
  },
  {
    key: "clean",
    name: "Clean up / personal discipline",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Keep your space and personal discipline clean."
  },
  {
    key: "review",
    name: "End-of-day review",
    category: "Reflection",
    maxScore: 1,
    active: true,
    description: "Reflect on the day and plan tomorrow."
  }
] as const;

export const PALETTES = [
  {
    name: "Forest",
    primary: "#14532D",
    secondary: "#DCFCE7",
    accent: "#22C55E",
    soft: "#F0FDF4",
    text: "#14532D"
  },
  {
    name: "Ocean",
    primary: "#0C4A6E",
    secondary: "#E0F2FE",
    accent: "#0284C7",
    soft: "#F0F9FF",
    text: "#075985"
  },
  {
    name: "Lavender",
    primary: "#4C1D95",
    secondary: "#F3E8FF",
    accent: "#8B5CF6",
    soft: "#FAF5FF",
    text: "#581C87"
  },
  {
    name: "Sunset",
    primary: "#7C2D12",
    secondary: "#FFEDD5",
    accent: "#F97316",
    soft: "#FFF7ED",
    text: "#9A3412"
  }
] as const;

export function habitIcon(key: string, category?: string) {
  const byKey: Record<string, string> = {
    wake_up: "AlarmClock",
    english: "Languages",
    coding: "Code2",
    exercise: "Dumbbell",
    focus: "Target",
    clean: "Sparkles",
    review: "NotebookPen"
  };

  const byCategory: Record<string, string> = {
    Discipline: "ShieldCheck",
    Learning: "BookOpen",
    Work: "Laptop",
    Health: "HeartPulse",
    Reflection: "Moon"
  };

  return byKey[key] || byCategory[category || ""] || "Star";
}

export function makeSeedHabit(
  userId: string,
  item: (typeof DEFAULT_HABITS)[number],
  index: number
): Omit<Habit, "id"> {
  return {
    userId,
    key: item.key,
    name: item.name,
    category: item.category,
    maxScore: item.maxScore,
    active: item.active,
    description: item.description,
    sortOrder: index
  };
}
