// @vitest-environment node

import { describe, expect, it } from "vitest";

import { LocalStorageAdapter } from "./local-storage-adapter";

describe("LocalStorageAdapter server construction", () => {
  it("does not read window during construction", () => {
    expect(() => new LocalStorageAdapter()).not.toThrow();
  });
});
