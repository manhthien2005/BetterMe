import { STUDY_PAVILIONS } from "./plaza-study-layout";
import { studyGroundHeight } from "./plaza-study-terrain";
import type { Aabb2D } from "./types";

export const READING_PAVILION = STUDY_PAVILIONS[0];
export const READING_PAVILION_FOOT = .98;
export const READING_PAVILION_COLUMNS = [-1, 1].flatMap(sx => [-1, 1].map(sz => ({
  sx, sz, x: READING_PAVILION.x + sx * READING_PAVILION.width * .38,
  z: READING_PAVILION.z + sz * READING_PAVILION.depth * .38
})));

export function readingPavilionColliders(): Aabb2D[] {
  const p = READING_PAVILION, floor = studyGroundHeight(p.x, p.z)!;
  const colliders: Aabb2D[] = [];
  for (const { x, z, sx, sz } of READING_PAVILION_COLUMNS) {
    colliders.push({
      id: `${p.id}-${sx}-${sz}`, minX: x - READING_PAVILION_FOOT / 2,
      maxX: x + READING_PAVILION_FOOT / 2, minZ: z - READING_PAVILION_FOOT / 2,
      maxZ: z + READING_PAVILION_FOOT / 2, minY: floor, maxY: floor + .68, blockCamera: true
    }, {
      id: `${p.id}-shaft-${sx}-${sz}`, minX: x - .3, maxX: x + .3,
      minZ: z - .3, maxZ: z + .3, minY: floor + .6, maxY: floor + p.height, blockCamera: true
    }, {
      id: `${p.id}-joinery-${sx}-${sz}`, minX: x - 1.5, maxX: x + 1.5,
      minZ: z - 1.5, maxZ: z + 1.5, minY: floor + p.height - 1.9,
      maxY: floor + p.height + .4, cameraOnly: true, blockCamera: true
    });
  }
  colliders.push({
    id: `${p.id}-roof`, minX: p.x - p.width * .65 - .06, maxX: p.x + p.width * .65 + .06,
    minZ: p.z - p.depth * .65 - .06, maxZ: p.z + p.depth * .65 + .06,
    minY: floor + p.height - .72, maxY: floor + p.height + 4.1,
    cameraOnly: true, blockCamera: true
  });
  return colliders;
}
