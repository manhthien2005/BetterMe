"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MeshStandardMaterial, type Mesh } from "three";

import { createPlazaLandscapeGeometry } from "./plaza-landscape-geometry";
import { applyPlazaStoneDetail } from "./plaza-stone-material";
import { PublicPlazaNature } from "./public-plaza-nature";
import { PlazaTexturedGround } from "./plaza-textured-ground";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";

export function PublicPlazaLandscape({ environment }: { environment: EffectiveEnvironmentSnapshot }) {
  const reducedMotion = useRef(false);
  const ripple = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const batches = useMemo(() => createPlazaLandscapeGeometry(), []);
  const materials = useMemo(() => batches.map(({ material }) => {
    const result = new MeshStandardMaterial({
    vertexColors: true,
    roughness: material === "water" ? 0.26 : material === "metal" ? 0.48 : 0.88,
    metalness: material === "metal" ? 0.35 : material === "water" ? 0.1 : 0,
    emissive: material === "glow" ? "#ffd192" : material === "water" ? "#28545c" : "#000000",
    emissiveIntensity: material === "glow" ? 0.35 : material === "water" ? 0.12 : 0
    });
    if (material === "stone") applyPlazaStoneDetail(result);
    return result;
  }), [batches]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = preference.matches;
    const change = () => { reducedMotion.current = preference.matches; };
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  useEffect(() => () => {
    batches.forEach(({ geometry }) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }, [batches, materials]);

  useFrame((_, delta) => {
    if (!reducedMotion.current) elapsed.current += Math.min(delta, 0.05);
    if (ripple.current) ripple.current.scale.setScalar(reducedMotion.current ? 1 : 1 + Math.sin(elapsed.current * 1.1) * 0.08);
    const glow = environment.isNight ? 1.25 : environment.dayPhase === "dusk" ? 0.8 : 0.2;
    batches.forEach(({ material }, index) => {
      if (material === "glow") materials[index].emissiveIntensity = glow;
    });
  });

  return (
    <group name="public-plaza-fantasy-landscape">
      <PlazaTexturedGround />
      <PublicPlazaNature />
      {batches.map(({ geometry, material }, index) => (
        <mesh
          key={material}
          name={`plaza-landscape-${material}`}
          geometry={geometry}
          material={materials[index]}
          castShadow={material !== "water" && material !== "glow"}
          receiveShadow
          dispose={null}
        />
      ))}
      <mesh name="plaza-water-ripple" position={[0, 0.515, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={ripple}>
        <ringGeometry args={[1.05, 1.065, 64]} />
        <meshBasicMaterial color="#d4efdf" transparent opacity={0.38} depthWrite={false} />
      </mesh>
    </group>
  );
}
