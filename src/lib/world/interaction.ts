import type {
  DialogueSession,
  NpcDefinition,
  WorldPortalDefinition,
  ZoneDefinition
} from "@/lib/world/types";

/** Resolves which zone owns `(x, z)`, falling back to the last zone in the space. */
export function getZoneAtPosition(
  x: number,
  z: number,
  zones: readonly ZoneDefinition[]
): ZoneDefinition {
  for (const zone of zones) {
    if (
      x >= zone.bounds.minX &&
      x <= zone.bounds.maxX &&
      z >= zone.bounds.minZ &&
      z <= zone.bounds.maxZ
    ) {
      return zone;
    }
  }

  return zones[zones.length - 1];
}

/** Finds the closest NPC whose interaction radius contains `(x, z)`. */
export function findNearestInteractableNpc(
  x: number,
  z: number,
  npcs: readonly NpcDefinition[]
): NpcDefinition | null {
  let bestNpc: NpcDefinition | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const npc of npcs) {
    const dx = x - npc.position[0];
    const dz = z - npc.position[2];
    const distSq = dx * dx + dz * dz;
    const radiusSq = npc.interactionRadius * npc.interactionRadius;

    if (distSq <= radiusSq && distSq < bestDistSq) {
      bestDistSq = distSq;
      bestNpc = npc;
    }
  }

  return bestNpc;
}

/** Finds the closest travel portal whose interaction radius contains `(x, z)`. */
export function findNearestInteractablePortal(
  x: number,
  z: number,
  portals: readonly WorldPortalDefinition[]
): WorldPortalDefinition | null {
  let bestPortal: WorldPortalDefinition | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const portal of portals) {
    const dx = x - portal.position[0];
    const dz = z - portal.position[2];
    const distSq = dx * dx + dz * dz;
    const radiusSq = portal.interactionRadius * portal.interactionRadius;

    if (distSq <= radiusSq && distSq < bestDistSq) {
      bestDistSq = distSq;
      bestPortal = portal;
    }
  }

  return bestPortal;
}

/**
 * Handles pressing `E` for NPC dialogue:
 * - Opens line 0 when near an NPC with no active dialogue.
 * - Advances to the next line if already talking to an NPC.
 * - Closes the panel after the final line.
 */
export function stepDialogueInteraction(
  current: DialogueSession | null,
  nearbyNpc: NpcDefinition | null,
  allNpcs: readonly NpcDefinition[]
): DialogueSession | null {
  if (!current) {
    if (!nearbyNpc || nearbyNpc.dialogue.length === 0) {
      return null;
    }

    return { npcId: nearbyNpc.id, lineIndex: 0 };
  }

  const activeNpc = allNpcs.find((npc) => npc.id === current.npcId);

  if (!activeNpc) {
    return null;
  }

  const nextIndex = current.lineIndex + 1;

  if (nextIndex >= activeNpc.dialogue.length) {
    return null;
  }

  return { npcId: activeNpc.id, lineIndex: nextIndex };
}

/** Auto-closes an open dialogue if the player walks well past interaction range. */
export function isDialogueStillInRange(
  session: DialogueSession | null,
  playerX: number,
  playerZ: number,
  allNpcs: readonly NpcDefinition[]
): boolean {
  if (!session) return false;

  const npc = allNpcs.find((item) => item.id === session.npcId);

  if (!npc) return false;

  const dx = playerX - npc.position[0];
  const dz = playerZ - npc.position[2];
  const maxKeepOpenRadius = npc.interactionRadius * 1.35;

  return dx * dx + dz * dz <= maxKeepOpenRadius * maxKeepOpenRadius;
}

/**
 * Computes the horizontal yaw angle in radians so an actor at `(fromX, fromZ)`
 * faces `(toX, toZ)` (where yaw `0` faces `+Z`).
 */
export function computeYawTowardPoint(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number
): number {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) {
    return 0;
  }

  return Math.atan2(dx, dz);
}
