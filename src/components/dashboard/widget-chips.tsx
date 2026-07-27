"use client";

import { useState } from "react";

import { useAppState } from "@/components/app/state-provider";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Weather and music, shrunk to two chips on one row (spec §4.3).
 *
 * They used to own a whole column beside the habit list, which put a playlist
 * embed at the same visual weight as the day's check-in. Now each is a pill
 * carrying one line of text, and the full card lives inside its popover — the
 * detail is unchanged, only its resting place.
 */
const CHIP_CLASS =
  "squishy inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-line bg-surface-card px-4 text-sm font-semibold text-ink shadow-card transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page";

/**
 * Three states in one short line. The visible text is terse ("Đang ngó trời…")
 * while the accessible name spells out what a sighted reader gets from the
 * emoji and the layout — including that the chip is a thing you can press.
 */
function weatherChipText(
  status: "loading" | "ready" | "error",
  snapshot: { temperature: string; condition: string; emoji: string } | null,
  placeName: string
) {
  if (status === "ready" && snapshot) {
    return {
      emoji: snapshot.emoji,
      text: `${snapshot.temperature} · ${placeName}`,
      label: `Thời tiết: ${snapshot.temperature}, ${snapshot.condition}, ${placeName} — bấm để xem chi tiết`
    };
  }

  if (status === "loading") {
    return {
      emoji: "☁️",
      text: "Đang ngó trời…",
      label: "Thời tiết: đang tải — bấm để xem chi tiết"
    };
  }

  return {
    emoji: "☁️",
    text: "Chưa lấy được",
    label: "Thời tiết: chưa lấy được — bấm để xem chi tiết và thử lại"
  };
}

export function WidgetChips() {
  const { weather } = useAppState();
  const chip = weatherChipText(weather.status, weather.snapshot, weather.place.name);
  // The music popover is controlled because it is force-mounted: Radix hands a
  // force-mounted panel its `data-state` and nothing else, so hiding the closed
  // one is the caller's job and the caller needs to know it is closed.
  const [musicOpen, setMusicOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger aria-label={chip.label} className={CHIP_CLASS}>
          <span aria-hidden="true">{chip.emoji}</span>
          <span>{chip.text}</span>
        </PopoverTrigger>
        <PopoverContent aria-label="Chi tiết thời tiết">
          <WeatherCard />
        </PopoverContent>
      </Popover>

      <Popover onOpenChange={setMusicOpen} open={musicOpen}>
        <PopoverTrigger aria-label="Nhạc tập trung — bấm để mở playlist" className={CHIP_CLASS}>
          <span aria-hidden="true">🎧</span>
          <span>Nhạc tập trung</span>
        </PopoverTrigger>
        {/* forceMount keeps the Spotify iframe in the DOM so closing the chip
            does not stop the music (owner's call, 2026-07-27). Radix only flips
            data-state when force-mounted, so the closed panel has to hide
            itself twice over: `hidden` so it takes no space, and `aria-hidden`
            so a screen reader is not walking through an invisible playlist. */}
        <PopoverContent
          aria-hidden={musicOpen ? undefined : true}
          aria-label="Playlist Spotify"
          className="w-[min(24rem,calc(100vw-2rem))]"
          forceMount
          hidden={!musicOpen}
        >
          <SpotifyCard />
        </PopoverContent>
      </Popover>
    </div>
  );
}
