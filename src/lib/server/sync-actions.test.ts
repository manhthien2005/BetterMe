import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSyncSnapshot, pushMutations } from "@/lib/server/sync-actions";
import type { SyncHabitPayload } from "@/lib/sync/types";

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: supabaseMocks.getUser },
    rpc: supabaseMocks.rpc
  }))
}));

const HABIT: SyncHabitPayload = {
  key: "read",
  name: "Đọc sách",
  category: "Growth",
  maxScore: 1,
  active: true,
  description: "",
  sortOrder: 0,
  icon: "📚",
  trackingType: "duration",
  target: 20,
  unit: null,
  steps: [],
  repeatDays: [2, 4, 6],
  timesOfDay: ["evening"],
  scheduledAt: "21:00",
  color: "dusk",
  motivation: "Mỗi tối một chương",
  pausedAt: null,
  archivedAt: null
};

const CLIENT_TS = "2026-07-27T14:40:00.000Z";

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMocks.getUser.mockResolvedValue({
    data: { user: { id: "11111111-0000-4000-8000-000000000000" } },
    error: null
  });
  supabaseMocks.rpc.mockResolvedValue({ data: { status: "updated" }, error: null });
});

describe("pushMutations sends the v3 payload", () => {
  it("a log mutation carries value and completedAt", async () => {
    await pushMutations(
      [
        {
          kind: "setHabitLog",
          habitKey: "water",
          date: "2026-07-27",
          done: true,
          value: 8,
          completedAt: "21:40",
          clientTs: CLIENT_TS
        }
      ],
      null
    );

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("apply_habit_log", {
      p_habit_key: "water",
      p_date: "2026-07-27",
      p_done: true,
      p_mutated_at: CLIENT_TS,
      p_value: 8,
      p_completed_at: "21:40"
    });
  });

  it("a mutation minted before U1c sends explicit nulls", async () => {
    await pushMutations(
      [
        {
          kind: "setHabitLog",
          habitKey: "water",
          date: "2026-07-27",
          done: true,
          clientTs: CLIENT_TS
        }
      ],
      null
    );

    expect(supabaseMocks.rpc).toHaveBeenCalledWith(
      "apply_habit_log",
      expect.objectContaining({ p_value: null, p_completed_at: null })
    );
  });

  it("an upsert carries every v3 definition field", async () => {
    await pushMutations([{ kind: "upsertHabit", habit: HABIT, clientTs: CLIENT_TS }], null);

    expect(supabaseMocks.rpc).toHaveBeenCalledWith(
      "upsert_habit",
      expect.objectContaining({
        p_icon: "📚",
        p_tracking_type: "duration",
        p_target: 20,
        p_unit: null,
        p_steps: [],
        p_repeat_days: [2, 4, 6],
        p_times_of_day: ["evening"],
        p_scheduled_at: "21:00",
        p_color: "dusk",
        p_motivation: "Mỗi tối một chương",
        p_paused_at: null,
        p_archived_at: null
      })
    );
  });
});

describe("a server still on the old schema", () => {
  it("PGRST202 retries instead of dropping the mutation", async () => {
    // The app can ship before the owner applies schema.sql. Dropping here
    // would lose the write for good; retrying self-heals the moment the SQL
    // lands.
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST202", message: "Could not find the function" }
    });

    const result = await pushMutations(
      [
        {
          kind: "setHabitLog",
          habitKey: "water",
          date: "2026-07-27",
          done: true,
          value: 8,
          clientTs: CLIENT_TS
        }
      ],
      null
    );

    expect(result).toMatchObject({ ok: true, outcomes: [{ status: "retry" }] });
  });
});

describe("fetchSyncSnapshot parses the v3 columns", () => {
  it("reads value, completedAt and the habit definition", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        habits: [
          {
            key: "read",
            name: "Đọc sách",
            category: "Growth",
            maxScore: 1,
            active: true,
            description: "",
            sortOrder: 0,
            clientUpdatedAt: null,
            deletedAt: null,
            icon: "📚",
            trackingType: "duration",
            target: 20,
            unit: null,
            steps: [],
            repeatDays: [2, 4, 6],
            timesOfDay: ["evening"],
            scheduledAt: "21:00",
            color: "dusk",
            motivation: "Mỗi tối một chương",
            pausedAt: null,
            archivedAt: null
          }
        ],
        logs: [
          {
            habitKey: "read",
            date: "2026-07-27",
            done: true,
            mutatedAt: CLIENT_TS,
            value: 20,
            completedAt: "21:40"
          }
        ],
        companion: null,
        serverTime: "2026-07-27T15:00:00.000Z"
      },
      error: null
    });

    const result = await fetchSyncSnapshot();

    if (!result.ok) throw new Error(`expected a snapshot, got ${result.reason}`);

    expect(result.snapshot.habits[0]).toMatchObject({
      trackingType: "duration",
      target: 20,
      repeatDays: [2, 4, 6],
      timesOfDay: ["evening"],
      scheduledAt: "21:00",
      color: "dusk",
      icon: "📚"
    });
    expect(result.snapshot.logs[0]).toMatchObject({ value: 20, completedAt: "21:40" });
  });

  it("an old snapshot without the v3 columns still parses, with safe defaults", async () => {
    // Not hypothetical: the deployed schema lags the deployed app.
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        habits: [
          {
            key: "read",
            name: "Đọc sách",
            category: "Growth",
            maxScore: 1,
            active: true,
            description: "",
            sortOrder: 0,
            clientUpdatedAt: null,
            deletedAt: null
          }
        ],
        logs: [{ habitKey: "read", date: "2026-07-27", done: true, mutatedAt: CLIENT_TS }],
        companion: null
      },
      error: null
    });

    const result = await fetchSyncSnapshot();

    if (!result.ok) throw new Error(`expected a snapshot, got ${result.reason}`);

    expect(result.snapshot.habits[0].trackingType).toBe("check");
    expect(result.snapshot.habits[0].repeatDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.snapshot.habits[0].timesOfDay).toEqual(["anytime"]);
    expect(result.snapshot.logs[0].value).toBeNull();
    expect(result.snapshot.logs[0].completedAt).toBeNull();
  });
});
