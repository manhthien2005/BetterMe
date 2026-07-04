import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BetterMeData } from "@/types";
import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { WeeklyQuestBoard } from "./weekly-quest-board";

describe("WeeklyQuestBoard", () => {
  it("renders a Monday-Sunday quest board with navigation and selected-day controls", async () => {
    render(
      <TrackerStoreProvider adapter={new MemoryStorageAdapter(data())} now={new Date("2026-01-02T12:00:00Z")}>
        <WeeklyQuestBoard weekStart="2025-12-29" />
      </TrackerStoreProvider>
    );

    expect(await screen.findByRole("heading", { name: "Weekly quest board" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous week" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next week" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /2026|2025/ })).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: /Fri, Jan 2, 2026/ }));
    expect(await screen.findByRole("heading", { name: /January 2, 2026/i })).toBeTruthy();
    expect(screen.getAllByText("Bad").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("checkbox", { name: "Study" }));
    await waitFor(() => expect(screen.getAllByText("Good").length).toBeGreaterThan(0));
  });
});

function data(): BetterMeData {
  return {
    schemaVersion: 1,
    habits: [{ id: "study", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" }],
    habitEntries: [],
    reflections: [],
    settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 14, targetCompletionRate: 1, themeId: "cute-cat" },
    updatedAt: "x"
  };
}
