"use client";

import { Activity, Cpu, Gauge, Layers, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  R3F_SAMPLE_EXPIRY_MS,
  readHudR3fSample,
  type R3fFrameRateSample
} from "@/lib/world/performance-monitor";

interface PerformanceMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemoryInfo;
}

export interface WebPerformanceMetrics {
  fps: number | null;
  frameTimeMs: number | null;
  windowFrames: number | null;
  windowDurationMs: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
  viewportWidth: number;
  viewportHeight: number;
  jsHeapUsedMb: number | null;
  jsHeapTotalMb: number | null;
  humanoidBones: number | null;
  avatarLoadTimeMs: number | null;
}

interface ChipSummaryState {
  fps: number | null;
  frameTimeMs: number | null;
  windowFrames: number | null;
  windowDurationMs: number | null;
  drawCalls: number;
  triangles: number;
}

interface DetailedPanelState {
  geometries: number;
  textures: number;
  dpr: number;
  viewportWidth: number;
  viewportHeight: number;
  jsHeapUsedMb: number | null;
  jsHeapTotalMb: number | null;
  humanoidBones: number | null;
  avatarLoadTimeMs: number | null;
}

const INITIAL_CHIP_SUMMARY: ChipSummaryState = {
  fps: null,
  frameTimeMs: null,
  windowFrames: null,
  windowDurationMs: null,
  drawCalls: 0,
  triangles: 0
};

const INITIAL_DETAILED_PANEL: DetailedPanelState = {
  geometries: 0,
  textures: 0,
  dpr: 1,
  viewportWidth: 1440,
  viewportHeight: 900,
  jsHeapUsedMb: null,
  jsHeapTotalMb: null,
  humanoidBones: null,
  avatarLoadTimeMs: null
};

function resolveCurrentR3fSample(nowMs: number): R3fFrameRateSample | null {
  if (typeof document !== "undefined" && document.hidden) {
    return null;
  }
  const direct = readHudR3fSample(nowMs, false);
  if (direct) {
    return direct;
  }
  if (typeof window === "undefined") {
    return null;
  }
  const debugSample = window.__READING_QUEST_CHARACTER_DEBUG__?.r3fFrameSample ?? null;
  if (!debugSample || nowMs - debugSample.publishedAtMs > R3F_SAMPLE_EXPIRY_MS) {
    return null;
  }
  return debugSample;
}

function getFpsStatus(fps: number | null): {
  label: string;
  dotClass: string;
  badgeClass: string;
} {
  if (fps === null) {
    return {
      label: "Đang lấy mẫu R3F...",
      dotClass: "bg-ink-soft",
      badgeClass: "border-line bg-surface-warm text-ink-soft"
    };
  }
  if (fps >= 50) {
    return {
      label: "Mượt (≥ 50 FPS)",
      dotClass: "bg-success",
      badgeClass: "border-line-success bg-surface-success text-success-ink"
    };
  }
  if (fps >= 30) {
    return {
      label: "Ổn định (30–49 FPS)",
      dotClass: "bg-action",
      badgeClass: "border-line-control bg-surface-warm text-ink"
    };
  }
  return {
    label: "Thấp (< 30 FPS)",
    dotClass: "bg-alert",
    badgeClass: "border-line-strong bg-surface-warm text-alert"
  };
}

export function WorldPerformanceHud() {
  const [open, setOpen] = useState(false);
  const [chip, setChip] = useState<ChipSummaryState>(INITIAL_CHIP_SUMMARY);
  const [details, setDetails] = useState<DetailedPanelState>(INITIAL_DETAILED_PANEL);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sampleChip = () => {
      const nowMs = Date.now();
      const r3fSample = resolveCurrentR3fSample(nowMs);
      const debug = window.__READING_QUEST_CHARACTER_DEBUG__;
      const next: ChipSummaryState = {
        fps: r3fSample ? r3fSample.fps : null,
        frameTimeMs: r3fSample ? r3fSample.frameTimeMs : null,
        windowFrames: r3fSample ? r3fSample.frameCount : null,
        windowDurationMs: r3fSample ? r3fSample.windowDurationMs : null,
        drawCalls: debug?.rendererCalls ?? 0,
        triangles: debug?.rendererTriangles ?? 0
      };

      setChip((prev) =>
        prev.fps === next.fps &&
        prev.frameTimeMs === next.frameTimeMs &&
        prev.windowFrames === next.windowFrames &&
        prev.windowDurationMs === next.windowDurationMs &&
        prev.drawCalls === next.drawCalls &&
        prev.triangles === next.triangles
          ? prev
          : next
      );
    };

    sampleChip();
    const intervalId = window.setInterval(sampleChip, 1_000);
    const onVisibilityChange = () => {
      sampleChip();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !open) return;

    const sampleDetailedPanel = () => {
      const debug = window.__READING_QUEST_CHARACTER_DEBUG__;
      const perf = window.performance as PerformanceWithMemory;
      const mem = perf?.memory;

      const jsHeapUsedMb =
        mem && typeof mem.usedJSHeapSize === "number"
          ? Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1))
          : null;
      const jsHeapTotalMb =
        mem && typeof mem.totalJSHeapSize === "number"
          ? Number((mem.totalJSHeapSize / (1024 * 1024)).toFixed(1))
          : null;

      setDetails({
        geometries: debug?.rendererGeometries ?? 0,
        textures: debug?.rendererTextures ?? 0,
        dpr:
          debug?.dpr ??
          Number((window.devicePixelRatio || 1).toFixed(2)),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        jsHeapUsedMb,
        jsHeapTotalMb,
        humanoidBones: debug?.avatarMetrics?.humanoidBoneCount ?? null,
        avatarLoadTimeMs: debug?.avatarMetrics?.loadTimeMs ?? null
      });
    };

    sampleDetailedPanel();
    const intervalId = window.setInterval(sampleDetailedPanel, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [open]);

  const status = getFpsStatus(chip.fps);
  const frameBudgetPct =
    chip.frameTimeMs !== null
      ? Math.min(100, Math.round((chip.frameTimeMs / 33.3) * 100))
      : 0;
  const fpsDisplay = chip.fps !== null ? `${chip.fps} FPS` : "— FPS";
  const frameTimeDisplay =
    chip.frameTimeMs !== null ? `${chip.frameTimeMs.toFixed(1)} ms` : "— ms";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label="Theo dõi hiệu suất 3D & Web"
          className="pointer-events-auto flex items-center gap-2 rounded-card border border-line-strong bg-surface-card px-2.5 py-1.5 text-left text-xs font-semibold text-ink shadow-card hover:bg-surface-warm sm:px-3 sm:py-2"
          data-fps={chip.fps !== null ? String(chip.fps) : "pending"}
          data-sample-state={chip.fps !== null ? "ready" : "pending"}
          data-testid="world-performance-hud"
          data-world-hud="true"
          type="button"
        >
          <span
            aria-hidden="true"
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", status.dotClass)}
          />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-xs font-extrabold text-ink"
                data-testid="perf-fps-value"
              >
                {fpsDisplay}
              </span>
              <span
                className="font-mono text-[10px] font-bold text-ink-mid"
                data-testid="perf-frametime-value"
              >
                {frameTimeDisplay}
              </span>
            </div>
            <p className="text-[10px] font-medium text-ink-soft">
              {chip.drawCalls > 0
                ? `${chip.drawCalls} calls · ${(chip.triangles / 1000).toFixed(1)}k tris`
                : "Nhịp vòng R3F (~1s)"}
            </p>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        aria-label="Bảng thông số hiệu suất 3D & Web"
        className="w-[min(22rem,calc(100vw-2rem))] space-y-3 p-3.5"
        data-world-hud="true"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Icon as={Activity} className="text-action" size="sm" />
            <div>
              <h2 className="font-display text-sm font-extrabold text-ink">
                Hiệu suất 3D & Web
              </h2>
              <p className="text-[11px] font-medium text-ink-soft">
                Đo nhịp vòng lặp R3F (useFrame ~1s), không phải GPU time
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-pill border px-2 py-0.5 text-[10px] font-bold",
              status.badgeClass
            )}
          >
            {status.label}
          </span>
        </div>

        {/* R3F Frame Loop Rate & Frame Time Section */}
        <div className="space-y-1.5 rounded-control border border-line bg-surface-page p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span className="inline-flex items-center gap-1.5">
              <Icon as={Gauge} className="text-action" size="sm" />
              Nhịp vòng R3F (Frame Loop)
            </span>
            <span className="font-mono text-sm font-extrabold text-ink">
              {fpsDisplay}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="rounded border border-line bg-surface-card px-2 py-1">
              <p className="text-[10px] font-semibold text-ink-soft">Cửa sổ đo (Vòng R3F)</p>
              <p className="font-mono text-xs font-extrabold text-ink">
                {chip.windowFrames !== null && chip.windowDurationMs !== null
                  ? `${chip.windowFrames} frame / ${(chip.windowDurationMs / 1000).toFixed(1)}s`
                  : "Đang gom mẫu (~1s)"}
              </p>
            </div>
            <div className="rounded border border-line bg-surface-card px-2 py-1">
              <p className="text-[10px] font-semibold text-ink-soft">Frame Time TB (Mục tiêu 16.7ms)</p>
              <p className="font-mono text-xs font-extrabold text-ink">
                {frameTimeDisplay}
              </p>
            </div>
          </div>

          <div className="space-y-0.5 pt-1">
            <div className="flex justify-between text-[10px] font-semibold text-ink-soft">
              <span>Mức tải vòng R3F</span>
              <span>{frameBudgetPct}% (ngưỡng 33.3ms)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-warm">
              <div
                className={cn("h-full rounded-full", status.dotClass)}
                style={{ width: `${frameBudgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* WebGL Renderer Stats */}
        <div className="space-y-1.5 rounded-control border border-line bg-surface-page p-2.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
            <Icon as={Layers} className="text-action" size="sm" />
            WebGL Renderer (Three.js)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="text-ink-soft">Draw Calls</span>
              <span className="font-mono font-bold text-ink">{chip.drawCalls}</span>
            </div>
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="text-ink-soft">Triangles</span>
              <span className="font-mono font-bold text-ink">
                {chip.triangles.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="text-ink-soft">Geometries</span>
              <span className="font-mono font-bold text-ink">{details.geometries}</span>
            </div>
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="text-ink-soft">Textures</span>
              <span className="font-mono font-bold text-ink">{details.textures}</span>
            </div>
          </div>
        </div>

        {/* Browser Memory, Viewport & VRM Rig */}
        <div className="space-y-1.5 rounded-control border border-line bg-surface-page p-2.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
            <Icon as={Cpu} className="text-action" size="sm" />
            Bộ nhớ & Hiển thị Web
          </p>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="text-ink-soft">Bộ nhớ JS Heap</span>
              <span className="font-mono font-bold text-ink">
                {details.jsHeapUsedMb !== null && details.jsHeapTotalMb !== null
                  ? `${details.jsHeapUsedMb} / ${details.jsHeapTotalMb} MB`
                  : "Trình duyệt ẩn chỉ số"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
              <span className="inline-flex items-center gap-1 text-ink-soft">
                <Icon as={Monitor} size="sm" />
                Viewport & DPR
              </span>
              <span className="font-mono font-bold text-ink">
                {details.viewportWidth}×{details.viewportHeight} @{details.dpr}x
              </span>
            </div>
            {details.humanoidBones !== null ? (
              <div className="flex items-center justify-between rounded border border-line bg-surface-card px-2 py-1">
                <span className="text-ink-soft">Khung xương VRM</span>
                <span className="font-mono font-bold text-ink">
                  {details.humanoidBones} xương · Tải {details.avatarLoadTimeMs ?? 0}ms
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
