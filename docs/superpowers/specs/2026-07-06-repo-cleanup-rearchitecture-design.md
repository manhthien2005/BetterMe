# Repo Cleanup & Re-architecture Design

Date: 2026-07-06

## Goal

Remove dead code and stale infrastructure from the BetterMe repo and consolidate the remaining source around the application that actually ships, so the tree honestly reflects one coherent architecture instead of three overlapping ones.

## Problem: three overlapping layers

A transitive import-graph audit from every Next.js entrypoint (routes, `middleware.ts`, `src/remotion/index.ts`, and the test files) found that production code reaches only ~37 of ~85 `src/` files. The repo carries three layers:

1. **Live app (ships, tested).** Supabase auth (`/login`, magic link + `BETTERME_DEV_AUTH_BYPASS` dev bypass) and the dashboard route, which renders `dashboard-client.tsx` from `dashboard-data.ts` using **localStorage seed data** (`betterme.dashboard.v1`).
2. **Supabase backend (implemented, mostly unwired).** `src/lib/server/actions.ts`, `src/lib/tracker.ts`, `src/lib/server/mappers.ts`, `src/lib/supabase/*`, `supabase/schema.sql`. Only `ensureUserBootstrap` is wired (called by the dashboard route and the auth callback); the CRUD actions (`getTrackerSnapshot`, `toggleHabit`, `saveDayEntry`, `saveHabitConfig`, `setSelectedDate`, `signOut`) are complete but no page calls them yet.
3. **"Canonical Phase 1" scaffold (dead).** ~48 files under `src/types`, `src/lib/{scoring,storage,date/,utils/}`, `src/store`, `src/hooks`, `src/features/*`, `src/charts`, `src/themes`, `src/styles/**`, and placeholder components. Every function is a stub (`throw new Error("not implemented")` or `return null`). Nothing live imports any of it — it is a closed orphan subgraph kept alive only by one smoke test.

The audit also surfaced: module shadowing (`src/lib/date.ts` shadows `src/lib/date/index.ts`; `src/lib/utils.ts` shadows `src/lib/utils/index.ts`), a fully disconnected `src/styles/**` token/theme CSS layer (`globals.css` has no `@import`), unused dependencies, a Tailwind v3/v4 mix, and stray/misconfigured files.

## Approved direction

Per the project owner's decision, **delete layer 3 entirely** and consolidate around layers 1–2. The documented local-first design (in `docs/architecture.md`, `docs/data-model.md`, etc.) becomes a **future roadmap**, not current code. Layer 2 is kept because it is real, coherent backend infrastructure and the auth half is live; the dashboard-to-Supabase wiring gap is documented as a known follow-up rather than closed here (that is feature work, out of scope for cleanup).

## Scope

### Delete — dead scaffold (layer 3)
`src/types/index.ts`; `src/themes/index.ts`; `src/charts/` (index, build-habit-chart, build-progress-chart); `src/hooks/use-tracker.ts`; `src/store/tracker-store.ts`; `src/data/` (default-habits, motivation-messages); `src/features/` (tracking, scoring, reflections, habits); `src/lib/scoring/` (index, calculate-score, calculate-streak); `src/lib/storage/` (index, storage-adapter, memory-storage-adapter, local-storage-adapter); `src/lib/date/` (index, calendar); `src/lib/utils/index.ts`; `src/styles/tokens/*` and `src/styles/themes/*`; `src/components/{calendar,charts,theme,feedback,habits,layout,tracker}/*`.

### Delete — superseded prototype UI and orphans
`src/components/dashboard/{weekly-board,habit-icon,status-badge,metric-card,mini-calendar,dashboard-overview}.tsx`; `src/lib/optimistic.ts`; unused shadcn primitives `src/components/ui/{checkbox,badge,card,dialog,tabs,textarea}.tsx`.

### Delete — dead test, junk, stale config
`tests/smoke/toolchain.test.ts` (only asserts the deleted scaffold types resolve); `pnpm-workspace.yaml.2450187486` (stale near-duplicate); the already-deleted `betterme-codex-planning-prompt-FINAL.md`; the Playwright harness (`playwright.config.ts` points at a non-existent `tests/e2e`, zero e2e tests) and its `test:e2e` script + `@playwright/test` dep.

### Remove — unused dependencies
`dependencies`: `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `date-fns`, `date-fns-tz`, `recharts`, `zod`.
`devDependencies`: `@tailwindcss/postcss` (v4; unused — `postcss.config.mjs` uses bare `tailwindcss` v3), `@playwright/test`, `pg`, `@types/pg`.

### Fix — config & hygiene
`.gitignore`: add `.screenshots/` and `pnpm-workspace.yaml.*`. `.env.example`: add `BETTERME_DEV_AUTH_BYPASS=`. Remove empty directories left after deletion.

### Update — docs
`docs/architecture.md`: add a "Current state vs roadmap" banner clarifying that the canonical scaffold was removed and the sections below describe the future target. `docs/repo-audit.md`: mark as a superseded historical snapshot. Keep the other planning docs as roadmap.

## Kept (do not touch behavior)
The entire live path: `src/app/**` routes, `src/middleware.ts`, `src/components/dashboard/{dashboard-client,dashboard-data,dashboard-skeleton}.tsx`, `src/components/auth/login-form.tsx`, `src/components/ui/{button,input,skeleton,toaster,tooltip}.tsx`, `src/components/query-provider.tsx`, `src/lib/{utils,defaults,types,date,tracker,dev-auth}.ts`, `src/lib/server/{actions,mappers}.ts`, `src/lib/supabase/*`, `src/remotion/*`, `supabase/schema.sql`, `code.js` (legacy reference), all live tests, `docs/legacy-analysis.md`.

## Verification

- `pnpm typecheck` — clean (no errors).
- `pnpm test` — 18/19 pass; the single pre-existing dashboard failure (`'82%'` calendar-cell assertion) is unrelated to this change and must not regress further.
- `pnpm lint` — 0 errors (warnings drop as stub files with unused params are removed).
- `pnpm build` — succeeds.

## Out of scope

- Wiring the dashboard to the Supabase backend (feature work).
- Rewriting domain logic as pure functions (the deleted roadmap).
- Fixing the pre-existing brittle dashboard test.
- Deduplicating `lib/tracker.ts` vs `dashboard-data.ts` (blocked on the wiring decision above).
