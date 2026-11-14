import type { Aabb2D, CameraOrbitConfig, GroundHeightSampler, Vec3Tuple } from "@/lib/world/types";

export type CameraRigState = {
  yaw: number;
  pitch: number;
  distance: number;
  effectiveDistance: number;
  targetYaw: number;
  targetPitch: number;
  targetDistance: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
};

const MIN_LOOKAT_DISTANCE = 0.05;
const WALL_SURFACE_SKIN = 0.05;
const TARGET_COLLIDER_SKIN = 0.08;
const COLLISION_CLEARANCE = 0.35;
const CAMERA_GROUND_FLOOR_Y = 0.6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeGroundSafeDistance(targetY: number, pitch: number, distance: number): number {
  const verticalOffset = Math.sin(pitch);
  if (verticalOffset >= 0) return distance;
  return Math.min(distance, Math.max(0, targetY - CAMERA_GROUND_FLOOR_Y) / -verticalOffset);
}

function sphericalOffset(
  yaw: number,
  pitch: number,
  distance: number
): { ox: number; oy: number; oz: number } {
  const horiz = distance * Math.cos(pitch);

  return {
    ox: horiz * Math.sin(yaw),
    oy: distance * Math.sin(pitch),
    oz: horiz * Math.cos(yaw)
  };
}

export function createInitialCameraRig(
  spawnPosition: Vec3Tuple,
  cameraConfig: CameraOrbitConfig
): CameraRigState {
  const [px, py, pz] = spawnPosition;
  const targetY = py + cameraConfig.lookAtHeight;
  const distance = clamp(
    cameraConfig.defaultDistance,
    cameraConfig.minDistance,
    cameraConfig.maxDistance
  );
  const yaw = cameraConfig.defaultYaw;
  const pitch = clamp(cameraConfig.defaultPitch, cameraConfig.minPitch, cameraConfig.maxPitch);
  const effectiveDistance = computeGroundSafeDistance(targetY, pitch, distance);
  const { ox, oy, oz } = sphericalOffset(yaw, pitch, effectiveDistance);

  return {
    yaw,
    pitch,
    distance,
    effectiveDistance,
    targetYaw: yaw,
    targetPitch: pitch,
    targetDistance: distance,
    positionX: px + ox,
    positionY: Math.max(CAMERA_GROUND_FLOOR_Y, targetY + oy),
    positionZ: pz + oz,
    targetX: px,
    targetY,
    targetZ: pz
  };
}

/** Clamps input at the configured angles; ground contact shortens the effective orbit instead. */
export function rotateCameraOrbit(
  rig: CameraRigState,
  deltaYawRad: number,
  deltaPitchRad: number,
  cameraConfig: CameraOrbitConfig
): CameraRigState {
  rig.targetYaw += deltaYawRad;
  rig.targetPitch = clamp(
    rig.targetPitch + deltaPitchRad,
    cameraConfig.minPitch,
    cameraConfig.maxPitch
  );

  return rig;
}

/** Zooms the orbit camera in/out and clamps radial distance to `[minDistance, maxDistance]`. */
export function zoomCameraOrbit(
  rig: CameraRigState,
  deltaDistance: number,
  cameraConfig: CameraOrbitConfig
): CameraRigState {
  rig.targetDistance = clamp(
    rig.targetDistance + deltaDistance,
    cameraConfig.minDistance,
    cameraConfig.maxDistance
  );

  return rig;
}

/** Resets the orbit camera target angles and zoom distance to the default view (`R`). */
export function resetCameraOrbit(
  rig: CameraRigState,
  cameraConfig: CameraOrbitConfig
): CameraRigState {
  rig.targetYaw = cameraConfig.defaultYaw;
  rig.targetPitch = clamp(
    cameraConfig.defaultPitch,
    cameraConfig.minPitch,
    cameraConfig.maxPitch
  );
  const defaultDistance = clamp(
    cameraConfig.defaultDistance,
    cameraConfig.minDistance,
    cameraConfig.maxDistance
  );
  rig.targetDistance = defaultDistance;
  rig.effectiveDistance = defaultDistance;

  return rig;
}

function isCameraBlockingCollider(box: Aabb2D): boolean {
  const boxMaxY = box.maxY ?? 0;
  const spanX = box.maxX - box.minX;
  const spanZ = box.maxZ - box.minZ;
  return Boolean(
    box.blockCamera ||
      box.cameraOnly ||
      (boxMaxY >= 2.2 && (spanX >= 3.2 || spanZ >= 3.2))
  );
}

function intersectLineWithBox(
  originX: number,
  originY: number,
  originZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  box: Aabb2D
): { tNear: number; tFar: number } | null {
  const boxMinY = box.minY ?? 0;
  const boxMaxY = box.maxY ?? 0;

  let tNear = -Infinity;
  let tFar = Infinity;

  // X slab
  if (Math.abs(dirX) < 1e-6) {
    if (originX < box.minX || originX > box.maxX) return null;
  } else {
    const invX = 1 / dirX;
    const t1 = (box.minX - originX) * invX;
    const t2 = (box.maxX - originX) * invX;
    tNear = Math.max(tNear, Math.min(t1, t2));
    tFar = Math.min(tFar, Math.max(t1, t2));
  }

  // Z slab
  if (Math.abs(dirZ) < 1e-6) {
    if (originZ < box.minZ || originZ > box.maxZ) return null;
  } else {
    const invZ = 1 / dirZ;
    const t1 = (box.minZ - originZ) * invZ;
    const t2 = (box.maxZ - originZ) * invZ;
    tNear = Math.max(tNear, Math.min(t1, t2));
    tFar = Math.min(tFar, Math.max(t1, t2));
  }

  // Y slab [boxMinY, boxMaxY]
  if (Math.abs(dirY) < 1e-6) {
    if (originY < boxMinY || originY > boxMaxY) return null;
  } else {
    const invY = 1 / dirY;
    const t1 = (boxMinY - originY) * invY;
    const t2 = (boxMaxY - originY) * invY;
    tNear = Math.max(tNear, Math.min(t1, t2));
    tFar = Math.min(tFar, Math.max(t1, t2));
  }

  if (tFar < tNear) {
    return null;
  }

  return { tNear, tFar };
}

/**
 * Full 3D ray-vs-AABB slab intersection from the look-at target toward the desired
 * camera position. Pulls the camera in front of tall walls/cottages/portal lintels
 * (`maxY >= 2.2` or explicit `blockCamera`/`cameraOnly`) so the camera never sits
 * inside solid geometry at any pitch or zoom distance, even when the target is very
 * close to the wall (`tNear < COLLISION_CLEARANCE`).
 */
export function computeUnoccludedDistance(
  targetX: number,
  targetY: number,
  targetZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  desiredDistance: number,
  colliders: readonly Aabb2D[]
): number {
  let safeDistance = desiredDistance;

  for (let i = 0; i < colliders.length; i += 1) {
    const box = colliders[i];
    if (!isCameraBlockingCollider(box)) {
      continue;
    }

    const hit = intersectLineWithBox(targetX, targetY, targetZ, dirX, dirY, dirZ, box);
    if (!hit) {
      continue;
    }

    const { tNear } = hit;
    const tFar = Math.min(hit.tFar, safeDistance);

    if (tFar < tNear || tFar <= 0 || tNear >= safeDistance) {
      continue;
    }

    if (tNear <= 0) {
      // Origin is already inside or on the entry face of the collider:
      // never push forward along +dir into the collider.
      safeDistance = 0;
    } else {
      const maxBeforeWall =
        tNear > WALL_SURFACE_SKIN
          ? tNear - WALL_SURFACE_SKIN
          : tNear * 0.5;
      const minLookAtDistance = Math.min(MIN_LOOKAT_DISTANCE, maxBeforeWall);
      const candidateDistance = Math.min(
        maxBeforeWall,
        Math.max(minLookAtDistance, tNear - COLLISION_CLEARANCE)
      );
      safeDistance = Math.min(safeDistance, candidateDistance);
    }
  }

  return safeDistance;
}

/** Frame-rate-independent exponential damping for a free-look third-person orbit/follow camera. */
export function stepFollowCamera(
  rig: CameraRigState,
  playerX: number,
  playerY: number,
  playerZ: number,
  cameraConfig: CameraOrbitConfig,
  dtSeconds: number,
  colliders: readonly Aabb2D[] = [],
  groundHeight?: GroundHeightSampler
): CameraRigState {
  const clampedDt = Math.min(Math.max(dtSeconds, 0), 0.1);
  const alpha = 1 - Math.exp(-cameraConfig.smoothing * clampedDt);

  const desiredTargetX = playerX;
  const playerFloor = groundHeight?.(playerX, playerZ) ?? 0;
  const desiredTargetY = playerFloor + (playerY - playerFloor) * 0.65 + cameraConfig.lookAtHeight;
  const desiredTargetZ = playerZ;

  rig.targetX += (desiredTargetX - rig.targetX) * alpha;
  rig.targetY += (desiredTargetY - rig.targetY) * alpha;
  rig.targetZ += (desiredTargetZ - rig.targetZ) * alpha;

  rig.yaw += (rig.targetYaw - rig.yaw) * alpha;
  rig.distance = clamp(
    rig.distance + (rig.targetDistance - rig.distance) * alpha,
    cameraConfig.minDistance,
    cameraConfig.maxDistance
  );

  rig.targetPitch = clamp(rig.targetPitch, cameraConfig.minPitch, cameraConfig.maxPitch);
  rig.pitch = clamp(
    rig.pitch + (rig.targetPitch - rig.pitch) * alpha,
    cameraConfig.minPitch,
    cameraConfig.maxPitch
  );

  const unitOffset = sphericalOffset(rig.yaw, rig.pitch, 1);

  if (colliders.length > 0) {
    // 1. Prevent target smoothing from dragging or keeping rig.target inside a solid collider
    // when the player anchor (desiredTarget) is outside the collider.
    const segDx = rig.targetX - desiredTargetX;
    const segDy = rig.targetY - desiredTargetY;
    const segDz = rig.targetZ - desiredTargetZ;
    const segLen = Math.hypot(segDx, segDy, segDz);

    if (segLen > 1e-6) {
      const sDirX = segDx / segLen;
      const sDirY = segDy / segLen;
      const sDirZ = segDz / segLen;
      let allowedSegLen = segLen;

      for (let i = 0; i < colliders.length; i += 1) {
        const box = colliders[i];
        if (!isCameraBlockingCollider(box)) continue;

        const hit = intersectLineWithBox(
          desiredTargetX,
          desiredTargetY,
          desiredTargetZ,
          sDirX,
          sDirY,
          sDirZ,
          box
        );
        if (hit && hit.tNear >= 0 && hit.tNear <= allowedSegLen && hit.tFar >= 0) {
          allowedSegLen = Math.min(
            allowedSegLen,
            Math.max(0, hit.tNear - TARGET_COLLIDER_SKIN)
          );
        }
      }

      if (allowedSegLen < segLen) {
        rig.targetX = desiredTargetX + sDirX * allowedSegLen;
        rig.targetY = desiredTargetY + sDirY * allowedSegLen;
        rig.targetZ = desiredTargetZ + sDirZ * allowedSegLen;
      }
    }

    // 2. If rig.target is still inside a camera-blocking collider (e.g. stationary inside or dt=0),
    // eject rig.target back along the camera ray before the collider's entry face.
    for (let i = 0; i < colliders.length; i += 1) {
      const box = colliders[i];
      if (!isCameraBlockingCollider(box)) continue;

      const boxMinY = box.minY ?? 0;
      const boxMaxY = box.maxY ?? 0;
      const isInsideBox =
        rig.targetX >= box.minX &&
        rig.targetX <= box.maxX &&
        rig.targetZ >= box.minZ &&
        rig.targetZ <= box.maxZ &&
        rig.targetY >= boxMinY &&
        rig.targetY <= boxMaxY;

      if (isInsideBox) {
        const hit = intersectLineWithBox(
          rig.targetX,
          rig.targetY,
          rig.targetZ,
          unitOffset.ox,
          unitOffset.oy,
          unitOffset.oz,
          box
        );
        if (hit && hit.tNear <= 0 && hit.tFar >= 0) {
          const shift = hit.tNear - TARGET_COLLIDER_SKIN;
          rig.targetX += unitOffset.ox * shift;
          rig.targetY = Math.max(0.4, rig.targetY + unitOffset.oy * shift);
          rig.targetZ += unitOffset.oz * shift;
        }
      }
    }
  }

  const unoccludedDistance =
    colliders.length > 0
      ? computeUnoccludedDistance(
          rig.targetX,
          rig.targetY,
          rig.targetZ,
          unitOffset.ox,
          unitOffset.oy,
          unitOffset.oz,
          rig.distance,
          colliders
        )
      : rig.distance;

  // Both walls and the floor shorten the same ray without consuming the player's zoom preference.
  let safeDistance = computeGroundSafeDistance(rig.targetY, rig.pitch, unoccludedDistance);
  if (groundHeight) {
    const targetFloor = groundHeight(rig.targetX, rig.targetZ);
    if (targetFloor !== null) rig.targetY = Math.max(rig.targetY, targetFloor + CAMERA_GROUND_FLOOR_Y);
    safeDistance = unoccludedDistance;
    // Shorten the camera ray before it crosses a rising slope/terrace wall.
    const samples = Math.ceil(unoccludedDistance / .15);
    for (let i = 1; i <= samples; i++) {
      const distance = i * unoccludedDistance / samples;
      const floor = groundHeight(rig.targetX + unitOffset.ox * distance, rig.targetZ + unitOffset.oz * distance);
      if (floor !== null && rig.targetY + unitOffset.oy * distance < floor + CAMERA_GROUND_FLOOR_Y) {
        safeDistance = (i - 1) * unoccludedDistance / samples;
        break;
      }
    }
  }
  const prevEffective = rig.effectiveDistance ?? rig.distance;
  let effectiveDistance: number;
  if (safeDistance <= prevEffective) {
    // Pull in immediately when occluded so the camera never sits inside a wall.
    effectiveDistance = safeDistance;
  } else {
    // Recover smoothly when the obstruction clears.
    const recoveryAlpha = 1 - Math.exp(-Math.max(6, cameraConfig.smoothing * 0.85) * clampedDt);
    effectiveDistance = Math.min(
      safeDistance,
      prevEffective + (safeDistance - prevEffective) * recoveryAlpha
    );
  }
  rig.effectiveDistance = effectiveDistance;

  rig.positionX = rig.targetX + unitOffset.ox * effectiveDistance;
  rig.positionY = Math.max(
    groundHeight ? -Infinity : CAMERA_GROUND_FLOOR_Y,
    rig.targetY + unitOffset.oy * effectiveDistance
  );
  rig.positionZ = rig.targetZ + unitOffset.oz * effectiveDistance;

  return rig;
}

export function applyCameraRigToThreeCamera(
  camera: {
    position: { set: (x: number, y: number, z: number) => unknown };
    lookAt: (x: number, y: number, z: number) => unknown;
  },
  rig: CameraRigState
): void {
  camera.position.set(rig.positionX, rig.positionY, rig.positionZ);
  camera.lookAt(rig.targetX, rig.targetY, rig.targetZ);
}
