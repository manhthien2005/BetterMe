"use client";

import { useState } from "react";

import type { Habit, HabitConfig } from "@/types";
import { habitKeyFromName, validateHabitConfig } from "../../features/habits";
import { useTracker } from "../../hooks/use-tracker";
import { HabitEditorRow } from "./habit-editor-row";

export interface HabitConfigPanelProps {
  habits?: readonly Habit[];
}

export function HabitConfigPanel({ habits }: HabitConfigPanelProps) {
  const tracker = useTracker();
  const sourceHabits = [...(habits ?? tracker.state.data?.habits ?? [])].sort((first, second) => first.sortOrder - second.sortOrder || first.id.localeCompare(second.id));

  if (!tracker.state.hydrated && !habits) {
    return (
      <section aria-label="Habit configuration">
        <h1>Habit configuration</h1>
        <p>Loading habits...</p>
      </section>
    );
  }

  return (
    <section aria-label="Habit configuration" className="habit-config-panel">
      <h1>Habit configuration</h1>
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
  const [name, setName] = useState("");
  const [category, setCategory] = useState("growth");
  const [score, setScore] = useState("1");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <form
      aria-label="New habit"
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
      <h2>Add habit</h2>
      <label>New habit name<input aria-label="New habit name" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>New habit category<input aria-label="New habit category" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
      <label>New habit score<input aria-label="New habit score" min="0" type="number" value={score} onChange={(event) => setScore(event.target.value)} /></label>
      <label>New habit description<textarea aria-label="New habit description" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
      <button type="submit">Add habit</button>
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
