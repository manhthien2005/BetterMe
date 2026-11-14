import * as THREE from 'three';
import type { Clock, EffectAnchor, SceneEffectsState } from './types';
type ParticleKind = 'firefly' | 'shrub' | 'halo' | 'mist' | 'drops';
type ParticleObject = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
type EffectUniforms = { studyTime: Clock; night: Clock; viewportHeight?: Clock };

// All effects belong to the prepared island. Their clock is the viewer's pausable
// clock; neither particles nor the light create an independent animation loop.
export function createSceneEffects(root: THREE.Group, anchors: EffectAnchor[], clock: Clock) {
 const group=new THREE.Group();group.name='V17 living details';root.add(group);
 const owned: ParticleObject[]=[],uniforms: EffectUniforms[]=[],bulbs: THREE.MeshStandardMaterial[]=[],shrubFireflies: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[]=[];let disposed=false,night=false;
 root.traverse(o=>{if(o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && o.material.name.includes('lantern warm glass'))bulbs.push(o.material);});
 let lampLight: THREE.PointLight | null=null;

 function particles(name: string,anchor: EffectAnchor,count: number,kind: ParticleKind,phase=0){
  const positions=new Float32Array(count*3),seeds=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   // Fixed low-discrepancy phases: reloads and screenshots reproduce one composition.
   seeds.set([(i*.61803398875+.13+phase)%1,(i*.41421356237+.37+phase*.53)%1,(i*.73205080757+.21+phase*.71)%1],i*3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,3));
  geometry.boundingBox=['drops','mist'].includes(kind)?new THREE.Box3(new THREE.Vector3(-3.5,-8,-2),new THREE.Vector3(3.5,1,2)):
   new THREE.Box3(new THREE.Vector3(-3.5,-1.4,-3.5),new THREE.Vector3(3.5,2,3.5));
  const u={studyTime:clock,viewportHeight:{value:800},night:{value:0}};uniforms.push(u);
  const material=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,
   blending:['firefly','shrub','halo'].includes(kind)?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:`attribute vec3 seed; uniform float studyTime; uniform float viewportHeight;
    varying float opacity; varying float variant;
    void main(){
     vec3 p=position; float size=1.0; variant=seed.z;
     ${kind==='firefly'||kind==='shrub'?`
      float t=studyTime*.26; float a=seed.x*6.283185+t*(.35+seed.z*.5);
      p=vec3(cos(a)*(1.0+seed.y*2.1)+sin(t*.73+seed.z*12.0)*.32,
       -.85+seed.z*1.65+sin(t*1.4+seed.y*8.0)*.24,
       sin(a)*(.8+seed.y*1.8));
      ${kind==='shrub'?'p*=vec3(.52,.48,.52);p.y+=.28;':''}
      size=.13+seed.z*.08;
      opacity=.28+.65*pow(.5+.5*sin(studyTime*.85+seed.x*12.0),2.0);
     `:kind==='halo'?`size=2.5;opacity=.12;`:`
      float age=fract(seed.x+studyTime*(${kind==='mist'?'.11+seed.z*.035':'.19+seed.z*.09'}));
      float a=seed.y*6.283185;
      float spread=${kind==='mist'?'.28+age*2.5':'.48+age*age*2.1'};
      p=vec3(cos(a)*spread,-${kind==='mist'?'(1.2+age*5.8)':'(age*2.3+age*age*4.5)'},sin(a)*spread*.40+age*.72);
      p.x+=sin(age*5.0+seed.z*9.0)*age*.22;
      size=${kind==='mist'?'.85+age*1.9':'.035+seed.z*.055'};
      opacity=smoothstep(0.0,.13,age)*(1.0-smoothstep(.56,1.0,age))*${kind==='mist'?'.20':'.62'};
     `}
     vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
     float perspectiveScale=projectionMatrix[2][3]==-1.0?1.0/max(.001,-mv.z):1.0;
     gl_PointSize=max(1.0,size*length(modelMatrix[0].xyz)*projectionMatrix[1][1]*viewportHeight*.5*perspectiveScale);
    }`,
   fragmentShader:`uniform float night; uniform float studyTime; varying float opacity; varying float variant;
    float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float cloud(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(grain(i),grain(i+vec2(1,0)),f.x),mix(grain(i+vec2(0,1)),grain(i+1.0),f.x),f.y);}
    void main(){
     vec2 q=gl_PointCoord*2.0-1.0;float r=length(q);
     if(r>1.0)discard;
     ${kind==='firefly'||kind==='shrub'?`
      float alpha=(exp(-r*r*7.0)*.32+exp(-r*r*55.0)*.95)*opacity;
      vec3 color=mix(vec3(.68,1.0,.19),vec3(1.0,.72,.19),variant*.45);
     `:kind==='halo'?`
      float alpha=exp(-r*r*5.0)*opacity;
      vec3 color=vec3(1.0,.44,.08);
     `:`
      float alpha=${kind==='mist'?'pow(1.0-r*r,1.8)*(.5+.5*cloud(q*3.7+variant*17.0+vec2(studyTime*.1,studyTime*.16)))':'pow(1.0-r*r,1.5)'}*opacity;
      vec3 color=mix(vec3(.66,.80,.83),vec3(.055,.13,.19),night);
     `}
     gl_FragColor=vec4(color,alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const points=new THREE.Points(geometry,material);points.name=name;points.position.copy(anchor.position);points.quaternion.copy(anchor.rotation);points.scale.copy(anchor.scale);
  points.frustumCulled=false;points.renderOrder=4;group.add(points);owned.push(points);return points;
 }
 const lamp=anchors.find(a=>a.kind==='lantern'),fall=anchors.find(a=>a.kind==='waterfall-spray');
 let fireflies: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null=null,halo: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null=null;
 if(lamp){
  lampLight=new THREE.PointLight('#ffcc75',0,22*lamp.worldScale,1.4);lampLight.name='V17 lantern local light';
  lampLight.position.copy(lamp.position);group.add(lampLight);
  fireflies=particles('V17 night fireflies',lamp,26,'firefly');
  halo=particles('V17 lantern soft halo',lamp,1,'halo');
 }
 for(const [i,anchor] of anchors.filter(a=>a.kind==='shrub-fireflies').entries()){
  shrubFireflies.push(particles(`V18 shrub fireflies ${i+1}`,anchor,6,'shrub',.17+i*.23));
 }
 // Camera-facing thin ribbons resolve as stretched droplets, not round glitter.
 function waterRibbons(anchor: EffectAnchor){
  const geometry=new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,-1,1,0,1,1,0],3));geometry.setIndex([0,1,2,2,1,3]);
  const seeds=new Float32Array(92*3);
  for(let i=0;i<92;i++)seeds.set([(i*.61803+.2)%1,(i*.41421+.6)%1,(i*.73205+.1)%1],i*3);
  geometry.setAttribute('seed',new THREE.InstancedBufferAttribute(seeds,3));geometry.instanceCount=92;
  geometry.boundingBox=new THREE.Box3(new THREE.Vector3(-3,-8,-1),new THREE.Vector3(3,1.5,2));
  const u={studyTime:clock,night:{value:0}};uniforms.push(u);
  const material=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:`attribute vec3 seed; uniform float studyTime; varying vec2 shape; varying float fade;
    void main(){
     float age=fract(seed.x+studyTime*(.18+seed.z*.06));float a=seed.y*6.283185;
     vec3 p=vec3(cos(a)*(.55+age*age*1.7),.65-age*2.0-age*age*5.3,sin(a)*(.12+age*.30)+age*.58);
     vec4 center=modelViewMatrix*vec4(p,1.0);
     vec2 down=(modelViewMatrix*vec4(0,-1,0,0)).xy;down=normalize(down+vec2(.0001,0));
     vec2 across=vec2(-down.y,down.x);
     float ribbonLength=.16+seed.z*.28+age*.34;
     center.xy+=(across*position.x*(.014+seed.y*.020)+down*position.y*ribbonLength)*length(modelMatrix[0].xyz);
     gl_Position=projectionMatrix*center;shape=position.xy;
     fade=smoothstep(0.0,.09,age)*(1.0-smoothstep(.58,1.0,age));
    }`,
   fragmentShader:`uniform float night;varying vec2 shape;varying float fade;
    void main(){
     float alpha=pow(max(0.0,1.0-abs(shape.x)),1.7)*pow(max(0.0,1.0-shape.y*shape.y),1.3)*fade*.42;
     gl_FragColor=vec4(mix(vec3(.58,.76,.79),vec3(.05,.12,.18),night),alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='V18 waterfall broken ribbons';mesh.position.copy(anchor.position);mesh.quaternion.copy(anchor.rotation);mesh.scale.copy(anchor.scale);
  mesh.frustumCulled=false;mesh.renderOrder=4;owned.push(mesh);group.add(mesh);
 }
 if(fall){
  particles('V17 waterfall droplets',fall,300,'drops');
  particles('V17 waterfall drifting spray',fall,76,'mist');waterRibbons(fall);
 }
 function setNight(value: boolean){
  night=value;uniforms.forEach(u=>{u.night.value=value?1:0;});
  if(lampLight){lampLight.visible=value;lampLight.intensity=value?26*Math.min(1,(lamp?.worldScale??1)**2):0;}
  if(fireflies)fireflies.visible=value;if(halo)halo.visible=value;
  shrubFireflies.forEach(p=>{p.visible=value;});
  bulbs.forEach(m=>{m.emissive.set(value?'#ff9c32':'#000000');m.emissiveIntensity=value?.85:0;});
 }
 if(fall?.sprayLength){const sx=THREE.MathUtils.clamp((fall.fallWidth??2)/2.2,.35,1.6),sy=fall.sprayLength/8;owned.forEach(o=>o.scale.multiply(new THREE.Vector3(sx,sy,sx)));}
 setNight(false);
 return {
  setNight,
  update(height: number){uniforms.forEach(u=>{if(u.viewportHeight)u.viewportHeight.value=height;});},
  get state(): SceneEffectsState {return {night,lamp:!!lamp,fireflies:fireflies?.geometry.attributes.position.count||0,
   firefliesVisible:fireflies?.visible||false,lightIntensity:lampLight?.intensity||0,
   lightRange:lampLight?.distance||0,shrubFireflies:shrubFireflies.reduce((n,p)=>n+p.geometry.attributes.position.count,0),
   shrubFirefliesVisible:shrubFireflies.filter(p=>p.visible).length,spray:!!fall,ribbons:fall?92:0,
   points:owned.reduce((n,p)=>n+(p instanceof THREE.Points?p.geometry.attributes.position.count:0),0),disposed};},
  dispose(){if(disposed)return;disposed=true;owned.forEach(p=>{p.geometry.dispose();p.material.dispose();});group.removeFromParent();},
 };
}
