"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Flame, Sprout, X } from "lucide-react";

import {
  categoryLabel,
  type HabitDetail,
  type HabitHeatCell
} from "@/components/dashboard/dashboard-data";
import { habitEmoji, habitIconBubbleClass } from "@/components/dashboard/habit-style";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";

const WEEKDAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function formatCellDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long" }).format(
    new Date(`${date}T00:00:00`)
  );
}

/**
 * Chi tiết một thói quen: heatmap 5 tuần, chuỗi ngày, nhịp 7/30 ngày, và sửa
 * tên/nhóm tại chỗ. Ngày lỡ nhịp hiển thị là chấm trống trung tính — không màu
 * đỏ, không đếm ngày bỏ lỡ (invariant 1, no-guilt).
 */
export function HabitDetailOverlay({
  categories,
  detail,
  onClose,
  onRemove,
  onSave
}: {
  categories: string[];
  detail: HabitDetail;
  onClose: () => void;
  onRemove: (habitId: string) => void;
  onSave: (habitId: string, name: string, category: string) => void;
}) {
  const [name, setName] = useState(detail.habit.name);
  const [category, setCategory] = useState(detail.habit.category);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const trimmed = name.trim();
  const dirty = trimmed !== detail.habit.name || category !== detail.habit.category;
  const doneThisWeek = detail.weeks[detail.weeks.length - 1].filter((cell) => cell.done).length;

  return (
    <div
      aria-labelledby="habit-detail-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/35 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="soft-panel relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-gradient-to-b from-mochi to-rice p-5 shadow-mochi sm:p-6">
        <button
          aria-label="Đóng chi tiết thói quen"
          className="squishy absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-wafer bg-white/85 text-mauve transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
              habitIconBubbleClass(detail.habit.key, category)
            )}
          >
            <span aria-hidden="true" className="text-2xl leading-none drop-shadow-sm">
              {habitEmoji(detail.habit.key, category)}
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold text-plum" id="habit-detail-title">
              {detail.habit.name}
            </h2>
            <p className="text-sm font-bold text-mauve">
              {categoryLabel(detail.habit.category)}
              {detail.completedToday ? " · hôm nay đã xong 🌿" : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <DetailStat
            icon={<Flame aria-hidden="true" className="h-4 w-4 text-honey" />}
            label="Chuỗi ngày"
            value={`${detail.streak}`}
          />
          <DetailStat
            icon={<Sprout aria-hidden="true" className="h-4 w-4 text-matcha-deep" />}
            label="Nhịp 7 ngày"
            value={formatPercent(detail.rate7)}
          />
          <DetailStat
            icon={<CalendarRange aria-hidden="true" className="h-4 w-4 text-dawn-deep" />}
            label="Nhịp 30 ngày"
            value={formatPercent(detail.rate30)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-wafer bg-white/75 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-mauve">
            <span className="uppercase tracking-wide">5 tuần gần đây</span>
            <span>
              Tuần này: {doneThisWeek}/7 · Tổng cộng {detail.totalCompletions} lần
            </span>
          </div>
          <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-mauve">
            {WEEKDAY_HEADERS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1 grid gap-1">
            {detail.weeks.map((week) => (
              <div className="grid grid-cols-7 gap-1" key={week[0].date}>
                {week.map((cell) => (
                  <HeatCell cell={cell} key={cell.date} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <form
          className="mt-4 rounded-2xl border border-wafer bg-white/75 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (dirty && trimmed) onSave(detail.habit.id, trimmed, category);
          }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-mauve">Chỉnh sửa</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="habit-detail-name">
              Tên thói quen
            </label>
            <input
              className="h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
              id="habit-detail-name"
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <label className="sr-only" htmlFor="habit-detail-category">
              Nhóm
            </label>
            <select
              className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
              id="habit-detail-category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {categoryLabel(option)}
                </option>
              ))}
            </select>
            <Button disabled={!dirty || !trimmed} type="submit">
              Lưu thay đổi
            </Button>
          </div>
        </form>

        <div className="mt-3 flex justify-end">
          {confirmingRemove ? (
            <div className="flex items-center gap-2 text-sm font-bold text-mauve">
              <span>Xóa cả lịch sử của thói quen này?</span>
              <Button
                onClick={() => onRemove(detail.habit.id)}
                size="sm"
                type="button"
                variant="destructive"
              >
                Xóa luôn
              </Button>
              <Button
                onClick={() => setConfirmingRemove(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Giữ lại
              </Button>
            </div>
          ) : (
            <button
              className="squishy rounded-full px-3 py-1.5 text-xs font-bold text-sakura-deep transition hover:bg-sakura/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep"
              onClick={() => setConfirmingRemove(true)}
              type="button"
            >
              Xóa thói quen này
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailStat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-wafer bg-white/75 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs font-bold text-mauve">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-xl font-bold text-plum">{value}</p>
    </div>
  );
}

/** Ô heatmap: xong = matcha, để trống = chấm nhạt trung tính, tương lai = mờ. */
function HeatCell({ cell }: { cell: HabitHeatCell }) {
  const label = `${formatCellDate(cell.date)}: ${
    cell.isFuture ? "chưa tới" : cell.done ? "đã xong" : "để trống"
  }`;

  return (
    <span
      aria-label={label}
      className={cn(
        "mx-auto h-6 w-6 rounded-lg border sm:h-7 sm:w-7",
        cell.done
          ? "border-transparent bg-gradient-to-br from-matcha to-matcha-deep shadow-[0_1px_4px_rgba(76,122,67,0.35)]"
          : cell.isFuture
            ? "border-wafer/40 bg-transparent"
            : "border-wafer bg-white/70",
        cell.isToday && "ring-2 ring-sakura-deep ring-offset-1"
      )}
      role="img"
      title={label}
    />
  );
}
