"use client";

import { CheckCircle2, Flower2, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CelebrationOverlay } from "@/components/dashboard/celebration-overlay";
import { CompanionPanel, type CompanionHandlers } from "@/components/dashboard/companion-panel";
import { STATUS_LABELS, type DashboardViewModel } from "@/components/dashboard/dashboard-data";
import { cn, formatPercent } from "@/lib/utils";

/**
 * The hero — the dashboard's emotional hook (ui-system.md). A two-zone banner:
 * the greeting, motivation, quick stats, and 7-day chain on one side; the
 * companion on the other. When every habit is done, gentle fireworks bloom
 * across the whole banner via the CelebrationOverlay.
 */
export function HeroBanner({
  bubble,
  celebrate,
  eating,
  onAdopt,
  onFeed,
  onOpenGift,
  onPet,
  onSwitch,
  viewModel
}: CompanionHandlers & {
  celebrate: boolean;
  viewModel: DashboardViewModel;
}) {
  const goodDaysThisMonth = viewModel.calendar.days.filter(
    (day) => day.inCurrentMonth && day.status === "Good"
  ).length;

  return (
    <section className="soft-panel card-lift relative overflow-hidden rounded-lg p-5 sm:p-6">
      {/* Soft, contained wash — the hero glows a touch warmer than the rest. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-matcha/10 blur-3xl" />
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-sakura/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-matcha-deep">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-matcha-deep" />
            {viewModel.date.longLabel}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-plum sm:text-4xl">
            {viewModel.greeting}, Sếp ơi
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-mauve">
            {viewModel.motivation}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricPill
              icon={CheckCircle2}
              label="Hôm nay"
              tone="matcha"
              value={`${viewModel.today.completedHabits}/${viewModel.today.totalHabits}`}
            />
            <MetricPill
              icon={Sprout}
              label="Nhịp 7 ngày"
              tone="sakura"
              value={formatPercent(viewModel.streak.rhythm)}
            />
            <MetricPill
              icon={Flower2}
              label="Ngày tốt"
              tone="butter"
              value={`${goodDaysThisMonth} trong tháng`}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-wafer bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-label="Nhịp 7 ngày gần nhất" className="flex items-center gap-2">
              {viewModel.streak.chain.map((day) => (
                <span
                  aria-label={`Ngày ${day.label}: ${STATUS_LABELS[day.status]}`}
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border transition",
                    day.completed
                      ? "border-matcha-deep/50 bg-matcha shadow-[0_0_0_4px_rgba(127,176,105,0.16)]"
                      : "border-wafer bg-white"
                  )}
                  key={day.date}
                  title={`Ngày ${day.label}: ${STATUS_LABELS[day.status]}`}
                />
              ))}
            </div>
            <p className="text-sm font-bold text-mauve">{viewModel.streak.protectionMessage}</p>
          </div>
        </div>

        <div className="flex justify-center lg:pr-2">
          <CompanionPanel
            bubble={bubble}
            celebrate={celebrate}
            eating={eating}
            onAdopt={onAdopt}
            onFeed={onFeed}
            onOpenGift={onOpenGift}
            onPet={onPet}
            onSwitch={onSwitch}
            viewModel={viewModel}
          />
        </div>
      </div>

      <CelebrationOverlay show={celebrate} />
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
  tone: "matcha" | "sakura" | "butter";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/75 p-4 transition hover:bg-white",
        tone === "matcha" && "border-matcha/40",
        tone === "sakura" && "border-sakura",
        tone === "butter" && "border-butter"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-bold text-mauve">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "matcha" && "text-matcha-deep",
            tone === "sakura" && "text-sakura-deep",
            tone === "butter" && "text-honey"
          )}
        />
        {label}
      </div>
      <p className="mt-2 font-display text-xl font-bold text-plum sm:text-2xl">{value}</p>
    </div>
  );
}
