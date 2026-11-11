import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  applyCameraRigToThreeCamera,
  computeUnoccludedDistance,
  createInitialCameraRig,
  resetCameraOrbit,
  rotateCameraOrbit,
  stepFollowCamera,
  zoomCameraOrbit
} from "@/lib/world/camera";
import {
  findNearestInteractableNpc,
  findNearestInteractablePortal,
  getZoneAtPosition,
  isDialogueStillInRange,
  stepDialogueInteraction
} from "@/lib/world/interaction";
import {
  collectMapColliders,
  PERSONAL_WORLD_MAP_CONFIG,
  PUBLIC_PLAZA_MAP_CONFIG,
  WORLD_SPACE_TEMPLATES
} from "@/lib/world/map-config";
import {
  createPersonalWorldOwnerState,
  resolvePersonalWorldAccess,
  resolvePropAssetSlot
} from "@/lib/world/ownership";
import {
  createInitialPlayerState,
  resolveCircleAabbCollision,
  stepPlayerKinematics
} from "@/lib/world/physics";
import type { MovementInput } from "@/lib/world/types";

const IDLE_INPUT: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false
};

const BANNED_GUILT_AND_COMPARISON = [
  "thất vọng",
  "buồn vì cậu",
  "buồn vì sếp",
  "tại cậu",
  "tại sếp",
  "bỏ rơi",
  "đói lắm",
  "thua",
  "kém hơn",
  "xếp cuối",
  "bét",
  "chậm hơn",
  "giỏi hơn sếp",
  "giỏi hơn cậu"
];

describe("Reading Quest v0.2 world architecture, camera, and jump model", () => {
  it("separates Public Plaza from the Personal World (Home, Garden, Library) with safe spawns", () => {
    expect(PUBLIC_PLAZA_MAP_CONFIG.isPersonalSpace).toBe(false);
    expect(PUBLIC_PLAZA_MAP_CONFIG.zones.map((z) => z.id)).toEqual(["plaza"]);
    expect(PUBLIC_PLAZA_MAP_CONFIG.portals[0]?.targetSpaceId).toBe("personal_world");

    expect(PERSONAL_WORLD_MAP_CONFIG.isPersonalSpace).toBe(true);
    expect(new Set(PERSONAL_WORLD_MAP_CONFIG.zones.map((z) => z.id))).toEqual(
      new Set(["personal_home", "personal_garden", "personal_library"])
    );
    expect(PERSONAL_WORLD_MAP_CONFIG.portals[0]?.targetSpaceId).toBe("public_plaza");

    for (const template of Object.values(WORLD_SPACE_TEMPLATES)) {
      const colliders = collectMapColliders(template);
      const [sx, , sz] = template.spawn.position;

      for (const box of colliders) {
        expect(resolveCircleAabbCollision(sx, sz, template.player.radius, box)).toEqual({
          x: sx,
          z: sz
        });
      }
    }
  });

  it("associates Personal World state with the authenticated owner and blocks visitor edits", () => {
    const owner = { userId: "user-owner-1", email: "owner@betterme.vn" };
    const visitor = { userId: "user-visitor-2", email: "friend@betterme.vn" };

    const ownerView = createPersonalWorldOwnerState(owner, owner);
    expect(ownerView.ownerUserId).toBe("user-owner-1");
    expect(ownerView.accessRole).toBe("owner");
    expect(ownerView.permissions).toEqual({
      canEnter: true,
      canInteractNpc: true,
      canEditProperty: true,
      canUpgradeObjects: true
    });

    const visitorView = createPersonalWorldOwnerState(owner, visitor);
    expect(visitorView.ownerUserId).toBe("user-owner-1");
    expect(visitorView.viewerUserId).toBe("user-visitor-2");
    expect(visitorView.accessRole).toBe("visitor");
    expect(visitorView.permissions).toEqual({
      canEnter: true,
      canInteractNpc: true,
      canEditProperty: false,
      canUpgradeObjects: false
    });

    expect(() => resolvePersonalWorldAccess({ userId: "  ", email: "x" }, "user-owner-1")).toThrow();

    // Upgradeable props resolve their asset slot from owner state without mutating the template.
    const cottageProp = PERSONAL_WORLD_MAP_CONFIG.props.find(
      (p) => p.id === "residential-cottage-north"
    )!;
    const upgradedState = {
      ...ownerView,
      upgrades: {
        ...ownerView.upgrades,
        "home.cottage": {
          ...ownerView.upgrades["home.cottage"],
          tier: 3
        }
      }
    };
    expect(resolvePropAssetSlot(cottageProp, ownerView)).toBe("structure.home.cottage_primary.t1");
    expect(resolvePropAssetSlot(cottageProp, upgradedState)).toBe(
      "structure.home.cottage_primary.t3"
    );
  });

  it("respects BetterMe invariant 1 (no-guilt, no downward comparison) across both world templates", () => {
    const allCopy = Object.values(WORLD_SPACE_TEMPLATES)
      .flatMap((template) => [
        template.title,
        template.subtitle,
        ...template.zones.flatMap((z) => [z.title, z.subtitle, z.description]),
        ...template.portals.flatMap((p) => [p.title, p.subtitle, p.actionLabel]),
        ...template.npcs.flatMap((n) => [n.name, n.role, ...n.dialogue])
      ])
      .join(" ")
      .toLowerCase();

    for (const banned of BANNED_GUILT_AND_COMPARISON) {
      expect(allCopy).not.toContain(banned);
    }
  });

  it("moves relative to camera yaw and preserves camera orbit angle during movement", () => {
    const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
    const rig = createInitialCameraRig(PUBLIC_PLAZA_MAP_CONFIG.spawn.position, camConfig);

    // Rotate camera +90 degrees (+PI/2: camera sits East of player, facing West -X).
    rotateCameraOrbit(rig, Math.PI / 2, 0, camConfig);
    for (let i = 0; i < 60; i += 1) {
      stepFollowCamera(rig, 0, 0, 5.8, camConfig, 1 / 60);
    }
    expect(rig.yaw).toBeCloseTo(Math.PI / 2, 2);

    const player = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    const startX = player.x;
    const startZ = player.z;

    // Pressing W (forward relative to camera) now moves West (-X) while Z stays constant.
    stepPlayerKinematics(
      player,
      { ...IDLE_INPUT, forward: true },
      [],
      PUBLIC_PLAZA_MAP_CONFIG.bounds,
      PUBLIC_PLAZA_MAP_CONFIG.player,
      0.1,
      rig.yaw
    );
    expect(player.x).toBeCloseTo(
      startX - PUBLIC_PLAZA_MAP_CONFIG.player.walkSpeed * 0.1,
      3
    );
    expect(player.z).toBeCloseTo(startZ, 4);

    // Stepping follow camera while player moves keeps the user's rotated yaw intact.
    stepFollowCamera(rig, player.x, player.y, player.z, camConfig, 1 / 60);
    expect(rig.targetYaw).toBeCloseTo(Math.PI / 2, 5);
  });

  it("clamps orbit pitch and zoom distance, resets on R, and pulls camera in front of tall occluders", () => {
    const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
    const rig = createInitialCameraRig([0, 0, 0], camConfig);

    rotateCameraOrbit(rig, 1.2, 99, camConfig);
    expect(rig.targetPitch).toBe(camConfig.maxPitch);

    rotateCameraOrbit(rig, 0, -99, camConfig);
    expect(rig.targetPitch).toBeLessThan(0);
    expect(rig.targetPitch).toBeGreaterThanOrEqual(camConfig.minPitch);

    zoomCameraOrbit(rig, -999, camConfig);
    expect(rig.targetDistance).toBe(camConfig.minDistance);

    zoomCameraOrbit(rig, 999, camConfig);
    expect(rig.targetDistance).toBe(camConfig.maxDistance);

    resetCameraOrbit(rig, camConfig);
    expect(rig.targetYaw).toBe(camConfig.defaultYaw);
    expect(rig.targetPitch).toBe(camConfig.defaultPitch);
    expect(rig.targetDistance).toBe(camConfig.defaultDistance);

    // Tall wall between target (0, 1, 0) and camera along +Z at z = 4..5
    const wall = [{ id: "wall", minX: -5, maxX: 5, minZ: 4, maxZ: 5, maxY: 4.0 }];
    const safeDist = computeUnoccludedDistance(0, 1, 0, 0, 0, 1, 16, wall);
    expect(safeDist).toBeLessThan(4);
    expect(safeDist).toBeGreaterThanOrEqual(2.4);

    // Thin pillars/trees do not snap the camera zoom when walking past them
    const pillar = [{ id: "pillar", minX: -0.5, maxX: 0.5, minZ: 2, maxZ: 3, maxY: 3.6 }];
    expect(computeUnoccludedDistance(0, 1, 0, 0, 0, 1, 16, pillar)).toBe(16);
  });

  it("B1: resolves 3D ray-vs-AABB occlusion for close walls (Case 1), high-zoom rays crossing lower walls (Case 2), target-inside-collider, and asymmetric pull-in/recovery damping", () => {
    // Case 1: target = (0, 1, 0), dir = (0, 0, 1), desiredDistance = 6, wall x=[-2, 2], z=[1, 4], maxY=3.
    // Must place camera IN FRONT of z = 1 (distance < 1.0), never clamping up to 2.4 inside the wall.
    const closeWall = [{ id: "close-wall", minX: -2, maxX: 2, minZ: 1, maxZ: 4, maxY: 3 }];
    const distCase1 = computeUnoccludedDistance(0, 1, 0, 0, 0, 1, 6, closeWall);
    expect(distCase1).toBeLessThan(1.0);
    expect(distCase1).toBeGreaterThanOrEqual(0.35);

    // Case 2: target = (0, 1, 0), dir = (0, 0.4, Math.sqrt(0.84)), desiredDistance = 16, wall x=[-2, 2], z=[1, 2], maxY=3.
    // Even though desiredCamY at distance=16 is 7.4 > maxY(3), the ray crosses z=[1, 2] at y=1.44..1.87 <= 3.
    const lowWall = [{ id: "low-wall", minX: -2, maxX: 2, minZ: 1, maxZ: 2, maxY: 3 }];
    const dirZ = Math.sqrt(0.84);
    const distCase2 = computeUnoccludedDistance(0, 1, 0, 0, 0.4, dirZ, 16, lowWall);
    expect(distCase2).toBeLessThan(1 / dirZ);
    expect(distCase2).toBeGreaterThanOrEqual(0.35);

    // Case 3 (Sol review): target = (0, 1, 0), dir = (0, 0, 1), desiredDistance = 6, very close wall x=[-2, 2], z=[0.20, 4], maxY=3.
    // Must NEVER return 0.35 (which places the camera at z=0.35 inside the wall z=[0.20, 4]).
    const veryCloseWall = [{ id: "very-close-wall", minX: -2, maxX: 2, minZ: 0.2, maxZ: 4, maxY: 3 }];
    const distVeryClose = computeUnoccludedDistance(0, 1, 0, 0, 0, 1, 6, veryCloseWall);
    expect(distVeryClose).toBeLessThan(0.2);
    expect(distVeryClose).toBeGreaterThan(0);

    // Final camera position from stepFollowCamera in Sol's close-wall case must sit strictly outside z=[0.20, 4]
    const closeCamConfig = {
      ...PUBLIC_PLAZA_MAP_CONFIG.camera,
      defaultPitch: 0,
      minPitch: 0,
      defaultDistance: 6,
      minDistance: 2,
      lookAtHeight: 1
    };
    const closeRig = createInitialCameraRig([0, 0, 0], closeCamConfig);
    stepFollowCamera(closeRig, 0, 0, 0, closeCamConfig, 1 / 60, veryCloseWall);
    expect(closeRig.positionZ).toBeLessThan(0.2);
    expect(closeRig.positionZ).toBeGreaterThan(closeRig.targetZ);

    // Case 4 (Sol review): look-at target has drifted inside the collider due to target smoothing/interpolation.
    // Even when rig.targetZ starts at 0.50 (inside z=[0.20, 4]) while player is at z=0 (where 1 frame of smoothing
    // would otherwise leave rig.targetZ ~= 0.42 inside the wall), stepFollowCamera must clamp/eject the target and
    // place the final camera position strictly outside the wall (z < 0.20).
    const interpolatedInsideRig = createInitialCameraRig([0, 0, 0], closeCamConfig);
    interpolatedInsideRig.targetZ = 0.5;
    stepFollowCamera(interpolatedInsideRig, 0, 0, 0, closeCamConfig, 1 / 60, veryCloseWall);
    expect(interpolatedInsideRig.targetZ).toBeLessThan(0.2);
    expect(interpolatedInsideRig.positionZ).toBeLessThan(0.2);
    expect(interpolatedInsideRig.positionZ).toBeGreaterThan(interpolatedInsideRig.targetZ);

    // Even if dt=0 (or player anchor itself is at z=0.35 inside the wall), final camera position exits the front face (z < 0.20)
    const stationaryInsideRig = createInitialCameraRig([0, 0, 0.35], closeCamConfig);
    stepFollowCamera(stationaryInsideRig, 0, 0, 0.35, closeCamConfig, 0, veryCloseWall);
    expect(stationaryInsideRig.targetZ).toBeLessThan(0.2);
    expect(stationaryInsideRig.positionZ).toBeLessThan(0.2);
    expect(stationaryInsideRig.positionZ).toBeGreaterThan(stationaryInsideRig.targetZ);

    // Case 5: Asymmetric damping — pulls in immediately when occluded, recovers smoothly when cleared, and resets cleanly on KeyR
    const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
    const rig = createInitialCameraRig([0, 0, 0], camConfig);
    rig.pitch = 0.2;
    rig.targetPitch = 0.2;

    // Step with close wall occluding -> pulls in immediately on a single frame
    stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60, closeWall);
    const occludedDist = Math.hypot(
      rig.positionX - rig.targetX,
      rig.positionY - rig.targetY,
      rig.positionZ - rig.targetZ
    );
    expect(occludedDist).toBeLessThan(1.0);

    // Next frame with wall removed -> recovers smoothly (partial step, not instant snap to full distance)
    stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60, []);
    const recoveringDist = Math.hypot(
      rig.positionX - rig.targetX,
      rig.positionY - rig.targetY,
      rig.positionZ - rig.targetZ
    );
    expect(recoveringDist).toBeGreaterThan(occludedDist);
    expect(recoveringDist).toBeLessThan(rig.distance - 0.5);

    // Resetting camera orbit (KeyR) restores target angles and distance cleanly
    resetCameraOrbit(rig, camConfig);
    expect(rig.targetDistance).toBe(camConfig.defaultDistance);
    expect(rig.effectiveDistance).toBe(camConfig.defaultDistance);

    // Portal pillars and overhead arch lintel in Public Plaza block the 3D camera ray while keeping the ground doorway open
    const plazaColliders = collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG);
    const lintelRayDist = computeUnoccludedDistance(0, 3.6, -11.2, 0, 0, 1, 6, plazaColliders);
    expect(lintelRayDist).toBeLessThan(1.4);
    expect(resolveCircleAabbCollision(0, -9.8, 0.45, plazaColliders.find((c) => c.id.endsWith("-arch-lintel"))!)).toEqual({
      x: 0,
      z: -9.8
    });

    // Walking straight through the Public Plaza portal doorway (z = -8.0 -> -11.2) succeeds unimpeded while camera follows safely
    const portalWalker = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    portalWalker.x = 0;
    portalWalker.z = -8.0;
    const portalCamRig = createInitialCameraRig([0, 0, -8.0], camConfig);
    for (let step = 0; step < 60; step += 1) {
      stepPlayerKinematics(
        portalWalker,
        { ...IDLE_INPUT, forward: true, sprint: true },
        plazaColliders,
        PUBLIC_PLAZA_MAP_CONFIG.bounds,
        PUBLIC_PLAZA_MAP_CONFIG.player,
        1 / 60,
        0
      );
      stepFollowCamera(portalCamRig, portalWalker.x, portalWalker.y, portalWalker.z, camConfig, 1 / 60, plazaColliders);
    }
    expect(portalWalker.z).toBeLessThan(-10.8);

    // Personal World colliders stay untouched by the Public Plaza portal camera lintel
    const personalColliders = collectMapColliders(PERSONAL_WORLD_MAP_CONFIG);
    expect(personalColliders.some((c) => c.id.endsWith("-arch-lintel"))).toBe(false);
  });

  it("executes grounded jump with gravity, prevents mid-air double jump, and preserves horizontal collision while airborne", () => {
    const colliders = collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG);
    const player = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);

    // Trigger jump on frame 1
    stepPlayerKinematics(
      player,
      { ...IDLE_INPUT, jump: true, forward: true, sprint: true },
      colliders,
      PUBLIC_PLAZA_MAP_CONFIG.bounds,
      PUBLIC_PLAZA_MAP_CONFIG.player,
      1 / 60,
      0
    );
    expect(player.isGrounded).toBe(false);
    expect(player.y).toBeGreaterThan(0);
    const velocityAfterTakeoff = player.velocityY;

    // Holding or re-pressing Space mid-air must NOT re-boost velocityY
    stepPlayerKinematics(
      player,
      { ...IDLE_INPUT, jump: true, forward: true, sprint: true },
      colliders,
      PUBLIC_PLAZA_MAP_CONFIG.bounds,
      PUBLIC_PLAZA_MAP_CONFIG.player,
      1 / 60,
      0
    );
    expect(player.velocityY).toBeLessThan(velocityAfterTakeoff);

    let peakY = player.y;
    for (let step = 0; step < 60; step += 1) {
      stepPlayerKinematics(
        player,
        { ...IDLE_INPUT, forward: true, sprint: true },
        colliders,
        PUBLIC_PLAZA_MAP_CONFIG.bounds,
        PUBLIC_PLAZA_MAP_CONFIG.player,
        1 / 60,
        0
      );
      peakY = Math.max(peakY, player.y);
    }

    expect(peakY).toBeGreaterThan(1.0);
    expect(player.isGrounded).toBe(true);
    expect(player.y).toBe(0);

    // Horizontal collision with the Plaza fountain still blocked the airborne player
    const fountain = colliders.find((c) => c.id === "plaza-fountain")!;
    expect(player.z).toBeGreaterThanOrEqual(
      fountain.maxZ + PUBLIC_PLAZA_MAP_CONFIG.player.radius - 1e-4
    );
  });

  it("reaches the portal in Public Plaza and explores Home, Garden, and Library in Personal World", () => {
    // 1. Public Plaza: walk around fountain to North portal (scale frame counts to configured runSpeed)
    const plazaColliders = collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG);
    const plazaPlayer = createInitialPlayerState(PUBLIC_PLAZA_MAP_CONFIG);
    const plazaSpeedScale = 9.8 / PUBLIC_PLAZA_MAP_CONFIG.player.runSpeed;

    for (let step = 0; step < Math.ceil(22 * plazaSpeedScale); step += 1) {
      stepPlayerKinematics(
        plazaPlayer,
        { ...IDLE_INPUT, right: true, sprint: true },
        plazaColliders,
        PUBLIC_PLAZA_MAP_CONFIG.bounds,
        PUBLIC_PLAZA_MAP_CONFIG.player,
        1 / 60
      );
    }
    for (let step = 0; step < Math.ceil(95 * plazaSpeedScale); step += 1) {
      stepPlayerKinematics(
        plazaPlayer,
        { ...IDLE_INPUT, forward: true, sprint: true },
        plazaColliders,
        PUBLIC_PLAZA_MAP_CONFIG.bounds,
        PUBLIC_PLAZA_MAP_CONFIG.player,
        1 / 60
      );
    }
    for (let step = 0; step < Math.ceil(20 * plazaSpeedScale); step += 1) {
      stepPlayerKinematics(
        plazaPlayer,
        { ...IDLE_INPUT, left: true, sprint: true },
        plazaColliders,
        PUBLIC_PLAZA_MAP_CONFIG.bounds,
        PUBLIC_PLAZA_MAP_CONFIG.player,
        1 / 60
      );
    }

    const portal = findNearestInteractablePortal(
      plazaPlayer.x,
      plazaPlayer.z,
      PUBLIC_PLAZA_MAP_CONFIG.portals
    );
    expect(portal?.targetSpaceId).toBe("personal_world");

    // 2. Personal World: explore Personal Garden (East), Personal Home (West), and Personal Library (North)
    const personalColliders = collectMapColliders(PERSONAL_WORLD_MAP_CONFIG);
    const personalSpeedScale = 9.8 / PERSONAL_WORLD_MAP_CONFIG.player.runSpeed;

    const gardenExplorer = createInitialPlayerState(PERSONAL_WORLD_MAP_CONFIG);
    for (let step = 0; step < Math.ceil(60 * personalSpeedScale); step += 1) {
      stepPlayerKinematics(
        gardenExplorer,
        { ...IDLE_INPUT, right: true, sprint: true },
        personalColliders,
        PERSONAL_WORLD_MAP_CONFIG.bounds,
        PERSONAL_WORLD_MAP_CONFIG.player,
        1 / 60
      );
    }
    expect(
      getZoneAtPosition(gardenExplorer.x, gardenExplorer.z, PERSONAL_WORLD_MAP_CONFIG.zones).id
    ).toBe("personal_garden");

    const homeExplorer = createInitialPlayerState(PERSONAL_WORLD_MAP_CONFIG);
    for (let step = 0; step < Math.ceil(60 * personalSpeedScale); step += 1) {
      stepPlayerKinematics(
        homeExplorer,
        { ...IDLE_INPUT, left: true, sprint: true },
        personalColliders,
        PERSONAL_WORLD_MAP_CONFIG.bounds,
        PERSONAL_WORLD_MAP_CONFIG.player,
        1 / 60
      );
    }
    expect(
      getZoneAtPosition(homeExplorer.x, homeExplorer.z, PERSONAL_WORLD_MAP_CONFIG.zones).id
    ).toBe("personal_home");

    const libraryExplorer = createInitialPlayerState(PERSONAL_WORLD_MAP_CONFIG);
    for (let step = 0; step < Math.ceil(115 * personalSpeedScale); step += 1) {
      stepPlayerKinematics(
        libraryExplorer,
        { ...IDLE_INPUT, forward: true, sprint: true },
        personalColliders,
        PERSONAL_WORLD_MAP_CONFIG.bounds,
        PERSONAL_WORLD_MAP_CONFIG.player,
        1 / 60
      );
    }
    expect(
      getZoneAtPosition(libraryExplorer.x, libraryExplorer.z, PERSONAL_WORLD_MAP_CONFIG.zones).id
    ).toBe("personal_library");

    const librarian = findNearestInteractableNpc(
      libraryExplorer.x,
      libraryExplorer.z,
      PERSONAL_WORLD_MAP_CONFIG.npcs
    );
    expect(librarian?.id).toBe("npc-librarian-minh");

    // Jumping while talking to Librarian Minh keeps dialogue in range
    const session = stepDialogueInteraction(null, librarian, PERSONAL_WORLD_MAP_CONFIG.npcs);
    expect(session).toEqual({ npcId: "npc-librarian-minh", lineIndex: 0 });
    expect(
      isDialogueStillInRange(
        session,
        libraryExplorer.x,
        libraryExplorer.z,
        PERSONAL_WORLD_MAP_CONFIG.npcs
      )
    ).toBe(true);
  });

  describe("Public Plaza Character-Focused Low-Angle Orbit Camera", () => {
    it("looks up 55 degrees at ground contact while keeping the character and high sky in the renderer frame", () => {
      const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
      expect(camConfig.minPitch).toBeCloseTo((-55 * Math.PI) / 180, 6);
      expect("maxSkyLookElevationRad" in camConfig).toBe(false);

      const rig = createInitialCameraRig([0, 0, 0], camConfig);
      expect("lookAtX" in rig).toBe(false);

      zoomCameraOrbit(rig, -999, camConfig);
      expect(rig.targetDistance).toBeCloseTo(4.8, 6);

      // Drag upward past the ground limit and settle on flat ground (no colliders)
      rotateCameraOrbit(rig, 0, -99, camConfig);
      for (let i = 0; i < 120; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
      }

      // Camera must physically descend to the Y = 0.6 floor (not stay stuck at pitch +0.08 / Y ~= 1.63)
      expect(rig.positionY).toBeCloseTo(0.6, 3);
      expect(rig.targetY).toBeCloseTo(1.25, 6);

      // Ground contact shortens only the effective radius, preserving the selected zoom.
      const actualRadius = Math.hypot(
        rig.positionX - rig.targetX,
        rig.positionY - rig.targetY,
        rig.positionZ - rig.targetZ
      );
      expect(actualRadius).toBeCloseTo(0.65 / Math.sin((55 * Math.PI) / 180), 3);
      expect(rig.distance).toBeCloseTo(4.8, 3);
      expect(rig.pitch).toBeCloseTo(camConfig.minPitch, 5);

      // Build Three.js PerspectiveCamera using the exact helper consumed by WorldScene and project the character target
      const threeCam = new THREE.PerspectiveCamera(camConfig.fov, 1440 / 1000, 0.1, 200);
      applyCameraRigToThreeCamera(threeCam, rig);
      threeCam.updateMatrixWorld(true);
      threeCam.updateProjectionMatrix();

      const targetNdc = new THREE.Vector3(rig.targetX, rig.targetY, rig.targetZ).project(threeCam);
      expect(Math.abs(targetNdc.x)).toBeLessThan(1e-4);
      expect(Math.abs(targetNdc.y)).toBeLessThan(1e-4);
      expect(targetNdc.z).toBeGreaterThan(-1);
      expect(targetNdc.z).toBeLessThan(1);

      for (const aspect of [1440 / 1000, 390 / 844]) {
        threeCam.aspect = aspect;
        threeCam.updateProjectionMatrix();
        const headNdc = new THREE.Vector3(0, 1.7, 0).project(threeCam);
        expect(Math.abs(headNdc.x)).toBeLessThan(1);
        expect(Math.abs(headNdc.y)).toBeLessThan(1);
        const sunElevation = (61 * Math.PI) / 180;
        const skyNdc = new THREE.Vector3(
          0,
          rig.positionY + 100 * Math.sin(sunElevation),
          rig.positionZ - 100 * Math.cos(sunElevation)
        ).project(threeCam);
        expect(Math.abs(skyNdc.x)).toBeLessThan(1);
        expect(Math.abs(skyNdc.y)).toBeLessThan(1);
      }
    });

    it("reaches the same sky angle at every preferred zoom without drifting the character target upward", () => {
      const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;

      for (const desiredDist of [
        camConfig.minDistance,
        camConfig.defaultDistance,
        camConfig.maxDistance
      ]) {
        const rig = createInitialCameraRig([0, 0, 5.8], camConfig);
        zoomCameraOrbit(rig, desiredDist - rig.targetDistance, camConfig);
        for (let i = 0; i < 90; i += 1) {
          stepFollowCamera(rig, 0, 0, 5.8, camConfig, 1 / 60);
        }

        rotateCameraOrbit(rig, 0, -99, camConfig);
        for (let i = 0; i < 120; i += 1) {
          stepFollowCamera(rig, 0, 0, 5.8, camConfig, 1 / 60);
        }

        expect(rig.positionY).toBeGreaterThanOrEqual(0.6 - 1e-6);
        expect(rig.positionY).toBeCloseTo(0.6, 3);
        expect(rig.targetY).toBeCloseTo(1.25, 5);

        const actualRadius = Math.hypot(
          rig.positionX - rig.targetX,
          rig.positionY - rig.targetY,
          rig.positionZ - rig.targetZ
        );
        expect(actualRadius).toBeCloseTo(0.65 / -Math.sin(camConfig.minPitch), 3);
        expect(rig.distance).toBeCloseTo(desiredDist, 3);
        expect(rig.targetDistance).toBeCloseTo(desiredDist, 3);

        expect(rig.pitch).toBeCloseTo(camConfig.minPitch, 4);
      }
    });

    it("prevents targetPitch windup when dragging repeatedly past the ground floor so a small reverse drag responds immediately", () => {
      const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
      const rig = createInitialCameraRig([0, 0, 0], camConfig);

      // Drag upward 5 times far past the ground limit at default distance (11.8)
      for (let i = 0; i < 5; i += 1) {
        rotateCameraOrbit(rig, 0, -1.0, camConfig);
        for (let step = 0; step < 30; step += 1) {
          stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
        }
      }

      const settledMinPitch = rig.pitch;
      const settledPosY = rig.positionY;
      const settledRadius = rig.effectiveDistance;
      expect(settledPosY).toBeCloseTo(0.6, 3);

      // Single small downward drag (+0.02 rad) must immediately raise targetPitch and pitch on the next step
      rotateCameraOrbit(rig, 0, 0.02, camConfig);
      expect(rig.targetPitch).toBeCloseTo(settledMinPitch + 0.02, 5);

      stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
      expect(rig.pitch).toBeGreaterThan(settledMinPitch + 0.002);
      expect(rig.effectiveDistance).toBeGreaterThan(settledRadius);
      expect(rig.positionY).toBeGreaterThanOrEqual(0.6);
    });

    it("keeps preferred zoom while ground-compressed and restores it smoothly when lowering the view or resetting", () => {
      const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
      const rig = createInitialCameraRig([0, 0, 0], camConfig);

      // Settle at minDistance (4.8) on the ground floor
      zoomCameraOrbit(rig, -999, camConfig);
      for (let i = 0; i < 90; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
      }
      rotateCameraOrbit(rig, 0, -99, camConfig);
      for (let i = 0; i < 90; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
      }
      expect(rig.positionY).toBeCloseTo(0.6, 3);

      // Zoom all the way out to maxDistance (20.5) while at the ground limit
      zoomCameraOrbit(rig, 999, camConfig);
      let prevPos = [rig.positionX, rig.positionY, rig.positionZ] as const;
      let prevPitch = rig.pitch;

      for (let i = 0; i < 120; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
        expect(Number.isFinite(rig.positionX)).toBe(true);
        expect(Number.isFinite(rig.positionY)).toBe(true);
        expect(Number.isFinite(rig.positionZ)).toBe(true);
        expect(rig.positionY).toBeGreaterThanOrEqual(0.6 - 1e-6);

        const stepDeltaPos = Math.hypot(
          rig.positionX - prevPos[0],
          rig.positionY - prevPos[1],
          rig.positionZ - prevPos[2]
        );
        expect(stepDeltaPos).toBeLessThan(3.0);
        expect(Math.abs(rig.pitch - prevPitch)).toBeLessThan(0.05);

        prevPos = [rig.positionX, rig.positionY, rig.positionZ];
        prevPitch = rig.pitch;
      }

      const maxZoomRadius = Math.hypot(
        rig.positionX - rig.targetX,
        rig.positionY - rig.targetY,
        rig.positionZ - rig.targetZ
      );
      expect(maxZoomRadius).toBeCloseTo(0.65 / -Math.sin(camConfig.minPitch), 3);
      expect(rig.distance).toBeCloseTo(camConfig.maxDistance, 2);
      expect(rig.positionY).toBeCloseTo(0.6, 3);

      rotateCameraOrbit(rig, 0, camConfig.defaultPitch - rig.targetPitch, camConfig);
      let previousRadius = rig.effectiveDistance;
      for (let i = 0; i < 180; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
        expect(rig.effectiveDistance).toBeGreaterThanOrEqual(previousRadius);
        expect(rig.effectiveDistance - previousRadius).toBeLessThan(3);
        previousRadius = rig.effectiveDistance;
      }
      expect(rig.effectiveDistance).toBeCloseTo(camConfig.maxDistance, 3);

      // Tiny pitch changes across first contact must not introduce a discontinuity.
      const safeMinAtDefault = Math.asin((0.6 - 1.25) / camConfig.defaultDistance);
      const boundaryPitches = [
        safeMinAtDefault + 0.0001,
        safeMinAtDefault,
        safeMinAtDefault - 0.0001
      ];
      const boundaryStates = boundaryPitches.map((p) => {
        const testRig = createInitialCameraRig([0, 0, 0], camConfig);
        testRig.pitch = p;
        testRig.targetPitch = p;
        stepFollowCamera(testRig, 0, 0, 0, camConfig, 1 / 60);
        return {
          pos: [testRig.positionX, testRig.positionY, testRig.positionZ] as const,
          pitch: testRig.pitch
        };
      });

      for (let i = 1; i < boundaryStates.length; i += 1) {
        const prev = boundaryStates[i - 1]!;
        const curr = boundaryStates[i]!;
        const posStep = Math.hypot(
          curr.pos[0] - prev.pos[0],
          curr.pos[1] - prev.pos[1],
          curr.pos[2] - prev.pos[2]
        );
        expect(posStep).toBeLessThan(0.03);
        expect(Math.abs(curr.pitch - prev.pitch)).toBeLessThan(0.002);
      }

      // Reset on R from ground-limited state restores default orbit cleanly
      resetCameraOrbit(rig, camConfig);
      for (let i = 0; i < 120; i += 1) {
        stepFollowCamera(rig, 0, 0, 0, camConfig, 1 / 60);
      }
      expect(rig.yaw).toBeCloseTo(camConfig.defaultYaw, 3);
      expect(rig.pitch).toBeCloseTo(camConfig.defaultPitch, 3);
      expect(rig.distance).toBeCloseTo(camConfig.defaultDistance, 3);

      // Personal World camera remains clamped at its positive minPitch (0.16)
      const personalCam = PERSONAL_WORLD_MAP_CONFIG.camera;
      expect(personalCam.minPitch).toBeCloseTo(0.16, 6);
      const personalRig = createInitialCameraRig(
        PERSONAL_WORLD_MAP_CONFIG.spawn.position,
        personalCam
      );
      rotateCameraOrbit(personalRig, 0, -99, personalCam);
      expect(personalRig.targetPitch).toBeCloseTo(personalCam.minPitch, 6);
    });

    it("combines ground and wall limits while following jumps without changing the chosen sky pitch", () => {
      const camConfig = PUBLIC_PLAZA_MAP_CONFIG.camera;
      const rig = createInitialCameraRig([0, 0, 0], camConfig);
      const wall = [{ id: "near-wall", minX: -2, maxX: 2, minZ: 0.3, maxZ: 4, maxY: 3, blockCamera: true }];
      rotateCameraOrbit(rig, 0, -99, camConfig);
      for (let i = 0; i < 180; i += 1) {
        const playerY = Math.max(0, 1.3 * Math.sin((i / 120) * Math.PI));
        stepFollowCamera(rig, 0, playerY, 0, camConfig, 1 / 60, wall);
        expect(Number.isFinite(rig.positionY)).toBe(true);
        expect(rig.positionY).toBeGreaterThanOrEqual(0.6);
        expect(rig.positionZ).toBeLessThan(0.3);
      }
      expect(rig.targetPitch).toBe(camConfig.minPitch);
      expect(rig.targetY).toBeCloseTo(camConfig.lookAtHeight, 3);
      expect(rig.targetDistance).toBe(camConfig.defaultDistance);
    });
  });
});
