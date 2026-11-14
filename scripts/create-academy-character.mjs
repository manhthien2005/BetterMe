// node scripts/create-academy-character.mjs — deterministic fitting on the pinned licensed VRM.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { BufferGeometry, Float32BufferAttribute, Color } from "three";
import { addAcademyMenswear } from "./academy-menswear.mjs";
import { refineAcademyPlayer } from "./refine-academy-player.mjs";
import { refineKhoaRobe } from "./refine-khoa-robe.mjs";
import { createAcademyNpcCrests } from "./academy-npc-embroidery.mjs";

// These are concrete cast recipes, not a runtime wardrobe/character-creator system.
const recipes = {
  player: { id:"academy-scholar-v1", name:"Reading Quest — Academy Scholar fitting v1" },
  an: { id:"academy-an-v1", name:"Reading Quest — Học giả An", robe:"#3C574B", lining:"#859781", vest:"#3C4540", silver:"#B9AA82", tie:"#536B58", skirt:"#3B4941", hem:.37, width:.96, cuffs:.9, skirtHem:.59, hairEnd:1.18, hairTint:"#C6A18B" },
  khoa: { id:"academy-khoa-v1", name:"Reading Quest — Quản sự Khoa", robe:"#303F55", lining:"#713E4B", vest:"#3D4654", silver:"#BCA575", tie:"#713E4B", hem:.49, width:.79, cuffs:.72, trousers:true, hairEnd:1.35, hairTint:"#504746" },
  minh: { id:"academy-minh-v1", name:"Reading Quest — Thủ thư Minh", robe:"#635044", lining:"#AA956E", vest:"#494540", silver:"#BCAF91", tie:"#49645E", hem:.34, width:.87, cuffs:.66, trousers:true, hairEnd:1.32, hairTint:"#A89587" }
};

async function generateCharacter(key) {
const recipe = recipes[key];
const refinedNpc = key === "an" || key === "minh";
if (key === "khoa") {
  const portrait = fs.readFileSync(new URL("./assets/khoa-portrait-source.vrm", import.meta.url));
  return writeCharacter(recipe.id, await refineKhoaRobe(portrait));
}
const source = fs.readFileSync("public/models/characters/scholar-vrm1.vrm");
const baseHash = "12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2";
assert.equal(createHash("sha256").update(source).digest("hex"), baseHash);
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const originalBinary = source.subarray(28 + jsonLength, 28 + jsonLength + gltf.buffers[0].byteLength);
const chunks = [originalBinary];
let byteLength = originalBinary.length;
const bones = gltf.extensions.VRMC_vrm.humanoid.humanBones;
const skin = gltf.skins[0];
const joint = name => {
  const index = skin.joints.indexOf(bones[name].node);
  assert(index >= 0, `Missing skin joint ${name}`);
  return index;
};
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// One embedded grayscale ramp bakes authored cloth folds without a renderer-specific vertex-colour override.
function pngChunk(type, data) {
  const bytes = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const header = Buffer.alloc(4), checksum = Buffer.alloc(4);
  header.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, bytes, checksum]);
}
const pngHeader = Buffer.alloc(13);
pngHeader.writeUInt32BE(256, 0); pngHeader.writeUInt32BE(1, 4); pngHeader[8] = 8; pngHeader[9] = 2;
const pixels = Buffer.alloc(1 + 256 * 3);
for (let i = 0; i < 256; i++) {
  const linear = i / 255;
  const srgb = linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  pixels.fill(Math.round(srgb * 255), 1 + i * 3, 4 + i * 3);
}
const ramp = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk("IHDR", pngHeader), pngChunk("IDAT", deflateSync(pixels)), pngChunk("IEND", Buffer.alloc(0))]);
const imageView = gltf.bufferViews.push({ buffer:0, byteOffset:byteLength, byteLength:ramp.length }) - 1;
chunks.push(ramp); byteLength += ramp.length;
const imageId = gltf.images.push({ name:"Academy authored cloth shading", bufferView:imageView, mimeType:"image/png" }) - 1;
gltf.samplers ??= [];
const sampler = gltf.samplers.push({ magFilter:9729, minFilter:9729, wrapS:33071, wrapT:33071 }) - 1;
const rampTexture = gltf.textures.push({ source:imageId, sampler }) - 1;

function accessor(array, type, componentType = 5126) {
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type];
  assert.equal(array.length % components, 0);
  assert(Array.from(array).every(Number.isFinite));
  const pad = (4 - byteLength % 4) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); byteLength += pad; }
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const bufferView = gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length }) - 1;
  chunks.push(bytes); byteLength += bytes.length;
  const min = [], max = [];
  for (let c = 0; c < components; c++) {
    let low = Infinity, high = -Infinity;
    for (let i = c; i < array.length; i += components) { low = Math.min(low, array[i]); high = Math.max(high, array[i]); }
    min.push(low); max.push(high);
  }
  return gltf.accessors.push({ bufferView, componentType, count: array.length / components, type, min, max }) - 1;
}

function originalAccessor(id) {
  const a = gltf.accessors[id], v = gltf.bufferViews[a.bufferView];
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
  const count = a.count * components;
  const offset = (v?.byteOffset ?? 0) + (a.byteOffset ?? 0);
  assert(!v?.byteStride, "Pinned sample uses tightly packed attributes");
  const bytes = a.componentType === 5123 ? 2 : 4;
  const result = Array.from({ length: count }, (_, i) => !v ? 0 : a.componentType === 5123
    ? originalBinary.readUInt16LE(offset + i * bytes)
    : a.componentType === 5125 ? originalBinary.readUInt32LE(offset + i * bytes)
      : originalBinary.readFloatLE(offset + i * bytes));
  if (a.sparse) {
    const {indices,values,count:sparseCount}=a.sparse;
    assert.equal(a.componentType,5126,"Pinned sparse morph values are float32");
    assert.equal(indices.componentType,5125,"Pinned sparse morph indices are uint32");
    const indexOffset=(gltf.bufferViews[indices.bufferView].byteOffset??0)+(indices.byteOffset??0);
    const valueOffset=(gltf.bufferViews[values.bufferView].byteOffset??0)+(values.byteOffset??0);
    for(let i=0;i<sparseCount;i++) {
      const index=originalBinary.readUInt32LE(indexOffset+i*4);
      for(let c=0;c<components;c++)result[index*components+c]=originalBinary.readFloatLE(valueOffset+(i*components+c)*4);
    }
  }
  return result;
}

function material(name, hex, shade = 0.66, side = false) {
  const color = new Color(hex).toArray();
  return gltf.materials.push({
    name, doubleSided: side,
    pbrMetallicRoughness: { baseColorFactor: [...color, 1], baseColorTexture:{ index:rampTexture }, metallicFactor: 0, roughnessFactor: 0.88 },
    extensions: { VRMC_materials_mtoon: {
      specVersion: "1.0", shadeColorFactor: color.map(c => c * shade),
      shadeMultiplyTexture: { index:rampTexture },
      shadingShiftFactor: -0.08, shadingToonyFactor: 0.55, giEqualizationFactor: 0.35,
      outlineWidthMode: "worldCoordinates", outlineWidthFactor: 0.00045,
      outlineColorFactor: [0.008, 0.012, 0.012], outlineLightingMixFactor: 0.6,
      parametricRimColorFactor: color.map(c => c * 0.06), parametricRimFresnelPowerFactor: 3
    } }
  }) - 1;
}
const mat = {
  robe: material("Academy charcoal wool", recipe.robe ?? "#232A2D"),
  lining: material("Academy forest lining", recipe.lining ?? "#284C3F"),
  shirt: material("Academy ivory cotton", "#DDDCD2", 0.78),
  vest: material("Academy fitted waistcoat", key === "khoa" ? "#363A3C" : recipe.vest ?? "#343C3E"),
  skirt: material("Academy pleated wool", recipe.skirt ?? "#303638"),
  silver: material("Academy pewter piping", recipe.silver ?? "#9CA7A1", 0.82),
  tie: material("Academy green tie", recipe.tie ?? "#284B3C"),
  boots: material("Academy dark leather", "#272C2D"),
  tights: material("Academy opaque stockings", "#2C3033", 0.8)
};

const rigid = name => [[joint(name), 1]];
function blend(a, b, t) { return [[joint(a), 1 - clamp(t)], [joint(b), clamp(t)]]; }
function torsoWeights(y) {
  if (y < 0.97) return blend("hips", "spine", (y - 0.92) / 0.05);
  if (y < 1.09) return blend("spine", "chest", (y - 0.97) / 0.12);
  return blend("chest", "upperChest", (y - 1.09) / 0.13);
}
function skirtWeights(x, y) {
  const side = x >= 0 ? "left" : "right";
  const follow = smooth((0.90 - y) / 0.29) * smooth(Math.abs(x) / 0.12) * 0.62;
  return blend("hips", `${side}UpperLeg`, follow);
}

// Parts are merged by material, keeping only a handful of draw calls per garment.
function part(name, replaceNode) {
  const groups = new Map();
  function surface(materialId, rows, columns, sample, reverse = false) {
    let g = groups.get(materialId);
    if (!g) { g = { positions: [], uvs: [], weights: [], joints: [], indices: [] }; groups.set(materialId, g); }
    const start = g.positions.length / 3;
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= columns; c++) {
      const { p: samplePosition, w, tone = 1, uv } = sample(r / rows, c / columns);
      const p = [...samplePosition];
      g.positions.push(...p);
      g.uvs.push(...(uv ?? [(clamp(tone) * 255 + 0.5) / 256, 0.5]));
      const active = w.filter(([, v]) => v > 0);
      assert(active.length <= 4);
      const sum = active.reduce((s, [, v]) => s + v, 0);
      for (let i = 0; i < 4; i++) { g.joints.push(active[i]?.[0] ?? 0); g.weights.push((active[i]?.[1] ?? 0) / sum); }
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
      const a = start + r * (columns + 1) + c, b = a + columns + 1;
      g.indices.push(...(reverse ? [a, b, a + 1, a + 1, b, b + 1] : [a, a + 1, b, a + 1, b + 1, b]));
    }
  }
  function polygon(materialId, points, w) {
    // A fan with duplicated vertices makes cloth folds and lapel edges crisp.
    for (let i = 1; i < points.length - 1; i++) {
      const p = [points[0], points[i], points[i + 1]];
      surface(materialId, 1, 1, (v, u) => ({
        p: v ? p[2] : p[u ? 1 : 0], w: typeof w === "function" ? w((v ? p[2] : p[u ? 1 : 0])[1]) : w
      }));
    }
  }
  function finish() {
    const primitives = [];
    for (const [materialId, g] of groups) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(g.positions, 3));
      geometry.setIndex(g.indices); geometry.computeVertexNormals();
      primitives.push({
        attributes: {
          POSITION: accessor(new Float32Array(g.positions), "VEC3"),
          NORMAL: accessor(geometry.attributes.normal.array, "VEC3"),
          TEXCOORD_0: accessor(new Float32Array(g.uvs), "VEC2"),
          JOINTS_0: accessor(new Uint16Array(g.joints), "VEC4", 5123),
          WEIGHTS_0: accessor(new Float32Array(g.weights), "VEC4")
        },
        indices: accessor(new Uint32Array(g.indices), "SCALAR", 5125), material: materialId
      });
      geometry.dispose();
    }
    if (replaceNode) {
      gltf.meshes[replaceNode.mesh] = { name, primitives };
      replaceNode.name = name;
      replaceNode.skin = 0;
      return;
    }
    const mesh = gltf.meshes.push({ name, primitives }) - 1;
    const node = gltf.nodes.push({ name, mesh, skin: 0 }) - 1;
    gltf.scenes[gltf.scene ?? 0].nodes.push(node);
    gltf.extensions.VRMC_vrm.firstPerson?.meshAnnotations?.push({ node, type: "both" });
  }
  return { surface, polygon, finish };
}

// Retain the sample neck/hands, and reuse the actual leg shape for opaque stockings.
const body = gltf.meshes[0], skinPrimitive = body.primitives.find(p => p.material === 0);
const positions = originalAccessor(skinPrimitive.attributes.POSITION);
const originalIndices = originalAccessor(skinPrimitive.indices);
const exposed = [], stocking = [];
for (let i = 0; i < originalIndices.length; i += 3) {
  const tri = originalIndices.slice(i, i + 3);
  const y = tri.reduce((s, idx) => s + positions[idx * 3 + 1], 0) / 3;
  const x = tri.reduce((s, idx) => s + Math.abs(positions[idx * 3]), 0) / 3;
  if (y < (recipe.trousers ? 0.975 : 0.79)) stocking.push(...tri);
  else if ((y > 1.305 && (key === "player" || x < .065)) || (y > 1.275 && x < 0.055) || x > 0.535) exposed.push(...tri);
}
const stockingUvs = new Float32Array(positions.length / 3 * 2);
for (let i = 0; i < stockingUvs.length; i += 2) { stockingUvs[i] = 255.5 / 256; stockingUvs[i + 1] = 0.5; }
body.primitives = body.primitives.filter(p => ![0, 1, 3].includes(p.material));
body.primitives.unshift(
  { ...skinPrimitive, indices: accessor(new Uint32Array(exposed), "SCALAR", 5125) },
  { ...skinPrimitive, attributes:{ ...skinPrimitive.attributes, TEXCOORD_0:accessor(stockingUvs,"VEC2") }, indices: accessor(new Uint32Array(stocking), "SCALAR", 5125), material: mat.tights }
);
if (recipe.trousers) {
  const pants = Float32Array.from(positions);
  for (let i = 0; i < pants.length; i += 3) {
    const x = pants[i], y = pants[i + 1], z = pants[i + 2];
    const ease = smooth((y - 0.13) / 0.12) * (1 - smooth((y - .85) / .12));
    pants[i] = x + Math.sign(x) * (key === "khoa" ? .021 : .012) * ease;
    pants[i + 2] = z + Math.sign(z + .02) * (key === "khoa" ? .021 : .012) * ease;
  }
  body.primitives[1].attributes = { ...body.primitives[1].attributes, POSITION:accessor(pants,"VEC3") };
  body.primitives[1].material = mat.vest;
}
// Keep the approved sole geometry, replacing the sample sneaker artwork with plain leather.
for (const primitive of body.primitives.filter(p => p.material === 2)) {
  const uvs = new Float32Array(gltf.accessors[primitive.attributes.POSITION].count * 2);
  for (let i = 0; i < uvs.length; i += 2) { uvs[i] = 255.5 / 256; uvs[i + 1] = 0.5; }
  primitive.attributes = { ...primitive.attributes, TEXCOORD_0:accessor(uvs, "VEC2") };
  primitive.material = mat.boots;
}

// Shorten the sample strands into different silhouettes. Shortened hair follows the
// head directly; retaining low spring joints would rotate it around the old long tips.
if (recipe.hairEnd && key !== "khoa") {
  const hairMesh = gltf.meshes.find(mesh => /hair/i.test(mesh.name));
  assert(hairMesh, "Pinned sample must contain a named hair mesh");
  const hairNode = gltf.nodes.find(node=>node.mesh===gltf.meshes.indexOf(hairMesh));
  const hairHead = gltf.skins[hairNode.skin].joints.indexOf(bones.head.node);
  assert(hairHead >= 0, "Hair skin must contain the head joint");
  const edited = new Map();
  for (const primitive of hairMesh.primitives) {
    const sourceId = primitive.attributes.POSITION;
    if (!edited.has(sourceId)) {
      const p = Float32Array.from(originalAccessor(sourceId));
      const j = new Uint16Array(p.length / 3 * 4), w = new Float32Array(j.length);
      for (let i = 0; i < p.length; i += 3) {
        if (p[i+1] < 1.40) {
          const length = smooth((1.40-p[i+1])/.24);
          p[i+1] = 1.40 - (1.40-p[i+1]) * ((1.40-recipe.hairEnd) / .36);
          const tuck = key === "an" ? .06 : .32;
          p[i] *= 1-length*tuck;
          p[i+2] = mix(p[i+2],-.025,length*tuck*1.8);
        }
        j[i/3*4] = hairHead; w[i/3*4] = 1;
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(p,3));
      geometry.setIndex(originalAccessor(primitive.indices)); geometry.computeVertexNormals();
      edited.set(sourceId, {POSITION:accessor(p,"VEC3"),NORMAL:accessor(geometry.attributes.normal.array,"VEC3"),JOINTS_0:accessor(j,"VEC4",5123),WEIGHTS_0:accessor(w,"VEC4")});
      geometry.dispose();
    }
    primitive.attributes = { ...primitive.attributes, ...edited.get(sourceId) };
  }
  for(const hairMat of gltf.materials.filter(m=>/HAIR/.test(m.name))) {
    const tint = new Color(recipe.hairTint).toArray();
    hairMat.pbrMetallicRoughness.baseColorFactor = [...tint,1];
    hairMat.extensions.VRMC_materials_mtoon.shadeColorFactor = tint.map(c=>c*.65);
  }
}

if (key === "khoa") {
  body.primitives.splice(1,1);
  // Reshape neutral vertices AND their morph endpoints so blink/expressions still fit.
  const face = gltf.meshes.find(mesh => mesh.name === "Face");
  const shapeFace = ([x,y,z], materialId) => {
    const jaw = (1-smooth((y-1.405)/.045))*smooth((y-1.34)/.035);
    const eye = smooth((y-1.409)/.016)*(1-smooth((y-1.468)/.016))*smooth((z-.025)/.025);
    let py = y + (1.445-y)*.26*eye - .008*jaw*(1-smooth((y-1.38)/.025));
    if (materialId === 10) py = 1.472 + (y-1.472)*1.35 - .006;
    return [x*(1+.18*jaw),py,z+.003*jaw];
  };
  for (const id of [0,5,7]) {
    const toon=gltf.materials[id].extensions.VRMC_materials_mtoon;
    toon.shadeColorFactor=[.93,.76,.70];
    if(toon.outlineColorFactor)toon.outlineColorFactor=[.07,.038,.028];
  }
  for (const primitive of face.primitives) {
    const positions = originalAccessor(primitive.attributes.POSITION);
    const transformed = positions.map((_,i)=>shapeFace(positions.slice(i-i%3,i-i%3+3),primitive.material)[i%3]);
    for (const target of primitive.targets ?? []) {
      if (target.POSITION === undefined) continue;
      const deltas = originalAccessor(target.POSITION), out = new Float32Array(deltas.length);
      for (let i=0;i<deltas.length;i+=3) {
        const end = shapeFace([positions[i]+deltas[i],positions[i+1]+deltas[i+1],positions[i+2]+deltas[i+2]],primitive.material);
        for(let c=0;c<3;c++)out[i+c]=end[c]-transformed[i+c];
      }
      target.POSITION=accessor(out,"VEC3");
    }
    const geometry=new BufferGeometry();
    geometry.setAttribute("position",new Float32BufferAttribute(transformed,3));
    geometry.setIndex(originalAccessor(primitive.indices));geometry.computeVertexNormals();
    primitive.attributes={...primitive.attributes,POSITION:accessor(Float32Array.from(transformed),"VEC3"),NORMAL:accessor(geometry.attributes.normal.array,"VEC3")};
    geometry.dispose();
  }
  body.primitives=body.primitives.filter(p=>p.material!==4);
  const hairNode=gltf.nodes.find(node=>node.mesh!==undefined && /hair/i.test(gltf.meshes[node.mesh].name));
  assert(hairNode,"Pinned sample hair node missing");
  const shortHair=part("Academy_ShortHair",hairNode);
  const hairMat=material("Academy Khoa dark chestnut hair","#49372D",.7,true);
  // Short tapered sides and a side-parted fringe, authored in the head's rest space.
  shortHair.surface(hairMat,20,72,(v,u)=>{
    const a=u*Math.PI*2, front=Math.max(0,Math.cos(a));
    const bottom=mix(1.98,1.12,front*front)+.035*Math.sin(a*11);
    const polar=.015+v*bottom;
    const ridge=1+.018*Math.cos(a*9+v*3)*Math.sin(polar);
    return {p:[Math.sin(a)*Math.sin(polar)*.108*ridge-.006*(1-v),1.489+Math.cos(polar)*.122, -.025+Math.cos(a)*Math.sin(polar)*.116*ridge],w:rigid("head"),tone:.86+.045*Math.cos(a*19+v*3)};
  },true);
  // Uneven, broad locks travel diagonally across the forehead; tips remain above the frames.
  for (const [start,end,endY,width] of [[.045,-.030,1.474,.034],[.040,-.052,1.487,.035],[.027,-.076,1.482,.032],[.011,-.092,1.459,.026],[-.010,-.104,1.452,.020],[.050,.067,1.495,.029],[.065,.089,1.477,.025],[.081,.102,1.452,.020]]) {
    shortHair.surface(hairMat,20,10,(v,u)=>{
      const t=smooth(v),taper=1-smooth((v-.57)/.43),x=mix(start,end,t)+(u-.5)*width*taper;
      const y=mix(1.595-Math.abs(start-.035)*.32,endY,t);
      const z=-.025+.119*Math.sqrt(Math.max(.01,1-Math.pow((y-1.489)/.125,2)-Math.pow(x/.114,2)))+.004+Math.sin(u*Math.PI)*.002;
      const highlight=Math.exp(-Math.pow((v-.43)/.18,2));
      return {p:[x,y,z],w:rigid("head"),tone:.77+Math.sin(u*Math.PI)*.16+highlight*.07};
    },true);
  }
  shortHair.finish();
}

if (key === "khoa") {
  addAcademyMenswear({part,mat,rigid,blend,torsoWeights,joint,mix,smooth});
} else {
const robe = part("Academy_Robe"), lining = part("Academy_Lining");
// y, half width, half depth, opening half angle. The silhouette is authored in rest space.
const profile = [
  [1.318, 0.064, 0.066, 0.38], [1.285, 0.123, 0.086, 0.44],
  [1.245, 0.161, 0.105, 0.56], [1.18, 0.166, 0.121, 0.60],
  [1.10, 0.154, 0.125, 0.60], [1.02, 0.148, 0.116, 0.56],
  [0.94, 0.172, 0.132, 0.53], [0.86, 0.199, 0.151, 0.54],
  [0.76, 0.225, 0.170, 0.58], [0.65, 0.248, 0.190, 0.60],
  [0.53, 0.278, 0.213, 0.62], [0.40, 0.302, 0.232, 0.64]
];
function robePoint(v, u, inset = 0) {
  const t = v * (profile.length - 1), index = Math.min(profile.length - 2, Math.floor(t));
  const f = t - index, row = profile[index].map((n, i) => mix(n, profile[index + 1][i], f));
  let [y, rx, rz, gap] = row;
  if (recipe.hem) {
    if (y < .94) y = mix(.94,recipe.hem,(.94-y)/(.94-.40));
    rx *= mix(1, recipe.width, smooth((1.10-y)/.5));
    rz = Math.max(rz,.124*smooth((1.316-y)/.055));
  }
  const angle = mix(gap, Math.PI * 2 - gap, u);
  const fold = Math.sin(angle * 9 + 0.4) * 0.005 * smooth((1.02 - y) / 0.55);
  const x = (rx + fold - inset) * Math.sin(angle), z = (rz + fold - inset) * Math.cos(angle) - 0.012;
  const tone = 0.84 + Math.cos(angle * 9 + 0.4) * 0.12 * smooth((1.03 - y) / 0.25);
  return { p: [x, y, z], w: y >= 0.94 ? torsoWeights(y) : skirtWeights(x, y), tone };
}
robe.surface(mat.robe, 44, 64, (v, u) => robePoint(v, u), true);
lining.surface(mat.lining, 44, 64, (v, u) => robePoint(v, u, 0.003));
for (const side of [0, 1]) {
  robe.surface(mat.silver, 44, 1, (v, u) => robePoint(v, side === 0 ? 0.001 + u * 0.0025 : 0.999 - u * 0.0025, -0.001), side === 0);
  lining.surface(mat.lining, 44, 5, (v, u) => robePoint(v, side === 0 ? 0.004 + u * 0.045 : 0.996 - u * 0.045, -0.001), side === 0);
}
robe.surface(mat.silver, 1, 64, (v, u) => robePoint(0.992 + v * 0.004, u, -0.001), true);

// Fitted shoulders and softly flared cuffs, skinned across elbow instead of rigid tubes.
for (const side of [1, -1]) {
  const prefix = side === 1 ? "left" : "right";
  const sleeve = (v, u, inset = 0) => {
    const x = mix(0.095, 0.535, v) * side, angle = u * Math.PI * 2;
    const elbow = smooth((Math.abs(x) - 0.285) / 0.10);
    const radius = (mix(0.062, 0.055, v) + Math.sin(v * Math.PI) * 0.01 + Math.pow(v, 5) * 0.016) * mix(1, recipe.cuffs ?? 1, v) - inset;
    const shoulder = smooth((Math.abs(x) - 0.095) / 0.10);
    const w = [[joint("upperChest"), 1 - shoulder], [joint(`${prefix}UpperArm`), shoulder * (1 - elbow)], [joint(`${prefix}LowerArm`), shoulder * elbow]];
    return { p: [x, 1.274 + Math.cos(angle) * radius, -0.025 + Math.sin(angle) * radius * 0.92], w, tone:0.88 + Math.cos(angle * 5) * 0.09 * Math.pow(v, 2) };
  };
  robe.surface(mat.robe, 20, 28, (v, u) => sleeve(v, u), side === -1);
  lining.surface(mat.lining, 20, 28, (v, u) => sleeve(v, u, 0.003), side === 1);
  robe.surface(mat.silver, 1, 28, (v, u) => sleeve(0.958 + 0.012 * v, u, -0.001), side === -1);
  robe.surface(mat.silver, 1, 28, (v, u) => sleeve(0.914 + 0.005 * v, u, -0.001), side === -1);
  // Small original stitched-wave cuff motif, separate from the reference's house embroidery.
  if (!refinedNpc) robe.surface(mat.silver, 1, 80, (v, u) => sleeve(0.82 + Math.sin(u * Math.PI * 12) * 0.024 + v * 0.003, u, -0.001), side === -1);
  lining.surface(mat.lining, 1, 28, (v, u) => sleeve(1, u, v * 0.003), side === -1);
}
// Folded hood/collar: the green facing rests over the shoulders, with a dark underside.
function hoodPoint(v, u, offset = 0) {
  const angle = mix(0.44, Math.PI * 2 - 0.44, u);
  const radiusX = mix(0.067, key === "an" ? 0.140 : 0.183, v);
  const back = Math.max(0, -Math.cos(angle));
  const radiusZ = mix(0.061, (key === "an" ? 0.115 : 0.135) - back * 0.055, v);
  const y = mix(1.327, 1.268, v) + Math.sin(v * Math.PI) * 0.016 + offset;
  return { p:[Math.sin(angle) * radiusX, y, Math.cos(angle) * radiusZ - 0.023], w:rigid("upperChest"), tone:0.76 + Math.sin(v * Math.PI) * 0.22 };
}
if (key === "player" || key === "an") {
  lining.surface(mat.lining, 8, 48, (v,u)=>hoodPoint(v,u), true);
  robe.surface(mat.robe, 8, 48, (v,u)=>hoodPoint(v,u,-0.003));
  robe.surface(mat.silver, 1, 48, (v,u)=>hoodPoint(0.968+v*0.012,u,0.001), true);
}
robe.finish(); lining.finish();

const uniform = part("Academy_Uniform");
uniform.surface(mat.shirt, 16, 48, (v, u) => {
  const y = mix(1.31, 0.97, v), angle = u * Math.PI * 2;
  const width = y > 1.25 ? mix(0.058, 0.137, (1.31 - y) / 0.06) : mix(0.137, 0.119, (1.25 - y) / 0.28);
  const depth = y > 1.25 ? mix(0.061, 0.103, (1.31 - y) / 0.06) : 0.107;
  return { p: [Math.sin(angle) * width, y, Math.cos(angle) * depth - 0.008], w: torsoWeights(y) };
}, true);
function vestPoint(v, u, offset = 0) {
  const angle = u * Math.PI * 2;
  const top = 1.267 - (refinedNpc ? 0.064 : 0.102) * Math.pow(Math.max(0, Math.cos(angle)), 5);
  const y = mix(top, 0.963 - Math.max(0, Math.cos(angle)) * 0.025, v);
  const width = y > 1.10 ? mix(0.126, 0.141, (y - 1.10) / 0.17) : 0.126;
  return { p: [Math.sin(angle) * (width + offset), y, Math.cos(angle) * (0.116 + offset) - 0.007], w: torsoWeights(y), tone:0.92 };
}
uniform.surface(mat.vest, 20, 64, (v, u) => vestPoint(v, u), true);
uniform.surface(mat.silver, 1, 64, (v, u) => vestPoint(0.008 + v * 0.006, u, 0.001), true);
uniform.surface(mat.silver, 1, 64, (v, u) => vestPoint(0.982 + v * 0.006, u, 0.001), true);
// White folded collar leaves framing the knot.
const collarMaterial = refinedNpc ? material("Academy compact collar", "#DDDCD2", 0.78) : mat.shirt;
for (const sign of [1, -1]) {
  const collar = refinedNpc
    ? [[0.006 * sign, 1.301, 0.060], [0.034 * sign, 1.296, 0.052], [0.040 * sign, 1.258, 0.104], [0.021 * sign, 1.269, 0.109]]
    : [[0.006 * sign, 1.301, 0.060], [0.048 * sign, 1.296, 0.052], [0.060 * sign, 1.238, 0.104], [0.025 * sign, 1.259, 0.109]];
  uniform.polygon(collarMaterial, sign === 1 ? collar.reverse() : collar, rigid("upperChest"));
}
const tie = [[-0.013, 1.277, 0.096], [0.013, 1.277, 0.096], [0.020, 1.129, 0.119], [0, 1.107, 0.122], [-0.020, 1.129, 0.119]];
uniform.polygon(mat.tie, [...tie].reverse(), torsoWeights);
uniform.polygon(mat.tie, [[-0.016, 1.292, 0.078], [0, 1.264, 0.106], [0.016, 1.292, 0.078]], rigid("upperChest"));
for (let i = 0; i < 5; i++) {
  const y = 1.146 + i * 0.025, z = 0.121 - (y - 1.146) * 0.14;
  uniform.polygon(mat.silver, [[-0.016, y, z], [0.016, y + 0.012, z], [0.016, y + 0.016, z], [-0.016, y + 0.004, z]], torsoWeights);
}
// Waistcoat button line and two pocket welts, with physical thickness kept minimal.
for (const y of [1.118, 1.071, 1.024, 0.979]) {
  uniform.surface(mat.silver, 1, 12, (v, u) => {
    const theta = u * Math.PI * 2, radius = v * 0.0032;
    return { p: [Math.cos(theta) * radius, y + Math.sin(theta) * radius, 0.113], w: torsoWeights(y) };
  });
}
for (const sign of [1, -1]) {
  const pocket = [[0.035 * sign, 1.01, 0.112], [0.082 * sign, 1.018, 0.091], [0.082 * sign, 1.021, 0.091], [0.035 * sign, 1.013, 0.112]];
  uniform.polygon(mat.silver, sign === 1 ? pocket : pocket.reverse(), torsoWeights);
}
uniform.finish();

if (!recipe.trousers) {
const skirt = part("Academy_Skirt");
skirt.surface(mat.skirt, 12, 128, (v, u) => {
  const a = u * Math.PI * 2, pleat = Math.cos(a * 16) * 0.008 * smooth(v);
  const rx = mix(0.142, 0.214, v) + pleat, rz = mix(0.117, 0.174, v) + pleat;
  const y = mix(0.97, recipe.skirtHem ?? 0.687, v), x = Math.sin(a) * rx;
  return { p: [x, y, Math.cos(a) * rz - 0.005], w: skirtWeights(x, y), tone:key === "an" ? 0.84 + Math.cos(a * 16) * 0.10 : 0.72 + Math.cos(a * 16) * 0.23 };
}, true);
for (const y of recipe.skirtHem ? [recipe.skirtHem+.015,recipe.skirtHem+.025] : [0.702, 0.712]) skirt.surface(mat.silver, 1, 128, (v, u) => {
  const a = u * Math.PI * 2, r = (0.97 - (y + v * 0.002)) / (0.97 - (recipe.skirtHem ?? 0.687));
  const pleat = Math.cos(a * 16) * 0.008 * smooth(r), x = Math.sin(a) * (mix(0.142, 0.214, r) + pleat + 0.001);
  return { p: [x, y + v * 0.002, Math.cos(a) * (mix(0.117, 0.174, r) + pleat + 0.001) - 0.005], w: skirtWeights(x, y) };
});
skirt.finish();
}

const details = part("Academy_Details");
// Boot uppers meet the original black shoe soles; foot/ankle weights retain the approved contact.
for (const side of [1, -1]) {
  const prefix = side === 1 ? "left" : "right";
  details.surface(mat.boots, 12, 28, (v, u) => {
    const y = mix(0.18, 0.075, v), angle = u * Math.PI * 2, radius = mix(0.034, 0.037, v);
    return { p: [side * 0.077156 + Math.sin(angle) * radius, y, -0.027 + Math.cos(angle) * radius], w: blend(`${prefix}LowerLeg`, `${prefix}Foot`, smooth((0.15 - y) / 0.07)) };
  }, true);
}
// Original book-and-star badge; no house logo is taken from the supplied references.
if (!refinedNpc) {
const badge = [[0.073, 1.217, 0.118], [0.105, 1.217, 0.097], [0.106, 1.182, 0.098], [0.089, 1.170, 0.113], [0.073, 1.182, 0.119]];
details.polygon(mat.lining, [...badge].reverse(), rigid("upperChest"));
details.polygon(mat.silver, [[0.077, 1.202, 0.121], [0.088, 1.200, 0.116], [0.088, 1.181, 0.116], [0.077, 1.185, 0.121]].reverse(), rigid("upperChest"));
details.polygon(mat.shirt, [[0.090, 1.200, 0.115], [0.102, 1.205, 0.105], [0.102, 1.187, 0.105], [0.090, 1.181, 0.115]].reverse(), rigid("upperChest"));
}
details.finish();
if (refinedNpc) {
  const embroidery = part("Academy_Embroidery");
  const images = await createAcademyNpcCrests(recipe.silver);
  const sampler = gltf.samplers.push({magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}) - 1;
  const materials = images.map((bytes, index) => {
    const pad = (4 - byteLength % 4) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); byteLength += pad; }
    const view = gltf.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:bytes.length}) - 1;
    chunks.push(bytes); byteLength += bytes.length;
    const name = index === 0 ? "Academy back crest" : "Academy chest crest";
    const texture = gltf.textures.push({source:gltf.images.push({name,bufferView:view,mimeType:"image/png"}) - 1,sampler}) - 1;
    const id = material(name, "#FFFFFF", .78, true), m = gltf.materials[id];
    m.alphaMode = "MASK"; m.alphaCutoff = .3;
    m.pbrMetallicRoughness.baseColorTexture.index = texture;
    m.extensions.VRMC_materials_mtoon.shadeMultiplyTexture.index = texture;
    m.extensions.VRMC_materials_mtoon.outlineWidthFactor = 0;
    return id;
  });
  // Exact robe grid and weights, cropped to the artwork region rather than a floating card.
  const startRow = key === "an" ? 13 : 9, endRow = key === "an" ? 27 : 22;
  const top = key === "an" ? 1.14 : 1.22;
  embroidery.surface(materials[0], endRow-startRow, 16, (v,u) => {
    const row = (startRow + v*(endRow-startRow))/44, column = (24+u*16)/64;
    const raw = robePoint(row,column), point = robePoint(row,column,-.0015);
    return {...point,w:raw.w,uv:[.5+raw.p[0]/.20,(top-raw.p[1])/.24]};
  }, true);
  embroidery.surface(materials[1], 8, 8, (v,u) => {
    const row = (12+v*8)/44,column = (56+u*8)/64;
    const raw = robePoint(row,column),point = robePoint(row,column,-.0015);
    return {...point,w:raw.w,uv:[.5+(raw.p[0]+.132)/.043,(1.17-raw.p[1])/.062]};
  }, true);
  embroidery.finish();
}
}

if (key !== "player" && key !== "khoa") {
  const role = part("Academy_RoleDetails");
  if (key === "an") {
    const mantle = (v,u,inset=0) => {
      const a=mix(.50,Math.PI*2-.50,u), x=Math.sin(a)*mix(.066,.288,v);
      const y=mix(1.344,1.270,v)+Math.sin(v*Math.PI)*.025;
      const z=Math.cos(a)*mix(.060,.133,v)-.020;
      const side=x>=0?"left":"right", follow=smooth((Math.abs(x)-.10)/.14)*.8;
      return {p:[x,y-inset,z],w:blend("upperChest",`${side}UpperArm`,follow),tone:.87+Math.cos(a*8)*.06*v};
    };
    role.surface(mat.robe,12,64,(v,u)=>mantle(v,u),true);
    role.surface(mat.lining,12,64,(v,u)=>mantle(v,u,.003));
    role.surface(mat.silver,1,64,(v,u)=>mantle(.965+v*.012,u,-.001),true);
  }
  if (key === "minh") {
    // Two draped scholar bands frame the shirt without occupying the book hand.
    for (const sign of [1,-1]) {
      const stole=(v,u)=>{const y=mix(1.292,.985,v),x=sign*mix(.058,.102,u);return {p:[x,y,.122-Math.pow((y-1.08)/.25,2)*.027],w:torsoWeights(y),tone:.93};};
      role.surface(mat.lining,20,6,stole,sign===1);
      role.surface(mat.silver,20,1,(v,u)=>stole(v,.02+u*.035),sign===1);
      role.surface(mat.silver,1,6,(v,u)=>stole(.93+v*.008,u),sign===1);
    }
    // Lens-free round frames keep the existing eye expressions unobscured.
    for(const sign of [1,-1]) {
      role.surface(mat.silver,6,48,(v,u)=>{const a=u*Math.PI*2,b=v*Math.PI*2,r=.025+Math.cos(b)*.0015;return {p:[sign*.037+Math.cos(a)*r,1.442+Math.sin(a)*r*.83,.087+Math.sin(b)*.0015],w:rigid("head")};},true);
      role.polygon(mat.silver,[[sign*.061,1.443,.087],[sign*.091,1.446,.016],[sign*.091,1.448,.016],[sign*.061,1.445,.087]],rigid("head"));
    }
    role.polygon(mat.silver,[[-.012,1.443,.088],[.012,1.443,.088],[.012,1.446,.088],[-.012,1.446,.088]],rigid("head"));
  }
  role.finish();
}

// Keep all original license fields and authors; identify the derivative truthfully.
gltf.extensions.VRMC_vrm.meta.name = recipe.name;
gltf.extensions.VRMC_vrm.meta.version = "1.0-fitting";
delete gltf.extensions.VRMC_vrm.meta.thumbnailImage; // The sample thumbnail shows the old outfit.
gltf.extras = { ...gltf.extras, academyFitting: { baseSha256: baseHash, source: "scripts/create-academy-character.mjs", stage: "outfit-fitting; original face and hair" } };
if (key !== "player") gltf.extras.academyFitting = { ...gltf.extras.academyFitting, stage:"NPC outfit-fitting; original face, restyled hair", role:key };
if (key === "khoa") gltf.extras.academyFitting.stage="male NPC fitting; reshaped face/morphs, short hair, structured uniform";
gltf.buffers = [{ byteLength }];
const json = Buffer.from(JSON.stringify(gltf)), jsonPad = Buffer.alloc((4 - json.length % 4) % 4, 0x20);
const binary = Buffer.concat(chunks), binaryPad = Buffer.alloc((4 - binary.length % 4) % 4);
const out = Buffer.alloc(12 + 8 + json.length + jsonPad.length + 8 + binary.length + binaryPad.length);
out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
out.writeUInt32LE(json.length + jsonPad.length, 12); out.writeUInt32LE(0x4e4f534a, 16);
Buffer.concat([json, jsonPad]).copy(out, 20);
const binaryOffset = 20 + json.length + jsonPad.length;
out.writeUInt32LE(binary.length + binaryPad.length, binaryOffset); out.writeUInt32LE(0x004e4942, binaryOffset + 4);
binary.copy(out, binaryOffset + 8);
const character = key === "player" ? await refineAcademyPlayer(out) : out;
return writeCharacter(recipe.id, character);
}

function writeCharacter(id, character) {
const characterJson = JSON.parse(character.subarray(20, 20 + character.readUInt32LE(12)).toString());
fs.writeFileSync(`public/models/characters/${id}.vrm`, character);
const metrics = {
  fileSizeBytes: character.length, sha256: createHash("sha256").update(character).digest("hex"),
  meshCount: characterJson.meshes.length, primitiveCount: characterJson.meshes.reduce((n, m) => n + m.primitives.length, 0),
  materialCount: characterJson.materials.length,
  triangleCount: characterJson.meshes.reduce((n, m) => n + m.primitives.reduce((s, p) => s + characterJson.accessors[p.indices].count / 3, 0), 0),
  humanoidBoneCount: Object.keys(characterJson.extensions.VRMC_vrm.humanoid.humanBones).length,
  expressions: Object.keys(characterJson.extensions.VRMC_vrm.expressions.preset).sort()
};
return metrics;
}

const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === "--npcs"), "Usage: node scripts/create-academy-character.mjs [--npcs]");
let metrics;
if (args[0] === "--npcs") {
  metrics = {};
  for (const key of ["an", "khoa", "minh"]) metrics[recipes[key].id] = await generateCharacter(key);
} else {
  metrics = await generateCharacter("player");
}
console.log(JSON.stringify(metrics, null, 2));
