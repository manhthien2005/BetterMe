"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle2,
  CirclePlus,
  ExternalLink,
  Flame,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  buildDashboardViewModel,
  createInitialDashboardState,
  getDashboardToday,
  toggleHabitForDate,
  type DashboardCalendarDay,
  type DashboardHabitView,
  type DashboardState,
  type DashboardStatus,
  type DashboardViewModel
} from "@/components/dashboard/dashboard-data";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "betterme.dashboard.v1";
const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ";
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0";

const DASHBOARD_WEATHER = {
  location: "Bangkok",
  temperature: "31 C",
  condition: "Clear evening",
  feelsLike: "34 C",
  humidity: "68%",
  wind: "9 km/h",
  rainChance: "12%",
  uvIndex: "Low after 5 PM",
  planningNote: "Good window for a light walk after focus work.",
  emoji: "☀️",
  emojiLabel: "Clear weather"
} as const;

export function DashboardClient({ userEmail }: { userEmail: string }) {
  const today = useMemo(() => getDashboardToday(), []);
  const [state, setState] = useState<DashboardState>(() =>
    createInitialDashboardState(today)
  );
  const [hydrated, setHydrated] = useState(false);
  const viewModel = useMemo(() => buildDashboardViewModel(state, today), [state, today]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setState(JSON.parse(saved) as DashboardState);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  function toggleHabit(habitId: string) {
    setState((current) => toggleHabitForDate(current, today, habitId));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link className="flex items-center gap-2 text-sm font-bold text-slate-950" href="/dashboard">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
            BM
          </span>
          BetterMe
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1 rounded-lg border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur">
            {[
              ["Dashboard", "/dashboard"],
              ["Tracker", "/tracker"],
              ["Calendar", "/calendar"],
              ["Habits", "/habits"],
              ["Settings", "/settings"]
            ].map(([label, href]) => (
              <Link
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950",
                  href === "/dashboard" && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
                )}
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur">
            <span className="hidden max-w-[180px] truncate px-2 text-xs font-bold text-slate-500 sm:inline">
              {userEmail}
            </span>
            <button
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[repeat(24,minmax(0,1fr))]">
        <GreetingHero viewModel={viewModel} />
        <CalendarPanel days={viewModel.calendar.days} viewModel={viewModel} />
        <TodaysHabits habits={viewModel.habits} onToggle={toggleHabit} viewModel={viewModel} />
        <WeatherHeroBanner />
        <SpotifyHeroBanner />
        <UpcomingEvents viewModel={viewModel} />
        <AnalyticsPanel viewModel={viewModel} />
      </div>
    </main>
  );
}

function GreetingHero({ viewModel }: { viewModel: DashboardViewModel }) {
  return (
    <section className="soft-panel order-1 overflow-hidden rounded-lg p-5 sm:p-6 xl:col-span-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            {viewModel.date.longLabel}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            {viewModel.greeting}, Thiên
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {viewModel.motivation}
          </p>
        </div>

        <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[460px]">
          <MetricPill
            icon={Flame}
            label="Current"
            value={`${viewModel.streak.current}-day`}
            tone="good"
          />
          <MetricPill icon={Trophy} label="Best" value={`${viewModel.streak.best}`} tone="sun" />
          <MetricPill
            icon={CheckCircle2}
            label="Today"
            value={formatPercent(viewModel.today.completionRate)}
            tone="sky"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-teal-100 bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2" aria-label="Seven day streak chain">
          {viewModel.streak.chain.map((day) => (
            <span
              aria-label={`${day.label}: ${day.status}`}
              className={cn(
                "h-3.5 w-3.5 rounded-full border transition",
                day.completed
                  ? "border-teal-600 bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]"
                  : "border-slate-300 bg-white"
              )}
              key={day.date}
              title={`${day.label}: ${day.status}`}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-700">{viewModel.streak.protectionMessage}</p>
      </div>
    </section>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "good" | "sun" | "sky";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white/80 p-4 shadow-sm",
        tone === "good" && "border-teal-100",
        tone === "sun" && "border-amber-100",
        tone === "sky" && "border-sky-100"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">{value}</p>
    </div>
  );
}

function CalendarPanel({
  days,
  viewModel
}: {
  days: DashboardCalendarDay[];
  viewModel: DashboardViewModel;
}) {
  return (
    <section className="soft-panel order-3 rounded-lg p-4 sm:p-5 xl:order-2 xl:[grid-column:span_7/span_7]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-normal text-slate-950">Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">{viewModel.date.monthLabel}</p>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-normal text-teal-700">Month</p>
          <p className="text-lg font-bold text-teal-800">
            {formatPercent(viewModel.calendar.monthCompletionRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            aria-label={`${day.label}, ${day.completedHabits} of ${day.totalHabits} habits, ${day.status}`}
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:h-9 sm:w-9",
              day.inCurrentMonth ? "text-slate-800" : "border-slate-100 text-slate-300",
              day.fillRatio >= 1 &&
                day.inCurrentMonth &&
                "border-transparent text-white shadow-[0_2px_8px_rgba(251,170,86,0.24)]",
              day.isToday && "ring-1 ring-slate-950 ring-offset-2"
            )}
            key={day.date}
            style={calendarCellStyle(day)}
            type="button"
          >
            {day.day}
          </button>
        ))}
      </div>
    </section>
  );
}

function TodaysHabits({
  habits,
  onToggle,
  viewModel
}: {
  habits: DashboardHabitView[];
  onToggle: (habitId: string) => void;
  viewModel: DashboardViewModel;
}) {
  return (
    <section className="soft-panel order-2 rounded-lg p-4 sm:p-5 xl:order-3 xl:[grid-column:span_11/span_11]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-normal text-slate-950">
            Today&apos;s Habits
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {viewModel.today.completedHabits} of {viewModel.today.totalHabits} completed
          </p>
        </div>
        <StatusBadge status={viewModel.today.status} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>Today progress</span>
          <span>{formatPercent(viewModel.today.completionRate)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-rose-400 transition-all"
            style={{ width: `${viewModel.today.completionRate * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {habits.map((habit) => (
          <HabitRow habit={habit} key={habit.id} onToggle={onToggle} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/habits">
            <CirclePlus className="h-4 w-4" />
            Add habit
          </Link>
        </Button>
        <Button asChild>
          <Link href="/tracker">
            <ExternalLink className="h-4 w-4" />
            Open tracker
          </Link>
        </Button>
      </div>
    </section>
  );
}

function HabitRow({
  habit,
  onToggle
}: {
  habit: DashboardHabitView;
  onToggle: (habitId: string) => void;
}) {
  const emoji = habitEmoji(habit.key, habit.category);

  return (
    <button
      aria-pressed={habit.completed}
      className={cn(
        "grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border bg-white/78 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        habit.completed ? "border-teal-200" : "border-slate-200"
      )}
      onClick={() => onToggle(habit.id)}
      type="button"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition",
          habitIconBubbleClass(habit.key, habit.category),
          habit.completed && "shadow-[0_8px_18px_rgba(15,23,42,0.11)]"
        )}
      >
        <span
          aria-label={`${habit.name} emoji icon`}
          className="text-2xl leading-none drop-shadow-sm"
          role="img"
        >
          {emoji}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">{habit.name}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {habit.category}
        </span>
      </span>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border",
          habit.completed
            ? "border-teal-500 bg-teal-500 text-white"
            : "border-slate-300 bg-white text-transparent"
        )}
      >
        <Check className="h-4 w-4" />
      </span>
    </button>
  );
}

function habitEmoji(key: string, category?: string) {
  const byKey: Record<string, string> = {
    wake_up: "⏰",
    english: "🗣️",
    coding: "💻",
    exercise: "💪",
    focus: "🎯",
    clean: "✨",
    review: "📝"
  };

  const byCategory: Record<string, string> = {
    Discipline: "🛡️",
    Learning: "📚",
    Work: "🚀",
    Health: "💚",
    Reflection: "🌙"
  };

  return byKey[key] || byCategory[category || ""] || "⭐";
}

function habitIconBubbleClass(key: string, category?: string) {
  const bubbleByKey: Record<string, string> = {
    wake_up: "border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    english: "border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-indigo-50",
    coding: "border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-slate-50",
    exercise: "border-emerald-100 bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50",
    focus: "border-rose-100 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50",
    clean: "border-amber-100 bg-gradient-to-br from-yellow-50 via-amber-50 to-white",
    review: "border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50"
  };

  const bubbleByCategory: Record<string, string> = {
    Discipline: "border-teal-100 bg-gradient-to-br from-teal-50 via-emerald-50 to-white",
    Learning: "border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-white",
    Work: "border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white",
    Health: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-lime-50 to-white",
    Reflection: "border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white"
  };

  return bubbleByKey[key] || bubbleByCategory[category || ""] || "border-slate-100 bg-gradient-to-br from-white via-slate-50 to-slate-100";
}

function WeatherHeroBanner() {
  const metricItems = [
    ["Humidity", DASHBOARD_WEATHER.humidity],
    ["Wind", DASHBOARD_WEATHER.wind],
    ["Rain", DASHBOARD_WEATHER.rainChance],
    ["UV", DASHBOARD_WEATHER.uvIndex]
  ];

  return (
    <section className="weather-hero relative order-5 overflow-hidden rounded-lg p-4 text-white shadow-note sm:p-5 xl:order-4 xl:[grid-column:span_10/span_10]">
      <div aria-hidden="true" className="weather-hero__motion" />
      <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-white/75">Weather</p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-white">
              {DASHBOARD_WEATHER.location} weather
            </h2>
            <p className="mt-1 text-sm font-semibold text-white/75">
              {DASHBOARD_WEATHER.condition}
            </p>
          </div>
          <span
            aria-label={DASHBOARD_WEATHER.emojiLabel}
            className="weather-hero__emoji"
            role="img"
          >
            {DASHBOARD_WEATHER.emoji}
          </span>
        </div>

        <div>
          <p className="text-5xl font-bold tracking-normal text-white sm:text-6xl">
            {DASHBOARD_WEATHER.temperature}
          </p>
          <p className="mt-2 text-sm font-bold text-white/80">
            Feels like {DASHBOARD_WEATHER.feelsLike}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/80">
            {DASHBOARD_WEATHER.planningNote}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metricItems.map(([label, value]) => (
            <div className="rounded-lg border border-white/20 bg-white/15 p-3 backdrop-blur" key={label}>
              <p className="text-xs font-bold uppercase tracking-normal text-white/60">{label}</p>
              <p className="mt-1 text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotifyHeroBanner() {
  return (
    <section className="order-6 overflow-hidden rounded-lg bg-[#121212] p-4 text-white shadow-note sm:p-5 xl:order-5 xl:[grid-column:span_14/span_14]">
      <div className="grid min-h-[280px] gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center">
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#1db954]">Spotify</p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-white">Focus session</h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/70">
              Deep Focus by Spotify, ready for coding blocks and quiet review.
            </p>
          </div>

          <a
            className="inline-flex w-fit items-center rounded-md bg-[#1db954] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
            href={SPOTIFY_PLAYLIST_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open in Spotify
          </a>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block h-[352px] w-full border-0"
            loading="lazy"
            src={SPOTIFY_EMBED_URL}
            title="Spotify Deep Focus playlist"
          />
        </div>
      </div>
    </section>
  );
}

function UpcomingEvents({ viewModel }: { viewModel: DashboardViewModel }) {
  return (
    <section className="soft-panel order-4 rounded-lg p-4 sm:p-5 xl:order-5 xl:[grid-column:span_7/span_7]">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-teal-700" />
        <h2 className="text-lg font-bold tracking-normal text-slate-950">Upcoming Events</h2>
      </div>

      <div className="grid gap-3">
        {viewModel.events.map((event) => (
          <div className="rounded-lg border border-slate-200 bg-white/78 p-3 shadow-sm" key={event.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{event.time}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold capitalize text-slate-600">
                {event.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({ viewModel }: { viewModel: DashboardViewModel }) {
  return (
    <section className="soft-panel order-6 rounded-lg p-4 sm:p-5 xl:[grid-column:span_17/span_17]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-700" />
            <h2 className="text-lg font-bold tracking-normal text-slate-950">Analytics</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Habit performance and recent trend
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[560px]">
          <SmallMetric label="Average" value={formatPercent(viewModel.analytics.averageCompletionRate)} />
          <SmallMetric label="Trend" value={formatSignedPercent(viewModel.analytics.changeFromPreviousPeriod)} />
          <SmallMetric label="Good days" value={`${viewModel.analytics.goodDays}`} />
          <SmallMetric label="Completed" value={`${viewModel.analytics.totalCompletedHabits}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white/76 p-4 shadow-sm">
          <div className="flex h-48 items-end gap-2">
            {viewModel.analytics.trend.map((point) => (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.date}>
                <div className="flex h-36 w-full items-end rounded-md bg-slate-100">
                  <div
                    aria-label={`${point.label}: ${formatPercent(point.completionRate)}`}
                    className={cn(
                      "w-full rounded-md transition-all",
                      point.status === "Good" && "bg-teal-500",
                      point.status === "Okay" && "bg-amber-400",
                      point.status === "Bad" && "bg-rose-400",
                      point.status === "No data" && "bg-slate-300"
                    )}
                    style={{ height: `${Math.max(point.completionRate * 100, 6)}%` }}
                    title={`${point.label}: ${formatPercent(point.completionRate)}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white/76 p-4 shadow-sm">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Insight label="Most steady" value={viewModel.analytics.mostConsistentHabitName} />
            <Insight label="Needs care" value={viewModel.analytics.habitNeedingAttentionName} />
          </div>
          <div className="grid gap-3">
            {viewModel.analytics.habitPerformance.slice(0, 5).map((habit) => (
              <div key={habit.habitId}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                  <span className="truncate">{habit.habitName}</span>
                  <span>{formatPercent(habit.completionRate)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
                    style={{ width: `${habit.completionRate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/76 p-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-normal text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-normal text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value ?? "No habit yet"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold",
        status === "Good" && "bg-teal-50 text-teal-800",
        status === "Okay" && "bg-amber-50 text-amber-800",
        status === "Bad" && "bg-rose-50 text-rose-800",
        status === "No data" && "bg-slate-100 text-slate-600"
      )}
    >
      {status}
    </span>
  );
}

function calendarCellStyle(day: DashboardCalendarDay) {
  const fillPercent = Math.round(day.fillRatio * 100);
  const fillColor = getCalendarFill(day.status);
  const trackColor = day.inCurrentMonth ? "rgba(226,232,240,0.72)" : "rgba(226,232,240,0.36)";

  if (day.fillRatio >= 1) {
    return {
      background: fillColor
    };
  }

  return {
    background: `radial-gradient(circle at center, rgba(255,255,255,0.98) 82%, transparent 83%), conic-gradient(${fillColor} ${fillPercent}%, ${trackColor} 0)`
  };
}

function getCalendarFill(status: DashboardStatus) {
  if (status === "Good") return "rgb(251, 170, 86)";
  if (status === "Okay") return "rgb(251, 191, 36)";
  if (status === "Bad") return "rgb(251, 113, 133)";
  return "rgba(148,163,184,0.34)";
}

function formatSignedPercent(value: number) {
  const rounded = Math.round(value * 100);
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}
