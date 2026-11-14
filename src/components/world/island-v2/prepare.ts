import { BufferGeometry, Group, Material, Mesh, MeshStandardMaterial, Points, Quaternion, Texture, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createEffects } from "./effects";
import { createWaterSurface } from "./water-surface";
import type { Clock, EffectAnchor, EffectKind, IslandEffects, IslandKind, PreparedIslandV2 } from "./types";

export type { PreparedIslandV2 } from "./types";

interface Batch {
  material: MeshStandardMaterial;
  parts: BufferGeometry[];
  kind: IslandKind;
  land: string;
  level: number;
  landing: boolean;
}

const flowers = new Set(["chamomile", "foxglove", "bellflower", "buttercup", "clover", "cornflower", "poppy"]);
const effectKinds = new Set<EffectKind>(["lantern", "waterfall-spray", "shrub-fireflies", "waterfall-impact"]);

function kindOf(mesh: Mesh, material: MeshStandardMaterial): IslandKind {
  if (flowers.has(mesh.userData.kit)) return "flower";
  if (/leaves|petals/.test(material.name)) return "leaf";
  if (/blades/.test(material.name)) return "grass";
  if (mesh.userData.waterKind === "river") return "stream";
  const kind: unknown = mesh.userData.waterKind;
  return kind === "pool" || kind === "stream" || kind === "fall" ? kind : "solid";
}

function botanicalMaterial(material: MeshStandardMaterial, geometry: BufferGeometry, kind: IslandKind, clock: Clock, daylight: Clock) {
  if (kind !== "leaf" && kind !== "grass" && kind !== "flower") return;
  const canopy = kind === "leaf" && material.name.includes("folded broad leaves");
  material.roughness = 1; material.metalness = 0;
  if ("specularIntensity" in material) material.specularIntensity = 0;
  material.onBeforeCompile = shader => {
    shader.uniforms.studyTime = clock;
    shader.vertexShader = "uniform float studyTime; varying vec3 studyPosition;\n" + shader.vertexShader;
    // Blender wind roots reach glTF as V=1. Keep the authored UVs and volume normals.
    const wind = kind === "leaf"
      ? "transformed.x+=sin(position.y*1.8+position.z+studyTime*1.3)*.045*sin(studyTime*.7);"
      : geometry.attributes.uv ? `transformed.x+=sin(position.x*.5+position.z*.4+studyTime*1.4)*${kind === "flower" ? ".055" : ".09"}*pow(1.0-uv.y,2.0)*sin(studyTime*.7);` : "";
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\nstudyPosition=position;\n${wind}`);
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nnormal *= faceDirection;");
    if (canopy) {
      shader.uniforms.foliageSun = { value: new Vector3(-44, 72, 52).normalize() };
      shader.uniforms.studyDaylight = daylight;
      shader.fragmentShader = "uniform vec3 foliageSun; uniform float studyDaylight;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
       vec3 crownNormal=inverseTransformDirection(normal,viewMatrix);
       float throughLeaf=pow(max(0.0,dot(-crownNormal,foliageSun)),1.4);
       reflectedLight.indirectDiffuse+=diffuseColor.rgb*(vec3(.09,.12,.18)+vec3(.65,.48,.22)*throughLeaf*.35)*studyDaylight;`);
    }
  };
  material.customProgramCacheKey = () => `study-${kind}-${canopy ? "canopy" : "surface"}-${!!geometry.attributes.uv}-matte-v6`;
}

function releaseTextures(textures: Set<Texture>) {
  const images = new Set<unknown>();
  textures.forEach(texture => { texture.dispose(); images.add(texture.image); });
  images.forEach(image => {
    if (image && typeof image === "object" && "close" in image && typeof image.close === "function") image.close();
  });
}

/** Consumes source, including on failure. Placement is baked; attach root at identity. */
export function prepareIslandV2(source: Group, allWaters: Mesh[] = []): PreparedIslandV2 {
  const root = new Group(), clock = { value: 0 }, daylight = { value: 1 };
  const batches = new Map<string, Batch>(), anchors: EffectAnchor[] = [], levels = new Map<string, number>();
  const systems = new Map<string, ReturnType<typeof createWaterSurface>>(), waterMeshes: Mesh[] = [];
  const originalGeometries = new Set<BufferGeometry>(), originalMaterials = new Set<Material>(), textures = new Set<Texture>();
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), parts = new Set<BufferGeometry>();
  let effects: IslandEffects | undefined, disposed = false;
  source.traverse(object => {
    if (!(object instanceof Mesh)) return;
    originalGeometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      originalMaterials.add(material);
      Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); });
    }
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    effects?.dispose(); systems.forEach(system => system.dispose());
    root.traverse(object => {
      if (!(object instanceof Mesh || object instanceof Points)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    geometries.forEach(geometry => geometry.dispose()); parts.forEach(part => part.dispose());
    materials.forEach(material => material.dispose()); releaseTextures(textures);
    for (const mesh of waterMeshes) {
      const index = allWaters.indexOf(mesh);
      if (index >= 0) allWaters.splice(index, 1);
    }
    root.removeFromParent(); root.clear();
  }
  try {
    source.updateWorldMatrix(true, true);
    source.traverse(object => {
      if (object instanceof Mesh && object.userData.waterKind === "pool") {
        const point = new Vector3().fromBufferAttribute(object.geometry.attributes.position, 0).applyMatrix4(object.matrixWorld);
        levels.set(object.userData.landName || "default", point.y);
      }
    });
    source.traverse(object => {
      const data = object.userData;
      if (effectKinds.has(data.effectKind)) {
        const scale = object.getWorldScale(new Vector3());
        anchors.push({
          kind: data.effectKind, position: object.getWorldPosition(new Vector3()), rotation: object.getWorldQuaternion(new Quaternion()),
          scale, worldScale: Math.abs(scale.x),
          sprayLength: typeof data.sprayLength === "number" ? data.sprayLength : undefined,
          fallWidth: typeof data.fallWidth === "number" ? data.fallWidth : undefined,
          impactRadius: typeof data.impactRadius === "number" ? data.impactRadius : undefined,
        });
      }
      if (!(object instanceof Mesh)) return;
      if (!(object.material instanceof MeshStandardMaterial)) throw new Error("V2 islands require a single standard material per mesh");
      const kind = kindOf(object, object.material), land: string = data.landName || "default";
      const landing = data.fallTermination === "pool", level = levels.get(land) ?? new Vector3(0, .12, 0).applyMatrix4(source.matrixWorld).y;
      const part = object.geometry.clone(); parts.add(part);
      part.applyMatrix4(object.matrixWorld);
      if (object.matrixWorld.determinant() < 0) {
        if (!part.index) part.setIndex(Array.from({ length: part.attributes.position.count }, (_, i) => i));
        const index = part.index!;
        for (let i = 0; i < index.count; i += 3) {
          const second = index.getX(i + 1); index.setX(i + 1, index.getX(i + 2)); index.setX(i + 2, second);
        }
      }
      // V2 falls explicitly encode lip=0; V18's approved shader expects lip=1.
      if (kind === "fall" && typeof data.flowUvConvention === "string" && data.flowUvConvention.includes("lip 0")) {
        const uv = part.attributes.uv;
        if (uv) for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      }
      const key = `${object.material.uuid}:${kind}:${land}:${landing}:${!!part.index}:${Object.keys(part.attributes).sort().join(",")}`;
      if (!batches.has(key)) batches.set(key, { material: object.material, parts: [], kind, land, level, landing });
      batches.get(key)!.parts.push(part);
    });
    for (const batch of batches.values()) {
      const { kind, land, level, landing } = batch;
      const geometry = mergeGeometries(batch.parts);
      if (!geometry) throw new Error("Could not assemble V2 island geometry");
      geometries.add(geometry);
      batch.parts.forEach(part => { part.dispose(); parts.delete(part); });
      const material = batch.material.clone(); materials.add(material);
      botanicalMaterial(material, geometry, kind, clock, daylight);
      const mesh = new Mesh(geometry, material);
      // The Plaza's shadow camera covers the walkable ground, not distant islands.
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.name = `${land} ${kind}`; mesh.userData.kind = kind;
      root.add(mesh);
      if (kind === "pool" || kind === "stream" || kind === "fall") {
        let system = systems.get(land);
        if (!system) { system = createWaterSurface(clock, daylight, level, allWaters); systems.set(land, system); }
        system.add(mesh, kind, landing);
        material.dispose(); materials.delete(material); materials.add(mesh.material);
        waterMeshes.push(mesh); allWaters.push(mesh);
        mesh.userData.waterLevel = level; mesh.userData.landing = landing;
      }
    }
    effects = createEffects(root, anchors, clock);
    root.userData.anchors = anchors;
    return { root, clock, daylight, effects, waters: [...systems.values()], dispose };
  } catch (error) {
    dispose(); throw error;
  } finally {
    originalGeometries.forEach(geometry => geometry.dispose()); originalMaterials.forEach(material => material.dispose());
    // dispose() only releases GPU buffers; drop CPU arrays retained by this scope.
    batches.clear(); originalGeometries.clear(); originalMaterials.clear();
    source.removeFromParent(); source.clear();
  }
}
