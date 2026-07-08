export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    // Sync RPCs (supabase/schema.sql, Social Garden Phase 0 §2). jsonb-returning
    // functions are typed Json and parsed defensively at the call boundary.
    Functions: {
      apply_habit_log: {
        Args: {
          p_habit_key: string;
          p_date: string;
          p_done: boolean;
          p_mutated_at: string | null;
        };
        Returns: undefined;
      };
      upsert_habit: {
        Args: {
          p_key: string;
          p_name: string;
          p_category: string;
          p_max_score: number;
          p_active: boolean;
          p_description: string;
          p_sort_order: number;
          p_client_ts: string | null;
          p_expect_create?: boolean;
        };
        Returns: Json;
      };
      delete_habit: {
        Args: { p_key: string; p_deleted_at: string | null };
        Returns: Json;
      };
      reset_companion: {
        Args: { p_species: string };
        Returns: undefined;
      };
      merge_companion_state: {
        Args: { p: Json };
        Returns: Json;
      };
      get_sync_snapshot: {
        Args: Record<string, never>;
        Returns: Json;
      };
      companion_state_jsonb: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
