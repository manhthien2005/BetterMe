"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildDefaultPreviewOverride,
  buildPreviewOverrideFromPreset,
  resolveEffectiveEnvironmentSnapshot,
  type EffectiveEnvironmentSnapshot,
  type EnvironmentPresetId,
  type EnvironmentPreviewOverride
} from "@/lib/world/environment-model";
import {
  computeWeatherRetryDelayMs,
  fetchHcmcWeatherWithCache,
  getCachedHcmcWeatherState,
  WEATHER_REFRESH_INTERVAL_MS,
  type CachedHcmcWeatherState
} from "@/lib/world/environment-weather";

const CLOCK_TICK_INTERVAL_MS = 15_000;

export interface WorldEnvironmentController {
  snapshot: EffectiveEnvironmentSnapshot;
  previewOverride: EnvironmentPreviewOverride | null;
  liveWeatherState: CachedHcmcWeatherState;
  enablePreview: () => void;
  updatePreview: (patch: Partial<EnvironmentPreviewOverride>) => void;
  applyPreset: (presetId: EnvironmentPresetId) => void;
  exitPreview: () => void;
  refreshWeather: (force?: boolean) => Promise<void>;
}

export function useWorldEnvironment({
  isPersonalSpace,
  initialNowMs
}: {
  isPersonalSpace: boolean;
  initialNowMs?: number;
}): WorldEnvironmentController {
  const [nowMs, setNowMs] = useState<number>(() => initialNowMs ?? Date.now());
  const [liveWeatherState, setLiveWeatherState] = useState<CachedHcmcWeatherState>(() =>
    getCachedHcmcWeatherState()
  );
  const [previewOverride, setPreviewOverride] = useState<EnvironmentPreviewOverride | null>(
    null
  );

  const mountedRef = useRef(true);

  const refreshWeather = useCallback(async (force: boolean = false) => {
    const currentNow = Date.now();
    const nextState = await fetchHcmcWeatherWithCache({
      nowMs: currentNow,
      force
    });

    if (mountedRef.current) {
      setNowMs(Date.now());
      setLiveWeatherState(nextState);
    }
  }, []);

  // Initial clock sync + weather load + cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      if (mountedRef.current) {
        setNowMs(Date.now());
      }
    });
    void refreshWeather(false);

    return () => {
      mountedRef.current = false;
    };
  }, [refreshWeather]);

  // 1:1 Real-time clock sync (always reads Date.now(), never accumulates seconds)
  useEffect(() => {
    const syncClockAndMaybeRefresh = () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      const currentNow = Date.now();
      setNowMs(currentNow);

      const cached = getCachedHcmcWeatherState();
      const needsRefresh =
        !cached.reading ||
        currentNow - cached.reading.fetchedAtMs >= WEATHER_REFRESH_INTERVAL_MS;
      if (needsRefresh && cached.status !== "loading") {
        void refreshWeather(false);
      }
    };

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      setNowMs(Date.now());
    }, CLOCK_TICK_INTERVAL_MS);

    window.addEventListener("focus", syncClockAndMaybeRefresh);
    document.addEventListener("visibilitychange", syncClockAndMaybeRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncClockAndMaybeRefresh);
      document.removeEventListener("visibilitychange", syncClockAndMaybeRefresh);
    };
  }, [refreshWeather]);

  // Periodic 15m weather refresh when ready, or bounded exponential backoff on error
  useEffect(() => {
    const delayMs =
      liveWeatherState.status === "error"
        ? computeWeatherRetryDelayMs(liveWeatherState.failureCount)
        : WEATHER_REFRESH_INTERVAL_MS;

    const timerId = window.setTimeout(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      void refreshWeather(false);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [liveWeatherState.failureCount, liveWeatherState. reading?.fetchedAtMs, liveWeatherState.status, refreshWeather]);

  const enablePreview = useCallback(() => {
    setPreviewOverride((prev) =>
      prev ?? buildDefaultPreviewOverride(Date.now(), liveWeatherState.reading)
    );
  }, [liveWeatherState.reading]);

  const updatePreview = useCallback(
    (patch: Partial<EnvironmentPreviewOverride>) => {
      setPreviewOverride((prev) => {
        const base =
          prev ?? buildDefaultPreviewOverride(Date.now(), liveWeatherState.reading);
        return {
          ...base,
          ...patch
        };
      });
    },
    [liveWeatherState.reading]
  );

  const applyPreset = useCallback(
    (presetId: EnvironmentPresetId) => {
      setPreviewOverride((prev) => {
        const base =
          prev ?? buildDefaultPreviewOverride(Date.now(), liveWeatherState.reading);
        return buildPreviewOverrideFromPreset(presetId, Date.now(), base);
      });
    },
    [liveWeatherState.reading]
  );

  const exitPreview = useCallback(() => {
    const currentNow = Date.now();
    setPreviewOverride(null);
    setNowMs(currentNow);

    const cached = getCachedHcmcWeatherState();
    setLiveWeatherState(cached);
    if (
      !cached.reading ||
      currentNow - cached.reading.fetchedAtMs >= WEATHER_REFRESH_INTERVAL_MS
    ) {
      void refreshWeather(false);
    }
  }, [refreshWeather]);

  const snapshot = useMemo<EffectiveEnvironmentSnapshot>(
    () =>
      resolveEffectiveEnvironmentSnapshot({
        liveReading: liveWeatherState.reading,
        liveStatus: liveWeatherState.status,
        previewOverride,
        nowMs,
        isPersonalSpace
      }),
    [
      isPersonalSpace,
      liveWeatherState.reading,
      liveWeatherState.status,
      nowMs,
      previewOverride
    ]
  );

  return {
    snapshot,
    previewOverride,
    liveWeatherState,
    enablePreview,
    updatePreview,
    applyPreset,
    exitPreview,
    refreshWeather
  };
}
