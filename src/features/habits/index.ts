import type { Habit, HabitConfig } from "@/types";

export interface HabitValidationResult {
  valid: boolean;
  errors: string[];
}

// TODO: Validate editable habit commands during T-016.
export function validateHabitConfig(
  _config: HabitConfig,
  _existing: readonly Habit[]
): HabitValidationResult {
  throw new Error("not implemented");
}
