"use client";

import { useAppState } from "@/components/app/state-provider";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { WeatherCard } from "@/components/dashboard/weather-card";

/** 🏠 Hôm nay — the check-in space (spec §4). */
export function TodayPage() {
  const app = useAppState();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
      <div className="grid grid-cols-1 gap-5">
        <HeroBanner celebrate={app.celebrate} viewModel={app.viewModel} />
        <TodaysHabits
          habits={app.viewModel.habits}
          onAdd={app.addHabit}
          onOpenDetail={app.openHabitDetail}
          onRemove={app.removeHabit}
          onToggle={app.toggleHabit}
          viewModel={app.viewModel}
        />
      </div>
      <aside aria-label="Thời tiết và nhạc tập trung" className="grid gap-5 xl:sticky xl:top-5">
        <WeatherCard />
        <SpotifyCard />
      </aside>
    </div>
  );
}
