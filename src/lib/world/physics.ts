import type {
  Aabb2D,
  MovementInput,
  PlayerKinematicState,
  PlayerMovementConfig,
  WorldMapConfig
} from "@/lib/world/types";

const MAX_FRAME_DELTA_SECONDS = 0.1;

/** Shortest signed angle delta in (-PI, PI] for smooth character turning. */
export function shortestAngleDelta(fromRad: number, toRad: number): number {
  const twoPi = Math.PI * 2;
  const wrapped = ((((toRad - fromRad) % twoPi) + twoPi) % twoPi);

  return wrapped > Math.PI ? wrapped - twoPi : wrapped;
}

/**
 * Computes actual horizontal XZ speed (world units/second) after collision resolution
 * exclusively for driving locomotion animation, without altering kinematic control feel.
 * Guards against divide-by-zero and suppresses spawn/portal/space-switch teleports.
 */
export function computeAnimationGroundSpeed(
  prevX: number,
  prevZ: number,
  nextX: number,
  nextZ: number,
  dtSeconds: number,
  maxExpectedSpeed: number,
  teleported = false
): number {
  if (teleported || !Number.isFinite(dtSeconds) || dtSeconds <= 1e-6) {
    return 0;
  }

  const clampedDt = Math.min(dtSeconds, MAX_FRAME_DELTA_SECONDS);
  const displacement = Math.hypot(nextX - prevX, nextZ - prevZ);
  if (!Number.isFinite(displacement)) {
    return 0;
  }

  const maxPhysicalStep = Math.max(0.25, maxExpectedSpeed * clampedDt * 1.6 + 0.15);
  if (displacement > maxPhysicalStep) {
    return 0;
  }

  return displacement / clampedDt;
}

/**
 * Resolves overlap between a horizontal circle `(x, z, radius)` and an AABB.
 * Uses minimum-penetration pushout so walking diagonally into a wall slides
 * smoothly along the surface instead of sticking.
 */
export function resolveCircleAabbCollision(
  x: number,
  z: number,
  radius: number,
  box: Aabb2D
): { x: number; z: number } {
  if (box.cameraOnly || (box.minY ?? 0) > 2.2) {
    return { x, z };
  }
  const closestX = Math.max(box.minX, Math.min(x, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - closestX;
  const dz = z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) {
    return { x, z };
  }

  // Circle center is outside the box: push radially away from the nearest point.
  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;

    return {
      x: x + (dx / dist) * push,
      z: z + (dz / dist) * push
    };
  }

  // Circle center landed inside the box: push out through the shallowest face.
  const leftPen = x - box.minX + radius;
  const rightPen = box.maxX - x + radius;
  const northPen = z - box.minZ + radius;
  const southPen = box.maxZ - z + radius;
  const minPen = Math.min(leftPen, rightPen, northPen, southPen);

  if (minPen === leftPen) return { x: box.minX - radius, z };
  if (minPen === rightPen) return { x: box.maxX + radius, z };
  if (minPen === northPen) return { x, z: box.minZ - radius };

  return { x, z: box.maxZ + radius };
}

/** Creates the initial player kinematic state at the configured spawn point. */
export function createInitialPlayerState(config: WorldMapConfig): PlayerKinematicState {
  const [x, y, z] = config.spawn.position;

  return {
    x,
    y,
    z,
    velocityY: 0,
    yaw: config.spawn.yaw,
    speed: 0,
    isMoving: false,
    isRunning: false,
    isGrounded: y <= 0
  };
}

/**
 * Pure per-frame player movement (camera-relative WASD + grounded Space jump)
 * and 2D obstacle collision solver.
 * Mutates `state` in-place so `useFrame` allocates nothing per frame, and also
 * returns `state` for unit testing.
 */
export function stepPlayerKinematics(
  state: PlayerKinematicState,
  input: MovementInput,
  colliders: readonly Aabb2D[],
  bounds: WorldMapConfig["bounds"],
  movementConfig: PlayerMovementConfig,
  dtSeconds: number,
  cameraYaw = 0
): PlayerKinematicState {
  // shortcut: flat-ground y=0 vertical kinematics + 2D XZ circle-vs-AABB collision; upgrade to heightfield/BVH only when multi-floor stairs or slopes arrive.
  const dt = Math.min(Math.max(dtSeconds, 0), MAX_FRAME_DELTA_SECONDS);

  // 1. Grounded jump trigger — prevents infinite or mid-air double jumps.
  if (input.jump && state.isGrounded) {
    state.velocityY = movementConfig.jumpSpeed;
    state.isGrounded = false;
  }

  // 2. Vertical kinematics (gravity & landing on y = 0).
  if (!state.isGrounded || state.velocityY !== 0 || state.y > 0) {
    state.y += state.velocityY * dt;
    state.velocityY -= movementConfig.gravity * dt;

    if (state.y <= 0) {
      state.y = 0;
      state.velocityY = 0;
      state.isGrounded = true;
    }
  }

  // 3. Camera-relative horizontal WASD movement (works both grounded and airborne).
  const strafeInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const forwardInput = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const lengthSq = strafeInput * strafeInput + forwardInput * forwardInput;

  if (lengthSq > 0) {
    const invLen = 1 / Math.sqrt(lengthSq);
    const normStrafe = strafeInput * invLen;
    const normForward = forwardInput * invLen;

    const sinYaw = Math.sin(cameraYaw);
    const cosYaw = Math.cos(cameraYaw);

    // Camera forward on XZ is (-sinYaw, -cosYaw); camera right is (cosYaw, -sinYaw).
    const moveX = normStrafe * cosYaw - normForward * sinYaw;
    const moveZ = -normStrafe * sinYaw - normForward * cosYaw;

    const isRunning = input.sprint;
    const speed = isRunning ? movementConfig.runSpeed : movementConfig.walkSpeed;

    state.x += moveX * speed * dt;
    state.z += moveZ * speed * dt;
    state.speed = speed;
    state.isMoving = true;
    state.isRunning = isRunning;

    const targetYaw = Math.atan2(moveX, moveZ);
    const turnAlpha = 1 - Math.exp(-movementConfig.turnSmoothing * dt);
    state.yaw += shortestAngleDelta(state.yaw, targetYaw) * turnAlpha;
  } else {
    state.speed = 0;
    state.isMoving = false;
    state.isRunning = false;
  }

  // 4. Two relaxation passes keep corners stable when two colliders meet.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < colliders.length; i += 1) {
      const resolved = resolveCircleAabbCollision(
        state.x,
        state.z,
        movementConfig.radius,
        colliders[i]
      );
      state.x = resolved.x;
      state.z = resolved.z;
    }
  }

  state.x = Math.max(
    bounds.minX + movementConfig.radius,
    Math.min(bounds.maxX - movementConfig.radius, state.x)
  );
  state.z = Math.max(
    bounds.minZ + movementConfig.radius,
    Math.min(bounds.maxZ - movementConfig.radius, state.z)
  );

  return state;
}
