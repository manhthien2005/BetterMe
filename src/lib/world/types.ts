export type WorldSpaceId = "public_plaza" | "personal_world";

export type ZoneId =
  | "plaza"
  | "personal_home"
  | "personal_garden"
  | "personal_library";

export type Vec3Tuple = readonly [number, number, number];
/** A single walkable surface per XZ position; null marks the safe outer boundary. */
export type GroundHeightSampler = (x: number, z: number) => number | null;

export type Aabb2D = {
  readonly id: string;
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
  /** Optional lower vertical bound (defaults to 0) for overhead arch/lintel camera blockers. */
  readonly minY?: number;
  /** Optional upper vertical bound used by the camera occlusion solver to avoid clipping through tall walls/roofs. */
  readonly maxY?: number;
  /** When true, only the 3D camera ray collides with this box (player ground movement passes underneath). */
  readonly cameraOnly?: boolean;
  /** When true, forces the camera occlusion solver to test this box even if its XZ footprint is narrower than 3.2m. */
  readonly blockCamera?: boolean;
};

export type ZoneDefinition = {
  readonly id: ZoneId;
  readonly spaceId: WorldSpaceId;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly groundColor: string;
  readonly accentColor: string;
  readonly patchCenter: Vec3Tuple;
  readonly patchSize: readonly [number, number];
  /** Priority-ordered region used to resolve which zone the player is standing in. */
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
};

export type PropArchetype =
  | "fountain"
  | "signpost"
  | "bench"
  | "wall"
  | "bookshelf"
  | "pillar"
  | "desk"
  | "table"
  | "tree"
  | "planter"
  | "pond"
  | "gazebo"
  | "cottage"
  | "arch-pillar"
  | "arch-beam"
  | "mailbox";

export type UpgradeableSlotId =
  | "home.cottage"
  | "home.mailbox"
  | "garden.gazebo"
  | "garden.pond"
  | "garden.planters"
  | "library.bookshelves"
  | "library.desk";

export type UpgradeableSlotMetadata = {
  readonly slotId: UpgradeableSlotId;
  readonly maxTier: number;
  readonly tierAssetSlots: readonly string[];
};

export type WorldPropDefinition = {
  readonly id: string;
  readonly zoneId: ZoneId;
  readonly archetype: PropArchetype;
  /**
   * Configurable asset slot key. Graybox primitives render when no GLB
   * registry entry is bound, allowing art replacement without changing layout
   * or collision coordinates.
   */
  readonly assetSlot: string;
  /** Optional metadata linking a personal-world prop to an upgradeable progression slot. */
  readonly upgradeSlot?: UpgradeableSlotMetadata;
  readonly position: Vec3Tuple;
  readonly size: Vec3Tuple;
  readonly rotationY?: number;
  readonly color: string;
  readonly secondaryColor?: string;
  readonly collider?: Omit<Aabb2D, "id">;
};

export type NpcDefinition = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly zoneId: ZoneId;
  readonly assetSlot: string;
  readonly position: Vec3Tuple;
  readonly rotationY: number;
  readonly robeColor: string;
  readonly accentColor: string;
  readonly interactionRadius: number;
  readonly dialogue: readonly string[];
  readonly collider: Omit<Aabb2D, "id">;
};

export type WorldPortalDefinition = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly actionLabel: string;
  readonly targetSpaceId: WorldSpaceId;
  readonly position: Vec3Tuple;
  readonly rotationY: number;
  readonly interactionRadius: number;
  readonly accentColor: string;
  readonly leftPillarCollider: Omit<Aabb2D, "id">;
  readonly rightPillarCollider: Omit<Aabb2D, "id">;
};

export type CameraOrbitConfig = {
  readonly defaultYaw: number;
  readonly defaultPitch: number;
  readonly defaultDistance: number;
  readonly minPitch: number;
  readonly maxPitch: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly lookAtHeight: number;
  readonly smoothing: number;
  readonly rotateSensitivity: number;
  readonly zoomStep: number;
  readonly fov: number;
};

export type PlayerMovementConfig = {
  readonly walkSpeed: number;
  readonly runSpeed: number;
  readonly jumpSpeed: number;
  readonly gravity: number;
  readonly radius: number;
  readonly turnSmoothing: number;
};

export type WorldMapConfig = {
  readonly groundHeight?: GroundHeightSampler;
  /** Temporary, opt-in layout study; the default Plaza keeps its accepted scenery. */
  readonly plazaStudy?: boolean;
  readonly id: string;
  readonly spaceId: WorldSpaceId;
  readonly title: string;
  readonly subtitle: string;
  readonly isPersonalSpace: boolean;
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
  readonly spawn: {
    readonly position: Vec3Tuple;
    readonly yaw: number;
  };
  readonly camera: CameraOrbitConfig;
  readonly player: PlayerMovementConfig;
  readonly zones: readonly ZoneDefinition[];
  readonly walkways: readonly {
    readonly id: string;
    readonly position: Vec3Tuple;
    readonly size: readonly [number, number];
    readonly color: string;
  }[];
  readonly portals: readonly WorldPortalDefinition[];
  readonly props: readonly WorldPropDefinition[];
  readonly npcs: readonly NpcDefinition[];
};

export type MovementInput = {
  readonly forward: boolean;
  readonly backward: boolean;
  readonly left: boolean;
  readonly right: boolean;
  readonly sprint: boolean;
  readonly jump: boolean;
};

export type PlayerKinematicState = {
  x: number;
  y: number;
  z: number;
  velocityY: number;
  yaw: number;
  speed: number;
  isMoving: boolean;
  isRunning: boolean;
  isGrounded: boolean;
};

export type DialogueSession = {
  readonly npcId: string;
  readonly lineIndex: number;
};

export type AuthenticatedWorldUser = {
  readonly userId: string;
  readonly email: string;
};

export type WorldAccessRole = "owner" | "visitor";

export type WorldAccessPermissions = {
  readonly canEnter: boolean;
  readonly canInteractNpc: boolean;
  readonly canEditProperty: boolean;
  readonly canUpgradeObjects: boolean;
};

export type UpgradeableObjectState = {
  readonly slotId: UpgradeableSlotId;
  readonly tier: number;
  readonly maxTier: number;
  readonly unlockedByProgress: boolean;
};

export type PersonalWorldOwnerState = {
  readonly schemaVersion: 1;
  readonly ownerUserId: string;
  readonly ownerEmail: string;
  readonly viewerUserId: string;
  readonly accessRole: WorldAccessRole;
  readonly permissions: WorldAccessPermissions;
  readonly upgrades: Readonly<Record<UpgradeableSlotId, UpgradeableObjectState>>;
};
