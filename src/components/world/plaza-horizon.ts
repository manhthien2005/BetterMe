import { BufferAttribute, BufferGeometry } from "three";

export const PLAZA_VIEW_FAR = 1500;
export const PLAZA_SKY_SCALE = 11;
export const PLAZA_REFLECTION_FAR = 3000;

const polar = (degrees: number, radius: number, y: number): [number, number, number] => {
  const angle = degrees * Math.PI / 180;
  return [Math.sin(angle) * radius, y, -Math.cos(angle) * radius];
};

export const DISTANT_ISLANDS = [
  [-158, 570, 54, 15], [-116, 430, 26, 12], [-79, 640, 72, 19],
  [-53, 370, 38, 10], [-30, 580, 64, 17], [-12, 690, 100, 15],
  [16, 410, 52, 13], [39, 610, 34, 21], [72, 490, 90, 14],
  [106, 670, 48, 18], [139, 380, 32, 11], [172, 610, 80, 16]
].map(([angle, radius, height, width], i) => ({
  position: polar(angle, radius, height), width,
  depth: width * (0.55 + (i % 3) * 0.12),
  height: width * (0.7 + (i % 4) * 0.17),
  yaw: i * 2.399, seed: i * 1.71 + 0.6
}));

/** Fluted rock shelves and a raised meadow, sized for distant scenery. */
export function createDistantIslandGeometry(seed: number): BufferGeometry {
  const segments = 36;
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const rings = [[.96, 0], [1, -.05], [.98, -.1], [.82, -.17], [.87, -.24],
    [.76, -.34], [.78, -.43], [.62, -.55], [.65, -.65], [.42, -.77], [.46, -.86], [.2, -1.02]];
  for (let ring = 0; ring < rings.length; ring++) {
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const ripple = 1 + Math.sin(angle * 3 + seed) * .1 + Math.cos(angle * 5 - seed) * .06;
      const fluting = Math.sin(angle * 11 + seed + ring * .13);
      const radius = rings[ring][0] * (ripple + fluting * .045);
      positions.push(Math.cos(angle) * radius + ring * .012, rings[ring][1] + Math.sin(angle * 4 + seed) * .025, Math.sin(angle) * radius);
      const shade = fluting * .025 + Math.cos(angle * 5 - seed) * .025 + (ring % 3 === 1 ? .04 : 0) - ring * .006;
      colors.push(.22 + shade, .27 + shade, .29 + shade);
      if (ring < rings.length - 1) {
        const a = ring * segments + i, b = ring * segments + (i + 1) % segments;
        indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    }
  }
  const capStart = positions.length / 3;
  const capRings = 5;
  for (let ring = 0; ring < capRings; ring++) {
    const radius = 1 - ring / capRings;
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      positions.push(positions[i * 3] * radius,
        positions[i * 3 + 1] * radius + (1 - radius) * (.17 + .035 * Math.sin(angle * 3 + seed)),
        positions[i * 3 + 2] * radius);
      const shade = Math.sin(angle * 5 + seed) * .025 + ring * .008;
      colors.push(.12 + shade, .3 + shade, .13 + shade);
      if (ring < capRings - 1) {
        const a = capStart + ring * segments + i, b = capStart + ring * segments + (i + 1) % segments;
        indices.push(a, a + segments, b, b, a + segments, b + segments);
      }
    }
  }
  const center = positions.length / 3;
  positions.push(0, .17, 0);
  colors.push(.16, .34, .17);
  const bottom = positions.length / 3;
  positions.push(0.1, -1.12, 0);
  colors.push(.13, .18, .2);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const lastCap = capStart + (capRings - 1) * segments;
    indices.push(center, lastCap + next, lastCap + i);
    indices.push(bottom, (rings.length - 1) * segments + i, (rings.length - 1) * segments + next);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
