import { BufferAttribute, BufferGeometry, Group, Points, ShaderMaterial, Vector3 } from "three";
import { createSceneEffects } from "./scene-effects";
import type { Clock, EffectAnchor, IslandEffects } from "./types";

export function createEffects(root: Group, anchors: EffectAnchor[], clock: Clock): IslandEffects {
  const systems: ReturnType<typeof createSceneEffects>[] = [];
  const impacts: Points<BufferGeometry, ShaderMaterial>[] = [];
  let disposed = false;
  for (const anchor of anchors.filter(anchor => anchor.kind === "lantern" || anchor.kind === "waterfall-spray")) {
    systems.push(createSceneEffects(root, [anchor], clock));
  }
  const shrubs = anchors.filter(anchor => anchor.kind === "shrub-fireflies");
  if (shrubs.length) systems.push(createSceneEffects(root, shrubs, clock));
  for (const anchor of anchors.filter(anchor => anchor.kind === "waterfall-impact")) {
    const count = 90, seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) seeds.set([(i * .618 + .13) % 1, (i * .414 + .2) % 1, (i * .732 + .1) % 1], i * 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("seed", new BufferAttribute(seeds, 3));
    const uniforms = { time: clock, day: { value: 1 }, height: { value: 800 }, radius: { value: anchor.impactRadius ?? 1 } };
    const material = new ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
      vertexShader: `attribute vec3 seed; uniform float time,height,radius; varying float fade;
       void main(){float age=fract(seed.x+time*.5);float angle=seed.y*6.283185;
        vec3 p=vec3(cos(angle)*radius*age,sin(age*3.14159)*(.3+seed.z*.8),sin(angle)*radius*age);
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        float perspectiveScale=projectionMatrix[2][3]==-1.0?1.0/max(.001,-mv.z):1.0;
        gl_PointSize=max(1.,(.04+seed.z*.04)*length(modelMatrix[0].xyz)*projectionMatrix[1][1]*height*.5*perspectiveScale);fade=sin(age*3.14159);}`,
      fragmentShader: `uniform float day;varying float fade;
       void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.1,.5,d))*fade*.55;
        gl_FragColor=vec4(vec3(.67,.84,.85)*day,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
       }`,
    });
    const points = new Points(geometry, material);
    points.position.copy(anchor.position).add(new Vector3(0, .04 * anchor.worldScale, 0));
    points.quaternion.copy(anchor.rotation); points.scale.copy(anchor.scale);
    points.frustumCulled = false; points.name = "Receiving basin spray";
    root.add(points); impacts.push(points);
  }
  return {
    setNight(night: boolean) {
      if (disposed) return;
      systems.forEach(system => system.setNight(night));
      impacts.forEach(points => { points.material.uniforms.day.value = night ? .14 : 1; });
    },
    update(height: number) {
      if (disposed) return;
      systems.forEach(system => system.update(height));
      impacts.forEach(points => { points.material.uniforms.height.value = height; });
    },
    get state() { return { systems: systems.map(system => system.state), impacts: impacts.length }; },
    dispose() {
      if (disposed) return;
      disposed = true;
      systems.forEach(system => system.dispose());
      impacts.forEach(points => { points.geometry.dispose(); points.material.dispose(); points.removeFromParent(); });
    },
  };
}
