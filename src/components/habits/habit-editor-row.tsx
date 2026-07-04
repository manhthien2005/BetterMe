"use client";

import { useState } from "react";

import type { Habit, HabitConfig } from "@/types";
import { validateHabitConfig } from "../../features/habits";
import { useI18n } from "../i18n/locale-provider";

export interface HabitEditorRowProps {
  habit: Habit;
  existing: readonly Habit[];
  onSave(config: HabitConfig): void;
  onMove(delta: number): void;
  onRemove(): void;
}

export function HabitEditorRow({ habit, existing, onSave, onMove, onRemove }: HabitEditorRowProps) {
  const { dictionary } = useI18n();
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
        {dictionary.habits.habitName(labelName)}
        <input aria-label={dictionary.habits.habitName(labelName)} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        {dictionary.habits.category(labelName)}
        <input aria-label={dictionary.habits.category(labelName)} value={category} onChange={(event) => setCategory(event.target.value)} />
      </label>
      <label>
        {dictionary.habits.maxScore(labelName)}
        <input aria-label={dictionary.habits.maxScore(labelName)} min="0" type="number" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
      </label>
      <label>
        {dictionary.habits.description(labelName)}
        <textarea aria-label={dictionary.habits.description(labelName)} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        <input aria-label={dictionary.habits.activeLabel(labelName)} checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
        {dictionary.habits.active}
      </label>
      {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
      <div>
        <button onClick={() => onMove(-1)} type="button">{dictionary.habits.moveUp(labelName)}</button>
        <button onClick={() => onMove(1)} type="button">{dictionary.habits.moveDown(labelName)}</button>
        <button onClick={onRemove} type="button">{dictionary.habits.deleteHabit(labelName)}</button>
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
          {dictionary.habits.saveHabit(labelName)}
        </button>
      </div>
    </fieldset>
  );
}
