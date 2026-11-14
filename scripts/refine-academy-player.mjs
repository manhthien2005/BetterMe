import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {BufferGeometry,Float32BufferAttribute,Vector3,Color} from 'three';
// Apply the accepted garment refinement to the pinned original player fitting.
export async function refineAcademyPlayer(source) {
assert.equal(createHash('sha256').update(source).digest('hex'),'519821d5a5b494b956f8591e548f52533a316bbc1db948befb426390ee807ad6');
const jsonLength=source.readUInt32LE(12),g=JSON.parse(source.subarray(20,20+jsonLength));
const original=source.subarray(28+jsonLength,28+jsonLength+g.buffers[0].byteLength),chunks=[original];let length=original.length;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
const vecmix=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function append(bytes){const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const id=g.bufferViews.push({buffer:0,byteOffset:length,byteLength:bytes.length})-1;chunks.push(bytes);length+=bytes.length;return id;}
function accessor(data,type,componentType=5126){const a=componentType===5123?new Uint16Array(data):componentType===5125?new Uint32Array(data):new Float32Array(data),n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[type];assert([...a].every(Number.isFinite));const entry={bufferView:append(Buffer.from(a.buffer)),componentType,type,count:a.length/n};if(type==='VEC3'){entry.min=[0,1,2].map(c=>{let m=Infinity;for(let i=c;i<a.length;i+=3)m=Math.min(m,a[i]);return m});entry.max=[0,1,2].map(c=>{let m=-Infinity;for(let i=c;i<a.length;i+=3)m=Math.max(m,a[i]);return m});}return g.accessors.push(entry)-1;}

const skin=g.skins[0],skinIndex=0,humanoid=g.extensions.VRMC_vrm.humanoid.humanBones;
const joint=name=>{const id=skin.joints.indexOf(humanoid[name].node);assert(id>=0);return id;},rigid=name=>[[joint(name),1]],blend=(a,b,t)=>[[joint(a),1-clamp(t)],[joint(b),clamp(t)]];
function torso(y){if(y<.97)return blend('hips','spine',(y-.92)/.05);if(y<1.09)return blend('spine','chest',(y-.97)/.12);return blend('chest','upperChest',(y-1.09)/.13);}
function skirtWeights(x,y){return blend('hips',(x>=0?'left':'right')+'UpperLeg',smooth((.90-y)/.29)*smooth(Math.abs(x)/.12)*.62);}
function clothWeights(p){const [x,y]=p;if(y<.94)return skirtWeights(x,y);const side=x>=0?'left':'right';let arm=smooth((Math.abs(x)-.075)/.085)*smooth((y-1.14)/.09)*.85;if(Math.abs(x)>.16)arm=mix(arm,1,smooth((Math.abs(x)-.16)/.055)*smooth((y-1.15)/.05));const elbow=smooth((Math.abs(x)-.29)/.095);return [...torso(y).map(([j,w])=>[j,w*(1-arm)]),[joint(side+'UpperArm'),arm*(1-elbow)],[joint(side+'LowerArm'),arm*elbow]];}
function material(originalId,name,hex){const m=structuredClone(g.materials[originalId]);m.name=name;m.doubleSided=true;const t=m.extensions.VRMC_materials_mtoon;t.outlineWidthFactor=.0003;t.shadingToonyFactor=.65;t.giEqualizationFactor=.45;t.outlineLightingMixFactor=.5;if(hex){const c=new Color(hex).toArray();m.pbrMetallicRoughness.baseColorFactor=[...c,1];t.shadeColorFactor=c.map(n=>n*.75);}return g.materials.push(m)-1;}

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
const mat={robe:material(13,'Player refined charcoal wool'),lining:material(14,'Player moss facing'),shirt:material(15,'Player ivory cotton'),collar:material(15,'Player compact ivory collar'),vest:material(16,'Player shaped waistcoat'),skirt:material(17,'Player soft pleated wool'),silver:material(18,'Player silver embroidery'),tie:material(19,'Player moss tie')};
const nextRequire=createRequire(createRequire(import.meta.url).resolve('next/package.json')),sharp=nextRequire('sharp');
const ramp=g.materials[13].pbrMetallicRoughness.baseColorTexture.index;
async function texture(svg,name){const png=await sharp(Buffer.from(svg)).png().toBuffer();return g.textures.push({source:g.images.push({name,bufferView:append(png),mimeType:'image/png'})-1,sampler:g.textures[ramp].sampler})-1;}
const crestSvg=fs.readFileSync(new URL('./assets/academy-crest.svg',import.meta.url),'utf8').replaceAll('#B29A6A','#B1BDB3');
const crestTexture=await texture(crestSvg,'Academy silver book-star embroidery');mat.crest=material(13,'Player academy crest','#FFFFFF');
// Thin cutout embroidery needs mipmaps at gameplay distance; the cloth ramp does not.
function decal(id,map){const m=g.materials[id];m.alphaMode='MASK';m.alphaCutoff=.3;m.pbrMetallicRoughness.baseColorTexture.index=map;m.extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index=map;m.extensions.VRMC_materials_mtoon.outlineWidthFactor=0;const t=g.textures[map];t.sampler=g.samplers.push({...g.samplers[t.sampler],minFilter:9987})-1;}
decal(mat.crest,crestTexture);
const smallSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 512 640"><path fill="#ACB9AD" d="M84 112 Q256 44 428 112 V306 Q420 454 256 548 Q92 454 84 306Z"/><g fill="none" stroke="#284C3F" stroke-linejoin="round" stroke-width="22"><path d="M256 150 L270 188 L309 188 L277 212 L289 250 L256 227 L223 250 L235 212 L203 188 L242 188Z" fill="#284C3F" stroke-width="8"/><path d="M256 319 Q204 285 145 300 V397 Q207 383 256 419 Q305 383 367 397 V300 Q308 285 256 319Z M256 319 V419"/></g></svg>`;
mat.smallCrest=material(13,'Player small academy crest','#FFFFFF');decal(mat.smallCrest,await texture(smallSvg,'Academy silver chest badge'));
const tieSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="512"><rect width="128" height="512" fill="white"/>${Array.from({length:8},(_,i)=>`<path d="M-20 ${i*80-20}L148 ${i*80+40}" stroke="#BECAC1" stroke-width="9"/>`).join('')}</svg>`;const tieTexture=await texture(tieSvg,'Subtle silver tie stripes');g.materials[mat.tie].pbrMetallicRoughness.baseColorTexture.index=tieTexture;g.materials[mat.tie].extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index=tieTexture;
const outer=part('Academy_Robe'),inner=part('Academy_Lining'),uniform=part('Academy_Uniform'),skirt=part('Academy_Skirt');
// Incumbent lengths and close silhouette, with softer large folds.
const rows=[[.40,.294,.226,.64],[.53,.273,.211,.62],[.65,.247,.190,.60],[.76,.225,.172,.58],[.86,.199,.153,.54],[.94,.172,.134,.53],[1.02,.150,.124,.56],[1.10,.155,.134,.60],[1.20,.160,.134,.62]];
function profile(y){const i=Math.min(rows.length-2,Math.max(0,rows.findIndex((r,k)=>k<rows.length-1&&y<=rows[k+1][0]))),t=smooth((y-rows[i][0])/(rows[i+1][0]-rows[i][0]));return rows[i].map((v,c)=>mix(v,rows[i+1][c],t));}
function lower(v,u,sign,back,inset=0){const y=mix(.40,1.20,v),[,rx,rz,gap]=profile(y),a=back?mix(Math.PI,Math.PI/2,u):mix(gap,Math.PI/2,u),fold=(.0035*Math.cos(a*8)+.0012*Math.cos(a*12))*smooth((1.02-y)/.55);return [sign*Math.sin(a)*(rx+fold-inset),y,Math.cos(a)*(rz+fold-inset)-.012];}
function coons(u,v,bottom,top,left,right){const B=bottom(u),T=top(u),L=left(v),R=right(v),b0=bottom(0),b1=bottom(1),t0=top(0),t1=top(1);return B.map((n,c)=>(1-v)*n+v*T[c]+(1-u)*L[c]+u*R[c]-((1-u)*(1-v)*b0[c]+u*(1-v)*b1[c]+(1-u)*v*t0[c]+u*v*t1[c]));}
function shoulder(v,u,sign,back,inset=0){const bottom=t=>lower(1,t,sign,back,inset),top=t=>{let x,z;if(back&&t<.375){const a=t/.375*Math.PI/2;x=.053*Math.sin(a);z=-.055*Math.cos(a);}else{x=mix(.053,.16,back?(t-.375)/.625:t);z=0;}return [sign*x,1.322+.012*smooth((x-.05)/.11)-inset,z-.012];};const left=t=>{const p=vecmix(bottom(0),top(0),t);p[2]+=(back?-.02:.05)*Math.sin(t*Math.PI);return p;},right=t=>[sign*.16,1.267-(.067-inset)*Math.cos(t*Math.PI),-.012+(back?-1:1)*(.073-inset)*Math.sin(t*Math.PI)];return coons(u,v,bottom,top,left,right);}
function sleeve(v,u,sign,inset=0){const a=u*Math.PI*2,t=smooth(v/.27),rx=mix(.16,.531,v),ry=mix(.067,mix(.058,.060,v),t)-inset,rz=mix(.073,mix(.060,.057,v),t)-inset,fold=.0017*Math.sin(v*25)*Math.exp(-Math.pow((v-.54)/.24,2))*Math.pow(Math.cos(a),2);return [sign*rx,mix(1.267,1.274,t)+Math.cos(a)*(ry+fold),-.012+Math.sin(a)*(rz+fold)];}
for(const sign of [-1,1]){
 for(const back of [false,true])for(const [part,material,inset]of [[outer,mat.robe,0],[inner,mat.lining,.0025]]){
  part.surface(material,26,back?28:20,(v,u)=>({p:lower(v,u,sign,back,inset),tone:.90+.05*Math.cos(u*Math.PI*4)*smooth(1-v)}),p=>[p.x,0,p.z+.012]);
  part.surface(material,14,back?28:20,(v,u)=>({p:shoulder(v,u,sign,back,inset),tone:.95-.025*Math.sin(v*Math.PI)}),p=>[p.x*.2,.3,back?-1:1]);
 }
 for(const [part,material,inset]of [[outer,mat.robe,0],[inner,mat.lining,.0025]])part.surface(material,20,28,(v,u)=>({p:sleeve(v,u,sign,inset),tone:.92+.035*Math.cos(u*Math.PI*2)}),p=>[0,p.y-1.274,p.z+.012]);
 outer.surface(mat.robe,1,40,(v,u)=>({p:vecmix(sleeve(1,u,sign),sleeve(1,u,sign,.0025),v),tone:.9}),()=>[sign,0,0]);
 for(const edge of [.91,.965])outer.surface(mat.silver,1,40,(v,u)=>({p:sleeve(edge+v*.006,u,sign,-.0006),tone:.88}),p=>[0,p.y-1.274,p.z+.012]);
 inner.surface(mat.shirt,2,40,(v,u)=>({p:sleeve(.984+v*.033,u,sign,.004),tone:.98}),p=>[0,p.y-1.274,p.z+.012]);
 // Calm the old wave cuff ornament; retain narrow silver edging.
 for(const back of [false,true])outer.surface(mat.silver,1,40,(v,u)=>({p:lower(.012+v*.003,u,sign,back,-.0008),tone:.85}),p=>[p.x,0,p.z+.012]);
 outer.surface(mat.silver,28,1,(v,u)=>({p:lower(v,u*.004,sign,false,-.0005),tone:.84}),()=>[0,0,1]);
 inner.surface(mat.lining,28,5,(v,u)=>({p:lower(v,.004+u*.045,sign,false,-.0008),tone:.97}),()=>[0,0,1]);
 outer.surface(mat.silver,14,1,(v,u)=>{const p=shoulder(v,.002+u*.008,sign,false);p[2]+=.0008;return {p,tone:.85}},()=>[0,0,1]);
}
// A compact green facing keeps the player's identity without the rigid wide hood flap.
for(const [part,material,offset]of [[inner,mat.lining,.001],[outer,mat.robe,-.002]])part.surface(material,7,44,(v,u)=>{const a=mix(.64,Math.PI*2-.64,u),p=[Math.sin(a)*mix(.057,.104,v),mix(1.326,1.295,v)+.006*Math.sin(v*Math.PI)+offset,Math.cos(a)*mix(.059,.084,v)-.012];return {p,w:rigid('upperChest'),tone:.93}},p=>[p.x,.5,p.z+.012]);
// Shirt and vest share the robe's shoulder weights to keep layers from separating.
uniform.surface(mat.shirt,18,56,(v,u)=>{const y=mix(.975,1.309,v),a=u*Math.PI*2,t=smooth((1.309-y)/.065),width=mix(.052,y>1.10?.133:.119,t),depth=mix(.056,.103,t),p=[Math.sin(a)*width,y,Math.cos(a)*depth-.008];return {p,w:clothWeights(p),tone:.98}},p=>[p.x,0,p.z+.008]);
function vestPoint(v,u,offset=0){const a=u*Math.PI*2,top=1.275-.070*Math.pow(Math.max(0,Math.cos(a)),5),y=mix(top,.963-Math.max(0,Math.cos(a))*.025,v),width=y>1.10?mix(.126,.141,(y-1.10)/.17):.126;return [Math.sin(a)*(width+offset),y,Math.cos(a)*(.116+offset)-.007];}
uniform.surface(mat.vest,22,64,(v,u)=>{const p=vestPoint(v,u);return {p,w:clothWeights(p),tone:.94-.025*Math.cos(v*8)}},p=>[p.x,0,p.z+.007]);
for(const edge of [0,1])uniform.surface(mat.silver,1,64,(v,u)=>{const p=vestPoint(edge? .986+v*.004:.007+v*.004,u,.0008);return {p,w:clothWeights(p),tone:.83}},p=>[p.x,0,p.z+.007]);
for(const sign of [-1,1])uniform.surface(mat.collar,8,7,(v,u)=>{const top=[sign*mix(.008,.039,u),1.303,.058],end=[sign*mix(.012,.035,u),mix(1.280,1.260,u),mix(.096,.105,u)],p=vecmix(top,end,v);p[2]+=.001*Math.sin(v*Math.PI);return {p,w:rigid('upperChest'),tone:.97}},()=>[0,.2,1]);
uniform.surface(mat.tie,5,5,(v,u)=>{const width=mix(.012,.008,v),p=[mix(-width,width,u),mix(1.290,1.267,v),mix(.089,.108,v)+.001*Math.sin(u*Math.PI)];return {p,w:rigid('upperChest'),uv:[u,v*.12]}},()=>[0,0,1]);
uniform.surface(mat.tie,20,6,(v,u)=>{const width=(.008+.007*smooth(v/.5))*(1-smooth((v-.86)/.14)),p=[mix(-width,width,u),mix(1.267,1.110,v),mix(.110,.120,smooth(v/.6))+.001*Math.sin(u*Math.PI)];return {p,w:torso(p[1]),uv:[u,.12+v*.88]}},()=>[0,0,1]);
for(const y of [1.091,1.048,1.005,.969])uniform.surface(mat.silver,4,12,(v,u)=>{const a=u*Math.PI*2,r=Math.sin(v*Math.PI/2)*.0024;return {p:[r*Math.cos(a),y+r*Math.sin(a),.111+.001*Math.cos(v*Math.PI/2)],w:torso(y),tone:.9}},()=>[0,0,1]);
for(const sign of [-1,1])uniform.surface(mat.vest,1,14,(v,u)=>{const x=sign*mix(.035,.080,u),y=1.007+u*.006+v*.002,p=[x,y,Math.sqrt(Math.max(0,1-(x/.126)**2))*.116-.005];return {p,w:torso(y),tone:.73}},()=>[0,0,1]);
function skirtPoint(v,u,inset=0){const a=u*Math.PI*2,pleat=Math.cos(a*16)*.0073*smooth(v),rx=mix(.142,.214,v)+pleat-inset,rz=mix(.117,.174,v)+pleat-inset;return [Math.sin(a)*rx,mix(.97,.687,v),Math.cos(a)*rz-.005];}
skirt.surface(mat.skirt,16,112,(v,u)=>{const p=skirtPoint(v,u);return {p,w:skirtWeights(p[0],p[1]),tone:.82+.15*Math.cos(u*Math.PI*32)*smooth(v)}},p=>[p.x,0,p.z+.005]);
for(const h of [.91,.945])skirt.surface(mat.silver,1,112,(v,u)=>{const p=skirtPoint(h+v*.006,u,-.0006);return {p,w:skirtWeights(p[0],p[1]),tone:.81}},p=>[p.x,0,p.z+.005]);
// Exact lower-panel grid / weights: the crest sits below the 1.028 m hair tips.
for(const sign of [-1,1])outer.surface(mat.crest,8,11,(vv,uu)=>{const v=(12+vv*8)/26,u=uu*11/28,raw=lower(v,u,sign,true),p=lower(v,u,sign,true,-.001);return {p,w:clothWeights(raw),uv:[.5+raw[0]/.205,(.991-raw[1])/.225]}},()=>[0,0,-1]);
outer.surface(mat.smallCrest,14,20,(v,u)=>{const raw=shoulder(v,u,1,false),p=[raw[0],raw[1],raw[2]+.001];return {p,w:clothWeights(raw),uv:[(u-.30)/.39,(.51-v)/.38]}},()=>[0,0,1]);
for(const sign of [-1,1]){const center=shoulder(.72,0,sign,false);center[0]+=sign*.006;center[2]+=.002;outer.surface(mat.silver,4,14,(v,u)=>{const a=u*Math.PI*2,r=Math.sin(v*Math.PI/2);return {p:[center[0]+.0055*r*Math.cos(a),center[1]+.003*r*Math.sin(a),center[2]+.001*Math.cos(v*Math.PI/2)],w:clothWeights(center),tone:.96}},()=>[0,0,1]);}
outer.surface(mat.silver,1,28,(v,u)=>{const p=vecmix(shoulder(.72,0,-1,false),shoulder(.72,0,1,false),u);p[1]-=.004*Math.sin(u*Math.PI)+(v-.5)*.0014;p[2]+=.003+.010*Math.sin(u*Math.PI);return {p,w:rigid('upperChest'),tone:.9}},()=>[0,0,1]);
const details=g.meshes.find(m=>m.name==='Academy_Details');details.primitives=details.primitives.filter(p=>g.materials[p.material].name==='Academy dark leather');
outer.finish();inner.finish();uniform.finish();skirt.finish();
g.extensions.VRMC_vrm.meta.name='Female player — refined academy uniform';g.extensions.VRMC_vrm.meta.version='0.2-female-outfit-review';g.extras={...g.extras,playerRefinement:{baseSha256:'519821d5a5b494b956f8591e548f52533a316bbc1db948befb426390ee807ad6',collarSpan:.078,portrait:'preserved',newHood:false,stage:'player-only art preview'}};
const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}g.buffers[0].byteLength=length;let json=Buffer.from(JSON.stringify(g));if(json.length%4)json=Buffer.concat([json,Buffer.alloc(4-json.length%4,32)]);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(length,0);binHeader.writeUInt32LE(0x004e4942,4);const out=Buffer.concat([header,json,binHeader,...chunks]);return out;
}
