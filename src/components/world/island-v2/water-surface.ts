import { DepthTexture, DoubleSide, Frustum, HalfFloatType, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, Vector3, Vector4, WebGLRenderTarget } from "three";
import type { Camera, Object3D, Scene, WebGLRenderer } from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { Clock, WaterKind, WaterSurface } from "./types";
import { fallShader, surfaceShader, vertexShader } from "./water-shaders";

// One bed capture and reflection per land; the caller staggers lands across frames.
export function createWaterSurface(clock: Clock, daylight: Clock, level: number, allWaters: Mesh[]) {
  const meshes: Mesh[] = [];
  const frustum = new Frustum(), viewProjection = new Matrix4();
  const reflector = new Reflector(new PlaneGeometry(1, 1), { textureWidth: 512, textureHeight: 512, multisample: 0, clipBias: .001 });
  const reflectionMaterial = reflector.material as ShaderMaterial;
  // Reflector implements three arguments; the inherited Mesh type describes six.
  const renderReflection = reflector.onBeforeRender as (renderer: WebGLRenderer, scene: Scene, camera: Camera) => void;
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = level;
  reflector.updateMatrixWorld(true);
  const capture = new WebGLRenderTarget(512, 512, { type: HalfFloatType });
  capture.depthTexture = new DepthTexture(512, 512);
  const shared = {
    studyTime: clock, studyDaylight: daylight,
    sceneColor: { value: capture.texture }, sceneDepth: { value: capture.depthTexture },
    reflectionColor: { value: reflector.getRenderTarget().texture }, reflectionMatrix: { value: new Matrix4() },
    inverseProjection: { value: new Matrix4() }, cameraProjection: { value: new Matrix4() }, cameraWorld: { value: new Matrix4() }, captureView: { value: new Matrix4() },
    towardCamera: { value: new Vector3() }, towardSun: { value: new Vector3(-44, 72, 52).normalize() },
  };
  let disposed = false;
  return {
    add(mesh: Mesh, kind: WaterKind, landing = false) {
      mesh.material = new ShaderMaterial({
        name: `Vườn Gió · spring water · ${kind}`,
        uniforms: { ...shared, streamAmount: { value: kind === "stream" ? 1 : 0 }, poolLanding: { value: landing ? 1 : 0 } },
        vertexShader, fragmentShader: kind === "fall" ? fallShader : surfaceShader,
        side: DoubleSide, transparent: kind === "fall", depthWrite: kind !== "fall",
      });
      mesh.material.customProgramCacheKey = () => `study-water-${kind}-v6`;
      mesh.userData.waterKind = kind;
      mesh.renderOrder = kind === "fall" ? 3 : 2;
      meshes.push(mesh);
    },
    update(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
      if (disposed || !meshes.length) return;
      // Captures run before the main render, which normally refreshes these matrices.
      camera.updateWorldMatrix(true, false);
      frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const inView = meshes.some(mesh => {
        if (!camera.layers.test(mesh.layers)) return false;
        for (let object: Object3D | null = mesh; object; object = object.parent) {
          if (!object.visible) return false;
        }
        mesh.updateWorldMatrix(true, false);
        return frustum.intersectsObject(mesh);
      });
      if (!inView) return;
      const viewport = renderer.getViewport(new Vector4()), scissor = renderer.getScissor(new Vector4());
      const scissorTest = renderer.getScissorTest(), target = renderer.getRenderTarget();
      const shadowUpdate = renderer.shadowMap.autoUpdate, xrEnabled = renderer.xr.enabled;
      const scale = Math.min(renderer.getPixelRatio(), 512 / Math.max(1, viewport.z, viewport.w));
      const width = Math.max(1, Math.round(viewport.z * scale)), height = Math.max(1, Math.round(viewport.w * scale));
      capture.setSize(width, height); reflector.getRenderTarget().setSize(width, height);
      const hidden = [...new Set([...allWaters, ...meshes])];
      const visibility = hidden.map(mesh => mesh.visible);
      hidden.forEach(mesh => { mesh.visible = false; });
      try {
        renderer.xr.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        renderer.setScissorTest(false); renderer.setRenderTarget(capture); renderer.clear(); renderer.render(scene, camera);
        renderReflection.call(reflector, renderer, scene, camera);
        shared.reflectionMatrix.value.copy(reflectionMaterial.uniforms.textureMatrix.value).multiply(new Matrix4().copy(reflector.matrixWorld).invert());
        shared.inverseProjection.value.copy(camera.projectionMatrixInverse);
        shared.cameraProjection.value.copy(camera.projectionMatrix);
        shared.cameraWorld.value.copy(camera.matrixWorld);
        shared.captureView.value.copy(camera.matrixWorldInverse);
        camera.getWorldDirection(shared.towardCamera.value).negate();
      } finally {
        hidden.forEach((mesh, i) => { mesh.visible = visibility[i]; });
        renderer.shadowMap.autoUpdate = shadowUpdate; renderer.xr.enabled = xrEnabled;
        renderer.setRenderTarget(target); renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true; capture.dispose(); reflector.dispose(); reflector.geometry.dispose();
    },
  } satisfies WaterSurface & { add(mesh: Mesh, kind: WaterKind, landing?: boolean): void };
}
