import type { MeshStandardMaterial } from "three";

/** World-space mineral variation: no texture downloads, seams or per-frame work. */
export function applyPlazaStoneDetail(material: MeshStandardMaterial) {
  material.customProgramCacheKey = () => "plaza-stone-v1";
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vPlazaStonePosition;\n${shader.vertexShader}`.replace(
      "#include <worldpos_vertex>",
      "#include <worldpos_vertex>\nvPlazaStonePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;"
    );
    shader.fragmentShader = `
      varying vec3 vPlazaStonePosition;
      float plazaHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float plazaNoise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(plazaHash(i), plazaHash(i + vec3(1,0,0)), f.x),
                       mix(plazaHash(i + vec3(0,1,0)), plazaHash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(plazaHash(i + vec3(0,0,1)), plazaHash(i + vec3(1,0,1)), f.x),
                       mix(plazaHash(i + vec3(0,1,1)), plazaHash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      ${shader.fragmentShader}`.replace("#include <color_fragment>", `
        #include <color_fragment>
        float mineral = plazaNoise(vPlazaStonePosition * 4.0) * 0.6
                      + plazaNoise(vPlazaStonePosition * 15.0) * 0.3
                      + plazaNoise(vPlazaStonePosition * 53.0) * 0.1;
        diffuseColor.rgb *= 0.84 + mineral * 0.26;
      `);
  };
}
