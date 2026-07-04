import type { BetterMeData, StorageAdapter } from "@/types";
import { parseBetterMeData, StorageValidationError, StorageWriteError } from "./schema";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly storage: StorageLike = window.localStorage,
    private readonly key = "betterme:data"
  ) {}

  async load(): Promise<BetterMeData | null> {
    const serialized = this.storage.getItem(this.key);
    if (serialized === null) return null;
    try {
      return parseBetterMeData(JSON.parse(serialized));
    } catch (error) {
      if (error instanceof StorageValidationError) throw error;
      throw new StorageValidationError("Stored BetterMe data is not valid JSON", { cause: error });
    }
  }

  async save(data: BetterMeData): Promise<void> {
    try {
      this.storage.setItem(this.key, JSON.stringify(parseBetterMeData(data)));
    } catch (error) {
      if (error instanceof StorageValidationError) throw error;
      throw new StorageWriteError("Unable to save BetterMe data", { cause: error });
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.removeItem(this.key);
    } catch (error) {
      throw new StorageWriteError("Unable to clear BetterMe data", { cause: error });
    }
  }
}
