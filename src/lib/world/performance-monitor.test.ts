import { beforeEach, describe, expect, it } from "vitest";

import {
  clearHudR3fSampleForTests,
  createR3fFrameWindowAccumulator,
  handleR3fVisibilityChange,
  publishHudR3fSample,
  R3F_SAMPLE_EXPIRY_MS,
  readHudR3fSample,
  stepR3fFrameWindowAccumulator
} from "@/lib/world/performance-monitor";

describe("R3F frame-loop performance monitor (A2)", () => {
  beforeEach(() => {
    clearHudR3fSampleForTests();
  });

  it("returns null before the first ~1s window completes and computes FPS = count / totalSec and frameTimeMs = totalMs / count", () => {
    const acc = createR3fFrameWindowAccumulator();
    expect(readHudR3fSample(1_000, false)).toBeNull();

    // 59 frames of 1/60s (~0.9833s) -> window not yet complete
    for (let i = 0; i < 59; i += 1) {
      const sample = stepR3fFrameWindowAccumulator(acc, 1 / 60, 1_000 + i * 16.67, false);
      expect(sample).toBeNull();
    }

    // 60th frame reaches 1.000s -> publishes 60 FPS, 16.7 ms
    const published = stepR3fFrameWindowAccumulator(acc, 1 / 60, 2_000, false);
    expect(published).not.toBeNull();
    expect(published?.fps).toBe(60);
    expect(published?.frameTimeMs).toBeCloseTo(16.7, 1);
    expect(published?.frameCount).toBe(60);
    expect(published?.windowDurationMs).toBe(1000);
  });

  it("includes slow visible intervals >= 250ms in the measurement window instead of dropping them", () => {
    const acc = createR3fFrameWindowAccumulator();

    // 30 normal frames at 20ms (0.60s) + 2 visible stalls of 300ms each (0.60s) = 32 frames in 1.20s
    for (let i = 0; i < 30; i += 1) {
      expect(stepR3fFrameWindowAccumulator(acc, 0.02, 1_000 + i * 20, false)).toBeNull();
    }
    expect(stepR3fFrameWindowAccumulator(acc, 0.3, 1_900, false)).toBeNull();
    const published = stepR3fFrameWindowAccumulator(acc, 0.3, 2_200, false);

    expect(published).not.toBeNull();
    // 32 frames / 1.2s = 26.67 -> 27 FPS, 1200ms / 32 = 37.5 ms
    expect(published?.frameCount).toBe(32);
    expect(published?.fps).toBe(27);
    expect(published?.frameTimeMs).toBeCloseTo(37.5, 1);
  });

  it("clears the active window when the tab is hidden and skips the first interval across tab resume", () => {
    const acc = createR3fFrameWindowAccumulator();

    // Publish an initial valid sample
    for (let i = 0; i < 50; i += 1) {
      stepR3fFrameWindowAccumulator(acc, 0.02, 1_000 + i * 20, false);
    }
    expect(acc.lastPublishedSample?.fps).toBe(50);

    // Accumulate 0.5s of partial window, then hide tab
    for (let i = 0; i < 25; i += 1) {
      stepR3fFrameWindowAccumulator(acc, 0.02, 2_000 + i * 20, false);
    }
    expect(acc.frameCount).toBe(25);

    handleR3fVisibilityChange(acc);
    expect(acc.frameCount).toBe(0);
    expect(acc.elapsedSeconds).toBe(0);
    expect(acc.lastPublishedSample).toBeNull();
    expect(acc.skipNextInterval).toBe(true);

    // First useFrame after tab resume carries a 5.0-second background gap -> must be skipped!
    const afterResumeFirstTick = stepR3fFrameWindowAccumulator(acc, 5.0, 7_500, false);
    expect(afterResumeFirstTick).toBeNull();
    expect(acc.frameCount).toBe(0);
    expect(acc.elapsedSeconds).toBe(0);
    expect(acc.skipNextInterval).toBe(false);

    // Subsequent visible frames accumulate normally into a clean 1s window
    for (let i = 0; i < 50; i += 1) {
      stepR3fFrameWindowAccumulator(acc, 0.02, 7_520 + i * 20, false);
    }
    expect(acc.lastPublishedSample?.fps).toBe(50);
    expect(acc.lastPublishedSample?.frameTimeMs).toBeCloseTo(20.0, 1);
  });

  it("expires published HUD samples when older than R3F_SAMPLE_EXPIRY_MS or when tab is hidden", () => {
    const acc = createR3fFrameWindowAccumulator();
    for (let i = 0; i < 50; i += 1) {
      stepR3fFrameWindowAccumulator(acc, 0.02, 10_000 + i * 20, false);
    }
    publishHudR3fSample(acc.lastPublishedSample);

    const publishedAt = acc.lastPublishedSample!.publishedAtMs;
    expect(readHudR3fSample(publishedAt + 500, false)?.fps).toBe(50);
    expect(readHudR3fSample(publishedAt + 500, true)).toBeNull();
    expect(readHudR3fSample(publishedAt + R3F_SAMPLE_EXPIRY_MS + 10, false)).toBeNull();
  });
});
