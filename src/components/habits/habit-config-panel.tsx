"use client";

import { useState } from "react";

import type { Habit, HabitConfig } from "@/types";
import { habitKeyFromName, validateHabitConfig } from "../../features/habits";
import { useTracker } from "../../hooks/use-tracker";
import { useI18n } from "../i18n/locale-provider";
import { HabitEditorRow } from "./habit-editor-row";

export interface HabitConfigPanelProps {
  habits?: readonly Habit[];
}

export function HabitConfigPanel({ habits }: HabitConfigPanelProps) {
  const tracker = useTracker();
  const { dictionary } = useI18n();
  const sourceHabits = [...(habits ?? tracker.state.data?.habits ?? [])].sort((first, second) => first.sortOrder - second.sortOrder || first.id.localeCompare(second.id));

  if (!tracker.state.hydrated && !habits) {
    return (
      <section aria-label={dictionary.habits.title}>
        <h1>{dictionary.habits.title}</h1>
        <p>{dictionary.habits.loading}</p>
      </section>
    );
  }

  return (
    <section aria-label={dictionary.habits.title} className="habit-config-panel">
      <h1>{dictionary.habits.title}</h1>
      <div>
        {sourceHabits.map((habit) => (
          <HabitEditorRow
            existing={sourceHabits}
            habit={habit}
            key={habit.id}
            onMove={(delta) => tracker.saveHabit({ ...toConfig(habit), sortOrder: habit.sortOrder + delta }, habit.id)}
            onRemove={() => tracker.removeHabit(habit.id)}
            onSave={(config) => tracker.saveHabit(config, habit.id)}
          />
        ))}
      </div>
      <NewHabitForm existing={sourceHabits} onAdd={(config) => tracker.saveHabit(config, `habit-${config.key}`)} />
    </section>
  );
}

function NewHabitForm({ existing, onAdd }: { existing: readonly Habit[]; onAdd(config: HabitConfig): void }) {
  const { dictionary } = useI18n();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("growth");
  const [score, setScore] = useState("1");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <form
      aria-label={dictionary.habits.addHabit}
      onSubmit={(event) => {
        event.preventDefault();
        const key = habitKeyFromName(name);
        const nextSortOrder = existing.reduce((max, habit) => Math.max(max, habit.sortOrder), -1) + 1;
        const config: HabitConfig = { key, name: name.trim(), category: category.trim(), maxScore: Number(score), active: true, description: description.trim(), sortOrder: nextSortOrder };
        const result = validateHabitConfig(config, existing);
        if (!result.valid) {
          setErrors(result.errors);
          return;
        }
        setErrors([]);
        onAdd(config);
        setName("");
        setCategory("growth");
        setScore("1");
        setDescription("");
      }}
    >
      <h2>{dictionary.habits.addHabit}</h2>
      <label>{dictionary.habits.newHabitName}<input aria-label={dictionary.habits.newHabitName} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>{dictionary.habits.newHabitCategory}<input aria-label={dictionary.habits.newHabitCategory} value={category} onChange={(event) => setCategory(event.target.value)} /></label>
      <label>{dictionary.habits.newHabitScore}<input aria-label={dictionary.habits.newHabitScore} min="0" type="number" value={score} onChange={(event) => setScore(event.target.value)} /></label>
      <label>{dictionary.habits.newHabitDescription}<textarea aria-label={dictionary.habits.newHabitDescription} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
      <button type="submit">{dictionary.habits.addHabit}</button>
    </form>
  );
}

function toConfig(habit: Habit): HabitConfig {
  return {
    key: habit.key,
    name: habit.name,
    category: habit.category,
    maxScore: habit.maxScore,
    active: habit.active,
    description: habit.description,
    sortOrder: habit.sortOrder
  };
}
