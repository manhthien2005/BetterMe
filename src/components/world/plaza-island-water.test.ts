import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, CubeCamera, Group, Mesh, MeshStandardMaterial, Points, Scene, ShaderMaterial, Vector3, type WebGLRenderer } from "three";
import { createIslandWaterEffects } from "./plaza-island-water";

function fixture() {
  const root = new Group();
  root.position.set(12, 7, -40); root.scale.setScalar(.4); root.rotation.y = .7;
  const original = new MeshStandardMaterial();
  const fall = new Mesh(new BoxGeometry(), original);
  fall.userData = { waterKind: "fall", fallStart: [1, 2, 3], fallDrift: [.5, 0, 1], fallLength: 12, fallWidth: 1 };
  root.add(fall);
  return { root, original, fall, effect: createIslandWaterEffects(root) };
}

describe("transformed island water ownership", () => {
  it("keeps spray in its island space and captures reflections at the transformed spring", () => {
    const { root, fall, effect } = fixture();
    const spray = root.children.find(child => child instanceof Points) as Points;
    expect(spray.parent).toBe(root);
    expect((spray.material as ShaderMaterial).vertexShader).toContain("modelViewMatrix*vec4(p,1.)");
    expect((spray.material as ShaderMaterial).vertexShader).not.toContain("attribute float length;");
    effect.update(.25); expect(effect.time).toBe(.25);
    const renderer = { shadowMap: { autoUpdate: true } } as WebGLRenderer;
    const update = vi.spyOn(CubeCamera.prototype, "update").mockImplementation(function(this: CubeCamera) {
      // A distant island can see across the full expanded sky diameter.
      expect((this.children[0] as import("three").PerspectiveCamera).far).toBeGreaterThanOrEqual(2772);
      expect(this.position.distanceTo(root.localToWorld(new Vector3(0, 1.1, 0)))).toBeLessThan(.00001);
      expect(fall.visible).toBe(false); expect(spray.visible).toBe(false);
      throw new Error("lost context");
    });
    expect(() => effect.captureEnvironment(renderer, new Scene())).toThrow("lost context");
    expect(fall.visible).toBe(true); expect(spray.visible).toBe(true);
    expect(renderer.shadowMap.autoUpdate).toBe(true);
    update.mockRestore(); effect.dispose();
  });

  it("disposes water-owned buffers/target, restoring borrowed GLTF materials", () => {
    const { root, original, fall, effect } = fixture();
    const spray = root.children.find(child => child instanceof Points) as Points;
    const shader = fall.material as unknown as ShaderMaterial;
    const materialDispose = vi.spyOn(shader, "dispose"), originalDispose = vi.spyOn(original, "dispose");
    const sprayDispose = vi.spyOn(spray.geometry, "dispose");
    effect.setLighting(false, .3);
    expect(shader.uniforms.brightness.value).toBe(.3);
    expect(shader.fog).toBe(true);
    effect.dispose();
    expect(fall.material).toBe(original);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(sprayDispose).toHaveBeenCalledTimes(1);
    expect(originalDispose).not.toHaveBeenCalled();
    expect(spray.parent).toBeNull();
  });
});
