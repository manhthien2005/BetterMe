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
};

// The four tiles used to be tinted one colour each (dawn / matcha / butter).
// Under "colour is a role" a humidity reading is not a role — it is data — so
// they now share the neutral warm surface and the icon shape carries the
// difference. WCAG 1.4.1 is happier for it: the label was always the real
// signal.
const WEATHER_METRICS: WeatherMetric[] = [
  {
    key: "humidity",
    label: "Độ ẩm",
    value: (snapshot) => snapshot?.humidity ?? "–",
    icon: Droplets,
    motion: "wx-humidity"
  },
  {
    key: "wind",
    label: "Gió",
    value: (snapshot) => snapshot?.wind ?? "–",
    icon: Wind,
    motion: "wx-wind"
  },
  {
    key: "rain",
    label: "Mưa",
    value: (snapshot) => snapshot?.rainChance ?? "–",
    icon: CloudRain,
    motion: "wx-rain"
  },
  {
    key: "uv",
    label: "UV",
    value: (snapshot) => snapshot?.uvIndex ?? "–",
    icon: Sun,
    motion: "wx-uv"
  }
];

/**
 * The weather detail, live from Open-Meteo (no API key) for a user-picked place
 * — default Sài Gòn, changeable by city search or the device's location,
 * persisted in betterme.widgets.v1. While loading or when the network fails the
 * shell stays put with gentle placeholders; values are real text for
 * accessibility, and the icon tiles keep their ambient motion.
 *
 * Since U2c this lives inside the weather chip's popover (spec §4.3) rather
 * than owning a column. That is why it renders a plain `<div>` and no longer
 * reserves a 280px minimum: the popover is already a labelled region, and a
 * floor height inside one only buys empty space.
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
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-ink-mid">
            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.6} />
            <h2 className="truncate font-display text-xl font-bold text-ink" id="weather-heading">
              {place.name}
            </h2>
            <button
              aria-label="Đổi nơi xem thời tiết"
              className="squishy flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-mid transition hover:bg-surface-warm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              onClick={() => {
                setEditing((current) => !current);
                setEditNote(null);
              }}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-sm font-bold text-ink-mid">
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
        <form
          className="rounded-card border border-line bg-surface-warm p-3"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="weather-place-input">
            Tên thành phố
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              autoFocus
              className="h-9 min-w-0 flex-1 rounded-pill border border-line-control bg-surface-card px-3 text-sm font-semibold text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              id="weather-place-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="vd. Hà Nội, Đà Lạt…"
              value={query}
            />
            <button
              className="squishy rounded-pill bg-action px-3 py-1.5 text-sm font-bold text-action-ink transition hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              type="submit"
            >
              Tìm
            </button>
            <button
              aria-label="Dùng vị trí của máy"
              className="squishy flex h-9 w-9 items-center justify-center rounded-full border border-line-control bg-surface-card text-ink-mid transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              onClick={useDeviceLocation}
              type="button"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
          {editNote ? <p className="mt-2 text-xs font-bold text-ink-mid">{editNote}</p> : null}
        </form>
      ) : null}

      <div>
        <p className="font-display text-5xl font-bold text-ink">
          {status === "ready" && snapshot ? snapshot.temperature : "–"}
        </p>
        <p className="mt-1 text-sm font-bold text-ink-mid">
          {status === "ready" && snapshot ? `Cảm giác như ${snapshot.feelsLike}` : " "}
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink-mid">
          {status === "ready" && snapshot ? (
            snapshot.planningNote
          ) : status === "error" ? (
            <>
              Mạng đang nghỉ ngơi một chút.{" "}
              <button
                className="font-bold text-action underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
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
              className="wx-tile group flex items-center gap-2.5 rounded-card border border-line bg-surface-warm p-2.5 transition hover:border-line-strong"
              key={metric.key}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card">
                <Icon
                  aria-hidden="true"
                  className={cn("h-5 w-5 text-ink-mid", metric.motion)}
                  strokeWidth={2.4}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">
                  {metric.value(status === "ready" ? snapshot : null)}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-mid">
                  {metric.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
