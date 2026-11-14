import { describe, expect, it } from "vitest";
import { resolveNpcCharacterAsset } from "./character-assets";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { SkinnedMesh, Vector3 } from "three";
import { loadWorldVrmFixture } from "../../../tests/helpers/load-world-vrm";
import { createNpcMotionState, stepNpcMotion } from "./npc-motion";
import { applyPoseToVrm, disposeCharacterVrm } from "./vrm-loader";
import { evaluateNpcPose } from "./npc-pose";

const cast = [
  ["character.npc.guide_an", "academy-an-v1", "npc-guide-an"],
  ["character.npc.steward_khoa", "academy-khoa-v1", "npc-steward-khoa"],
  ["character.npc.librarian_minh", "academy-minh-v1", "npc-librarian-minh"]
] as const;
describe("NPC asset bindings", () => {
  it.each([
    ["academy-minh-v1", "npc-librarian-minh"],
    ["academy-khoa-v1", "npc-steward-khoa"]
  ])("brings %s idle detail hand to the accessory rather than waving in empty space", async (assetId, id) => {
    const rig=await loadWorldVrmFixture(false,false,assetId);
    try {
      const {pose}=evaluateNpcPose({id,time:13.5,phaseOffset:0,gesture:"idle",gestureTime:0,lineIndex:null,targetYaw:0,targetPitch:0,reducedMotion:false});
      applyPoseToVrm(rig,pose,{blink:0,happy:0,relaxed:0,surprised:0,aa:0},0);
      rig.scene.updateWorldMatrix(true,true);
      const finger=rig.vrm.humanoid.getRawBoneNode("rightIndexDistal")!.getWorldPosition(new Vector3());
      const target=id.includes("librarian") ? new Vector3(-.06,1.445,.095)
        : rig.vrm.humanoid.getRawBoneNode("leftHand")!.getWorldPosition(new Vector3());
      expect(finger.distanceTo(target)).toBeLessThan(.08);
    } finally {disposeCharacterVrm(rig.vrm);}
  });
  it("resolves three distinct academy outfits with measured files and safe unknown-slot fallback", () => {
    for (const [slot, id] of cast) {
      const entry = resolveNpcCharacterAsset(slot);
      expect(entry.id).toBe(id);
      expect(entry.permissions.allowRedistribution).toBe(true);
      const bytes = fs.readFileSync(`public${entry.url}`);
      expect(entry.metrics.fileSizeBytes).toBe(bytes.length);
      expect(entry.metrics.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    }
    expect(resolveNpcCharacterAsset("unknown").id).toBe("scholar-vrm1");
    const player = fs.readFileSync("public/models/characters/academy-scholar-v1.vrm");
    expect(createHash("sha256").update(player).digest("hex")).toBe("8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f");
  });

  it.each(cast)("keeps %s garment skinning finite through dialogue and reduced motion", async (_slot, assetId, npcId) => {
    const rig = await loadWorldVrmFixture(false, false, assetId);
    try {
      const garments: SkinnedMesh[] = [];
      rig.scene.traverse(node => { if (node instanceof SkinnedMesh && node.name.startsWith("Academy_")) garments.push(node); });
      expect(garments.length).toBeGreaterThanOrEqual(4);
      const point = new Vector3(), gestures = new Set<string>();
      for (const reducedMotion of [false, true]) {
        const state = createNpcMotionState(npcId);
        for (let frame = 0; frame < 360; frame++) {
          const lineIndex = frame < 230 || frame >= 320 ? null : frame < 280 ? 0 : 1;
          const playerDistance = frame < 200 || frame >= 340 ? 8 : 3;
          stepNpcMotion(state, { lineIndex, playerDistance, targetYaw: Math.sin(frame / 60) * .5, targetPitch: .12, reducedMotion }, .1);
          applyPoseToVrm(rig, state.pose, state.expressions, .1);
          gestures.add(state.gesture);
          if (frame % 15 !== 0) continue;
          rig.scene.updateWorldMatrix(true, true);
          for (const mesh of garments) {
            mesh.skeleton.update();
            for (let i = 0; i < mesh.geometry.attributes.position.count; i += 23) {
              mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
              expect(point.toArray().every(Number.isFinite)).toBe(true);
              expect(point.length()).toBeLessThan(2.5);
              expect(point.y).toBeGreaterThan(-.03);
            }
          }
        }
      }
      expect([...gestures]).toEqual(expect.arrayContaining(["idle", "notice", "nearby", "greet", "explain", "attentive", "farewell"]));
    } finally { disposeCharacterVrm(rig.vrm); }
  }, 30_000); // Real VRM loading plus 72 seconds of skinned-pose sampling per asset.
});
