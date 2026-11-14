import { STUDY_COLONNADES, studyColonnadePosts } from "./plaza-study-architecture";
import { studyGroundHeight } from "./plaza-study-terrain";
import type { Aabb2D } from "./types";

export const READING_CLOISTERS = STUDY_COLONNADES.filter(c => c.id === "west-cloister" || c.id === "north-cloister");
export const CLOISTER_FOOT = .74;
export function cloisterFootWidth(c: typeof READING_CLOISTERS[number], p: { x: number; z: number }) {
  // Keep the original narrow foot beside the curved garden-ramp approach.
  return c.id === "west-cloister" && p.x < c.x && p.z > c.z ? .6 : CLOISTER_FOOT;
}

export function readingCloisterColliders(): Aabb2D[] {
  return READING_CLOISTERS.flatMap(c => {
    const floor = studyGroundHeight(c.x, c.z)!;
    const result: Aabb2D[] = [];
    for (const [i, { x, z }] of studyColonnadePosts(c).entries()) {
      const foot = cloisterFootWidth(c, { x, z });
      result.push({ id: `${c.id}-post-${i}`, minX: x - foot / 2, maxX: x + foot / 2,
        minZ: z - foot / 2, maxZ: z + foot / 2, minY: floor, maxY: floor + .5, blockCamera: true },
      { id: `${c.id}-shaft-${i}`, minX: x - .18, maxX: x + .18, minZ: z - .18, maxZ: z + .18,
        minY: floor + .46, maxY: floor + c.height, blockCamera: true },
      { id: `${c.id}-bracket-${i}`, minX: x - .85, maxX: x + .85, minZ: z - .85, maxZ: z + .85,
        minY: floor + c.height - 1.18, maxY: floor + c.height + .65, cameraOnly: true, blockCamera: true });
    }
    result.push({ id: `${c.id}-roof`, minX: c.x - c.width / 2 - 1.02, maxX: c.x + c.width / 2 + 1.02,
      minZ: c.z - c.depth / 2 - 1.02, maxZ: c.z + c.depth / 2 + 1.02,
      minY: floor + c.height - .38, maxY: floor + c.height + 1.75, cameraOnly: true, blockCamera: true });
    return result;
  });
}
