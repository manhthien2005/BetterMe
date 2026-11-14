import { STUDY_CONNECTORS } from "./plaza-study-terrain";
import type { Aabb2D } from "./types";

export const ACADEMY_STAIR = STUDY_CONNECTORS.find(c => c.id === "academy-stair")!;
export const STAIR_POST_STATIONS = [0, 2.5, 5, 7, 9.5, 12] as const;
export const STAIR_RAIL_OFFSET = 3.77;

/** Continuous architectural slope; footsteps still use studyConnectorHeight. */
export function academyStairRise(run: number) {
  const s = Math.max(0, Math.min(12, run));
  return s <= 5 ? s * .4 : s <= 7 ? 2 : 2 + (s - 7) * .4;
}

export function academyStairColliders(): Aabb2D[] {
  return [-1, 1].flatMap(side => Array.from({ length: 26 }, (_, i) => {
    const start = i === 24 ? -.32 : i === 25 ? 12 : i * .5;
    const end = i === 24 ? 0 : i === 25 ? 12.32 : start + .5;
    const x = ACADEMY_STAIR.from[0] + side * STAIR_RAIL_OFFSET;
    return {
      id: `academy-stair-edge-${side}-${i}`,
      minX: x - .27, maxX: x + .27,
      minZ: ACADEMY_STAIR.from[1] - end, maxZ: ACADEMY_STAIR.from[1] - start,
      minY: -.35, maxY: academyStairRise(end) + 1.3,
      blockCamera: true
    };
  }));
}
