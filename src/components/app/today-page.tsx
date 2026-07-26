"use client";

import { useAppState } from "@/components/app/state-provider";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { HabitDayList } from "@/components/dashboard/habit-day-list";
import { WeatherCard } from "@/components/dashboard/weather-card";

/** 🏠 Hôm nay — the check-in space (spec §4). */
export function TodayPage() {
  const app = useAppState();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
      <div className="grid grid-cols-1 gap-5">
        <HeroBanner celebrate={app.celebrate} viewModel={app.viewModel} />
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
      </div>
      <aside aria-label="Thời tiết và nhạc tập trung" className="grid gap-5 xl:sticky xl:top-5">
        <WeatherCard />
        <SpotifyCard />
      </aside>
    </div>
  );
}
