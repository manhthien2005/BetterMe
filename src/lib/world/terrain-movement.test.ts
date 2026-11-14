import { describe, expect, it } from "vitest";
import { createInitialPlayerState, resolveCircleAabbCollision, stepPlayerKinematics } from "./physics";
import { createInitialCameraRig, stepFollowCamera } from "./camera";
import { PUBLIC_PLAZA_MAP_CONFIG as config } from "./map-config";
import type { MovementInput } from "./types";

const idle: MovementInput = { forward:false, backward:false, left:false, right:false, sprint:false, jump:false };
const ground = (x: number) => Math.max(-2, Math.min(4, x * .25));

describe("optional terrain movement (flat worlds remain unchanged)", () => {
  it("follows a rising ramp, descends below zero, and lands a jump on that surface", () => {
    const p = createInitialPlayerState(config);
    p.x = 0; p.z = 0; p.y = 0;
    for (let i = 0; i < 120; i++) stepPlayerKinematics(p, {...idle,right:true}, [], config.bounds, config.player, .05, 0, ground);
    expect(p.y).toBeCloseTo(ground(p.x));
    expect(p.y).toBeGreaterThan(3);
    expect(p.isGrounded).toBe(true);
    for (let i = 0; i < 210; i++) stepPlayerKinematics(p, {...idle,left:true}, [], config.bounds, config.player, .05, 0, ground);
    expect(p.y).toBe(-2);
    stepPlayerKinematics(p, {...idle,jump:true}, [], config.bounds, config.player, .05, 0, ground);
    expect(p.y).toBeGreaterThan(-2);
    for (let i = 0; i < 50; i++) stepPlayerKinematics(p, idle, [], config.bounds, config.player, .05, 0, ground);
    expect(p.y).toBe(-2);
    expect(p.isGrounded).toBe(true);
  });

  it("climbs shallow steps, blocks a high ledge and never walks off the footprint", () => {
    const p = createInitialPlayerState(config); p.x=0; p.z=0; p.y=0;
    const stairs = (x: number) => x > 5 ? null : x < 3 ? Math.floor(Math.max(0,x) / .6) * .2 : 4;
    for(let i=0;i<150;i++) stepPlayerKinematics(p,{...idle,right:true},[],config.bounds,config.player,.05,0,stairs);
    expect(p.x).toBeLessThan(3);
    expect(p.y).toBeCloseTo(.8);
    const edge = (x: number) => x < 3 ? 0 : null;
    p.x=0;p.y=0;
    for(let i=0;i<150;i++) stepPlayerKinematics(p,{...idle,right:true},[],config.bounds,config.player,.05,0,edge);
    expect(p.x).toBeLessThan(3);
  });

  it("collides with elevated posts but can pass below an overhead roof", () => {
    const post={id:"post",minX:0,maxX:1,minZ:0,maxZ:1,minY:4,maxY:10};
    expect(resolveCircleAabbCollision(.5,.5,.45,post,4)).not.toEqual({x:.5,z:.5});
    expect(resolveCircleAabbCollision(.5,.5,.45,post,0)).toEqual({x:.5,z:.5});
    expect(resolveCircleAabbCollision(.5,.5,.45,{...post,cameraOnly:true},4)).toEqual({x:.5,z:.5});
  });

  it("keeps the camera above a raised terrace and allows low views beside the lower lake", () => {
    const camera=createInitialCameraRig([0,4,0],config.camera);
    camera.pitch=-.3;camera.targetPitch=-.3;
    for(let i=0;i<100;i++) stepFollowCamera(camera,0,4,0,config.camera,.05,[],()=>4);
    expect(camera.positionY).toBeGreaterThanOrEqual(4.59);
    const low=createInitialCameraRig([0,-2,0],config.camera);
    low.pitch=0;low.targetPitch=0;
    for(let i=0;i<100;i++) stepFollowCamera(low,0,-2,0,config.camera,.05,[],()=>-2);
    expect(low.positionY).toBeLessThan(0);
    expect(low.positionY).toBeGreaterThan(-1.41);
  });
});
