import type { MeshStandardMaterial } from "three";
import { applyPlazaStoneDetail } from "./plaza-stone-material";

/** Study ground only: 0 keeps the existing stone, 1 paving, 2 masonry, 3 bedrock. */
export function applyPlazaGroundDetail(material:MeshStandardMaterial) {
  applyPlazaStoneDetail(material);
  const mineralDetail=material.onBeforeCompile;
  material.customProgramCacheKey=()=>"plaza-ground-v1";
  material.onBeforeCompile=(shader,renderer)=>{
    mineralDetail(shader,renderer);
    shader.vertexShader=`attribute float groundStyle;
      varying float vPlazaGroundStyle;
      varying vec3 vPlazaGroundNormal;
      ${shader.vertexShader}`.replace("#include <begin_vertex>",`#include <begin_vertex>
        vPlazaGroundStyle=groundStyle;
        vPlazaGroundNormal=normalize(mat3(modelMatrix)*normal);
      `);
    shader.fragmentShader=`varying float vPlazaGroundStyle;
      varying vec3 vPlazaGroundNormal;
      ${shader.fragmentShader}`.replace("#include <color_fragment>",`#include <color_fragment>
        if(vPlazaGroundStyle>.5 && vPlazaGroundStyle<2.5) {
          vec3 facing=abs(normalize(vPlazaGroundNormal));
          vec2 plane=vPlazaGroundStyle<1.5?vPlazaStonePosition.xz:
            vec2(facing.x>facing.z?vPlazaStonePosition.z:vPlazaStonePosition.x,vPlazaStonePosition.y);
          vec2 size=vPlazaGroundStyle<1.5?vec2(1.2,.8):vec2(1.35,.5);
          vec2 grid=plane/size;
          grid.x+=mod(floor(grid.y),2.0)*.5;
          vec2 edges=min(fract(grid),1.0-fract(grid));
          // Derivatives of the continuous plane avoid seams at staggered row boundaries.
          vec2 pixel=fwidth(plane/size);
          vec2 joint=1.0-smoothstep(vec2(.012),vec2(.012)+max(pixel*.75,vec2(.001)),edges);
          float visibility=1.0-smoothstep(.12,.6,max(pixel.x,pixel.y));
          float tile=plazaHash(vec3(floor(grid),vPlazaGroundStyle));
          diffuseColor.rgb*=.965+tile*.07;
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.68,max(joint.x,joint.y)*visibility*.62);
        }
        if(vPlazaGroundStyle>2.5) {
          float layer=plazaNoise(vec3(vPlazaStonePosition.x*.1,vPlazaStonePosition.y*.8,vPlazaStonePosition.z*.1));
          diffuseColor.rgb*=.92+layer*.15;
        }
      `);
  };
}
