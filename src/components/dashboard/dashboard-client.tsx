"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Check,
  CirclePlus,
  Pencil,
  X,
} from "lucide-react";

import { StateProvider, useAppState } from "@/components/app/state-provider";
import {
  categoryLabel,
  HABIT_CATEGORIES,
  STATUS_LABELS,
  type DashboardCalendarDay,
  type DashboardHabitView,
  type DashboardStatus,
  type DashboardViewModel
} from "@/components/dashboard/dashboard-data";
import { EventsCard } from "@/components/dashboard/events-card";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { FriendsCard } from "@/components/dashboard/friends-card";
import { GardenFairCard } from "@/components/dashboard/garden-fair";
import { GardenVisitOverlay } from "@/components/dashboard/garden-visit-overlay";
import { HabitDetailOverlay } from "@/components/dashboard/habit-detail-overlay";
import { habitEmoji, habitIconBubbleClass } from "@/components/dashboard/habit-style";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { SyncOnboarding } from "@/components/dashboard/sync-onboarding";
import { Button } from "@/components/ui/button";
import type { SyncStatus } from "@/lib/sync/types";
import { cn, formatPercent } from "@/lib/utils";

/** Vietnamese tooltip + emoji per sync status (spec §2.1 — discreet dot). */
const SYNC_DOT: Record<Exclude<SyncStatus, "disabled">, { emoji: string; label: string }> = {
  idle: { emoji: "☁️", label: "Đã lưu trên mây" },
  pending: { emoji: "⏳", label: "Đang đồng bộ…" },
  error: { emoji: "⚠️", label: "Chưa đồng bộ được — sẽ thử lại" }
};

export function DashboardClient({ userEmail }: { userEmail: string }) {
  return (
    <StateProvider userEmail={userEmail}>
      <DashboardBody />
    </StateProvider>
  );
}

function DashboardBody() {
  const app = useAppState();
  const { viewModel } = app;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2.5 font-display text-base font-bold text-plum"
          href="/dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-matcha-deep font-display text-sm text-white shadow-mochi">
            BM
          </span>
          BetterMe
        </Link>
        <ProfileMenu
          email={app.userEmail}
          onOpenProfile={app.openProfile}
          onOpenSettings={app.openSettings}
          onSignOut={app.signOut}
        />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <HeroBanner
          bubble={app.bubble}
          celebrate={app.celebrate}
          eating={app.eating}
          onAdopt={app.adoptPet}
          onFeed={app.feedPet}
          onOpenGift={app.openGift}
          onPet={app.petThePet}
          onSwitch={app.switchPet}
          viewModel={viewModel}
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[repeat(18,minmax(0,1fr))]">
            <TodaysHabits
              habits={viewModel.habits}
              onAdd={app.addHabit}
              onOpenDetail={app.openHabitDetail}
              onRemove={app.removeHabit}
              onToggle={app.toggleHabit}
              viewModel={viewModel}
            />
            <CalendarPanel days={viewModel.calendar.days} viewModel={viewModel} />
            <EventsCard
              events={viewModel.events}
              onAdd={app.addEvent}
              onRemove={app.removeEvent}
              today={app.today}
            />
            <AnalyticsPanel viewModel={viewModel} />
            {/* Social layer rides on sync (spec §3.3): the card exists ONLY
                while the engine is enabled — live Supabase session + sync
                opt-in. Logged out / dev bypass: absent, zero layout change. */}
            {app.syncStatus !== "disabled" ? (
              <>
                <FriendsCard onVisitFriend={app.visitFriend} />
                <GardenFairCard onOwnLantern={app.speakFairLantern} />
              </>
            ) : null}
          </div>
          <aside
            aria-label="Thời tiết và nhạc tập trung"
            className="grid gap-5 xl:sticky xl:top-5"
          >
            <WeatherCard />
            <SpotifyCard />
          </aside>
        </div>
      </div>

      <SiteFooter />

      <SyncStatusDot status={app.syncStatus} />

      {app.showSyncOnboarding ? (
        <SyncOnboarding onChoose={app.chooseSync} onDismiss={app.dismissSync} />
      ) : null}

      {app.habitDetail ? (
        <HabitDetailOverlay
          categories={[...HABIT_CATEGORIES]}
          detail={app.habitDetail}
          onClose={app.closeHabitDetail}
          onRemove={(habitId) => {
            app.removeHabit(habitId);
            app.closeHabitDetail();
          }}
          onSave={app.saveHabitEdit}
        />
      ) : null}

      {app.visitingFriendId ? (
        <GardenVisitOverlay
          hostUserId={app.visitingFriendId}
          myFood={viewModel.companion.food}
          onClose={app.closeFriendVisit}
          // The gift RPC already appended the spend event server-side with an
          // id only the server knows — mirroring locally with a NEW id would
          // double-spend after union-merge. Re-hydrate instead: the merged
          // ledger carries the server's spend event (spec §4.2 + §2.3).
          onGiftSent={app.onGiftSent}
        />
      ) : null}
    </main>
  );
}

/**
 * Discreet sync indicator (spec §2.1), pinned to the footer corner. Hidden
 * entirely while sync is disabled (logged out / dev bypass); fixed positioning
 * means it never shifts the layout, appearing or changing state.
 */
function SyncStatusDot({ status }: { status: SyncStatus }) {
  if (status === "disabled") return null;

  const dot = SYNC_DOT[status];

  return (
    <span
      aria-label={dot.label}
      className={cn(
        "fixed bottom-3 right-3 z-40 flex h-8 w-8 select-none items-center justify-center rounded-full border border-wafer bg-mochi text-sm leading-none shadow-mochi",
        status === "idle" && "opacity-60"
      )}
      role="status"
      title={dot.label}
    >
      {dot.emoji}
    </span>
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
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/1/2/8]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">Lịch tháng</h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            {viewModel.date.monthLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-matcha/40 bg-matcha/10 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-matcha-deep">Tháng này</p>
          <p className="font-display text-lg font-bold text-matcha-deep">
            {formatPercent(viewModel.calendar.monthCompletionRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-mauve">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            aria-label={`${day.label}, xong ${day.completedHabits}/${day.totalHabits} thói quen, ${STATUS_LABELS[day.status]}`}
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-wafer text-xs font-bold sm:h-9 sm:w-9",
              day.inCurrentMonth ? "text-plum" : "border-wafer/50 text-mauve/40",
              day.fillRatio >= 1 &&
                day.inCurrentMonth &&
                "border-transparent text-white shadow-[0_2px_8px_rgba(76,122,67,0.28)]",
              day.isToday && "ring-2 ring-sakura-deep ring-offset-2"
            )}
            key={day.date}
            role="img"
            style={calendarCellStyle(day)}
            title={`${day.label}: ${day.completedHabits}/${day.totalHabits} thói quen`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </section>
  );
}

function TodaysHabits({
  habits,
  onAdd,
  onOpenDetail,
  onRemove,
  onToggle,
  viewModel
}: {
  habits: DashboardHabitView[];
  onAdd: (name: string, category: string) => void;
  onOpenDetail: (habitId: string) => void;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
  viewModel: DashboardViewModel;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(HABIT_CATEGORIES[0]);
  const easyWinId = findEasyWin(habits);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    onAdd(name, category);
    setName("");
    setShowForm(false);
  }

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/8/3/19]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">
            Thói quen hôm nay
          </h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            Xong {viewModel.today.completedHabits}/{viewModel.today.totalHabits} việc
          </p>
        </div>
        <StatusBadge status={viewModel.today.status} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-mauve">
          <span>Tiến độ hôm nay</span>
          <span className="text-plum">{formatPercent(viewModel.today.completionRate)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-wafer">
          <div
            className="h-full rounded-full bg-gradient-to-r from-matcha to-matcha-deep transition-all duration-500"
            style={{ width: `${viewModel.today.completionRate * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {habits.map((habit) => (
          <HabitRow
            editing={editing}
            habit={habit}
            isEasyWin={habit.id === easyWinId}
            key={habit.id}
            onOpenDetail={onOpenDetail}
            onRemove={onRemove}
            onToggle={onToggle}
          />
        ))}
      </div>

      {showForm ? (
        <form
          className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-wafer bg-rice/70 p-3"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="new-habit-name">
            Tên thói quen
          </label>
          <input
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Một thói quen nhỏ, vd. Uống đủ nước"
            value={name}
          />
          <label className="sr-only" htmlFor="new-habit-category">
            Nhóm
          </label>
          <select
            className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {HABIT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {categoryLabel(option)}
              </option>
            ))}
          </select>
          <Button type="submit">Trồng thôi 🌱</Button>
          <Button onClick={() => setShowForm(false)} type="button" variant="ghost">
            Để sau
          </Button>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
            <CirclePlus className="h-4 w-4" />
            Thêm thói quen
          </Button>
          <Button
            aria-pressed={editing}
            onClick={() => setEditing((current) => !current)}
            type="button"
            variant="ghost"
          >
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? "Xong" : "Sửa"}
          </Button>
        </div>
      )}
    </section>
  );
}

function findEasyWin(habits: DashboardHabitView[]) {
  const remaining = habits.filter((habit) => !habit.completed);

  if (!remaining.length || remaining.length === habits.length) return null;

  return remaining.reduce((easiest, habit) =>
    habit.maxScore < easiest.maxScore ? habit : easiest
  ).id;
}

function HabitRow({
  editing,
  habit,
  isEasyWin,
  onOpenDetail,
  onRemove,
  onToggle
}: {
  editing: boolean;
  habit: DashboardHabitView;
  isEasyWin: boolean;
  onOpenDetail: (habitId: string) => void;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
}) {
  const emoji = habitEmoji(habit.key, habit.category);
  const doneThisWeek = habit.weekDots.filter((dot) => dot.done).length;

  return (
    <div className="relative flex items-stretch gap-2">
      <button
        aria-pressed={habit.completed}
        className={cn(
          "squishy grid min-h-16 w-full min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-white/80 p-3 text-left shadow-mochi transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2",
          habit.completed ? "border-matcha/50 bg-matcha/5" : "border-wafer"
        )}
        onClick={() => onToggle(habit.id)}
        type="button"
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition",
            habitIconBubbleClass(habit.key, habit.category)
          )}
        >
          <span
            aria-label={`Biểu tượng thói quen ${habit.name}`}
            className="text-2xl leading-none drop-shadow-sm"
            role="img"
          >
            {emoji}
          </span>
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "inline-block max-w-full truncate align-top text-sm font-bold",
              habit.completed ? "crayon-strike text-mauve" : "text-plum"
            )}
          >
            {habit.name}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs font-bold text-mauve">
            <span className="truncate">{categoryLabel(habit.category)}</span>
            {habit.streak >= 2 ? (
              <span
                className="shrink-0 rounded-full bg-butter/50 px-2 py-0.5 text-[10px] font-bold text-plum"
                title={`Chuỗi ${habit.streak} ngày liên tiếp`}
              >
                🔥 {habit.streak}
              </span>
            ) : null}
            {isEasyWin && !habit.completed ? (
              <span className="shrink-0 rounded-full bg-butter/50 px-2 py-0.5 text-[10px] font-bold text-plum">
                ✨ dễ bắt đầu
              </span>
            ) : null}
            <span
              aria-label={`Tuần này xong ${doneThisWeek}/7 ngày`}
              className="ml-auto hidden shrink-0 items-center gap-1 sm:flex"
              role="img"
              title={`Tuần này: ${doneThisWeek}/7 ngày`}
            >
              {habit.weekDots.map((dot) => (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    dot.done ? "bg-matcha" : "bg-wafer",
                    dot.isToday && "ring-1 ring-sakura-deep ring-offset-1"
                  )}
                  key={dot.date}
                />
              ))}
            </span>
          </span>
        </span>
        <span className="relative flex h-9 w-9 items-center justify-center">
          {habit.completed ? (
            <span
              aria-hidden="true"
              className="habit-done-ring absolute inset-0 rounded-full bg-matcha/30"
            />
          ) : null}
          <span
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
              habit.completed
                ? "check-pop border-matcha bg-matcha text-white"
                : "border-wafer bg-white text-transparent"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3.5} />
          </span>
        </span>
      </button>
      <button
        aria-label={`Chi tiết thói quen ${habit.name}`}
        className="squishy flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-wafer bg-white/80 py-2 text-mauve shadow-mochi transition hover:bg-white hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
        onClick={() => onOpenDetail(habit.id)}
        type="button"
      >
        <BarChart3 className="h-4 w-4" />
      </button>
      {editing ? (
        <button
          aria-label={`Xóa thói quen ${habit.name}`}
          className="squishy absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-sakura-deep text-white shadow-mochi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep focus-visible:ring-offset-2"
          onClick={() => onRemove(habit.id)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-2 text-sm font-bold",
        status === "Good" && "bg-matcha/15 text-matcha-deep",
        status === "Okay" && "bg-butter/40 text-[#8A5A17]",
        status === "Bad" && "bg-sakura/40 text-sakura-deep",
        status === "No data" && "bg-wafer text-mauve"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function calendarCellStyle(day: DashboardCalendarDay) {
  const fillPercent = Math.round(day.fillRatio * 100);
  const fillColor = getCalendarFill(day.status);
  const trackColor = day.inCurrentMonth
    ? "rgba(245,230,224,0.95)"
    : "rgba(245,230,224,0.45)";

  if (day.fillRatio >= 1 && day.inCurrentMonth) {
    return {
      background: "#4C7A43"
    };
  }

  return {
    background: `radial-gradient(circle at center, rgba(255,255,255,0.98) 82%, transparent 83%), conic-gradient(${fillColor} ${fillPercent}%, ${trackColor} 0)`
  };
}

function getCalendarFill(status: DashboardStatus) {
  if (status === "Good") return "rgb(127, 176, 105)";
  if (status === "Okay") return "rgb(242, 176, 76)";
  if (status === "Bad") return "rgb(246, 198, 206)";
  return "rgba(111, 96, 105, 0.22)";
}
