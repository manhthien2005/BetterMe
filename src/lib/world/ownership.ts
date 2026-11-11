import type {
  AuthenticatedWorldUser,
  PersonalWorldOwnerState,
  UpgradeableObjectState,
  UpgradeableSlotId,
  WorldAccessPermissions,
  WorldAccessRole,
  WorldPropDefinition
} from "@/lib/world/types";

const ALL_UPGRADEABLE_SLOTS: readonly {
  readonly slotId: UpgradeableSlotId;
  readonly maxTier: number;
}[] = [
  { slotId: "home.cottage", maxTier: 3 },
  { slotId: "home.mailbox", maxTier: 2 },
  { slotId: "garden.gazebo", maxTier: 3 },
  { slotId: "garden.pond", maxTier: 2 },
  { slotId: "garden.planters", maxTier: 3 },
  { slotId: "library.bookshelves", maxTier: 3 },
  { slotId: "library.desk", maxTier: 3 }
];

/**
 * Computes role and permissions for a Personal World from a server-verified
 * viewer identity and the target world's owner identity. Visitors may explore
 * and talk to NPCs, but may never edit or upgrade the owner's property.
 */
export function resolvePersonalWorldAccess(
  viewer: AuthenticatedWorldUser,
  ownerUserId: string
): { role: WorldAccessRole; permissions: WorldAccessPermissions } {
  if (!viewer.userId.trim() || !ownerUserId.trim()) {
    throw new Error("World ownership requires a verified non-empty userId.");
  }

  const isOwner = viewer.userId === ownerUserId;
  const role: WorldAccessRole = isOwner ? "owner" : "visitor";

  return {
    role,
    permissions: {
      canEnter: true,
      canInteractNpc: true,
      canEditProperty: isOwner,
      canUpgradeObjects: isOwner
    }
  };
}

/**
 * Creates the per-user Personal World state model separated from the reusable
 * visual map template (`PERSONAL_WORLD_MAP_CONFIG`).
 */
export function createPersonalWorldOwnerState(
  owner: AuthenticatedWorldUser,
  viewer: AuthenticatedWorldUser = owner
): PersonalWorldOwnerState {
  const { role, permissions } = resolvePersonalWorldAccess(viewer, owner.userId);
  const upgrades = {} as Record<UpgradeableSlotId, UpgradeableObjectState>;

  for (const item of ALL_UPGRADEABLE_SLOTS) {
    upgrades[item.slotId] = {
      slotId: item.slotId,
      tier: 1,
      maxTier: item.maxTier,
      unlockedByProgress: true
    };
  }

  return {
    schemaVersion: 1,
    ownerUserId: owner.userId,
    ownerEmail: owner.email,
    viewerUserId: viewer.userId,
    accessRole: role,
    permissions,
    upgrades
  };
}

/**
 * Resolves the concrete asset slot key for a prop in a Personal World based on
 * the owner's upgrade tier. Falls back to `prop.assetSlot` for non-upgradeable
 * or public props.
 */
export function resolvePropAssetSlot(
  prop: WorldPropDefinition,
  ownerState: PersonalWorldOwnerState | null
): string {
  if (!prop.upgradeSlot || !ownerState) {
    return prop.assetSlot;
  }

  const slotState = ownerState.upgrades[prop.upgradeSlot.slotId];
  if (!slotState) {
    return prop.assetSlot;
  }

  const index = Math.max(
    0,
    Math.min(prop.upgradeSlot.tierAssetSlots.length - 1, slotState.tier - 1)
  );

  return prop.upgradeSlot.tierAssetSlots[index] ?? prop.assetSlot;
}
