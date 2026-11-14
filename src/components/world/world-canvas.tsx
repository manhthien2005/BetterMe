"use client";

import { Canvas } from "@react-three/fiber";
import { PLAZA_VIEW_FAR } from "./plaza-horizon";
import type { MutableRefObject } from "react";

import {
  WorldScene,
  type CameraOrbitCommandBuffer,
  type WorldSceneCallbacks
} from "@/components/world/world-scene";
import { createInitialCameraRig } from "@/lib/world/camera";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import type {
  MovementInput,
  PersonalWorldOwnerState,
  WorldMapConfig
} from "@/lib/world/types";

export function WorldCanvas({
  config,
  ownerState,
  movementInputRef,
  cameraCommandRef,
  highlightedNpcId,
  highlightedPortalId,
  activeDialogueNpcId = null,
  activeDialogueLineIndex = null,
  interactionWaveTrigger = 0,
  characterAssetUrl,
  environment,
  callbacks,
  studyOverview = false
}: {
  config: WorldMapConfig;
  ownerState: PersonalWorldOwnerState | null;
  movementInputRef: MutableRefObject<MovementInput>;
  cameraCommandRef: MutableRefObject<CameraOrbitCommandBuffer>;
  highlightedNpcId: string | null;
  highlightedPortalId: string | null;
  activeDialogueNpcId?: string | null;
  activeDialogueLineIndex?: number | null;
  interactionWaveTrigger?: number;
  characterAssetUrl?: string;
  environment?: EffectiveEnvironmentSnapshot;
  callbacks: WorldSceneCallbacks;
  studyOverview?: boolean;
}) {
  const initialRig = createInitialCameraRig(config.spawn.position, config.camera);

  return (
    <Canvas
      camera={{
        fov: config.camera.fov,
        near: 0.2,
        far: config.spaceId === "public_plaza" ? PLAZA_VIEW_FAR : 140,
        position: [initialRig.positionX, initialRig.positionY, initialRig.positionZ]
      }}
      className="h-full w-full touch-none select-none"
      dpr={[1, 2]}
      shadows
    >
      <WorldScene
        activeDialogueNpcId={activeDialogueNpcId}
        activeDialogueLineIndex={activeDialogueLineIndex}
        callbacks={callbacks}
        cameraCommandRef={cameraCommandRef}
        characterAssetUrl={characterAssetUrl}
        config={config}
        environment={environment}
        highlightedNpcId={highlightedNpcId}
        highlightedPortalId={highlightedPortalId}
        interactionWaveTrigger={interactionWaveTrigger}
        movementInputRef={movementInputRef}
        ownerState={ownerState}
        studyOverview={studyOverview}
      />
    </Canvas>
  );
}
