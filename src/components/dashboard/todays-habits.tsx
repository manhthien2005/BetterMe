"use client";

import { useState } from "react";
import { BarChart3, Check, CirclePlus, Pencil, X } from "lucide-react";

import {
  categoryLabel,
  HABIT_CATEGORIES,
  STATUS_LABELS,
  type DashboardHabitView,
  type DashboardStatus,
  type DashboardViewModel
} from "@/components/dashboard/dashboard-data";
import { habitEmoji, habitIconBubbleClass } from "@/components/dashboard/habit-style";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";

export function TodaysHabits({
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
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5">
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
