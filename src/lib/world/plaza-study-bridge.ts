import { STUDY_CONNECTORS, studyConnectorHeight } from "./plaza-study-terrain";
import type { Aabb2D, Vec3Tuple } from "./types";

export const SKY_BRIDGE = STUDY_CONNECTORS.find(c => c.id === "sky-bridge")!;
const dx = SKY_BRIDGE.to[0] - SKY_BRIDGE.from[0], dz = SKY_BRIDGE.to[1] - SKY_BRIDGE.from[1];
export const BRIDGE_LENGTH = Math.hypot(dx, dz);
export const BRIDGE_RAIL_OFFSET = SKY_BRIDGE.width / 2 + .22;
export const BRIDGE_POST_STATIONS = [0, .25, .5, .75, 1].map(t => t * BRIDGE_LENGTH);

export function skyBridgePoint(across: number, run: number, offsetY = 0): Vec3Tuple {
  return [SKY_BRIDGE.from[0] + (dx * run - dz * across) / BRIDGE_LENGTH,
    studyConnectorHeight(SKY_BRIDGE, run / BRIDGE_LENGTH) + offsetY,
    SKY_BRIDGE.from[1] + (dz * run + dx * across) / BRIDGE_LENGTH];
}

export function skyBridgeColliders(): Aabb2D[] {
  // Short strips keep the diagonal AABBs from inflating into the walking lanes.
  const count = Math.ceil(BRIDGE_LENGTH / .25);
  return [-1, 1].flatMap(side => Array.from({ length: count }, (_, i) => {
    const start = i === 0 ? -.24 : i * BRIDGE_LENGTH / count;
    const end = i === count - 1 ? BRIDGE_LENGTH + .24 : (i + 1) * BRIDGE_LENGTH / count;
    const corners = [start, end].flatMap(run => [-.22, .22].map(offset =>
      skyBridgePoint(side * BRIDGE_RAIL_OFFSET + offset, run)));
    return { id: `sky-bridge-edge-${side}-${i}`,
      minX: Math.min(...corners.map(p => p[0])), maxX: Math.max(...corners.map(p => p[0])),
      minZ: Math.min(...corners.map(p => p[2])), maxZ: Math.max(...corners.map(p => p[2])),
      minY: Math.min(...corners.map(p => p[1])) - 2.3,
      maxY: Math.max(...corners.map(p => p[1])) + 1.3, blockCamera: true };
  }));
}
