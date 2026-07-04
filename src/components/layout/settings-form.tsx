"use client";

import { useEffect, useState } from "react";

import type { ThemeId, TrackerSettings } from "@/types";
import { THEMES } from "../../themes";
import { notify } from "../feedback/themed-toaster";
import { ConfirmResetDialog } from "../feedback/confirm-reset-dialog";
import { useTracker } from "../../hooks/use-tracker";
import { useI18n } from "../i18n/locale-provider";
import { ThemePreview } from "../theme/theme-preview";

const THEME_LABEL_KEYS: Record<ThemeId, "cuteCat" | "studyCorner" | "modernFocus" | "minimalCalm"> = {
  "cute-cat": "cuteCat",
  "study-corner": "studyCorner",
  "modern-focus": "modernFocus",
  "minimal-calm": "minimalCalm"
};

export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
}

export function SettingsForm() {
  const tracker = useTracker();
  const { dictionary } = useI18n();
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
      <section aria-label={dictionary.settings.title}>
        <h1>{dictionary.settings.title}</h1>
        <p>{dictionary.settings.loading}</p>
      </section>
    );
  }

  return (
    <section aria-label={dictionary.settings.title} className="settings-form">
      <h1>{dictionary.settings.title}</h1>
      <p>{dictionary.settings.localOnlyNote}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next: TrackerSettings = {
            timezone: timezone.trim(),
            startDate: startDate as TrackerSettings["startDate"],
            selectedDate: selectedDate as TrackerSettings["selectedDate"],
            trackerDays: Number(trackerDays),
            targetCompletionRate: Number(targetCompletionRate) / 100,
            themeId,
            locale: settings.locale
          };
          const result = validateTrackerSettings(next);
          if (!result.valid) {
            setErrors(result.errors);
            return;
          }
          setErrors([]);
          tracker.updateSettings(next);
          notify("success", dictionary.settings.settingsSaved);
        }}
      >
        <label>{dictionary.settings.timezone}<input aria-label={dictionary.settings.timezone} value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
        <label>{dictionary.settings.startDate}<input aria-label={dictionary.settings.startDate} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>{dictionary.settings.selectedDate}<input aria-label={dictionary.settings.selectedDate} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <label>{dictionary.settings.trackingDays}<input aria-label={dictionary.settings.trackingDays} min="1" type="number" value={trackerDays} onChange={(event) => setTrackerDays(event.target.value)} /></label>
        <label>{dictionary.settings.targetCompletionRate}<input aria-label={dictionary.settings.targetCompletionRate} min="0" max="100" type="number" value={targetCompletionRate} onChange={(event) => setTargetCompletionRate(event.target.value)} /></label>
        <label>
          {dictionary.settings.theme}
          <select aria-label={dictionary.settings.theme} value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>
            {Object.values(THEMES).map((theme) => <option key={theme.id} value={theme.id}>{dictionary.theme[THEME_LABEL_KEYS[theme.id]]}</option>)}
          </select>
        </label>
        {errors.length ? <p role="alert">{errors.join(", ")}</p> : null}
        <button type="submit">{dictionary.settings.saveSettings}</button>
      </form>
      <ThemePreview themeId={themeId} />
      <button onClick={() => setConfirmOpen(true)} type="button">{dictionary.common.clearLocalData}</button>
      <ConfirmResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void tracker.reset().then(() => {
            setConfirmOpen(false);
            notify("info", dictionary.settings.localDataReset);
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
