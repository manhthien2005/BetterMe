import fs from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Quaternion } from "three";
import { createActionMotionPlayer, parseActionMotion } from "./character-action-motion";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";

const asset = () => parseActionMotion(JSON.parse(fs.readFileSync("public/models/animations/actions.json", "utf8")));
describe("hands and jump supplement", () => {
  it("preserves the owner-approved walk/run source exactly", () => {
    expect(createHash("sha256").update(fs.readFileSync("public/models/animations/locomotion.json")).digest("hex"))
      .toBe("4011f90a8b5fcc237a0d7e4d16458c03fbce383010be73ea18b364bcf7f17ef2");
  });
  it("ships validated jump phases and source fingers, rejects malformed tracks", () => {
    const data = asset();
    expect(Object.keys(data.clips)).toEqual(["launch", "air", "land"]);
    expect(data.clips.air.rotations.leftIndexProximal.length).toBeGreaterThan(4);
    const bad = structuredClone(data); bad.clips.air.rotations.leftHand[0] = NaN;
    expect(() => parseActionMotion(bad)).toThrow();
  });
  it("keeps body layering off at idle/walk/run while hands follow their activity", () => {
    const player = createActionMotionPlayer(asset(), 0.91);
    for (const state of ["idle", "walk", "run"] as const) {
      const sample = player.sample({ state, stateTime: 2, velocityY: 0, jumpSpeed: 7.4, moving: state !== "idle" }, 1 / 60);
      expect(sample.bodyWeight).toBe(0);
      const curl = new Quaternion().angleTo(sample.rotations.leftIndexProximal);
      expect(curl).toBeGreaterThan(0.35);
      expect(curl).toBeLessThan(1.3);
    }
  });
  it.each([30, 60, 120])("syncs air pose to velocity and recovers after landing at %i Hz", hz => {
    const player = createActionMotionPlayer(asset(), 0.91);
    let ascent: Quaternion | undefined, descent: Quaternion | undefined;
    for (let i = 0; i < hz; i++) {
      const t = i / hz, vy = 7.4 - 20 * t;
      const sample = player.sample({ state: t < .37 ? "jump" : "fall", stateTime: t, velocityY: vy, jumpSpeed: 7.4, moving: false }, 1 / hz);
      expect(sample.hipsOffsetY).toBeGreaterThan(-0.15);
      expect(sample.hipsOffsetY).toBeLessThan(0.05);
      if (i === Math.round(hz * .25)) ascent = sample.rotations.leftLowerLeg.clone();
      if (i === Math.round(hz * .65)) descent = sample.rotations.leftLowerLeg.clone();
    }
    expect(ascent!.angleTo(descent!)).toBeGreaterThan(.35);
    let lowest = 0;
    for (let i = 0; i < hz; i++) {
      const sample = player.sample({ state: i < hz / 4 ? "land" : "idle", stateTime: i / hz, velocityY: 0, jumpSpeed: 7.4, moving: false }, 1 / hz);
      lowest = Math.min(lowest, sample.hipsOffsetY * sample.bodyWeight);
    }
    expect(lowest).toBeLessThan(-0.12);
    expect(player.sample({ state: "idle", stateTime: 3, velocityY: 0, jumpSpeed: 7.4, moving: false }, 1 / hz).bodyWeight).toBe(0);
    player.reset();
    expect(player.sample({ state: "idle", stateTime: 0, velocityY: 0, jumpSpeed: 7.4, moving: false }, 0).bodyWeight).toBe(0);
  });
  it("passes physics state even when land resumes the accepted running pose", () => {
    const machine = createInitialAnimationMachineState();
    stepAnimationStateMachine(machine, { isGrounded: false, isMoving: true, isRunning: true, speed: 4, velocityY: 7 }, 1 / 60);
    expect(evaluateBlendedPose(machine).action?.state).toBe("jump");
    stepAnimationStateMachine(machine, { isGrounded: true, isMoving: true, isRunning: true, speed: 4, velocityY: 0 }, 1 / 60);
    expect(evaluateBlendedPose(machine).action?.state).toBe("land");
  });
  it("does not crouch again when movement stops halfway through landing recovery", () => {
    const player = createActionMotionPlayer(asset(), .91);
    const landing = { state: "land" as const, stateTime: 0, velocityY: 0, jumpSpeed: 7.4, moving: true };
    let previousHip = 0;
    for (let i = 0; i < 16; i++) previousHip = player.sample(landing, .01).hipsOffsetY;
    const afterRelease = player.sample({ ...landing, moving: false }, .01);
    expect(afterRelease.hipsOffsetY).toBeGreaterThanOrEqual(previousHip - .01);
  });
  it("cancels recovery immediately on re-jump, then resets to the relaxed hand", () => {
    const player = createActionMotionPlayer(asset(), .91);
    const intent = { state: "land" as const, stateTime: 0, velocityY: 0, jumpSpeed: 7.4, moving: false };
    for (let i = 0; i < 8; i++) player.sample(intent, 1 / 60);
    const recovering = player.sample(intent, 1 / 60);
    expect(recovering.hipsOffsetY).toBeLessThan(-.05);
    expect(recovering.bodyWeight).toBeGreaterThan(.5);
    const jump = player.sample({ ...intent, state: "jump", velocityY: 7.4 }, 1 / 60);
    expect(jump.airborne).toBe(true);
    expect(jump.hipsOffsetY).toBe(0);
    player.reset();
    const idle = player.sample({ ...intent, state: "idle" }, 0);
    expect(idle.bodyWeight).toBe(0);
    expect(new Quaternion().angleTo(idle.rotations.leftIndexProximal)).toBeLessThan(.8);
  });
});
