"use client";

import { useState } from "react";
import { CloudRain, Droplets, LocateFixed, MapPin, Pencil, Sun, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { searchPlace, type WeatherSnapshot } from "@/components/dashboard/weather-data";
import { useAppState } from "@/components/app/state-provider";
import type { WeatherPlace } from "@/components/dashboard/widget-settings";
import { cn } from "@/lib/utils";

type WeatherMetric = {
  key: string;
  label: string;
  value: (snapshot: WeatherSnapshot | null) => string;
  icon: LucideIcon;
  /** Animation utility that plays on tile hover/focus (globals.css). */
  motion: string;
  tint: string;
  chip: string;
};

const WEATHER_METRICS: WeatherMetric[] = [
  {
    key: "humidity",
    label: "Độ ẩm",
    value: (snapshot) => snapshot?.humidity ?? "–",
    icon: Droplets,
    motion: "wx-humidity",
    tint: "text-dawn-deep",
    chip: "bg-dawn/20"
  },
  {
    key: "wind",
    label: "Gió",
    value: (snapshot) => snapshot?.wind ?? "–",
    icon: Wind,
    motion: "wx-wind",
    tint: "text-matcha-deep",
    chip: "bg-matcha/15"
  },
  {
    key: "rain",
    label: "Mưa",
    value: (snapshot) => snapshot?.rainChance ?? "–",
    icon: CloudRain,
    motion: "wx-rain",
    tint: "text-dawn-deep",
    chip: "bg-dawn/20"
  },
  {
    key: "uv",
    label: "UV",
    value: (snapshot) => snapshot?.uvIndex ?? "–",
    icon: Sun,
    motion: "wx-uv",
    tint: "text-honey",
    chip: "bg-butter/35"
  }
];

/**
 * The Weather hero, now live: Open-Meteo current conditions (no API key) for a
 * user-picked place — default Sài Gòn, changeable by city search or the
 * device's location, persisted in betterme.widgets.v1. While loading or when
 * the network fails the shell stays put with gentle placeholders; values are
 * real text for accessibility, and the icon tiles keep their ambient motion.
 */
export function WeatherCard() {
  // The reading itself belongs to StateProvider — one fetch for the whole app,
  // so this card and the hero's date line can never show two temperatures.
  // What stays here is UI state: whether the place picker is open, and what
  // the user has typed into it.
  const { refreshWeather, setWeatherPlace, weather } = useAppState();
  const { place, snapshot, status } = weather;
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [editNote, setEditNote] = useState<string | null>(null);

  function pickPlace(next: WeatherPlace) {
    setWeatherPlace(next);
    setEditing(false);
    setEditNote(null);
    setQuery("");
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const found = await searchPlace(query);

      if (found) {
        pickPlace(found);
      } else {
        setEditNote("Chưa tìm thấy nơi này — thử tên khác nhé");
      }
    } catch {
      setEditNote("Mạng đang chập chờn — thử lại sau nhé");
    }
  }

  function useDeviceLocation() {
    if (!("geolocation" in navigator)) {
      setEditNote("Máy này không cho xem vị trí");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        pickPlace({
          name: "Quanh đây",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setEditNote("Không lấy được vị trí — thử tìm theo tên nhé")
    );
  }

  return (
    <section
      aria-labelledby="weather-heading"
      className="soft-panel card-lift dawn-band relative overflow-hidden rounded-lg p-4 sm:p-5"
    >
      <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-dawn-deep">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.6} />
              <h2 className="truncate font-display text-xl font-bold text-plum" id="weather-heading">
                {place.name}
              </h2>
              <button
                aria-label="Đổi nơi xem thời tiết"
                className="squishy flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mauve transition hover:bg-white/70 hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
                onClick={() => {
                  setEditing((current) => !current);
                  setEditNote(null);
                }}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-sm font-bold text-mauve">
              {status === "ready" && snapshot
                ? snapshot.condition
                : status === "loading"
                  ? "Đang ngó trời…"
                  : "Chưa lấy được thời tiết"}
            </p>
          </div>
          <span
            aria-label={snapshot?.emojiLabel ?? "Thời tiết"}
            className="weather-emoji wx-float"
            role="img"
          >
            {status === "ready" && snapshot ? snapshot.emoji : "☁️"}
          </span>
        </div>

        {editing ? (
          <form className="rounded-2xl border border-wafer bg-white/80 p-3" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="weather-place-input">
              Tên thành phố
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
                id="weather-place-input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="vd. Hà Nội, Đà Lạt…"
                value={query}
              />
              <button
                className="squishy rounded-full bg-matcha-deep px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#3F6637] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
                type="submit"
              >
                Tìm
              </button>
              <button
                aria-label="Dùng vị trí của máy"
                className="squishy flex h-9 w-9 items-center justify-center rounded-full border border-wafer bg-white text-mauve transition hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
                onClick={useDeviceLocation}
                type="button"
              >
                <LocateFixed className="h-4 w-4" />
              </button>
            </div>
            {editNote ? (
              <p className="mt-2 text-xs font-bold text-mauve">{editNote}</p>
            ) : null}
          </form>
        ) : null}

        <div>
          <p className="font-display text-5xl font-bold text-plum sm:text-6xl">
            {status === "ready" && snapshot ? snapshot.temperature : "–"}
          </p>
          <p className="mt-1 text-sm font-bold text-mauve">
            {status === "ready" && snapshot ? `Cảm giác như ${snapshot.feelsLike}` : " "}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-mauve">
            {status === "ready" && snapshot ? (
              snapshot.planningNote
            ) : status === "error" ? (
              <>
                Mạng đang nghỉ ngơi một chút.{" "}
                <button
                  className="font-bold text-matcha-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
                  onClick={refreshWeather}
                  type="button"
                >
                  Thử lại nhé
                </button>
              </>
            ) : (
              "Đang lấy dự báo cho khu vườn…"
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {WEATHER_METRICS.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                className="wx-tile group flex items-center gap-2.5 rounded-2xl border border-wafer bg-white/70 p-2.5 transition hover:border-dawn/60 hover:bg-white"
                key={metric.key}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    metric.chip
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("h-5 w-5", metric.motion, metric.tint)}
                    strokeWidth={2.4}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-plum">
                    {metric.value(status === "ready" ? snapshot : null)}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-mauve">
                    {metric.label}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
