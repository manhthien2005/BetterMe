import { z } from "zod";

import type { BetterMeData } from "@/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.string();
const themeId = z.enum(["cute-cat", "study-corner", "modern-focus", "minimal-calm"]);

const habit = z.object({
  id: z.string().min(1), key: z.string().min(1), name: z.string().min(1), category: z.string(),
  maxScore: z.number().finite().nonnegative(), active: z.boolean(), description: z.string(),
  sortOrder: z.number().finite(), createdAt: timestamp, updatedAt: timestamp
}).strict();
const habitEntry = z.object({
  date: isoDate,
  habitCompletions: z.record(z.string(), z.boolean()),
  updatedAt: timestamp
}).strict();
const reflection = z.object({
  date: isoDate, dailyNote: z.string(), problemToday: z.string(), tomorrowFocus: z.string(), updatedAt: timestamp
}).strict();
const settings = z.object({
  timezone: z.string().min(1), startDate: isoDate, selectedDate: isoDate,
  trackerDays: z.number().int().positive(), targetCompletionRate: z.number().min(0).max(1), themeId
}).strict();
const betterMeDataSchema = z.object({
  schemaVersion: z.literal(1), habits: z.array(habit), habitEntries: z.array(habitEntry),
  reflections: z.array(reflection), settings, updatedAt: timestamp
}).strict();

export class StorageValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageValidationError";
  }
}

export class StorageWriteError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageWriteError";
  }
}

export function parseBetterMeData(value: unknown): BetterMeData {
  const result = betterMeDataSchema.safeParse(value);
  if (!result.success) {
    throw new StorageValidationError("Stored BetterMe data is invalid", { cause: result.error });
  }
  return result.data as BetterMeData;
}
