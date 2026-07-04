import type { BetterMeData, StorageAdapter } from "@/types";

export class MemoryStorageAdapter implements StorageAdapter {
  private data: BetterMeData | null = null;

  constructor(initialData: BetterMeData | null = null) {
    this.data = initialData === null ? null : structuredClone(initialData);
  }

  async load(): Promise<BetterMeData | null> {
    return this.data === null ? null : structuredClone(this.data);
  }

  async save(data: BetterMeData): Promise<void> {
    this.data = structuredClone(data);
  }

  async clear(): Promise<void> {
    this.data = null;
  }
}
