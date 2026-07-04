import type { Habit, HabitConfig } from "@/types";

export interface HabitValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateHabitConfig(
  config: HabitConfig,
  existing: readonly Habit[]
): HabitValidationResult {
  const errors: string[] = [];

  if (!config.name.trim()) errors.push("Name is required");
  if (!config.key.trim()) errors.push("Key is required");
  if (config.maxScore < 0 || !Number.isFinite(config.maxScore)) errors.push("Max score must be non-negative");
  if (existing.some((habit) => habit.key === config.key)) errors.push("Key must be unique");

  return { valid: errors.length === 0, errors };
}

export function habitKeyFromName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "habit";
}
