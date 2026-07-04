"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  DEFAULT_HABITS,
  DEFAULT_TARGET_COMPLETION_RATE,
  DEFAULT_TIMEZONE,
  DEFAULT_TRACKER_DAYS
} from "@/lib/defaults";
import { addDaysIso, todayIso } from "@/lib/date";
import { mapDailyEntry, mapHabit, mapHabitLog, mapProfile } from "@/lib/server/mappers";
import { createClient } from "@/lib/supabase/server";
import { buildTrackerSnapshot } from "@/lib/tracker";
import type { Habit, TrackerSnapshot } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function ensureUserBootstrap() {
  const { supabase, user } = await requireUser();
  const today = todayIso();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: user.id,
      timezone: DEFAULT_TIMEZONE,
      start_date: today,
      selected_date: today,
      tracker_days: DEFAULT_TRACKER_DAYS,
      target_completion_rate: DEFAULT_TARGET_COMPLETION_RATE
    });

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  const { count, error: countError } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    throw new Error(countError.message);
  }

  if (!count) {
    const { error: habitsError } = await supabase.from("habits").insert(
      DEFAULT_HABITS.map((habit, index) => ({
        user_id: user.id,
        key: habit.key,
        name: habit.name,
        category: habit.category,
        max_score: habit.maxScore,
        active: habit.active,
        description: habit.description,
        sort_order: index
      }))
    );

    if (habitsError) {
      throw new Error(habitsError.message);
    }
  }
}

export async function getTrackerSnapshot(selectedDate?: string): Promise<TrackerSnapshot> {
  const { supabase, user } = await requireUser();

  await ensureUserBootstrap();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profile = mapProfile(profileRow);
  const effectiveSelectedDate = selectedDate || profile.selectedDate || todayIso();
  const since = addDaysIso(effectiveSelectedDate, -130);
  const until = addDaysIso(effectiveSelectedDate, 130);
  const [habitsResult, entriesResult, logsResult] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", user.id).order("sort_order"),
    supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", since)
      .lte("date", until),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", since)
      .lte("date", until)
  ]);

  if (habitsResult.error) throw new Error(habitsResult.error.message);
  if (entriesResult.error) throw new Error(entriesResult.error.message);
  if (logsResult.error) throw new Error(logsResult.error.message);

  return buildTrackerSnapshot({
    profile,
    habits: habitsResult.data.map(mapHabit),
    dailyEntries: entriesResult.data.map(mapDailyEntry),
    habitLogs: logsResult.data.map(mapHabitLog),
    selectedDate: effectiveSelectedDate
  });
}

export async function setSelectedDate(date: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ selected_date: date })
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function toggleHabit(input: { date: string; habitId: string; done: boolean }) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("habit_logs").upsert(
    {
      user_id: user.id,
      habit_id: input.habitId,
      date: input.date,
      done: input.done
    },
    { onConflict: "user_id,habit_id,date" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function saveDayEntry(input: {
  date: string;
  dailyNote: string;
  problemToday: string;
  tomorrowFocus: string;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("daily_entries").upsert(
    {
      user_id: user.id,
      date: input.date,
      daily_note: input.dailyNote,
      problem_today: input.problemToday,
      tomorrow_focus: input.tomorrowFocus
    },
    { onConflict: "user_id,date" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function saveHabitConfig(habits: Array<Pick<Habit, "id" | "name" | "category" | "maxScore" | "active" | "description" | "sortOrder">>) {
  const { supabase, user } = await requireUser();

  const updates = habits.map((habit) =>
    supabase
      .from("habits")
      .update({
        name: habit.name,
        category: habit.category,
        max_score: habit.maxScore,
        active: habit.active,
        description: habit.description,
        sort_order: habit.sortOrder
      })
      .eq("user_id", user.id)
      .eq("id", habit.id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
