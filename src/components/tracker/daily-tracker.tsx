"use client";

import type { ISODateString } from "@/types";
import { useTracker } from "../../hooks/use-tracker";

export interface DailyTrackerProps {
  date: ISODateString;
}

export function DailyTracker({ date }: DailyTrackerProps) {
  const tracker = useTracker();
  const habits = [...(tracker.state.data?.habits ?? [])]
    .filter((habit) => habit.active)
    .sort((first, second) => first.sortOrder - second.sortOrder || first.id.localeCompare(second.id));
  const record = tracker.records.find((candidate) => candidate.date === date);
  const disabled = !tracker.state.hydrated || record?.status === "Planned" || record?.status === null;

  if (!tracker.state.hydrated) return <p>Loading tracker...</p>;
  if (habits.length === 0) return <p>No active habits yet.</p>;

  return (
    <fieldset aria-label="Daily habits">
      <legend>Daily habits</legend>
      <div>
        {habits.map((habit) => (
          <label key={habit.id}>
            <input
              checked={record?.habitCompletions[habit.id] === true}
              disabled={disabled}
              onChange={() => tracker.toggleHabit(date, habit.id)}
              type="checkbox"
            />
            {habit.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
