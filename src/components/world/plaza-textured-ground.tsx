"use client";

import { useEffect, useRef } from "react";
import { Group, Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader } from "three";
import { disposeNatureResources } from "./plaza-nature-resources";
import { createPlazaGroundGeometry } from "./plaza-textured-ground-geometry";

export function PlazaTexturedGround() {
  const ref = useRef<Group>(null);
  useEffect(() => {
    const parent = ref.current;
    if (!parent) return;
    const owned = new Group();
    const earth = new MeshStandardMaterial({ color: "#9ba783", roughness: 1 });
    const paving = new MeshStandardMaterial({ color: "#d6d3bc", roughness: .95 });
    const bed = new MeshStandardMaterial({ color: "#7d8964", roughness: 1 });
    const geometry = createPlazaGroundGeometry();
    owned.add(new Mesh(geometry.earth, earth), new Mesh(geometry.paving, paving), new Mesh(geometry.planting, bed));
    owned.traverse(o => { if (o instanceof Mesh) o.receiveShadow = true; });
    parent.add(owned);
    let cancelled = false;
    const loader = new TextureLoader();
    for (const [id, materials] of [["forest_floor", [earth, bed]], ["cobblestone_floor_08", [paving]]] as const) {
      for (const [file, slot] of [["color", "map"], ["normal", "normalMap"], ["roughness", "roughnessMap"]] as const) {
        loader.load(`/world/plaza-nature/${id}/${file}.webp`, t => {
          if (cancelled) { t.dispose(); return; }
          t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 4;
          if (slot === "map") t.colorSpace = SRGBColorSpace;
          for (const m of materials) { m[slot] = t; m.normalScale.setScalar(.45); m.needsUpdate = true; }
        }, undefined, () => { parent.userData.textureStatus = "failed"; });
      }
    }
    return () => { cancelled = true; parent.remove(owned); disposeNatureResources(owned); };
  }, []);
  return <group ref={ref} name="plaza-textured-ground" dispose={null} />;
}
