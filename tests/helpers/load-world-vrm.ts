import fs from "node:fs";
import path from "node:path";
import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { resolveCharacterAssetEntry } from "../../src/lib/world/character-assets";
import { prepareLoadedVrm } from "../../src/lib/world/vrm-loader";
import { createLocomotionPlayer, parseLocomotionClips } from "../../src/lib/world/character-locomotion";
import { createActionMotionPlayer, parseActionMotion } from "../../src/lib/world/character-action-motion";

export async function loadWorldVrmFixture(authoredLocomotion = false, authoredActions = false, assetId?: string) {
  const globals = globalThis as unknown as { self?: unknown; createImageBitmap?: unknown ;};
  globals.self ??= globalThis;
  globals.createImageBitmap ??= async () => ({ width: 1, height: 1, close() { } });
  const entry = resolveCharacterAssetEntry(assetId);
  if (assetId && entry.id !== assetId) throw new Error(`Unregistered fixture asset: ${assetId}`);
  const buffer = fs.readFileSync(path.join(process.cwd(), "public", entry.url));
  const loader = new GLTFLoader();
  loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync(new Uint8Array(buffer).buffer, "");
  const result = prepareLoadedVrm(gltf.userData.vrm as VRM, 1);
  if (!result.ok) throw new Error(result.reason);
  if (authoredLocomotion) result.rig.locomotion = createLocomotionPlayer(
    parseLocomotionClips(JSON.parse(fs.readFileSync("public/models/animations/locomotion.json", "utf8"))), result.rig.restHipsY
  );
  if (authoredActions) result.rig.actions = createActionMotionPlayer(
    parseActionMotion(JSON.parse(fs.readFileSync("public/models/animations/actions.json", "utf8"))), result.rig.restHipsY
  );
  return result.rig;
}
