export const R3F_SAMPLE_WINDOW_SECONDS = 1.0;
export const R3F_SAMPLE_EXPIRY_MS = 2_500;

export interface R3fFrameRateSample {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly frameCount: number;
  readonly windowDurationMs: number;
  readonly publishedAtMs: number;
}

export interface R3fFrameWindowAccumulator {
  frameCount: number;
  elapsedSeconds: number;
  skipNextInterval: boolean;
  lastPublishedSample: R3fFrameRateSample | null;
}

let publishedHudR3fSample: R3fFrameRateSample | null = null;

export function createR3fFrameWindowAccumulator(
  skipFirstInterval: boolean = false
): R3fFrameWindowAccumulator {
  return {
    frameCount: 0,
    elapsedSeconds: 0,
    skipNextInterval: skipFirstInterval,
    lastPublishedSample: null
  };
}

/**
 * Clears the accumulated window and invalidates the last sample when the tab
 * becomes hidden or resumes, marking the next interval across resume to be skipped.
 */
export function handleR3fVisibilityChange(acc: R3fFrameWindowAccumulator): void {
  acc.frameCount = 0;
  acc.elapsedSeconds = 0;
  acc.lastPublishedSample = null;
  acc.skipNextInterval = true;
}

/**
 * Accumulates `deltaSeconds` from `PlayerRig.useFrame` over a ~1-second window.
 * - Includes slow intervals `>= 250ms` when the tab is visible.
 * - Clears the window when the tab is hidden and skips the first interval across resume.
 */
export function stepR3fFrameWindowAccumulator(
  acc: R3fFrameWindowAccumulator,
  deltaSeconds: number,
  nowMs: number,
  isTabHidden: boolean = false
): R3fFrameRateSample | null {
  if (isTabHidden) {
    handleR3fVisibilityChange(acc);
    return null;
  }

  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0.0001) {
    return acc.lastPublishedSample;
  }

  if (acc.skipNextInterval) {
    acc.skipNextInterval = false;
    return acc.lastPublishedSample;
  }

  acc.frameCount += 1;
  acc.elapsedSeconds += deltaSeconds;

  if (acc.elapsedSeconds >= R3F_SAMPLE_WINDOW_SECONDS) {
    const fps = Math.min(360, Math.max(1, Math.round(acc.frameCount / acc.elapsedSeconds)));
    const frameTimeMs = Number(((acc.elapsedSeconds * 1000) / acc.frameCount).toFixed(1));
    const sample: R3fFrameRateSample = {
      fps,
      frameTimeMs,
      frameCount: acc.frameCount,
      windowDurationMs: Math.round(acc.elapsedSeconds * 1000),
      publishedAtMs: nowMs
    };
    acc.lastPublishedSample = sample;
    acc.frameCount = 0;
    acc.elapsedSeconds = 0;
    return sample;
  }

  return acc.lastPublishedSample;
}

export function publishHudR3fSample(sample: R3fFrameRateSample | null): void {
  publishedHudR3fSample = sample;
}

export function readHudR3fSample(
  nowMs: number = Date.now(),
  isTabHidden: boolean = false
): R3fFrameRateSample | null {
  if (isTabHidden || !publishedHudR3fSample) {
    return null;
  }
  if (nowMs - publishedHudR3fSample.publishedAtMs > R3F_SAMPLE_EXPIRY_MS) {
    return null;
  }
  return publishedHudR3fSample;
}

export function clearHudR3fSampleForTests(): void {
  publishedHudR3fSample = null;
}
