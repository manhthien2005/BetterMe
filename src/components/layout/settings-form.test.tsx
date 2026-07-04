import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BetterMeData, TrackerSettings } from "@/types";
import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { SettingsForm, validateTrackerSettings } from "./settings-form";

describe("SettingsForm", () => {
  it("edits tracker settings, theme preference, and confirms local reset", async () => {
    const adapter = new MemoryStorageAdapter(data());
    render(<TrackerStoreProvider adapter={adapter} now={new Date("2026-01-02T12:00:00Z")}><SettingsForm /></TrackerStoreProvider>);

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(await screen.findByDisplayValue("UTC")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Timezone"), { target: { value: "Asia/Ho_Chi_Minh" } });
    fireEvent.change(screen.getByLabelText("Tracking days"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Target completion rate"), { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "minimal-calm" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(async () => expect((await adapter.load())?.settings).toMatchObject({ timezone: "Asia/Ho_Chi_Minh", trackerDays: 30, targetCompletionRate: 0.75, themeId: "minimal-calm" }));

    fireEvent.click(screen.getByRole("button", { name: "Clear local data" }));
    expect(screen.getByRole("dialog", { name: "Confirm reset" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    await waitFor(async () => expect((await adapter.load())?.settings.themeId).toBe("cute-cat"));
  });

  it("rejects invalid tracker settings", () => {
    const invalid: TrackerSettings = { timezone: "", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 0, targetCompletionRate: 1.25, themeId: "cute-cat", locale: "en" };

    expect(validateTrackerSettings(invalid)).toEqual({ valid: false, errors: ["Timezone is required", "Tracking days must be at least 1", "Target completion rate must be between 0 and 100"] });
  });
});

function data(): BetterMeData {
  return {
    schemaVersion: 1,
    habits: [],
    habitEntries: [],
    reflections: [],
    settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 14, targetCompletionRate: 1, themeId: "cute-cat", locale: "en" },
    updatedAt: "x"
  };
}
