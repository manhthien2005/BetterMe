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

T-003 → T-008

T-001 → T-009 → T-010A

T-009 → T-010B

T-010A → T-010B

T-006 → T-010A

T-007 → T-011

T-010A → T-011

T-002 → T-012

T-007 → T-012

T-010A → T-012

T-012 → T-013A

T-008 → T-013A

T-010A → T-013A

T-013A → T-013B

T-008 → T-013B

T-013A → T-013C

T-008 → T-013C

T-011 → T-013D

T-013A → T-013D

T-013A → T-013E

T-007 → T-013E

T-013A → T-013F

T-008 → T-013F

T-010B → T-013G

T-013A → T-013G

T-008 → T-013G

T-011 → T-014

T-012 → T-014

T-011 → T-015

T-012 → T-015

T-007 → T-016

T-012 → T-016

T-007 → T-017

T-009 → T-017

T-012 → T-017

T-013B → T-018

T-013C → T-018

T-013D → T-018

T-013E → T-018

T-013F → T-018

T-013G → T-018

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
  - Consumes: `BetterMeData`, `StorageAdapter`, `DashboardWidgetConfig`; Zod at the serialized-data boundary; browser key `betterme:data`
  - Produces: `MemoryStorageAdapter implements StorageAdapter`; `LocalStorageAdapter implements StorageAdapter`; `parseBetterMeData(value: unknown): BetterMeData`; classified `StorageValidationError` and `StorageWriteError`
Acceptance criteria:
  - The schema accepts persisted `TrackerSettings.dashboardWidgets` configuration and rejects malformed widget IDs, duplicate orders, or unsupported widget types.
  - Runtime widget status, integration payloads, dashboard summaries, calendar visualizations, and chart data are not persisted.
  - Missing or corrupt settings remain recoverable through the same classified validation path as other source-data errors.
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
  - Consumes: `BetterMeData`, `StorageAdapter`, `Habit`, `TrackerSettings`, `DashboardWidgetConfig`, `ReflectionEntry`, `HabitCompletionEntry`; `buildDailyRecords()` and `summarizeWeek()` from T-005; adapters from T-006
  - Produces: `TrackerState`; `TrackerAction`; `trackerReducer(state: TrackerState, action: TrackerAction): TrackerState`; `TrackerStoreProvider`; `useTracker(): TrackerStoreApi`; selectors `selectDailyRecords(state): DailyRecord[]` and `selectSelectedWeek(state): WeekSummary`
Acceptance criteria:
  - Seeded settings include enabled Weather and Spotify widget configs in the Personal widget slot without connecting to external services.
  - Reducer actions preserve widget ordering as source preference data and never store widget runtime status.
  - Existing daily record and selected-week selectors remain deterministic after widget settings are added.
Verification: `pnpm run test -- src/store/tracker-reducer.test.ts src/store/tracker-store.test.tsx && pnpm run typecheck`
Dependencies: T-005, T-006

### T-008: Implement dashboard analytics and visualization transforms
Goal: Produce renderer-neutral dashboard summary, calendar cell visualization, analytics chart data, and habit-performance models without importing React or a chart renderer.
Files:
  - Modify: `src/charts/build-progress-chart.ts:1`
  - Modify: `src/charts/build-habit-chart.ts:1`
  - Modify: `src/charts/index.ts:1`
  - Create: `src/features/dashboard/dashboard-summary.ts`
  - Create: `src/features/dashboard/calendar-visualization.ts`
  - Create: `src/features/dashboard/analytics.ts`
  - Create: `src/features/dashboard/index.ts`
  - Test: `src/charts/chart-data.test.ts`
  - Test: `src/features/dashboard/dashboard-summary.test.ts`
  - Test: `src/features/dashboard/calendar-visualization.test.ts`
  - Test: `src/features/dashboard/analytics.test.ts`
Interfaces:
  - Consumes: `DailyRecord[]`, `Habit[]`, `ISODateString`, `AnalyticsPeriod`, `CompletionStatus`; `addDays()`, `getWeekStart()`, `getWeekEnd()` from T-003
  - Produces: `buildDashboardProgressTrend(records: readonly DailyRecord[], period: AnalyticsPeriod, selectedDate: ISODateString, today: ISODateString): ChartData`; `buildHabitPerformance(records: readonly DailyRecord[], habits: readonly Habit[], period: AnalyticsPeriod, selectedDate: ISODateString, today: ISODateString): ChartData`; `buildCalendarDayVisualizations(records: readonly DailyRecord[], today: ISODateString, selectedDate: ISODateString): CalendarDayVisualization[]`; `buildDashboardSummary(records: readonly DailyRecord[], habits: readonly Habit[], period: AnalyticsPeriod, selectedDate: ISODateString, today: ISODateString): DashboardSummary`
Acceptance criteria:
  - Calendar visualization sets `fillRatio` to `0`, partial rate, or `1` and keeps Good/Okay/Bad/Planned/no-data/today/selected states distinct.
  - Analytics supports exactly `7D`, `30D`, and `90D` periods and compares each period with the immediately preceding period.
  - Dashboard summary includes greeting text, motivational message input, current streak, best streak, seven-day streak chain, streak-protection copy, today's completed/total counts, average completion, Good days, total completed habits, most consistent habit, and habit needing attention.
  - No transform imports React, Next.js, Recharts, browser APIs, storage adapters, or production integration modules.
Verification: `pnpm run test -- src/charts/chart-data.test.ts src/features/dashboard/dashboard-summary.test.ts src/features/dashboard/calendar-visualization.test.ts src/features/dashboard/analytics.test.ts && pnpm run typecheck`
Dependencies: T-003, T-005

### T-009: Define and validate four dashboard-aware theme contracts
Goal: Supply complete Cute Cat, Study Corner, Modern Focus, and Minimal Calm definitions with semantic dashboard tokens and reject missing tokens or contrast failures.
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
Acceptance criteria:
  - Semantic tokens cover application background, surfaces, elevated surfaces, text hierarchy, borders, shadows, accent colors, Good/Okay/Bad/Planned states, focus rings, calendar empty/fill states, chart colors, widget states, toast states, radius, spacing, typography, and motion.
  - The four themes preserve the same dashboard information architecture and vary only palette, typography, radius, illustration, icon accents, card decoration, background texture, chart styling, toast styling, and motion character.
  - Component-facing CSS variables are semantic; no product component receives raw theme token names or literal theme colors.
  - `prefers-reduced-motion` removes decorative transforms and chart drawing effects while preserving visible state changes.
Verification: `pnpm run test -- src/themes/validate-theme.test.ts && pnpm run typecheck && pnpm run lint`
Dependencies: T-001

### T-010A: Implement theme runtime, card primitives, and feedback states
Goal: Apply the selected semantic theme and provide reusable Soft-Bento card, toast, empty, loading, and error primitives behind narrow client boundaries.
Files:
  - Modify: `src/components/theme/theme-provider.tsx:1`
  - Create: `src/components/theme/theme-switcher.tsx`
  - Modify: `src/components/feedback/themed-toaster.tsx:1`
  - Create: `src/components/feedback/empty-state.tsx`
  - Create: `src/components/feedback/error-state.tsx`
  - Create: `src/components/ui/bento-card.tsx`
  - Modify: `src/components/ui/card.tsx:1`
  - Test: `src/components/theme/theme-provider.test.tsx`
  - Test: `src/components/feedback/themed-toaster.test.tsx`
  - Test: `src/components/ui/bento-card.test.tsx`
Interfaces:
  - Consumes: `ThemeId`, `ThemeDefinition`; `THEMES` from T-009; `StorageAdapter` preference state from T-006
  - Produces: `ThemeProvider`; `useTheme(): ThemeContextValue`; `ThemeSwitcher`; `notify(intent: ToastIntent, message: string): void`; `BentoCard({ variant, interactive, children }: BentoCardProps)` with variants `default`, `soft`, `accent`, `illustrated`, `dark`, `compact`, and `interactive`; shared `EmptyState` and `ErrorState`
Acceptance criteria:
  - Card primitives consume only semantic CSS variables and expose only meaningful reusable variants.
  - Only interactive cards receive strong hover/elevation feedback; static dashboard sections stay calm.
  - Toasts expose success/info/warning/error intent styling through semantic tokens and accessible live-region behavior.
  - Empty, loading, error, disabled, and permission-related states have reusable visual primitives for dashboard sections and widgets.
Verification: `pnpm run test -- src/components/theme/theme-provider.test.tsx src/components/feedback/themed-toaster.test.tsx src/components/ui/bento-card.test.tsx && pnpm run typecheck`
Dependencies: T-006, T-009

### T-010B: Implement accessible theme-aware chart renderers
Goal: Render dashboard trend and habit-performance charts with Recharts while keeping data transformation outside React components.
Files:
  - Modify: `src/components/charts/progress-chart.tsx:1`
  - Create: `src/components/charts/habit-chart.tsx`
  - Create: `src/components/charts/chart-summary.tsx`
  - Test: `src/components/charts/chart-renderers.test.tsx`
Interfaces:
  - Consumes: `ChartData`; semantic chart CSS variables from T-009; card/feedback primitives from T-010A
  - Produces: `ProgressChart({ data }: { data: ChartData })`; `HabitChart({ data }: { data: ChartData })`; `ChartSummary({ data }: { data: ChartData })`
Acceptance criteria:
  - Line/area and horizontal bar renderers use semantic CSS variables for grid, axes, tooltip, cursor, series, point, and status colors.
  - 7D/30D/90D dashboard trend data renders through the same chart contract without hardcoded chart colors.
  - Every chart has an accessible textual summary or equivalent value list.
  - `prefers-reduced-motion` disables chart drawing animation without hiding data.
Verification: `pnpm run test -- src/components/charts/chart-renderers.test.tsx && pnpm run typecheck`
Dependencies: T-009, T-010A

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
  - Consumes: `DailyRecord`, `Habit[]`, `ReflectionEntry`, `TrackerStoreApi` from T-007; themed `notify()` from T-010A
  - Produces: `SelectedDayDetail({ date }: { date: ISODateString })`; `DailyTracker({ date }: { date: ISODateString })`; `ReflectionEditor({ entry }: { entry: ReflectionEntry | null })`
Verification: `pnpm run test -- src/components/tracker/selected-day-detail.test.tsx src/components/tracker/reflection-editor.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-010A

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
  - Consumes: `TrackerStoreProvider` from T-007; `ThemeProvider` and `ThemedToaster` from T-010A; route list `/dashboard`, `/tracker`, `/calendar`, `/habits`, `/settings`
  - Produces: `AppShell({ children }: { children: React.ReactNode })`; local-first `HomePage`; keyboard-accessible `AppNavigation`
Verification: `pnpm run test -- src/components/layout/app-shell.test.tsx src/app/page.test.tsx && pnpm run typecheck`
Dependencies: T-002, T-007, T-010A

### T-013A: Implement responsive dashboard Bento shell
Goal: Compose the dashboard page around the approved 12-column desktop Bento shell, tablet two-column layout, and mobile section order without implementing individual section internals.
Files:
  - Modify: `src/app/dashboard/page.tsx:1`
  - Create: `src/components/dashboard/dashboard-overview.tsx`
  - Create: `src/components/dashboard/dashboard-bento-shell.tsx`
  - Create: `src/components/dashboard/dashboard-section.tsx`
  - Modify: `src/components/dashboard/dashboard-skeleton.tsx:1`
  - Test: `src/components/dashboard/dashboard-bento-shell.test.tsx`
  - Test: `src/app/dashboard/page.test.tsx`
Interfaces:
  - Consumes: `useTracker()` and selectors from T-007; dashboard read models from T-008; `BentoCard` from T-010A; app shell from T-012
  - Produces: `DashboardOverview`; `DashboardBentoShell`; local-first `DashboardPage`; section slots `hero`, `calendar`, `todayHabits`, `widgets`, `upcomingEvents`, and `analytics`
Acceptance criteria:
  - Desktop allocation is Hero 12/12, Calendar 4/12, Today's Habits 5/12, Personal Widgets 3/12, Upcoming Events 4/12, Analytics 8/12.
  - Tablet uses a deliberate two-column layout and allows Personal Widgets to become a full-width horizontal row.
  - Mobile order is Greeting Hero, Today's Habits, Calendar, Upcoming Events, Personal Widgets, Analytics.
  - Dashboard loading, error, and degraded-storage states use shared primitives and do not cause horizontal overflow.
Verification: `pnpm run test -- src/components/dashboard/dashboard-bento-shell.test.tsx src/app/dashboard/page.test.tsx && pnpm run typecheck`; manually inspect desktop, tablet, and mobile viewport screenshots during T-018.
Dependencies: T-008, T-010A, T-012

### T-013B: Implement Greeting Hero and streak chain
Goal: Build the dashboard emotional hook with contextual greeting, date, motivation, current streak, best streak, seven-day chain, and streak-protection messaging.
Files:
  - Create: `src/components/dashboard/greeting-hero.tsx`
  - Create: `src/components/dashboard/streak-chain.tsx`
  - Modify: `src/data/motivation-messages.ts:1`
  - Test: `src/components/dashboard/greeting-hero.test.tsx`
  - Test: `src/components/dashboard/streak-chain.test.tsx`
Interfaces:
  - Consumes: `DashboardSummary`, `StreakDayIndicator`, `MotivationMessage[]`; `DashboardBentoShell` from T-013A
  - Produces: `GreetingHero({ summary }: { summary: DashboardSummary })`; `StreakChain({ days }: { days: readonly StreakDayIndicator[] })`; `selectMotivationMessage(messages: readonly MotivationMessage[], summary: DashboardSummary): MotivationMessage`
Acceptance criteria:
  - Hero shows contextual greeting, current date, motivational message, current streak, best streak, seven-day streak chain or weekly completion indicator, and one contextual streak-protection message.
  - Copy supports states such as protecting a streak, reaching a milestone, and starting a new streak today.
  - Theme variation may affect illustration, decoration, typography, and motion, but not information hierarchy.
  - Hero does not duplicate the Analytics section metrics.
Verification: `pnpm run test -- src/components/dashboard/greeting-hero.test.tsx src/components/dashboard/streak-chain.test.tsx && pnpm run typecheck`
Dependencies: T-008, T-013A

### T-013C: Implement dashboard calendar day-progress card
Goal: Render the dashboard calendar card with proportional day-completion cells, semantic status colors, today/selected/focus states, and monthly summary copy.
Files:
  - Create: `src/components/dashboard/dashboard-calendar-card.tsx`
  - Create: `src/components/dashboard/calendar-day-cell.tsx`
  - Create: `src/components/dashboard/month-summary.tsx`
  - Test: `src/components/dashboard/dashboard-calendar-card.test.tsx`
  - Test: `src/components/dashboard/calendar-day-cell.test.tsx`
Interfaces:
  - Consumes: `CalendarDayVisualization[]` from T-008; date helpers from T-003; `DashboardBentoShell` from T-013A
  - Produces: `DashboardCalendarCard`; `CalendarDayCell({ day }: { day: CalendarDayVisualization })`; `MonthSummary`
Acceptance criteria:
  - Cells communicate completion using semantic status color and proportional fill amount, with 0%, partial, and 100% states visually distinct.
  - Future dates use neutral planned styling; no-data dates use neutral outline; today and selected date have separate markers; focus and selected rings are distinct.
  - Percentages are not displayed inside every calendar cell; hover, focus, or selection reveals date, completed habits, total habits, completion percentage, and daily status.
  - The card shows concise monthly average completion, number of Good days, and previous-month comparison when data exists.
Verification: `pnpm run test -- src/components/dashboard/dashboard-calendar-card.test.tsx src/components/dashboard/calendar-day-cell.test.tsx && pnpm run typecheck`
Dependencies: T-008, T-013A

### T-013D: Implement Today's Habits dashboard surface
Goal: Build the visually central dashboard habit-completion surface with soft interactive list items and immediate feedback.
Files:
  - Create: `src/components/dashboard/todays-habits-card.tsx`
  - Create: `src/components/dashboard/today-habit-item.tsx`
  - Modify: `src/components/dashboard/habit-icon.tsx:1`
  - Test: `src/components/dashboard/todays-habits-card.test.tsx`
  - Test: `src/components/dashboard/today-habit-item.test.tsx`
Interfaces:
  - Consumes: `DailyRecord`, `Habit[]`, completion actions from `TrackerStoreApi` in T-007, selected-day controls from T-011, `DashboardBentoShell` from T-013A
  - Produces: `TodaysHabitsCard`; `TodayHabitItem`; dashboard actions `addHabit`, `openFullTracker`, and `toggleTodayHabit`
Acceptance criteria:
  - The card includes active habits, habit icon, habit name, lightweight category or schedule metadata, completion control, completed/total count, daily completion progress, add habit action, and open full tracker action.
  - Habits render as soft interactive list items, not spreadsheet rows.
  - Score weights are not prominently exposed on the dashboard.
  - Loading, no-habits, partially completed, all-completed, error, and disabled/inactive habit states are explicitly covered.
Verification: `pnpm run test -- src/components/dashboard/todays-habits-card.test.tsx src/components/dashboard/today-habit-item.test.tsx && pnpm run typecheck`
Dependencies: T-011, T-013A

### T-013E: Implement dashboard widget registry and state-only adapters
Goal: Provide a reusable widget registry, slot model, and compact Weather/Spotify state-only widgets without production external integrations.
Files:
  - Create: `src/features/dashboard/widget-registry.ts`
  - Create: `src/components/widgets/widget-slot.tsx`
  - Create: `src/components/widgets/weather-widget.tsx`
  - Create: `src/components/widgets/spotify-widget.tsx`
  - Create: `src/components/dashboard/personal-widgets-card.tsx`
  - Test: `src/features/dashboard/widget-registry.test.ts`
  - Test: `src/components/widgets/widget-slot.test.tsx`
  - Test: `src/components/dashboard/personal-widgets-card.test.tsx`
Interfaces:
  - Consumes: `DashboardWidgetDefinition`, `DashboardWidgetConfig`, `DashboardWidget`, `WidgetSlot`, `IntegrationConnectionState`, and `TrackerSettings.dashboardWidgets`; `DashboardBentoShell` from T-013A
  - Produces: `WidgetRegistry`; `registerDashboardWidget(definition: DashboardWidgetDefinition): void`; `getDashboardWidgets(config: readonly DashboardWidgetConfig[]): DashboardWidget[]`; `WidgetSlot`; `WeatherWidget`; `SpotifyWidget`; `PersonalWidgetsCard`
Acceptance criteria:
  - Dashboard layout is not hardcoded around exactly Weather and Spotify.
  - Weather remains concise and useful for daily planning.
  - Spotify behaves as a compact focus-music controller, not a full music application.
  - Disconnected, loading, permission-denied, unavailable, and error states are represented without real Weather, Spotify, or Google Calendar API calls.
Verification: `pnpm run test -- src/features/dashboard/widget-registry.test.ts src/components/widgets/widget-slot.test.tsx src/components/dashboard/personal-widgets-card.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-013A

### T-013F: Implement Upcoming Events dashboard card
Goal: Show the nearest internal BetterMe events and preserve a future Google Calendar source boundary without changing the event UI.
Files:
  - Create: `src/features/events/build-upcoming-events.ts`
  - Create: `src/features/events/index.ts`
  - Create: `src/components/dashboard/upcoming-events-card.tsx`
  - Test: `src/features/events/build-upcoming-events.test.ts`
  - Test: `src/components/dashboard/upcoming-events-card.test.tsx`
Interfaces:
  - Consumes: `UpcomingEvent`, `EventCategory`, `EventSource`, `ISODateString`; selected date state from T-007; `DashboardBentoShell` from T-013A
  - Produces: `buildUpcomingEvents(events: readonly UpcomingEvent[], now: Date, selectedDate?: ISODateString): UpcomingEvent[]`; `UpcomingEventsCard`
Acceptance criteria:
  - Default behavior shows the nearest 3-5 events from the current time.
  - When a calendar date is selected, the card may switch to selected-date events and clearly labels that active date context.
  - Event rows show date/time, title, category, optional duration, and optional related habit.
  - Empty, loading, error, and no-events states are explicit.
Verification: `pnpm run test -- src/features/events/build-upcoming-events.test.ts src/components/dashboard/upcoming-events-card.test.tsx && pnpm run typecheck`
Dependencies: T-008, T-013A

### T-013G: Implement dashboard analytics Bento section
Goal: Render the wide Analytics section with summary metrics, period controls, completion trend chart, and habit performance without duplicating hero streak metrics.
Files:
  - Create: `src/components/dashboard/analytics-card.tsx`
  - Create: `src/components/dashboard/analytics-period-tabs.tsx`
  - Modify: `src/components/dashboard/metric-card.tsx:1`
  - Test: `src/components/dashboard/analytics-card.test.tsx`
  - Test: `src/components/dashboard/analytics-period-tabs.test.tsx`
Interfaces:
  - Consumes: `DashboardSummary`, `AnalyticsPeriod`, `ChartData` from T-008; `ProgressChart` and `HabitChart` from T-010B; `DashboardBentoShell` from T-013A
  - Produces: `AnalyticsCard`; `AnalyticsPeriodTabs`; dashboard summary metric presentation
Acceptance criteria:
  - Metrics include average completion rate, change from previous period, Good days, total completed habits, most consistent habit, and habit needing attention.
  - Period controls support exactly 7D, 30D, and 90D.
  - Completion trend uses a theme-aware line or area chart with restrained grid lines and accessible tooltips.
  - Habit performance uses readable horizontal progress bars or an equally clear visualization.
  - Current streak and best streak are not duplicated from the Greeting Hero.
Verification: `pnpm run test -- src/components/dashboard/analytics-card.test.tsx src/components/dashboard/analytics-period-tabs.test.tsx && pnpm run typecheck`
Dependencies: T-008, T-010B, T-013A

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
  - Consumes: `TrackerSettings`, settings/reset actions from T-007; `THEMES` from T-009; `ThemeSwitcher` and `notify()` from T-010A
  - Produces: `SettingsForm`; `ThemePreview`; `ConfirmResetDialog`; `validateTrackerSettings(settings: TrackerSettings): SettingsValidationResult`; `SettingsPage`
Verification: `pnpm run test -- src/components/layout/settings-form.test.tsx src/app/settings/page.test.tsx && pnpm run typecheck`
Dependencies: T-007, T-009, T-012

### T-018: Verify integrated Phase 1 flows and dashboard quality
Goal: Prove daily check-in, dashboard Bento behavior, weekly/calendar navigation, configuration, theme behavior, local reload persistence, architecture boundaries, accessibility, responsive behavior, visual/theme quality, and production build as one release gate.
Files:
  - Create: `tests/e2e/daily-check-in.spec.ts`
  - Create: `tests/e2e/dashboard-bento.spec.ts`
  - Create: `tests/e2e/local-persistence.spec.ts`
  - Create: `tests/e2e/keyboard-navigation.spec.ts`
  - Create: `tests/e2e/theme-contract.spec.ts`
  - Create: `docs/phase-1-verification.md`
Interfaces:
  - Consumes: all Phase 1 pages, dashboard subsections T-013A through T-013G, `StorageAdapter`, canonical domain outputs, four `ThemeDefinition` values
  - Produces: verified browser flows; captured command results; documented manual keyboard/reduced-motion/contrast/responsive/visual-theme checks
Acceptance criteria:
  - Desktop dashboard matches the 12-column allocation; tablet uses the planned two-column layout; mobile uses the approved section order with no horizontal overflow.
  - Greeting Hero, Calendar, Today's Habits, Personal Widgets, Upcoming Events, and Analytics each expose loading/empty/error or relevant disconnected states.
  - Keyboard focus order, focus rings, touch targets, chart summaries, calendar status/fill meaning, reduced-motion behavior, and screen-reader labels pass review.
  - All four themes affect charts, widgets, toasts, calendar states, and card personality while preserving information architecture.
  - Import-boundary checks confirm no auth, Supabase, social, production Weather, production Spotify, production Google Calendar, or analytics telemetry dependency is required.
Verification: `pnpm install --frozen-lockfile && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run test:e2e && pnpm run build`
Dependencies: T-013B, T-013C, T-013D, T-013E, T-013F, T-013G, T-014, T-015, T-016, T-017
