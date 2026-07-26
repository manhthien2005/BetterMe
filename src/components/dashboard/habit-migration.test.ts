import { describe, expect, it } from "vitest";

import {
  defaultHabitV3Fields,
  deriveCompletions,
  migrateEntries,
  migrateHabitFields
} from "@/components/dashboard/habit-migration";
import { ALL_WEEKDAYS, type HabitTracking } from "@/components/dashboard/habit-model";

describe("defaultHabitV3Fields", () => {
  it("maps a v2 habit onto a plain daily checkbox", () => {
    const fields = defaultHabitV3Fields("wake_up", "Discipline");

    expect(fields.trackingType).toBe("check");
    expect(fields.target).toBe(1);
    expect(fields.repeatDays).toEqual([...ALL_WEEKDAYS]);
    expect(fields.timesOfDay).toEqual(["anytime"]);
    expect(fields.pausedAt).toBeNull();
    expect(fields.archivedAt).toBeNull();
  });

  it("borrows the icon the UI already showed for that habit", () => {
    expect(defaultHabitV3Fields("wake_up", "Discipline").icon).toBe("⏰");
    expect(defaultHabitV3Fields("unknown_key", "Health").icon).toBe("💚");
    expect(defaultHabitV3Fields("unknown_key", "Nothing").icon).toBe("⭐");
  });
});

describe("migrateHabitFields", () => {
  it("fills a v2 habit in without touching what it already had", () => {
    const migrated = migrateHabitFields({
      id: "wake_up",
      key: "wake_up",
      name: "Dậy đúng giờ",
      category: "Discipline",
      maxScore: 1,
      description: "",
      iconName: "AlarmClock"
    });

    expect(migrated.name).toBe("Dậy đúng giờ");
    expect(migrated.iconName).toBe("AlarmClock");
    expect(migrated.trackingType).toBe("check");
    expect(migrated.icon).toBe("⏰");
  });

  it("is idempotent — a v3 habit passes through unchanged", () => {
    const v3 = migrateHabitFields({
      key: "water",
      category: "Health",
      trackingType: "count" as const,
      target: 8,
      unit: "ly",
      icon: "💧",
      repeatDays: [1, 3, 5],
      timesOfDay: ["morning"] as const,
      pausedAt: "2026-07-01"
    });

    expect(migrateHabitFields(v3)).toEqual(v3);
    expect(v3.trackingType).toBe("count");
    expect(v3.repeatDays).toEqual([1, 3, 5]);
    expect(v3.pausedAt).toBe("2026-07-01");
  });

  it("repairs a corrupt repeat list rather than leaving a habit unreachable", () => {
    const migrated = migrateHabitFields({
      key: "x",
      category: "Work",
      repeatDays: ["monday", 9, 3] as unknown as number[]
    });

    expect(migrated.repeatDays).toEqual([3]);
  });
});

describe("migrateEntries", () => {
  it("turns v2 booleans into entries, keeping the explicit false", () => {
    expect(migrateEntries({ completions: { wake_up: true, clean: false } })).toEqual({
      wake_up: { value: 1 },
      clean: { value: 0 }
    });
  });

  it("keeps v3 entries as they are (idempotent)", () => {
    const entries = { water: { value: 6, completedAt: "21:30" } };

    expect(migrateEntries({ entries })).toEqual(entries);
  });

  it("prefers existing entries over the derived boolean cache", () => {
    expect(
      migrateEntries({ entries: { water: { value: 6 } }, completions: { water: true } })
    ).toEqual({ water: { value: 6 } });
  });

  it("survives junk", () => {
    expect(migrateEntries({})).toEqual({});
    expect(migrateEntries({ completions: null })).toEqual({});
    expect(migrateEntries({ entries: { a: { value: "x" } } as unknown })).toEqual({});
    expect(migrateEntries({ completions: { a: "yes" } as unknown })).toEqual({});
  });
});

describe("deriveCompletions", () => {
  const tracking = new Map<string, HabitTracking>([
    ["water", { trackingType: "count", target: 8, repeatDays: [...ALL_WEEKDAYS] }],
    ["wake_up", { trackingType: "check", target: 1, repeatDays: [...ALL_WEEKDAYS] }]
  ]);

  it("marks a cell done only when the entry meets its target", () => {
    expect(
      deriveCompletions({ water: { value: 6 }, wake_up: { value: 1 } }, tracking)
    ).toEqual({ water: false, wake_up: true });
    expect(deriveCompletions({ water: { value: 8 } }, tracking)).toEqual({ water: true });
  });

  it("drops cells whose habit no longer exists", () => {
    expect(deriveCompletions({ ghost: { value: 1 } }, tracking)).toEqual({});
  });
});

describe("timesOfDay migration", () => {
  it("a v2 habit lands on the whole day", () => {
    expect(migrateHabitFields({ key: "x", category: "Work" }).timesOfDay).toEqual(["anytime"]);
  });

  it("upgrades a U1a habit that still carries the singular field", () => {
    const migrated = migrateHabitFields({
      key: "x",
      category: "Work",
      timeOfDay: "evening"
    } as unknown as { key: string; category: string });

    expect(migrated.timesOfDay).toEqual(["evening"]);
  });

  it("leaves an already-multi habit alone", () => {
    const habit = migrateHabitFields({
      key: "x",
      category: "Work",
      timesOfDay: ["morning", "evening"]
    });

    expect(migrateHabitFields(habit).timesOfDay).toEqual(["morning", "evening"]);
  });
});
