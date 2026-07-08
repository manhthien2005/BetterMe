import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInitialCompanionState,
  createInitialDashboardState,
  type CompanionPetState,
  type DashboardState
} from "@/components/dashboard/dashboard-data";

import { createSyncEngine, loadLastSyncedAt, type SyncEngineOptions } from "./engine";
import { runSyncOnboarding } from "./importer";
import { loadQueue, saveQueue } from "./queue";
import { getCellStamp } from "./shadow";
import type {
  CompanionSyncPayload,
  PushMutationsResult,
  ServerSnapshot,
  SyncMutation,
  SyncStatus
} from "./types";

const T1 = "2026-07-04T09:00:00.000Z";
const NOW = "2026-07-04T10:00:00.000Z";
/** Server clock at snapshot/merge time — deliberately ≠ NOW (client clock). */
const SERVER_NOW = "2026-07-04T09:58:00.000Z";

function makeState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    habits: [
      {
        id: "english",
        key: "english",
        name: "Học tiếng Anh",
        category: "Learning",
        maxScore: 1,
        description: "",
        iconName: "BookOpen"
      }
    ],
    records: {},
    events: [],
    bestStreakFloor: 26,
    seedCutoverDate: "2026-06-01",
    deletedHabits: [],
    companion: createInitialCompanionState(),
    ...overrides
  };
}

function makePet(overrides: Partial<CompanionPetState> = {}): CompanionPetState {
  return {
    species: "dog",
    name: "Xoài",
    adoptedOn: "2026-06-10",
    growthDays: 5,
    bond: 40,
    lastGrowthDate: null,
    petsToday: 0,
    petsTodayDate: null,
    nameUpdatedAt: T1,
    ...overrides
  };
}

function setLog(habitKey: string, date: string, done = true): SyncMutation {
  return { kind: "setHabitLog", habitKey, date, done, clientTs: T1 };
}

type Harness = {
  engine: ReturnType<typeof createSyncEngine>;
  state: () => DashboardState;
  pushCalls: Array<{ mutations: SyncMutation[]; payload: CompanionSyncPayload | null }>;
  statuses: SyncStatus[];
  setPush: (fn: (mutations: SyncMutation[]) => PushMutationsResult) => void;
  setSnapshot: (snapshot: ServerSnapshot) => void;
};

function setup(
  initial: DashboardState = makeState(),
  overrides: Partial<Pick<SyncEngineOptions, "now">> = {}
): Harness {
  let state = initial;
  const pushCalls: Harness["pushCalls"] = [];
  const statuses: SyncStatus[] = [];
  let pushImpl: (mutations: SyncMutation[]) => PushMutationsResult = (mutations) => ({
    ok: true,
    outcomes: mutations.map(() => ({ status: "applied" as const })),
    companion: null
  });
  let snapshot: ServerSnapshot = { habits: [], logs: [], companion: null };

  const options: SyncEngineOptions = {
    getState: () => state,
    applyMerged: (next) => {
      state = next;
    },
    push: async (mutations, payload) => {
      pushCalls.push({ mutations, payload });
      return pushImpl(mutations);
    },
    fetchSnapshot: async () => ({ ok: true, snapshot }),
    onStatus: (status) => statuses.push(status),
    now: () => NOW,
    debounceMs: 2_000,
    backoffMs: [2_000, 8_000, 30_000],
    ...overrides
  };

  return {
    engine: createSyncEngine(options),
    state: () => state,
    pushCalls,
    statuses,
    setPush: (fn) => {
      pushImpl = fn;
    },
    setSnapshot: (next) => {
      snapshot = next;
    }
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("sync engine — markDirty + debounce", () => {
  it("enqueues, stamps the shadow cell, and flushes after ~2s", async () => {
    const h = setup();

    h.engine.markDirty(setLog("english", "2026-07-03"));

    expect(loadQueue()).toHaveLength(1);
    expect(getCellStamp("2026-07-03", "english")).toBe(T1);
    expect(h.pushCalls).toHaveLength(0); // debounced, not immediate

    await vi.advanceTimersByTimeAsync(2_000);

    expect(h.pushCalls).toHaveLength(1);
    expect(loadQueue()).toHaveLength(0);
    expect(h.engine.getStatus()).toBe("idle");

    h.engine.dispose();
  });

  it("NEVER uploads a cell with date <= seedCutoverDate, but still protects it locally", async () => {
    const h = setup(makeState({ seedCutoverDate: "2026-07-01" }));

    h.engine.markDirty(setLog("english", "2026-07-01")); // == cutover: seed fiction
    h.engine.markDirty(setLog("english", "2026-05-20")); // before cutover

    expect(loadQueue()).toHaveLength(0);
    expect(getCellStamp("2026-07-01", "english")).toBe(T1); // still LWW-protected

    await vi.advanceTimersByTimeAsync(10_000);
    expect(h.pushCalls).toHaveLength(0);

    h.engine.dispose();
  });
});

describe("sync engine — queue error policy (no head-of-line blocking)", () => {
  it("drops permanent errors, applies the rest, and finishes idle", async () => {
    const h = setup();

    saveQueue([setLog("ghost", "2026-07-03"), setLog("english", "2026-07-03")]);
    h.setPush((mutations) => ({
      ok: true,
      outcomes: mutations.map((m) =>
        m.kind === "setHabitLog" && m.habitKey === "ghost"
          ? { status: "permanent-error" as const, code: "P0002", message: "habit-not-found" }
          : { status: "applied" as const }
      ),
      companion: null
    }));

    await h.engine.flush();

    expect(h.pushCalls[0].mutations).toHaveLength(2);
    expect(loadQueue()).toHaveLength(0); // ghost dropped, english applied — nothing stuck
    expect(h.engine.getStatus()).toBe("idle");
    expect(console.warn).toHaveBeenCalled();

    h.engine.dispose();
  });

  it("keeps retryable mutations and retries with backoff (2s, then 8s)", async () => {
    const h = setup();

    saveQueue([setLog("english", "2026-07-03")]);
    h.setPush((mutations) => ({
      ok: true,
      outcomes: mutations.map(() => ({ status: "retry" as const, message: "network" })),
      companion: null
    }));

    await h.engine.flush();

    expect(loadQueue()).toHaveLength(1);
    expect(h.engine.getStatus()).toBe("error");
    expect(h.pushCalls).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(2_000); // first backoff step
    expect(h.pushCalls).toHaveLength(2);

    // Next failure schedules the 8s step; success then drains the queue.
    h.setPush((mutations) => ({
      ok: true,
      outcomes: mutations.map(() => ({ status: "applied" as const })),
      companion: null
    }));
    await vi.advanceTimersByTimeAsync(8_000);

    expect(h.pushCalls).toHaveLength(3);
    expect(loadQueue()).toHaveLength(0);
    expect(h.engine.getStatus()).toBe("idle");

    h.engine.dispose();
  });

  it("goes disabled (queue intact) when there is no session — dev bypass stays quiet", async () => {
    const h = setup();

    saveQueue([setLog("english", "2026-07-03")]);
    h.setPush(() => ({ ok: false, reason: "no-session" }));

    await h.engine.flush();

    expect(h.engine.getStatus()).toBe("disabled");
    expect(loadQueue()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.pushCalls).toHaveLength(1); // no retry hammering

    h.engine.dispose();
  });
});

describe("sync engine — slug collision re-key", () => {
  it("re-keys state + queue on rekey-needed, then re-pushes under the new key", async () => {
    const h = setup(
      makeState({
        habits: [
          {
            id: "custom_doc_sach",
            key: "custom_doc_sach",
            name: "Đọc sách",
            category: "Learning",
            maxScore: 1,
            description: "",
            iconName: "BookOpen"
          }
        ],
        records: {
          "2026-07-03": { date: "2026-07-03", completions: { custom_doc_sach: true } }
        }
      })
    );
    const create: SyncMutation = {
      kind: "upsertHabit",
      habit: {
        key: "custom_doc_sach",
        name: "Đọc sách",
        category: "Learning",
        maxScore: 1,
        active: true,
        description: "",
        sortOrder: 0
      },
      clientTs: T1,
      expectCreate: true
    };

    saveQueue([create, setLog("custom_doc_sach", "2026-07-03")]);

    let first = true;

    h.setPush((mutations) => {
      if (first) {
        first = false;
        return {
          ok: true,
          outcomes: mutations.map((m) =>
            m.kind === "upsertHabit"
              ? {
                  status: "rekey-needed" as const,
                  server: { key: "custom_doc_sach", name: "Đọc sách báo" }
                }
              : { status: "retry" as const, message: "deferred-behind-failed-upsert" }
          ),
          companion: null
        };
      }

      return {
        ok: true,
        outcomes: mutations.map(() => ({ status: "applied" as const })),
        companion: null
      };
    });

    await h.engine.flush();

    // Local state re-keyed (records included), queue rewritten.
    expect(h.state().habits[0].id).toBe("custom_doc_sach_2");
    expect(h.state().records["2026-07-03"].completions).toEqual({ custom_doc_sach_2: true });

    const queued = loadQueue();

    expect(queued).toHaveLength(2);
    expect(JSON.stringify(queued)).not.toContain('"custom_doc_sach"');

    // The rewritten mutations go out on the next (scheduled) pass.
    await vi.advanceTimersByTimeAsync(2_000);

    expect(h.pushCalls).toHaveLength(2);
    const secondBatch = h.pushCalls[1].mutations;

    expect(
      secondBatch.some((m) => m.kind === "upsertHabit" && m.habit.key === "custom_doc_sach_2")
    ).toBe(true);
    expect(loadQueue()).toHaveLength(0);
    expect(h.engine.getStatus()).toBe("idle");

    h.engine.dispose();
  });
});

describe("sync engine — hydrate", () => {
  it("merges the server snapshot, persists lastSyncedAt, and pushes local-ahead companion state", async () => {
    const h = setup(
      makeState({
        companion: {
          ...createInitialCompanionState(),
          pets: { dog: makePet() },
          activeSpecies: "dog",
          activeSpeciesUpdatedAt: T1
        }
      })
    );

    h.setSnapshot({
      habits: [
        {
          key: "english",
          name: "Học tiếng Anh",
          category: "Learning",
          maxScore: 1,
          active: true,
          description: "",
          sortOrder: 0,
          clientUpdatedAt: null,
          deletedAt: null
        }
      ],
      logs: [{ habitKey: "english", date: "2026-07-02", done: true, mutatedAt: T1 }],
      companion: null, // server has never seen a companion — local is ahead
      serverTime: SERVER_NOW
    });

    await h.engine.hydrate();

    // Server log merged in and stamped.
    expect(h.state().records["2026-07-02"].completions.english).toBe(true);
    expect(getCellStamp("2026-07-02", "english")).toBe(T1);
    // The watermark is the SERVER's clock, not the client's now().
    expect(loadLastSyncedAt()).toBe(SERVER_NOW);

    // Local companion was ahead → a snapshot was enqueued and flushed with a payload.
    expect(h.pushCalls).toHaveLength(1);
    expect(h.pushCalls[0].payload?.pets.dog?.name).toBe("Xoài");
    expect(h.pushCalls[0].payload?.lastSyncedAt).toBe(SERVER_NOW);
    expect(loadQueue()).toHaveLength(0);
    expect(h.engine.getStatus()).toBe("idle");

    h.engine.dispose();
  });

  it("goes disabled without touching local state when there is no session", async () => {
    let applied = 0;
    const base = makeState();
    const engine = createSyncEngine({
      getState: () => base,
      applyMerged: () => {
        applied += 1;
      },
      push: async () => ({ ok: false, reason: "no-session" }),
      fetchSnapshot: async () => ({ ok: false, reason: "no-session" }),
      now: () => NOW
    });

    await engine.hydrate();

    expect(engine.getStatus()).toBe("disabled");
    expect(applied).toBe(0);
    expect(loadLastSyncedAt()).toBeNull();

    engine.dispose();
  });

  it("adopts the companion state returned by a push (ledgers wholesale)", async () => {
    const h = setup(
      makeState({
        companion: {
          ...createInitialCompanionState(),
          pets: { dog: makePet({ bond: 10 }) },
          activeSpecies: "dog",
          activeSpeciesUpdatedAt: T1,
          foodGrantedByDate: { "2026-07-03": 2 }
        }
      })
    );

    saveQueue([{ kind: "companionSnapshot", clientTs: T1 }]);
    h.setPush(() => ({
      ok: true,
      outcomes: [{ status: "applied" as const }],
      serverTime: SERVER_NOW,
      companion: {
        activeSpecies: "dog",
        activeSpeciesUpdatedAt: T1,
        foodGrantedByDate: { "2026-07-03": 2 },
        foodGiftsReceived: {},
        foodSpentEvents: { "2026-07-03": ["remote-spend"] },
        foodCarryover: 0,
        giftOverflowBondByDate: {},
        allDoneBonusDates: {},
        lastSeenDate: null,
        pendingGift: false,
        pets: {
          dog: {
            name: "Xoài",
            nameUpdatedAt: T1,
            adoptedOn: "2026-06-10",
            growthDays: 5,
            bond: 25,
            lastGrowthDate: null,
            petsToday: 0,
            petsTodayDate: null,
            resetAt: null
          }
        }
      }
    }));

    await h.engine.flush();

    const companion = h.state().companion;

    expect(companion.foodSpentEvents["2026-07-03"]).toEqual(["remote-spend"]);
    expect(companion.food).toBe(1); // 2 granted − 1 spend, derived after adoption
    expect(companion.pets.dog?.bond).toBe(25); // server max won
    expect(loadLastSyncedAt()).toBe(SERVER_NOW); // server clock, not client now()

    h.engine.dispose();
  });

  it("falls back to the client clock when the server sends no serverTime (old schema)", async () => {
    const h = setup();

    h.setSnapshot({ habits: [], logs: [], companion: null });

    await h.engine.hydrate();

    expect(loadLastSyncedAt()).toBe(NOW);

    h.engine.dispose();
  });
});

describe("sync onboarding — hydrate BEFORE the initial upload (spec §2.5)", () => {
  /**
   * Regression: a returning user's NEW device seeds all default habits, then
   * opts into sync. The old flow uploaded the fresh seed state before
   * hydrating — re-CREATEing habits the user had deleted on the server (the
   * tombstoned "english" here) and re-seeding defaults into the cloud.
   */
  it("never uploads a habit the server has tombstoned", async () => {
    const TODAY = "2026-07-04";
    const seedState = createInitialDashboardState(TODAY); // all 7 DEFAULT_HABITS, incl. "english"
    const h = setup(seedState);

    expect(seedState.habits.some((habit) => habit.id === "english")).toBe(true);

    h.setSnapshot({
      habits: [
        {
          key: "english",
          name: "Study English",
          category: "Learning",
          maxScore: 1,
          active: true,
          description: "",
          sortOrder: 0,
          clientUpdatedAt: T1,
          deletedAt: T1 // the user deleted this habit on another device
        },
        {
          key: "wake_up",
          name: "Wake up on time",
          category: "Discipline",
          maxScore: 1,
          active: true,
          description: "",
          sortOrder: 1,
          clientUpdatedAt: T1,
          deletedAt: null
        }
      ],
      logs: [],
      companion: null,
      serverTime: SERVER_NOW
    });

    await runSyncOnboarding(h.engine, h.state, "fresh", TODAY, NOW);

    // The tombstone merged in first — "english" is gone locally...
    expect(h.state().habits.some((habit) => habit.id === "english")).toBe(false);
    expect(h.state().deletedHabits.some((t) => t.key === "english")).toBe(true);

    // ...and nothing pushed ever re-creates it (or logs against it).
    const pushed = h.pushCalls.flatMap((call) => call.mutations);

    expect(pushed.length).toBeGreaterThan(0); // the surviving defaults still upload
    expect(
      pushed.some((m) => m.kind === "upsertHabit" && m.habit.key === "english")
    ).toBe(false);
    expect(
      pushed.some((m) => m.kind === "setHabitLog" && m.habitKey === "english")
    ).toBe(false);
    expect(loadQueue()).toHaveLength(0);
    expect(h.engine.getStatus()).toBe("idle");

    h.engine.dispose();
  });
});

describe("sync engine — reset supremacy vs clock skew (server-clock watermark)", () => {
  /**
   * Regression: the client clock runs +10min ahead of the server. A reset
   * lands on the server BETWEEN two hydrates (by real/server time). With a
   * client-stamped lastSyncedAt the reset looked older than the watermark and
   * the stale device's max() resurrected pre-reset growth/bond — permanently.
   * The server-provided serverTime watermark keeps resetAt > lastSyncedAt.
   */
  it("does not resurrect a reset pet when the client clock is 10min ahead", async () => {
    const skewedNow = "2026-07-04T10:10:00.000Z"; // client clock, +10min vs server
    const firstServerTime = "2026-07-04T10:00:00.000Z";
    const resetAt = "2026-07-04T10:05:00.000Z"; // between the two syncs (server clock)
    const secondServerTime = "2026-07-04T10:09:00.000Z";
    const h = setup(
      makeState({
        companion: {
          ...createInitialCompanionState(),
          pets: { dog: makePet({ growthDays: 5, bond: 40 }) },
          activeSpecies: "dog",
          activeSpeciesUpdatedAt: T1
        }
      }),
      { now: () => skewedNow }
    );
    const serverDog = {
      name: "Xoài",
      nameUpdatedAt: T1,
      adoptedOn: "2026-06-10",
      growthDays: 5,
      bond: 40,
      lastGrowthDate: null,
      petsToday: 0,
      petsTodayDate: null,
      resetAt: null
    };
    const companionBase = {
      activeSpecies: "dog" as const,
      activeSpeciesUpdatedAt: T1,
      foodGrantedByDate: {},
      foodGiftsReceived: {},
      foodSpentEvents: {},
      foodCarryover: 0,
      giftOverflowBondByDate: {},
      allDoneBonusDates: {},
      lastSeenDate: null,
      pendingGift: false
    };

    // First hydrate: pre-reset server state, watermark = firstServerTime.
    h.setSnapshot({
      habits: [],
      logs: [],
      companion: { ...companionBase, pets: { dog: serverDog } },
      serverTime: firstServerTime
    });
    await h.engine.hydrate();

    expect(loadLastSyncedAt()).toBe(firstServerTime);

    // Reset happens on the server, then the stale device hydrates again.
    h.setSnapshot({
      habits: [],
      logs: [],
      companion: {
        ...companionBase,
        pets: { dog: { ...serverDog, growthDays: 0, bond: 0, resetAt } }
      },
      serverTime: secondServerTime
    });
    await h.engine.hydrate();

    // resetAt (10:05) > lastSyncedAt (10:00): reset wins wholesale — the
    // local pre-reset 5/40 must NOT survive the merge.
    expect(h.state().companion.pets.dog?.growthDays).toBe(0);
    expect(h.state().companion.pets.dog?.bond).toBe(0);

    h.engine.dispose();
  });
});
