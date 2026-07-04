import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BetterMeData, HabitConfig } from "@/types";
import { validateHabitConfig } from "../../features/habits";
import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { HabitConfigPanel } from "./habit-config-panel";

describe("HabitConfigPanel", () => {
  it("edits habit fields while preserving stable ids and adds a new habit", async () => {
    const adapter = new MemoryStorageAdapter(data());
    render(<TrackerStoreProvider adapter={adapter} now={new Date("2026-01-02T12:00:00Z")}><HabitConfigPanel /></TrackerStoreProvider>);

    expect(await screen.findByRole("heading", { name: "Habit configuration" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Habit name: Study"), { target: { value: "Deep Study" } });
    fireEvent.change(screen.getByLabelText("Max score: Study"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Description: Study"), { target: { value: "Read and shadow" } });
    fireEvent.click(screen.getByLabelText("Active: Study"));
    fireEvent.click(screen.getByRole("button", { name: "Save Study" }));

    await waitFor(async () => expect((await adapter.load())?.habits[0]).toMatchObject({ id: "study", name: "Deep Study", maxScore: 2, active: false, description: "Read and shadow" }));

    fireEvent.change(screen.getByLabelText("New habit name"), { target: { value: "Exercise" } });
    fireEvent.change(screen.getByLabelText("New habit category"), { target: { value: "health" } });
    fireEvent.change(screen.getByLabelText("New habit score"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));

    await waitFor(async () => expect((await adapter.load())?.habits.map((habit) => habit.name)).toContain("Exercise"));
  });

  it("rejects blank names and negative scores", () => {
    const invalid: HabitConfig = { key: "", name: " ", category: "growth", maxScore: -1, active: true, description: "", sortOrder: 0 };

    expect(validateHabitConfig(invalid, [])).toEqual({ valid: false, errors: ["Name is required", "Key is required", "Max score must be non-negative"] });
  });
});

function data(): BetterMeData {
  return {
    schemaVersion: 1,
    habits: [{ id: "study", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "Read", sortOrder: 0, createdAt: "x", updatedAt: "x" }],
    habitEntries: [],
    reflections: [],
    settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 14, targetCompletionRate: 1, themeId: "cute-cat", locale: "en" },
    updatedAt: "x"
  };
}
