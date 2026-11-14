/** Offline, repeatable CC0 acquisition. Run with `node scripts/prepare-plaza-assets.mjs`. */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer/simplifier';
import sharp from 'sharp';
import { Matrix4, Vector3, Quaternion, Matrix3 } from 'three';

const root = path.resolve('public/world/plaza-nature');
const cache = path.resolve('output/plaza-source-cache');
const hash = (bytes, algorithm = 'md5') => createHash(algorithm).update(bytes).digest('hex');
const json = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };
async function download(file, destination) {
  let bytes;
  try { bytes = await readFile(destination); } catch { /* uncached */ }
  if (!bytes || hash(bytes) !== file.md5) {
    const r = await fetch(file.url);
    if (!r.ok) throw new Error(`${r.status} ${file.url}`);
    bytes = Buffer.from(await r.arrayBuffer());
    if (hash(bytes) !== file.md5) throw new Error(`MD5 mismatch: ${file.url}`);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  return bytes;
}
const recipes = [
  { id: 'rock_moss_set_02', meshes: [0, 2, 6], targets: [1200], error: .035 },
  { id: 'fern_02', meshes: [2, 3], targets: [900], error: .01 },
  { id: 'tree_stump_01', meshes: [0], targets: [2500], error: .025 },
  { id: 'tree_small_02', meshes: [0], targets: [2000, 16000, 1400], error: .055, anchorPrimitive: 2 },
  { id: 'fir_sapling', meshes: [0], targets: [550, 6500], error: .06, anchorPrimitive: 0 },
  { id: 'namaqualand_cliff_02', meshes: [0], targets: [3500], error: .035 }
];
await MeshoptSimplifier.ready;
await mkdir(root, { recursive: true });
const provenance = { generatedAt: new Date().toISOString(), pipeline: 'meshoptimizer 1.1.1; UV-aware simplification; baked node transforms; base-centered variants (trees anchored at trunk foot); sharp 0.35.5, max 1024px textures', models: [], surfaces: [] };
for (const recipe of recipes) {
  const { id } = recipe;
  console.log(`Preparing ${id}`);
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  const info = await json(`https://api.polyhaven.com/info/${id}`);
  const source = files.gltf['1k'].gltf;
  const original = JSON.parse((await download(source, path.join(cache, id, 'source.gltf'))).toString());
  const sources = [{ url: source.url, md5: source.md5 }];
  const blobs = new Map();
  for (const [name, entry] of Object.entries(source.include)) {
    blobs.set(name, await download(entry, path.join(cache, id, name)));
    sources.push({ url: entry.url, md5: entry.md5 });
  }
  const dest = path.join(root, id);
  await mkdir(dest, { recursive: true });
  const g = { asset: { version: '2.0', generator: 'BetterMe CC0 Plaza preparation' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: structuredClone(original.materials), textures: original.textures, samplers: original.samplers, images: [], buffers: [], bufferViews: [], accessors: [], extensionsUsed: original.extensionsUsed };
  for (let i = 0; i < original.images.length; i++) {
    const input = blobs.get(original.images[i].uri);
    if (!input) throw new Error(`Missing image ${original.images[i].uri}`);
    const uri = `texture-${i}.webp`;
    const bytes = await sharp(input).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ quality: 93, alphaQuality: 100 }).toBuffer();
    await writeFile(path.join(dest, uri), bytes);
    g.images.push({ uri });
  }
  g.extensionsUsed = [...(g.extensionsUsed ?? []), 'EXT_texture_webp'];
  g.extensionsRequired = ['EXT_texture_webp'];
  g.textures = g.textures.map(t => ({ sampler: t.sampler, extensions: { EXT_texture_webp: { source: t.source } } }));
  // Cutout leaves cast crisp shadows without transparent-object sorting artifacts.
  for (const material of g.materials) if (material.alphaMode === 'BLEND') { material.alphaMode = 'MASK'; material.alphaCutoff = .45; }
  const chunks = [];
  let length = 0;
  function store(array, type, componentType, min, max) {
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const bufferView = g.bufferViews.length;
    g.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length });
    chunks.push(bytes); length += bytes.length;
    if (length % 4) { const pad = Buffer.alloc(4 - length % 4); chunks.push(pad); length += pad.length; }
    g.accessors.push({ bufferView, componentType, count: array.length / ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type]), type, ...(min ? { min, max } : {}) });
    return g.accessors.length - 1;
  }
  function accessor(index) {
    const a = original.accessors[index], v = original.bufferViews[a.bufferView];
    if (a.sparse || a.normalized) throw new Error('Unsupported source accessor');
    const bytes = blobs.get(original.buffers[v.buffer].uri);
    const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const isFloat = a.componentType === 5126;
    const size = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
    if (!size) throw new Error(`Unsupported component ${a.componentType}`);
    const result = isFloat ? new Float32Array(a.count * components) : new Uint32Array(a.count * components);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = v.byteStride ?? size * components;
    const method = isFloat ? 'getFloat32' : size === 4 ? 'getUint32' : size === 2 ? 'getUint16' : 'getUint8';
    for (let i = 0; i < a.count; i++) for (let c = 0; c < components; c++) result[i * components + c] = view[method](start + i * stride + c * size, true);
    return { array: result, components, type: a.type };
  }
  const stats = [];
  for (const meshIndex of recipe.meshes) {
    const sourceMesh = original.meshes[meshIndex];
    const node = original.nodes.find(n => n.mesh === meshIndex) ?? {};
    const matrix = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0, 0, 0])), new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])));
    const normalMatrix = new Matrix3().getNormalMatrix(matrix);
    const attrs = sourceMesh.primitives.map(p => Object.fromEntries(Object.entries(p.attributes).map(([name, index]) => [name, accessor(index)])));
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], point = new Vector3();
    for (const a of attrs) {
      for (let i = 0; i < a.POSITION.array.length; i += 3) {
        point.fromArray(a.POSITION.array, i).applyMatrix4(matrix).toArray(a.POSITION.array, i);
        for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], a.POSITION.array[i + c]); max[c] = Math.max(max[c], a.POSITION.array[i + c]); }
      }
      for (let i = 0; i < a.NORMAL.array.length; i += 3) point.fromArray(a.NORMAL.array, i).applyNormalMatrix(normalMatrix).toArray(a.NORMAL.array, i);
      delete a.TANGENT; // Reconstructed from retained UV and normals by GLTFLoader.
    }
    const center = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];
    // Canopies are asymmetric: collider/root alignment must use the trunk foot.
    if (recipe.anchorPrimitive !== undefined) {
      const trunk = attrs[recipe.anchorPrimitive].POSITION.array;
      const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
      for (let i = 0; i < trunk.length; i += 3) {
        if (trunk[i + 1] > min[1] + .05) continue;
        for (const [axis, component] of [0, 2].entries()) {
          lo[axis] = Math.min(lo[axis], trunk[i + component]);
          hi[axis] = Math.max(hi[axis], trunk[i + component]);
        }
      }
      if (![...lo, ...hi].every(Number.isFinite)) throw new Error(`Missing trunk foot: ${id}`);
      center[0] = (lo[0] + hi[0]) / 2;
      center[2] = (lo[1] + hi[1]) / 2;
    }
    const primitives = [];
    let triangles = 0;
    for (let p = 0; p < sourceMesh.primitives.length; p++) {
      const a = attrs[p], pos = a.POSITION.array, uv = a.TEXCOORD_0.array;
      for (let i = 0; i < pos.length; i++) pos[i] -= center[i % 3];
      const weights = new Float32Array(pos.length / 3 * 5);
      for (let i = 0; i < pos.length / 3; i++) { weights.set(a.NORMAL.array.subarray(i * 3, i * 3 + 3), i * 5); weights.set(uv.subarray(i * 2, i * 2 + 2), i * 5 + 3); }
      let indices = accessor(sourceMesh.primitives[p].indices).array;
      const before = indices.length / 3, target = recipe.targets[p] ?? recipe.targets[0];
      if (before > target) [indices] = MeshoptSimplifier.simplifyWithAttributes(indices, pos, 3, weights, 5, [.25, .25, .25, .1, .1], null, target * 3, recipe.error, ['Permissive', 'Prune']);
      const [remap, count] = MeshoptSimplifier.compactMesh(indices);
      const attributes = {};
      for (const [name, attr] of Object.entries(a)) {
        const compact = new Float32Array(count * attr.components);
        for (let i = 0; i < remap.length; i++) if (remap[i] < count) compact.set(attr.array.subarray(i * attr.components, (i + 1) * attr.components), remap[i] * attr.components);
        const lo = Array(attr.components).fill(Infinity), hi = Array(attr.components).fill(-Infinity);
        if (name === 'POSITION') for (let i = 0; i < compact.length; i++) { const c = i % attr.components; lo[c] = Math.min(lo[c], compact[i]); hi[c] = Math.max(hi[c], compact[i]); }
        attributes[name] = store(compact, attr.type, 5126, name === 'POSITION' ? lo : undefined, hi);
      }
      primitives.push({ attributes, indices: store(indices, 'SCALAR', 5125), material: sourceMesh.primitives[p].material });
      triangles += indices.length / 3;
      console.log(`  ${sourceMesh.name} primitive ${p}: ${before} -> ${indices.length / 3} triangles`);
    }
    g.scenes[0].nodes.push(g.nodes.length);
    g.nodes.push({ name: sourceMesh.name, mesh: g.meshes.length });
    g.meshes.push({ name: sourceMesh.name, primitives });
    stats.push({ name: sourceMesh.name, triangles, size: max.map((v, i) => v - min[i]), sourceAnchor: center });
  }
  const binary = Buffer.concat(chunks);
  g.buffers.push({ uri: 'model.bin', byteLength: binary.length });
  await writeFile(path.join(dest, 'model.bin'), binary);
  await writeFile(path.join(dest, 'model.gltf'), JSON.stringify(g));
  provenance.models.push({ id, page: `https://polyhaven.com/a/${id}`, authors: info.authors, license: 'CC0-1.0', sourceFiles: sources, recipe, variants: stats, binarySha256: hash(binary, 'sha256') });
}
for (const id of ['cobblestone_floor_08', 'forest_floor']) {
  const files = await json(`https://api.polyhaven.com/files/${id}`), info = await json(`https://api.polyhaven.com/info/${id}`);
  const sourceFiles = [];
  await mkdir(path.join(root, id), { recursive: true });
  for (const [channel, name] of [['Diffuse', 'color'], ['nor_gl', 'normal'], ['Rough', 'roughness']]) {
    const file = files[channel]['1k'].jpg;
    const bytes = await download(file, path.join(cache, id, `${name}.jpg`));
    await sharp(bytes).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ quality: 93 }).toFile(path.join(root, id, `${name}.webp`));
    sourceFiles.push({ url: file.url, md5: file.md5 });
  }
  provenance.surfaces.push({ id, page: `https://polyhaven.com/a/${id}`, authors: info.authors, license: 'CC0-1.0', sourceFiles });
}
for (const entry of [...provenance.models, ...provenance.surfaces]) {
  entry.shippedFiles = [];
  for (const name of (await readdir(path.join(root, entry.id))).sort()) {
    const bytes = await readFile(path.join(root, entry.id, name));
    entry.shippedFiles.push({ path: `${entry.id}/${name}`, bytes: bytes.length, sha256: hash(bytes, 'sha256') });
  }
}
await writeFile(path.join(root, 'provenance.json'), JSON.stringify(provenance, null, 2));
console.log('Finished CC0 Plaza kit.');
