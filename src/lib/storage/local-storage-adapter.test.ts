import { beforeEach, describe, expect, it } from "vitest";

import { data } from "./storage-adapter.contract.test";
import { LocalStorageAdapter } from "./local-storage-adapter";
import { parseBetterMeData, StorageValidationError, StorageWriteError } from "./schema";

describe("LocalStorageAdapter", () => {
  beforeEach(() => localStorage.clear());

  it("persists the versioned envelope under betterme:data", async () => {
    const adapter = new LocalStorageAdapter();
    await adapter.save(data());
    expect(JSON.parse(localStorage.getItem("betterme:data") ?? "null")).toMatchObject({ schemaVersion: 1 });
    expect(await adapter.load()).toEqual(data());
    await adapter.clear();
    expect(localStorage.getItem("betterme:data")).toBeNull();
  });

  it("classifies invalid JSON and schema data", async () => {
    localStorage.setItem("betterme:data", "{");
    await expect(new LocalStorageAdapter().load()).rejects.toBeInstanceOf(StorageValidationError);
    expect(() => parseBetterMeData({ schemaVersion: 2 })).toThrow(StorageValidationError);
  });

  it("classifies write failures", async () => {
    const broken = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => undefined };
    await expect(new LocalStorageAdapter(broken).save(data())).rejects.toBeInstanceOf(StorageWriteError);
  });
});
