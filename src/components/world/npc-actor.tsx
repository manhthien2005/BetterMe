"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Group, Mesh } from "three";

import { CharacterAvatar, type CharacterAvatarStatus } from "./character-avatar";
import { resolveNpcCharacterAsset } from "@/lib/world/character-assets";
import { createNpcMotionState, isNpcPlayerNearby, npcLookPitch, stepNpcMotion } from "@/lib/world/npc-motion";
import { computeYawTowardPoint } from "@/lib/world/interaction";
import { shortestAngleDelta } from "@/lib/world/physics";
import type { NpcDefinition } from "@/lib/world/types";

export function NpcActor({ npc, isHighlighted, lineIndex, playerPositionRef }: {
  npc: NpcDefinition;
  isHighlighted: boolean;
  lineIndex: number | null;
  playerPositionRef: MutableRefObject<readonly [number, number, number]>;
}) {
  const actor = useRef<Group>(null);
  const marker = useRef<Mesh>(null);
  const [initialMotion] = useState(() => createNpcMotionState(npc.id));
  const motion = useRef(initialMotion);
  const poseRef = useRef(initialMotion.pose);
  const expressionsRef = useRef(initialMotion.expressions);
  const yaw = useRef(npc.rotationY);
  const reduced = useRef(false);
  const avatarStep = useRef<((dt: number) => void) | null>(null);
  const registerAvatarStep = useCallback((step: ((dt: number) => void) | null) => {
    avatarStep.current = step;
  }, []);
  const onAvatarStatus = useCallback((status: CharacterAvatarStatus) => {
    if (actor.current) actor.current.userData.avatarStatus = status;
  }, []);
  const talking = lineIndex !== null;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = query.matches;
    const change = () => { reduced.current = query.matches; };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  // One owner orders root -> pose -> avatar update for both VRM and fallback.
  useFrame((_, delta) => {
    const dt = Number.isFinite(delta) ? Math.min(0.1, Math.max(0, delta)) : 0;
    const [px, , pz] = playerPositionRef.current;
    const playerDistance = Math.hypot(px - npc.position[0], pz - npc.position[2]);
    const nearby = isNpcPlayerNearby(playerDistance, motion.current.playerNear);
    const target = talking || nearby
      ? computeYawTowardPoint(npc.position[0], npc.position[2], px, pz) : npc.rotationY;
    yaw.current += shortestAngleDelta(yaw.current, target) * (1 - Math.exp(-5 * dt));
    if (actor.current) {
      actor.current.rotation.y = yaw.current;
      actor.current.updateWorldMatrix(true, true);
    }
    const state = stepNpcMotion(motion.current, {
      lineIndex, playerDistance, targetYaw: shortestAngleDelta(yaw.current, target),
      targetPitch: npcLookPitch(playerPositionRef.current, npc.position),
      reducedMotion: reduced.current
    }, dt);
    poseRef.current = { ...state.pose, footGroundY: npc.position[1] };
    expressionsRef.current = state.expressions;
    avatarStep.current?.(delta);
    if (actor.current) {
      actor.current.userData.motionState = state.gesture;
      actor.current.userData.activity = state.activity;
    }
    if (marker.current) {
      marker.current.position.y = 2.2 + (reduced.current ? 0 : Math.sin(state.time * 1.8 + state.phaseOffset) * 0.035);
      marker.current.rotation.y = reduced.current ? 0 : state.time * 0.4;
      marker.current.scale.setScalar(talking ? 1.15 : isHighlighted ? 1.08 : 1);
    }
  });

  const color = talking ? "#10B981" : isHighlighted ? "#F59E0B" : "#948877";
  return (
    <group name={npc.assetSlot} position={[...npc.position]} rotation={[0, npc.rotationY, 0]} ref={actor}>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[npc.interactionRadius - 0.1, npc.interactionRadius, 40]} />
        <meshBasicMaterial color={color} opacity={talking ? 0.92 : isHighlighted ? 0.85 : 0.32} transparent />
      </mesh>
      <CharacterAvatar assetUrl={resolveNpcCharacterAsset(npc.assetSlot).url}
        poseRef={poseRef} expressionsRef={expressionsRef}
        onRegisterStepController={registerAvatarStep} onAvatarStatusChange={onAvatarStatus}
        bookColor={npc.id.includes("librarian") ? npc.accentColor : undefined} />
      <mesh name="npc-interaction-marker" position={[0, 2.2, 0]} ref={marker}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color={npc.accentColor} emissive={npc.accentColor}
          emissiveIntensity={talking ? 0.5 : 0.15} roughness={0.6} />
      </mesh>
    </group>
  );
}
