# BetterMe Phase 1 Product Specification

## Product intent

BetterMe is a private, single-user self-improvement companion for planning a week, completing daily habits, reflecting honestly, and seeing progress without turning life into a spreadsheet. The dashboard direction is the approved Playful Soft-Bento Productivity Dashboard: warm, personal, modern, focused, lightly playful, spacious, and premium but friendly. It should be quick enough for a thirty-second check-in, useful enough for a weekly review, and expressive without becoming noisy.

## Scope assessment

BetterMe Phase 1 is one cohesive product and should use a single specification-to-plan cycle. The Bento dashboard, daily tracking, the weekly quest board, calendar selection, upcoming events, habit configuration, reflections, charts, motivation, and theming all read or update the same habit/settings/daily-record model; splitting them into independent sub-projects would create artificial integration boundaries and duplicate state decisions. Widget and future integration seams are planned as interfaces, not as production network features. Implementation remains phased and task-sized, but the product contract is unified.

## Assumptions & Resolved Questions

These are the questions the brainstorming workflow would normally ask one at a time. This batch session resolves them from the brief, legacy source, and repository audit.

### 1. Who is the Phase 1 user?

**Answer:** One person using one browser profile. There is no login, account ownership, household sharing, or cross-device guarantee in Phase 1.

### 2. What is the primary success moment?

**Answer:** The user opens BetterMe, understands today’s state immediately, checks or unchecks habits, writes a short reflection, and sees score/streak feedback without navigating through setup-heavy screens.

### 3. Is this one product or multiple independent sub-projects?

**Answer:** One cohesive product. All requested screens are coupled through the same dates, habits, records, settings, summaries, and theme contract.

### 4. Which architecture approach should be selected?

**Answer:** Select a local-first modular rebuild alongside the preserved prototype. Alternative A—retrofit the existing Supabase/auth implementation—would retain code but contradict Phase 1 scope and entangle components with server state. Alternative B—continue backend-first and hide login—would still make local development and domain tests depend on infrastructure. The selected approach makes pure domain functions and a storage adapter canonical, then permits a future Supabase adapter without changing components or calculations.

### 5. What persistence behavior is expected?

**Answer:** Use a `StorageAdapter` contract with a browser `localStorage` implementation and an in-memory mock for tests/stories. Persist source data and preferences after each intentional update; derived scores, streaks, summaries, and charts are recomputed. Include a schema version so migrations and a future backend adapter have an explicit seam.

### 6. How should timezone work?

**Answer:** Store an IANA timezone, defaulting to `Asia/Ho_Chi_Minh` to preserve the legacy tracker. All “today,” date-key, week, and calendar operations receive the timezone explicitly; components never calculate calendar boundaries directly.

### 7. What completion input model is used?

**Answer:** Boolean completion per habit per day. Habit weights remain configurable through non-negative `maxScore`; partial habit credit and numeric daily entry are out of scope.

### 8. What theme direction is canonical?

**Answer:** Ship four selectable light themes: Cute Cat, Study Corner, Modern Focus, and Minimal Calm. They share one full theme contract. Each changes semantic color, typography, radii, frames, icons, illustrations, background, motion, toasts, charts, empty states, widgets, calendar fills, and micro-interactions. All themes preserve the same dashboard information architecture. Dark-mode-compatible token structure is planned, but dark themes are not built in Phase 1.

### 9. Which library strategy should be used?

**Answer:** Reuse the prototype’s demonstrated choices where they serve Phase 1: Radix primitives for accessible interactions, Lucide for icons, Sonner for toasts, and `clsx` plus `tailwind-merge` for classes. Add `date-fns` plus `date-fns-tz` for explicit timezone-safe calendar operations, Recharts for the two modest React charts, and Zod only at persistence/import boundaries. Use React context/reducer and CSS transitions; do not add Zustand, Redux, Framer Motion, IndexedDB wrappers, or TanStack Query for the local-only Phase 1.

### 10. What should happen to the existing Supabase/login prototype?

**Answer:** Preserve it untouched during planning and treat it as non-canonical prototype code. A future implementation task must either adapt useful presentational pieces to the new interfaces or retire them with tests; auth/server/database modules must not leak into Phase 1 domain or component contracts.

### 11. How should future dates and dates before tracking starts behave?

**Answer:** Future dates are visible and may hold planning/reflection text, but have `Planned` status with no completion rate or streak. Dates before `startDate` are untracked with null derived status/rate/streak and disabled habit controls.

### 12. What errors need visible treatment?

**Answer:** Invalid configuration is rejected inline; storage read corruption falls back to seeded data after preserving a recoverable diagnostic path; storage write failure keeps the in-memory edit visible and shows a themed persistent-error toast with retry. Empty datasets use theme-aware empty states rather than zeros that imply tracked failure.

### 13. What testing confidence is required?

**Answer:** Pure scoring, streak, date/week, chart transforms, theme validation, and storage adapter behavior receive focused unit tests first. Page/component tasks add interaction and accessibility tests; the final Phase 1 gate adds one end-to-end daily check-in and one reload-persistence flow.

### 14. Is a visual companion needed during this planning batch?

**Answer:** No. The brief already fixes the four theme concepts and this session produces a UI-system contract rather than selecting between visual mockups. No unresolved visual comparison would benefit from opening a companion.

### 15. What dashboard information architecture is approved?

**Answer:** The dashboard uses a 12-column Soft-Bento layout. The first row is a full-width Greeting Hero with contextual greeting, date, motivational message, current streak, best streak, seven-day streak chain, and a contextual streak-protection message. The main desktop row allocates Calendar 4/12, Today's Habits 5/12, and Personal Widgets 3/12. The insight row allocates Upcoming Events 4/12 below the calendar and Analytics 8/12. Tablet uses an intentional two-column layout, and mobile orders sections as Greeting Hero, Today's Habits, Calendar, Upcoming Events, Personal Widgets, then Analytics.

### 16. What integration scope is allowed in Phase 1?

**Answer:** The dashboard plans a reusable widget registry and includes Weather and Spotify as initial widget types with loading, disconnected, permission-denied, unavailable, and error states. Phase 1 does not require production Weather, Spotify, or Google Calendar API integrations. Weather remains a concise daily-planning widget and Spotify behaves as a compact focus-music controller when connected later.

## User goals

- Know what to do today and how today is going at a glance.
- Complete habits from a daily or weekly context with minimal friction.
- Plan or review any date from a calendar.
- See concise upcoming events and personal widgets without turning the dashboard into an admin console.
- Capture a note, challenge, and tomorrow focus without opening a separate journal.
- Understand streaks, completion status, missed habits, and trends without interpreting raw tables.
- Adjust habits, weights, target rate, timezone, start date, and theme safely.
- Trust that data persists locally and that calculations remain consistent across screens.

## Core flows

1. **First run:** seed default habits and settings, choose the current date, show a short local-data explanation, and land on the dashboard.
2. **Daily check-in:** open the dashboard, read the greeting/streak context, toggle habits in the central Today's Habits surface, see score/status/streak update, write reflections from the detailed flow when needed, and receive restrained themed feedback.
3. **Weekly planning/review:** move between weeks, view all active habits across Monday–Sunday, plan future notes, and inspect daily statuses and missed items.
4. **Calendar review:** browse a month, identify status by accessible color-plus-label treatment, select a date, and open its detail.
5. **Habit configuration:** add, rename, reorder, activate/deactivate, describe, and weight habits while preserving historical references by stable ID/key.
6. **Progress review:** view dashboard analytics for 7D, 30D, and 90D periods, including completion trend, Good-day count, completed-habit total, most consistent habit, habit needing attention, and honest empty states.
7. **Personalization:** choose one of four themes; semantic tokens update the full experience, including charts and feedback.

## Screens and pages

- `/`: minimal entry route that leads to `/dashboard` without authentication.
- `/dashboard`: Playful Soft-Bento dashboard with Greeting Hero + streak, calendar day-progress visualization, central Today's Habits controls, reusable Personal Widgets, Upcoming Events, and Analytics.
- `/tracker`: full weekly quest board plus selected-day habit controls and reflection editor.
- `/calendar`: month grid and selected-day detail.
- `/habits`: habit configuration, ordering, activation, descriptions, and weights.
- `/settings`: timezone, start date, tracking horizon, target completion rate, theme, local data status, export/reset affordance planning.

Selected-day detail is a reusable component shown in tracker and calendar contexts, not a separate route in Phase 1.

## Phase 1 feature boundaries

Phase 1 includes the Playful Soft-Bento dashboard overview, Boolean daily tracking, Monday-based weekly planning, month calendar selection, selected-day detail, habit configuration, three reflection fields, dashboard analytics for 7D/30D/90D, weighted scoring, completion status, streaks, motivation messages, internal BetterMe upcoming events, reusable widget contracts with initial Weather and Spotify state-only connection states, four complete themes, and local/mock persistence behind an adapter.

Completion status uses the legacy labels exactly: `Good` at or above the configured target, `Okay` from 50% up to the target, `Bad` below 50%, and `Planned` for future dates. Dates before tracking starts have no status.

Phase 1 does not include remote synchronization, notifications, analytics telemetry, custom chart ranges beyond 7D/30D/90D, partial habit completion, recurring schedules by weekday, custom theme authoring, dark mode, data import from Google Sheets, production Weather/Spotify/Google Calendar API integrations, or production-grade export/reset unless promoted by a later approved scope decision.

## Explicitly out of scope

- Login and authentication
- Multi-user accounts and profiles
- Backend database or required network service
- Friend system
- Group streaks
- Social accountability
- Public sharing
- Promotional, referral, or growth features
- Production external integrations for Weather, Spotify, or Google Calendar

## Acceptance summary

- All screens use one canonical typed model and the same pure derivations.
- Core daily and weekly flows work with keyboard and pointer input.
- Refreshing restores source data and theme through the storage adapter.
- Score, status, missed habits, and streak match the legacy formulas exactly.
- The dashboard preserves the approved Bento hierarchy on desktop, tablet, and mobile.
- Calendar cells communicate completion through semantic status color plus proportional fill, never per-cell percentage text.
- No component contains timezone math, chart transformation, persistence calls, production integration calls, or hardcoded theme values.
- The four themes visibly affect every contract category, including charts, widgets, toasts, calendar states, and micro-interactions, while preserving the same information architecture.
