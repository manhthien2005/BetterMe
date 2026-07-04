import type { HabitConfig } from "@/types";

export const DEFAULT_HABIT_CONFIGS: readonly HabitConfig[] = [
  { key: "wake-on-time", name: "Wake up on time", category: "discipline", maxScore: 1, active: true, description: "Start the day when you planned to.", sortOrder: 0 },
  { key: "study-english", name: "Study English", category: "learning", maxScore: 1, active: true, description: "Practice English with focused attention.", sortOrder: 1 },
  { key: "code-project", name: "Code or project work", category: "learning", maxScore: 1, active: true, description: "Move a meaningful project forward.", sortOrder: 2 },
  { key: "exercise", name: "Exercise or sports", category: "health", maxScore: 1, active: true, description: "Move your body intentionally.", sortOrder: 3 },
  { key: "avoid-time-waste", name: "Avoid wasting time", category: "focus", maxScore: 1, active: true, description: "Protect attention from low-value distractions.", sortOrder: 4 },
  { key: "clean-up", name: "Clean up", category: "discipline", maxScore: 1, active: true, description: "Restore order to your space and routines.", sortOrder: 5 },
  { key: "daily-review", name: "End-of-day review", category: "reflection", maxScore: 1, active: true, description: "Pause, notice, and prepare for tomorrow.", sortOrder: 6 }
] as const;
