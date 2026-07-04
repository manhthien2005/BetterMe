import { describe, expect, it } from "vitest";

import type { Habit, HabitCompletionEntry } from "@/types";
import { calculateScore } from "./calculate-score";

const habits: Habit[] = [
  habit("z-id", "wake", "Wake up", 2, 1),
  habit("a-id", "study", "Study", 3, 1),
  { ...habit("off", "rest", "Rest", 100, 0), active: false }
];
const policy = { startDate: "2026-01-01" as const, targetCompletionRate: 0.8 };

describe("calculateScore", () => {
  it("calculates weighted totals and an Okay status", () => {
    const entry: HabitCompletionEntry = {
      date: "2026-01-02",
      habitCompletions: { "a-id": true, off: true },
      updatedAt: "2026-01-02T12:00:00.000Z"
    };
    expect(calculateScore(entry, habits, policy, "2026-01-02", "2026-01-02")).toEqual({
      totalScore: 3,
      maxScore: 5,
      completionRate: 0.6,
      status: "Okay",
      missedHabitKeys: ["wake"],
      missedHabitNames: ["Wake up"]
    });
  });

  it("uses Good at target, Bad below half, and zero for no active score", () => {
    expect(calculateScore(undefined, habits, policy, "2026-01-02", "2026-01-02").status).toBe("Bad");
    expect(calculateScore({ date: "2026-01-02", habitCompletions: { "z-id": true, "a-id": true }, updatedAt: "x" }, habits, policy, "2026-01-02", "2026-01-02").status).toBe("Good");
    const empty = calculateScore(undefined, [], policy, "2026-01-02", "2026-01-02");
    expect(empty.completionRate).toBe(0);
    expect(empty.status).toBe("Bad");
  });

  it("marks future dates Planned and pre-start dates untracked", () => {
    expect(calculateScore(undefined, habits, policy, "2026-01-03", "2026-01-02")).toMatchObject({ completionRate: null, status: "Planned" });
    expect(calculateScore(undefined, habits, policy, "2025-12-31", "2026-01-02")).toMatchObject({ completionRate: null, status: null });
  });

  it("sorts missed habits by sortOrder then ASCII Habit.id", () => {
    const score = calculateScore(undefined, habits, policy, "2026-01-02", "2026-01-02");
    expect(score.missedHabitKeys).toEqual(["study", "wake"]);
    expect(score.missedHabitNames).toEqual(["Study", "Wake up"]);
  });

  it("rejects invalid policy and habit weights", () => {
    expect(() => calculateScore(undefined, habits, { ...policy, targetCompletionRate: 1.1 }, "2026-01-02", "2026-01-02")).toThrow(RangeError);
    expect(() => calculateScore(undefined, [{ ...habits[0], maxScore: -1 }], policy, "2026-01-02", "2026-01-02")).toThrow(RangeError);
  });
});

function habit(id: string, key: string, name: string, maxScore: number, sortOrder: number): Habit {
  return { id, key, name, category: "growth", maxScore, active: true, description: "", sortOrder, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}
