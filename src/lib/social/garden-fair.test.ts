import { describe, expect, it } from "vitest";

import type { FairGarden, GardenFair } from "@/lib/server/social-actions";
import {
  deriveFairView,
  FAIR_BLOOM_THRESHOLD,
  FAIR_MAX_LANTERNS,
  lanternScore,
  mondayOf,
  previousWeekMonday
} from "@/lib/social/garden-fair";

const TODAY = "2026-07-09"; // Thursday
const THIS_MONDAY = "2026-07-06";
const M1 = "2026-06-29"; // Monday of the previous week

function garden(userId: string, overrides: Partial<FairGarden> = {}): FairGarden {
  return {
    userId,
    displayName: `Vườn ${userId}`,
    avatarKind: "nep",
    petSpecies: "dog",
    weeklyGoodDays: 3,
    weekStart: THIS_MONDAY,
    prevWeekGoodDays: null,
    prevWeekStart: null,
    ...overrides
  };
}

function fair(gardens: FairGarden[], me: FairGarden | null = null): GardenFair {
  return { me, gardens };
}

describe("locked decisions §11", () => {
  it("blooms at >= 4/7 and caps lanterns at 3", () => {
    expect(FAIR_BLOOM_THRESHOLD).toBe(4);
    expect(FAIR_MAX_LANTERNS).toBe(3);
  });
});

describe("mondayOf", () => {
  it("returns the Monday that starts the ISO week (Monday-start)", () => {
    expect(mondayOf("2026-07-09")).toBe("2026-07-06"); // Thu -> Mon
    expect(mondayOf("2026-07-06")).toBe("2026-07-06"); // Mon -> itself
    expect(mondayOf("2026-07-12")).toBe("2026-07-06"); // Sun -> that week's Mon
    expect(mondayOf("2026-07-13")).toBe("2026-07-13"); // next Mon
  });
});

describe("previousWeekMonday (M-1)", () => {
  it("is the Monday of the week before today's week", () => {
    expect(previousWeekMonday("2026-07-09")).toBe(M1);
    expect(previousWeekMonday("2026-07-06")).toBe(M1); // Monday -> previous Monday
    expect(previousWeekMonday("2026-07-12")).toBe(M1); // Sunday -> previous Monday
  });
});

describe("lanternScore — self-verifying previous-week read (§5.2)", () => {
  it("uses weeklyGoodDays when the row hasn't rolled over (last write Sunday)", () => {
    // week_start still equals M-1: the user hasn't written anything this week.
    const g = garden("a", { weekStart: M1, weeklyGoodDays: 6 });
    expect(lanternScore(g, M1)).toBe(6);
  });

  it("uses prevWeekGoodDays when the row rolled over normally", () => {
    const g = garden("a", {
      weekStart: THIS_MONDAY,
      weeklyGoodDays: 2,
      prevWeekStart: M1,
      prevWeekGoodDays: 5
    });
    expect(lanternScore(g, M1)).toBe(5);
  });

  it("returns null when absent >= 2 weeks (stale prev week never counts)", () => {
    const g = garden("a", {
      weekStart: "2026-06-22",
      weeklyGoodDays: 4,
      prevWeekStart: "2026-06-15",
      prevWeekGoodDays: 7
    });
    expect(lanternScore(g, M1)).toBeNull();
  });

  it("returns null when there is no previous week at all", () => {
    const g = garden("a", { weekStart: THIS_MONDAY, prevWeekStart: null });
    expect(lanternScore(g, M1)).toBeNull();
  });
});

describe("deriveFairView (§5.2)", () => {
  it("stays absolutely silent about a week-0 garden", () => {
    const view = deriveFairView(fair([garden("a", { weeklyGoodDays: 0 }), garden("b")]), TODAY);
    expect(view.map((g) => g.userId)).toEqual(["b"]);
  });

  it("blooms every garden with >= 4 good days, no ranking, no greying", () => {
    const view = deriveFairView(
      fair([garden("a", { weeklyGoodDays: 4 }), garden("b", { weeklyGoodDays: 3 })]),
      TODAY
    );
    expect(view.find((g) => g.userId === "a")?.hasBloom).toBe(true);
    expect(view.find((g) => g.userId === "b")?.hasBloom).toBe(false);
  });

  it("puts my own garden first, then friends in the given (accepted_at) order", () => {
    const view = deriveFairView(
      fair([garden("f1"), garden("f2")], garden("me")),
      TODAY
    );
    expect(view.map((g) => g.userId)).toEqual(["me", "f1", "f2"]);
    expect(view[0].isMe).toBe(true);
    expect(view[1].isMe).toBe(false);
  });

  it("hangs at most 3 lanterns on the highest self-verifying previous-week scores", () => {
    // prev-week scores: a=6, b=5, c=4, d=3, e=2 (all rolled over, prevWeekStart=M1)
    const rolled = (userId: string, prev: number) =>
      garden(userId, { weekStart: THIS_MONDAY, prevWeekStart: M1, prevWeekGoodDays: prev });
    const view = deriveFairView(
      fair([rolled("a", 6), rolled("b", 5), rolled("c", 4), rolled("d", 3), rolled("e", 2)]),
      TODAY
    );
    const lit = view.filter((g) => g.hasLantern).map((g) => g.userId);
    expect(lit).toEqual(["a", "b", "c"]);
    expect(view.filter((g) => g.hasLantern).length).toBeLessThanOrEqual(FAIR_MAX_LANTERNS);
  });

  it("never hands a lantern to a garden with no valid previous week or a 0 score", () => {
    const rolled = (userId: string, prev: number) =>
      garden(userId, { weekStart: THIS_MONDAY, prevWeekStart: M1, prevWeekGoodDays: prev });
    const view = deriveFairView(
      fair([
        rolled("a", 3),
        garden("b", { weekStart: THIS_MONDAY, prevWeekStart: null }), // no prev week
        rolled("c", 0) // scored 0 last week — not honored
      ]),
      TODAY
    );
    expect(view.find((g) => g.userId === "b")?.hasLantern).toBe(false);
    expect(view.find((g) => g.userId === "c")?.hasLantern).toBe(false);
    expect(view.find((g) => g.userId === "a")?.hasLantern).toBe(true);
  });

  it("renders all 15 opt-in gardens and never reorders when scores change (§12 gate)", () => {
    const ids = Array.from({ length: 15 }, (_, i) => `g${i}`);
    const low = fair(ids.map((id, i) => garden(id, { weeklyGoodDays: 1 + (i % 7) })));
    const high = fair(ids.map((id, i) => garden(id, { weeklyGoodDays: 7 - (i % 7) })));

    const orderLow = deriveFairView(low, TODAY).map((g) => g.userId);
    const orderHigh = deriveFairView(high, TODAY).map((g) => g.userId);

    expect(orderLow).toEqual(ids);
    expect(orderHigh).toEqual(ids); // order is by accepted_at, never by score
  });
});
