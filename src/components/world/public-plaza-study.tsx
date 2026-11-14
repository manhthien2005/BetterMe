"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { createPlazaStudyGeometry } from "./plaza-study-geometry";
import { applyPlazaGroundDetail } from "./plaza-ground-material";
import { positionStudyOverview } from "./plaza-study-overview";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";

export function PublicPlazaStudy({ environment }: { environment: EffectiveEnvironmentSnapshot }) {
  const batches = useMemo(() => createPlazaStudyGeometry(), []);
  const materials = useMemo(() => batches.map(({ material }) => {
    const result = new MeshStandardMaterial({
      vertexColors: true,
      roughness: material === "water" ? .3 : .87,
      metalness: material === "metal" ? .25 : 0,
      emissive: material === "glow" ? "#ffd59c" : material === "water" ? "#285e5b" : "#000000",
      emissiveIntensity: material === "water" ? .16 : .5
    });
    if (material === "stone") applyPlazaGroundDetail(result);
    return result;
  }), [batches]);

  useEffect(() => () => {
    batches.forEach(({ geometry }) => geometry.dispose());
    materials.forEach(material => material.dispose());
  }, [batches, materials]);

  useEffect(() => {
    batches.forEach(({ material }, i) => {
      if (material === "glow") materials[i].emissiveIntensity = environment.isNight ? 1.5 : .4;
    });
  }, [batches, materials, environment.isNight]);

  return <group name="plaza-layout-study">
    {batches.map(({ material, geometry }, i) => <mesh
      key={material} name={`study-${material}`} geometry={geometry} material={materials[i]}
      castShadow={material !== "water" && material !== "glow"} receiveShadow dispose={null}
    />)}
  </group>;
}

/** Finalize the overview after walking (-2), before water (0) and R3F's main render. */
export function PlazaStudyOverview() {
  const getState = useThree(state => state.get);
  useEffect(() => {
    const camera = getState().camera;
    const near = camera.near;
    // The distant overview needs depth precision for thin paving/water layers.
    camera.near = 5;
    camera.updateProjectionMatrix();
    return () => { camera.near = near; camera.updateProjectionMatrix(); };
  }, [getState]);
  useFrame(({ camera, scene, size }) => {
    positionStudyOverview(camera, scene.getObjectByName("plaza-camera-sky-rig"), size.width, size.height);
  }, -1);
  return null;
}
