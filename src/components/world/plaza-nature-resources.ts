import { Group, InstancedMesh, Matrix4, Mesh, Quaternion, Texture, Vector3, type Material, type Object3D } from "three";
import type { NaturePlacement } from "@/lib/world/plaza-nature-layout";

/** The caller owns the freshly loaded GLTF; no global cache or material clones. */
export function createNatureInstances(scene: Group, placements: readonly NaturePlacement[]): Group {
  const result = new Group();
  scene.updateMatrixWorld(true);
  scene.children.forEach((variant, variantIndex) => {
    const items = placements.filter(p => p.variant === variantIndex);
    if (!items.length) return;
    variant.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const mesh = new InstancedMesh(object.geometry, object.material, items.length);
      mesh.name = `plaza-nature-${placements[0].model}-${variantIndex}`;
      const transform = new Matrix4(), rotation = new Quaternion(), up = new Vector3(0, 1, 0);
      items.forEach((p, i) => {
        transform.compose(new Vector3(...p.position), rotation.setFromAxisAngle(up, p.yaw), new Vector3(...p.scale));
        mesh.setMatrixAt(i, transform.multiply(object.matrixWorld));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = placements[0].model !== "fern_02";
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      result.add(mesh);
    });
  });
  return result;
}

/** Disposes a whole ownership scope once, including shared maps and instance buffers. */
export function disposeNatureResources(root: Object3D) {
  const geometries = new Set<Mesh["geometry"]>(), materials = new Set<Material>(), textures = new Set<Texture>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(m);
      for (const value of Object.values(m)) if (value instanceof Texture) textures.add(value);
    }
    if (object instanceof InstancedMesh) object.dispose();
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
  textures.forEach(t => {
    t.dispose();
    // GLTFLoader uses ImageBitmap where available; releasing GPU texture is not enough.
    if (typeof ImageBitmap !== "undefined" && t.image instanceof ImageBitmap) t.image.close();
  });
}
