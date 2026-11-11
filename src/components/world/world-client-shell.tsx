"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent
} from "react";

import type { CharacterAvatarStatus } from "@/components/world/character-avatar";
import { useKeyboardControls } from "@/components/world/use-keyboard-controls";
import { useWorldEnvironment } from "@/components/world/use-world-environment";
import { WorldHud } from "@/components/world/world-hud";
import type {
  CameraOrbitCommandBuffer,
  WorldSceneCallbacks
} from "@/components/world/world-scene";
import type { CharacterAnimationStateId } from "@/lib/world/animation-state-machine";
import {
  getZoneAtPosition,
  isDialogueStillInRange,
  stepDialogueInteraction
} from "@/lib/world/interaction";
import { WORLD_SPACE_TEMPLATES } from "@/lib/world/map-config";
import { createPersonalWorldOwnerState } from "@/lib/world/ownership";
import type {
  AuthenticatedWorldUser,
  DialogueSession,
  WorldMapConfig,
  WorldPortalDefinition,
  WorldSpaceId,
  ZoneId
} from "@/lib/world/types";

const DynamicWorldCanvas = dynamic(
  () => import("@/components/world/world-canvas").then((mod) => mod.WorldCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-surface-page text-sm font-semibold text-ink-mid">
        Đang khởi tạo Học viện 3D...
      </div>
    )
  }
);

function isEventInsideHud(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('[data-world-hud="true"]'));
}

export function WorldClientShell({
  authenticatedUser,
  userEmail,
  initialSpaceId = "public_plaza",
  initialNowMs,
  config: configOverride,
  characterAssetUrl
}: {
  authenticatedUser?: AuthenticatedWorldUser;
  userEmail?: string;
  initialSpaceId?: WorldSpaceId;
  initialNowMs?: number;
  config?: WorldMapConfig;
  characterAssetUrl?: string;
}) {
  const resolvedUser = useMemo<AuthenticatedWorldUser>(
    () => ({
      userId: authenticatedUser?.userId ?? `user:${userEmail ?? "BetterMe"}`,
      email: authenticatedUser?.email ?? userEmail ?? "BetterMe"
    }),
    [authenticatedUser, userEmail]
  );

  const ownerState = useMemo(
    () => createPersonalWorldOwnerState(resolvedUser),
    [resolvedUser]
  );

  const [activeSpaceId, setActiveSpaceId] = useState<WorldSpaceId>(
    configOverride?.spaceId ?? initialSpaceId
  );

  const activeConfig = useMemo<WorldMapConfig>(
    () => configOverride ?? WORLD_SPACE_TEMPLATES[activeSpaceId],
    [activeSpaceId, configOverride]
  );

  const worldEnvironment = useWorldEnvironment({
    isPersonalSpace: activeConfig.isPersonalSpace,
    initialNowMs
  });

  const initialZoneId = useMemo(
    () =>
      getZoneAtPosition(
        activeConfig.spawn.position[0],
        activeConfig.spawn.position[2],
        activeConfig.zones
      ).id,
    [activeConfig]
  );

  const [activeZoneId, setActiveZoneId] = useState<ZoneId>(initialZoneId);
  const [visitedZones, setVisitedZones] = useState<ReadonlySet<ZoneId>>(
    () => new Set<ZoneId>([initialZoneId])
  );
  const [nearbyNpcId, setNearbyNpcId] = useState<string | null>(null);
  const [nearbyPortalId, setNearbyPortalId] = useState<string | null>(null);
  const [dialogueSession, setDialogueSession] = useState<DialogueSession | null>(null);
  const [animationState, setAnimationState] = useState<CharacterAnimationStateId>("idle");
  const [avatarStatus, setAvatarStatus] = useState<CharacterAvatarStatus>("loading");
  const [interactionWaveTrigger, setInteractionWaveTrigger] = useState(0);

  const nearbyNpcRef = useRef<string | null>(null);
  const nearbyPortalRef = useRef<string | null>(null);
  const dialogueSessionRef = useRef<DialogueSession | null>(null);

  const cameraCommandRef = useRef<CameraOrbitCommandBuffer>({
    deltaYaw: 0,
    deltaPitch: 0,
    deltaZoom: 0,
    resetRequested: false
  });
  const dragStateRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0
  });

  useEffect(() => {
    nearbyNpcRef.current = nearbyNpcId;
  }, [nearbyNpcId]);

  useEffect(() => {
    nearbyPortalRef.current = nearbyPortalId;
  }, [nearbyPortalId]);

  useEffect(() => {
    dialogueSessionRef.current = dialogueSession;
  }, [dialogueSession]);

  useEffect(() => {
    const stopDragging = () => {
      dragStateRef.current.active = false;
    };
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("blur", stopDragging);
    return () => {
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("blur", stopDragging);
    };
  }, []);

  const activeZone = useMemo(
    () =>
      activeConfig.zones.find((zone) => zone.id === activeZoneId) ??
      activeConfig.zones[0],
    [activeZoneId, activeConfig.zones]
  );

  const nearbyNpc = useMemo(
    () =>
      nearbyNpcId
        ? (activeConfig.npcs.find((npc) => npc.id === nearbyNpcId) ?? null)
        : null,
    [activeConfig.npcs, nearbyNpcId]
  );

  const nearbyPortal = useMemo(
    () =>
      nearbyPortalId
        ? (activeConfig.portals.find((portal) => portal.id === nearbyPortalId) ?? null)
        : null,
    [activeConfig.portals, nearbyPortalId]
  );

  const handleSwitchSpace = useCallback(
    (targetSpaceId: WorldSpaceId) => {
      const targetConfig = configOverride ?? WORLD_SPACE_TEMPLATES[targetSpaceId];
      const spawnZoneId = getZoneAtPosition(
        targetConfig.spawn.position[0],
        targetConfig.spawn.position[2],
        targetConfig.zones
      ).id;

      setActiveSpaceId(targetSpaceId);
      setActiveZoneId(spawnZoneId);
      setVisitedZones((prev) => {
        const next = new Set(prev);
        next.add(spawnZoneId);
        return next;
      });
      nearbyNpcRef.current = null;
      nearbyPortalRef.current = null;
      dialogueSessionRef.current = null;
      setNearbyNpcId(null);
      setNearbyPortalId(null);
      setDialogueSession(null);
      setAnimationState("idle");
    },
    [configOverride]
  );

  const handleUsePortal = useCallback(
    (portal: WorldPortalDefinition) => {
      handleSwitchSpace(portal.targetSpaceId);
    },
    [handleSwitchSpace]
  );

  const handleInteract = useCallback(() => {
    if (dialogueSessionRef.current) {
      const currentNearby = nearbyNpcRef.current
        ? (activeConfig.npcs.find((npc) => npc.id === nearbyNpcRef.current) ?? null)
        : null;
      const nextSession = stepDialogueInteraction(
        dialogueSessionRef.current,
        currentNearby,
        activeConfig.npcs
      );
      dialogueSessionRef.current = nextSession;
      setDialogueSession(nextSession);
      if (!nextSession) {
        setAnimationState("idle");
      }
      return;
    }

    if (nearbyPortalRef.current) {
      const portal = activeConfig.portals.find(
        (candidate) => candidate.id === nearbyPortalRef.current
      );
      if (portal) {
        handleSwitchSpace(portal.targetSpaceId);
        return;
      }
    }

    const currentNearby = nearbyNpcRef.current
      ? (activeConfig.npcs.find((npc) => npc.id === nearbyNpcRef.current) ?? null)
      : null;

    const nextSession = stepDialogueInteraction(
      dialogueSessionRef.current,
      currentNearby,
      activeConfig.npcs
    );
    dialogueSessionRef.current = nextSession;
    setDialogueSession(nextSession);

    if (nextSession) {
      setInteractionWaveTrigger((count) => count + 1);
      setAnimationState("interact");
    }
  }, [activeConfig.npcs, activeConfig.portals, handleSwitchSpace]);

  const handleCloseDialogue = useCallback(() => {
    dialogueSessionRef.current = null;
    setDialogueSession(null);
    setAnimationState("idle");
  }, []);

  const handleResetCamera = useCallback(() => {
    cameraCommandRef.current.resetRequested = true;
  }, []);

  const movementInputRef = useKeyboardControls({
    onInteract: handleInteract,
    onCancel: handleCloseDialogue,
    onResetCamera: handleResetCamera
  });

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (event.button !== 2) return;
    if (isEventInsideHud(event.target)) return;
    dragStateRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY
    };
  }, []);

  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!dragStateRef.current.active) return;
    const dx = event.clientX - dragStateRef.current.lastX;
    const dy = event.clientY - dragStateRef.current.lastY;
    dragStateRef.current.lastX = event.clientX;
    dragStateRef.current.lastY = event.clientY;

    cameraCommandRef.current.deltaYaw -= dx * 0.0065;
    cameraCommandRef.current.deltaPitch += dy * 0.005;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.active = false;
  }, []);

  const handleContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (isEventInsideHud(event.target)) return;
    event.preventDefault();
  }, []);

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLElement>) => {
    if (isEventInsideHud(event.target)) return;
    if (event.deltaY === 0) return;
    const step = Math.sign(event.deltaY) * 0.95;
    cameraCommandRef.current.deltaZoom += step;
  }, []);

  const sceneCallbacks = useMemo<WorldSceneCallbacks>(
    () => ({
      onZoneChange: (nextZoneId) => {
        setActiveZoneId(nextZoneId);
        setVisitedZones((prev) => {
          if (prev.has(nextZoneId)) return prev;
          const next = new Set(prev);
          next.add(nextZoneId);
          return next;
        });
      },
      onNearbyNpcChange: (nextNpcId) => {
        nearbyNpcRef.current = nextNpcId;
        setNearbyNpcId(nextNpcId);
      },
      onNearbyPortalChange: (nextPortalId) => {
        nearbyPortalRef.current = nextPortalId;
        setNearbyPortalId(nextPortalId);
      },
      onPlayerMoveTick: (x, _y, z) => {
        const currentDialogue = dialogueSessionRef.current;
        if (
          currentDialogue &&
          !isDialogueStillInRange(currentDialogue, x, z, activeConfig.npcs)
        ) {
          dialogueSessionRef.current = null;
          setDialogueSession(null);
          setAnimationState("idle");
        }
      },
      onAnimationStateChange: (nextAnimState) => {
        setAnimationState(nextAnimState);
      },
      onAvatarStatusChange: (nextStatus) => {
        setAvatarStatus(nextStatus);
      }
    }),
    [activeConfig.npcs]
  );

  return (
    <main
      aria-label="Không gian 3D Reading Quest"
      className="relative h-screen w-screen overflow-hidden bg-surface-page"
      data-animation-state={animationState}
      data-avatar-status={avatarStatus}
      data-day-phase={worldEnvironment.snapshot.dayPhase}
      data-environment-mode={worldEnvironment.snapshot.mode}
      data-owner-id={ownerState.ownerUserId}
      data-season={worldEnvironment.snapshot.season}
      data-space-id={activeSpaceId}
      data-weather-kind={worldEnvironment.snapshot.weatherKind}
      data-zone-id={activeZone.id}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <DynamicWorldCanvas
        activeDialogueNpcId={dialogueSession?.npcId ?? null}
        callbacks={sceneCallbacks}
        cameraCommandRef={cameraCommandRef}
        characterAssetUrl={characterAssetUrl}
        config={activeConfig}
        environment={worldEnvironment.snapshot}
        highlightedNpcId={nearbyNpcId}
        highlightedPortalId={nearbyPortalId}
        interactionWaveTrigger={interactionWaveTrigger}
        movementInputRef={movementInputRef}
        ownerState={activeSpaceId === "personal_world" ? ownerState : null}
      />

      <WorldHud
        activeSpaceId={activeSpaceId}
        activeZone={activeZone}
        allNpcs={activeConfig.npcs}
        animationState={animationState}
        avatarStatus={avatarStatus}
        dialogueSession={dialogueSession}
        environment={worldEnvironment.snapshot}
        nearbyNpc={nearbyNpc}
        nearbyPortal={nearbyPortal}
        onApplyPreset={worldEnvironment.applyPreset}
        onCloseDialogue={handleCloseDialogue}
        onEnablePreview={worldEnvironment.enablePreview}
        onExitPreview={worldEnvironment.exitPreview}
        onInteract={handleInteract}
        onResetCamera={handleResetCamera}
        onSwitchSpace={handleSwitchSpace}
        onUpdatePreview={worldEnvironment.updatePreview}
        onUsePortal={handleUsePortal}
        ownerState={ownerState}
        previewOverride={worldEnvironment.previewOverride}
        spaceTitle={activeConfig.title}
        visitedZones={visitedZones}
      />
    </main>
  );
}
