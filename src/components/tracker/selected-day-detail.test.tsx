import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { SelectedDayDetail } from "./selected-day-detail";

describe("SelectedDayDetail", () => {
  it("shows score/status and toggles habits with an accessible control", async () => {
    render(<TrackerStoreProvider adapter={new MemoryStorageAdapter(data())} now={new Date("2026-01-02T12:00:00Z")}><SelectedDayDetail date="2026-01-02" /></TrackerStoreProvider>);
    expect(await screen.findByRole("heading", { name: /January 2, 2026/i })).toBeTruthy();
    expect(screen.getByText("Bad")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Study" }));
    expect(await screen.findByText("Good")).toBeTruthy();
  });
});

function data() {
  return { schemaVersion: 1 as const, habits: [{ id: "h1", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "Practice", sortOrder: 0, createdAt: "x", updatedAt: "x" }], habitEntries: [], reflections: [], settings: { timezone: "UTC", startDate: "2026-01-01" as const, selectedDate: "2026-01-02" as const, trackerDays: 7, targetCompletionRate: 1, themeId: "cute-cat" as const, locale: "en" as const }, updatedAt: "x" };
}
