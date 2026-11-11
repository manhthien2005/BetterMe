import * as THREE from 'three';
import { PLAZA_REFLECTION_FAR } from './plaza-horizon';

// Portable companion to the GLB. Blender exports the waterKind/fall descriptors as extras.
export function createIslandWaterEffects(root: THREE.Group) {
  const clock={value:0}, dusk={value:0}, brightness={value:1};
  const reflection=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  // The far island must also see the opposite side of the expanded sky.
  const reflectionCamera=new THREE.CubeCamera(.1,PLAZA_REFLECTION_FAR,reflection);
  reflectionCamera.position.set(0,1.1,0);
  const waterMeshes: THREE.Mesh[]=[];
  const originals: {mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]}[]=[];
  const noise=`
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03+7.)+.15*noise(p*4.1-3.);}
  `;
  const vertex=`
    uniform float time; uniform float isFall;
    varying vec2 vUv; varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main(){vUv=uv;vec3 p=position;
      if(isFall>.5){p.z+=sin(uv.x*16.+uv.y*11.-time*2.4)*.065*uv.y;}
      else {p.y+=.022*sin(p.x*2.1+p.z*1.3+time*1.4)+.012*sin(p.z*3.-time*2.1);}
      vWorld=(modelMatrix*vec4(p,1.)).xyz;vec4 mvPosition=viewMatrix*vec4(vWorld,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }
  `;
  const riverFragment=`
    uniform float time;uniform float dusk;uniform float river;uniform float pool;uniform samplerCube environmentMap;
    varying vec2 vUv;varying vec3 vWorld;
    uniform float brightness;
    #include <fog_pars_fragment>
    ${noise}
    void main(){
      vec2 q=vWorld.xz*vec2(.8,1.05)-vec2(.08,.65)*time;
      float height=fbm(q*.65)+.12*fbm(q*1.8+vec2(.3,-.15)*time);
      float dx=fbm((q+vec2(.045,0))*.65)+.12*fbm((q+vec2(.045,0))*1.8+vec2(.3,-.15)*time)-height;
      float dz=fbm((q+vec2(0,.045))*.65)+.12*fbm((q+vec2(0,.045))*1.8+vec2(.3,-.15)*time)-height;
      vec3 n=normalize(vec3(-dx*1.4,1.,-dz*1.4));
      // Pool is radial; river and spillway use different across-stream UV axes.
      float edge=pool>.5?clamp(length(vUv*2.-1.),0.,1.):abs((river>.5?vUv.x:vUv.y)*2.-1.);
      float shallow=smoothstep(.48,1.,edge);
      float bed=fbm(vWorld.xz*2.5);
      vec3 col=mix(vec3(.012,.095,.105),vec3(.13,.25,.16),shallow*.85);
      col+=vec3(.018,.028,.009)*bed*shallow;
      vec3 eye=normalize(cameraPosition-vWorld);
      float fresnel=.10+.72*pow(1.-max(0.,dot(n,eye)),4.);
      // Rough water reflects broad shapes; sharp foliage texels shimmer into speckles.
      vec3 reflected=textureCube(environmentMap,reflect(-eye,n),2.5).rgb;
      col=mix(col,reflected,fresnel);
      float sun=pow(max(0.,dot(reflect(-normalize(vec3(-.4,1.,.6)),n),eye)),180.);
      col+=vec3(.9,.9,.72)*sun*.6;
      // Local broken glints, never a continuous row of transverse pinstripes.
      float caustic=pow(max(0.,1.-abs(noise(q*4.+height)-.52)*12.),4.);
      col+=vec3(.035,.075,.045)*caustic*shallow;
      float bank=smoothstep(.92,.995,edge)*smoothstep(.48,.75,fbm(q*vec2(3.,1.2)));
      col=mix(col,vec3(.65,.79,.69),bank*.58);
      col*=mix(vec3(1),vec3(.84,.81,.97),dusk);
      gl_FragColor=vec4(col*brightness,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `;
  const fallFragment=`
    uniform float time;uniform float dusk;varying vec2 vUv;varying vec3 vWorld;
    uniform float brightness;
    #include <fog_pars_fragment>
    ${noise}
    void main(){
      // Blender's glTF export flips V: the crest is 0 and the falling tail is 1.
      float t=vUv.y;
      float travel=sqrt(t+.035);
      vec2 flow=vec2(vUv.x*7.,travel*18.-time*3.2);
      float broad=fbm(flow*vec2(1.,.7));
      float streak=fbm(vec2(vUv.x*19.+broad*2.,travel*11.-time*2.7));
      float foam=smoothstep(.42,.72,broad*.6+streak*.6);
      float crest=1.-smoothstep(0.,.075,t);
      float aeration=smoothstep(.04,.48,t);
      vec3 clear=vec3(.065,.24,.25),white=vec3(.77,.88,.83);
      vec3 col=mix(clear,white,clamp(.15+foam*.7+aeration*.26+crest*.18,0.,1.));
      float edgeNoise=(noise(flow*2.3)-.5)*.055;
      float edges=smoothstep(0.,.08,vUv.x+edgeNoise)*smoothstep(0.,.08,1.-vUv.x+edgeNoise);
      float bottom=1.-smoothstep(.56,.98,t+noise(vec2(vUv.x*15.,time*.6))*.13);
      float breakup=1.-smoothstep(.3,.9,t)*smoothstep(.35,.67,noise(flow*3.));
      float alpha=edges*bottom*breakup*(.58+foam*.35);
      col*=mix(vec3(1),vec3(1.,.86,.83),dusk);
      gl_FragColor=vec4(col*brightness,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `;
  const falls: {fallStart: number[]; fallDrift: number[]; fallLength: number; fallWidth: number}[]=[];
  root.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||!object.userData.waterKind)return;
    const isFall=object.userData.waterKind==='fall';
    waterMeshes.push(object);
    originals.push({mesh:object,material:object.material});
    object.material=new THREE.ShaderMaterial({
      fog:true,
      uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:clock,dusk,brightness,environmentMap:{value:reflection.texture},isFall:{value:isFall?1:0},river:{value:object.userData.waterKind==='river'?1:0},pool:{value:object.userData.waterKind==='pool'?1:0}},
      vertexShader:vertex,fragmentShader:isFall?fallFragment:riverFragment,
      transparent:isFall,depthWrite:!isFall,side:THREE.DoubleSide,
    });
    object.castShadow=false;object.receiveShadow=false;
    object.renderOrder=isFall?2:0;
    if(isFall){
      const {fallStart,fallDrift,fallLength,fallWidth}=object.userData;
      if(Array.isArray(fallStart)&&Array.isArray(fallDrift)&&typeof fallLength==='number'&&typeof fallWidth==='number'){
        falls.push({fallStart,fallDrift,fallLength,fallWidth});
      }
    }
  });
  const seeds=[],starts=[],drifts=[],lengths=[],widths=[];
  let randomSeed=7183;
  const random=()=>{randomSeed=(randomSeed*16807)%2147483647;return(randomSeed-1)/2147483646;};
  for(const fall of falls)for(let i=0;i<180;i++){
    seeds.push(random(),random(),random());starts.push(...fall.fallStart);drifts.push(...fall.fallDrift);
    lengths.push(fall.fallLength);widths.push(fall.fallWidth);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(starts,3));
  geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,3));
  geometry.setAttribute('drift',new THREE.Float32BufferAttribute(drifts,3));
  geometry.setAttribute('fallLength',new THREE.Float32BufferAttribute(lengths,1));
  geometry.setAttribute('width',new THREE.Float32BufferAttribute(widths,1));
  const spray=new THREE.Points(geometry,new THREE.ShaderMaterial({
    fog:true,
    uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:clock,dusk,brightness},transparent:true,depthWrite:false,
    vertexShader:`
      uniform float time;attribute vec3 seed;attribute vec3 drift;attribute float fallLength;attribute float width;
      varying float opacity;varying float variant;
      #include <fog_pars_vertex>
      void main(){float t=fract(seed.z+time*(.18+seed.x*.08));variant=seed.x;
        vec3 p=position+drift*(.65+t*.4);
        p.x+=(seed.x-.5)*width*(2.+t*1.2)+sin(t*4.+seed.y*6.)*.25;
        p.y-=fallLength*(.55+.5*t*t);p.z+=(seed.y-.5)*(1.+t*2.);
        opacity=sin(t*3.14159)*(.12+seed.y*.15);
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
        float scale=length(modelMatrix[0].xyz);
        gl_PointSize=clamp((12.+seed.y*16.)*110.*scale/-mvPosition.z,1.,38.*scale);
      }
    `,
    fragmentShader:`
      uniform float dusk;uniform float brightness;
      #include <fog_pars_fragment>
      varying float opacity;varying float variant;
      void main(){vec2 p=gl_PointCoord*2.-1.;float a=exp(-dot(p,p)*4.)*smoothstep(1.,.5,length(p));
        gl_FragColor=vec4(mix(vec3(.79,.91,.9),vec3(.88,.8,.83),dusk)*brightness,a*opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      #include <fog_fragment>
      }
    `,
  }));
  spray.frustumCulled=false;spray.renderOrder=3;spray.name='Waterfall drifting spray';root.add(spray);
  return {
    update(delta: number){clock.value+=delta;},get time(){return clock.value;},
    setLighting(isDusk: boolean, light: number){dusk.value=isDusk?1:0;brightness.value=light;},
    dispose(){
      root.remove(spray);spray.geometry.dispose();spray.material.dispose();
      originals.forEach(({mesh,material})=>{(mesh.material as THREE.ShaderMaterial).dispose();mesh.material=material;});
      reflection.dispose();
    },
    captureEnvironment(renderer: THREE.WebGLRenderer,scene: THREE.Scene){
      root.updateWorldMatrix(true,true);
      reflectionCamera.position.copy(root.localToWorld(new THREE.Vector3(0,1.1,0)));
      // Capture on load/light changes only; never six extra renders per frame.
      const visible=waterMeshes.map(mesh=>mesh.visible),sprayVisible=spray.visible;
      for(const mesh of waterMeshes)mesh.visible=false;
      spray.visible=false;
      const shadows=renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate=false;
      try {reflectionCamera.update(renderer,scene);}
      finally {renderer.shadowMap.autoUpdate=shadows;waterMeshes.forEach((mesh,i)=>{mesh.visible=visible[i];});spray.visible=sprayVisible;}
    },
  };
}
