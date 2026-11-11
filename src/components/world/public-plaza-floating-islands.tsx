"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { loadFloatingIslands } from "./plaza-floating-islands";

export function PublicPlazaFloatingIslands({ environment }: { environment: EffectiveEnvironmentSnapshot }) {
  const mount = useRef<Group>(null);
  const owned = useRef<ReturnType<typeof loadFloatingIslands> | null>(null);
  const reducedMotion = useRef(false);
  const reflection = useRef({ key: "", elapsed: 0, next: 0 });
  useEffect(() => {
    const parent = mount.current;
    if (!parent) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => { reducedMotion.current = media.matches; };
    updateMotion(); media.addEventListener("change", updateMotion);
    const collection = loadFloatingIslands(parent);
    owned.current = collection;
    reflection.current = { key: "", elapsed: 0, next: 0 };
    return () => {
      media.removeEventListener("change", updateMotion);
      collection.dispose();
      owned.current = null;
    };
  }, []);

  useFrame(({ gl, scene }, delta) => {
    if (!owned.current || document.hidden) return;
    const dt = Math.min(delta, .1);
    const dusk = environment.dayPhase === "dusk";
    for (const { water: effect } of owned.current.islands) {
      effect.setLighting(dusk, environment.isNight ? .3 : dusk ? .78 : 1);
      if (!reducedMotion.current) effect.update(dt);
    }
    const key = `${environment.lighting.skyHorizonHex}:${environment.isNight}:${environment.isRaining}:${environment.lighting.directionalIntensity.toFixed(2)}`;
    const capture = reflection.current;
    if (key !== capture.key) { capture.key = key; capture.elapsed = 0; capture.next = 0; }
    capture.elapsed += dt;
    // Let lighting settle, then spread the seven cubemaps across frames.
    const next = owned.current.islands[capture.next];
    if (next && capture.elapsed > 1.2) {
      next.water.captureEnvironment(gl, scene);
      capture.next++;
    }
  });
  return <group ref={mount} name="public-plaza-floating-islands" dispose={null} />;
}
