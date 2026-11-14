import {
  Color, Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Vector3, type BufferGeometry
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import manifest from "../../../public/world/mountains/manifest.json";
import { MOUNTAIN_PLACEMENTS, type MountainPlacement } from "./plaza-mountain-layout";
import { disposeNatureResources } from "./plaza-nature-resources";

export { MOUNTAIN_PLACEMENTS, type MountainPlacement } from "./plaza-mountain-layout";
export const MOUNTAIN_MODELS = manifest.models;
type MountainModel = { id: string; bounds: number[][] };
export type MountainCollection = {
  models: MountainModel[]; placements: MountainPlacement[]; assetPath: string;
};

/** One GLTF owns all its shared instance resources for one Plaza visit. */
export function createMountainInstances(source: Group, model: MountainModel, allPlacements: MountainPlacement[] = MOUNTAIN_PLACEMENTS) {
  const root = new Group(); root.name = `plaza-mountain-${model.id}`;
  const placements = allPlacements.filter(p => p.model === model.id);
  const band = placements[0].band;
  const uniforms = {
    mountainHorizon: { value: new Color("#c9dce7") },
    mountainSky: { value: new Color("#79b6e0") },
    mountainHaze: { value: [.08, .2, .36][band] },
    mountainHeight: { value: model.bounds[1][1] }
  };
  const batches = new Map<string, { material: MeshStandardMaterial; snowEligible: boolean; parts: BufferGeometry[] }>();
  source.updateMatrixWorld(true);
  try {
    source.traverse(object => {
      if (!(object instanceof Mesh)) return;
      if (!(object.material instanceof MeshStandardMaterial)) throw new Error("Unexpected mountain material");
      const snowEligible = object.userData.mountainRole === "rock";
      const key = `${snowEligible}:${object.material.uuid}:${Object.keys(object.geometry.attributes).sort().join(",")}`;
      let batch = batches.get(key);
      if (!batch) { batch = { material: object.material, snowEligible, parts: [] }; batches.set(key, batch); }
      batch.parts.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
    });
    for (const { material, snowEligible, parts } of batches.values()) {
      const geometry = mergeGeometries(parts);
      if (!geometry) throw new Error("Cannot batch mountain geometry");
      geometry.setAttribute("mountainSnow", new InstancedBufferAttribute(new Float32Array(placements.map(p => snowEligible ? p.snow : 0)), 1));
      const mesh = new InstancedMesh(geometry, material, placements.length);
      mesh.name = `mountain-batch-${model.id}`;
      mesh.castShadow = false; mesh.receiveShadow = false;
      // The local scene fog ends at 92m; these mountains use their own depth haze.
      // Terrain stays opaque: alpha fading breaks occlusion within instanced batches.
      material.fog = false; material.transparent = false; material.depthWrite = true; material.forceSinglePass = true;
      material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = `attribute float mountainSnow;
          varying vec3 mountainLocal; varying vec3 mountainNormal;
          varying float mountainWorldY; varying float snowAmount;\n` + shader.vertexShader
          .replace("#include <begin_vertex>", `#include <begin_vertex>
            mountainLocal = position; mountainNormal = normal; snowAmount = mountainSnow;
            mountainWorldY = (modelMatrix * instanceMatrix * vec4(position, 1.0)).y;`);
        shader.fragmentShader = `uniform vec3 mountainHorizon; uniform vec3 mountainSky;
          uniform float mountainHaze; uniform float mountainHeight;
          varying vec3 mountainLocal; varying vec3 mountainNormal;
          varying float mountainWorldY; varying float snowAmount;\n` + shader.fragmentShader
          .replace("#include <color_fragment>", `#include <color_fragment>
            float brokenEdge = sin(mountainLocal.x * .29 + sin(mountainLocal.z * .18) * 2.0) * .025
              + sin(mountainLocal.z * .51 + mountainLocal.x * .11) * .015;
            float snow = smoothstep(.65 + brokenEdge, .85 + brokenEdge, mountainLocal.y / mountainHeight)
              * smoothstep(.02, .48, normalize(mountainNormal).y) * snowAmount;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.88, .92, .94), snow);`)
          // Sky is not tone-mapped; blend its linear colors after terrain tone mapping.
          .replace("#include <colorspace_fragment>", `gl_FragColor.rgb = mix(gl_FragColor.rgb, mountainSky, mountainHaze);
            float valleyHaze = 1.0 - smoothstep(-48.0, -18.0, mountainWorldY);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mountainHorizon, valleyHaze);
            #include <colorspace_fragment>`);
        if (/leaves/i.test(material.name)) {
          shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>",
            "#include <normal_fragment_begin>\nnormal *= faceDirection;");
        }
      };
      material.customProgramCacheKey = () => `plaza-mountain-opaque-haze-v4-${/leaves/i.test(material.name)}`;
      const matrix = new Matrix4(), rotation = new Quaternion(), up = new Vector3(0, 1, 0);
      placements.forEach((p, i) => {
        matrix.compose(new Vector3(...p.position), rotation.setFromAxisAngle(up, p.yaw), new Vector3(...p.scale));
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
      root.add(mesh);
    }
  } catch (error) {
    root.add(source); disposeNatureResources(root); throw error;
  } finally { batches.forEach(b => b.parts.forEach(p => p.dispose())); }
  root.userData.placements = placements;
  let disposed = false, lightingReady = false;
  return {
    root, uniforms, band,
    setAtmosphere(horizon: Color, sky: Color, haze: number, alpha: number) {
      if (lightingReady) {
        uniforms.mountainHorizon.value.lerp(horizon, alpha);
        uniforms.mountainSky.value.lerp(sky, alpha);
      } else {
        uniforms.mountainHorizon.value.copy(horizon);
        uniforms.mountainSky.value.copy(sky);
        lightingReady = true;
      }
      uniforms.mountainHaze.value = haze;
    },
    dispose() {
      if (disposed) return; disposed = true;
      root.add(source); disposeNatureResources(root); root.clear();
    }
  };
}

export function loadPlazaMountains(parent: Group, collection: MountainCollection = {
  models: MOUNTAIN_MODELS, placements: MOUNTAIN_PLACEMENTS, assetPath: "/world/mountains"
}) {
  const mountains: ReturnType<typeof createMountainInstances>[] = [];
  let cancelled = false;
  const { models, placements, assetPath } = collection;
  parent.userData.layers = [0, 1, 2].map(band => placements.filter(p => p.band === band).length);
  parent.userData.assetStatus = "loading"; parent.userData.failedAssets = [];
  const loader = new GLTFLoader();
  const settled = Promise.all(models.map(async model => {
    try {
      const gltf = await loader.loadAsync(`${assetPath}/${model.id}.glb`);
      if (cancelled) { disposeNatureResources(gltf.scene); return; }
      const owned = createMountainInstances(gltf.scene, model, placements);
      mountains.push(owned); parent.add(owned.root);
    } catch {
      if (!cancelled) {
        parent.userData.failedAssets.push(model.id);
        console.warn(`Plaza mountain scenery unavailable: ${model.id}`);
      }
    }
  })).then(() => {
    if (!cancelled) parent.userData.assetStatus = mountains.length === models.length ? "ready" : mountains.length ? "partial" : "failed";
  });
  return {
    mountains, settled,
    dispose() {
      if (cancelled) return; cancelled = true;
      mountains.forEach(m => { parent.remove(m.root); m.dispose(); }); mountains.length = 0;
    }
  };
}
