import { describe, expect, it } from "vitest";
import { createNpcMotionState, stepNpcMotion } from "./npc-motion";

const idle = { lineIndex: null, targetYaw: 0, targetPitch: 0, reducedMotion: false };
describe("NPC educational dialogue motion", () => {
  it("acknowledges an approach once, uses a distance deadband, and rearms only after leaving and cooldown", () => {
    const npc = createNpcMotionState("npc-guide-an");
    stepNpcMotion(npc, { ...idle, playerDistance: 3.7 }, .1);
    expect(npc.gesture).toBe("notice");
    for(let i=0;i<30;i++)stepNpcMotion(npc,{...idle,playerDistance:i%2?3.9:3.7},.1);
    expect(npc.gesture).toBe("nearby");
    stepNpcMotion(npc,{...idle,playerDistance:4.5},.1);
    expect(npc.playerNear).toBe(true);
    stepNpcMotion(npc,{...idle,playerDistance:4.7},.1);
    stepNpcMotion(npc,{...idle,playerDistance:3},.1);
    expect(npc.gesture).toBe("nearby");
    for(let i=0;i<90;i++)stepNpcMotion(npc,{...idle,playerDistance:6},.1);
    stepNpcMotion(npc,{...idle,playerDistance:3},.1);
    expect(npc.gesture).toBe("notice");
  });
  it("prioritizes dialogue, blends farewell, and permits immediate interruption", () => {
    const npc=createNpcMotionState("npc-steward-khoa");
    for(let i=0;i<20;i++)stepNpcMotion(npc,{...idle,playerDistance:3,lineIndex:0},.1);
    const before=npc.pose;
    stepNpcMotion(npc,{...idle,playerDistance:3},0);
    expect(npc.gesture).toBe("farewell");
    expect(npc.pose.bones).toEqual(before.bones);
    stepNpcMotion(npc,{...idle,playerDistance:3,lineIndex:0},0);
    expect(npc.gesture).toBe("greet");
    expect(npc.pose.bones).toEqual(before.bones);
    for(let i=0;i<60;i++)stepNpcMotion(npc,{...idle,playerDistance:3},.1);
    expect(npc.gesture).toBe("nearby");
    for(let i=0;i<20;i++)stepNpcMotion(npc,{...idle,playerDistance:7},.1);
    expect(npc.gesture).toBe("idle");
  });
  it("gives each role a distinctive idle action and greeting rather than one shared wave", () => {
    const cast=["npc-guide-an","npc-steward-khoa","npc-librarian-minh"].map(createNpcMotionState);
    const activities=cast.map(()=>new Set<string>());
    for(let frame=0;frame<1200;frame++)for(let i=0;i<cast.length;i++){
      stepNpcMotion(cast[i],idle,1/60);activities[i].add(cast[i].activity);
    }
    expect([...activities[0]]).toEqual(expect.arrayContaining(["look-around","welcome"]));
    expect([...activities[1]]).toEqual(expect.arrayContaining(["watch-gate","adjust-cuff"]));
    expect([...activities[2]]).toEqual(expect.arrayContaining(["check-book","adjust-glasses"]));
    for(const npc of cast)for(let i=0;i<45;i++)stepNpcMotion(npc,{...idle,lineIndex:0},1/60);
    expect(cast[0].pose.bones.rightUpperArm).not.toEqual(cast[1].pose.bones.rightUpperArm);
    expect(cast[1].pose.bones.rightUpperArm).not.toEqual(cast[2].pose.bones.rightUpperArm);
    expect(cast[1].pose.bones.rightUpperArm[2]).toBeGreaterThan(.9);
  });
  it("varies explanation by line, and keeps reduced-motion idle free of periodic gestures", () => {
    const npc=createNpcMotionState("npc-steward-khoa");
    for(let i=0;i<60;i++)stepNpcMotion(npc,{...idle,lineIndex:0},.1);
    for(let i=0;i<8;i++)stepNpcMotion(npc,{...idle,lineIndex:1},.1);
    const first=npc.pose.detailBones?.rightIndexProximal;
    expect(npc.activity).toBe("open-palm");
    expect(npc.pose.detailBones?.rightMiddleProximal?.[2]).toBeLessThan(.4);
    for(let i=0;i<8;i++)stepNpcMotion(npc,{...idle,lineIndex:2},.1);
    expect(npc.activity).toBe("point");
    expect(npc.pose.detailBones?.rightMiddleProximal?.[2]).toBeGreaterThan(.6);
    expect(npc.pose.detailBones?.rightIndexProximal).not.toEqual(first);
    const reduced=createNpcMotionState("npc-librarian-minh");
    for(let i=0;i<30;i++)stepNpcMotion(reduced,{...idle,reducedMotion:true},.1);
    const still=reduced.pose;
    for(let i=0;i<200;i++)stepNpcMotion(reduced,{...idle,reducedMotion:true},.1);
    expect(reduced.pose).toEqual(still);
    stepNpcMotion(reduced,{...idle,playerDistance:NaN,targetYaw:Infinity,targetPitch:NaN},Infinity);
    for(const bone of Object.values(reduced.pose.bones))expect(bone.every(Number.isFinite)).toBe(true);
  });
  it("greets once, settles during reading, and responds once to each new line", () => {
    const npc = createNpcMotionState("npc-guide-an");
    stepNpcMotion(npc, { ...idle, lineIndex: 0 }, 0.1);
    expect(npc.gesture).toBe("greet");
    for (let i = 0;i < 70;i++) stepNpcMotion(npc, { ...idle, lineIndex: 0 }, 0.1);
    expect(npc.gesture).toBe("attentive");
    expect(npc.expressions.aa).toBe(0);
    stepNpcMotion(npc, { ...idle, lineIndex: 1 }, 0.1);
    expect(npc.gesture).toBe("explain");
    for (let i = 0;i < 60;i++) stepNpcMotion(npc, { ...idle, lineIndex: 1 }, 0.1);
    expect(npc.gesture).toBe("attentive");
  });
  it("blends interruptions and bounds gaze without sharing actor state", () => {
    const npc = createNpcMotionState("npc-guide-an"), other = createNpcMotionState("npc-librarian-minh");
    for (let i = 0;i < 5;i++)stepNpcMotion(npc, { ...idle, lineIndex: 0 }, 0.1);
    const before = npc.pose.bones.rightUpperArm;
    stepNpcMotion(npc, idle, 0);
    expect(npc.pose.bones.rightUpperArm).toEqual(before);
    for (let i = 0;i < 40;i++) stepNpcMotion(npc, { ...idle, lineIndex: 0, targetYaw: 10, targetPitch: -10 }, 0.1);
    expect(npc.gesture).toBe("attentive");
    expect(Math.abs(npc.pose.bones.head[1] + npc.pose.bones.neck[1])).toBeLessThanOrEqual(0.55);
    expect(Math.abs(npc.pose.bones.head[0] + npc.pose.bones.neck[0])).toBeLessThanOrEqual(0.22);
    expect(other.time).toBe(0);
    expect(npc.phaseOffset).not.toBe(other.phaseOffset);
  });
  it("cancels rapid line changes and pointer gestures without leaving a raised hand", () => {
    const npc = createNpcMotionState("npc-steward-khoa");
    for (const lineIndex of [0, 1, 2, null, 0, 1, null]) {
      const before = npc.pose;
      stepNpcMotion(npc, { ...idle, lineIndex }, 0);
      expect(npc.pose.bones).toEqual(before.bones);
      expect(npc.pose.detailBones).toEqual(before.detailBones);
      for (let i = 0;i < 20;i++)stepNpcMotion(npc, { ...idle, lineIndex }, 1 / 60);
    }
    for (let i = 0;i < 60;i++)stepNpcMotion(npc, idle, 1 / 60);
    expect(npc.gesture).toBe("idle");
    expect(npc.pose.bones.rightUpperArm[2]).toBeGreaterThan(1);
    expect(npc.pose.detailBones?.rightMiddleProximal?.[2]).toBeLessThan(0.4);
  });
  it("keeps reduced-motion poses still and never animates silent speech", () => {
    const npc = createNpcMotionState("npc-steward-khoa");
    for (let i = 0;i < 40;i++)stepNpcMotion(npc, { ...idle, reducedMotion: true, lineIndex: 0 }, 0.1);
    const before = npc.pose;
    for (let i = 0;i < 40;i++)stepNpcMotion(npc, { ...idle, reducedMotion: true, lineIndex: 0 }, 0.1);
    expect(npc.pose).toEqual(before);
    expect(npc.expressions.aa).toBe(0);
    for (const bone of Object.values(npc.pose.bones)) expect(bone.every(Number.isFinite)).toBe(true);
  });
});
