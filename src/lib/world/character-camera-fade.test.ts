import { MToonMaterial } from "@pixiv/three-vrm";
import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, ShaderLib, Vector3, type Material, type WebGLRenderer } from "three";
import { describe, expect, it } from "vitest";

import { createCharacterCameraFade } from "@/lib/world/character-camera-fade";

function compile(material: Material) {
  const source = material instanceof MToonMaterial ? material : ShaderLib.standard;
  const shader = {
    uniforms: { ...source.uniforms },
    vertexShader: source.vertexShader,
    fragmentShader: source.fragmentShader
  } as Parameters<Material["onBeforeCompile"]>[0];
  material.onBeforeCompile(shader, {} as WebGLRenderer);
  return shader;
}

function fixture() {
  const root = new Group();
  const material = new MeshStandardMaterial();
  root.add(new Mesh(undefined, material));
  const fade = createCharacterCameraFade(root);
  return { root, material, fade, shader: compile(material) };
}

describe("character camera proximity fade", () => {
  it("clears the close view, eases coverage continuously, and restores at normal distance", () => {
    const { material, fade, shader } = fixture();
    fade.update(new Vector3(0, 1, 0.4));
    expect(shader.uniforms.characterCameraCoverage.value).toBe(0);
    expect(material.visible).toBe(false);
    fade.update(new Vector3(0, 1, 1.3));
    expect(shader.uniforms.characterCameraCoverage.value).toBeCloseTo(0.5);
    expect(material.visible).toBe(true);
    fade.update(new Vector3(0, 1, 4.8));
    expect(shader.uniforms.characterCameraCoverage.value).toBe(1);
  });

  it("measures the actual translated and jumping body, including vertical clearance", () => {
    const { root, fade, shader } = fixture();
    root.position.set(10, 3, -4);
    fade.update(new Vector3(10, 4, -3.6));
    expect(shader.uniforms.characterCameraCoverage.value).toBe(0);
    fade.update(new Vector3(10, 7, -4));
    expect(shader.uniforms.characterCameraCoverage.value).toBe(1);
  });

  it("preserves depth, cutouts and shared material baselines so hidden layers stay hidden", () => {
    const root = new Group();
    const hair = new MeshStandardMaterial({ opacity: 0.8, alphaTest: 0.5 });
    const hidden = new MeshBasicMaterial({ visible: false, transparent: true, depthWrite: false });
    root.add(new Mesh(undefined, [hair, hidden]), new Mesh(undefined, hair));
    const fade = createCharacterCameraFade(root);
    const shader = compile(hair);
    const version = hair.version;
    fade.update(new Vector3(0, 1, 1.3));
    fade.update(new Vector3(0, 1, 1.3));
    expect(shader.uniforms.characterCameraCoverage.value).toBeCloseTo(0.5);
    expect(hair.opacity).toBe(0.8);
    expect(hair.alphaTest).toBe(0.5);
    expect(hair.transparent).toBe(false);
    expect(hair.depthWrite).toBe(true);
    expect(hair.version).toBe(version);
    expect(hidden.visible).toBe(false);
    expect(hidden.transparent).toBe(true);
    expect(hidden.depthWrite).toBe(false);
  });

  it("shares one coverage mask across MToon body and outline after the VRM tick", () => {
    const root = new Group();
    const body = new MToonMaterial({ alphaTest: 0.5 });
    const outline = new MToonMaterial({ isOutline: true });
    root.add(new Mesh(undefined, [body, outline]));
    const fade = createCharacterCameraFade(root);
    const bodyShader = compile(body);
    const outlineShader = compile(outline);
    body.update(0);
    outline.update(0);
    fade.update(new Vector3(0, 1, 1.3));
    expect(bodyShader.uniforms.characterCameraCoverage.value).toBeCloseTo(0.5);
    expect(bodyShader.uniforms.characterCameraCoverage).toBe(outlineShader.uniforms.characterCameraCoverage);
    expect(body.uniforms.opacity.value).toBe(1);
    expect(body.uniforms.alphaTest.value).toBe(0.5);
    expect(body.depthWrite).toBe(true);
  });

  it("chains existing shader hooks and restores them on cleanup without retaining a faded model", () => {
    const root = new Group();
    const material = new MeshStandardMaterial();
    const originalHook: Material["onBeforeCompile"] = (shader) => { shader.uniforms.existing = { value: 42 }; };
    const originalKey = () => "existing-shader";
    material.onBeforeCompile = originalHook;
    material.customProgramCacheKey = originalKey;
    root.add(new Mesh(undefined, material));
    const fade = createCharacterCameraFade(root);
    const shader = compile(material);
    expect(shader.uniforms.existing.value).toBe(42);
    expect(material.customProgramCacheKey()).not.toBe(originalKey());
    fade.update(new Vector3(0, 1, 0.4));
    fade.restore();
    expect(shader.uniforms.characterCameraCoverage.value).toBe(1);
    expect(material.visible).toBe(true);
    expect(material.onBeforeCompile).toBe(originalHook);
    expect(material.customProgramCacheKey).toBe(originalKey);
    const replacementFade = createCharacterCameraFade(root);
    expect(compile(material).uniforms.characterCameraCoverage.value).toBe(1);
    replacementFade.restore();
  });
});
