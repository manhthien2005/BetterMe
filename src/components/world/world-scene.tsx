"use client";

import { useFrame } from "@react-three/fiber";
import { PLAZA_VIEW_FAR } from "./plaza-horizon";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject
} from "react";
import {
  type Group,
  type Mesh
} from "three";

import {
  CharacterAvatar,
  type CharacterAvatarMetrics,
  type CharacterAvatarStatus
} from "@/components/world/character-avatar";
import { PublicPlazaSummitBackdrop } from "@/components/world/public-plaza-backdrop";
import { PublicPlazaLandscape } from "@/components/world/public-plaza-landscape";
import { PublicPlazaFloatingIslands } from "@/components/world/public-plaza-floating-islands";
import { WorldSkyEnvironment } from "@/components/world/world-sky-environment";
import {
  createInitialAnimationMachineState,
  evaluateBlendedPose,
  stepAnimationStateMachine,
  type CharacterAnimationStateId,
  type CharacterExpressionWeights,
  type HumanoidPose
} from "@/lib/world/animation-state-machine";
import {
  resolveEffectiveEnvironmentSnapshot,
  type EffectiveEnvironmentSnapshot
} from "@/lib/world/environment-model";
import {
  applyCameraRigToThreeCamera,
  createInitialCameraRig,
  resetCameraOrbit,
  rotateCameraOrbit,
  stepFollowCamera,
  zoomCameraOrbit
} from "@/lib/world/camera";
import {
  computeYawTowardPoint,
  findNearestInteractableNpc,
  findNearestInteractablePortal,
  getZoneAtPosition
} from "@/lib/world/interaction";
import { collectMapColliders } from "@/lib/world/map-config";
import type { CharacterCameraFade } from "@/lib/world/character-camera-fade";
import { resolvePropAssetSlot } from "@/lib/world/ownership";
import {
  createR3fFrameWindowAccumulator,
  handleR3fVisibilityChange,
  publishHudR3fSample,
  stepR3fFrameWindowAccumulator,
  type R3fFrameRateSample
} from "@/lib/world/performance-monitor";
import {
  computeAnimationGroundSpeed,
  createInitialPlayerState,
  shortestAngleDelta,
  stepPlayerKinematics
} from "@/lib/world/physics";
import type {
  MovementInput,
  NpcDefinition,
  PersonalWorldOwnerState,
  WorldMapConfig,
  WorldPortalDefinition,
  WorldPropDefinition,
  ZoneId
} from "@/lib/world/types";
import type { VrmBoneWorldSnapshot } from "@/lib/world/vrm-loader";

export type CameraOrbitCommandBuffer = {
  deltaYaw: number;
  deltaPitch: number;
  deltaZoom: number;
  resetRequested: boolean;
};

export type WorldSceneCallbacks = {
  onZoneChange: (zoneId: ZoneId) => void;
  onNearbyNpcChange: (npcId: string | null) => void;
  onNearbyPortalChange: (portalId: string | null) => void;
  onPlayerMoveTick: (
    x: number,
    y: number,
    z: number,
    isRunning: boolean,
    isGrounded: boolean
  ) => void;
  onAnimationStateChange?: (stateId: CharacterAnimationStateId) => void;
  onAvatarStatusChange?: (
    status: CharacterAvatarStatus,
    metrics?: CharacterAvatarMetrics
  ) => void;
};

export type ReadingQuestCharacterDebugSnapshot = {
  avatarStatus: CharacterAvatarStatus;
  avatarMetrics: CharacterAvatarMetrics | null;
  animationState: CharacterAnimationStateId;
  previousAnimationState: CharacterAnimationStateId;
  blendProgress: number;
  expressions: CharacterExpressionWeights;
  playerPosition: readonly [number, number, number];
  playerYaw: number;
  activeDialogueNpcId: string | null;
  fps: number;
  minFps?: number;
  frameTimeMs?: number;
  r3fFrameSample?: R3fFrameRateSample | null;
  dpr?: number;
  rendererCalls: number;
  rendererTriangles: number;
  rendererTextures: number;
  rendererGeometries: number;
  boneWorldPositions: VrmBoneWorldSnapshot | null;
  environment?: {
    mode: "live" | "preview";
    isoDate: string;
    time24h: string;
    season: string;
    dayPhase: string;
    weatherKind: string;
    skyZenithHex: string;
    skyHorizonHex: string;
    ambientIntensity: number;
    plazaSun?: {
      azimuthRad: number;
      elevationRad: number;
      direction: readonly [number, number, number];
    } | null;
  };
};

declare global {
  interface Window {
    __READING_QUEST_CHARACTER_DEBUG__?: ReadingQuestCharacterDebugSnapshot;
  }
}

function WorldGround({
  config,
  environment
}: {
  config: WorldMapConfig;
  environment: EffectiveEnvironmentSnapshot;
}) {
  const { minX, maxX, minZ, maxZ } = config.bounds;
  const spanX = maxX - minX + 2;
  const spanZ = maxZ - minZ + 2;
  const isPublicPlaza = config.spaceId === "public_plaza";

  return (
    <group>
      {isPublicPlaza ? (
        <>
          <PublicPlazaSummitBackdrop environment={environment} />
          {/* Summit stone terrace floor & weathered stone curb connecting directly to cliff walls */}
          <mesh position={[0, -0.008, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[maxX - minX + 0.6, maxZ - minZ + 0.6]} />
            <meshStandardMaterial color="#7b806e" roughness={0.88} />
          </mesh>
          <mesh position={[0, -0.32, 0]} receiveShadow>
            <boxGeometry args={[maxX - minX + 1.0, 0.56, maxZ - minZ + 1.0]} />
            <meshStandardMaterial color="#9E9385" roughness={0.9} />
          </mesh>
        </>
      ) : (
        <>
          {/* Academy terrace lawn framing the Personal World courtyard */}
          <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[spanX + 7, spanZ + 7]} />
            <meshStandardMaterial color="#98BD86" roughness={0.92} />
          </mesh>
          <mesh position={[0, -0.75, 0]} receiveShadow>
            <boxGeometry args={[spanX + 7.4, 1.45, spanZ + 7.4]} />
            <meshStandardMaterial color="#8A7E6E" roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Distinct floor patches for the zones in this space */}
      {!isPublicPlaza && config.zones.map((zone) => (
        <mesh
          key={zone.id}
          position={[zone.patchCenter[0], zone.patchCenter[1], zone.patchCenter[2]]}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[zone.patchSize[0], zone.patchSize[1]]} />
          <meshStandardMaterial color={zone.groundColor} roughness={0.88} />
        </mesh>
      ))}

      {/* Connecting stone walkways */}
      {!isPublicPlaza && config.walkways.map((walkway) => (
        <mesh
          key={walkway.id}
          position={[walkway.position[0], walkway.position[1], walkway.position[2]]}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[walkway.size[0], walkway.size[1]]} />
          <meshStandardMaterial color={walkway.color} roughness={0.85} />
        </mesh>
      ))}

      {/* Low perimeter stone hedge framing the Personal World courtyard */}
      {!isPublicPlaza ? (
        <>
          <mesh castShadow position={[0, 0.45, minZ - 0.6]} receiveShadow>
            <boxGeometry args={[spanX, 0.9, 1.0]} />
            <meshStandardMaterial color="#6F9460" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.45, maxZ + 0.6]} receiveShadow>
            <boxGeometry args={[spanX, 0.9, 1.0]} />
            <meshStandardMaterial color="#6F9460" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[minX - 0.6, 0.45, 0]} receiveShadow>
            <boxGeometry args={[1.0, 0.9, spanZ]} />
            <meshStandardMaterial color="#6F9460" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[maxX + 0.6, 0.45, 0]} receiveShadow>
            <boxGeometry args={[1.0, 0.9, spanZ]} />
            <meshStandardMaterial color="#6F9460" roughness={0.85} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function PortalGate({
  portal,
  isHighlighted,
  hasLandscapeGate = false
}: {
  portal: WorldPortalDefinition;
  isHighlighted: boolean;
  hasLandscapeGate?: boolean;
}) {
  const crystalRef = useRef<Mesh>(null);
  const [px, py, pz] = portal.position;

  useFrame(({ clock }) => {
    if (!crystalRef.current) return;
    const t = clock.getElapsedTime();
    crystalRef.current.position.y = (hasLandscapeGate ? 5.1 : 4.15) + Math.sin(t * 2.6) * 0.12;
    crystalRef.current.rotation.y = t * 1.5;
  });

  return (
    <group position={[px, py, pz]} rotation={[0, portal.rotationY, 0]}>
      {/* Ground interaction ring */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[portal.interactionRadius - 0.14, portal.interactionRadius, 44]} />
        <meshBasicMaterial
          color={isHighlighted ? "#F59E0B" : portal.accentColor}
          opacity={isHighlighted ? 0.9 : 0.45}
          transparent
        />
      </mesh>

      {/* Left & right stone portal pillars */}
      {!hasLandscapeGate && <>
      <mesh castShadow position={[-1.8, 1.8, 0]} receiveShadow>
        <boxGeometry args={[0.9, 3.6, 0.9]} />
        <meshStandardMaterial color="#E2D3BA" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[1.8, 1.8, 0]} receiveShadow>
        <boxGeometry args={[0.9, 3.6, 0.9]} />
        <meshStandardMaterial color="#E2D3BA" roughness={0.78} />
      </mesh>

      {/* Overhead lintel arch beam */}
      <mesh castShadow position={[0, 3.65, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.55, 1.1]} />
        <meshStandardMaterial color={portal.accentColor} roughness={0.65} />
      </mesh>

      {/* Glowing translucent portal energy curtain */}
      </>}
      <mesh position={[0, 1.72, 0]}>
        <planeGeometry args={[2.6, 3.25]} />
        <meshStandardMaterial
          color={portal.accentColor}
          emissive={portal.accentColor}
          emissiveIntensity={isHighlighted ? 0.75 : 0.4}
          opacity={hasLandscapeGate ? (isHighlighted ? 0.42 : 0.18) : (isHighlighted ? 0.68 : 0.46)}
          roughness={0.2}
          side={2}
          transparent
        />
      </mesh>

      {/* Floating portal crest crystal */}
      <mesh position={[0, 4.15, 0]} ref={crystalRef}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#FDE68A"
          emissive={portal.accentColor}
          emissiveIntensity={0.65}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/**
 * Modular graybox prop renderer. Resolves `assetSlot` through `resolvePropAssetSlot`
 * so per-user upgrade tiers map cleanly to future GLB assets without changing
 * coordinates or colliders.
 */
function GrayboxProp({
  prop,
  ownerState
}: {
  prop: WorldPropDefinition;
  ownerState: PersonalWorldOwnerState | null;
}) {
  const [px, py, pz] = prop.position;
  const [sx, sy, sz] = prop.size;
  const secondary = prop.secondaryColor ?? "#E7D7BE";
  const resolvedAssetSlot = resolvePropAssetSlot(prop, ownerState);

  switch (prop.archetype) {
    case "fountain":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, 0.36, 0]} receiveShadow>
            <cylinderGeometry args={[sx * 0.5, sx * 0.54, 0.72, 16]} />
            <meshStandardMaterial color={prop.color} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.66, 0]} receiveShadow>
            <cylinderGeometry args={[sx * 0.42, sx * 0.42, 0.14, 16]} />
            <meshStandardMaterial color={secondary} metalness={0.15} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0, 1.2, 0]} receiveShadow>
            <cylinderGeometry args={[0.26, 0.38, 1.3, 12]} />
            <meshStandardMaterial color={prop.color} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 1.98, 0]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#F59E0B" emissive="#B45309" emissiveIntensity={0.25} roughness={0.3} />
          </mesh>
        </group>
      );

    case "signpost":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, sy * 0.5, 0]} receiveShadow>
            <cylinderGeometry args={[0.1, 0.12, sy, 8]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, sy - 0.35, -0.26]}>
            <boxGeometry args={[0.22, 0.24, 0.75]} />
            <meshStandardMaterial color={secondary} roughness={0.75} />
          </mesh>
          <mesh castShadow position={[0.28, sy - 0.68, 0]}>
            <boxGeometry args={[0.75, 0.22, 0.2]} />
            <meshStandardMaterial color="#D9F0D1" roughness={0.75} />
          </mesh>
          <mesh castShadow position={[-0.28, sy - 0.98, 0]}>
            <boxGeometry args={[0.75, 0.22, 0.2]} />
            <meshStandardMaterial color="#EDE9FE" roughness={0.75} />
          </mesh>
        </group>
      );

    case "tree":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, 0.85, 0]} receiveShadow>
            <cylinderGeometry args={[0.26, 0.34, 1.7, 10]} />
            <meshStandardMaterial color={secondary} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 2.25, 0]} receiveShadow>
            <dodecahedronGeometry args={[sx * 0.48, 1]} />
            <meshStandardMaterial color={prop.color} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.2, 3.15, -0.1]} receiveShadow>
            <dodecahedronGeometry args={[sx * 0.34, 1]} />
            <meshStandardMaterial color={prop.color} roughness={0.8} />
          </mesh>
        </group>
      );

    case "cottage":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, sy * 0.5, 0]} receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, sy + 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[Math.max(sx, sz) * 0.78, 1.95, 4]} />
            <meshStandardMaterial color={secondary} roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.95, pz < 5 ? sz * 0.5 + 0.03 : -(sz * 0.5 + 0.03)]}>
            <boxGeometry args={[0.95, 1.9, 0.08]} />
            <meshStandardMaterial color="#6D4325" roughness={0.85} />
          </mesh>
          <mesh position={[1.45, 1.65, pz < 5 ? sz * 0.5 + 0.03 : -(sz * 0.5 + 0.03)]}>
            <boxGeometry args={[0.85, 0.85, 0.08]} />
            <meshStandardMaterial color="#FDE68A" emissive="#F59E0B" emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        </group>
      );

    case "gazebo":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, 0.18, 0]} receiveShadow>
            <cylinderGeometry args={[sx * 0.52, sx * 0.55, 0.36, 8]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          {[
            [-1.3, -1.3],
            [1.3, -1.3],
            [-1.3, 1.3],
            [1.3, 1.3]
          ].map(([cx, cz], idx) => (
            <mesh castShadow key={idx} position={[cx, 1.55, cz]} receiveShadow>
              <cylinderGeometry args={[0.12, 0.12, 2.5, 8]} />
              <meshStandardMaterial color={prop.color} roughness={0.85} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 3.15, 0]} rotation={[0, Math.PI / 8, 0]}>
            <coneGeometry args={[sx * 0.62, 1.15, 8]} />
            <meshStandardMaterial color={secondary} roughness={0.8} />
          </mesh>
        </group>
      );

    case "bookshelf":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, sy * 0.5, 0]} receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          {[0.9, 1.8, 2.7].map((rowY) => (
            <mesh key={rowY} position={[px < 0 ? sx * 0.48 : -sx * 0.48, rowY, 0]}>
              <boxGeometry args={[0.16, 0.48, sz * 0.84]} />
              <meshStandardMaterial color={secondary} roughness={0.65} />
            </mesh>
          ))}
        </group>
      );

    case "pond":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, 0.14, 0]} receiveShadow>
            <boxGeometry args={[sx, 0.28, sz]} />
            <meshStandardMaterial color={secondary} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.29, 0]} receiveShadow>
            <boxGeometry args={[sx - 0.35, 0.05, sz - 0.35]} />
            <meshStandardMaterial color={prop.color} metalness={0.2} roughness={0.2} />
          </mesh>
        </group>
      );

    case "planter":
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, 0.28, 0]} receiveShadow>
            <boxGeometry args={[sx, 0.56, sz]} />
            <meshStandardMaterial color={prop.color} roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0, 0.68, 0]}>
            <boxGeometry args={[sx - 0.3, 0.32, sz - 0.3]} />
            <meshStandardMaterial color={secondary} roughness={0.8} />
          </mesh>
        </group>
      );

    default:
      return (
        <group name={resolvedAssetSlot} position={[px, py, pz]} rotation={[0, prop.rotationY ?? 0, 0]}>
          <mesh castShadow position={[0, sy * 0.5, 0]} receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial color={prop.color} roughness={0.82} />
          </mesh>
          {prop.archetype === "desk" || prop.archetype === "table" ? (
            <mesh castShadow position={[0.35, sy + 0.12, 0]}>
              <boxGeometry args={[0.55, 0.22, 0.42]} />
              <meshStandardMaterial color={secondary} roughness={0.65} />
            </mesh>
          ) : null}
        </group>
      );
  }
}

function NpcActor({
  npc,
  isHighlighted,
  isTalking,
  playerPositionRef
}: {
  npc: NpcDefinition;
  isHighlighted: boolean;
  isTalking: boolean;
  playerPositionRef: MutableRefObject<readonly [number, number, number]>;
}) {
  const actorGroupRef = useRef<Group>(null);
  const bodyBounceRef = useRef<Group>(null);
  const headGroupRef = useRef<Group>(null);
  const greetingArmRef = useRef<Group>(null);
  const markerRef = useRef<Mesh>(null);
  const currentYawRef = useRef(npc.rotationY);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(Math.max(delta, 0), 0.1);

    // Rotate NPC toward player when conversing, or return smoothly to default rotationY
    const targetYaw = isTalking
      ? computeYawTowardPoint(
          npc.position[0],
          npc.position[2],
          playerPositionRef.current[0],
          playerPositionRef.current[2]
        )
      : npc.rotationY;

    const turnAlpha = 1 - Math.exp(-10 * dt);
    currentYawRef.current += shortestAngleDelta(currentYawRef.current, targetYaw) * turnAlpha;

    if (actorGroupRef.current) {
      actorGroupRef.current.rotation.y = currentYawRef.current;
    }

    if (bodyBounceRef.current) {
      bodyBounceRef.current.position.y = isTalking
        ? Math.abs(Math.sin(t * 5.2)) * 0.06
        : Math.sin(t * 1.8) * 0.015;
    }

    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = isTalking ? Math.sin(t * 5.2) * 0.12 : 0;
      headGroupRef.current.rotation.z = isTalking ? Math.cos(t * 2.6) * 0.05 : 0;
    }

    if (greetingArmRef.current) {
      greetingArmRef.current.rotation.z = isTalking
        ? -0.85 + Math.sin(t * 8.5) * 0.25
        : -0.15;
    }

    if (markerRef.current) {
      markerRef.current.position.y =
        2.48 + Math.sin(t * (isTalking ? 5.2 : 2.8)) * (isTalking ? 0.15 : 0.1);
      markerRef.current.rotation.y = t * (isTalking ? 2.8 : 1.4);
      const scale = isTalking ? 1.25 : isHighlighted ? 1.1 : 1.0;
      markerRef.current.scale.set(scale, scale, scale);
    }
  });

  const ringColor = isTalking ? "#10B981" : isHighlighted ? "#F59E0B" : "#948877";
  const ringOpacity = isTalking ? 0.92 : isHighlighted ? 0.85 : 0.32;

  return (
    <group
      name={npc.assetSlot}
      position={[npc.position[0], npc.position[1], npc.position[2]]}
      ref={actorGroupRef}
      rotation={[0, npc.rotationY, 0]}
    >
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[npc.interactionRadius - 0.1, npc.interactionRadius, 40]} />
        <meshBasicMaterial color={ringColor} opacity={ringOpacity} transparent />
      </mesh>

      <group ref={bodyBounceRef}>
        <mesh castShadow position={[0, 0.68, 0]} receiveShadow>
          <cylinderGeometry args={[0.34, 0.46, 1.36, 14]} />
          <meshStandardMaterial color={npc.robeColor} roughness={0.75} />
        </mesh>

        <mesh castShadow position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.36, 0.38, 0.2, 14]} />
          <meshStandardMaterial color={npc.accentColor} roughness={0.65} />
        </mesh>

        {/* Left Arm holding tome */}
        <mesh castShadow position={[0.26, 0.95, 0.34]} rotation={[0.3, -0.2, 0]}>
          <boxGeometry args={[0.32, 0.4, 0.1]} />
          <meshStandardMaterial color={npc.accentColor} roughness={0.6} />
        </mesh>

        {/* Right Greeting Arm (raises & waves when talking to player) */}
        <group position={[-0.38, 1.18, 0.08]} ref={greetingArmRef} rotation={[0, 0, -0.15]}>
          <mesh castShadow position={[-0.08, -0.22, 0.12]}>
            <capsuleGeometry args={[0.075, 0.32, 6, 10]} />
            <meshStandardMaterial color={npc.robeColor} roughness={0.75} />
          </mesh>
        </group>

        {/* Head & Eyes */}
        <group position={[0, 1.62, 0]} ref={headGroupRef}>
          <mesh castShadow>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#FAD6B8" roughness={0.7} />
          </mesh>

          <mesh position={[-0.1, 0.03, 0.28]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#1C1917" />
          </mesh>
          <mesh position={[0.1, 0.03, 0.28]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#1C1917" />
          </mesh>
        </group>
      </group>

      <mesh position={[0, 2.48, 0]} ref={markerRef}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color={isTalking ? "#34D399" : isHighlighted ? "#FBBF24" : "#FEF3C7"}
          emissive={isTalking ? "#059669" : isHighlighted ? "#D97706" : "#B45309"}
          emissiveIntensity={isTalking ? 0.85 : isHighlighted ? 0.55 : 0.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function PlayerRig({
  config,
  movementInputRef,
  cameraCommandRef,
  activeDialogueNpcId,
  interactionWaveTrigger,
  characterAssetUrl,
  playerPositionRef,
  environment,
  callbacks
}: {
  config: WorldMapConfig;
  movementInputRef: MutableRefObject<MovementInput>;
  cameraCommandRef: MutableRefObject<CameraOrbitCommandBuffer>;
  activeDialogueNpcId: string | null;
  interactionWaveTrigger: number;
  characterAssetUrl?: string;
  playerPositionRef: MutableRefObject<readonly [number, number, number]>;
  environment: EffectiveEnvironmentSnapshot;
  callbacks: WorldSceneCallbacks;
}) {
  const colliders = useMemo(() => collectMapColliders(config), [config]);
  const playerStateRef = useRef(createInitialPlayerState(config));
  const cameraRigRef = useRef(createInitialCameraRig(config.spawn.position, config.camera));
  const animMachineRef = useRef(createInitialAnimationMachineState());
  const poseRef = useRef<HumanoidPose>(
    evaluateBlendedPose(createInitialAnimationMachineState())
  );
  const expressionsRef = useRef<CharacterExpressionWeights>(
    createInitialAnimationMachineState().expressions
  );

  const playerGroupRef = useRef<Group>(null);
  const groundRingRef = useRef<Mesh>(null);

  const lastZoneRef = useRef<ZoneId>(
    getZoneAtPosition(config.spawn.position[0], config.spawn.position[2], config.zones).id
  );
  const lastNpcRef = useRef<string | null>(null);
  const lastPortalRef = useRef<string | null>(null);
  const lastAnimStateRef = useRef<CharacterAnimationStateId>("idle");
  const lastWaveTriggerRef = useRef(interactionWaveTrigger);
  const callbacksRef = useRef(callbacks);
  const reducedMotionRef = useRef(false);

  const avatarStatusRef = useRef<CharacterAvatarStatus>("loading");
  const cameraFadeRef = useRef<CharacterCameraFade | null>(null);
  const avatarMetricsRef = useRef<CharacterAvatarMetrics | null>(null);
  const boneSnapshotRef = useRef<VrmBoneWorldSnapshot | null>(null);
  const smoothedFpsRef = useRef(60);
  const smoothedFrameTimeMsRef = useRef(16.7);
  const rollingMinFpsRef = useRef(60);
  const r3fWindowAccumulatorRef = useRef(createR3fFrameWindowAccumulator());
  const avatarStepControllerRef = useRef<
    ((dtSeconds: number, resetSprings?: boolean) => void) | null
  >(null);
  const teleportedThisFrameRef = useRef(true);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    playerStateRef.current = createInitialPlayerState(config);
    cameraRigRef.current = createInitialCameraRig(
      config.spawn.position,
      config.camera
    );
    animMachineRef.current = createInitialAnimationMachineState();
    poseRef.current = evaluateBlendedPose(animMachineRef.current);
    expressionsRef.current = animMachineRef.current.expressions;
    playerPositionRef.current = config.spawn.position;
    teleportedThisFrameRef.current = true;

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(
        config.spawn.position[0],
        config.spawn.position[1],
        config.spawn.position[2]
      );
      playerGroupRef.current.rotation.y = config.spawn.yaw;
      playerGroupRef.current.updateMatrixWorld(true);
    }

    lastZoneRef.current = getZoneAtPosition(
      config.spawn.position[0],
      config.spawn.position[2],
      config.zones
    ).id;
    lastNpcRef.current = null;
    lastPortalRef.current = null;
    lastAnimStateRef.current = "idle";
  }, [config, playerPositionRef]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onVisibilityChange = () => {
      handleR3fVisibilityChange(r3fWindowAccumulatorRef.current);
      publishHudR3fSample(null);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      publishHudR3fSample(null);
    };
  }, []);

  const handleAvatarStatusChange = useCallback(
    (status: CharacterAvatarStatus, metrics?: CharacterAvatarMetrics) => {
      avatarStatusRef.current = status;
      if (metrics) {
        avatarMetricsRef.current = metrics;
      }
      callbacksRef.current.onAvatarStatusChange?.(status, metrics);
    },
    []
  );

  const handleBoneSnapshot = useCallback((snapshot: VrmBoneWorldSnapshot) => {
    boneSnapshotRef.current = snapshot;
  }, []);

  const handleRegisterAvatarStepController = useCallback(
    (stepper: ((dtSeconds: number, resetSprings?: boolean) => void) | null) => {
      avatarStepControllerRef.current = stepper;
    },
    []
  );

  useFrame((frameState, delta) => {
    const cmd = cameraCommandRef.current;

    if (cmd.resetRequested) {
      resetCameraOrbit(cameraRigRef.current, config.camera);
      cmd.resetRequested = false;
    }
    if (cmd.deltaYaw !== 0 || cmd.deltaPitch !== 0) {
      rotateCameraOrbit(cameraRigRef.current, cmd.deltaYaw, cmd.deltaPitch, config.camera);
      cmd.deltaYaw = 0;
      cmd.deltaPitch = 0;
    }
    if (cmd.deltaZoom !== 0) {
      zoomCameraOrbit(cameraRigRef.current, cmd.deltaZoom, config.camera);
      cmd.deltaZoom = 0;
    }

    const prevX = playerStateRef.current.x;
    const prevZ = playerStateRef.current.z;
    const teleported = teleportedThisFrameRef.current;
    teleportedThisFrameRef.current = false;

    const p = stepPlayerKinematics(
      playerStateRef.current,
      movementInputRef.current,
      colliders,
      config.bounds,
      config.player,
      delta,
      cameraRigRef.current.yaw
    );

    const actualGroundSpeed = computeAnimationGroundSpeed(
      prevX,
      prevZ,
      p.x,
      p.z,
      delta,
      config.player.runSpeed,
      teleported
    );

    const waveTriggeredThisFrame =
      interactionWaveTrigger !== lastWaveTriggerRef.current &&
      interactionWaveTrigger > 0;
    if (interactionWaveTrigger !== lastWaveTriggerRef.current) {
      lastWaveTriggerRef.current = interactionWaveTrigger;
    }

    // Rotate character smoothly toward the interacted NPC when initiating dialogue or standing in conversation
    const targetNpcId = activeDialogueNpcId ?? (waveTriggeredThisFrame ? lastNpcRef.current : null);
    if (targetNpcId && !p.isMoving) {
      const targetNpc = config.npcs.find((npc) => npc.id === targetNpcId);
      if (targetNpc) {
        const desiredYaw = computeYawTowardPoint(
          p.x,
          p.z,
          targetNpc.position[0],
          targetNpc.position[2]
        );
        const clampedDt = Math.min(Math.max(delta, 0), 0.1);
        const turnAlpha = waveTriggeredThisFrame
          ? Math.min(1, 1 - Math.exp(-24 * clampedDt))
          : 1 - Math.exp(-config.player.turnSmoothing * clampedDt);
        p.yaw += shortestAngleDelta(p.yaw, desiredYaw) * turnAlpha;
      }
    }

    playerPositionRef.current = [p.x, p.y, p.z];

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y, p.z);
      playerGroupRef.current.rotation.y = p.yaw;
      playerGroupRef.current.updateMatrixWorld(true);
    }

    if (groundRingRef.current) {
      // Keep ground shadow ring anchored at y=0.03 while character jumps upward.
      groundRingRef.current.position.y = -p.y + 0.03;
      const ringScale = 1 / (1 + p.y * 0.35);
      groundRingRef.current.scale.set(ringScale, ringScale, 1);
    }

    // Step Character Animation State Machine using post-collision ground speed & single config source
    const machine = stepAnimationStateMachine(
      animMachineRef.current,
      {
        isGrounded: p.isGrounded,
        isMoving: p.isMoving,
        isRunning: p.isRunning,
        speed: actualGroundSpeed,
        velocityY: p.velocityY,
        walkSpeed: config.player.walkSpeed,
        runSpeed: config.player.runSpeed,
        jumpSpeed: config.player.jumpSpeed,
        interactRequested: waveTriggeredThisFrame,
        isDialogueOpen: Boolean(activeDialogueNpcId)
      },
      delta
    );
    poseRef.current = evaluateBlendedPose(machine, reducedMotionRef.current);
    expressionsRef.current = machine.expressions;

    // Deterministically apply pose + expressions + springbones AFTER root matrixWorld & pose are ready
    avatarStepControllerRef.current?.(delta, teleported);

    if (machine.currentState !== lastAnimStateRef.current) {
      lastAnimStateRef.current = machine.currentState;
      callbacksRef.current.onAnimationStateChange?.(machine.currentState);
    }

    const camRig = stepFollowCamera(
      cameraRigRef.current,
      p.x,
      p.y,
      p.z,
      config.camera,
      delta,
      colliders
    );

    applyCameraRigToThreeCamera(frameState.camera, camRig);
    // Canvas keeps its camera across map swaps, so update the range on that camera too.
    const viewFar = config.spaceId === "public_plaza" ? PLAZA_VIEW_FAR : 140;
    if (frameState.camera.far !== viewFar) {
      frameState.camera.far = viewFar;
      frameState.camera.updateProjectionMatrix();
    }
    cameraFadeRef.current?.update(frameState.camera.position);

    const activeZone = getZoneAtPosition(p.x, p.z, config.zones).id;
    if (activeZone !== lastZoneRef.current) {
      lastZoneRef.current = activeZone;
      callbacksRef.current.onZoneChange(activeZone);
    }

    const nearbyNpc = findNearestInteractableNpc(p.x, p.z, config.npcs);
    const nearbyNpcId = nearbyNpc?.id ?? null;
    if (nearbyNpcId !== lastNpcRef.current) {
      lastNpcRef.current = nearbyNpcId;
      callbacksRef.current.onNearbyNpcChange(nearbyNpcId);
    }

    const nearbyPortal = findNearestInteractablePortal(p.x, p.z, config.portals);
    const nearbyPortalId = nearbyPortal?.id ?? null;
    if (nearbyPortalId !== lastPortalRef.current) {
      lastPortalRef.current = nearbyPortalId;
      callbacksRef.current.onNearbyPortalChange(nearbyPortalId);
    }

    callbacksRef.current.onPlayerMoveTick(p.x, p.y, p.z, p.isRunning, p.isGrounded);

    const isTabHidden = typeof document !== "undefined" && document.hidden;
    const prevPublishedSample = r3fWindowAccumulatorRef.current.lastPublishedSample;
    const nextPublishedSample = stepR3fFrameWindowAccumulator(
      r3fWindowAccumulatorRef.current,
      delta,
      Date.now(),
      isTabHidden
    );
    if (nextPublishedSample !== prevPublishedSample) {
      publishHudR3fSample(nextPublishedSample);
    }

    if (!isTabHidden && delta > 0.0001 && Number.isFinite(delta)) {
      const instantFps = 1 / delta;
      const instantMs = delta * 1000;
      smoothedFpsRef.current = smoothedFpsRef.current * 0.9 + instantFps * 0.1;
      smoothedFrameTimeMsRef.current =
        smoothedFrameTimeMsRef.current * 0.9 + instantMs * 0.1;
      if (instantFps < rollingMinFpsRef.current) {
        rollingMinFpsRef.current = instantFps;
      } else {
        rollingMinFpsRef.current =
          rollingMinFpsRef.current * 0.985 + smoothedFpsRef.current * 0.015;
      }
    }

    if (typeof window !== "undefined") {
      const renderInfo = frameState.gl.info;
      window.__READING_QUEST_CHARACTER_DEBUG__ = {
        avatarStatus: avatarStatusRef.current,
        avatarMetrics: avatarMetricsRef.current,
        animationState: machine.currentState,
        previousAnimationState: machine.previousState,
        blendProgress: Number(machine.blendProgress.toFixed(3)),
        expressions: { ...machine.expressions },
        playerPosition: [
          Number(p.x.toFixed(3)),
          Number(p.y.toFixed(3)),
          Number(p.z.toFixed(3))
        ],
        playerYaw: Number(p.yaw.toFixed(3)),
        activeDialogueNpcId,
        fps: nextPublishedSample?.fps ?? Math.round(smoothedFpsRef.current),
        minFps: Math.round(rollingMinFpsRef.current),
        frameTimeMs:
          nextPublishedSample?.frameTimeMs ??
          Number(smoothedFrameTimeMsRef.current.toFixed(1)),
        r3fFrameSample: nextPublishedSample,
        dpr: Number(frameState.gl.getPixelRatio().toFixed(2)),
        rendererCalls: renderInfo.render.calls,
        rendererTriangles: renderInfo.render.triangles,
        rendererTextures: renderInfo.memory.textures,
        rendererGeometries: renderInfo.memory.geometries,
        boneWorldPositions: boneSnapshotRef.current,
        environment: {
          mode: environment.mode,
          isoDate: environment.isoDate,
          time24h: environment.time24h,
          season: environment.season,
          dayPhase: environment.dayPhase,
          weatherKind: environment.weatherKind,
          skyZenithHex: environment.lighting.skyZenithHex,
          skyHorizonHex: environment.lighting.skyHorizonHex,
          ambientIntensity: environment.lighting.ambientIntensity,
          plazaSun: environment.plazaSun
            ? {
                azimuthRad: Number(environment.plazaSun.azimuthRad.toFixed(4)),
                elevationRad: Number(environment.plazaSun.elevationRad.toFixed(4)),
                direction: [
                  Number(environment.plazaSun.direction[0].toFixed(4)),
                  Number(environment.plazaSun.direction[1].toFixed(4)),
                  Number(environment.plazaSun.direction[2].toFixed(4))
                ]
              }
            : null
        }
      };
    }
  });

  return (
    <group
      position={[config.spawn.position[0], config.spawn.position[1], config.spawn.position[2]]}
      ref={playerGroupRef}
      rotation={[0, config.spawn.yaw, 0]}
    >
      {/* Ground contact ring anchored on ground plane even when jumping */}
      <mesh position={[0, 0.03, 0]} ref={groundRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.44, 24]} />
        <meshBasicMaterial color="#B45309" opacity={0.55} transparent />
      </mesh>

      <CharacterAvatar
        assetUrl={characterAssetUrl}
        cameraFadeRef={cameraFadeRef}
        expressionsRef={expressionsRef}
        onAvatarStatusChange={handleAvatarStatusChange}
        onBoneSnapshot={handleBoneSnapshot}
        onRegisterStepController={handleRegisterAvatarStepController}
        poseRef={poseRef}
      />
    </group>
  );
}

export function WorldScene({
  config,
  ownerState,
  movementInputRef,
  cameraCommandRef,
  highlightedNpcId,
  highlightedPortalId,
  activeDialogueNpcId = null,
  interactionWaveTrigger = 0,
  characterAssetUrl,
  environment,
  callbacks
}: {
  config: WorldMapConfig;
  ownerState: PersonalWorldOwnerState | null;
  movementInputRef: MutableRefObject<MovementInput>;
  cameraCommandRef: MutableRefObject<CameraOrbitCommandBuffer>;
  highlightedNpcId: string | null;
  highlightedPortalId: string | null;
  activeDialogueNpcId?: string | null;
  interactionWaveTrigger?: number;
  characterAssetUrl?: string;
  environment?: EffectiveEnvironmentSnapshot;
  callbacks: WorldSceneCallbacks;
}) {
  const playerPositionRef = useRef<readonly [number, number, number]>(
    config.spawn.position
  );

  const resolvedEnvironment = useMemo(
    () =>
      environment ??
      resolveEffectiveEnvironmentSnapshot({
        liveReading: null,
        liveStatus: "idle",
        previewOverride: null,
        isPersonalSpace: config.isPersonalSpace
      }),
    [config.isPersonalSpace, environment]
  );

  return (
    <>
      <WorldSkyEnvironment
        environment={resolvedEnvironment}
        isPersonalSpace={config.isPersonalSpace}
      />

      <WorldGround config={config} environment={resolvedEnvironment} />

      {config.spaceId === "public_plaza" && <PublicPlazaLandscape environment={resolvedEnvironment} />}
      {config.spaceId === "public_plaza" && <PublicPlazaFloatingIslands environment={resolvedEnvironment} />}

      {config.portals.map((portal) => (
        <PortalGate
          hasLandscapeGate={config.spaceId === "public_plaza"}
          isHighlighted={portal.id === highlightedPortalId}
          key={portal.id}
          portal={portal}
        />
      ))}

      {config.isPersonalSpace && config.props.map((prop) => (
        <GrayboxProp
          key={prop.id}
          ownerState={config.isPersonalSpace ? ownerState : null}
          prop={prop}
        />
      ))}

      {config.npcs.map((npc) => (
        <NpcActor
          isHighlighted={npc.id === highlightedNpcId}
          isTalking={npc.id === activeDialogueNpcId}
          key={npc.id}
          npc={npc}
          playerPositionRef={playerPositionRef}
        />
      ))}

      <PlayerRig
        activeDialogueNpcId={activeDialogueNpcId}
        callbacks={callbacks}
        cameraCommandRef={cameraCommandRef}
        characterAssetUrl={characterAssetUrl}
        config={config}
        environment={resolvedEnvironment}
        interactionWaveTrigger={interactionWaveTrigger}
        movementInputRef={movementInputRef}
        playerPositionRef={playerPositionRef}
      />
    </>
  );
}
