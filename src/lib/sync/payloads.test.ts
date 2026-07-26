import { describe, expect, it } from "vitest";

import { migrateHabitFields } from "@/components/dashboard/habit-migration";
import type { DashboardHabit } from "@/components/dashboard/dashboard-data";

import { habitSyncPayload, logSyncMutation } from "./payloads";

function makeHabit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "read",
    key: "read",
    name: "Đọc sách",
    category: "Growth",
    maxScore: 1,
    description: "",
    iconName: "BookOpen",
    ...overrides
  });
}

describe("habitSyncPayload", () => {
  it("carries every v3 field", () => {
    const habit = makeHabit({
      icon: "📚",
      trackingType: "duration",
      target: 20,
      repeatDays: [2, 4, 6],
      timesOfDay: ["evening"],
      scheduledAt: "21:00",
      color: "dusk",
      motivation: "Mỗi tối một chương"
    });

    expect(habitSyncPayload(habit, 3)).toMatchObject({
      key: "read",
      sortOrder: 3,
      icon: "📚",
      trackingType: "duration",
      target: 20,
      repeatDays: [2, 4, 6],
      timesOfDay: ["evening"],
      scheduledAt: "21:00",
      color: "dusk",
      motivation: "Mỗi tối một chương"
    });
  });

  it("spells every absent optional as null, never undefined", () => {
    // An absent key would let the RPC fall back to its SQL default instead of
    // clearing the column — "the user removed the unit" must not read as
    // "the user said nothing about the unit".
    const payload = habitSyncPayload(makeHabit(), 0);

    expect(payload.unit).toBeNull();
    expect(payload.scheduledAt).toBeNull();
    expect(payload.pausedAt).toBeNull();
    expect(payload.archivedAt).toBeNull();
    expect(Object.values(payload).every((value) => value !== undefined)).toBe(true);
  });

  it("keeps the legacy `active` flag in step with the v3 lifecycle", () => {
    expect(habitSyncPayload(makeHabit(), 0).active).toBe(true);
    expect(habitSyncPayload(makeHabit({ archivedAt: "2026-07-27" }), 0).active).toBe(false);
  });

  it("carries a pause so the other device stops showing the habit too", () => {
    expect(habitSyncPayload(makeHabit({ pausedAt: "2026-07-28" }), 0).pausedAt).toBe("2026-07-28");
  });
});

describe("logSyncMutation", () => {
  it("carries the reading and the clock", () => {
    expect(
      logSyncMutation("water", "2026-07-27", true, { value: 8, completedAt: "21:40" }, "TS")
    ).toEqual({
      kind: "setHabitLog",
      habitKey: "water",
      date: "2026-07-27",
      done: true,
      value: 8,
      completedAt: "21:40",
      clientTs: "TS"
    });
  });

  it("carries partial progress with done still false", () => {
    expect(logSyncMutation("water", "2026-07-27", false, { value: 3 }, "TS")).toEqual({
      kind: "setHabitLog",
      habitKey: "water",
      date: "2026-07-27",
      done: false,
      value: 3,
      clientTs: "TS"
    });
  });

  it("omits completedAt rather than sending an empty one", () => {
    expect(logSyncMutation("water", "2026-07-27", false, { value: 0 }, "TS")).not.toHaveProperty(
      "completedAt"
    );
  });

  it("falls back to the boolean when there is no entry at all", () => {
    expect(logSyncMutation("water", "2026-07-27", true, undefined, "TS").value).toBe(1);
    expect(logSyncMutation("water", "2026-07-27", false, undefined, "TS").value).toBe(0);
  });
});
