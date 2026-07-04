"use client";

import { useEffect, useState } from "react";

import type { ThemeId, TrackerSettings } from "@/types";
import { THEMES } from "../../themes";
import { notify } from "../feedback/themed-toaster";
import { ConfirmResetDialog } from "../feedback/confirm-reset-dialog";
import { useTracker } from "../../hooks/use-tracker";
import { ThemePreview } from "../theme/theme-preview";

export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
}

export function SettingsForm() {
  const tracker = useTracker();
  const settings = tracker.state.data?.settings;
  const [timezone, setTimezone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [trackerDays, setTrackerDays] = useState("1");
  const [targetCompletionRate, setTargetCompletionRate] = useState("80");
  const [themeId, setThemeId] = useState<ThemeId>("cute-cat");
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setTimezone(settings.timezone);
    setStartDate(settings.startDate);
    setSelectedDate(settings.selectedDate);
    setTrackerDays(String(settings.trackerDays));
    setTargetCompletionRate(String(Math.round(settings.targetCompletionRate * 100)));
    setThemeId(settings.themeId);
    setSynced(true);
  }, [settings]);

  if (!tracker.state.hydrated || !settings || !synced) {
    return (
      <section aria-label="Settings">
        <h1>Settings</h1>
        <p>Loading settings...</p>
      </section>
    );
  }

  return (
    <section aria-label="Settings" className="settings-form">
      <h1>Settings</h1>
      <p>BetterMe is local-only in Phase 1. Your data is stored on this device until a future backend is added.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next: TrackerSettings = {
            timezone: timezone.trim(),
            startDate: startDate as TrackerSettings["startDate"],
            selectedDate: selectedDate as TrackerSettings["selectedDate"],
            trackerDays: Number(trackerDays),
            targetCompletionRate: Number(targetCompletionRate) / 100,
            themeId
          };
          const result = validateTrackerSettings(next);
          if (!result.valid) {
            setErrors(result.errors);
            return;
          }
          setErrors([]);
          tracker.updateSettings(next);
          notify("success", "Settings saved");
        }}
      >
        <label>Timezone<input aria-label="Timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
        <label>Start date<input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Selected date<input aria-label="Selected date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <label>Tracking days<input aria-label="Tracking days" min="1" type="number" value={trackerDays} onChange={(event) => setTrackerDays(event.target.value)} /></label>
        <label>Target completion rate<input aria-label="Target completion rate" min="0" max="100" type="number" value={targetCompletionRate} onChange={(event) => setTargetCompletionRate(event.target.value)} /></label>
        <label>
          Theme
          <select aria-label="Theme" value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>
            {Object.values(THEMES).map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
          </select>
        </label>
        {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
        <button type="submit">Save settings</button>
      </form>
      <ThemePreview themeId={themeId} />
      <button onClick={() => setConfirmOpen(true)} type="button">Clear local data</button>
      <ConfirmResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void tracker.reset().then(() => {
            setConfirmOpen(false);
            notify("info", "Local data reset");
          });
        }}
      />
    </section>
  );
}

export function validateTrackerSettings(settings: TrackerSettings): SettingsValidationResult {
  const errors: string[] = [];
  if (!settings.timezone.trim()) errors.push("Timezone is required");
  if (settings.trackerDays < 1 || !Number.isFinite(settings.trackerDays)) errors.push("Tracking days must be at least 1");
  if (settings.targetCompletionRate < 0 || settings.targetCompletionRate > 1 || !Number.isFinite(settings.targetCompletionRate)) errors.push("Target completion rate must be between 0 and 100");
  return { valid: errors.length === 0, errors };
}
