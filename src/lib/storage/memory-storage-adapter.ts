import type { BetterMeData, StorageAdapter } from "@/types";

// TODO: Implement deep-cloned in-memory persistence during T-006.
export class MemoryStorageAdapter implements StorageAdapter {
  async load(): Promise<BetterMeData | null> {
    throw new Error("not implemented");
  }

  async save(_data: BetterMeData): Promise<void> {
    throw new Error("not implemented");
  }

  async clear(): Promise<void> {
    throw new Error("not implemented");
  }
}
