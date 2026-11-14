"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { loadFloatingIslands } from "./plaza-floating-islands";
import { createIslandFrameState, stepIslandEffects } from "./plaza-floating-island-frame";

export function PublicPlazaFloatingIslands({ environment }: { environment: EffectiveEnvironmentSnapshot }) {
  const mount = useRef<Group>(null);
  const owned = useRef<ReturnType<typeof loadFloatingIslands> | null>(null);
  const reducedMotion = useRef(false);
  const frame = useRef(createIslandFrameState());
  useEffect(() => {
    const parent = mount.current;
    if (!parent) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => { reducedMotion.current = media.matches; };
    updateMotion(); media.addEventListener("change", updateMotion);
    const collection = loadFloatingIslands(parent);
    owned.current = collection;
    frame.current = createIslandFrameState();
    return () => {
      media.removeEventListener("change", updateMotion);
      collection.dispose();
      owned.current = null;
    };
  }, []);

  useFrame(({ gl, scene, camera, size }, delta) => {
    if (!owned.current) return;
    const water = stepIslandEffects(frame.current, owned.current.islands, delta,
      reducedMotion.current, document.hidden, size.height * gl.getPixelRatio(),
      environment.isNight, environment.dayPhase === "dusk");
    // At most one bounded reflection/bed pair per interval across the entire collection.
    // Offscreen slots stay empty, reducing work without increasing other waters' cadence.
    water?.update(gl, scene, camera);
  });
  return <group ref={mount} name="public-plaza-floating-islands" dispose={null} />;
}
