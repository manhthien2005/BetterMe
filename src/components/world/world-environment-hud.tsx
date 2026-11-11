"use client";

import {
  Cloud,
  CloudRain,
  CloudSun,
  Clock,
  Droplets,
  Eye,
  MoonStar,
  RotateCcw,
  Sun,
  Thermometer
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  EffectiveEnvironmentSnapshot,
  EnvironmentPresetId,
  EnvironmentPreviewOverride
} from "@/lib/world/environment-model";
import type { WeatherConditionKind } from "@/lib/world/environment-weather";
import { cn } from "@/lib/utils";

const DAY_PHASE_PRESETS: readonly { id: EnvironmentPresetId; label: string }[] = [
  { id: "phase_morning", label: "Sáng (07:30)" },
  { id: "phase_noon", label: "Trưa (12:15)" },
  { id: "phase_afternoon", label: "Chiều (15:30)" },
  { id: "phase_dusk", label: "Hoàng hôn (17:30)" },
  { id: "phase_night", label: "Đêm (20:30)" }
];

const SEASON_PRESETS: readonly { id: EnvironmentPresetId; label: string }[] = [
  { id: "season_spring", label: "Xuân (Th4)" },
  { id: "season_summer", label: "Hạ (Th7)" },
  { id: "season_autumn", label: "Thu (Th10)" },
  { id: "season_winter", label: "Đông (Th1)" }
];

const WEATHER_KIND_OPTIONS: readonly {
  kind: WeatherConditionKind;
  label: string;
  defaultCloud: number;
}[] = [
  { kind: "clear", label: "Trời quang", defaultCloud: 12 },
  { kind: "partly_cloudy", label: "Ít mây", defaultCloud: 42 },
  { kind: "overcast", label: "Nhiều mây", defaultCloud: 85 },
  { kind: "rain", label: "Có mưa", defaultCloud: 92 }
];

function getWeatherIcon(snapshot: EffectiveEnvironmentSnapshot) {
  if (snapshot.isRaining || snapshot.weatherKind === "rain") {
    return CloudRain;
  }
  if (snapshot.weatherKind === "overcast") {
    return Cloud;
  }
  if (snapshot.isNight) {
    return MoonStar;
  }
  if (snapshot.weatherKind === "partly_cloudy") {
    return CloudSun;
  }
  return Sun;
}

export function WorldEnvironmentHud({
  environment,
  previewOverride,
  onEnablePreview,
  onUpdatePreview,
  onApplyPreset,
  onExitPreview
}: {
  environment: EffectiveEnvironmentSnapshot;
  previewOverride: EnvironmentPreviewOverride | null;
  onEnablePreview: () => void;
  onUpdatePreview: (patch: Partial<EnvironmentPreviewOverride>) => void;
  onApplyPreset: (presetId: EnvironmentPresetId) => void;
  onExitPreview: () => void;
}) {
  const WeatherIcon = getWeatherIcon(environment);

  const activeDateValue = previewOverride?.isoDate ?? environment.isoDate;
  const activeTimeValue = previewOverride?.time24h ?? environment.time24h;
  const activeCloudValue = previewOverride?.cloudCoverPct ?? environment.cloudCoverPct;
  const activeTempValue =
    previewOverride?.temperatureC ??
    (environment.temperatureC !== null ? Math.round(environment.temperatureC) : 30);
  const activeHumidityValue =
    previewOverride?.relativeHumidityPct ??
    (environment.relativeHumidityPct !== null
      ? Math.round(environment.relativeHumidityPct)
      : 72);

  return (
    <section
      aria-label="Thời gian và Thời tiết TP.HCM"
      className={cn(
        "pointer-events-auto flex flex-wrap items-center gap-2 rounded-card border px-3 py-1.5 shadow-card",
        environment.isPreview
          ? "border-line-control bg-surface-warm"
          : "border-line-strong bg-surface-card"
      )}
      data-day-phase={environment.dayPhase}
      data-environment-mode={environment.mode}
      data-freshness={environment.freshness}
      data-season={environment.season}
      data-testid="world-environment-hud"
      data-weather-kind={environment.weatherKind}
      data-world-hud="true"
    >
      {/* Location, Clock, Date, Season & Day Phase */}
      <div className="flex items-center gap-2 pr-1">
        <Icon as={Clock} className="text-action" size="sm" />
        <div className="leading-tight">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-ink">
              {environment.locationName}
            </span>
            <span
              className="font-mono text-xs font-extrabold text-ink"
              data-testid="environment-time-24h"
            >
              {environment.time24h}
            </span>
            <span className="text-[11px] font-semibold text-ink-mid">
              {environment.dateDisplay}
            </span>
            {environment.isPreview ? (
              <span
                className="rounded-pill border border-line-control bg-surface-card px-2 py-0.5 text-[10px] font-extrabold text-action"
                data-testid="environment-preview-badge"
              >
                Đang xem thử
              </span>
            ) : null}
          </div>
          <p className="text-[10px] font-semibold text-ink-soft">
            <span data-testid="environment-season-label">{environment.seasonLabel}</span>
            {" · "}
            <span data-testid="environment-phase-label">{environment.dayPhaseLabel}</span>
            {" · "}
            <span>{environment.freshnessLabel}</span>
          </p>
        </div>
      </div>

      {/* Weather Icon, Description, Temperature & Relative Humidity */}
      <div className="flex items-center gap-2 border-l border-line pl-2.5">
        <Icon as={WeatherIcon} className="text-action" size="sm" />
        <div className="leading-tight">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <span data-testid="environment-weather-label">{environment.weatherLabel}</span>
            <span
              aria-label={`Nhiệt độ ${environment.temperatureDisplay}`}
              className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-ink"
              data-testid="environment-temperature"
            >
              <Icon as={Thermometer} className="text-ink-soft" size="sm" />
              {environment.temperatureDisplay}
            </span>
            <span
              aria-label={`Độ ẩm không khí ${environment.humidityDisplay}`}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-mid"
              data-testid="environment-humidity"
            >
              <Icon as={Droplets} className="text-ink-soft" size="sm" />
              {environment.humidityDisplay}
            </span>
          </div>
          <p className="text-[10px] font-medium text-ink-soft">
            Mây {environment.cloudCoverPct}% · Nguồn{" "}
            <a
              className="underline hover:text-ink"
              href="https://open-meteo.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Open-Meteo
            </a>
          </p>
        </div>
      </div>

      {/* Preview Mode Trigger & Quick Exit */}
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              type="button"
              variant={environment.isPreview ? "primary" : "secondary"}
            >
              <Icon as={Eye} size="sm" />
              Xem thử môi trường
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            aria-label="Bảng điều khiển Xem thử môi trường"
            className="w-[min(23rem,calc(100vw-2rem))] space-y-3 p-3.5"
            data-world-hud="true"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <div>
                <h2 className="font-display text-sm font-extrabold text-ink">
                  Xem thử môi trường TP.HCM
                </h2>
                <p className="text-[11px] font-medium text-ink-soft">
                  Thử nghiệm giờ, mùa và thời tiết — không ảnh hưởng dữ liệu thật
                </p>
              </div>
              {environment.isPreview ? (
                <span className=" shrink-0 rounded-pill border border-line-control bg-surface-warm px-2 py-0.5 text-[10px] font-bold text-action">
                  Đang xem thử
                </span>
              ) : (
                <span className="shrink-0 rounded-pill border border-line bg-surface-page px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                   Thực tế (Live)
                </span>
              )}
            </div>

            {/* Date & 24h Time Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-mid">
                <span>Ngày (TP.HCM)</span>
                <input
                  aria-label="Chọn ngày giả lập"
                  className="rounded-control border border-line-strong bg-surface-page px-2 py-1 text-xs font-semibold text-ink"
                  onChange={(e) => {
                    if (e.target.value) {
                      onUpdatePreview({ isoDate: e.target.value });
                    }
                  }}
                  type="date"
                  value={activeDateValue}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-mid">
                <span>Giờ 24h (TP.HCM)</span>
                <input
                  aria-label="Chọn giờ giả lập"
                  className="rounded-control border border-line-strong bg-surface-page px-2 py-1 font-mono text-xs font-semibold text-ink"
                  onChange={(e) => {
                    if (e.target.value) {
                      onUpdatePreview({ time24h: e.target.value.slice(0, 5) });
                    }
                  }}
                  type="time"
                  value={activeTimeValue}
                />
              </label>
            </div>

            {/* Day Phase Presets */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-ink-mid">Preset buổi trong ngày</p>
              <div className="flex flex-wrap gap-1">
                {DAY_PHASE_PRESETS.map((preset) => (
                  <button
                    className="rounded-control border border-line-strong bg-surface-page px-2 py-1 text-[11px] font-semibold text-ink hover:bg-surface-warm"
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.id)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Season Presets */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-ink-mid">Preset 4 mùa (theo tháng)</p>
              <div className="grid grid-cols-4 gap-1">
                {SEASON_PRESETS.map((preset) => (
                  <button
                    className="rounded-control border border-line-strong bg-surface-page px-2 py-1 text-[11px] font-semibold text-ink hover:bg-surface-warm"
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.id)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Weather Condition */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-ink-mid">Thời tiết giả lập</p>
              <div className="grid grid-cols-2 gap-1.5">
                {WEATHER_KIND_OPTIONS.map((opt) => {
                  const isSelected =
                    environment.isPreview && environment.weatherKind === opt.kind;
                  return (
                    <button
                      className={cn(
                        "rounded-control border px-2.5 py-1 text-left text-[11px] font-semibold",
                        isSelected
                          ? "border-line-control bg-surface-warm text-ink"
                          : "border-line-strong bg-surface-page text-ink-mid hover:bg-surface-warm"
                      )}
                      key={opt.kind}
                      onClick={() =>
                        onUpdatePreview({
                          weatherKind: opt.kind,
                          cloudCoverPct: opt.defaultCloud
                        })
                      }
                      type="button"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cloud Cover, Temperature & Humidity Sliders */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <label className="flex flex-col gap-1 text-[10px] font-bold text-ink-mid">
                <span>Mây: {activeCloudValue}%</span>
                <input
                  aria-label="Mật độ mây giả lập"
                  className="accent-action"
                  max={100}
                  min={0}
                  onChange={(e) =>
                    onUpdatePreview({ cloudCoverPct: Number(e.target.value) })
                  }
                  type="range"
                  value={activeCloudValue}
                />
              </label>

              <label className="flex flex-col gap-1 text-[10px] font-bold text-ink-mid">
                <span>Nhiệt độ: {activeTempValue}°C</span>
                <input
                  aria-label="Nhiệt độ giả lập"
                  className="accent-action"
                  max={42}
                  min={16}
                  onChange={(e) =>
                    onUpdatePreview({ temperatureC: Number(e.target.value) })
                  }
                  type="range"
                  value={activeTempValue}
                />
              </label>

              <label className="flex flex-col gap-1 text-[10px] font-bold text-ink-mid">
                <span>Độ ẩm: {activeHumidityValue}%</span>
                <input
                  aria-label="Độ ẩm giả lập"
                  className="accent-action"
                  max={100}
                  min={20}
                  onChange={(e) =>
                    onUpdatePreview({ relativeHumidityPct: Number(e.target.value) })
                  }
                  type="range"
                  value={activeHumidityValue}
                />
              </label>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
              {!environment.isPreview ? (
                <Button
                  onClick={onEnablePreview}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Bật xem thử hiện tại
                </Button>
              ) : (
                <span className="text-[11px] font-semibold text-action">
                  Đang áp dụng cấu hình xem thử
                </span>
              )}

              <Button
                disabled={!environment.isPreview}
                onClick={onExitPreview}
                size="sm"
                type="button"
                variant="primary"
              >
                <Icon as={RotateCcw} size="sm" />
                Trở về thực tế
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {environment.isPreview ? (
          <Button
            aria-label="Trở về thực tế ngay"
            onClick={onExitPreview}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Icon as={RotateCcw} size="sm" />
            Trở về thực tế
          </Button>
        ) : null}
      </div>
    </section>
  );
}
