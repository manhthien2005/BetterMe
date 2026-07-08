import { describe, expect, it } from "vitest";

import {
  createInitialCompanionState,
  createInitialDashboardState,
  deriveFoodBalance,
  pruneFoodLedgers,
  type CompanionPetState,
  type CompanionState,
  type DashboardHabit,
  type DashboardState
} from "@/components/dashboard/dashboard-data";

import {
  applyCompanionPushResult,
  buildCompanionSyncPayload,
  mergeServerIntoLocal,
  nextAvailableKey
} from "./merge";
import type {
  ServerCompanionPet,
  ServerCompanionState,
  ServerHabit,
  ServerSnapshot,
  ShadowMap,
  SyncMutation
} from "./types";

const T_EARLY = "2026-07-01T09:00:00.000Z";
const T_MID = "2026-07-01T10:00:00.000Z";
const T_MID_PG = "2026-07-01T10:00:00+00:00"; // same instant, Postgres format
const T_LATE = "2026-07-01T11:00:00.000Z";

function makeHabit(id: string, name: string, overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return {
    id,
    key: id,
    name,
    category: "Learning",
    maxScore: 1,
    description: "",
    iconName: "BookOpen",
    ...overrides
  };
}

function makeState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    habits: [makeHabit("english", "Học tiếng Anh")],
    records: {},
    events: [],
    bestStreakFloor: 26,
    seedCutoverDate: "2026-06-01",
    deletedHabits: [],
    companion: createInitialCompanionState(),
    ...overrides
  };
}

function makeServerHabit(key: string, name: string, overrides: Partial<ServerHabit> = {}): ServerHabit {
  return {
    key,
    name,
    category: "Learning",
    maxScore: 1,
    active: true,
    description: "",
    sortOrder: 0,
    clientUpdatedAt: null,
    deletedAt: null,
    ...overrides
  };
}

function makeSnapshot(overrides: Partial<ServerSnapshot> = {}): ServerSnapshot {
  return { habits: [], logs: [], companion: null, ...overrides };
}

function makeLocalPet(overrides: Partial<CompanionPetState> = {}): CompanionPetState {
  return {
    species: "dog",
    name: "Xoài",
    adoptedOn: "2026-06-10",
    growthDays: 5,
    bond: 40,
    lastGrowthDate: null,
    petsToday: 0,
    petsTodayDate: null,
    nameUpdatedAt: null,
    ...overrides
  };
}

function makeServerPet(overrides: Partial<ServerCompanionPet> = {}): ServerCompanionPet {
  return {
    name: "Xoài",
    nameUpdatedAt: "2026-06-10T00:00:00+00:00",
    adoptedOn: "2026-06-10",
    growthDays: 5,
    bond: 40,
    lastGrowthDate: null,
    petsToday: 0,
    petsTodayDate: null,
    resetAt: null,
    ...overrides
  };
}

function makeServerCompanion(
  overrides: Partial<ServerCompanionState> = {}
): ServerCompanionState {
  return {
    activeSpecies: "dog",
    activeSpeciesUpdatedAt: "2026-06-10T00:00:00+00:00",
    foodGrantedByDate: {},
    foodGiftsReceived: {},
    foodSpentEvents: {},
    foodCarryover: 0,
    giftOverflowBondByDate: {},
    allDoneBonusDates: {},
    lastSeenDate: null,
    pendingGift: false,
    pets: { dog: makeServerPet() },
    ...overrides
  };
}

function makeLocalCompanion(overrides: Partial<CompanionState> = {}): CompanionState {
  return {
    ...createInitialCompanionState(),
    pets: { dog: makeLocalPet() },
    activeSpecies: "dog",
    activeSpeciesUpdatedAt: "2026-06-10T00:00:00.000Z",
    ...overrides
  };
}

describe("mergeServerIntoLocal — completions (per-cell LWW)", () => {
  it("propagates an untick from device A to device B that had an older tick", () => {
    const local = makeState({
      records: { "2026-07-01": { date: "2026-07-01", completions: { english: true } } }
    });
    const shadow: ShadowMap = { "2026-07-01": { english: T_EARLY } };
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh")],
      logs: [{ habitKey: "english", date: "2026-07-01", done: false, mutatedAt: T_MID }]
    });

    const result = mergeServerIntoLocal(local, server, shadow, null);

    expect(result.state.records["2026-07-01"].completions.english).toBe(false);
    expect(result.shadowUpdates).toContainEqual({
      date: "2026-07-01",
      habitKey: "english",
      mutatedAt: T_MID
    });
  });

  it("keeps a newer local cell over a stale server write (B does not re-infect)", () => {
    const local = makeState({
      records: { "2026-07-01": { date: "2026-07-01", completions: { english: false } } }
    });
    const shadow: ShadowMap = { "2026-07-01": { english: T_LATE } };
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh")],
      logs: [{ habitKey: "english", date: "2026-07-01", done: true, mutatedAt: T_MID }]
    });

    const result = mergeServerIntoLocal(local, server, shadow, null);

    expect(result.state.records["2026-07-01"].completions.english).toBe(false);
    expect(result.shadowUpdates).toHaveLength(0);
  });

  it("equal timestamps → tick wins (both directions, across ISO formats)", () => {
    const local = makeState({
      records: {
        "2026-07-01": { date: "2026-07-01", completions: { english: false } },
        "2026-07-02": { date: "2026-07-02", completions: { english: true } }
      }
    });
    const shadow: ShadowMap = {
      "2026-07-01": { english: T_MID },
      "2026-07-02": { english: T_MID }
    };
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh")],
      logs: [
        // Postgres offset format vs client Z format: same instant.
        { habitKey: "english", date: "2026-07-01", done: true, mutatedAt: T_MID_PG },
        { habitKey: "english", date: "2026-07-02", done: false, mutatedAt: T_MID_PG }
      ]
    });

    const result = mergeServerIntoLocal(local, server, shadow, null);

    expect(result.state.records["2026-07-01"].completions.english).toBe(true);
    expect(result.state.records["2026-07-02"].completions.english).toBe(true);
  });

  it("adopts server cells with no local stamp and keeps local cells unknown to the server", () => {
    const local = makeState({
      records: { "2026-06-15": { date: "2026-06-15", completions: { english: true } } }
    });
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh")],
      logs: [{ habitKey: "english", date: "2026-07-02", done: true, mutatedAt: T_MID }]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.state.records["2026-07-02"].completions.english).toBe(true);
    expect(result.state.records["2026-06-15"].completions.english).toBe(true);
  });
});

describe("mergeServerIntoLocal — habits (union, LWW, tombstones)", () => {
  it("unions habits by key in both directions", () => {
    const local = makeState({
      habits: [makeHabit("english", "Học tiếng Anh"), makeHabit("custom_local", "Chạy bộ")]
    });
    const server = makeSnapshot({
      habits: [
        makeServerHabit("english", "Học tiếng Anh"),
        makeServerHabit("custom_remote", "Thiền", { sortOrder: 5, category: "Health" })
      ]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);
    const ids = result.state.habits.map((habit) => habit.id);

    expect(ids).toEqual(["english", "custom_local", "custom_remote"]);
    const adopted = result.state.habits.find((habit) => habit.id === "custom_remote");
    expect(adopted?.name).toBe("Thiền");
    expect(adopted?.iconName).toBeTruthy();
  });

  it("applies server habit fields when the server edit is newer than local knowledge", () => {
    const local = makeState();
    const server = makeSnapshot({
      habits: [
        makeServerHabit("english", "Anh văn mỗi ngày", { clientUpdatedAt: T_MID, category: "Discipline" })
      ]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.state.habits[0].name).toBe("Anh văn mỗi ngày");
    expect(result.state.habits[0].category).toBe("Discipline");
  });

  it("keeps local habit fields when a queued local edit is newer (per-field LWW)", () => {
    const local = makeState({ habits: [makeHabit("english", "Tên mới của tôi")] });
    const pending: SyncMutation[] = [
      {
        kind: "upsertHabit",
        habit: {
          key: "english",
          name: "Tên mới của tôi",
          category: "Learning",
          maxScore: 1,
          active: true,
          description: "",
          sortOrder: 0
        },
        clientTs: T_LATE
      }
    ];
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Tên cũ trên mây", { clientUpdatedAt: T_MID })]
    });

    const result = mergeServerIntoLocal(local, server, {}, null, pending);

    expect(result.state.habits[0].name).toBe("Tên mới của tôi");
  });

  it("tombstone beats an older toggle: habit + completions pruned, logs not applied", () => {
    const local = makeState({
      habits: [makeHabit("english", "Học tiếng Anh"), makeHabit("clean", "Dọn bàn")],
      records: {
        "2026-07-01": { date: "2026-07-01", completions: { english: true, clean: true } }
      }
    });
    const shadow: ShadowMap = { "2026-07-01": { english: T_EARLY } };
    const server = makeSnapshot({
      habits: [
        makeServerHabit("english", "Học tiếng Anh", { deletedAt: T_MID }),
        makeServerHabit("clean", "Dọn bàn")
      ],
      logs: [{ habitKey: "english", date: "2026-07-01", done: true, mutatedAt: T_EARLY }]
    });

    const result = mergeServerIntoLocal(local, server, shadow, null);

    expect(result.state.habits.map((habit) => habit.id)).toEqual(["clean"]);
    expect(result.state.records["2026-07-01"].completions).toEqual({ clean: true });
    expect(result.state.deletedHabits).toContainEqual({ key: "english", deletedAt: T_MID });
  });

  it("a local re-create newer than the server tombstone survives", () => {
    const local = makeState({ habits: [makeHabit("english", "Học tiếng Anh")] });
    const pending: SyncMutation[] = [
      {
        kind: "upsertHabit",
        habit: {
          key: "english",
          name: "Học tiếng Anh",
          category: "Learning",
          maxScore: 1,
          active: true,
          description: "",
          sortOrder: 0
        },
        clientTs: T_LATE,
        expectCreate: true
      }
    ];
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh", { deletedAt: T_MID })]
    });

    const result = mergeServerIntoLocal(local, server, {}, null, pending);

    expect(result.state.habits.map((habit) => habit.id)).toEqual(["english"]);
  });

  it("a local tombstone newer than the server row is not resurrected", () => {
    const local = makeState({
      habits: [],
      deletedHabits: [{ key: "english", deletedAt: T_LATE }]
    });
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh", { clientUpdatedAt: T_MID })],
      logs: [{ habitKey: "english", date: "2026-07-01", done: true, mutatedAt: T_MID }]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.state.habits).toHaveLength(0);
    expect(result.state.records["2026-07-01"]).toBeUndefined();
    expect(result.state.deletedHabits).toContainEqual({ key: "english", deletedAt: T_LATE });
  });

  it("a server re-create newer than the local tombstone brings the habit back", () => {
    const local = makeState({
      habits: [],
      deletedHabits: [{ key: "english", deletedAt: T_MID }]
    });
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh", { clientUpdatedAt: T_LATE })]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.state.habits.map((habit) => habit.id)).toEqual(["english"]);
    expect(result.state.deletedHabits).toHaveLength(0);
  });
});

describe("mergeServerIntoLocal — slug collision re-key (spec §2.2)", () => {
  it("re-keys the local pending CREATE instead of merging two different habits", () => {
    const local = makeState({
      habits: [makeHabit("custom_doc_sach", "Đọc sách")],
      records: {
        "2026-07-01": { date: "2026-07-01", completions: { custom_doc_sach: true } }
      }
    });
    const shadow: ShadowMap = { "2026-07-01": { custom_doc_sach: T_LATE } };
    const pending: SyncMutation[] = [
      {
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
        clientTs: T_LATE,
        expectCreate: true
      }
    ];
    const server = makeSnapshot({
      habits: [
        makeServerHabit("custom_doc_sach", "Đọc sách báo", { clientUpdatedAt: T_EARLY })
      ],
      logs: [{ habitKey: "custom_doc_sach", date: "2026-07-01", done: true, mutatedAt: T_EARLY }]
    });

    const result = mergeServerIntoLocal(local, server, shadow, null, pending);

    expect(result.rekeys).toEqual([
      { oldKey: "custom_doc_sach", newKey: "custom_doc_sach_2" }
    ]);

    const mine = result.state.habits.find((habit) => habit.id === "custom_doc_sach_2");
    const theirs = result.state.habits.find((habit) => habit.id === "custom_doc_sach");

    expect(mine?.name).toBe("Đọc sách");
    expect(theirs?.name).toBe("Đọc sách báo");
    // Local tick moved with the re-key; the server's log applied to their habit
    // (no interleaving of the two histories).
    expect(result.state.records["2026-07-01"].completions).toEqual({
      custom_doc_sach_2: true,
      custom_doc_sach: true
    });
  });

  it("does NOT re-key a plain rename (no pending create): server name wins by LWW", () => {
    const local = makeState({ habits: [makeHabit("english", "Tên local")] });
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Tên trên mây", { clientUpdatedAt: T_MID })]
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.rekeys).toHaveLength(0);
    expect(result.state.habits[0].name).toBe("Tên trên mây");
  });

  it("nextAvailableKey skips taken suffixes", () => {
    expect(nextAvailableKey("custom_x", new Set(["custom_x"]))).toBe("custom_x_2");
    expect(nextAvailableKey("custom_x", new Set(["custom_x", "custom_x_2"]))).toBe("custom_x_3");
  });
});

describe("mergeServerIntoLocal — companion (monotonic reward + reset supremacy)", () => {
  it("growth/bond merge as max(local, server) — no decay in either direction", () => {
    const local = makeState({
      companion: makeLocalCompanion({ pets: { dog: makeLocalPet({ bond: 100, growthDays: 10 }) } })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({ pets: { dog: makeServerPet({ bond: 80, growthDays: 12 }) } })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);
    const dog = result.state.companion.pets.dog;

    expect(dog?.bond).toBe(100);
    expect(dog?.growthDays).toBe(12);
    expect(result.companionAheadOfServer).toBe(true); // local bond is ahead → push
  });

  it("reset supremacy: a server reset newer than lastSyncedAt wins wholesale", () => {
    const local = makeState({
      companion: makeLocalCompanion({ pets: { dog: makeLocalPet({ bond: 500, growthDays: 60 }) } })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        pets: {
          dog: makeServerPet({ bond: 0, growthDays: 0, resetAt: T_MID })
        }
      })
    });

    // Client last synced BEFORE the reset → stale values must not resurrect.
    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);

    expect(result.state.companion.pets.dog?.bond).toBe(0);
    expect(result.state.companion.pets.dog?.growthDays).toBe(0);

    // First sync (null lastSyncedAt): any reset wins too.
    const firstSync = mergeServerIntoLocal(local, server, {}, null);

    expect(firstSync.state.companion.pets.dog?.bond).toBe(0);
  });

  it("a reset older than lastSyncedAt merges normally (max)", () => {
    const local = makeState({
      companion: makeLocalCompanion({ pets: { dog: makeLocalPet({ bond: 500 }) } })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        pets: { dog: makeServerPet({ bond: 3, resetAt: T_EARLY }) }
      })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_LATE);

    expect(result.state.companion.pets.dog?.bond).toBe(500);
  });

  it("pet rename offline on B survives A's later sync (per-field LWW by nameUpdatedAt)", () => {
    const local = makeState({
      companion: makeLocalCompanion({
        pets: { dog: makeLocalPet({ name: "Bơ", nameUpdatedAt: T_LATE, bond: 10 }) }
      })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        pets: { dog: makeServerPet({ name: "Xoài", nameUpdatedAt: T_MID, bond: 90 }) }
      })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);
    const dog = result.state.companion.pets.dog;

    expect(dog?.name).toBe("Bơ"); // local rename is newer
    expect(dog?.bond).toBe(90); // reward still merges monotonic

    // Null local stamp = epoch: always loses to a server-stamped name.
    const unstamped = makeState({
      companion: makeLocalCompanion({
        pets: { dog: makeLocalPet({ name: "Bơ", nameUpdatedAt: null }) }
      })
    });
    const lost = mergeServerIntoLocal(unstamped, server, {}, T_EARLY);

    expect(lost.state.companion.pets.dog?.name).toBe("Xoài");
  });

  it("activeSpecies: per-field LWW, null server species never steals", () => {
    const local = makeState({
      companion: makeLocalCompanion({
        pets: { dog: makeLocalPet(), cat: makeLocalPet({ species: "cat", name: "Mochi" }) },
        activeSpecies: "cat",
        activeSpeciesUpdatedAt: T_LATE
      })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({ activeSpecies: "dog", activeSpeciesUpdatedAt: T_MID })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);

    expect(result.state.companion.activeSpecies).toBe("cat");

    const nullServer = makeSnapshot({
      companion: makeServerCompanion({ activeSpecies: null, activeSpeciesUpdatedAt: null })
    });
    const kept = mergeServerIntoLocal(local, nullServer, {}, T_EARLY);

    expect(kept.state.companion.activeSpecies).toBe("cat");
  });
});

describe("mergeServerIntoLocal — food ledgers (spend is never refunded)", () => {
  it("a spend on device A is never refunded by stale device B (union of spend events)", () => {
    // B is stale: it saw the grant but not A's spend, so its cached food is 3.
    const local = makeState({
      companion: makeLocalCompanion({
        food: 3,
        foodGrantedByDate: { "2026-07-01": 3 }
      })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        foodGrantedByDate: { "2026-07-01": 3 },
        foodSpentEvents: { "2026-07-01": ["a-spend-1"] }
      })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);
    const companion = result.state.companion;

    expect(companion.foodSpentEvents["2026-07-01"]).toEqual(["a-spend-1"]);
    expect(companion.food).toBe(2); // derived, not merged — the spend sticks
    expect(deriveFoodBalance(companion)).toBe(2);
  });

  it("two devices feeding offline on the same day → both spend events survive", () => {
    const local = makeState({
      companion: makeLocalCompanion({
        foodGrantedByDate: { "2026-07-01": 4 },
        foodSpentEvents: { "2026-07-01": ["local-spend"] }
      })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        foodGrantedByDate: { "2026-07-01": 4 },
        foodSpentEvents: { "2026-07-01": ["remote-spend"] }
      })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);
    const companion = result.state.companion;

    expect([...companion.foodSpentEvents["2026-07-01"]].sort()).toEqual([
      "local-spend",
      "remote-spend"
    ]);
    expect(companion.food).toBe(2); // 4 granted − 2 distinct spends
  });

  it("gift and grant ledgers union with max values; carryover takes the max", () => {
    const local = makeState({
      companion: makeLocalCompanion({
        foodGrantedByDate: { "2026-07-01": 2 },
        foodGiftsReceived: { "2026-07-01:comeback": 3 },
        foodCarryover: 1
      })
    });
    const server = makeSnapshot({
      companion: makeServerCompanion({
        foodGrantedByDate: { "2026-07-01": 3, "2026-06-30": 1 },
        foodCarryover: 2
      })
    });

    const companion = mergeServerIntoLocal(local, server, {}, T_EARLY).state.companion;

    expect(companion.foodGrantedByDate).toEqual({ "2026-07-01": 3, "2026-06-30": 1 });
    expect(companion.foodGiftsReceived).toEqual({ "2026-07-01:comeback": 3 });
    expect(companion.foodCarryover).toBe(2);
  });

  it("pair-wise pruning preserves the derived balance", () => {
    const today = "2026-07-04";
    const oldDay = "2026-05-01"; // > 30 days ago
    const state = makeState({
      companion: makeLocalCompanion({
        foodGrantedByDate: { [oldDay]: 5, "2026-07-01": 2 },
        foodSpentEvents: { [oldDay]: ["s1", "s2"] },
        foodCarryover: 1
      })
    });
    const before = deriveFoodBalance(state.companion);
    const pruned = pruneFoodLedgers(state, today);

    expect(pruned.companion.foodGrantedByDate[oldDay]).toBeUndefined();
    expect(deriveFoodBalance(pruned.companion)).toBe(before);
  });

  it("does not flag companionAheadOfServer when local and server are identical", () => {
    const server = makeSnapshot({
      companion: makeServerCompanion({
        foodGrantedByDate: { "2026-07-01": 3 },
        foodSpentEvents: { "2026-07-01": ["b", "a"] },
        lastSeenDate: "2026-07-01"
      })
    });
    // Local mirrors the server exactly, modulo ISO format and array order.
    const local = makeState({
      companion: makeLocalCompanion({
        pets: {
          dog: makeLocalPet({ nameUpdatedAt: "2026-06-10T00:00:00.000Z" })
        },
        activeSpeciesUpdatedAt: "2026-06-10T00:00:00.000Z",
        foodGrantedByDate: { "2026-07-01": 3 },
        foodSpentEvents: { "2026-07-01": ["a", "b"] },
        lastSeenDate: "2026-07-01"
      })
    });

    const result = mergeServerIntoLocal(local, server, {}, T_EARLY);

    expect(result.companionAheadOfServer).toBe(false);
  });
});

describe("mergeServerIntoLocal — never touches fiction fields", () => {
  it("keeps seedCutoverDate, bestStreakFloor and events byte-identical", () => {
    const local = createInitialDashboardState("2026-07-04");
    const server = makeSnapshot({
      habits: [makeServerHabit("english", "Học tiếng Anh", { clientUpdatedAt: T_MID })],
      logs: [{ habitKey: "english", date: "2026-07-02", done: true, mutatedAt: T_MID }],
      companion: makeServerCompanion()
    });

    const result = mergeServerIntoLocal(local, server, {}, null);

    expect(result.state.seedCutoverDate).toBe(local.seedCutoverDate);
    expect(result.state.bestStreakFloor).toBe(local.bestStreakFloor);
    expect(result.state.events).toBe(local.events);
  });
});

describe("buildCompanionSyncPayload / applyCompanionPushResult", () => {
  it("payload carries lastSyncedAt and pets but NEVER the derived food balance", () => {
    const state = makeState({
      companion: makeLocalCompanion({ food: 7, foodGrantedByDate: { "2026-07-01": 7 } })
    });
    const payload = buildCompanionSyncPayload(state, T_EARLY);

    expect(payload.lastSyncedAt).toBe(T_EARLY);
    expect(payload.pets.dog?.name).toBe("Xoài");
    expect(payload).not.toHaveProperty("food");
    expect(JSON.stringify(payload)).not.toContain('"food":');
  });

  it("adopts returned ledgers wholesale (server pruning sticks) while preserving balance", () => {
    const oldDay = "2026-05-01";
    const state = makeState({
      companion: makeLocalCompanion({
        foodGrantedByDate: { [oldDay]: 5, "2026-07-01": 2 },
        foodSpentEvents: { [oldDay]: ["s1"] },
        foodCarryover: 0
      })
    });
    const sent = buildCompanionSyncPayload(state, T_EARLY);
    // Server folded the old day (net +4) into carryover and dropped it.
    const returned = makeServerCompanion({
      foodGrantedByDate: { "2026-07-01": 2 },
      foodSpentEvents: {},
      foodCarryover: 4
    });

    const next = applyCompanionPushResult(state, sent, returned, T_EARLY);

    expect(next.companion.foodGrantedByDate[oldDay]).toBeUndefined();
    expect(next.companion.foodSpentEvents[oldDay]).toBeUndefined();
    expect(next.companion.foodCarryover).toBe(4);
    expect(next.companion.food).toBe(deriveFoodBalance(state.companion)); // balance invariant
  });

  it("a feed during the network round-trip is never lost or refunded", () => {
    const state = makeState({
      companion: makeLocalCompanion({ foodGrantedByDate: { "2026-07-01": 5 } })
    });
    const sent = buildCompanionSyncPayload(state, T_EARLY);
    // While the push was in flight the user fed the pet (new spend event) —
    // and the pet's bond grew.
    const midFlight: DashboardState = {
      ...state,
      companion: {
        ...state.companion,
        foodSpentEvents: { "2026-07-01": ["mid-flight-feed"] },
        pets: { dog: makeLocalPet({ bond: 42 }) }
      }
    };
    const returned = makeServerCompanion({
      foodGrantedByDate: { "2026-07-01": 5 },
      pets: { dog: makeServerPet({ bond: 40 }) }
    });

    const next = applyCompanionPushResult(midFlight, sent, returned, T_EARLY);

    expect(next.companion.foodSpentEvents["2026-07-01"]).toEqual(["mid-flight-feed"]);
    expect(next.companion.pets.dog?.bond).toBe(42); // no local decay
    expect(next.companion.food).toBe(4);
  });

  it("push-result adoption still honours reset supremacy", () => {
    const state = makeState({
      companion: makeLocalCompanion({ pets: { dog: makeLocalPet({ bond: 900 }) } })
    });
    const sent = buildCompanionSyncPayload(state, T_EARLY);
    const returned = makeServerCompanion({
      pets: { dog: makeServerPet({ bond: 1, growthDays: 0, resetAt: T_MID }) }
    });

    const next = applyCompanionPushResult(state, sent, returned, T_EARLY);

    expect(next.companion.pets.dog?.bond).toBe(1);
  });
});
