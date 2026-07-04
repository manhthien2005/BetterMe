export type TrackerStatus = "Good" | "Okay" | "Bad" | "Planned" | "";

export type Habit = {
  id: string;
  userId: string;
  key: string;
  name: string;
  category: string;
  maxScore: number;
  active: boolean;
  description: string;
  sortOrder: number;
};

export type ProfileSettings = {
  userId: string;
  timezone: string;
  startDate: string;
  trackerDays: number;
  targetCompletionRate: number;
  selectedDate: string;
};

export type DailyEntry = {
  userId: string;
  date: string;
  dailyNote: string;
  problemToday: string;
  tomorrowFocus: string;
};

export type HabitLog = {
  userId: string;
  habitId: string;
  date: string;
  done: boolean;
};

export type TrackerRecord = {
  date: string;
  weekStart: string;
  dayLabel: string;
  habits: Record<string, boolean>;
  habitLogIds: Record<string, string>;
  dailyNote: string;
  problemToday: string;
  tomorrowFocus: string;
  totalScore: number;
  maxScore: number;
  completionRate: number | null;
  status: TrackerStatus;
  streak: number | null;
  missedKeys: string[];
  missedNames: string[];
};

export type ChartPoint = {
  date: string;
  label: string;
  completion: number | null;
};

export type HabitRatePoint = {
  habitId: string;
  habitName: string;
  icon: string;
  rate: number;
};

export type TrackerSnapshot = {
  profile: ProfileSettings;
  habits: Habit[];
  activeHabits: Habit[];
  records: TrackerRecord[];
  today: string;
  selectedDate: string;
  selectedWeekStart: string;
  selectedWeekEnd: string;
  selectedWeekRecords: TrackerRecord[];
  todayRecord: TrackerRecord | null;
  metrics: {
    todayProgress: string;
    todayCompletionRate: number;
    selectedWeekRate: number;
    missedCount: number;
    currentStreak: number;
    selectedDayScore: string;
    selectedDayStatus: TrackerStatus;
  };
  dailyChart: ChartPoint[];
  habitChart: HabitRatePoint[];
  calendar: Array<{
    date: string;
    day: number;
    inCurrentMonth: boolean;
    status: TrackerStatus;
    completionRate: number | null;
  }>;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          timezone: string;
          start_date: string;
          tracker_days: number;
          target_completion_rate: number;
          selected_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          timezone?: string;
          start_date?: string;
          tracker_days?: number;
          target_completion_rate?: number;
          selected_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          name: string;
          category: string;
          max_score: number;
          active: boolean;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          name: string;
          category?: string;
          max_score?: number;
          active?: boolean;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>;
      };
      daily_entries: {
        Row: {
          user_id: string;
          date: string;
          daily_note: string;
          problem_today: string;
          tomorrow_focus: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          daily_note?: string;
          problem_today?: string;
          tomorrow_focus?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_entries"]["Insert"]>;
      };
      habit_logs: {
        Row: {
          user_id: string;
          habit_id: string;
          date: string;
          done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          habit_id: string;
          date: string;
          done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["habit_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
