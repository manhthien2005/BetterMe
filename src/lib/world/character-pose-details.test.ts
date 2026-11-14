import { describe, expect, it } from "vitest";
import { createInitialAnimationMachineState, evaluateBlendedPose, stepAnimationStateMachine } from "./animation-state-machine";

describe("character pose detail", () => {
  it("keeps the gait visible with reduced motion instead of sliding a static standing pose", () => {
    const machine = createInitialAnimationMachineState();
    const angles: number[] = [];
    for (let i = 0;i < 60;i++) {
      stepAnimationStateMachine(machine, { isGrounded: true, isMoving: true, isRunning: false, speed: 2.2, velocityY: 0 }, 1 / 60);
      angles.push(evaluateBlendedPose(machine, true).bones.leftUpperLeg[0]);
    }
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(0.4);
  });
  it("relaxes fingers at rest and opens the greeting hand without moving physics", () => {
    const machine = createInitialAnimationMachineState();
    const rest = evaluateBlendedPose(machine);
    expect(rest.detailBones?.rightIndexProximal?.[2]).toBeGreaterThan(0.1);
    for (let i = 0;i < 30;i++) stepAnimationStateMachine(machine, { isGrounded: true, isMoving: false, isRunning: false, speed: 0, velocityY: 0, isDialogueOpen: true, interactRequested: i === 0 }, 1 / 60);
    const wave = evaluateBlendedPose(machine);
    expect(Math.abs(wave.detailBones!.rightIndexProximal![2])).toBeLessThan(Math.abs(rest.detailBones!.rightIndexProximal![2]));
    expect(machine.expressions.aa).toBe(0);
  });
  it("exposes alternating ground contact, toe lift, and never plants airborne feet", () => {
    const machine = createInitialAnimationMachineState();
    const contacts = new Set<string>();
    const toes = new Set<number>();
    for (let i = 0;i < 120;i++) {
      stepAnimationStateMachine(machine, { isGrounded: true, isMoving: true, isRunning: false, speed: 2.2, velocityY: 0 }, 1 / 60);
      const pose = evaluateBlendedPose(machine);
      contacts.add(JSON.stringify(pose.footContacts));
      toes.add(pose.detailBones?.leftToes?.[0] ?? 0);
      for (const angles of Object.values(pose.detailBones ?? {})) expect(angles.every(Number.isFinite)).toBe(true);
    }
    expect(contacts.size).toBeGreaterThan(1);
    expect(toes.size).toBeGreaterThan(1);
    stepAnimationStateMachine(machine, { isGrounded: false, isMoving: false, isRunning: false, speed: 0, velocityY: 7.4 }, 1 / 60);
    expect(evaluateBlendedPose(machine).footContacts).toEqual({ left: false, right: false });
  });
});
