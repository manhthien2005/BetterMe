import type { Aabb2D, CameraOrbitConfig, PlayerMovementConfig, WorldMapConfig, WorldSpaceId } from "@/lib/world/types";
import { PLAZA_LANDSCAPE_COLLIDERS } from "@/lib/world/plaza-landscape-layout";
import { PLAZA_NATURE_COLLIDERS, PLAZA_PAVILION_COLLIDERS } from "./plaza-nature-layout";

export const DEFAULT_CAMERA_ORBIT_CONFIG: CameraOrbitConfig = {
  defaultYaw: 0,
  defaultPitch: 0.62,
  defaultDistance: 16.5,
  minPitch: 0.16,
  maxPitch: 1.32,
  minDistance: 6.5,
  maxDistance: 26.0,
  lookAtHeight: 0.95,
  smoothing: 10,
  rotateSensitivity: 0.0055,
  zoomStep: 1.4,
  fov: 46
};

export const PUBLIC_PLAZA_CAMERA_ORBIT_CONFIG: CameraOrbitConfig = {
  defaultYaw: 0,
  defaultPitch: 0.25,
  defaultDistance: 11.8,
  minPitch: (-55 * Math.PI) / 180,
  maxPitch: 1.18,
  minDistance: 4.8,
  maxDistance: 20.5,
  lookAtHeight: 1.25,
  smoothing: 10,
  rotateSensitivity: 0.0055,
  zoomStep: 1.3,
  fov: 46
};

export const DEFAULT_PLAYER_MOVEMENT_CONFIG: PlayerMovementConfig = {
  walkSpeed: 2.2,
  runSpeed: 4.0,
  jumpSpeed: 7.4,
  gravity: 20.0,
  radius: 0.45,
  turnSmoothing: 14
};

/**
 * Shared Public Plaza template.
 * Contains player spawn, public guide NPCs, and the travel portal to the
 * authenticated user's Personal World.
 */
export const PUBLIC_PLAZA_MAP_CONFIG: WorldMapConfig = {
  id: "reading-quest-public-plaza-v0.2",
  spaceId: "public_plaza",
  title: "Quảng trường Học viện Chung",
  subtitle: "Public Plaza · Điểm tập trung & Cổng Không gian Cá nhân",
  isPersonalSpace: false,
  bounds: {
    minX: -28,
    maxX: 28,
    minZ: -24,
    maxZ: 24
  },
  spawn: {
    position: [0, 0, 5.8],
    yaw: 0.25
  },
  camera: PUBLIC_PLAZA_CAMERA_ORBIT_CONFIG,
  player: DEFAULT_PLAYER_MOVEMENT_CONFIG,
  zones: [
    {
      id: "plaza",
      spaceId: "public_plaza",
      title: "Quảng trường Chung",
      subtitle: "Public Plaza · Sảnh Học viện",
      description: "Không gian chung nơi học viên gặp gỡ NPC và bước qua cổng về Không gian Cá nhân.",
      groundColor: "#F2E5CE",
      accentColor: "#D97706",
      patchCenter: [0, 0.02, 0],
      patchSize: [20, 22],
      bounds: { minX: -28.5, maxX: 28.5, minZ: -24.5, maxZ: 24.5 }
    }
  ],
  walkways: [
    { id: "plaza-walkway-north", position: [0, 0.025, -5.5], size: [4.2, 9], color: "#E7D7BE" },
    { id: "plaza-walkway-south", position: [0, 0.025, 6.2], size: [5.2, 8], color: "#E7D7BE" }
  ],
  portals: [
    {
      id: "portal-to-personal-world",
      title: "Cổng Không Gian Cá Nhân",
      subtitle: "Dịch chuyển tới Nhà riêng, Vườn riêng & Thư viện riêng của bạn",
      actionLabel: "Vào Không gian Cá nhân (E)",
      targetSpaceId: "personal_world",
      position: [0, 0, -9.8],
      rotationY: 0,
      interactionRadius: 3.4,
      accentColor: "#7C3AED",
      leftPillarCollider: { minX: -2.3, maxX: -1.3, minZ: -10.3, maxZ: -9.3, maxY: 3.8 },
      rightPillarCollider: { minX: 1.3, maxX: 2.3, minZ: -10.3, maxZ: -9.3, maxY: 3.8 }
    }
  ],
  props: [
    {
      id: "plaza-fountain",
      zoneId: "plaza",
      archetype: "fountain",
      assetSlot: "prop.plaza.fountain",
      position: [0, 0, 0],
      size: [3.4, 2.1, 3.4],
      color: "#D6C7B2",
      secondaryColor: "#7BB6D9",
      collider: { minX: -1.75, maxX: 1.75, minZ: -1.75, maxZ: 1.75, maxY: 2.1 }
    },
    {
      id: "plaza-signpost",
      zoneId: "plaza",
      archetype: "signpost",
      assetSlot: "prop.plaza.signpost",
      position: [5.0, 0, 3.2],
      size: [0.9, 2.2, 0.9],
      color: "#8C5A2B",
      secondaryColor: "#F6E7CB",
      collider: { minX: 4.55, maxX: 5.45, minZ: 2.75, maxZ: 3.65, maxY: 2.2 }
    },
    {
      id: "plaza-bench-east",
      zoneId: "plaza",
      archetype: "bench",
      assetSlot: "prop.plaza.bench",
      position: [6.2, 0, 8.2],
      size: [2.2, 0.8, 0.9],
      color: "#9A6634",
      secondaryColor: "#5C4033",
      collider: { minX: 5.1, maxX: 7.3, minZ: 7.7, maxZ: 8.7, maxY: 0.9 }
    },
    {
      id: "plaza-bench-west",
      zoneId: "plaza",
      archetype: "bench",
      assetSlot: "prop.plaza.bench",
      position: [-6.2, 0, 8.2],
      size: [2.2, 0.8, 0.9],
      color: "#9A6634",
      secondaryColor: "#5C4033",
      collider: { minX: -7.3, maxX: -5.1, minZ: 7.7, maxZ: 8.7, maxY: 0.9 }
    },
    {
      id: "plaza-pillar-nw",
      zoneId: "plaza",
      archetype: "pillar",
      assetSlot: "structure.plaza.pillar",
      position: [-6.2, 0, -5.8],
      size: [1.1, 3.6, 1.1],
      color: "#E2D3BA",
      secondaryColor: "#B45309",
      collider: { minX: -6.8, maxX: -5.6, minZ: -6.4, maxZ: -5.2, maxY: 3.6 }
    },
    {
      id: "plaza-pillar-ne",
      zoneId: "plaza",
      archetype: "pillar",
      assetSlot: "structure.plaza.pillar",
      position: [6.2, 0, -5.8],
      size: [1.1, 3.6, 1.1],
      color: "#E2D3BA",
      secondaryColor: "#B45309",
      collider: { minX: 5.6, maxX: 6.8, minZ: -6.4, maxZ: -5.2, maxY: 3.6 }
    },
    {
      id: "plaza-tree-east",
      zoneId: "plaza",
      archetype: "tree",
      assetSlot: "prop.plaza.tree",
      position: [11.5, 0, 0.5],
      size: [2.5, 4.0, 2.5],
      color: "#5A994E",
      secondaryColor: "#785032",
      collider: { minX: 10.85, maxX: 12.15, minZ: -0.15, maxZ: 1.15, maxY: 4.0 }
    },
    {
      id: "plaza-tree-west",
      zoneId: "plaza",
      archetype: "tree",
      assetSlot: "prop.plaza.tree",
      position: [-11.5, 0, 0.5],
      size: [2.5, 4.0, 2.5],
      color: "#6BB05C",
      secondaryColor: "#785032",
      collider: { minX: -12.15, maxX: -10.85, minZ: -0.15, maxZ: 1.15, maxY: 4.0 }
    }
  ],
  npcs: [
    {
      id: "npc-guide-an",
      name: "Học giả An",
      role: "Người dẫn đường Quảng trường",
      zoneId: "plaza",
      assetSlot: "character.npc.guide_an",
      position: [-4.4, 0, 3.2],
      rotationY: 0.6,
      robeColor: "#2F7A54",
      accentColor: "#FBBF24",
      interactionRadius: 3.0,
      collider: { minX: -4.95, maxX: -3.85, minZ: 2.65, maxZ: 3.75, maxY: 1.9 },
      dialogue: [
        "Chào mừng bạn đến Quảng trường Chung của Học viện Reading Quest!",
        "Bạn có thể giữ chuột phải để xoay góc nhìn 360 độ, lăn chuột để thu phóng, bấm R để đặt lại camera và bấm Space để nhảy.",
        "Đi về hướng Bắc qua Cổng Không Gian Cá Nhân để bước vào khu đất riêng gồm Nhà riêng, Vườn riêng và Thư viện riêng của bạn nhé!"
      ]
    },
    {
      id: "npc-steward-khoa",
      name: "Quản sự Khoa",
      role: "Người gác Cổng Không gian Cá nhân",
      zoneId: "plaza",
      assetSlot: "character.npc.steward_khoa",
      position: [4.8, 0, -7.8],
      rotationY: -0.5,
      robeColor: "#5B4B8A",
      accentColor: "#F59E0B",
      interactionRadius: 3.0,
      collider: { minX: 4.25, maxX: 5.35, minZ: -8.35, maxZ: -7.25, maxY: 1.9 },
      dialogue: [
        "Cổng dịch chuyển phía trước dẫn thẳng tới Không gian Cá nhân gắn với tài khoản của riêng bạn.",
        "Tại đó bạn sở hữu đủ ba khu vực: Nhà riêng ấm cúng, Khu vườn xanh mát và Thư viện đọc sách.",
        "Hãy đứng gần cổng và bấm phím E để dịch chuyển ngay nhé!"
      ]
    }
  ]
};

/**
 * Reusable Personal World template.
 * Contains the owner's Personal Home, Personal Garden, and Personal Library,
 * plus upgradeSlot bindings so per-user progression can swap visual tiers
 * without duplicating the map template.
 */
export const PERSONAL_WORLD_MAP_CONFIG: WorldMapConfig = {
  id: "reading-quest-personal-world-v0.2",
  spaceId: "personal_world",
  title: "Không gian Cá nhân",
  subtitle: "Personal World · Nhà riêng, Khu vườn & Thư viện của bạn",
  isPersonalSpace: true,
  bounds: {
    minX: -23,
    maxX: 23,
    minZ: -23,
    maxZ: 23
  },
  spawn: {
    position: [0, 0, 5.5],
    yaw: Math.PI
  },
  camera: DEFAULT_CAMERA_ORBIT_CONFIG,
  player: DEFAULT_PLAYER_MOVEMENT_CONFIG,
  // Ordered by specificity: Personal Library in the North; Personal Garden in
  // the East wing; Personal Home in the West wing.
  zones: [
    {
      id: "personal_library",
      spaceId: "personal_world",
      title: "Thư viện Cá nhân",
      subtitle: "Personal Library · Không gian tri thức của bạn",
      description: "Thư viện riêng lưu giữ kệ sách và bàn đọc của chủ sở hữu.",
      groundColor: "#DFC9A6",
      accentColor: "#B45309",
      patchCenter: [0, 0.02, -14.2],
      patchSize: [19, 14],
      bounds: { minX: -11.5, maxX: 11.5, minZ: -23.5, maxZ: -6.2 }
    },
    {
      id: "personal_garden",
      spaceId: "personal_world",
      title: "Khu vườn Cá nhân",
      subtitle: "Personal Garden · Vườn cây của bạn",
      description: "Khu vườn riêng với chòi nghỉ, hồ nước và luống hoa của chủ sở hữu.",
      groundColor: "#B7D7A8",
      accentColor: "#15803D",
      patchCenter: [12.5, 0.02, 3.5],
      patchSize: [18, 19],
      bounds: { minX: 1.5, maxX: 23.5, minZ: -23.5, maxZ: 23.5 }
    },
    {
      id: "personal_home",
      spaceId: "personal_world",
      title: "Nhà riêng Cá nhân",
      subtitle: "Personal Home · Tổ ấm của bạn",
      description: "Ngôi nhà cá nhân và khoảng sân cổng đón tiếp bạn mỗi ngày.",
      groundColor: "#E5CEB8",
      accentColor: "#7C3AED",
      patchCenter: [-10.5, 0.02, 3.5],
      patchSize: [22, 19],
      bounds: { minX: -23.5, maxX: 23.5, minZ: -23.5, maxZ: 23.5 }
    }
  ],
  walkways: [
    { id: "personal-walkway-north", position: [0, 0.025, -1.5], size: [4.4, 15], color: "#E7D7BE" },
    { id: "personal-walkway-east", position: [8.5, 0.025, 5.5], size: [12, 3.2], color: "#E7D7BE" },
    { id: "personal-walkway-west", position: [-8.5, 0.025, 5.5], size: [12, 3.2], color: "#E7D7BE" }
  ],
  portals: [
    {
      id: "portal-to-public-plaza",
      title: "Cổng Về Quảng Trường Chung",
      subtitle: "Quay lại sảnh Quảng trường Học viện chung",
      actionLabel: "Về Quảng trường Chung (E)",
      targetSpaceId: "public_plaza",
      position: [0, 0, 10.8],
      rotationY: Math.PI,
      interactionRadius: 3.4,
      accentColor: "#D97706",
      leftPillarCollider: { minX: -2.3, maxX: -1.3, minZ: 10.3, maxZ: 11.3, maxY: 3.8 },
      rightPillarCollider: { minX: 1.3, maxX: 2.3, minZ: 10.3, maxZ: 11.3, maxY: 3.8 }
    }
  ],
  props: [
    // ——— Personal Library (North) ———
    {
      id: "library-back-wall",
      zoneId: "personal_library",
      archetype: "wall",
      assetSlot: "structure.library.back_wall",
      position: [0, 0, -20.5],
      size: [18.4, 4.4, 1.2],
      color: "#C9B18E",
      secondaryColor: "#7C4D25",
      collider: { minX: -9.2, maxX: 9.2, minZ: -21.1, maxZ: -19.9, maxY: 4.4 }
    },
    {
      id: "library-west-shelf",
      zoneId: "personal_library",
      archetype: "bookshelf",
      assetSlot: "prop.library.bookshelf_wing.t1",
      upgradeSlot: {
        slotId: "library.bookshelves",
        maxTier: 3,
        tierAssetSlots: [
          "prop.library.bookshelf_wing.t1",
          "prop.library.bookshelf_wing.t2",
          "prop.library.bookshelf_wing.t3"
        ]
      },
      position: [-8.4, 0, -14.5],
      size: [1.3, 3.5, 10.4],
      color: "#7C4D25",
      secondaryColor: "#D97706",
      collider: { minX: -9.1, maxX: -7.7, minZ: -19.7, maxZ: -9.3, maxY: 3.5 }
    },
    {
      id: "library-east-shelf",
      zoneId: "personal_library",
      archetype: "bookshelf",
      assetSlot: "prop.library.bookshelf_wing.t1",
      upgradeSlot: {
        slotId: "library.bookshelves",
        maxTier: 3,
        tierAssetSlots: [
          "prop.library.bookshelf_wing.t1",
          "prop.library.bookshelf_wing.t2",
          "prop.library.bookshelf_wing.t3"
        ]
      },
      position: [8.4, 0, -14.5],
      size: [1.3, 3.5, 10.4],
      color: "#7C4D25",
      secondaryColor: "#2563EB",
      collider: { minX: 7.7, maxX: 9.1, minZ: -19.7, maxZ: -9.3, maxY: 3.5 }
    },
    {
      id: "library-pillar-nw",
      zoneId: "personal_library",
      archetype: "pillar",
      assetSlot: "structure.library.pillar",
      position: [-5.4, 0, -8.2],
      size: [1.1, 3.8, 1.1],
      color: "#E2D3BA",
      secondaryColor: "#B45309",
      collider: { minX: -6.0, maxX: -4.8, minZ: -8.8, maxZ: -7.6, maxY: 3.8 }
    },
    {
      id: "library-pillar-ne",
      zoneId: "personal_library",
      archetype: "pillar",
      assetSlot: "structure.library.pillar",
      position: [5.4, 0, -8.2],
      size: [1.1, 3.8, 1.1],
      color: "#E2D3BA",
      secondaryColor: "#B45309",
      collider: { minX: 4.8, maxX: 6.0, minZ: -8.8, maxZ: -7.6, maxY: 3.8 }
    },
    {
      id: "library-desk",
      zoneId: "personal_library",
      archetype: "desk",
      assetSlot: "prop.library.main_desk.t1",
      upgradeSlot: {
        slotId: "library.desk",
        maxTier: 3,
        tierAssetSlots: [
          "prop.library.main_desk.t1",
          "prop.library.main_desk.t2",
          "prop.library.main_desk.t3"
        ]
      },
      position: [0, 0, -15.8],
      size: [3.8, 1.05, 1.3],
      color: "#855228",
      secondaryColor: "#F4E3C1",
      collider: { minX: -1.95, maxX: 1.95, minZ: -16.5, maxZ: -15.1, maxY: 1.2 }
    },
    {
      id: "library-table-west",
      zoneId: "personal_library",
      archetype: "table",
      assetSlot: "prop.library.reading_table",
      position: [-4.6, 0, -13.5],
      size: [2.2, 0.9, 1.5],
      color: "#9A6634",
      secondaryColor: "#16A34A",
      collider: { minX: -5.75, maxX: -3.45, minZ: -14.3, maxZ: -12.7, maxY: 1.1 }
    },
    {
      id: "library-table-east",
      zoneId: "personal_library",
      archetype: "table",
      assetSlot: "prop.library.reading_table",
      position: [4.6, 0, -13.5],
      size: [2.2, 0.9, 1.5],
      color: "#9A6634",
      secondaryColor: "#DB2777",
      collider: { minX: 3.45, maxX: 5.75, minZ: -14.3, maxZ: -12.7, maxY: 1.1 }
    },

    // ——— Personal Garden (East) ———
    {
      id: "garden-gazebo",
      zoneId: "personal_garden",
      archetype: "gazebo",
      assetSlot: "structure.garden.gazebo.t1",
      upgradeSlot: {
        slotId: "garden.gazebo",
        maxTier: 3,
        tierAssetSlots: [
          "structure.garden.gazebo.t1",
          "structure.garden.gazebo.t2",
          "structure.garden.gazebo.t3"
        ]
      },
      position: [15.8, 0, -3.2],
      size: [4.2, 3.4, 4.2],
      color: "#C49A6C",
      secondaryColor: "#5E8C61",
      collider: { minX: 13.9, maxX: 17.7, minZ: -5.1, maxZ: -1.3, maxY: 3.6 }
    },
    {
      id: "garden-pond",
      zoneId: "personal_garden",
      archetype: "pond",
      assetSlot: "prop.garden.pond.t1",
      upgradeSlot: {
        slotId: "garden.pond",
        maxTier: 2,
        tierAssetSlots: ["prop.garden.pond.t1", "prop.garden.pond.t2"]
      },
      position: [15.5, 0, 1.4],
      size: [3.2, 0.35, 2.4],
      color: "#79B8D1",
      secondaryColor: "#C7B9A5",
      collider: { minX: 13.9, maxX: 17.1, minZ: 0.2, maxZ: 2.6, maxY: 0.5 }
    },
    {
      id: "garden-planter-west",
      zoneId: "personal_garden",
      archetype: "planter",
      assetSlot: "prop.garden.planter.t1",
      upgradeSlot: {
        slotId: "garden.planters",
        maxTier: 3,
        tierAssetSlots: [
          "prop.garden.planter.t1",
          "prop.garden.planter.t2",
          "prop.garden.planter.t3"
        ]
      },
      position: [12.8, 0, 9.4],
      size: [2.6, 0.75, 1.6],
      color: "#8F5E36",
      secondaryColor: "#5FA353",
      collider: { minX: 11.5, maxX: 14.1, minZ: 8.6, maxZ: 10.2, maxY: 0.9 }
    },
    {
      id: "garden-planter-east",
      zoneId: "personal_garden",
      archetype: "planter",
      assetSlot: "prop.garden.planter.t1",
      upgradeSlot: {
        slotId: "garden.planters",
        maxTier: 3,
        tierAssetSlots: [
          "prop.garden.planter.t1",
          "prop.garden.planter.t2",
          "prop.garden.planter.t3"
        ]
      },
      position: [17.4, 0, 9.4],
      size: [2.6, 0.75, 1.6],
      color: "#8F5E36",
      secondaryColor: "#E88B9C",
      collider: { minX: 16.1, maxX: 18.7, minZ: 8.6, maxZ: 10.2, maxY: 0.9 }
    },
    {
      id: "garden-tree-east",
      zoneId: "personal_garden",
      archetype: "tree",
      assetSlot: "prop.garden.tree",
      position: [20.2, 0, 5.5],
      size: [2.6, 4.2, 2.6],
      color: "#5A994E",
      secondaryColor: "#785032",
      collider: { minX: 19.55, maxX: 20.85, minZ: 4.85, maxZ: 6.15, maxY: 4.2 }
    },

    // ——— Personal Home (West) ———
    {
      id: "residential-arch-pillar-north",
      zoneId: "personal_home",
      archetype: "arch-pillar",
      assetSlot: "structure.residential.arch_pillar",
      position: [-9.2, 0, 3.6],
      size: [0.9, 3.4, 0.9],
      color: "#C8A98E",
      secondaryColor: "#7C3AED",
      collider: { minX: -9.7, maxX: -8.7, minZ: 3.1, maxZ: 4.1, maxY: 3.4 }
    },
    {
      id: "residential-arch-pillar-south",
      zoneId: "personal_home",
      archetype: "arch-pillar",
      assetSlot: "structure.residential.arch_pillar",
      position: [-9.2, 0, 7.4],
      size: [0.9, 3.4, 0.9],
      color: "#C8A98E",
      secondaryColor: "#7C3AED",
      collider: { minX: -9.7, maxX: -8.7, minZ: 6.9, maxZ: 7.9, maxY: 3.4 }
    },
    {
      id: "residential-arch-beam",
      zoneId: "personal_home",
      archetype: "arch-beam",
      assetSlot: "structure.residential.arch_beam",
      position: [-9.2, 3.3, 5.5],
      size: [1.0, 0.55, 4.9],
      color: "#8C583A",
      secondaryColor: "#EDE9FE"
    },
    {
      id: "residential-cottage-north",
      zoneId: "personal_home",
      archetype: "cottage",
      assetSlot: "structure.home.cottage_primary.t1",
      upgradeSlot: {
        slotId: "home.cottage",
        maxTier: 3,
        tierAssetSlots: [
          "structure.home.cottage_primary.t1",
          "structure.home.cottage_primary.t2",
          "structure.home.cottage_primary.t3"
        ]
      },
      position: [-16.2, 0, -2.2],
      size: [5.4, 3.4, 4.4],
      color: "#F3E4D2",
      secondaryColor: "#B85D43",
      collider: { minX: -19.0, maxX: -13.4, minZ: -4.5, maxZ: 0.1, maxY: 4.8 }
    },
    {
      id: "residential-cottage-south",
      zoneId: "personal_home",
      archetype: "cottage",
      assetSlot: "structure.home.cottage_secondary",
      position: [-16.2, 0, 11.8],
      size: [5.0, 3.2, 4.2],
      color: "#EFE0CE",
      secondaryColor: "#6D5A88",
      collider: { minX: -18.8, maxX: -13.6, minZ: 9.6, maxZ: 14.0, maxY: 4.6 }
    },
    {
      id: "residential-mailbox",
      zoneId: "personal_home",
      archetype: "mailbox",
      assetSlot: "prop.home.mailbox.t1",
      upgradeSlot: {
        slotId: "home.mailbox",
        maxTier: 2,
        tierAssetSlots: ["prop.home.mailbox.t1", "prop.home.mailbox.t2"]
      },
      position: [-12.6, 0, 1.6],
      size: [0.7, 1.35, 0.7],
      color: "#7C3AED",
      secondaryColor: "#785032",
      collider: { minX: -13.0, maxX: -12.2, minZ: 1.2, maxZ: 2.0, maxY: 1.4 }
    },
    {
      id: "residential-tree-west",
      zoneId: "personal_home",
      archetype: "tree",
      assetSlot: "prop.residential.tree",
      position: [-20.2, 0, 5.5],
      size: [2.5, 4.0, 2.5],
      color: "#69A55B",
      secondaryColor: "#785032",
      collider: { minX: -20.85, maxX: -19.55, minZ: 4.85, maxZ: 6.15, maxY: 4.0 }
    }
  ],
  npcs: [
    {
      id: "npc-librarian-minh",
      name: "Thủ thư Minh",
      role: "Cố vấn Thư viện Cá nhân · Reading Quest",
      zoneId: "personal_library",
      assetSlot: "character.npc.librarian_minh",
      position: [0, 0, -13.0],
      rotationY: 0,
      robeColor: "#3B5998",
      accentColor: "#F59E0B",
      interactionRadius: 3.2,
      collider: { minX: -0.55, maxX: 0.55, minZ: -13.55, maxZ: -12.45, maxY: 1.9 },
      dialogue: [
        "Chào mừng bạn về với Thư viện Cá nhân! Mình là Minh — người đồng hành cùng kệ sách riêng của bạn.",
        "Không gian Cá nhân này thuộc quyền sở hữu của riêng bạn: phía Tây là Nhà riêng, phía Đông là Khu vườn, và nơi đây là Thư viện.",
        "Trong các giai đoạn tới, mỗi bước tiến đọc sách sẽ giúp bạn nâng cấp kệ sách, bàn đọc và khu vườn thêm rực rỡ!"
      ]
    }
  ]
};

export const WORLD_SPACE_TEMPLATES: Readonly<Record<WorldSpaceId, WorldMapConfig>> = {
  public_plaza: PUBLIC_PLAZA_MAP_CONFIG,
  personal_world: PERSONAL_WORLD_MAP_CONFIG
};

/** Default initial map template when entering `/world`. */
export const WORLD_MAP_CONFIG: WorldMapConfig = PUBLIC_PLAZA_MAP_CONFIG;

/**
 * Flattens static prop colliders, portal pillar colliders, and NPC body
 * colliders into a single list for horizontal collision & camera occlusion.
 */
export function collectMapColliders(config: WorldMapConfig = WORLD_MAP_CONFIG): Aabb2D[] {
  const colliders: Aabb2D[] = [];

  if (config.spaceId === "public_plaza") {
    colliders.push(...PLAZA_LANDSCAPE_COLLIDERS);
    colliders.push(...PLAZA_NATURE_COLLIDERS, ...PLAZA_PAVILION_COLLIDERS);
  }

  for (const prop of config.props) {
    if (prop.collider) {
      colliders.push({ id: prop.id, ...prop.collider });
    }
  }

  for (const portal of config.portals) {
    const [px, , pz] = portal.position;
    const isPlazaPortal = !config.isPersonalSpace;
    colliders.push({
      id: `${portal.id}-left-pillar`,
      ...portal.leftPillarCollider,
      ...(isPlazaPortal ? { blockCamera: true } : {})
    });
    colliders.push({
      id: `${portal.id}-right-pillar`,
      ...portal.rightPillarCollider,
      ...(isPlazaPortal ? { blockCamera: true } : {})
    });
    if (isPlazaPortal) {
      colliders.push({
        id: `${portal.id}-arch-lintel`,
        minX: px - 2.4,
        maxX: px + 2.4,
        // Cover the swept roof and its eaves as well as the lintel below it.
        minZ: pz - 0.85,
        maxZ: pz + 0.85,
        minY: 3.3,
        maxY: 4.95,
        cameraOnly: true,
        blockCamera: true
      });
    }
  }

  for (const npc of config.npcs) {
    colliders.push({ id: npc.id, ...npc.collider });
  }

  return colliders;
}
