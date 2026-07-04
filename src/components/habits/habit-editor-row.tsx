"use client";

import { useState } from "react";

import type { Habit, HabitConfig } from "@/types";
import { validateHabitConfig } from "../../features/habits";

export interface HabitEditorRowProps {
  habit: Habit;
  existing: readonly Habit[];
  onSave(config: HabitConfig): void;
  onMove(delta: number): void;
  onRemove(): void;
}

export function HabitEditorRow({ habit, existing, onSave, onMove, onRemove }: HabitEditorRowProps) {
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category);
  const [maxScore, setMaxScore] = useState(String(habit.maxScore));
  const [description, setDescription] = useState(habit.description);
  const [active, setActive] = useState(habit.active);
  const [errors, setErrors] = useState<string[]>([]);

  const labelName = habit.name;

  return (
    <fieldset className="habit-editor-row">
      <legend>{habit.name}</legend>
      <label>
        Habit name: {labelName}
        <input aria-label={`Habit name: ${labelName}`} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Category: {labelName}
        <input aria-label={`Category: ${labelName}`} value={category} onChange={(event) => setCategory(event.target.value)} />
      </label>
      <label>
        Max score: {labelName}
        <input aria-label={`Max score: ${labelName}`} min="0" type="number" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
      </label>
      <label>
        Description: {labelName}
        <textarea aria-label={`Description: ${labelName}`} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        <input aria-label={`Active: ${labelName}`} checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
        Active
      </label>
      {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
      <div>
        <button onClick={() => onMove(-1)} type="button">Move {labelName} up</button>
        <button onClick={() => onMove(1)} type="button">Move {labelName} down</button>
        <button onClick={onRemove} type="button">Delete {labelName}</button>
        <button
          onClick={() => {
            const config: HabitConfig = { key: habit.key, name: name.trim(), category: category.trim(), maxScore: Number(maxScore), active, description: description.trim(), sortOrder: habit.sortOrder };
            const result = validateHabitConfig(config, existing.filter((candidate) => candidate.id !== habit.id));
            if (!result.valid) {
              setErrors(result.errors);
              return;
            }
            setErrors([]);
            onSave(config);
          }}
          type="button"
        >
          Save {labelName}
        </button>
      </div>
    </fieldset>
  );
}
