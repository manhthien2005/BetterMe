import type { BetterMeData, StorageAdapter } from "@/types";

// TODO: Implement versioned browser persistence during T-006.
export class LocalStorageAdapter implements StorageAdapter {
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
