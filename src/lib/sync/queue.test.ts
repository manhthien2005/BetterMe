import { beforeEach, describe, expect, it } from "vitest";

import {
  SYNC_QUEUE_STORAGE_KEY,
  coalesceEnqueue,
  enqueue,
  loadQueue,
  rekeyQueueMutations,
  saveQueue
} from "./queue";
import {
  SYNC_SHADOW_STORAGE_KEY,
  getCellStamp,
  loadShadowMap,
  pruneShadowMap,
  rekeyShadowCells,
  stampCell,
  withCellStamp
} from "./shadow";
import type { SyncMutation, UpsertHabitMutation } from "./types";

const T1 = "2026-07-01T09:00:00.000Z";
const T2 = "2026-07-01T10:00:00.000Z";

function setLog(habitKey: string, date: string, done: boolean, clientTs = T1): SyncMutation {
  return { kind: "setHabitLog", habitKey, date, done, clientTs };
}

function upsert(key: string, name: string, clientTs = T1, expectCreate?: boolean): UpsertHabitMutation {
  return {
    kind: "upsertHabit",
    habit: { key, name, category: "", maxScore: 1, active: true, description: "", sortOrder: 0 },
    clientTs,
    ...(expectCreate !== undefined ? { expectCreate } : {})
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("sync queue — coalescing", () => {
  it("replaces a setHabitLog for the same (habitKey, date) cell with the newer SET", () => {
    let queue = coalesceEnqueue([], setLog("english", "2026-07-01", true, T1));

    queue = coalesceEnqueue(queue, setLog("english", "2026-07-01", false, T2));

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ done: false, clientTs: T2 });
  });

  it("never lets an older SET downgrade a newer queued SET for the same cell", () => {
    let queue = coalesceEnqueue([], setLog("english", "2026-07-01", false, T2));

    queue = coalesceEnqueue(queue, setLog("english", "2026-07-01", true, T1));

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ done: false, clientTs: T2 });
  });

  it("keeps different cells side by side", () => {
    let queue = coalesceEnqueue([], setLog("english", "2026-07-01", true));

    queue = coalesceEnqueue(queue, setLog("english", "2026-07-02", true));
    queue = coalesceEnqueue(queue, setLog("clean", "2026-07-01", true));

    expect(queue).toHaveLength(3);
  });

  it("keeps only one companionSnapshot", () => {
    let queue = coalesceEnqueue([], { kind: "companionSnapshot", clientTs: T1 });

    queue = coalesceEnqueue(queue, setLog("english", "2026-07-01", true));
    queue = coalesceEnqueue(queue, { kind: "companionSnapshot", clientTs: T2 });

    expect(queue.filter((m) => m.kind === "companionSnapshot")).toHaveLength(1);
    expect(queue[queue.length - 1]).toMatchObject({ kind: "companionSnapshot", clientTs: T2 });
  });

  it("replaces an upsertHabit for the same key and keeps expectCreate sticky", () => {
    let queue = coalesceEnqueue([], upsert("custom_x", "X", T1, true));

    queue = coalesceEnqueue(queue, upsert("custom_x", "X đổi tên", T2));

    expect(queue).toHaveLength(1);

    const only = queue[0] as UpsertHabitMutation;

    expect(only.habit.name).toBe("X đổi tên");
    expect(only.expectCreate).toBe(true); // the CREATE never reached the server
  });

  it("deleteHabit cancels every queued mutation touching that key (no orphan resurrection)", () => {
    let queue = coalesceEnqueue([], upsert("custom_x", "X", T1, true));

    queue = coalesceEnqueue(queue, setLog("custom_x", "2026-07-01", true));
    queue = coalesceEnqueue(queue, setLog("english", "2026-07-01", true));
    queue = coalesceEnqueue(queue, { kind: "deleteHabit", habitKey: "custom_x", deletedAt: T2 });

    expect(queue).toEqual([
      expect.objectContaining({ kind: "setHabitLog", habitKey: "english" }),
      expect.objectContaining({ kind: "deleteHabit", habitKey: "custom_x" })
    ]);
  });
});

describe("sync queue — storage", () => {
  it("persists through enqueue/loadQueue and survives valid round-trips", () => {
    enqueue(setLog("english", "2026-07-01", true));
    enqueue({ kind: "companionSnapshot", clientTs: T1 });

    expect(loadQueue()).toHaveLength(2);
  });

  it("falls back to [] on corrupt JSON", () => {
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, "{not json!!");

    expect(loadQueue()).toEqual([]);
  });

  it("drops foreign entries that are not valid mutations", () => {
    localStorage.setItem(
      SYNC_QUEUE_STORAGE_KEY,
      JSON.stringify([setLog("english", "2026-07-01", true), { kind: "hack" }, 42, null])
    );

    expect(loadQueue()).toHaveLength(1);
  });

  it("rekeyQueueMutations rewrites every mutation kind that references the key", () => {
    const queue: SyncMutation[] = [
      setLog("custom_x", "2026-07-01", true),
      upsert("custom_x", "X", T1, true),
      { kind: "deleteHabit", habitKey: "custom_x", deletedAt: T2 },
      setLog("english", "2026-07-01", true),
      { kind: "companionSnapshot", clientTs: T1 }
    ];

    const rekeyed = rekeyQueueMutations(queue, "custom_x", "custom_x_2");

    expect(rekeyed[0]).toMatchObject({ habitKey: "custom_x_2" });
    expect((rekeyed[1] as UpsertHabitMutation).habit.key).toBe("custom_x_2");
    expect(rekeyed[2]).toMatchObject({ habitKey: "custom_x_2" });
    expect(rekeyed[3]).toMatchObject({ habitKey: "english" });
    expect(rekeyed[4]).toEqual(queue[4]);

    saveQueue(rekeyed);
    expect(loadQueue()).toEqual(rekeyed);
  });
});

describe("shadow map", () => {
  it("stamps and reads back cells", () => {
    stampCell("2026-07-01", "english", T1);

    expect(getCellStamp("2026-07-01", "english")).toBe(T1);
    expect(getCellStamp("2026-07-01", "clean")).toBeNull();
  });

  it("stamps are monotonic per cell — an older stamp never overwrites a newer one", () => {
    let map = withCellStamp({}, "2026-07-01", "english", T2);

    map = withCellStamp(map, "2026-07-01", "english", T1);

    expect(map["2026-07-01"].english).toBe(T2);
  });

  it("falls back to {} on corrupt JSON and drops malformed entries", () => {
    localStorage.setItem(SYNC_SHADOW_STORAGE_KEY, "!!!");
    expect(loadShadowMap()).toEqual({});

    localStorage.setItem(
      SYNC_SHADOW_STORAGE_KEY,
      JSON.stringify({ "2026-07-01": { english: T1, bad: 42 }, broken: "nope" })
    );
    expect(loadShadowMap()).toEqual({ "2026-07-01": { english: T1 } });
  });

  it("prunes dates older than 90 days", () => {
    const map = {
      "2026-01-01": { english: T1 },
      "2026-07-01": { english: T1 }
    };

    expect(pruneShadowMap(map, "2026-07-04")).toEqual({ "2026-07-01": { english: T1 } });
  });

  it("rekeyShadowCells moves stamps to the new key", () => {
    const map = {
      "2026-07-01": { custom_x: T1, english: T2 },
      "2026-07-02": { english: T1 }
    };

    const rekeyed = rekeyShadowCells(map, "custom_x", "custom_x_2");

    expect(rekeyed["2026-07-01"]).toEqual({ custom_x_2: T1, english: T2 });
    expect(rekeyed["2026-07-02"]).toEqual({ english: T1 });
  });
});
