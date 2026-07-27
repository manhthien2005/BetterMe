"use client";

import { useState } from "react";

import { useAppState } from "@/components/app/state-provider";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { HabitDayList } from "@/components/dashboard/habit-day-list";
import { NepMiniCard } from "@/components/dashboard/nep-mini-card";
import { WeekGridCard } from "@/components/dashboard/week-grid";
import { WidgetChips } from "@/components/dashboard/widget-chips";
import { TabSwitch } from "@/components/ui/tab-switch";

type TodayView = "day" | "week";

const VIEW_OPTIONS: Array<{ value: TodayView; label: string }> = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" }
];

/** 🏠 Hôm nay — the check-in space (spec §4). */
export function TodayPage() {
  const app = useAppState();
  const [view, setView] = useState<TodayView>("day");

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
      <div className="grid grid-cols-1 gap-5">
        <HeroBanner
          bubble={app.bubble}
          celebrate={app.celebrate}
          viewModel={app.viewModel}
          weather={app.weather}
        />

        <TabSwitch
          idPrefix="view"
          label="Chế độ xem"
          onChange={setView}
          options={VIEW_OPTIONS}
          value={view}
        />

        {/* Only the selected panel is mounted. A hidden panel left in the DOM
            is content a screen reader can still wander into. */}
        <div
          aria-labelledby={`view-tab-${view}`}
          id={`view-panel-${view}`}
          role="tabpanel"
          tabIndex={0}
        >
          {view === "day" ? (
            <HabitDayList
              habits={app.todaysHabits}
              onAdjustEntry={app.adjustHabitEntry}
              onCreate={() => app.openHabitEditor("")}
              onMove={app.moveHabit}
              onOpenDetail={app.openHabitDetail}
              onOpenEditor={app.openHabitEditor}
              onSetEntry={app.setHabitEntry}
              record={app.todayRecord}
              streaks={app.habitStreaks}
            />
          ) : (
            <WeekGridCard
              grid={app.weekGrid}
              previousDone={app.lastWeekDone}
              streaks={app.habitStreaks}
            />
          )}
        </div>

        {/* Weather and music sit under the check-in, inside the main column
            (spec §4.3): they are things you glance at, not things you came for,
            and on a phone there is no second column for them to live in. */}
        <WidgetChips />
      </div>

      {/* The backyard — desktop only, by design (spec §4.4). Nếp does not
          vanish on a phone: `/nep` is its real home, and this is the shortcut
          a wide screen has room for. */}
      <aside aria-label="Sân sau" className="hidden gap-5 xl:sticky xl:top-5 xl:grid">
        <NepMiniCard
          bubble={app.bubble}
          food={app.viewModel.companion.food}
          onFeed={app.feedPet}
          onPet={app.petThePet}
          pet={app.viewModel.companion.activePet}
        />
      </aside>
    </div>
  );
}
