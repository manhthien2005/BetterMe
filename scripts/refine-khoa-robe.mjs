import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {BufferGeometry,Float32BufferAttribute,Matrix4,Vector3,Quaternion,Color} from 'three';
// The approved portrait is an art master; do not rebuild it from the older male recipe.
export async function refineKhoaRobe(source) {
assert.equal(createHash('sha256').update(source).digest('hex'),'db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312');
const jsonLength=source.readUInt32LE(12),g=JSON.parse(source.subarray(20,20+jsonLength));
const original=source.subarray(28+jsonLength,28+jsonLength+g.buffers[0].byteLength),chunks=[original];let length=original.length;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
const vecmix=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const read=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];assert(!v.byteStride&&!a.sparse);return Array.from({length:a.count*n},(_,i)=>original[a.componentType===5123?'readUInt16LE':a.componentType===5125?'readUInt32LE':'readFloatLE']((v.byteOffset??0)+(a.byteOffset??0)+i*(a.componentType===5123?2:4)));};
function append(bytes){const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const id=g.bufferViews.push({buffer:0,byteOffset:length,byteLength:bytes.length})-1;chunks.push(bytes);length+=bytes.length;return id;}
function accessor(data,type,componentType=5126){const a=componentType===5123?new Uint16Array(data):componentType===5125?new Uint32Array(data):new Float32Array(data),n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[type];assert([...a].every(Number.isFinite));const entry={bufferView:append(Buffer.from(a.buffer)),componentType,type,count:a.length/n};if(type==='VEC3'){entry.min=[0,1,2].map(c=>{let m=Infinity;for(let i=c;i<a.length;i+=3)m=Math.min(m,a[i]);return m});entry.max=[0,1,2].map(c=>{let m=-Infinity;for(let i=c;i<a.length;i+=3)m=Math.max(m,a[i]);return m});}return g.accessors.push(entry)-1;}
const parents=new Map();g.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parents.set(c,i)));
const worlds=new Map();function world(i){if(worlds.has(i))return worlds.get(i);const n=g.nodes[i],local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3().fromArray(n.translation??[0,0,0]),new Quaternion().fromArray(n.rotation??[0,0,0,1]),new Vector3().fromArray(n.scale??[1,1,1]));const result=parents.has(i)?world(parents.get(i)).clone().multiply(local):local;worlds.set(i,result);return result;}
const humanoid=g.extensions.VRMC_vrm.humanoid.humanBones,oldSkin=g.skins[0],skin={...structuredClone(oldSkin),name:'Khoa refined clothing skin'},bind=read(oldSkin.inverseBindMatrices);const skinIndex=g.skins.push(skin)-1;
const joint=name=>skin.joints.indexOf(humanoid[name].node),rigid=name=>[[joint(name),1]],blend=(a,b,t)=>[[joint(a),1-clamp(t)],[joint(b),clamp(t)]];
function torso(y){if(y<.97)return blend('hips','spine',(y-.92)/.05);if(y<1.09)return blend('spine','chest',(y-.97)/.12);return blend('chest','upperChest',(y-1.09)/.13);}
function bone(name,parent,position){const local=new Vector3(...position).applyMatrix4(world(parent).clone().invert()),id=g.nodes.push({name,translation:local.toArray(),children:[]})-1;g.nodes[parent].children??=[];g.nodes[parent].children.push(id);parents.set(id,parent);skin.joints.push(id);bind.push(...world(id).clone().invert().toArray());return {node:id,index:skin.joints.length-1};}
const sb=g.extensions.VRMC_springBone;
function collider(parent,offset,radius,tail){const shape=tail?{capsule:{offset,radius,tail}}:{sphere:{offset,radius}};return sb.colliders.push({node:parent,shape})-1;}
const hipNode=humanoid.hips.node;
const localPoint=(parent,p)=>new Vector3(...p).applyMatrix4(world(parent).clone().invert()).toArray();
const colliders=[-1,1].map(s=>{const parent=humanoid[s>0?'leftUpperLeg':'rightUpperLeg'].node;return collider(parent,localPoint(parent,[s*.078,.83,-.025]),.068,localPoint(parent,[s*.078,.51,-.025]));});
const hemGroup=sb.colliderGroups.push({name:'Khoa drape thighs',colliders})-1;
const chestNode=humanoid.upperChest.node;
const tieCollider=collider(chestNode,localPoint(chestNode,[0,1.24,.010]),.104,localPoint(chestNode,[0,1.10,.010]));
const tieGroup=sb.colliderGroups.push({name:'Khoa tie chest',colliders:[tieCollider]})-1;
function chain(name,parent,start,end,group,stiffness=10){const a=bone(name+'_Root',parent,start),b=bone(name+'_Tip',a.node,end);sb.springs.push({name,joints:[{node:a.node,hitRadius:.008,stiffness,gravityPower:.03,gravityDir:[0,-1,0],dragForce:.62},{node:b.node,hitRadius:.008,stiffness,gravityPower:.03,gravityDir:[0,-1,0],dragForce:.62}],colliderGroups:[group]});return a.index;}
const drape={};for(const s of [-1,1])for(const front of [false,true]){const name=`Khoa_Drape_${front?'Front':'Back'}_${s>0?'L':'R'}`;drape[`${s}/${front}`]=chain(name,hipNode,[s*.125,.965,front?.090:-.135],[s*.17,.34,front?.105:-.16],hemGroup,13);}
const tieJoint=chain('Khoa_Drape_Tie',chestNode,[0,1.260,.118],[0,1.105,.129],tieGroup,18);
skin.inverseBindMatrices=accessor(bind,'MAT4');
function clothWeights(p){const [x,y,z]=p,side=x>=0?'left':'right';
 if(y<.97){const amount=.48*smooth((.965-y)/.38),front=smooth((z+.07)/.14),left=smooth((x+.09)/.18),legAmount=.46*smooth((.88-y)/.40)*smooth((Math.abs(x)-.015)/.12);return [...torso(y).map(([j,w])=>[j,w*(1-amount-legAmount)]),[joint(side+'UpperLeg'),legAmount],...[-1,1].flatMap(s=>[[drape[`${s}/true`],front*amount*(s===1?left:1-left)],[drape[`${s}/false`],(1-front)*amount*(s===1?left:1-left)]])];}
 let arm=smooth((Math.abs(x)-.075)/.085)*smooth((y-1.14)/.09)*.85;
 if(Math.abs(x)>.16)arm=mix(arm,1,smooth((Math.abs(x)-.16)/.055)*smooth((y-1.15)/.05));
 const elbow=smooth((Math.abs(x)-.29)/.095);
 return [...torso(y).map(([j,w])=>[j,w*(1-arm)]),[joint(side+'UpperArm'),arm*(1-elbow)],[joint(side+'LowerArm'),arm*elbow]];
}
function material(originalId,name,hex){const m=structuredClone(g.materials[originalId]);m.name=name;m.doubleSided=true;const t=m.extensions.VRMC_materials_mtoon;t.outlineWidthFactor=.0003;t.shadingToonyFactor=.72;t.giEqualizationFactor=.60;t.outlineLightingMixFactor=.5;if(hex){const c=new Color(hex).toArray();m.pbrMetallicRoughness.baseColorFactor=[...c,1];t.shadeColorFactor=c.map(n=>n*.78);}return g.materials.push(m)-1;}
const mat={robe:material(13,'Khoa charcoal long robe','#272C33'),lining:material(14,'Khoa wine lining','#62343F'),shirt:material(15,'Khoa ivory shirt','#E8E3D7'),vest:material(16,'Khoa grey V-neck knit','#565961'),tie:material(19,'Khoa wine school tie','#783D48'),seam:material(13,'Khoa antique embroidery','#9A845C'),metal:material(18,'Khoa antique clasp','#B29A6A'),fold:material(13,'Khoa simple collar','#30343B')};
const ramp=g.materials[13].pbrMetallicRoughness.baseColorTexture.index;
const patternHeader=Buffer.from(`<svg width="128" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="512" fill="#ffffff"/>${Array.from({length:9},(_,i)=>`<path d="M-20 ${i*72-50}L148 ${i*72+8}" stroke="#c4ac8b" stroke-width="8"/><path d="M-20 ${i*72-34}L148 ${i*72+24}" stroke="#ded1bd" stroke-width="2"/>`).join('')}</svg>`);
const nextRequire=createRequire(createRequire(import.meta.url).resolve('next/package.json'));
const pattern=await nextRequire('sharp')(patternHeader).png().toBuffer();
const texture=g.textures.push({source:g.images.push({name:'Khoa subtle school tie stripe',bufferView:append(pattern),mimeType:'image/png'})-1,sampler:g.textures[ramp].sampler})-1;
g.materials[mat.tie].pbrMetallicRoughness.baseColorTexture.index=texture;g.materials[mat.tie].extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index=texture;
// Crisp original vector emblem: a book and star inside a shield. No franchise mark.
const crestSvg=fs.readFileSync(new URL('./assets/academy-crest.svg',import.meta.url),'utf8');

const crestPng=await nextRequire('sharp')(Buffer.from(crestSvg)).png().toBuffer();
const crestTexture=g.textures.push({source:g.images.push({name:'Original academy book-star embroidery',bufferView:append(crestPng),mimeType:'image/png'})-1,sampler:g.textures[ramp].sampler})-1;
mat.crest=material(13,'Khoa embroidered academy crest','#FFFFFF');
const crestMat=g.materials[mat.crest];crestMat.alphaMode='MASK';crestMat.alphaCutoff=.35;crestMat.pbrMetallicRoughness.baseColorTexture.index=crestTexture;crestMat.extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index=crestTexture;crestMat.extensions.VRMC_materials_mtoon.outlineWidthFactor=0;
// The chest mark uses heavier, fewer strokes to remain legible at NPC distance.
const smallSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 512 640"><path fill="#A88E5E" d="M84 112 Q256 44 428 112 V306 Q420 454 256 548 Q92 454 84 306Z"/><g fill="none" stroke="#272C33" stroke-linejoin="round" stroke-width="22"><path d="M256 150 L270 188 L309 188 L277 212 L289 250 L256 227 L223 250 L235 212 L203 188 L242 188Z" fill="#272C33" stroke-width="8"/><path d="M256 319 Q204 285 145 300 V397 Q207 383 256 419 Q305 383 367 397 V300 Q308 285 256 319Z M256 319 V419"/></g></svg>`;
const smallPng=await nextRequire('sharp')(Buffer.from(smallSvg)).png().toBuffer();const smallSampler=g.samplers.push({...g.samplers[g.textures[ramp].sampler],wrapS:33071,wrapT:33071})-1;const smallTexture=g.textures.push({source:g.images.push({name:'Original academy chest crest',bufferView:append(smallPng),mimeType:'image/png'})-1,sampler:smallSampler})-1;
const smallMaterial=structuredClone(crestMat);smallMaterial.name='Khoa chest academy crest';smallMaterial.pbrMetallicRoughness.baseColorTexture.index=smallTexture;smallMaterial.extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index=smallTexture;mat.crestSmall=g.materials.push(smallMaterial)-1;
function part(name){const groups=new Map();
 function surface(material,rows,cols,sample,outward){let d=groups.get(material);if(!d){d={positions:[],normals:[],uv:[],j:[],w:[],indices:[]};groups.set(material,d);}const start=d.positions.length/3;
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const v=r/rows,u=c/cols,{p,w=clothWeights(p),tone=1,uv}=sample(v,u);d.positions.push(...p);d.uv.push(...(uv??[(clamp(tone)*255+.5)/256,.5]));const merged=new Map();for(const [j,value]of w)if(value>1e-7)merged.set(j,(merged.get(j)??0)+value);const active=[...merged].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=active.reduce((s,x)=>s+x[1],0);assert(sum>0);for(let k=0;k<4;k++){d.j.push(active[k]?.[0]??0);d.w.push((active[k]?.[1]??0)/sum);}}
  function tri(a,b,c){const pa=new Vector3().fromArray(d.positions,a*3),pb=new Vector3().fromArray(d.positions,b*3),pc=new Vector3().fromArray(d.positions,c*3),normal=pb.clone().sub(pa).cross(pc.clone().sub(pa));if(normal.lengthSq()<1e-18)return;const mid=pa.clone().add(pb).add(pc).multiplyScalar(1/3);const expected=outward(mid);if(normal.dot(new Vector3(...expected))<0)d.indices.push(a,c,b);else d.indices.push(a,b,c);}
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=start+r*(cols+1)+c,b=a+cols+1;tri(a,a+1,b);tri(a+1,b+1,b);}
 }
 function finish(){const primitives=[];for(const [material,d]of groups){const geom=new BufferGeometry();geom.setAttribute('position',new Float32BufferAttribute(d.positions,3));geom.setIndex(d.indices);geom.computeVertexNormals();const normals=geom.attributes.normal.array,sums=new Map(),key=i=>d.positions.slice(i,i+3).map(n=>Math.round(n*1e5)).join('/');for(let i=0;i<d.positions.length;i+=3){const k=key(i),n=sums.get(k)??new Vector3();n.add(new Vector3(normals[i],normals[i+1],normals[i+2]));sums.set(k,n);}for(let i=0;i<d.positions.length;i+=3){const n=sums.get(key(i)).clone().normalize();normals[i]=n.x;normals[i+1]=n.y;normals[i+2]=n.z;}
   primitives.push({attributes:{POSITION:accessor(d.positions,'VEC3'),NORMAL:accessor(normals,'VEC3'),TEXCOORD_0:accessor(d.uv,'VEC2'),JOINTS_0:accessor(d.j,'VEC4',5123),WEIGHTS_0:accessor(d.w,'VEC4')},indices:accessor(d.indices,'SCALAR',5125),material});geom.dispose();}
  const idx=g.meshes.findIndex(m=>m.name===name);assert(idx>=0);g.meshes[idx]={name,primitives};g.nodes.find(n=>n.mesh===idx).skin=skinIndex;
 }return {surface,finish};
}
const outer=part('Academy_Robe'),inner=part('Academy_Lining'),uniform=part('Academy_Uniform');
const bodyRows=[[.34,.216,.169,.87],[.57,.201,.156,.83],[.82,.181,.142,.79],[.96,.169,.137,.73],[1.08,.163,.139,.65],[1.20,.16,.137,.62]];
function profile(y){const i=Math.min(bodyRows.length-2,Math.max(0,bodyRows.findIndex((r,k)=>k<bodyRows.length-1&&y<=bodyRows[k+1][0]))),t=smooth((y-bodyRows[i][0])/(bodyRows[i+1][0]-bodyRows[i][0]));return bodyRows[i].map((n,c)=>mix(n,bodyRows[i+1][c],t));}
function lower(v,u,sign,back,inset=0){const y=mix(.34,1.20,v),[,rx,rz,gap]=profile(y),a=back?mix(Math.PI,Math.PI/2,u):mix(gap,Math.PI/2,u),fold=(.003*Math.cos(a*6)+.001*Math.cos(a*10))*smooth((1.13-y)/.62);return [sign*Math.sin(a)*(rx+fold-inset),y,Math.cos(a)*(rz+fold-inset)-.014];}
function coons(u,v,bottom,top,left,right){const B=bottom(u),T=top(u),L=left(v),R=right(v),b0=bottom(0),b1=bottom(1),t0=top(0),t1=top(1);return B.map((n,c)=>(1-v)*n+v*T[c]+(1-u)*L[c]+u*R[c]-((1-u)*(1-v)*b0[c]+u*(1-v)*b1[c]+(1-u)*v*t0[c]+u*v*t1[c]));}
function shoulder(v,u,sign,back,inset=0){const bottom=t=>lower(1,t,sign,back,inset),top=t=>{let x,z;if(back&&t<.375){const a=t/.375*Math.PI/2;x=.053*Math.sin(a);z=-.055*Math.cos(a);}else{x=mix(.053,.16,back?(t-.375)/.625:t);z=0;}return [sign*x,1.33+.014*smooth((x-.05)/.11)-inset,z-.014];};
 const left=t=>{const p=vecmix(bottom(0),top(0),t);p[2]+=(back?-.025:.060)*Math.sin(t*Math.PI);return p;},right=t=>[sign*.16,1.264-(.064-inset)*Math.cos(t*Math.PI),-.014+(back?-1:1)*(.076-inset)*Math.sin(t*Math.PI)];return coons(u,v,bottom,top,left,right);}
function sleeve(v,u,sign,inset=0){const x=mix(.16,.526,v),a=u*Math.PI*2,t=smooth(v/.27),ry=mix(.064,mix(.059,.047,v),t)-inset,rz=mix(.076,mix(.061,.047,v),t)-inset,fold=.0018*Math.sin(v*27)*Math.exp(-Math.pow((v-.53)/.24,2))*Math.pow(Math.cos(a),2);return [sign*x,mix(1.264,1.272,t)+Math.cos(a)*(ry+fold),-.014+Math.sin(a)*(rz+fold)];}
for(const sign of [-1,1]){
 for(const back of [false,true]){
  const cols=back?32:20;
  for(const [part,material,inset]of [[outer,mat.robe,0],[inner,mat.lining,.0025]]){
   part.surface(material,34,cols,(v,u)=>({p:lower(v,u,sign,back,inset),tone:.92+.035*Math.cos(u*Math.PI*4)+.015*Math.cos(v*6)}),p=>[p.x,0,p.z+.014]);
   if(part===outer)part.surface(material,16,cols,(v,u)=>({p:shoulder(v,u,sign,back,inset),tone:.94-.03*Math.sin(v*Math.PI)}),p=>[p.x*.2,.3,back?-1:1]);
  }
 }
 outer.surface(mat.robe,24,32,(v,u)=>({p:sleeve(v,u,sign),tone:.9+.045*Math.cos(u*Math.PI*2)+.025*Math.sin(v*40)*Math.exp(-Math.pow((v-.52)/.24,2))}),p=>[0,p.y-1.272,p.z+.014]);
 inner.surface(mat.lining,24,32,(v,u)=>({p:sleeve(v,u,sign,.0025),tone:.9}),p=>[0,p.y-1.272,p.z+.014]);
 // Close the sleeve wall at the wrist; outer and lining share deformation.
 outer.surface(mat.robe,1,64,(v,u)=>({p:vecmix(sleeve(1,u,sign),sleeve(1,u,sign,.0025),v),tone:.85}),()=>[sign,0,0]);
 outer.surface(mat.shirt,3,64,(v,u)=>({p:sleeve(.985+v*.027,u,sign,.0038),tone:.98}),p=>[0,p.y-1.272,p.z+.014]);
 for(const edge of [.87,.95])outer.surface(mat.seam,2,48,(v,u)=>({p:sleeve(edge+v*.007,u,sign,-.0005),tone:.84}),p=>[0,p.y-1.272,p.z+.014]);
 // The straight opening replaces the rejected notched blazer lapels.
 outer.surface(mat.seam,18,2,(v,u)=>{const p=shoulder(v,.003+u*.010,sign,false);p[2]+=.0008;return {p,w:clothWeights(p),tone:.83}},()=>[0,.1,1]);
 // Front opening has an actual rolled edge and a restrained seam.
 for(const [part,material,offset,width]of [[outer,mat.seam,0,.0016],[inner,mat.lining,.0016,.003]])part.surface(material,40,2,(v,u)=>{const p=lower(v,0,sign,false);p[0]+=sign*(offset+u*width);p[2]+=.001;return {p,tone:.85}},()=>[0,0,1]);
 // Pocket mouth and a small cuff fastening, not separate floating patches.
 // Thin bands follow the garment's own positions/weights at the hem.
 for(const back of [false,true])for(const h of [.008,.025])outer.surface(mat.seam,1,40,(v,u)=>{const p=lower(h+v*.003,u,sign,back,-.0007);return {p,tone:.84}},p=>[p.x,0,p.z+.014]);
}
// Collar wraps continuously around the neck and hides the old cut neckline.
outer.surface(mat.fold,5,72,(v,u)=>{const a=mix(.82,Math.PI*2-.82,u),rx=mix(.057,.065,v),rz=mix(.057,.065,v),y=mix(1.330,1.310,v);return {p:[Math.sin(a)*rx,y,Math.cos(a)*rz-.014],w:rigid('upperChest'),tone:.90}},p=>[p.x,.2,p.z+.014]);
uniform.surface(mat.shirt,18,64,(v,u)=>{const y=mix(.98,1.313,v),a=u*Math.PI*2,t=smooth((1.313-y)/.07),rx=mix(.052,.142,t),rz=mix(.057,Math.cos(a)>0?.108:.082,t);const p=[Math.sin(a)*rx,y,Math.cos(a)*rz-.012];return {p,w:clothWeights(p),tone:.97}},p=>[p.x,0,p.z+.012]);
uniform.surface(mat.shirt,4,64,(v,u)=>{const a=u*Math.PI*2;return {p:[Math.sin(a)*.044,mix(1.307,1.327,v),Math.cos(a)*.049-.008],w:rigid('upperChest'),tone:.99}},p=>[p.x,0,p.z+.012]);
for(const sign of [-1,1])uniform.surface(mat.shirt,9,8,(v,u)=>{const top=[sign*mix(.008,.038,u),1.312, .055],bottom=[sign*mix(.012,.033,u),mix(1.286,1.274,u),mix(.097,.103,u)],p=vecmix(top,bottom,v);p[2]+=.001*Math.sin(v*Math.PI);return {p,w:rigid('upperChest'),tone:.94+.04*Math.cos(u*Math.PI)}},()=>[0,.3,1]);
const vestPoint=(v,u)=>{const a=u*Math.PI*2,front=Math.max(0,Math.cos(a)),notch=(1-smooth(Math.abs(Math.sin(a))/.52))*front,top=mix(1.21,1.28,front)-.108*notch,y=mix(.930+.006*front*Math.cos(a*2),top,v),rx=.147+.004*smooth((y-1.04)/.18),rz=Math.cos(a)>0?.117:.095,fold=.0015*Math.cos(a*6)*smooth((1.15-y)/.20);return [Math.sin(a)*(rx+fold),y,Math.cos(a)*(rz+fold)-.010];};
uniform.surface(mat.vest,28,72,(v,u)=>{const p=vestPoint(v,u);return {p,w:clothWeights(p),tone:.90+.05*Math.cos(u*Math.PI*4)-.025*Math.cos(v*10)}},p=>[p.x,0,p.z+.01]);
// Tailored V-edge and lower hem make the waistcoat distinct from the trousers.
for(const edge of [0,1])uniform.surface(mat.seam,2,72,(v,u)=>{const p=vestPoint(edge===0?v*.006:1-v*.006,u);p[0]*=1.004;p[2]+=.0007*Math.cos(u*Math.PI*2);return {p,w:clothWeights(p),tone:.60}},p=>[p.x,0,p.z+.01]);
// Cloth tie: tapered knot, striped face and a small depth fold.
uniform.surface(mat.tie,6,6,(v,u)=>{const width=mix(.012,.008,v),p=[mix(-width,width,u),mix(1.287,1.260,v),mix(.101,.118,v)+.002*Math.sin(u*Math.PI)];return {p,w:rigid('upperChest'),uv:[u,v*.14]}},()=>[0,0,1]);
uniform.surface(mat.tie,28,10,(v,u)=>{const width=(.008+.006*smooth(v/.6))*(1-smooth((v-.85)/.15)),p=[mix(-width,width,u),mix(1.260,1.105,v),.119+.010*smooth(v/.4)+.0015*Math.sin(u*Math.PI)];return {p,w:[[joint('upperChest'),1-smooth(v/.30)],[tieJoint,smooth(v/.30)]],uv:[u,.15+v*.85]}},()=>[0,0,1]);
// Ribbed knit hem: simple broad structure, no waistcoat button row.
uniform.surface(mat.vest,6,72,(v,u)=>{const p=vestPoint(v*.095,u);p[0]*=1.005;p[2]+=.001*Math.cos(u*Math.PI*2);return {p,w:clothWeights(p),tone:.76+.09*Math.cos(u*Math.PI*80)}},p=>[p.x,0,p.z+.01]);
// Crest patches conform to the actual robe instead of floating planar badges.
function backPoint(x,y){const [,rx]=profile(y),a=Math.PI-Math.asin(x/rx);const p=lower((y-.34)/.86,(Math.PI-a)/(Math.PI/2),1,true,-.001);return p;}
outer.surface(mat.crest,24,24,(v,u)=>{const p=backPoint(mix(-.092,.092,u),mix(1.184,.954,v));return {p,w:clothWeights(p),uv:[u,v]}},()=>[0,0,-1]);
// Use the exact underlying shoulder grid and weights: a separately resampled patch
// interpolates skinning differently and sinks into the cloth when the arm lowers.
outer.surface(mat.crestSmall,16,20,(v,u)=>{const raw=shoulder(v,u,1,false),p=[raw[0],raw[1],raw[2]+.001];return {p,w:clothWeights(raw),uv:[(u-.28)/.38,(.51-v)/.37]}},()=>[0,0,1]);
// Small paired clasps and a short fastening at the neckline, not across the tie.
for(const sign of [-1,1]){
 const center=shoulder(.68,0,sign,false);center[0]+=sign*.008;center[2]+=.002;
 outer.surface(mat.metal,6,20,(v,u)=>{const a=u*Math.PI*2,r=Math.sin(v*Math.PI/2);return {p:[center[0]+.007*r*Math.cos(a),center[1]+.0035*r*Math.sin(a),center[2]+.0013*Math.cos(v*Math.PI/2)],w:clothWeights(center),tone:.85}},()=>[0,0,1]);
}
outer.surface(mat.metal,2,36,(v,u)=>{const left=shoulder(.68,0,-1,false),right=shoulder(.68,0,1,false),p=vecmix(left,right,u);p[1]-=.004*Math.sin(u*Math.PI)+(v-.5)*.0017;p[2]+=.003+.011*Math.sin(u*Math.PI);return {p,w:rigid('upperChest'),tone:.8}},()=>[0,0,1]);
// Preserve original trousers/shoes and remove only the obsolete floating chest pin.
const details=g.meshes.find(m=>m.name==='Academy_RoleDetails');details.primitives=details.primitives.filter(p=>g.accessors[p.attributes.POSITION].count>20);
outer.finish();inner.finish();uniform.finish();
g.extensions.VRMC_vrm.meta.name='Khoa — long embroidered academy robe';g.extensions.VRMC_vrm.meta.version='0.4-long-robe-review';
g.extras={...g.extras,khoaClothing:{baseSha256:'db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312',stage:'long robe preview; approved portrait preserved',hood:false,details:['book-star-back-crest','chest-crest','cuff-hem-trim','front-clasp']}};
// Match the player's embroidery filtering so fine lines survive game-camera distance.
for (const material of g.materials.filter(m=>m.name==='Khoa embroidered academy crest'||m.name==='Khoa chest academy crest')) {
  const texture=g.textures[material.pbrMetallicRoughness.baseColorTexture.index];
  texture.sampler=g.samplers.push({...g.samplers[texture.sampler],minFilter:9987})-1;
}
const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}g.buffers[0].byteLength=length;
let json=Buffer.from(JSON.stringify(g));if(json.length%4)json=Buffer.concat([json,Buffer.alloc(4-json.length%4,32)]);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(length,0);binHeader.writeUInt32LE(0x004e4942,4);const out=Buffer.concat([header,json,binHeader,...chunks]);return out;
}
