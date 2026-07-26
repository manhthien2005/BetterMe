"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Settings2 } from "lucide-react";

import type { DashboardHabit, HabitDraft } from "@/components/dashboard/dashboard-data";
import {
  CHECKLIST_MAX_STEPS,
  CHECKLIST_MIN_STEPS,
  HABIT_COLOR_STYLES,
  HABIT_COLORS,
  normalizeTimesOfDay,
  TIME_OF_DAY_EMOJI,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  TRACKING_TYPES,
  type HabitColor,
  type TimeOfDay,
  type TrackingType
} from "@/components/dashboard/habit-model";
import {
  COUNT_UNITS,
  HABIT_TEMPLATES,
  suggestIcons,
  type HabitTemplate
} from "@/components/dashboard/habit-templates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRACKING_LABELS: Record<TrackingType, string> = {
  check: "Đánh dấu",
  count: "Đếm số lượng",
  duration: "Thời lượng",
  checklist: "Checklist"
};

const TRACKING_GLYPH: Record<TrackingType, string> = {
  check: "✓",
  count: "123",
  duration: "⏱",
  checklist: "☰"
};

const WEEKDAYS: ReadonlyArray<{ iso: number; short: string; long: string }> = [
  { iso: 1, short: "T2", long: "Thứ Hai" },
  { iso: 2, short: "T3", long: "Thứ Ba" },
  { iso: 3, short: "T4", long: "Thứ Tư" },
  { iso: 4, short: "T5", long: "Thứ Năm" },
  { iso: 5, short: "T6", long: "Thứ Sáu" },
  { iso: 6, short: "T7", long: "Thứ Bảy" },
  { iso: 7, short: "CN", long: "Chủ Nhật" }
];

type FormState = {
  name: string;
  icon: string;
  trackingType: TrackingType;
  target: number;
  unit: string;
  steps: string[];
  repeatDays: number[];
  timesOfDay: TimeOfDay[];
  scheduledAt: string;
  color: HabitColor;
  motivation: string;
};

function blankForm(): FormState {
  return {
    name: "",
    icon: "⭐",
    trackingType: "check",
    target: 1,
    unit: COUNT_UNITS[0],
    steps: ["", ""],
    repeatDays: [1, 2, 3, 4, 5, 6, 7],
    timesOfDay: ["anytime"],
    scheduledAt: "",
    color: "clay",
    motivation: ""
  };
}

function formFromHabit(habit: DashboardHabit): FormState {
  return {
    name: habit.name,
    icon: habit.icon,
    trackingType: habit.trackingType,
    target: habit.target,
    unit: habit.unit ?? COUNT_UNITS[0],
    steps: habit.steps ?? ["", ""],
    repeatDays: habit.repeatDays,
    timesOfDay: habit.timesOfDay,
    scheduledAt: habit.scheduledAt ?? "",
    color: habit.color,
    motivation: habit.motivation
  };
}

function formFromTemplate(template: HabitTemplate, current: FormState): FormState {
  return {
    ...current,
    name: template.name,
    icon: template.icon,
    trackingType: template.trackingType,
    target: template.target,
    unit: template.unit ?? COUNT_UNITS[0],
    timesOfDay: template.timesOfDay
  };
}

/**
 * One sheet for both creating and refining a habit (spec §5.1): ten seconds of
 * quick create up front, everything else folded away behind "Tinh chỉnh thêm".
 */
export function HabitEditorSheet({
  habit,
  onArchive,
  onClose,
  onPause,
  onSubmit
}: {
  habit: DashboardHabit | null;
  onArchive?: (habitId: string, archived: boolean) => void;
  onClose: () => void;
  onPause?: (habitId: string, paused: boolean) => void;
  onSubmit: (draft: HabitDraft) => void;
}) {
  const isEditing = habit !== null;
  const [form, setForm] = useState<FormState>(() =>
    habit ? formFromHabit(habit) : blankForm()
  );
  const [advanced, setAdvanced] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const iconSuggestions = useMemo(() => suggestIcons(form.name), [form.name]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function patch(changes: Partial<FormState>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function pickTrackingType(trackingType: TrackingType) {
    patch({
      trackingType,
      target: trackingType === "check" ? 1 : trackingType === "duration" ? 20 : 8,
      steps:
        trackingType === "checklist" && form.steps.length < CHECKLIST_MIN_STEPS
          ? ["", ""]
          : form.steps
    });
  }

  /**
   * Switching the LAST remaining day off is refused rather than silently
   * reset: a habit with no day would never come round again, and quietly
   * re-checking all seven behind the user's back is worse than not moving.
   */
  function toggleWeekday(iso: number) {
    const on = form.repeatDays.includes(iso);

    if (on && form.repeatDays.length === 1) return;

    patch({
      repeatDays: on
        ? form.repeatDays.filter((day) => day !== iso)
        : [...form.repeatDays, iso].sort((a, b) => a - b)
    });
  }

  /** "Cả ngày" is exclusive — picking it clears the individual slots. */
  function toggleTimeOfDay(slot: TimeOfDay) {
    if (slot === "anytime") {
      patch({ timesOfDay: ["anytime"] });
      return;
    }

    const withoutAnytime = form.timesOfDay.filter((item) => item !== "anytime");
    const next = withoutAnytime.includes(slot)
      ? withoutAnytime.filter((item) => item !== slot)
      : [...withoutAnytime, slot];

    patch({ timesOfDay: normalizeTimesOfDay(next) });
  }

  function handleSubmit() {
    const steps = form.steps.map((step) => step.trim()).filter(Boolean);

    onSubmit({
      name: form.name,
      icon: form.icon,
      trackingType: form.trackingType,
      target: form.target,
      unit: form.trackingType === "count" ? form.unit : null,
      steps: form.trackingType === "checklist" ? steps : null,
      repeatDays: form.repeatDays,
      timesOfDay: form.timesOfDay,
      scheduledAt: form.scheduledAt || null,
      color: form.color,
      motivation: form.motivation,
      category: habit?.category ?? "Discipline"
    });
  }

  const canSubmit = form.name.trim().length > 0;

  return (
    <div
      aria-labelledby="habit-editor-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 sm:items-center sm:p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      role="dialog"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-card border border-line bg-surface-page p-5 shadow-card sm:rounded-card">
        <h2
          className="font-display text-lg font-extrabold text-ink"
          id="habit-editor-title"
        >
          {isEditing ? habit.name : "Thói quen mới 🌱"}
        </h2>

        {!isEditing ? (
          <>
            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
              BẮT ĐẦU TỪ MẪU CÓ SẴN
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HABIT_TEMPLATES.map((template) => (
                <button
                  className="squishy min-h-[44px] rounded-pill border border-line-strong bg-surface-card px-3 text-xs font-semibold text-ink-soft transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  key={template.key}
                  onClick={() => setForm((current) => formFromTemplate(template, current))}
                  type="button"
                >
                  {`${template.icon} ${template.label}`}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
          {isEditing ? "TÊN & BIỂU TƯỢNG" : "HOẶC TỰ TẠO"}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-control text-2xl",
              HABIT_COLOR_STYLES[form.color].soft
            )}
          >
            {form.icon}
          </span>
          <label className="sr-only" htmlFor="habit-name">
            Tên thói quen
          </label>
          <input
            className="h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface-card px-3.5 text-sm font-medium text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            id="habit-name"
            maxLength={60}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Một việc nhỏ, vd. Uống đủ nước"
            ref={nameRef}
            value={form.name}
          />
        </div>
        <div aria-label="Biểu tượng gợi ý" className="ml-[60px] mt-1.5 flex items-center gap-1.5">
          <span className="text-[11px] text-ink-soft">Gợi ý:</span>
          {iconSuggestions.map((icon) => (
            <button
              className={cn(
                "squishy flex h-8 w-8 items-center justify-center rounded-control text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                form.icon === icon ? "bg-surface-warm" : "hover:bg-surface-warm"
              )}
              key={icon}
              onClick={() => patch({ icon })}
              type="button"
            >
              {icon}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
          KIỂU THEO DÕI
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup">
          {TRACKING_TYPES.map((type) => (
            <button
              aria-checked={form.trackingType === type}
              aria-label={TRACKING_LABELS[type]}
              className={cn(
                "squishy min-h-[44px] rounded-pill border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                form.trackingType === type
                  ? "border-line-honey bg-surface-warm text-action-hover"
                  : "border-line-strong bg-surface-card text-ink-soft hover:bg-surface-warm"
              )}
              key={type}
              onClick={() => pickTrackingType(type)}
              role="radio"
              type="button"
            >
              {`${TRACKING_GLYPH[type]} ${TRACKING_LABELS[type]}`}
            </button>
          ))}
        </div>

        {form.trackingType === "count" || form.trackingType === "duration" ? (
          <>
            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
              MỤC TIÊU MỖI NGÀY
            </p>
            <div className="mt-2 flex items-center gap-2">
              <label className="sr-only" htmlFor="habit-target">
                Mục tiêu mỗi ngày
              </label>
              <input
                className="h-11 w-20 rounded-control border border-line-strong bg-surface-card px-3 text-sm font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                id="habit-target"
                min={1}
                onChange={(event) => patch({ target: Number(event.target.value) })}
                type="number"
                value={form.target}
              />
              {form.trackingType === "count" ? (
                <>
                  <label className="sr-only" htmlFor="habit-unit">
                    Đơn vị
                  </label>
                  <select
                    className="h-11 rounded-control border border-line-strong bg-surface-card px-3 text-sm font-medium text-ink-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                    id="habit-unit"
                    onChange={(event) => patch({ unit: event.target.value })}
                    value={form.unit}
                  >
                    {COUNT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-ink-soft">{`— mỗi lần bấm +1 ${form.unit}`}</span>
                </>
              ) : (
                <span className="text-xs text-ink-soft">phút — mỗi lần bấm +5 phút</span>
              )}
            </div>
          </>
        ) : null}

        {form.trackingType === "checklist" ? (
          <>
            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
              CÁC BƯỚC
            </p>
            <div className="mt-2 space-y-1.5">
              {form.steps.map((step, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <label className="sr-only" htmlFor={`habit-step-${index}`}>
                    {`Bước ${index + 1}`}
                  </label>
                  <input
                    className="h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface-card px-3.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                    id={`habit-step-${index}`}
                    onChange={(event) => {
                      const steps = [...form.steps];

                      steps[index] = event.target.value;
                      patch({ steps });
                    }}
                    placeholder={`Bước ${index + 1}`}
                    value={step}
                  />
                  {form.steps.length > CHECKLIST_MIN_STEPS ? (
                    <button
                      aria-label={`Bỏ bước ${index + 1}`}
                      className="squishy min-h-[44px] px-2 text-xs font-semibold text-ink-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                      onClick={() =>
                        patch({ steps: form.steps.filter((_, item) => item !== index) })
                      }
                      type="button"
                    >
                      Bỏ
                    </button>
                  ) : null}
                </div>
              ))}
              {form.steps.length < CHECKLIST_MAX_STEPS ? (
                <Button
                  onClick={() => patch({ steps: [...form.steps, ""] })}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Thêm bước
                </Button>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button className="flex-1" disabled={!canSubmit} onClick={handleSubmit} type="button">
            {isEditing ? "Lưu thay đổi" : "Trồng thói quen 🌱"}
          </Button>
          <button
            aria-expanded={advanced}
            className="squishy flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            onClick={() => setAdvanced((current) => !current)}
            type="button"
          >
            <Settings2 aria-hidden="true" className="h-4 w-4" />
            Tinh chỉnh thêm
          </button>
        </div>

        {advanced ? (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">LẶP VÀO THỨ</p>
            <div className="mt-2 flex gap-1.5">
              {WEEKDAYS.map((day) => {
                const on = form.repeatDays.includes(day.iso);

                return (
                  <button
                    aria-checked={on}
                    aria-label={day.long}
                    className={cn(
                      "squishy flex h-11 w-11 items-center justify-center rounded-control text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                      on ? "bg-action text-action-ink" : "bg-surface-card text-ink-soft"
                    )}
                    key={day.iso}
                    onClick={() => toggleWeekday(day.iso)}
                    role="checkbox"
                    type="button"
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 rounded-control border border-line-success bg-surface-success px-2.5 py-1.5 text-[11.5px] text-ink-mid">
              🍃 Ngày không lặp là ngày nghỉ có chủ đích — <b>chuỗi vẫn giữ nguyên</b>
            </p>

            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">BUỔI</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TIME_OF_DAY_ORDER.map((slot) => {
                const on = form.timesOfDay.includes(slot);
                const emoji = TIME_OF_DAY_EMOJI[slot];

                return (
                  <button
                    aria-checked={on}
                    className={cn(
                      "squishy min-h-[44px] rounded-pill border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                      on
                        ? "border-line-honey bg-surface-warm text-action-hover"
                        : "border-line-strong bg-surface-card text-ink-soft"
                    )}
                    key={slot}
                    onClick={() => toggleTimeOfDay(slot)}
                    role="checkbox"
                    type="button"
                  >
                    {emoji ? `${emoji} ${TIME_OF_DAY_LABELS[slot]}` : TIME_OF_DAY_LABELS[slot]}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
              GIỜ DỰ KIẾN (KHÔNG BẮT BUỘC)
            </p>
            <label className="sr-only" htmlFor="habit-time">
              Giờ dự kiến
            </label>
            <input
              className="mt-2 h-11 rounded-control border border-line-strong bg-surface-card px-3 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              id="habit-time"
              onChange={(event) => patch({ scheduledAt: event.target.value })}
              type="time"
              value={form.scheduledAt}
            />

            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">MÀU THẺ</p>
            <div className="mt-2 flex gap-2" role="radiogroup">
              {HABIT_COLORS.map((color) => (
                <button
                  aria-checked={form.color === color}
                  aria-label={`Màu thẻ ${color}`}
                  className={cn(
                    "squishy flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                    form.color === color && "ring-2 ring-action ring-offset-2"
                  )}
                  key={color}
                  onClick={() => patch({ color })}
                  role="radio"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-6 w-6 rounded-full", HABIT_COLOR_STYLES[color].strong)}
                  />
                </button>
              ))}
            </div>

            <p className="mt-4 text-[10.5px] font-bold tracking-[0.08em] text-ink-soft">
              VÌ SAO MÌNH LÀM VIỆC NÀY?
            </p>
            <label className="sr-only" htmlFor="habit-motivation">
              Vì sao mình làm việc này?
            </label>
            <textarea
              className="mt-2 w-full rounded-control border border-line-strong bg-surface-card px-3.5 py-2.5 text-sm italic text-ink-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              id="habit-motivation"
              maxLength={140}
              onChange={(event) => patch({ motivation: event.target.value })}
              placeholder="Câu này sẽ hiện lại mỗi khi bạn mở chi tiết thói quen"
              rows={2}
              value={form.motivation}
            />

            {isEditing ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => onPause?.(habit.id, habit.pausedAt === null)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {habit.pausedAt ? "▶ Tiếp tục" : "⏸ Tạm dừng"}
                </Button>
                <Button
                  onClick={() => onArchive?.(habit.id, habit.archivedAt === null)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {habit.archivedAt ? "↩ Đưa trở lại" : "🗃 Lưu trữ"}
                </Button>
                <span className="ml-auto text-[11.5px] text-ink-soft">
                  Xoá hẳn nằm trong Lưu trữ
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} size="sm" type="button" variant="ghost">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
