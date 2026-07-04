import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MemoryStorageAdapter } from "../lib/storage/memory-storage-adapter";
import type { BetterMeData } from "@/types";
import { useTracker } from "../hooks/use-tracker";
import { TrackerStoreProvider } from "./tracker-store";

describe("TrackerStoreProvider", () => {
  it("hydrates from an adapter and serializes optimistic saves", async () => {
    const adapter = new MemoryStorageAdapter(data());
    render(<TrackerStoreProvider adapter={adapter} now={new Date("2026-01-02T12:00:00Z")}><Probe /></TrackerStoreProvider>);
    await screen.findByText("ready");
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(async () => expect((await adapter.load())?.habitEntries[0].habitCompletions.h1).toBe(true));
    expect(screen.getByTestId("status").textContent).toBe("Good");
  });

  it("hydrates once when using the default clock", async () => {
    const adapter = new CountingMemoryStorageAdapter(data());
    render(<TrackerStoreProvider adapter={adapter}><Probe /></TrackerStoreProvider>);

    await screen.findByText("ready");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(adapter.loadCount).toBe(1);
  });
});

class CountingMemoryStorageAdapter extends MemoryStorageAdapter {
  loadCount = 0;

  override async load() {
    this.loadCount += 1;
    return super.load();
  }
}

function Probe() {
  const tracker = useTracker();
  if (!tracker.state.hydrated) return <p>loading</p>;
  return <><p>ready</p><p data-testid="status">{tracker.records.find((record) => record.date === "2026-01-02")?.status}</p><button onClick={() => tracker.toggleHabit("2026-01-02", "h1")}>toggle</button></>;
}

function data(): BetterMeData {
  return { schemaVersion: 1, habits: [{ id: "h1", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" }], habitEntries: [], reflections: [], settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-02", trackerDays: 7, targetCompletionRate: 1, themeId: "cute-cat" }, updatedAt: "x" };
}
