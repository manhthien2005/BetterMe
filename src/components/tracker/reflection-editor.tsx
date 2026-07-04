"use client";

import { useEffect, useId, useState } from "react";

import type { ISODateString, ReflectionEntry } from "@/types";
import { notify } from "../../components/feedback/themed-toaster";
import { normalizeReflection } from "../../features/reflections";
import { useTracker } from "../../hooks/use-tracker";

export interface ReflectionEditorProps {
  date: ISODateString;
  entry: ReflectionEntry | null;
}

export function ReflectionEditor({ date, entry }: ReflectionEditorProps) {
  const tracker = useTracker();
  const baseId = useId();
  const [dailyNote, setDailyNote] = useState(entry?.dailyNote ?? "");
  const [problemToday, setProblemToday] = useState(entry?.problemToday ?? "");
  const [tomorrowFocus, setTomorrowFocus] = useState(entry?.tomorrowFocus ?? "");

  useEffect(() => {
    setDailyNote(entry?.dailyNote ?? "");
    setProblemToday(entry?.problemToday ?? "");
    setTomorrowFocus(entry?.tomorrowFocus ?? "");
  }, [entry]);

  if (!tracker.state.hydrated) return <p>Loading reflection...</p>;

  return (
    <form
      aria-label="Daily reflection"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeReflection({
          date,
          dailyNote,
          problemToday,
          tomorrowFocus,
          updatedAt: new Date().toISOString()
        });
        tracker.saveReflection(date, {
          dailyNote: normalized.dailyNote,
          problemToday: normalized.problemToday,
          tomorrowFocus: normalized.tomorrowFocus
        });
        notify("success", "Reflection saved");
      }}
    >
      <label htmlFor={`${baseId}-daily-note`}>Daily note</label>
      <textarea id={`${baseId}-daily-note`} value={dailyNote} onChange={(event) => setDailyNote(event.target.value)} />

      <label htmlFor={`${baseId}-problem-today`}>Challenge today</label>
      <textarea id={`${baseId}-problem-today`} value={problemToday} onChange={(event) => setProblemToday(event.target.value)} />

      <label htmlFor={`${baseId}-tomorrow-focus`}>Tomorrow focus</label>
      <textarea id={`${baseId}-tomorrow-focus`} value={tomorrowFocus} onChange={(event) => setTomorrowFocus(event.target.value)} />

      <button type="submit">Save reflection</button>
    </form>
  );
}
