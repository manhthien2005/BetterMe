import { afterEach, describe, expect, it, vi } from "vitest";
import { Group, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector4, WebGLRenderTarget, type Camera, type WebGLRenderer } from "three";
import { prepareIslandV2 } from "./prepare";

function rendererFixture(waters: Mesh[], throwAt?: number) {
  const viewport = new Vector4(4, 6, 1600, 1000), scissor = new Vector4(10, 20, 500, 400);
  const initialTarget = new WebGLRenderTarget(32, 16);
  let target: WebGLRenderTarget | null = initialTarget, scissorTest = true;
  const captures: { target: WebGLRenderTarget | null; hidden: boolean; camera: Camera }[] = [];
  const renderer = {
    shadowMap: { autoUpdate: true }, xr: { enabled: true }, autoClear: true,
    state: { buffers: { depth: { setMask: vi.fn() } }, viewport: vi.fn() },
    getViewport: (out: Vector4) => out.copy(viewport), getScissor: (out: Vector4) => out.copy(scissor),
    getScissorTest: () => scissorTest, getRenderTarget: () => target, getPixelRatio: () => 2,
    setViewport: (value: Vector4) => { viewport.copy(value); }, setScissor: (value: Vector4) => { scissor.copy(value); },
    setScissorTest: (value: boolean) => { scissorTest = value; }, setRenderTarget: (value: WebGLRenderTarget | null) => { target = value; },
    clear: vi.fn(), render: (_scene: Scene, camera: Camera) => {
      captures.push({ target, hidden: waters.every(mesh => !mesh.visible), camera });
      if (captures.length === throwAt) throw new Error("GPU capture failed");
    },
  };
  return { renderer: renderer as unknown as WebGLRenderer, captures, initialTarget };
}

function pool(level: number) {
  const source = new Group(), mesh = new Mesh(new PlaneGeometry(4, 4), new MeshStandardMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = level;
  mesh.userData.waterKind = "pool";
  source.add(mesh);
  return source;
}

afterEach(() => vi.restoreAllMocks());

describe("V2 capture boundary", () => {
  it("skips offscreen water and captures again using the current camera transform", () => {
    const allWaters: Mesh[] = [], island = prepareIslandV2(pool(3), allWaters);
    const { renderer, captures, initialTarget } = rendererFixture(allWaters);
    const camera = new PerspectiveCamera(50, 1.6, .1, 200);
    camera.position.set(0, 8, 10); camera.lookAt(0, 8, 20);
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(0);
    camera.lookAt(0, 3, 0); // No main render/matrix update has happened yet.
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(2);
    expect((allWaters[0].material as ShaderMaterial).uniforms.captureView.value.elements).toEqual(camera.matrixWorldInverse.elements);
    camera.lookAt(0, 8, 20);
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(2);
    island.dispose(); initialTarget.dispose();
  });

  it("respects current ancestor transforms, visibility and camera layers", () => {
    const allWaters: Mesh[] = [], island = prepareIslandV2(pool(3), allWaters);
    const { renderer, captures, initialTarget } = rendererFixture(allWaters);
    const parent = new Group(); parent.add(island.root);
    const camera = new PerspectiveCamera(50, 1.6, .1, 200);
    camera.position.set(0, 8, 10); camera.lookAt(0, 3, 0); camera.updateMatrixWorld(true);
    parent.position.x = 100;
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(0);
    parent.position.x = 0; parent.visible = false;
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(0);
    parent.visible = true; allWaters[0].layers.set(1);
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(0);
    camera.layers.enable(1);
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(2);
    island.dispose();
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(2);
    initialTarget.dispose();
  });

  it("captures when a waterfall intersects the view even though its pool is outside", () => {
    const source = pool(3); source.children[0].position.x = 100;
    const fall = new Mesh(new PlaneGeometry(4, 4), new MeshStandardMaterial());
    fall.position.set(6.5, 3, 0); fall.userData.waterKind = "fall"; source.add(fall);
    const allWaters: Mesh[] = [], island = prepareIslandV2(source, allWaters);
    const { renderer, captures, initialTarget } = rendererFixture(allWaters);
    const camera = new PerspectiveCamera(60, 1, .1, 200);
    camera.position.set(0, 3, 10); camera.lookAt(0, 3, 0); camera.updateMatrixWorld(true);
    // At z=0 the right view edge is x=5.77; only the fall's left edge is visible.
    island.waters[0].update(renderer, new Scene(), camera);
    expect(captures.length).toBeGreaterThan(0);
    island.dispose(); initialTarget.dispose();
  });

  it("captures at bounded resolution with every island water hidden and a reflected perspective camera", () => {
    const allWaters: Mesh[] = [], first = prepareIslandV2(pool(3), allWaters), second = prepareIslandV2(pool(0), allWaters);
    allWaters[1].visible = false;
    const { renderer, captures, initialTarget } = rendererFixture(allWaters);
    const camera = new PerspectiveCamera(50, 1.6, .1, 200);
    camera.position.set(2, 8, 10); camera.lookAt(0, 3, 0); camera.updateMatrixWorld(true);
    first.waters[0].update(renderer, new Scene(), camera);
    expect(captures).toHaveLength(2);
    expect(captures.every(capture => capture.hidden)).toBe(true);
    expect(captures.map(capture => [capture.target?.width, capture.target?.height])).toEqual([[512, 320], [512, 320]]);
    expect(captures[1].camera).toBeInstanceOf(PerspectiveCamera);
    expect(captures[1].camera.position.y).toBeCloseTo(-2);
    expect(allWaters.map(mesh => mesh.visible)).toEqual([true, false]);
    expect(renderer.getRenderTarget()).toBe(initialTarget);
    expect(renderer.getViewport(new Vector4()).toArray()).toEqual([4, 6, 1600, 1000]);
    const uniforms = (allWaters[0].material as ShaderMaterial).uniforms;
    expect((uniforms.cameraWorld.value as Matrix4).elements).toEqual(camera.matrixWorld.elements);
    const capturedView = camera.matrixWorldInverse.clone();
    camera.position.x += 20; camera.updateMatrixWorld(true);
    expect(uniforms.captureView?.value).toBeInstanceOf(Matrix4);
    expect((uniforms.captureView.value as Matrix4).elements).toEqual(capturedView.elements);
    expect((allWaters[0].material as ShaderMaterial).fragmentShader).toContain('cameraProjection*captureView');
    const targets = captures.map(capture => capture.target!);
    const disposal = targets.map(target => vi.spyOn(target, "dispose"));
    first.dispose(); first.dispose(); second.dispose(); initialTarget.dispose();
    disposal.forEach(dispose => expect(dispose).toHaveBeenCalledTimes(1));
  });

  it.each([1, 2])("restores water visibility and renderer state if capture %i fails", throwAt => {
    const allWaters: Mesh[] = [], island = prepareIslandV2(pool(3), allWaters);
    const { renderer, initialTarget } = rendererFixture(allWaters, throwAt);
    const camera = new PerspectiveCamera(); camera.position.set(0, 8, 10); camera.lookAt(0, 3, 0); camera.updateMatrixWorld(true);
    expect(() => island.waters[0].update(renderer, new Scene(), camera)).toThrow("GPU capture failed");
    expect(allWaters[0].visible).toBe(true);
    expect(renderer.getRenderTarget()).toBe(initialTarget);
    expect(renderer.getViewport(new Vector4()).toArray()).toEqual([4, 6, 1600, 1000]);
    expect(renderer.getScissor(new Vector4()).toArray()).toEqual([10, 20, 500, 400]);
    expect(renderer.getScissorTest()).toBe(true);
    expect(renderer.shadowMap.autoUpdate).toBe(true); expect(renderer.xr.enabled).toBe(true);
    island.dispose(); initialTarget.dispose();
  });
});
