"use client";

import { useState } from "react";
import { CalendarCheck, CirclePlus, X } from "lucide-react";

import {
  EVENT_CATEGORY_LABELS,
  formatEventTime,
  type DashboardEvent
} from "@/components/dashboard/dashboard-data";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = Object.keys(EVENT_CATEGORY_LABELS) as Array<
  DashboardEvent["category"]
>;

/**
 * Sự kiện sắp tới — dữ liệu thật do người dùng tự tạo (local-only, không sync).
 * Danh sách đã được view model lọc (hôm nay trở đi) và xếp theo thời gian.
 */
export function EventsCard({
  events,
  onAdd,
  onRemove,
  today
}: {
  events: DashboardEvent[];
  onAdd: (input: { title: string; at: string; category: DashboardEvent["category"] }) => void;
  onRemove: (eventId: string) => void;
  today: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [at, setAt] = useState(`${today}T20:00`);
  const [category, setCategory] = useState<DashboardEvent["category"]>("planning");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !at) return;

    onAdd({ title, at, category });
    setTitle("");
    setShowForm(false);
  }

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:2/1/3/8]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-matcha-deep" />
          <h2 className="font-display text-lg font-bold text-plum">Sự kiện sắp tới</h2>
        </div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} size="sm" type="button" variant="secondary">
            <CirclePlus className="h-4 w-4" />
            Thêm
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form
          className="mb-4 grid gap-2 rounded-2xl border border-wafer bg-rice/70 p-3"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="new-event-title">
            Tên sự kiện
          </label>
          <input
            autoFocus
            className="h-10 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-event-title"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="vd. Ôn lại tuần, hẹn cà phê…"
            value={title}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="new-event-at">
              Thời gian
            </label>
            <input
              className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
              id="new-event-at"
              min={`${today}T00:00`}
              onChange={(event) => setAt(event.target.value)}
              type="datetime-local"
              value={at}
            />
            <label className="sr-only" htmlFor="new-event-category">
              Nhóm sự kiện
            </label>
            <select
              className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
              id="new-event-category"
              onChange={(event) =>
                setCategory(event.target.value as DashboardEvent["category"])
              }
              value={category}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {EVENT_CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
            <Button size="sm" type="submit">
              Lưu sự kiện
            </Button>
            <Button onClick={() => setShowForm(false)} size="sm" type="button" variant="ghost">
              Để sau
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {events.map((event) => (
          <div
            className="group relative rounded-2xl border border-wafer bg-white/75 p-3"
            key={event.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-plum">{event.title}</p>
                <p className="mt-1 text-xs font-bold text-mauve">
                  {formatEventTime(event.at, today)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-full bg-sakura/40 px-2.5 py-1 text-xs font-bold text-sakura-deep">
                  {EVENT_CATEGORY_LABELS[event.category]}
                </span>
                <button
                  aria-label={`Xóa sự kiện ${event.title}`}
                  className="squishy flex h-7 w-7 items-center justify-center rounded-full text-mauve transition hover:bg-sakura/20 hover:text-sakura-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep"
                  onClick={() => onRemove(event.id)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && !showForm ? (
          <p className="rounded-2xl border border-dashed border-wafer bg-white/50 p-4 text-center text-sm font-semibold text-mauve">
            Chưa có sự kiện nào — thêm một cái để khỏi quên nhé 🌱
          </p>
        ) : null}
      </div>
    </section>
  );
}
