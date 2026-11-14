"use client";

import { createPortal, useFrame } from "@react-three/fiber";
import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import type { Group } from "three";

import type {
  CharacterExpressionWeights,
  HumanoidPose
} from "@/lib/world/animation-state-machine";
import { resolveCharacterAssetEntry } from "@/lib/world/character-assets";
import { createLocomotionPlayer, loadLocomotionClips } from "@/lib/world/character-locomotion";
import { createActionMotionPlayer, loadActionMotion } from "@/lib/world/character-action-motion";
import {
  createCharacterCameraFade,
  type CharacterCameraFade
} from "@/lib/world/character-camera-fade";
import {
  applyPoseToVrm,
  disposeCharacterVrm,
  loadCharacterVrm,
  resetCharacterVrmSprings,
  sampleVrmBoneWorldPositions,
  type LoadedVrmCharacterRig,
  type VrmBoneWorldSnapshot
} from "@/lib/world/vrm-loader";

export type CharacterAvatarStatus = "loading" | "ready" | "fallback";

export type CharacterAvatarMetrics = {
  readonly loadTimeMs: number;
  readonly triangleCount: number;
  readonly primitiveCount: number;
  readonly humanoidBoneCount: number;
  readonly expressionCount: number;
  readonly capabilities?: LoadedVrmCharacterRig["capabilities"];
  readonly fallbackReason?: string;
  readonly locomotion?: "authored" | "procedural";
  readonly actions?: "authored" | "procedural";
};

declare global {
  interface Window {
    __READING_QUEST_ENABLE_DEBUG_TELEMETRY__?: boolean;
  }
}

function ArticulatedFallbackAvatar({
  poseRef,
  expressionsRef,
  onRegisterStepController
}: {
  poseRef: MutableRefObject<HumanoidPose>;
  expressionsRef: MutableRefObject<CharacterExpressionWeights>;
  onRegisterStepController: (step: (() => void) | null) => void;
}) {
  const hipsRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

  useLayoutEffect(() => {
    const step = () => {
      const pose = poseRef.current;
      const expr = expressionsRef.current;

      if (hipsRef.current) {
        hipsRef.current.position.y = 0.82 + pose.hipsOffsetY;
        hipsRef.current.rotation.set(
          pose.bones.hips[0],
          pose.bones.hips[1],
          pose.bones.hips[2]
        );
      }

      if (torsoRef.current) {
        torsoRef.current.rotation.set(
          pose.bones.spine[0] + pose.bones.chest[0],
          pose.bones.spine[1] + pose.bones.chest[1],
          pose.bones.spine[2] + pose.bones.chest[2]
        );
      }

      if (headRef.current) {
        headRef.current.rotation.set(
          pose.bones.head[0] + pose.bones.neck[0],
          pose.bones.head[1] + pose.bones.neck[1],
          pose.bones.head[2] + pose.bones.neck[2]
        );
        const eyeOpen = Math.max(0.15, 1 - Math.max(expr.blink, expr.happy * 0.7));
        headRef.current.scale.set(1, 0.96 + eyeOpen * 0.04, 1);
      }

      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(
          pose.bones.leftUpperArm[0],
          pose.bones.leftUpperArm[1],
          pose.bones.leftUpperArm[2] + 1.16
        );
      }

      if (rightArmRef.current) {
        const waveWeight = Math.max(
          0,
          Math.min(1, (1.02 - pose.bones.rightUpperArm[2]) / 0.77)
        );
        const locoX = pose.bones.rightUpperArm[0];
        const locoY = pose.bones.rightUpperArm[1];
        const locoZ = pose.bones.rightUpperArm[2] - 1.16;
        const waveX = -0.45;
        const waveY = 0;
        const waveZ = -2.35 + (pose.bones.rightLowerArm[2] + 1.22) * 1.1;

        rightArmRef.current.rotation.set(
          locoX + (waveX - locoX) * waveWeight,
          locoY + (waveY - locoY) * waveWeight,
          locoZ + (waveZ - locoZ) * waveWeight
        );
      }

      if (leftLegRef.current) {
        leftLegRef.current.rotation.set(
          pose.bones.leftUpperLeg[0] + pose.bones.leftLowerLeg[0] * 0.35,
          0,
          0
        );
      }

      if (rightLegRef.current) {
        rightLegRef.current.rotation.set(
          pose.bones.rightUpperLeg[0] + pose.bones.rightLowerLeg[0] * 0.35,
          0,
          0
        );
      }
    };
    onRegisterStepController(step);
    return () => onRegisterStepController(null);
  }, [expressionsRef, onRegisterStepController, poseRef]);

  return (
    <group name="character-fallback-avatar" position={[0, 0.82, 0]} ref={hipsRef}>
      {/* Left & Right Articulated Legs */}
      <group position={[0.14, -0.1, 0]} ref={leftLegRef}>
        <mesh castShadow position={[0, -0.34, 0]} receiveShadow>
          <capsuleGeometry args={[0.095, 0.44, 6, 12]} />
          <meshStandardMaterial color="#3B4252" roughness={0.78} />
        </mesh>
      </group>
      <group position={[-0.14, -0.1, 0]} ref={rightLegRef}>
        <mesh castShadow position={[0, -0.34, 0]} receiveShadow>
          <capsuleGeometry args={[0.095, 0.44, 6, 12]} />
          <meshStandardMaterial color="#3B4252" roughness={0.78} />
        </mesh>
      </group>

      {/* Torso, Collar, Backpack, Arms, and Head */}
      <group ref={torsoRef}>
        <mesh castShadow position={[0, 0.16, 0]} receiveShadow>
          <capsuleGeometry args={[0.24, 0.42, 8, 16]} />
          <meshStandardMaterial color="#D97706" roughness={0.7} />
        </mesh>

        <mesh castShadow position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.26, 0.28, 0.14, 14]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.75} />
        </mesh>

        <mesh castShadow position={[0, 0.18, -0.22]}>
          <boxGeometry args={[0.34, 0.42, 0.18]} />
          <meshStandardMaterial color="#78350F" roughness={0.85} />
        </mesh>

        {/* Left & Right Articulated Arms */}
        <group position={[0.3, 0.36, 0]} ref={leftArmRef}>
          <mesh castShadow position={[0, -0.22, 0]} receiveShadow>
            <capsuleGeometry args={[0.075, 0.34, 6, 10]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.72} />
          </mesh>
        </group>
        <group position={[-0.3, 0.36, 0]} ref={rightArmRef}>
          <mesh castShadow position={[0, -0.22, 0]} receiveShadow>
            <capsuleGeometry args={[0.075, 0.34, 6, 10]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.72} />
          </mesh>
        </group>

        {/* Head & Eyes */}
        <group position={[0, 0.72, 0]} ref={headRef}>
          <mesh castShadow>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial color="#FCD5B5" roughness={0.68} />
          </mesh>
          <mesh position={[-0.085, 0.03, 0.23]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshBasicMaterial color="#1C1917" />
          </mesh>
          <mesh position={[0.085, 0.03, 0.23]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshBasicMaterial color="#1C1917" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Decoupled 3D Character Avatar renderer.
 * Loads the VRM 1.0 character model via `loadCharacterVrm` and applies skeletal
 * poses + facial expressions each frame, falling back to `ArticulatedFallbackAvatar`
 * while loading or if the VRM asset fails to load.
 */
function CharacterAvatarInstance({
  assetUrl,
  authoredLocomotion = false,
  cameraFadeRef,
  poseRef,
  expressionsRef,
  bookColor,
  onRegisterStepController,
  onAvatarStatusChange,
  onBoneSnapshot
}: {
  assetUrl?: string;
  authoredLocomotion?: boolean;
  cameraFadeRef?: MutableRefObject<CharacterCameraFade | null>;
  bookColor?: string;
  poseRef: MutableRefObject<HumanoidPose>;
  expressionsRef: MutableRefObject<CharacterExpressionWeights>;
  onRegisterStepController?: (
    stepper: ((dtSeconds: number, resetSprings?: boolean) => void) | null
  ) => void;
  onAvatarStatusChange?: (
    status: CharacterAvatarStatus,
    metrics?: CharacterAvatarMetrics
  ) => void;
  onBoneSnapshot?: (snapshot: VrmBoneWorldSnapshot) => void;
}) {
  const resolvedUrl = assetUrl ?? resolveCharacterAssetEntry().url;
  const [loadedRig, setLoadedRig] = useState<LoadedVrmCharacterRig | null>(null);
  const rigRef = useRef<LoadedVrmCharacterRig | null>(null);
  const statusCallbackRef = useRef(onAvatarStatusChange);
  const snapshotCallbackRef = useRef(onBoneSnapshot);
  const registerStepControllerRef = useRef(onRegisterStepController);
  const snapshotFrameCountRef = useRef(0);
  const pendingSpringResetRef = useRef(true);
  const avatarRootRef = useRef<Group>(null);
  const fallbackStepRef = useRef<(() => void) | null>(null);
  const registerFallbackStep = useCallback((step: (() => void) | null) => {
    fallbackStepRef.current = step;
  }, []);

  // Install before the first rendered frame when a loaded VRM replaces the fallback.
  useLayoutEffect(() => {
    if (!avatarRootRef.current || !cameraFadeRef) return;
    const fade = createCharacterCameraFade(avatarRootRef.current);
    cameraFadeRef.current = fade;
    return () => {
      fade.restore();
      cameraFadeRef.current = null;
    };
  }, [cameraFadeRef, loadedRig]);

  useEffect(() => {
    statusCallbackRef.current = onAvatarStatusChange;
  }, [onAvatarStatusChange]);

  useEffect(() => {
    snapshotCallbackRef.current = onBoneSnapshot;
  }, [onBoneSnapshot]);

  useEffect(() => {
    registerStepControllerRef.current = onRegisterStepController;
  }, [onRegisterStepController]);

  useEffect(() => {
    let cancelled = false;
    statusCallbackRef.current?.("loading");

    // Clip loading never delays the avatar or its existing procedural fallback.
    const motionPromise = authoredLocomotion ? loadLocomotionClips() : Promise.resolve(null);
    const actionPromise = authoredLocomotion ? loadActionMotion() : Promise.resolve(null);
    loadCharacterVrm(resolvedUrl).then((outcome) => {
      if (cancelled) {
        if (outcome.ok) {
          disposeCharacterVrm(outcome.rig.vrm);
        }
        return;
      }

      if (outcome.ok) {
        rigRef.current = outcome.rig;
        pendingSpringResetRef.current = true;
        setLoadedRig(outcome.rig);
        const metrics: CharacterAvatarMetrics = {
          loadTimeMs: outcome.rig.loadTimeMs,
          triangleCount: outcome.rig.triangleCount,
          primitiveCount: outcome.rig.primitiveCount,
          humanoidBoneCount: outcome.rig.humanoidBoneCount,
          expressionCount: outcome.rig.expressionNames.length,
          capabilities: outcome.rig.capabilities,
          locomotion: "procedural"
        };
        statusCallbackRef.current?.("ready", metrics);
        void motionPromise.then(motion => {
          if (cancelled || rigRef.current !== outcome.rig || !motion) return;
          if (motion.ok) {
            outcome.rig.locomotion = createLocomotionPlayer(motion.clips, outcome.rig.restHipsY);
            statusCallbackRef.current?.("ready", { ...metrics, locomotion: "authored", actions: outcome.rig.actions ? "authored" : "procedural" });
          } else {
            console.warn("Locomotion clips unavailable; using procedural movement:", motion.reason);
          }
        });
        void actionPromise.then(action => {
          if (cancelled || rigRef.current !== outcome.rig || !action) return;
          if (action.ok) {
            outcome.rig.actions = createActionMotionPlayer(action.data, outcome.rig.restHipsY);
            statusCallbackRef.current?.("ready", { ...metrics, actions: "authored", locomotion: outcome.rig.locomotion ? "authored" : "procedural" });
          } else console.warn("Hand/jump clips unavailable; using existing poses:", action.reason);
        });
      } else {
        rigRef.current = null;
        setLoadedRig(null);
        statusCallbackRef.current?.("fallback", {
          loadTimeMs: outcome.loadTimeMs,
          triangleCount: 0,
          primitiveCount: 0,
          humanoidBoneCount: 0,
          expressionCount: 0,
          fallbackReason: outcome.reason
        });
      }
    });

    return () => {
      cancelled = true;
      if (rigRef.current) {
        disposeCharacterVrm(rigRef.current.vrm);
        rigRef.current = null;
      }
    };
  }, [resolvedUrl, authoredLocomotion]);

  useEffect(() => {
    if (!loadedRig) return;
    pendingSpringResetRef.current = true;
  }, [loadedRig]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pendingSpringResetRef.current = true;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const stepAvatar = useCallback((delta: number, resetSprings = false) => {
    if (resetSprings) {
      pendingSpringResetRef.current = true;
    }
    const activeRig = rigRef.current;
    if (!activeRig) {
      fallbackStepRef.current?.();
      return;
    }

    if (pendingSpringResetRef.current) {
      pendingSpringResetRef.current = false;
      activeRig.locomotion?.reset();
      activeRig.actions?.reset();
      applyPoseToVrm(activeRig, poseRef.current, expressionsRef.current, 0);
      resetCharacterVrmSprings(activeRig);
    } else {
      applyPoseToVrm(activeRig, poseRef.current, expressionsRef.current, delta);
    }

    if (snapshotCallbackRef.current) {
      snapshotFrameCountRef.current = (snapshotFrameCountRef.current + 1) % 12;
      const fullTelemetry =
        typeof window !== "undefined" &&
        window.__READING_QUEST_ENABLE_DEBUG_TELEMETRY__ === true;
      if (fullTelemetry || snapshotFrameCountRef.current === 1) {
        snapshotCallbackRef.current(sampleVrmBoneWorldPositions(activeRig.vrm));
      }
    }
  }, [expressionsRef, poseRef]);

  useEffect(() => {
    if (!onRegisterStepController) return;
    onRegisterStepController(stepAvatar);

    return () => {
      onRegisterStepController(null);
    };
  }, [onRegisterStepController, stepAvatar]);

  useFrame((_, delta) => {
    if (registerStepControllerRef.current) return;
    stepAvatar(delta);
  });

  return (
    <group ref={avatarRootRef}>
      {loadedRig ? (
        <primitive name="character-vrm-avatar" object={loadedRig.scene} />
      ) : (
        <ArticulatedFallbackAvatar expressionsRef={expressionsRef} poseRef={poseRef}
          onRegisterStepController={registerFallbackStep} />
      )}
      {bookColor && loadedRig?.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftHand) && createPortal(
        <group name="npc-reading-book" position={[0.04, 0.02, 0.015]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><boxGeometry args={[0.24, 0.035, 0.32]} /><meshStandardMaterial color={bookColor} /></mesh>
          <mesh position={[0, 0.023, 0]}><boxGeometry args={[0.215, 0.018, 0.295]} /><meshStandardMaterial color="#F4E3C1" /></mesh>
        </group>,
        loadedRig.vrm.humanoid.getRawBoneNode(VRMHumanBoneName.LeftHand)!
      )}
    </group>
  );
}

/** A new URL gets a new owner, so an old disposed rig cannot remain visible while loading. */
export function CharacterAvatar(props: Parameters<typeof CharacterAvatarInstance>[0]) {
  const assetUrl = props.assetUrl ?? resolveCharacterAssetEntry().url;
  return <CharacterAvatarInstance key={assetUrl} {...props} assetUrl={assetUrl} />;
}
