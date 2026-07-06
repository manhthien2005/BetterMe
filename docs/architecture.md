# BetterMe Phase 1 Architecture

> **Status (updated 2026-07-06): ROADMAP, not current code.** The "canonical Phase 1" scaffold described below (pure-domain `src/lib/scoring`, `src/lib/storage`, `src/store`, `src/features/*`, `src/charts`, `src/themes`, `src/styles/**`, canonical `src/types`, etc.) was **removed** in the 2026-07-06 repo cleanup because every module was an unwired `throw new Error("not implemented")` stub. The application that actually ships today is **Supabase auth + a localStorage-backed dashboard**: `src/app/**` routes, `src/components/dashboard/{dashboard-client,dashboard-data}.tsx` (renders from `localStorage`, key `betterme.dashboard.v1`), and the Supabase backend under `src/lib/{server,supabase,tracker,types,defaults,date,utils}.ts` (implemented; only `ensureUserBootstrap` is wired — the CRUD actions await a future dashboard-to-Supabase wiring task). Treat the sections below as the intended target architecture to build toward, not a description of the present tree. See `docs/superpowers/specs/2026-07-06-repo-cleanup-rearchitecture-design.md`.

## Architecture outcome

Phase 1 is a local-first Next.js App Router application organized around pure domain functions, typed source data, derived read models, a reusable Playful Soft-Bento dashboard, and a replaceable persistence adapter. Existing Supabase/auth code remains a preserved prototype until a planned reconciliation task; it is not a dependency of the canonical Phase 1 path.

## Global constraints

- Runtime floor: Node.js 20.9 or newer.
- Framework floor: Next.js 15 with App Router and React 19.
- Language floor: TypeScript 5.7 with `strict` enabled and no unchecked business-domain `any`.
- Package manager: establish pnpm and commit `pnpm-lock.yaml` in the first implementation task because no lockfile currently exists.
- Repository prerequisite: before `using-git-worktrees` or T-001, restore or initialize a valid Git repository with explicit user approval; the current `.git/` directory is empty and unusable.
- Dependency rule: prefer existing prototype choices when suitable; add only `date-fns`, `date-fns-tz`, Recharts, and Zod for uncovered Phase 1 needs.
- Naming rule: kebab-case filenames, PascalCase React exports/types, camelCase functions/fields, and IANA timezone/ISO `YYYY-MM-DD` date values at module boundaries.
- Component rule: components consume semantic CSS variables only; raw theme values never appear in component files.
- Dashboard rule: all themes preserve the same Bento information architecture; theme files may change palette, typography, radius, illustration, icon accents, card decoration, chart styling, toast styling, and motion character only through semantic tokens.
- Domain rule: scoring, streak, date, and chart transforms are pure TypeScript and do not import React, Next.js, browser APIs, or persistence implementations.
- Persistence rule: store source inputs only; recompute derived records and summaries.
- Integration rule: Weather, Spotify, and Google Calendar remain widget/event interface seams in Phase 1; no production network integration, auth scope, or remote sync is required.
- Scope rule: no login, required backend, multi-user ownership, or social feature in Phase 1.

## Canonical module boundaries

| Path | Responsibility | May depend on |
|---|---|---|
| `src/types/` | Canonical shared contracts, persisted schema, adapter and theme types | Nothing runtime |
| `src/data/` | Typed defaults and motivation seed data | `src/types/` |
| `src/lib/scoring/` | Pure score, status, missed-habit, and streak calculations | `src/types/` |
| `src/lib/date/` | Pure timezone-aware date keys, Monday weeks, ranges, and month grids | `src/types/`, date libraries |
| `src/lib/storage/` | `StorageAdapter`, browser local adapter, memory adapter, schema validation/migration | `src/types/`, Zod at boundary |
| `src/lib/utils/` | Small framework-agnostic utilities not owned by another domain | `src/types/` when needed |
| `src/charts/` | Pure `DailyRecord`/`WeekSummary` to `ChartData` transformations | `src/types/`, `src/lib/date/` |
| `src/themes/` | Four typed `ThemeDefinition` objects and theme lookup/validation | `src/types/` |
| `src/styles/tokens/` | Raw-token and semantic-variable CSS declarations | Theme contract |
| `src/styles/themes/` | CSS variable output for each theme | Token CSS |
| `src/store/` | Client reducer, actions, selectors, hydration, adapter coordination | Domain/date/storage/themes/types |
| `src/hooks/` | Narrow client hooks exposing store selectors/actions | `src/store/`, `src/types/` |
| `src/features/dashboard/` | Dashboard summary, Bento section selectors, calendar visualization, widget registry, and analytics read-model assembly | Store/date/scoring/charts/types |
| `src/features/events/` | Internal BetterMe event read models and future calendar-source mapping boundary | Store/date/types |
| `src/features/tracking/` | Daily/weekly tracking orchestration and read-model assembly | Domain/date/store/types |
| `src/features/habits/` | Habit configuration orchestration | Store/types |
| `src/features/scoring/` | Score/status presentation orchestration, not formulas | Scoring/types |
| `src/features/reflections/` | Reflection editing orchestration | Store/types |
| `src/components/ui/` | Accessible generic primitives | Semantic tokens, Radix where useful |
| `src/components/layout/` | Server-friendly app shell/navigation | UI primitives |
| `src/components/dashboard/` | Soft-Bento dashboard shell, hero, calendar card, today's habits card, upcoming events, analytics, and section composition | Dashboard/tracking/event/widget read models/UI |
| `src/components/widgets/` | Reusable dashboard widget slots and compact Weather/Spotify state-only renderers | Dashboard widget types/UI |
| `src/components/tracker/` | Quest board, daily controls, selected-day detail | Tracking/reflection hooks/UI |
| `src/components/calendar/` | Month grid and date selection | Date/tracking hooks/UI |
| `src/components/habits/` | Habit editor and ordering controls | Habit hooks/UI |
| `src/components/charts/` | Client-only Recharts renderers accepting `ChartData` | Recharts/types/theme CSS vars |
| `src/components/theme/` | Theme provider/switcher and semantic-variable application | Themes/store/types |
| `src/components/feedback/` | Theme-aware toast and empty/error states | Sonner/UI/theme CSS vars |
| `src/app/` | Route composition, metadata, server shells, route-level loading/error UI | Components/features only |
| `public/` | Static/PWA assets; existing manifest retained | None |

Route ownership inside `src/app/` is explicit: `src/app/dashboard/` composes the Bento dashboard shell, Greeting Hero, calendar card, today's habits, widgets, upcoming events, and analytics read models; `src/app/tracker/` composes weekly and selected-day tracking, `src/app/calendar/` composes month navigation and selected-day detail, `src/app/habits/` composes habit configuration, and `src/app/settings/` composes tracker/theme/local-data settings. The existing `src/app/login/` and `src/app/auth/` routes belong only to the prototype compatibility boundary below.

## Existing prototype compatibility boundary

The following existing paths are documented exceptions, not canonical dependencies: `src/lib/types.ts`, `src/lib/tracker.ts`, `src/lib/date.ts`, `src/lib/defaults.ts`, `src/lib/optimistic.ts`, `src/lib/server/`, `src/lib/supabase/`, `src/components/auth/`, `src/app/login/`, `src/app/auth/`, `src/middleware.ts`, and `supabase/`. They currently mix domain, auth, remote persistence, and UI assumptions. Implementation begins with characterization tests and migration decisions; canonical Phase 1 modules must not import from these paths.

The existing `src/components/query-provider.tsx` and implemented dashboard/UI files are likewise prototype presentation code. Reusable visual primitives may be adapted only after they consume canonical types and semantic tokens. `src/app/dashboard/page.tsx` currently imports a missing `dashboard-client.tsx`; the dashboard shell task resolves that without reviving authentication scope.

## Client and server component strategy

App Router pages and the outer application shell remain Server Components by default. They render static structure, navigation, metadata, and stable explanatory copy. One narrow client provider hydrates the local dataset after mount and exposes reducer state/actions; interactive feature containers, theme switching, toasts, calendar controls, habit controls, and chart renderers are Client Components.

Client boundaries should sit at feature leaves rather than at the root layout wherever context permits. Chart data is computed before it reaches a renderer; Recharts components receive only `ChartData`. No Server Action is required for Phase 1 because the canonical adapter is browser-local.

## State and data flow

1. A server page renders a route shell and an explicit hydration fallback.
2. The client store calls `StorageAdapter.load()` once. Missing data is seeded; invalid data is validated/migrated or reported and safely replaced.
3. Source state contains `Habit[]`, `HabitCompletionEntry[]`, `ReflectionEntry[]`, and `TrackerSettings`.
4. Pure selectors call date/scoring functions to produce `DailyRecord[]`, `ScoreSummary`, `WeekSummary`, `CalendarDayVisualization[]`, `UpcomingEvent[]`, `DashboardSummary`, dashboard widget state, and chart transforms.
5. A UI action dispatches a typed reducer action. The UI updates immediately; a serialized adapter save follows.
6. A failed save leaves the in-memory state intact, marks persistence degraded, and exposes retry through a themed error toast.

React context plus `useReducer` is sufficient for the modest single-user state. Selectors remain pure and memoizable. Zustand/Redux would add a second state abstraction without a demonstrated scale need, and TanStack Query’s cache model is unnecessary while there is no remote server state.

Dashboard selectors assemble presentation-ready read models without mutating source data. `DashboardSummary` owns greeting/streak/progress summary text, `CalendarDayVisualization` owns proportional calendar fill state, `UpcomingEvent` owns event display rows, and `DashboardWidget` owns widget configuration/status. The selector layer may derive these from local BetterMe data and inert state-only adapters; it must not call production Weather, Spotify, or Google Calendar APIs in Phase 1.

## Persistence abstraction

`StorageAdapter` exposes `load(): Promise<BetterMeData | null>`, `save(data: BetterMeData): Promise<void>`, and `clear(): Promise<void>`. `LocalStorageAdapter` stores one versioned JSON envelope; `MemoryStorageAdapter` provides deterministic tests and mock sessions. Validation occurs only at adapter boundaries, and callers never reference `window.localStorage` directly.

Derived values are deliberately excluded from `BetterMeData`. This prevents stale score/streak/chart data after a habit weight, target, date, or timezone changes. A future remote adapter can satisfy the same contract or a repository-compatible extension without altering domain functions or presentational components.

`TrackerSettings.dashboardWidgets` is source preference data because enabled widgets and ordering are user choices. Widget runtime status, connection state, weather payloads, music playback state, event lists, calendar day visualizations, dashboard summaries, and chart outputs remain derived or adapter-provided read models and are not persisted in `BetterMeData`.

The planning-session `tsconfig.json` intentionally checks only the dependency-free canonical scaffold. T-001 replaces its include list with the standard project-wide Next.js entries (`next-env.d.ts`, `.next/types/**/*.ts`, `**/*.ts`, and `**/*.tsx`, excluding `node_modules`) before the first build gate. Architectural separation is then enforced by T-002’s import-boundary test, not by omitting source files from TypeScript.

## Library decisions

### Date handling: `date-fns` + `date-fns-tz`

The existing `src/lib/date.ts` uses local `Date` operations and does not honor the configured IANA timezone, so it is not sufficient. `date-fns` with `date-fns-tz` provides focused functions and explicit timezone conversion while keeping the domain API functional; Luxon offers a cohesive object model but adds a parallel date type and more runtime weight than the required day/week operations justify.

### Charts: Recharts

No chart library is established by a manifest. Recharts fits the modest declarative React charts and supports CSS-variable-driven colors through a thin client renderer; Chart.js is capable but introduces an imperative canvas lifecycle and additional wrapper concerns. Data transformation stays library-neutral so Recharts can be replaced without changing domain code. The dashboard progress trend supports 7D, 30D, and 90D periods from the same renderer-neutral `ChartData` contract.

### Toasts: Sonner

Sonner is already represented by `src/components/ui/toaster.tsx` and login feedback, so retaining it minimizes churn. A bespoke toast queue would require rebuilding focus, timing, stacking, and live-region behavior; React Hot Toast would duplicate an existing choice without a clear advantage. A wrapper maps semantic theme tokens and app error categories to Sonner.

### Accessible primitives: existing Radix UI choices

Existing UI files use Radix Slot, Checkbox, Dialog, Tabs, and Tooltip. Reusing those primitives preserves accessible interaction behavior while allowing BetterMe styling through semantic tokens; building dialogs/tooltips from scratch would add keyboard and focus-management risk. Only primitives actually used by a Phase 1 flow should be installed.

### Icons and class composition: Lucide, `clsx`, `tailwind-merge`, `class-variance-authority`

These choices already appear throughout the prototype and cover consistent icons plus variant/class composition. Replacing Lucide with emoji-only icons would weaken cross-platform consistency and accessible labeling, while a new icon suite would add duplication. Components must still express theme icon style through size, stroke, container, and motion tokens rather than hardcoded colors.

### Validation: Zod at trust boundaries only

Zod is proposed for parsing versioned local data, future imports, and adapter responses. Handwritten guards are lighter but become error-prone as nested theme/settings/storage shapes evolve; broad Zod use inside pure calculations would be unnecessary, so validated domain objects remain plain TypeScript values.

### Animation: CSS transitions and reduced-motion queries

No animation package is needed for card, checkbox, toast, and chart-entry motion. CSS custom properties plus `prefers-reduced-motion` cover the Phase 1 motion contract; Framer Motion would be justified only after interactions require orchestration, gestures, or shared-layout transitions.

### Local persistence: browser API behind an adapter

The Phase 1 dataset is small and transactional complexity is low, so direct `localStorage` behind `StorageAdapter` is the maintainable choice. Dexie/IndexedDB would improve scale and querying but introduce asynchronous schema/index management before it is needed. The adapter boundary preserves an upgrade path.

## Error handling

- Domain functions reject invalid negative weights and out-of-range target rates through typed validation at command boundaries.
- Adapter parsing produces a recoverable error category rather than leaking raw JSON exceptions.
- UI forms retain user input on save failure and announce errors through an `aria-live` toast plus inline message where correction is possible.
- Empty, pre-start, planned, loading, corrupt-storage, and save-degraded states are distinct; they never masquerade as a zero-score day.

## Future auth/backend/social extension path

The stable modules are `src/types/` domain entities (with additive ownership metadata in an API layer if needed), `src/lib/scoring/`, `src/lib/date/`, `src/charts/`, theme modules, and presentational components. They remain untouched.

A backend phase adds an authenticated `RemoteStorageAdapter` or repository layer under `src/lib/storage/`, server route/actions under `src/app/`, and mapping DTOs at that boundary. The store swaps adapter construction and gains sync/conflict state; domain inputs/outputs do not change. Auth wraps route access and adapter identity but does not enter scoring/date/components. Social features receive separate modules that consume published summaries or events; they do not add friend/group concepts to a private `DailyRecord`.

The preserved Supabase prototype may supply implementation ideas, schema migrations, or an adapter, but it must conform to these boundaries rather than becoming the boundary.
