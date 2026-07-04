import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BetterMeData, DailyRecord, MotivationMessage } from "@/types";
import { MemoryStorageAdapter } from "../../lib/storage/memory-storage-adapter";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { DashboardOverview, selectMotivationMessage } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("renders local tracker metrics, motivation, quest preview, and chart previews", async () => {
    render(
      <TrackerStoreProvider adapter={new MemoryStorageAdapter(data())} now={new Date("2026-01-03T12:00:00Z")}>
        <DashboardOverview />
      </TrackerStoreProvider>
    );

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByText("Today progress")).toBeTruthy();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByText("Week average")).toBeTruthy();
    expect(screen.getByText("Missed habits")).toBeTruthy();
    expect(screen.getByText("1 missed")).toBeTruthy();
    expect(screen.getByText("Current streak")).toBeTruthy();
    expect(screen.getByText("Keep the promise tiny; tiny promises compound.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /30-day progress/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Selected-week habits/i })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Weekly quest preview" })).toBeTruthy();
  });

  it("selects an active motivation message for the record status", () => {
    const message = selectMotivationMessage(messages, record("Okay"), "2026-01-03");

    expect(message.body).toBe("Steady is a strategy.");
  });
});

const messages: readonly MotivationMessage[] = [
  { id: "bad", body: "Reset gently.", tone: "gentle", applicableStatuses: ["Bad"], active: true, weight: 1 },
  { id: "okay", body: "Steady is a strategy.", tone: "focused", applicableStatuses: ["Okay"], active: true, weight: 1 }
];

function record(status: DailyRecord["status"]): DailyRecord {
  return {
    date: "2026-01-03",
    weekStart: "2025-12-29",
    dayLabel: "Sat",
    habitCompletions: {},
    reflection: null,
    streak: 0,
    totalScore: 1,
    maxScore: 2,
    completionRate: 0.5,
    status,
    missedHabitKeys: ["move"],
    missedHabitNames: ["Move"]
  };
}

function data(): BetterMeData {
  return {
    schemaVersion: 1,
    habits: [
      { id: "study", key: "study", name: "Study", category: "growth", maxScore: 1, active: true, description: "", sortOrder: 0, createdAt: "x", updatedAt: "x" },
      { id: "move", key: "move", name: "Move", category: "health", maxScore: 1, active: true, description: "", sortOrder: 1, createdAt: "x", updatedAt: "x" }
    ],
    habitEntries: [
      { date: "2026-01-01", habitCompletions: { study: true, move: true }, updatedAt: "x" },
      { date: "2026-01-02", habitCompletions: { study: false, move: false }, updatedAt: "x" },
      { date: "2026-01-03", habitCompletions: { study: true, move: false }, updatedAt: "x" }
    ],
    reflections: [],
    settings: { timezone: "UTC", startDate: "2026-01-01", selectedDate: "2026-01-03", trackerDays: 14, targetCompletionRate: 0.8, themeId: "cute-cat", locale: "en" },
    updatedAt: "x"
  };
}
