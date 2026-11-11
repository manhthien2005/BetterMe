"use client";

import { useEffect, useRef } from "react";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PLAZA_NATURE_MODELS, PLAZA_NATURE_PLACEMENTS, type PlazaNatureModel } from "@/lib/world/plaza-nature-layout";
import { createNatureInstances, disposeNatureResources } from "./plaza-nature-resources";

function NatureModel({ model }: { model: PlazaNatureModel }) {
  const mount = useRef<Group>(null);
  const fallback = useRef<Group>(null);
  useEffect(() => {
    const parent = mount.current;
    if (!parent) return;
    let cancelled = false;
    let owned: Group | undefined;
    const loader = new GLTFLoader();
    void loader.loadAsync(`/world/plaza-nature/${model}/model.gltf`).then(gltf => {
      if (cancelled) { disposeNatureResources(gltf.scene); return; }
      gltf.scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        for (const m of Array.isArray(object.material) ? object.material : [object.material]) {
          if (m instanceof MeshStandardMaterial) {
            m.normalScale.setScalar(.65);
            m.roughness = Math.max(.8, m.roughness);
            if (m.map) m.map.anisotropy = 4;
          }
        }
      });
      owned = createNatureInstances(gltf.scene, PLAZA_NATURE_PLACEMENTS.filter(p => p.model === model));
      // The source and instances share resources. Retain source for complete disposal.
      gltf.scene.visible = false;
      owned.add(gltf.scene);
      parent.add(owned);
      if (fallback.current) fallback.current.visible = false;
      parent.userData.assetStatus = "ready";
    }).catch(() => {
      if (!cancelled) { parent.userData.assetStatus = "failed"; console.warn(`Plaza scenery unavailable: ${model}`); }
    });
    return () => {
      cancelled = true;
      if (owned) { parent.remove(owned); disposeNatureResources(owned); }
    };
  }, [model]);
  return <group ref={mount} name={`plaza-kit-${model}`}>
    <group ref={fallback} name={`plaza-loading-${model}`}>
      {PLAZA_NATURE_PLACEMENTS.filter(p => p.model === model && (p.solidRadius || model.startsWith("tree_") || model === "fir_sapling")).map(p => (
        <mesh key={p.id} position={[p.position[0], .23, p.position[2]]} name={`plaza-fallback-${p.id}`}>
          <cylinderGeometry args={[p.solidRadius ?? .6, p.solidRadius ?? .65, .46, 12]} />
          <meshStandardMaterial color="#69755a" roughness={1} />
        </mesh>
      ))}
    </group>
  </group>;
}

export function PublicPlazaNature() {
  return <group name="public-plaza-textured-nature">{PLAZA_NATURE_MODELS.map(model => <NatureModel key={model} model={model} />)}</group>;
}
