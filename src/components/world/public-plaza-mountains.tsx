"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group } from "three";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { loadPlazaMountains } from "./plaza-mountains";

export function PublicPlazaMountains({ environment }: { environment: EffectiveEnvironmentSnapshot }) {
  const mount = useRef<Group>(null), owned = useRef<ReturnType<typeof loadPlazaMountains> | null>(null);
  const horizon = useMemo(() => new Color(environment.lighting.fogColorHex), [environment.lighting.fogColorHex]);
  const sky = useMemo(() => new Color(environment.lighting.skyHorizonHex)
    .lerp(new Color(environment.lighting.skyMidHex), .7), [environment.lighting.skyHorizonHex, environment.lighting.skyMidHex]);
  useEffect(() => {
    if (!mount.current) return;
    const collection = loadPlazaMountains(mount.current); owned.current = collection;
    return () => { collection.dispose(); owned.current = null; };
  }, []);
  useFrame((_, delta) => {
    const alpha = 1 - Math.exp(-4.5 * Math.min(delta, .1));
    for (const mountain of owned.current?.mountains ?? []) {
      mountain.setAtmosphere(horizon, sky, [.08, .2, .36][mountain.band] + (environment.isRaining ? .08 : 0), alpha);
    }
  });
  return <group ref={mount} name="plaza-distant-mountains" dispose={null} />;
}
