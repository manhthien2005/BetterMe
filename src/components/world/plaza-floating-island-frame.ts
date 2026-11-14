export function createIslandFrameState() {
  return { time: 0, captureElapsed: 0, next: 0 };
}

interface AnimatedIsland<T> {
  clock: { value: number };
  daylight: { value: number };
  effects: { setNight(night: boolean): void; update(height: number): void };
  waters: T[];
}

/** Shared animation time; capture budget is independent of reduced-motion animation. */
export function stepIslandEffects<T>(
  state: ReturnType<typeof createIslandFrameState>, islands: AnimatedIsland<T>[],
  delta: number, reducedMotion: boolean, hidden: boolean, pixelHeight: number,
  night: boolean, dusk: boolean,
): T | null {
  if (hidden) return null;
  const dt = Math.min(Math.max(delta, 0), .1);
  if (!reducedMotion) state.time += dt;
  const waters: T[] = [];
  for (const island of islands) {
    island.clock.value = state.time;
    island.daylight.value = night ? .14 : dusk ? .78 : 1;
    island.effects.setNight(night);
    island.effects.update(pixelHeight);
    waters.push(...island.waters);
  }
  state.captureElapsed += dt;
  if (state.captureElapsed < .1 || !waters.length) return null;
  state.captureElapsed = 0;
  state.next %= waters.length;
  return waters[state.next++];
}
