/** Offline distant LOD; never overwrites the approved detailed collection. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import { MeshoptSimplifier } from 'meshoptimizer/simplifier';
import { MeshoptEncoder } from 'meshoptimizer/encoder';
import { MeshoptDecoder } from 'meshoptimizer/decoder';

const source = path.resolve(process.argv[2] ?? 'public/world/floating-islands');
const destination = path.resolve(process.argv[3] ?? 'output/plaza-performance/lod');
assert.notEqual(source, destination, 'Detailed source must remain immutable');
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const hash = raw => createHash('sha256').update(raw).digest('hex');
const dimensions = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const formats = { 5121: [Uint8Array, 1, 'getUint8'], 5123: [Uint16Array, 2, 'getUint16'], 5125: [Uint32Array, 4, 'getUint32'], 5126: [Float32Array, 4, 'getFloat32'] };
await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
await mkdir(destination, { recursive: true });
await mkdir(path.join(destination, 'textures'), { recursive: true });
const decodedDestination = `${destination}-uncompressed`;
await mkdir(decodedDestination, { recursive: true });
const result = { name: 'Plaza distant island LOD', revision: 'distance-lod-01', models: [], textures: [] };
for (const model of manifest.models) {
 const raw = await readFile(path.join(source, `${model.id}.glb`));
 assert.equal(hash(raw), model.sha256);
 const jsonLength = raw.readUInt32LE(12), original = JSON.parse(raw.toString('utf8', 20, 20 + jsonLength));
 assert(!original.animations && !original.skins, 'Only static scenery is supported');
 const binary = raw.subarray(28 + jsonLength), g = structuredClone(original);
 g.buffers = []; g.bufferViews = []; g.accessors = [];
 let chunks = []; let length = 0;
 const append = bytes => {
  const index = g.bufferViews.length;
  g.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length });
  chunks.push(bytes); length += bytes.length;
  if (length % 4) { const padding = Buffer.alloc(4 - length % 4); chunks.push(padding); length += padding.length; }
  return index;
 };
 const values = index => {
  const a = original.accessors[index], v = original.bufferViews[a.bufferView];
  assert(!a.sparse && dimensions[a.type] && formats[a.componentType]);
  const [ArrayType, size, method] = formats[a.componentType], dim = dimensions[a.type];
  const out = new ArrayType(a.count * dim), view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  const offset = (v.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = v.byteStride ?? dim * size;
  for (let i = 0; i < a.count; i++) for (let c = 0; c < dim; c++) out[i * dim + c] = view[method](offset + i * stride + c * size, true);
  return { array: out, accessor: a, dim };
 };
 const store = (array, template, position = false) => {
  const a = { ...template, bufferView: append(Buffer.from(array.buffer, array.byteOffset, array.byteLength)), count: array.length / dimensions[template.type] };
  delete a.byteOffset; delete a.min; delete a.max;
  if (position) {
   a.min = [Infinity, Infinity, Infinity]; a.max = [-Infinity, -Infinity, -Infinity];
   for (let i = 0; i < array.length; i++) { assert(Number.isFinite(array[i])); a.min[i % 3] = Math.min(a.min[i % 3], array[i]); a.max[i % 3] = Math.max(a.max[i % 3], array[i]); }
  }
  g.accessors.push(a); return g.accessors.length - 1;
 };
 // Texture pixels and material/scene/node metadata are exact copies.
 for (const image of g.images ?? []) {
  assert(image.bufferView !== undefined, 'Expected embedded texture');
  const v = original.bufferViews[image.bufferView]; image.bufferView = append(binary.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
 }
 const stats = [], exactViews = new Set();
 for (let mi = 0; mi < g.meshes.length; mi++) for (let pi = 0; pi < g.meshes[mi].primitives.length; pi++) {
  const p = g.meshes[mi].primitives[pi], previous = original.meshes[mi].primitives[pi];
  assert((p.mode ?? 4) === 4 && !p.targets, 'Expected static triangles');
  const attrs = Object.fromEntries(Object.entries(p.attributes).map(([name, i]) => [name, values(i)]));
  let indices = new Uint32Array(values(p.indices).array);
  const before = indices.length / 3, material = g.materials[p.material].name ?? '';
  const water = /spring water/.test(material), foliage = /leaves|petals|blades/.test(material);
  const terrain = /living soil|cliff mineral/.test(material);
  // Keep canopy coverage; the first 12% canopy pass looked too transparent in review.
  const canopy = /folded broad leaves/.test(material);
  const ratio = water ? 1 : /blades/.test(material) ? .16 : canopy ? .22 : foliage ? .12 : terrain ? .12 : .10;
  const error = terrain ? .004 : canopy ? .012 : foliage ? .025 : .018;
  let achievedError = 0;
  if (!water && before > 32) {
   const names = ['NORMAL', 'TEXCOORD_0', 'COLOR_0'].filter(n => attrs[n]);
   const stride = names.reduce((n, k) => n + attrs[k].dim, 0), weights = names.flatMap(n => Array(attrs[n].dim).fill(n === 'COLOR_0' ? .5 : n === 'NORMAL' ? .1 : .025));
   const attributes = new Float32Array(attrs.POSITION.accessor.count * stride);
   for (let i = 0; i < attrs.POSITION.accessor.count; i++) { let offset = i * stride; for (const name of names) { const a = attrs[name]; assert(!a.accessor.normalized, 'Unsupported normalized simplification attribute'); attributes.set(a.array.subarray(i * a.dim, (i + 1) * a.dim), offset); offset += a.dim; } }
   [indices, achievedError] = MeshoptSimplifier.simplifyWithAttributes(indices, attrs.POSITION.array, 3, attributes, stride, weights, null, Math.max(12, Math.floor(before * ratio)) * 3, error, terrain ? ['Permissive', 'LockBorder'] : ['Permissive', 'Prune']);
   assert(indices.length > 0 && achievedError <= error + 1e-6);
  }
  const [remap, count] = MeshoptSimplifier.compactMesh(indices);
  p.attributes = {};
  for (const [name, attr] of Object.entries(attrs)) {
   const compact = new attr.array.constructor(count * attr.dim);
   for (let i = 0; i < remap.length; i++) if (remap[i] < count) compact.set(attr.array.subarray(i * attr.dim, (i + 1) * attr.dim), remap[i] * attr.dim);
   p.attributes[name] = store(compact, attr.accessor, name === 'POSITION');
   if (water) exactViews.add(g.accessors[p.attributes[name]].bufferView);
  }
  assert(indices.every(i => i < count));
  p.indices = store(count < 65536 ? new Uint16Array(indices) : indices, { type: 'SCALAR', componentType: count < 65536 ? 5123 : 5125 });
  if (water) assert.equal(indices.length, original.accessors[previous.indices].count);
  stats.push({ mesh: g.meshes[mi].name, before, after: indices.length / 3, error: achievedError });
 }
 assert.deepEqual(g.nodes, original.nodes); assert.deepEqual(g.materials, original.materials); assert.deepEqual(g.scenes, original.scenes);
 const triangles = g.nodes.reduce((sum, node) => sum + (node.mesh === undefined ? 0 : g.meshes[node.mesh].primitives.reduce((n, p) => n + g.accessors[p.indices].count / 3, 0)), 0);
 function glb(document = g, data = Buffer.concat(chunks)) {
  let json = Buffer.from(JSON.stringify(document)); if (json.length % 4) json = Buffer.concat([json, Buffer.alloc(4 - json.length % 4, 32)]);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + data.length, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(data.length); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, json, binHeader, data]);
 }
 g.buffers = [{ byteLength: length }];
 const decodedDocument = structuredClone(g);
 const decoded = Buffer.concat(chunks), decodedViews = g.bufferViews;
 chunks = []; length = 0; g.bufferViews = [];
 let fallbackLength = 0;
 for (let i = 0; i < decodedViews.length; i++) {
  const view = decodedViews[i], bytes = decoded.subarray(view.byteOffset, view.byteOffset + view.byteLength);
  const accessor = g.accessors.find(a => a.bufferView === i);
  if (!accessor) {
   const image = g.images.find(image => image.bufferView === i);
   assert(image, 'Unexpected non-geometry buffer view');
   const sha256 = hash(bytes), filename = `textures/${sha256}.${image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg'}`;
   await writeFile(path.join(destination, filename), bytes);
   if (!result.textures.some(texture => texture.sha256 === sha256)) result.textures.push({ file: filename, bytes: bytes.length, sha256 });
   image.uri = filename; delete image.bufferView;
   append(Buffer.alloc(4)); // Preserve accessor buffer-view indices without duplicating texture pixels.
   continue;
  }
  const stride = dimensions[accessor.type] * formats[accessor.componentType][1], mode = accessor.type === 'SCALAR' ? 'INDICES' : 'ATTRIBUTES';
  let input = bytes, filter;
  if (accessor.componentType === 5126 && !exactViews.has(i)) {
   input = MeshoptEncoder.encodeFilterExp(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4), accessor.count, stride, accessor.type === 'VEC2' ? 20 : 16, 'SharedComponent');
   filter = 'EXPONENTIAL';
  }
  const encoded = MeshoptEncoder.encodeGltfBuffer(input, accessor.count, stride, mode);
  const roundtrip = new Uint8Array(bytes.length);
  MeshoptDecoder.decodeGltfBuffer(roundtrip, accessor.count, stride, encoded, mode, filter);
  if (filter) {
   const before = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4), after = new Float32Array(roundtrip.buffer);
   let maxError = 0;
   for (let n = 0; n < before.length; n++) maxError = Math.max(maxError, Math.abs(before[n] - after[n]));
   assert(maxError <= (accessor.min ? .002 : .0002), `Quantization exceeds precision budget: ${maxError}`);
   if (accessor.min) {
    accessor.min = [Infinity, Infinity, Infinity]; accessor.max = [-Infinity, -Infinity, -Infinity];
    for (let n = 0; n < after.length; n++) { accessor.min[n % 3] = Math.min(accessor.min[n % 3], after[n]); accessor.max[n % 3] = Math.max(accessor.max[n % 3], after[n]); }
    const twin = decodedDocument.accessors[g.accessors.indexOf(accessor)]; twin.min = accessor.min; twin.max = accessor.max;
   }
   // The uncompressed QA twin must match the actual decoded deliverable exactly.
   Buffer.from(roundtrip).copy(decoded, view.byteOffset);
  } else assert.deepEqual(Buffer.from(roundtrip), bytes, 'Water and indices remain exact');
  const index = append(Buffer.from(encoded)), compressedView = g.bufferViews[index];
  g.bufferViews[index] = { buffer: 1, byteOffset: fallbackLength, byteLength: bytes.length,
   extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: compressedView.byteOffset, byteLength: encoded.length, byteStride: stride, count: accessor.count, mode, ...(filter ? { filter } : {}) } } };
  if (mode === 'ATTRIBUTES') g.bufferViews[index].byteStride = stride;
  fallbackLength += bytes.length; fallbackLength = Math.ceil(fallbackLength / 4) * 4;
 }
 g.buffers = [{ byteLength: length }, { byteLength: fallbackLength, extensions: { EXT_meshopt_compression: { fallback: true } } }];
 g.extensionsUsed = [...new Set([...(g.extensionsUsed ?? []), 'EXT_meshopt_compression'])];
 g.extensionsRequired = [...new Set([...(g.extensionsRequired ?? []), 'EXT_meshopt_compression'])];
 const output = glb();
 await writeFile(path.join(decodedDestination, `${model.id}.glb`), glb(decodedDocument, decoded));
 await writeFile(path.join(destination, `${model.id}.glb`), output);
 await writeFile(path.join(destination, `${model.id}-report.json`), JSON.stringify(stats, null, 2));
 const { status: sourceStatus, approvedOn: sourceApprovedOn, ...sourceInfo } = model;
 result.models.push({ ...sourceInfo, status: 'optimized-preview', sourceStatus, sourceApprovedOn, triangles, bytes: output.length, sha256: hash(output), parentSha256: model.sha256, revision: result.revision });
 console.log(JSON.stringify({ id: model.id, beforeTriangles: model.triangles, triangles, beforeBytes: raw.length, bytes: output.length }));
}
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ totalBytes: result.models.reduce((n, m) => n + m.bytes, 0) + result.textures.reduce((n, t) => n + t.bytes, 0), totalTriangles: result.models.reduce((n, m) => n + m.triangles, 0) }));
