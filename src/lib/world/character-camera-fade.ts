import { Mesh, Vector3, type Material, type Object3D } from "three";

const FADE_START_DISTANCE = 2;
const FADE_END_DISTANCE = 0.6;

// Every layer discards the same pixels, so hair/outline cannot show through the body.
// Screen-space noise stays still when idle, including under reduced motion.
const COVERAGE_FRAGMENT = `
if (characterCameraCoverage < 1.0) {
  float threshold = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
  if (threshold >= characterCameraCoverage) discard;
}
`;

export type CharacterCameraFade = ReturnType<typeof createCharacterCameraFade>;

export function createCharacterCameraFade(root: Object3D) {
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (object instanceof Mesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
      }
    }
  });
  const coverage = { value: 1 };
  const originals = Array.from(materials, (material) => ({
    material,
    visible: material.visible,
    onBeforeCompile: material.onBeforeCompile,
    customProgramCacheKey: material.customProgramCacheKey,
    programKey: material.customProgramCacheKey()
  }));
  for (const original of originals) {
    const { material } = original;
    material.onBeforeCompile = (shader, renderer) => {
      original.onBeforeCompile.call(material, shader, renderer);
      shader.uniforms.characterCameraCoverage = coverage;
      shader.fragmentShader = `uniform float characterCameraCoverage;\n${shader.fragmentShader}`
        .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\n${COVERAGE_FRAGMENT}`);
    };
    material.customProgramCacheKey = () => `${original.programKey}:character-camera-coverage-v1`;
    material.needsUpdate = true;
  }
  const bodyPosition = new Vector3();

  return {
    update(cameraPosition: Vector3) {
      root.getWorldPosition(bodyPosition);
      // Distance to the standing body segment also handles low orbit angles and jumping.
      bodyPosition.y = Math.max(bodyPosition.y + 0.2, Math.min(bodyPosition.y + 1.7, cameraPosition.y));
      const distance = cameraPosition.distanceTo(bodyPosition);
      const t = Math.max(0, Math.min(1,
        (distance - FADE_END_DISTANCE) / (FADE_START_DISTANCE - FADE_END_DISTANCE)
      ));
      coverage.value = t * t * (3 - 2 * t);
      for (const { material, visible } of originals) {
        material.visible = visible && coverage.value > 0;
      }
    },
    restore() {
      coverage.value = 1;
      for (const original of originals) {
        original.material.visible = original.visible;
        original.material.onBeforeCompile = original.onBeforeCompile;
        original.material.customProgramCacheKey = original.customProgramCacheKey;
        original.material.needsUpdate = true;
      }
    }
  };
}
