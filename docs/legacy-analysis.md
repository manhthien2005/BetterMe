# Legacy Tracker Analysis

## Source Note

The full source is available in `code.js` (1,797 lines) and was read in full. This analysis uses that file as the ground-truth behavior; the functional summary in the session brief was used only as a cross-check.

## Product summary

“Better Me - English Weekly Tracker” is a container-bound Google Apps Script application that turns one spreadsheet into a single-user habit dashboard. It combines editable settings and habit configuration, a Monday–Sunday checkbox board, three daily reflection fields, a selectable six-week calendar grid, daily/weekly metrics, motivation copy, and two charts. Edits to the visible week are copied into hidden helper columns, recalculated, and reflected across the dashboard.

The product is not fundamentally a spreadsheet. Its durable concept is a daily self-improvement record derived from configured habits, a target rate, and a timezone. The spreadsheet supplies storage, event handling, and layout; those responsibilities should become separate web modules.

## Extracted domain model

- Habit configuration: key, display name, category, maximum score, active flag, description, and stable display order.
- Tracker settings: IANA timezone, first tracking date, selected date, configured tracking horizon, and target completion rate.
- Daily input: a Boolean completion value per habit plus daily note, challenge/problem, and tomorrow focus.
- Daily derivation: Monday-based week start, day label, total score, maximum score, completion rate, status, streak, and missed habit keys/names.
- Weekly derivation: eligible records in the selected Monday–Sunday window, average completion, missed count, per-habit completion rate, and day summaries.
- Chart derivation: a 30-day daily completion series anchored to the earlier of today and the selected date, plus selected-week completion rate per active habit.
- Presentation configuration: date-selected palette, status colors, icons, card layouts, motivation messages, and number/date formatting.

## Exact domain rules

1. Only active habits contribute to scoring.
2. `maxScore = sum(activeHabit.maxScore)`.
3. `totalScore = sum(activeHabit.maxScore when that habit is complete, otherwise 0)`.
4. For an eligible non-future day, `completionRate = maxScore > 0 ? totalScore / maxScore : 0`.
5. A day is `Good` when `completionRate >= targetCompletionRate`, `Okay` when it is below target and at least `0.5`, and `Bad` otherwise.
6. A date after “today” is `Planned`; completion rate and streak are absent. A date before `startDate` is untracked; status, rate, and streak are absent.
7. Records are sorted chronologically before streak calculation. The running streak increments on `Good` days and resets to zero on every other eligible day. Each eligible record stores the resulting running value.
8. Missed habit lists contain every active habit not completed on the date. Inactive habits neither score nor count as missed.
9. Weeks start on Monday and end on Sunday.
10. The record range begins at the earliest Monday containing start date, today, or selected date. It ends at the latest of the configured tracking horizon, the end of today’s week, or the end of the selected week.

## Legacy flows

- Setup/rebuild: merge defaults with prior settings/habits/logs, migrate legacy sheet names, preserve hidden tracker data, and rebuild the presentation.
- Track a week: check habits and enter three reflection values directly in the weekly board; the edit trigger overlays visible values onto records and refreshes summaries.
- Select a day: choose a calendar cell; its encoded date becomes `selected_date` and the dashboard is rebuilt around its week/month.
- Return to today: set the selected date to today and rebuild.
- Extend horizon: add 30 to `tracker_days` and rebuild.
- Configure habits/settings: edit the Config sheet; the dashboard rebuilds automatically.
- Review progress: read today/week metrics, selected-day details, the 30-day line chart, and the selected-week habit chart.

## Preserve, redesign, simplify, postpone

### Preserve conceptually

- Weighted active-habit scoring, thresholds, Monday weeks, future/planned handling, chronological streaks, missed-habit derivation, reflections, date selection, and timezone setting.
- The four information layers: immediate daily action, weekly overview, selected-day reflection, and longer-term progress.
- The seven default habits and daily motivation system.

### Redesign for the web

- Replace cell coordinates and sheet rebuilds with route-level screens, responsive cards, direct controls, and derived selectors.
- Replace hidden helper columns with typed records and pure transformations.
- Replace palette rotation by day-of-month with an explicit user-selected theme.
- Replace spreadsheet edit/selection triggers with explicit actions, optimistic local updates, accessible keyboard controls, and themed feedback.
- Make selected-day detail a focused panel/drawer/card instead of a merged-cell region.

### Simplify in Phase 1

- Use one local single-user dataset and one storage adapter rather than spreadsheet migration tables or event logs.
- Persist only source inputs and preferences; recompute scores, summaries, streaks, and chart series rather than treating them as authoritative storage.
- Use a fixed 30-day progress window and selected-week habit window. Custom reporting ranges can wait.
- Keep Boolean habit completion; partial-credit entry is not introduced even though weights can differ.

### Postpone

- Login, profiles, backend database, multi-user ownership, social features, sharing, group streaks, and growth features.
- Importing an existing Google Sheet and preserving legacy Config/Daily_Log migration behavior.
- Automatic theme rotation, dark mode, custom theme authoring, reminders, and notifications outside in-app toasts.

## Spreadsheet concept to web concept mapping

| Spreadsheet concept | Web concept |
|---|---|
| Tracker sheet | Dashboard and tracker routes |
| Config sheet settings block | Settings form backed by `TrackerSettings` |
| Habit Config block | Habit configuration screen backed by `HabitConfig[]` |
| Visible weekly checkbox grid | Responsive weekly quest board |
| Hidden helper columns | Derived `DailyRecord[]` in the domain layer |
| `onEdit` trigger | Store action followed by pure recomputation and adapter save |
| `onSelectionChange` date note | Calendar/date control updating `selectedDate` |
| Rebuild dashboard | React render from current state and pure selectors |
| Merged selected-day cells | Selected-day detail component |
| Embedded charts | Theme-aware chart components consuming `ChartData` |
| Palette constants | `ThemeDefinition` plus raw and semantic CSS tokens |
| Spreadsheet timezone | IANA timezone in settings and isolated date functions |
| Config/Daily_Log migration | Future import adapter, outside Phase 1 |
