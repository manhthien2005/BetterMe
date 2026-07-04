import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { ReflectionEditor } from "./reflection-editor";

describe("ReflectionEditor", () => {
  it("saves all three labeled reflection fields", async () => {
    const adapter = new MemoryStorageAdapter(data());
    render(<TrackerStoreProvider adapter={adapter} now={new Date("2026-01-02T12:00:00Z")}><ReflectionEditor date="2026-01-02" entry={null} /></TrackerStoreProvider>);
    expect(screen.getByText("Loading...")).toBeTruthy();
    fireEvent.change(await screen.findByLabelText("Daily note"), { target: { value: "A focused day" } });
    fireEvent.change(screen.getByLabelText("Challenge today"), { target: { value: "Noise" } });
    fireEvent.change(screen.getByLabelText("Tomorrow focus"), { target: { value: "Deep work" } });
    fireEvent.click(screen.getByRole("button", { name: "Save reflection" }));
    await waitFor(async () => expect((await adapter.load())?.reflections[0]).toMatchObject({ dailyNote: "A focused day", problemToday: "Noise", tomorrowFocus: "Deep work" }));
  });
});

function data() {
  return { schemaVersion: 1 as const, habits: [], habitEntries: [], reflections: [], settings: { timezone: "UTC", startDate: "2026-01-01" as const, selectedDate: "2026-01-02" as const, trackerDays: 7, targetCompletionRate: 1, themeId: "cute-cat" as const, locale: "en" as const }, updatedAt: "x" };
}
