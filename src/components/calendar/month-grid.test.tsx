import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BetterMeData } from "@/types";
import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { CalendarView } from "./calendar-view";

describe("CalendarView", () => {
  it("renders a six-week month grid with keyboard date navigation and selected-day detail", async () => {
    render(
      <TrackerStoreProvider adapter={new MemoryStorageAdapter(data())} now={new Date("2026-01-02T12:00:00Z")}>
        <CalendarView selectedDate="2026-01-02" />
      </TrackerStoreProvider>
    );

    expect(await screen.findByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByRole("grid", { name: "Month calendar" })).toBeTruthy();
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    expect(screen.getByRole("button", { name: /Fri, Jan 2, 2026.*selected.*Good/i })).toBeTruthy();

    fireEvent.keyDown(screen.getByRole("button", { name: /Fri, Jan 2, 2026/i }), { key: "ArrowLeft" });

    expect(await screen.findByRole("heading", { name: /January 1, 2026/i })).toBeTruthy();
  });
});

function data(): BetterMeData {
  return {
    schemaVersion: 1,
    habits: [{ id: "study", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" }],
    habitEntries: [{ date: "2026-01-02", habitCompletions: { study: true }, updatedAt: "x" }],
    reflections: [],
    settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 31, targetCompletionRate: 1, themeId: "cute-cat" },
    updatedAt: "x"
  };
}
