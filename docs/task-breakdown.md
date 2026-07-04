# BetterMe Phase 1 Task Breakdown

## Global Constraints

Runtime floor: Node.js 20.9 or newer.

Framework floor: Next.js 15 with App Router and React 19.

Language floor: TypeScript 5.7 with `strict` enabled and no unchecked business-domain `any`.

Package manager: establish pnpm and commit `pnpm-lock.yaml` in the first implementation task because no lockfile currently exists.

Repository prerequisite: before `using-git-worktrees` or T-001, restore or initialize a valid Git repository with explicit user approval; the current `.git/` directory is empty and unusable.

Dependency rule: prefer existing prototype choices when suitable; add only `date-fns`, `date-fns-tz`, Recharts, and Zod for uncovered Phase 1 needs.

Naming rule: kebab-case filenames, PascalCase React exports/types, camelCase functions/fields, and IANA timezone/ISO `YYYY-MM-DD` date values at module boundaries.

Component rule: components consume semantic CSS variables only; raw theme values never appear in component files.

Domain rule: scoring, streak, date, and chart transforms are pure TypeScript and do not import React, Next.js, browser APIs, or persistence implementations.

Persistence rule: store source inputs only; recompute derived records and summaries.

Scope rule: no login, required backend, multi-user ownership, or social feature in Phase 1.

## Dependency order

T-001 → T-002

T-001 → T-003 → T-004 → T-005

T-001 → T-006 → T-007

T-005 → T-007

T-005 → T-008

T-001 → T-009 → T-010

T-006 → T-010

T-007 → T-011

T-010 → T-011

T-002 → T-012

T-010 → T-012 → T-013

T-008 → T-013

T-011 → T-014

T-012 → T-014

T-011 → T-015

T-012 → T-015

T-007 → T-016

T-012 → T-016

T-007 → T-017

T-009 → T-017

T-012 → T-017

T-013 → T-018

T-014 → T-018

T-015 → T-018

T-016 → T-018

T-017 → T-018

### T-001: Establish reproducible toolchain
Goal: Create the minimal pinned pnpm/Next.js/TypeScript/Vitest/Testing Library/Playwright toolchain required to execute the existing scaffold without adding product behavior.
Files:
  - Create: `package.json`
  - Create: `pnpm-lock.yaml`
  - Modify: `tsconfig.json:1`
  - Create: `next-env.d.ts`
  - Create: `next.config.ts`
  - Create: `vitest.config.ts`
  - Create: `playwright.config.ts`
  - Modify: `.gitignore:1`
  - Create: `tests/smoke/toolchain.test.ts`
Interfaces:
  - Consumes: Node.js `>=20.9`; Next.js `>=15`; React `>=19`; TypeScript `>=5.7`; canonical exports from `src/types/index.ts`
  - Produces: scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`; deterministic `pnpm-lock.yaml`; `@/*` mapped to `src/*`; project-wide Next.js TypeScript includes for `next-env.d.ts`, `.next/types/**/*.ts`, `**/*.ts`, and `**/*.tsx` with `node_modules` excluded
Verification: `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm run test -- tests/smoke/toolchain.test.ts && pnpm run build`
Dependencies: none

### T-002: Enforce canonical/prototype boundary
Goal: Prevent canonical Phase 1 modules from importing auth, Supabase, server-action, or legacy prototype domain modules while recording reusable prototype candidates.
Files:
  - Create: `tests/architecture/import-boundaries.test.ts`
  - Create: `docs/prototype-reconciliation.md`
  - Modify: `src/app/page.tsx:1`
  - Modify: `src/app/layout.tsx:1`
Interfaces:
  - Consumes: canonical roots `src/types`, `src/data`, `src/lib/scoring`, `src/lib/date`, `src/lib/storage`, `src/charts`, `src/themes`, `src/store`, `src/features`, `src/components`
  - Produces: import rule `canonical modules -> no src/lib/supabase, src/lib/server, src/lib/tracker.ts, src/lib/date.ts, src/lib/types.ts, src/components/auth`; local-first root composition contract
Verification: `pnpm run test -- tests/architecture/import-boundaries.test.ts && pnpm run typecheck`
Dependencies: T-001

### T-003: Implement timezone-aware calendar primitives
Goal: Implement IANA-timezone-aware today/date range logic and Monday-based week/month helpers with DST and year-boundary coverage.
Files:
  - Modify: `src/lib/date/calendar.ts:1`
  - Modify: `src/lib/date/index.ts:1`
  - Test: `src/lib/date/calendar.test.ts`
Interfaces:
  - Consumes: `ISODateString`, `TrackerSettings`; `date-fns`; `date-fns-tz`
  - Produces: `getZonedToday(now: Date, timezone: string): ISODateString`; `addDays(date: ISODateString, days: number): ISODateString`; `getWeekStart(date: ISODateString): ISODateString`; `getWeekEnd(date: ISODateString): ISODateString`; `buildMonthGrid(date: ISODateString): ISODateString[]`; `buildTrackingRange(settings: TrackerSettings, now: Date): ISODateString[]`
Verification: `pnpm run test -- src/lib/date/calendar.test.ts && pnpm run typecheck`
Dependencies: T-001

### T-004: Implement score and completion status
Goal: Calculate weighted totals, completion rate, status, and deterministic missed-habit lists for eligible, future, and pre-start dates.
Files:
  - Modify: `src/lib/scoring/calculate-score.ts:1`
  - Modify: `src/lib/scoring/index.ts:1`
  - Test: `src/lib/scoring/calculate-score.test.ts`
Interfaces:
  - Consumes: `Habit[]`, `HabitCompletionEntry | undefined`, `ISODateString`; `ScoringPolicy { startDate: ISODateString; targetCompletionRate: number }`
  - Produces: `calculateScore(entry: HabitCompletionEntry | undefined, habits: readonly Habit[], policy: ScoringPolicy, date: ISODateString, today: ISODateString): ScoreSummary`
Verification: `pnpm run test -- src/lib/scoring/calculate-score.test.ts && pnpm run typecheck`; the test suite must include duplicate `sortOrder` values and assert ascending `Habit.id` ASCII code-unit tie-breaking
Dependencies: T-003

### T-005: Implement daily records, streaks, and week summaries
Goal: Join source entries into chronological daily records, apply legacy streak resets, and aggregate a Monday–Sunday summary.
Files:
  - Modify: `src/lib/scoring/calculate-streak.ts:1`
  - Create: `src/lib/scoring/build-records.ts`
  - Create: `src/lib/scoring/summarize-week.ts`
  - Modify: `src/lib/scoring/index.ts:1`
  - Test: `src/lib/scoring/build-records.test.ts`
  - Test: `src/lib/scoring/calculate-streak.test.ts`
  - Test: `src/lib/scoring/summarize-week.test.ts`
Interfaces:
  - Consumes: `BetterMeData`, `DailyRecord`, `WeekSummary`; `buildTrackingRange()` from T-003; `calculateScore()` from T-004
  - Produces: `buildDailyRecords(data: BetterMeData, now: Date): DailyRecord[]`; `applyStreaks(records: readonly DailyRecord[]): DailyRecord[]`; `summarizeWeek(records: readonly DailyRecord[], weekStart: ISODateString): WeekSummary`
Verification: `pnpm run test -- src/lib/scoring/build-records.test.ts src/lib/scoring/calculate-streak.test.ts src/lib/scoring/summarize-week.test.ts && pnpm run typecheck`
Dependencies: T-004

### T-006: Implement versioned storage adapters
Goal: Validate, deep-clone, load, save, and clear versioned source data consistently in memory and browser local storage.
Files:
  - Modify: `src/lib/storage/storage-adapter.ts:1`
  - Modify: `src/lib/storage/memory-storage-adapter.ts:1`
  - Modify: `src/lib/storage/local-storage-adapter.ts:1`
  - Create: `src/lib/storage/schema.ts`
  - Modify: `src/lib/storage/index.ts:1`
  - Test: `src/lib/storage/storage-adapter.contract.test.ts`
  - Test: `src/lib/storage/local-storage-adapter.test.ts`
Interfaces:
  - Consumes: `BetterMeData`, `StorageAdapter`; Zod at the serialized-data boundary; browser key `betterme:data`
  - Produces: `MemoryStorageAdapter implements StorageAdapter`; `LocalStorageAdapter implements StorageAdapter`; `parseBetterMeData(value: unknown): BetterMeData`; classified `StorageValidationError` and `StorageWriteError`
Verification: `pnpm run test -- src/lib/storage/storage-adapter.contract.test.ts src/lib/storage/local-storage-adapter.test.ts && pnpm run typecheck`
Dependencies: T-001

### T-007: Implement tracker reducer, hydration, and selectors
Goal: Expose optimistic source-data actions, serialized adapter saves, retry state, and memoized daily/week read models through one client store.
Files:
  - Modify: `src/store/tracker-store.ts:1`
  - Create: `src/store/tracker-reducer.ts`
  - Create: `src/store/tracker-selectors.ts`
  - Modify: `src/hooks/use-tracker.ts:1`
  - Modify: `src/data/default-habits.ts:1`
  - Test: `src/store/tracker-reducer.test.ts`
  - Test: `src/store/tracker-store.test.tsx`
Interfaces:
  - Consumes: `BetterMeData`, `StorageAdapter`, `Habit`, `TrackerSettings`, `ReflectionEntry`, `HabitCompletionEntry`; `buildDailyRecords()` and `summarizeWeek()` from T-005; adapters from T-006
  - Produces: `TrackerState`; `TrackerAction`; `trackerReducer(state: TrackerState, action: TrackerAction): TrackerState`; `TrackerStoreProvider`; `useTracker(): TrackerStoreApi`; selectors `selectDailyRecords(state): DailyRecord[]` and `selectSelectedWeek(state): WeekSummary`
Verification: `pnpm run test -- src/store/tracker-reducer.test.ts src/store/tracker-store.test.tsx && pnpm run typecheck`
Dependencies: T-005, T-006

### T-008: Implement renderer-neutral chart transforms
Goal: Produce a 30-day completion line model and selected-week per-habit bar model without importing a chart renderer.
Files:
  - Modify: `src/charts/build-progress-chart.ts:1`
  - Modify: `src/charts/build-habit-chart.ts:1`
  - Modify: `src/charts/index.ts:1`
  - Test: `src/charts/chart-data.test.ts`
Interfaces:
  - Consumes: `DailyRecord[]`, `Habit[]`, `ISODateString`; `addDays()`, `getWeekStart()`, `getWeekEnd()` from T-003
  - Produces: `buildThirtyDayProgress(records: readonly DailyRecord[], selectedDate: ISODateString, today: ISODateString): ChartData`; `buildSelectedWeekHabits(records: readonly DailyRecord[], habits: readonly Habit[], weekStart: ISODateString): ChartData`
Verification: `pnpm run test -- src/charts/chart-data.test.ts && pnpm run typecheck`
Dependencies: T-003, T-005

### T-009: Define and validate four theme contracts
Goal: Supply complete Cute Cat, Study Corner, Modern Focus, and Minimal Calm definitions and reject missing tokens or contrast failures.
Files:
  - Modify: `src/themes/index.ts:1`
  - Create: `src/themes/cute-cat.ts`
  - Create: `src/themes/study-corner.ts`
  - Create: `src/themes/modern-focus.ts`
  - Create: `src/themes/minimal-calm.ts`
  - Create: `src/themes/validate-theme.ts`
  - Modify: `src/styles/tokens/raw.css:1`
  - Modify: `src/styles/tokens/semantic.css:1`
  - Modify: `src/styles/themes/cute-cat.css:1`
  - Modify: `src/styles/themes/study-corner.css:1`
  - Modify: `src/styles/themes/modern-focus.css:1`
  - Modify: `src/styles/themes/minimal-calm.css:1`
  - Test: `src/themes/validate-theme.test.ts`
Interfaces:
  - Consumes: `ThemeDefinition`, `ThemeId`, `RawThemeTokens`, semantic theme contracts from `src/types/index.ts`
  - Produces: `THEMES: Readonly<Record<ThemeId, ThemeDefinition>>`; `getTheme(id: ThemeId): ThemeDefinition`; `validateThemeDefinition(theme: ThemeDefinition): ThemeValidationResult`; semantic CSS custom properties
Verification: `pnpm run test -- src/themes/validate-theme.test.ts && pnpm run typecheck && pnpm run lint`
Dependencies: T-001

### T-010: Implement theme runtime, feedback, and chart renderers
Goal: Apply the selected semantic theme and render accessible themed toasts/charts behind narrow client boundaries.
Files:
  - Modify: `src/components/theme/theme-provider.tsx:1`
  - Create: `src/components/theme/theme-switcher.tsx`
  - Modify: `src/components/feedback/themed-toaster.tsx:1`
  - Create: `src/components/feedback/empty-state.tsx`
  - Modify: `src/components/charts/progress-chart.tsx:1`
  - Create: `src/components/charts/habit-chart.tsx`
  - Test: `src/components/theme/theme-provider.test.tsx`
  - Test: `src/components/feedback/themed-toaster.test.tsx`
  - Test: `src/components/charts/chart-renderers.test.tsx`
Interfaces:
  - Consumes: `ThemeId`, `ThemeDefinition`, `ChartData`; `THEMES` from T-009; `StorageAdapter` preference state from T-006
  - Produces: `ThemeProvider`; `useTheme(): ThemeContextValue`; `ThemeSwitcher`; `notify(intent: ToastIntent, message: string): void`; `ProgressChart({ data }: { data: ChartData })`; `HabitChart({ data }: { data: ChartData })`
Verification: `pnpm run test -- src/components/theme/theme-provider.test.tsx src/components/feedback/themed-toaster.test.tsx src/components/charts/chart-renderers.test.tsx && pnpm run typecheck`
Dependencies: T-006, T-009

### T-011: Implement selected-day tracking and reflection unit
Goal: Provide reusable selected-day habit controls, score/status detail, and the three reflection fields with accessible validation and save feedback.
Files:
  - Modify: `src/components/tracker/daily-tracker.tsx:1`
  - Create: `src/components/tracker/selected-day-detail.tsx`
  - Create: `src/components/tracker/reflection-editor.tsx`
  - Modify: `src/features/tracking/index.ts:1`
  - Modify: `src/features/reflections/index.ts:1`
  - Modify: `src/features/scoring/index.ts:1`
  - Test: `src/components/tracker/selected-day-detail.test.tsx`
  - Test: `src/components/tracker/reflection-editor.test.tsx`
Interfaces:
  - Consumes: `DailyRecord`, `Habit[]`, `ReflectionEntry`, `TrackerStoreApi` from T-007; themed `notify()` from T-010
  - Produces: `SelectedDayDetail({ date }: { date: ISODateString })`; `DailyTracker({ date }: { date: ISODateString })`; `ReflectionEditor({ entry }: { entry: ReflectionEntry | null })`
Verification: `pnpm run test -- src/components/tracker/selected-day-detail.test.tsx src/components/tracker/reflection-editor.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-010

### T-012: Implement app shell and root page
Goal: Replace authentication routing with a server-rendered local-first shell that leads to the dashboard and exposes accessible navigation.
Files:
  - Modify: `src/components/layout/app-shell.tsx:1`
  - Create: `src/components/layout/app-navigation.tsx`
  - Modify: `src/app/layout.tsx:1`
  - Modify: `src/app/page.tsx:1`
  - Modify: `src/app/globals.css:1`
  - Test: `src/components/layout/app-shell.test.tsx`
  - Test: `src/app/page.test.tsx`
Interfaces:
  - Consumes: `TrackerStoreProvider` from T-007; `ThemeProvider` and `ThemedToaster` from T-010; route list `/dashboard`, `/tracker`, `/calendar`, `/habits`, `/settings`
  - Produces: `AppShell({ children }: { children: React.ReactNode })`; local-first `HomePage`; keyboard-accessible `AppNavigation`
Verification: `pnpm run test -- src/components/layout/app-shell.test.tsx src/app/page.test.tsx && pnpm run typecheck`
Dependencies: T-002, T-007, T-010

### T-013: Implement dashboard overview page
Goal: Present today progress, selected-week completion, missed count, streak, motivation, compact quest board, and both progress previews from canonical read models.
Files:
  - Modify: `src/app/dashboard/page.tsx:1`
  - Create: `src/components/dashboard/dashboard-overview.tsx`
  - Create: `src/components/dashboard/motivation-card.tsx`
  - Modify: `src/components/dashboard/metric-card.tsx:1`
  - Modify: `src/data/motivation-messages.ts:1`
  - Test: `src/components/dashboard/dashboard-overview.test.tsx`
  - Test: `src/app/dashboard/page.test.tsx`
Interfaces:
  - Consumes: `useTracker()` and selectors from T-007; `buildThirtyDayProgress()` and `buildSelectedWeekHabits()` from T-008; chart renderers from T-010; `MotivationMessage[]`
  - Produces: `DashboardOverview`; local-first `DashboardPage`; `selectMotivationMessage(messages: readonly MotivationMessage[], record: DailyRecord, date: ISODateString): MotivationMessage`
Verification: `pnpm run test -- src/components/dashboard/dashboard-overview.test.tsx src/app/dashboard/page.test.tsx && pnpm run typecheck`
Dependencies: T-008, T-012

### T-014: Implement weekly tracker page
Goal: Deliver the full Monday–Sunday quest board with date navigation, keyboard habit toggles, daily summaries, and selected-day reflection/detail.
Files:
  - Modify: `src/app/tracker/page.tsx:1`
  - Create: `src/components/tracker/weekly-quest-board.tsx`
  - Create: `src/components/tracker/week-navigation.tsx`
  - Test: `src/components/tracker/weekly-quest-board.test.tsx`
  - Test: `src/app/tracker/page.test.tsx`
Interfaces:
  - Consumes: `WeekSummary`, `Habit[]`, `TrackerStoreApi` from T-007; `SelectedDayDetail` from T-011; date helpers from T-003
  - Produces: `WeeklyQuestBoard({ weekStart }: { weekStart: ISODateString })`; `WeekNavigation`; `TrackerPage`
Verification: `pnpm run test -- src/components/tracker/weekly-quest-board.test.tsx src/app/tracker/page.test.tsx && pnpm run typecheck`
Dependencies: T-011, T-012

### T-015: Implement calendar page
Goal: Deliver a six-week month grid with keyboard date navigation, status labels, today/selected distinctions, and selected-day detail.
Files:
  - Modify: `src/app/calendar/page.tsx:1`
  - Modify: `src/components/calendar/calendar-view.tsx:1`
  - Create: `src/components/calendar/month-grid.tsx`
  - Test: `src/components/calendar/month-grid.test.tsx`
  - Test: `src/app/calendar/page.test.tsx`
Interfaces:
  - Consumes: `buildMonthGrid()` from T-003; `DailyRecord[]` and selected-date actions from T-007; `SelectedDayDetail` from T-011
  - Produces: `MonthGrid({ selectedDate }: { selectedDate: ISODateString })`; `CalendarView`; `CalendarPage`
Verification: `pnpm run test -- src/components/calendar/month-grid.test.tsx src/app/calendar/page.test.tsx && pnpm run typecheck`
Dependencies: T-011, T-012

### T-016: Implement habit configuration page
Goal: Add, edit, reorder, activate/deactivate, describe, and weight habits while preserving stable IDs and validating non-negative scores.
Files:
  - Modify: `src/app/habits/page.tsx:1`
  - Modify: `src/components/habits/habit-config-panel.tsx:1`
  - Create: `src/components/habits/habit-editor-row.tsx`
  - Modify: `src/features/habits/index.ts:1`
  - Test: `src/components/habits/habit-config-panel.test.tsx`
  - Test: `src/app/habits/page.test.tsx`
Interfaces:
  - Consumes: `Habit`, `HabitConfig`, habit actions from `TrackerStoreApi` in T-007; accessible UI primitives
  - Produces: `HabitConfigPanel`; `HabitEditorRow`; `validateHabitConfig(config: HabitConfig, existing: readonly Habit[]): HabitValidationResult`; `HabitsPage`
Verification: `pnpm run test -- src/components/habits/habit-config-panel.test.tsx src/app/habits/page.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-012

### T-017: Implement settings page
Goal: Edit timezone, start/selected date, tracking horizon, completion target, and theme while explaining local-only storage and safely clearing data.
Files:
  - Modify: `src/app/settings/page.tsx:1`
  - Create: `src/components/theme/theme-preview.tsx`
  - Create: `src/components/feedback/confirm-reset-dialog.tsx`
  - Create: `src/components/layout/settings-form.tsx`
  - Test: `src/components/layout/settings-form.test.tsx`
  - Test: `src/app/settings/page.test.tsx`
Interfaces:
  - Consumes: `TrackerSettings`, settings/reset actions from T-007; `THEMES` from T-009; `ThemeSwitcher` and `notify()` from T-010
  - Produces: `SettingsForm`; `ThemePreview`; `ConfirmResetDialog`; `validateTrackerSettings(settings: TrackerSettings): SettingsValidationResult`; `SettingsPage`
Verification: `pnpm run test -- src/components/layout/settings-form.test.tsx src/app/settings/page.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-009, T-012

### T-018: Verify integrated Phase 1 flows
Goal: Prove daily check-in, weekly/calendar navigation, configuration, theme behavior, local reload persistence, architecture boundaries, accessibility, and production build as one release gate.
Files:
  - Create: `tests/e2e/daily-check-in.spec.ts`
  - Create: `tests/e2e/local-persistence.spec.ts`
  - Create: `tests/e2e/keyboard-navigation.spec.ts`
  - Create: `tests/e2e/theme-contract.spec.ts`
  - Create: `docs/phase-1-verification.md`
Interfaces:
  - Consumes: all Phase 1 pages, `StorageAdapter`, canonical domain outputs, four `ThemeDefinition` values
  - Produces: verified browser flows; captured command results; documented manual keyboard/reduced-motion/contrast checks
Verification: `pnpm install --frozen-lockfile && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run test:e2e && pnpm run build`
Dependencies: T-013, T-014, T-015, T-016, T-017
