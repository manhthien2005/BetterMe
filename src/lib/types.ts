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
      // Social Garden Phase 1 (§3.2). INSERT/UPDATE have no RLS policies —
      // writes go through the friending RPCs; only SELECT/DELETE are direct.
      friendships: {
        Row: {
          user_a: string;
          user_b: string;
          status: string;
          requested_by: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          user_a: string;
          user_b: string;
          status?: string;
          requested_by: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      // Social Garden Phase 2 (§4.1). Friends have SELECT via RLS; ALL writes
      // go through the refresh_my_summary RPC — no Insert/Update policies.
      // No streak/last_active-shaped column may exist here (§0.3): the row is
      // a positive-only projection. pet_stage/pet_bond_tier mirror the
      // as-built dashboard-data.ts scales (baby..adult / tiers 1..5).
      published_summaries: {
        Row: {
          user_id: string;
          display_name: string | null;
          pet_name: string | null;
          pet_species: string | null;
          pet_stage: string | null;
          pet_bond_tier: number | null;
          milestones: Json;
          week_start: string | null;
          weekly_good_days: number | null;
          prev_week_start: string | null;
          prev_week_good_days: number | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      // Social Garden Phase 2 (§4.2). Host/visitor have SELECT via RLS; ALL
      // writes go through visit_garden / ack_garden_visits RPCs.
      garden_visits: {
        Row: {
          visit_id: string;
          host_user_id: string;
          visitor_user_id: string;
          visit_date: string;
          visitor_pet_species: string | null;
          visitor_pet_name: string | null;
          gifted_food: number;
          cheered_milestone_id: string | null;
          applied_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      // Social Garden Phase 3 (§5.1). Both sides SELECT via RLS; ALL writes go
      // through bump_shared_rhythms. rhythm_days only rises or rests (no decay).
      shared_rhythms: {
        Row: {
          user_a: string;
          user_b: string;
          rhythm_days: number;
          last_counted_date: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
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
      // Social Garden Phase 1 friending RPCs (supabase/schema.sql §3). All
      // SECURITY DEFINER, jsonb-returning; parsed defensively at the call
      // boundary in src/lib/server/social-actions.ts.
      send_friend_request: {
        Args: { p_code: string };
        Returns: Json;
      };
      respond_friend_request: {
        Args: { p_other: string; p_accept: boolean };
        Returns: Json;
      };
      get_friends_overview: {
        Args: Record<string, never>;
        Returns: Json;
      };
      update_my_profile: {
        Args: { p_display_name: string; p_avatar_kind: string };
        Returns: Json;
      };
      // Social Garden Phase 2 RPCs (supabase/schema.sql §4).
      refresh_my_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      set_sharing_enabled: {
        Args: { p_enabled: boolean };
        Returns: Json;
      };
      visit_garden: {
        Args: {
          p_host_user_id: string;
          p_gift_food?: boolean;
          p_cheer_milestone_id?: string | null;
        };
        Returns: Json;
      };
      ack_garden_visits: {
        Args: { p_visit_ids: string[] };
        Returns: undefined;
      };
      get_my_garden_feed: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      // Social Garden Phase 3 RPCs (supabase/schema.sql §5).
      set_fair_opt_in: {
        Args: { p_enabled: boolean };
        Returns: Json;
      };
      bump_shared_rhythms: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_garden_fair: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_shared_rhythms: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
