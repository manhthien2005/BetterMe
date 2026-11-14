import { Group } from "three";
import { describe, expect, it, vi } from "vitest";
import { createIslandFrameState, stepIslandEffects } from "./plaza-floating-island-frame";

function island() {
  return { root: new Group(), clock: { value: 0 }, daylight: { value: 1 },
    effects: { setNight: vi.fn(), update: vi.fn() }, waters: ["water-a", "water-b"] };
}

describe("Plaza island shared frame", () => {
  it("uses one bounded clock for late islands, and freezes on reduced motion or hidden tabs", () => {
    const state = createIslandFrameState(), a = island(), b = island();
    stepIslandEffects(state, [a], 3, false, false, 800, false, false);
    expect(a.clock.value).toBe(.1);
    stepIslandEffects(state, [a, b], .02, false, false, 800, false, false);
    expect(b.clock.value).toBe(a.clock.value);
    const time = a.clock.value;
    stepIslandEffects(state, [a, b], .03, true, false, 800, true, false);
    expect(a.clock.value).toBe(time);
    expect(a.daylight.value).toBe(.14);
    expect(a.effects.setNight).toHaveBeenLastCalledWith(true);
    stepIslandEffects(state, [a, b], .03, false, true, 800, false, false);
    expect(a.clock.value).toBe(time);
    expect(a.effects.setNight).toHaveBeenLastCalledWith(true);
  });

  it("budgets one capture per interval and fairly cycles through all water levels", () => {
    const state = createIslandFrameState(), a = island();
    expect(stepIslandEffects(state, [a], .01, false, false, 800, false, false)).toBeNull();
    expect(stepIslandEffects(state, [a], .1, false, false, 800, false, false)).toBe("water-a");
    expect(stepIslandEffects(state, [a], .02, false, false, 800, false, false)).toBeNull();
    expect(stepIslandEffects(state, [a], .1, false, false, 800, false, false)).toBe("water-b");
    expect(stepIslandEffects(state, [], .1, false, false, 800, false, false)).toBeNull();
  });
});
