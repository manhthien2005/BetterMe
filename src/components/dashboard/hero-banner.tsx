"use client";

import { Flame } from "lucide-react";

import type { AppWeather } from "@/components/app/state-provider";
import { CelebrationOverlay } from "@/components/dashboard/celebration-overlay";
import { STATUS_LABELS, type DashboardViewModel } from "@/components/dashboard/dashboard-data";
import { SKY_GREETINGS, SKY_STYLES, skyPhaseAt } from "@/components/dashboard/sky";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

/**
 * The hero "bầu trời" (spec §4.1) — the Hôm nay space's emotional hook. The
 * sky behind it changes with the time of day, and its ink changes with it,
 * because the evening sky is dark.
 *
 * `hour` is a prop rather than a call to the clock so a test can put the sun
 * wherever it likes; in the app it is simply left out.
 */
export function HeroBanner({
  bubble,
  celebrate,
  hour,
  viewModel,
  weather
}: {
  /** Nếp's line for right now — already through the no-guilt voice guard. */
  bubble?: string | null;
  celebrate: boolean;
  hour?: number;
  viewModel: DashboardViewModel;
  weather: AppWeather;
}) {
  const phase = skyPhaseAt(hour ?? new Date().getHours());
  const sky = SKY_STYLES[phase];
  const { completedHabits, totalHabits } = viewModel.today;
  // Only once it has actually arrived: a hero showing "· undefined°" while
  // the request is in flight reads as broken rather than as loading.
  const forecast = weather.status === "ready" ? weather.snapshot : null;

  return (
    <section
      className={cn("relative overflow-hidden rounded-lg p-5 shadow-card sm:p-6", sky.panel, sky.ink)}
    >
      {/* Two soft shapes, no more — the spec asks for at most two. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className={cn("text-sm font-semibold", sky.inkSoft)} data-testid="hero-date-line">
            {viewModel.date.longLabel}
            {forecast ? (
              <>
                {" · "}
                <span aria-hidden="true">{forecast.emoji}</span> {forecast.temperature}{" "}
                {forecast.condition.toLowerCase()}
              </>
            ) : null}
          </p>

          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            {SKY_GREETINGS[phase]}, Sếp ơi
          </h1>

          <p className={cn("mt-2 max-w-md text-sm font-medium leading-6", sky.inkSoft)}>
            {bubble ?? viewModel.motivation}
          </p>
        </div>

        {/*
          Rendered ONCE and moved by flexbox, not duplicated behind `sm:hidden`
          / `hidden sm:flex`: a hidden-by-media-query copy is still in the
          accessibility tree, so a screen reader would read the streak and the
          progress ring twice. On mobile this wraps — streak and ring share a
          row, the chain drops to its own; on desktop it becomes the column
          beside the greeting.
        */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
          <StreakBlock inkSoft={sky.inkSoft} viewModel={viewModel} />
          <ProgressRing
            label={`Tiến độ hôm nay ${completedHabits}/${totalHabits}`}
            size="lg"
            target={totalHabits}
            value={completedHabits}
          >
            <span className="text-ink">{`${completedHabits}/${totalHabits}`}</span>
          </ProgressRing>
          <DayChain inkSoft={sky.inkSoft} viewModel={viewModel} />
        </div>
      </div>

      <CelebrationOverlay show={celebrate} />
    </section>
  );
}

function StreakBlock({ inkSoft, viewModel }: { inkSoft: string; viewModel: DashboardViewModel }) {
  return (
    <div className="flex items-center gap-2">
      <Flame aria-hidden="true" className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
      <span className="font-display text-2xl font-extrabold sm:text-3xl">
        {viewModel.streak.current}
      </span>
      <span className={cn("text-xs font-semibold", inkSoft)}>
        {`kỷ lục ${viewModel.streak.best} ✦`}
      </span>
    </div>
  );
}

/** The last seven days, one dot each. Today wears a ring so it stands out. */
function DayChain({ inkSoft, viewModel }: { inkSoft: string; viewModel: DashboardViewModel }) {
  const todayIso = viewModel.date.iso;

  return (
    <ul aria-label="Nhịp 7 ngày gần nhất" className={cn("flex items-center gap-2", inkSoft)}>
      {viewModel.streak.chain.map((day) => (
        <li
          aria-label={`Ngày ${day.label}: ${STATUS_LABELS[day.status]}`}
          className={cn(
            "h-3.5 w-3.5 rounded-full border-2 transition",
            day.completed ? "border-success bg-success" : "border-current bg-transparent",
            day.date === todayIso && "ring-2 ring-action ring-offset-1 ring-offset-transparent"
          )}
          key={day.date}
          title={`Ngày ${day.label}: ${STATUS_LABELS[day.status]}`}
        />
      ))}
    </ul>
  );
}
