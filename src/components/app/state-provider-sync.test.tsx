import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider, useAppState } from "@/components/app/state-provider";
import {
  createHabitInState,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";
import { SYNC_OPT_IN_STORAGE_KEY } from "@/components/dashboard/sync-onboarding";
import type { SyncMutation } from "@/lib/sync/types";

/**
 * The provider only mints sync mutations once the engine exists, and the
 * engine only exists with a real Supabase session — so these tests stand a
 * session up and swap the engine for a recorder. Everything between the button
 * press and `markDirty` is the real code path.
 */

const mocks = vi.hoisted(() => ({
  mutations: [] as SyncMutation[],
  getPendingGardenVisits: vi.fn(async () => ({ ok: false as const, reason: "no-session" }))
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: "u1" } } } }) }
  })
}));

vi.mock("@/lib/sync/engine", () => ({
  createSyncEngine: () => ({
    markDirty: (mutation: SyncMutation) => mocks.mutations.push(mutation),
    flush: async () => {},
    hydrate: async () => {},
    getStatus: () => "idle" as const,
    dispose: () => {}
  })
}));

vi.mock("@/lib/server/social-actions", () => ({
  ackGardenVisits: vi.fn(async () => ({ ok: false as const, reason: "no-session" })),
  bumpSharedRhythms: vi.fn(async () => ({ ok: false as const, reason: "no-session" })),
  getPendingGardenVisits: mocks.getPendingGardenVisits,
  refreshMySummary: vi.fn(async () => ({ ok: false as const, reason: "no-session" }))
}));

const TODAY = getDashboardToday();

/** A count habit with room to make partial progress in. */
function seedWaterHabit() {
  const state = createHabitInState(createInitialDashboardState(TODAY), {
    name: "Uống nước",
    category: "Discipline",
    icon: "💧",
    trackingType: "count",
    target: 8,
    unit: "ly",
    steps: [],
    repeatDays: [1, 2, 3, 4, 5, 6, 7],
    timesOfDay: ["anytime"],
    scheduledAt: null,
    color: "sky",
    motivation: ""
  });
  const water = state.habits[state.habits.length - 1];

  window.localStorage.setItem("betterme.dashboard.v3", JSON.stringify(state));

  return water.id;
}

function Probe({ habitId }: { habitId: string }) {
  const app = useAppState();

  return (
    <div>
      <span data-testid="ready">{app.syncStatus}</span>
      <button onClick={() => app.adjustHabitEntry(habitId, 1)} type="button">
        add-one
      </button>
      <button onClick={() => app.pauseHabit(habitId, true)} type="button">
        pause
      </button>
      <button onClick={() => app.archiveHabit(habitId, true)} type="button">
        archive
      </button>
      <button onClick={() => app.moveHabit(habitId, -1)} type="button">
        move-up
      </button>
    </div>
  );
}

async function renderWithSync(habitId: string) {
  render(
    <StateProvider userEmail="thien@example.com">
      <Probe habitId={habitId} />
    </StateProvider>
  );

  // Let the sync bootstrap effect's awaited session check settle.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(screen.getByTestId("ready")).toBeTruthy();
}

function logMutations() {
  return mocks.mutations.filter((mutation) => mutation.kind === "setHabitLog");
}

function upsertMutations() {
  return mocks.mutations.filter((mutation) => mutation.kind === "upsertHabit");
}

beforeEach(() => {
  window.localStorage.clear();
  mocks.mutations.length = 0;
  window.localStorage.setItem(SYNC_OPT_IN_STORAGE_KEY, "fresh");
});

describe("partial progress reaches the cloud (U1c)", () => {
  it("one glass short of the target still enqueues the reading", async () => {
    // Before U1c the guard was "did the day's completed count change?", so
    // 0 -> 1 glass of an eight-glass goal enqueued nothing at all and that
    // reading never left the device.
    const habitId = seedWaterHabit();

    await renderWithSync(habitId);
    fireEvent.click(screen.getByText("add-one"));

    const logs = logMutations();

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ habitKey: habitId, date: TODAY, done: false, value: 1 });
  });

  it("every further glass pushes the new reading, not just the last one", async () => {
    const habitId = seedWaterHabit();

    await renderWithSync(habitId);
    fireEvent.click(screen.getByText("add-one"));
    fireEvent.click(screen.getByText("add-one"));
    fireEvent.click(screen.getByText("add-one"));

    expect(logMutations().map((mutation) => mutation.value)).toEqual([1, 2, 3]);
  });
});

describe("a habit's lifecycle reaches the cloud (U1c)", () => {
  it("pausing pushes the pause, so the other device stops showing it too", async () => {
    const habitId = seedWaterHabit();

    await renderWithSync(habitId);
    fireEvent.click(screen.getByText("pause"));

    const upserts = upsertMutations();

    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({ habit: { key: habitId, pausedAt: TODAY } });
    // An edit, never a create: arming collision detection on a rename would
    // read the server's own row as a rival habit.
    expect(upserts[0]).not.toHaveProperty("expectCreate");
  });

  it("archiving pushes archivedAt and flips the legacy active flag", async () => {
    const habitId = seedWaterHabit();

    await renderWithSync(habitId);
    fireEvent.click(screen.getByText("archive"));

    expect(upsertMutations()[0]).toMatchObject({
      habit: { key: habitId, archivedAt: TODAY, active: false }
    });
  });

  it("reordering pushes BOTH habits that swapped places", async () => {
    // Sending only the one the user grabbed would leave its neighbour holding
    // the same sort_order on the server.
    const habitId = seedWaterHabit();

    await renderWithSync(habitId);
    fireEvent.click(screen.getByText("move-up"));

    const upserts = upsertMutations();

    expect(upserts).toHaveLength(2);
    expect(new Set(upserts.map((mutation) => mutation.habit.sortOrder)).size).toBe(2);
  });
});
