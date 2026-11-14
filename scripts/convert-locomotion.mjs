// Run from the repo: node scripts/convert-locomotion.mjs <download-directory>
// Input is pinned and hash-checked; only animation data is exported, never the mesh.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { AnimationMixer, LoopOnce, Quaternion, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const directory = process.argv[2];
assert(directory, "Pass the directory containing the pinned UAL glTF and bin.");
const hashes = {
  "AnimationLibrary_Godot_Standard.gltf": "0ff075c7ad6855c5c2c37a171592ee8f0d6ab2f58259e2be77a9b63dd8027765",
  "AnimationLibrary_Godot_Standard.bin": "6e65377d81558333c4093dbb144a48fd19019343d82b1a3a7992a98ec0e0543c"
};
const buffers = Object.fromEntries(Object.entries(hashes).map(([name, hash]) => {
  const buffer = fs.readFileSync(path.join(directory, name));
  assert.equal(createHash("sha256").update(buffer).digest("hex"), hash, name);
  return [name, buffer];
}));
const json = JSON.parse(buffers["AnimationLibrary_Godot_Standard.gltf"].toString());
json.buffers[0].uri = `data:application/octet-stream;base64,${buffers["AnimationLibrary_Godot_Standard.bin"].toString("base64")}`;
for (const node of json.nodes) { delete node.mesh; delete node.skin; }
for (const key of ["meshes", "skins", "materials", "textures", "images"]) delete json[key];
globalThis.self ??= globalThis;
globalThis.ProgressEvent ??= class { constructor(type, values) { Object.assign(this, { type }, values); } };
const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), "");
const nodes = await Promise.all(json.nodes.map((_, i) => gltf.parser.getDependency("node", i)));
const mapping = {
  hips: "DEF-hips", spine: "DEF-spine.001", chest: "DEF-spine.002", upperChest: "DEF-spine.003",
  neck: "DEF-neck", head: "DEF-head"
};
for (const [side, suffix] of [["left", "L"], ["right", "R"]]) {
  for (const [target, source] of Object.entries({ Shoulder: "shoulder", UpperArm: "upper_arm", LowerArm: "forearm", Hand: "hand", UpperLeg: "thigh", LowerLeg: "shin", Foot: "foot", Toes: "toe" })) {
    mapping[side + target] = `DEF-${source}.${suffix}`;
  }
}
const bones = Object.fromEntries(Object.entries(mapping).map(([key, name]) => {
  const node = nodes[json.nodes.findIndex(n => n.name === name)];
  assert(node, name);
  return [key, node];
}));
gltf.scene.updateMatrixWorld(true);
const rest = new Map(nodes.map(n => [n, n.getWorldQuaternion(new Quaternion())]));
const hipsRest = bones.hips.getWorldPosition(new Vector3());
const keys = Object.keys(bones);
const round = v => +v.toFixed(6);
const result = {
  version: 1,
  source: {
    author: "Quaternius", pack: "Universal Animation Library Standard (2025-06-10)", license: "CC0-1.0",
    url: "https://quaternius.com/packs/universalanimationlibrary.html",
    mirror: "https://github.com/J-Ponzo/gltf-universal-animation-library/tree/e24c23cf2a1323488a3faa226ea7ea21f644b73e",
    hashes, hipsHeight: round(hipsRest.y)
  },
  clips: {}
};
for (const [kind, name] of [["walk", "Walk_Loop"], ["run", "Jog_Fwd_Loop"]]) {
  const source = gltf.animations.find(c => c.name === name);
  assert(source, name);
  const mixer = new AnimationMixer(gltf.scene);
  mixer.clipAction(source).play();
  const frameCount = Math.round(source.duration * 60);
  const rotations = Object.fromEntries(keys.map(k => [k, []]));
  const hips = [], feet = [];
  for (let i = 0; i <= frameCount; i++) {
    mixer.setTime(i === frameCount ? 0 : source.duration * i / frameCount);
    gltf.scene.updateMatrixWorld(true);
    for (const key of keys) {
      const bone = bones[key];
      // Same rest-space conversion as three-vrm's official humanoid-animation example.
      const q = rest.get(bone.parent).clone().multiply(bone.quaternion).multiply(rest.get(bone).clone().invert()).normalize();
      rotations[key].push(...q.toArray().map(round));
    }
    hips.push(round(bones.hips.getWorldPosition(new Vector3()).y - hipsRest.y));
    feet.push(Object.fromEntries(["left", "right"].map(side => [side, bones[side + "Foot"].getWorldPosition(new Vector3()).toArray().map(round)])));
  }
  const diagnostics = feet.filter((_, i) => i % Math.max(1, Math.round(frameCount / 12)) === 0);
  console.log(name, "duration", source.duration, "frames", frameCount, "feet", JSON.stringify(diagnostics));
  // Measured mid-stance velocity on the source rig, not the game root speed.
  const start = Math.round(frameCount * 0.1), end = Math.round(frameCount * 0.25);
  const speed = Math.abs(feet[end].left[2] - feet[start].left[2]) / ((end - start) * source.duration / frameCount);
  const strideLength = round(speed * source.duration);
  assert(strideLength > 0.5 && strideLength < 4, "Check source contact interval");
  result.clips[kind] = { name, duration: round(source.duration), frameCount, strideLength, rotations, hips };
  mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
}
const output = "public/models/animations";
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "locomotion.json"), JSON.stringify(result) + "\n");
console.log("Exported", fs.statSync(path.join(output, "locomotion.json")).size, "bytes");

// Separate supplement: accepted locomotion above remains byte-for-byte unchanged.
for (const [side, suffix] of [["left", "L"], ["right", "R"]]) {
  for (const [finger, source] of [["Index", "f_index"], ["Middle", "f_middle"], ["Ring", "f_ring"], ["Little", "f_pinky"], ["Thumb", "thumb"]]) {
    const joints = finger === "Thumb" ? ["Metacarpal", "Proximal", "Distal"] : ["Proximal", "Intermediate", "Distal"];
    joints.forEach((joint, i) => {
      const key = `${side}${finger}${joint}`;
      const name = `DEF-${source}.0${i + 1}.${suffix}`;
      bones[key] = nodes[json.nodes.findIndex(n => n.name === name)];
      assert(bones[key], name);
    });
  }
}
const actionKeys = Object.keys(bones);
const fingerKeys = actionKeys.filter(k => !keys.includes(k));
const supplement = { version: 1, source: result.source, handRest: {}, clips: {} };
for (const [kind, name] of [["hands", "Idle_Loop"], ["launch", "Jump_Start"], ["air", "Jump_Loop"], ["land", "Jump_Land"]]) {
  const source = gltf.animations.find(c => c.name === name);
  assert(source);
  const mixer = new AnimationMixer(gltf.scene);
  const action = mixer.clipAction(source);
  action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play();
  const frameCount = kind === "hands" ? 0 : Math.round(source.duration * 60);
  const rotations = Object.fromEntries(actionKeys.map(k => [k, []]));
  const hips = [];
  for (let i = 0; i <= frameCount; i++) {
    mixer.setTime(frameCount ? source.duration * i / frameCount : 0);
    gltf.scene.updateMatrixWorld(true);
    for (const key of actionKeys) {
      const bone = bones[key];
      const q = rest.get(bone.parent).clone().multiply(bone.quaternion).multiply(rest.get(bone).clone().invert()).normalize();
      rotations[key].push(...q.toArray().map(round));
    }
    hips.push(round(bones.hips.getWorldPosition(new Vector3()).y - hipsRest.y));
  }
  if (kind === "hands") supplement.handRest = Object.fromEntries(fingerKeys.map(k => [k, rotations[k]]));
  else supplement.clips[kind] = { name, duration: round(source.duration), frameCount, rotations, hips };
  mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
}
fs.writeFileSync(path.join(output, "actions.json"), JSON.stringify(supplement) + "\n");
console.log("Exported hands/jump", fs.statSync(path.join(output, "actions.json")).size, "bytes");
