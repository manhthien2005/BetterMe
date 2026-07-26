import { CloudRain, Droplets, MapPin, Sun, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Static planning data for the Weather hero (spec:
 * docs/superpowers/specs/2026-07-05-dashboard-weather-spotify-hero-design.md).
 * No live API — the shell is branded and cozy; values are real, readable text.
 */
export const DASHBOARD_WEATHER = {
  location: "Bangkok",
  temperature: "31°C",
  condition: "Clear evening",
  feelsLike: "34°C",
  humidity: "68%",
  wind: "9 km/h",
  rainChance: "12%",
  uvIndex: "Low",
  planningNote: "Good window for a light walk after focus work.",
  emoji: "☀️",
  emojiLabel: "Clear weather"
} as const;

type WeatherMetric = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  /** Animation utility that plays on tile hover/focus (globals.css). */
  motion: string;
  tint: string;
  chip: string;
};

const WEATHER_METRICS: WeatherMetric[] = [
  {
    key: "humidity",
    label: "Humidity",
    value: DASHBOARD_WEATHER.humidity,
    icon: Droplets,
    motion: "wx-humidity",
    tint: "text-dawn-deep",
    chip: "bg-dawn/20"
  },
  {
    key: "wind",
    label: "Wind",
    value: DASHBOARD_WEATHER.wind,
    icon: Wind,
    motion: "wx-wind",
    tint: "text-matcha-deep",
    chip: "bg-matcha/15"
  },
  {
    key: "rain",
    label: "Rain",
    value: DASHBOARD_WEATHER.rainChance,
    icon: CloudRain,
    motion: "wx-rain",
    tint: "text-dawn-deep",
    chip: "bg-dawn/20"
  },
  {
    key: "uv",
    label: "UV",
    value: DASHBOARD_WEATHER.uvIndex,
    icon: Sun,
    motion: "wx-uv",
    tint: "text-honey",
    chip: "bg-butter/35"
  }
];

/**
 * The Weather hero — a compact daily-planning banner. The title collapses to a
 * pin + location, the condition is a single line, and the four planning metrics
 * become icon tiles whose glyphs animate (wind gust / humidity breathe / rain
 * fall / UV rays turn) — livelier on hover or keyboard focus, and fully still
 * under prefers-reduced-motion. Values stay as real text for accessibility.
 */
export function WeatherCard() {
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
              <h2 className="font-display text-xl font-bold text-plum" id="weather-heading">
                {DASHBOARD_WEATHER.location}
              </h2>
            </div>
            <p className="mt-1 text-sm font-bold text-mauve">{DASHBOARD_WEATHER.condition}</p>
          </div>
          <span
            aria-label={DASHBOARD_WEATHER.emojiLabel}
            className="weather-emoji wx-float"
            role="img"
          >
            {DASHBOARD_WEATHER.emoji}
          </span>
        </div>

        <div>
          <p className="font-display text-5xl font-bold text-plum sm:text-6xl">
            {DASHBOARD_WEATHER.temperature}
          </p>
          <p className="mt-1 text-sm font-bold text-mauve">
            Feels like {DASHBOARD_WEATHER.feelsLike}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-mauve">
            {DASHBOARD_WEATHER.planningNote}
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
                    {metric.value}
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
