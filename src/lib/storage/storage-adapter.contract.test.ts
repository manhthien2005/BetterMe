import { describe, expect, it } from "vitest";

import type { BetterMeData, StorageAdapter } from "@/types";
import { MemoryStorageAdapter } from "./memory-storage-adapter";
import { parseBetterMeData } from "./schema";

describe("StorageAdapter contract", () => {
  runContract("memory", () => new MemoryStorageAdapter());

  it("migrates legacy settings without locale to English", () => {
    const legacy = {
      schemaVersion: 1,
      habits: [],
      habitEntries: [],
      reflections: [],
      settings: {
        timezone: "UTC",
        startDate: "2026-01-01",
        selectedDate: "2026-01-01",
        trackerDays: 30,
        targetCompletionRate: 0.8,
        themeId: "cute-cat"
      },
      updatedAt: "2026-01-01T00:00:00.000Z"
    };

    expect(parseBetterMeData(legacy).settings.locale).toBe("en");
  });
});

function runContract(name: string, create: () => StorageAdapter) {
  describe(name, () => {
    it("loads null, saves a deep clone, and clears", async () => {
      const adapter = create();
      expect(await adapter.load()).toBeNull();
      const original = data();
      await adapter.save(original);
      original.settings.timezone = "Changed";
      const loaded = await adapter.load();
      expect(loaded?.settings.timezone).toBe("UTC");
      if (loaded) loaded.settings.timezone = "Mutated";
      expect((await adapter.load())?.settings.timezone).toBe("UTC");
      await adapter.clear();
      expect(await adapter.load()).toBeNull();
    });
  });
}

export function data(): BetterMeData {
  return { schemaVersion: 1, habits: [], habitEntries: [], reflections: [], settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-01", trackerDays: 30, targetCompletionRate: 0.8, themeId: "cute-cat", locale: "en" }, updatedAt: "2026-01-01T00:00:00.000Z" };
}
