import type { Database, DailyEntry, Habit, HabitLog, ProfileSettings } from "@/lib/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type HabitRow = Database["public"]["Tables"]["habits"]["Row"];
type DailyEntryRow = Database["public"]["Tables"]["daily_entries"]["Row"];
type HabitLogRow = Database["public"]["Tables"]["habit_logs"]["Row"];

export function mapProfile(row: ProfileRow): ProfileSettings {
  return {
    userId: row.user_id,
    timezone: row.timezone,
    startDate: row.start_date,
    trackerDays: row.tracker_days,
    targetCompletionRate: Number(row.target_completion_rate),
    selectedDate: row.selected_date
  };
}

export function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    key: row.key,
    name: row.name,
    category: row.category,
    maxScore: Number(row.max_score),
    active: row.active,
    description: row.description,
    sortOrder: row.sort_order
  };
}

export function mapDailyEntry(row: DailyEntryRow): DailyEntry {
  return {
    userId: row.user_id,
    date: row.date,
    dailyNote: row.daily_note,
    problemToday: row.problem_today,
    tomorrowFocus: row.tomorrow_focus
  };
}

export function mapHabitLog(row: HabitLogRow): HabitLog {
  return {
    userId: row.user_id,
    habitId: row.habit_id,
    date: row.date,
    done: row.done
  };
}
