# Repo Cleanup & Re-architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the dead "canonical Phase 1" scaffold and superseded prototype/junk, remove unused deps, fix config hygiene, and update docs so the tree reflects one coherent architecture (Supabase auth + localStorage dashboard, with the Supabase backend kept as documented infra).

**Architecture:** Deletion-and-consolidation, not new code. The live import graph (routes + `middleware.ts` + `src/remotion/index.ts` + tests) defines what is kept; everything unreachable is removed. Behavior of the live app must not change.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind v3, pnpm, Vitest.

## Global Constraints

- Do not change any live runtime behavior; the dashboard, login, and dev-auth bypass must work identically.
- Do not delete any file reachable from a Next.js entrypoint, `middleware.ts`, `src/remotion/index.ts`, or a live test.
- Keep the Supabase backend (`lib/server/actions.ts`, `lib/tracker.ts`, `lib/server/mappers.ts`, `lib/supabase/*`, `supabase/schema.sql`) even though its CRUD actions are not yet wired.
- Verify after each batch with `pnpm typecheck` and `pnpm test`; a green typecheck is the primary safety net for deletions.
- Do not commit; leave a coherent working tree for review.

---

### Task 1: Delete the dead scaffold, prototype UI, orphans, and junk

**Files:** delete the scaffold set, prototype-UI set, unused-primitive set, dead smoke test, and stray files listed in the design spec's Scope section.

- [ ] Delete scaffold: `src/types/`, `src/themes/`, `src/charts/`, `src/hooks/`, `src/store/`, `src/data/`, `src/features/`, `src/lib/scoring/`, `src/lib/storage/`, `src/lib/date/`, `src/lib/utils/`, `src/styles/`, and `src/components/{calendar,charts,theme,feedback,habits,layout,tracker}/`.
- [ ] Delete prototype UI + orphans: `src/components/dashboard/{weekly-board,habit-icon,status-badge,metric-card,mini-calendar,dashboard-overview}.tsx`, `src/lib/optimistic.ts`.
- [ ] Delete unused primitives: `src/components/ui/{checkbox,badge,card,dialog,tabs,textarea}.tsx`.
- [ ] Delete dead test + junk: `tests/smoke/toolchain.test.ts`, `pnpm-workspace.yaml.2450187486`.
- [ ] Confirm `betterme-codex-planning-prompt-FINAL.md` deletion (already removed on disk).
- [ ] Run `pnpm typecheck`. Expected: PASS (no dangling imports — every deleted file was only imported by another deleted file).

### Task 2: Remove unused dependencies and the Playwright harness

**Files:** Modify `package.json`; delete `playwright.config.ts`.

- [ ] Remove from `dependencies`: `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `date-fns`, `date-fns-tz`, `recharts`, `zod`.
- [ ] Remove from `devDependencies`: `@tailwindcss/postcss`, `@playwright/test`, `pg`, `@types/pg`.
- [ ] Remove the `test:e2e` script; delete `playwright.config.ts`.
- [ ] Run `pnpm install` to refresh `pnpm-lock.yaml`.
- [ ] Run `pnpm typecheck` and `pnpm test`. Expected: typecheck PASS; tests 18/19 (pre-existing dashboard failure only).

### Task 3: Config & hygiene fixes

**Files:** Modify `.gitignore`, `.env.example`.

- [ ] `.gitignore`: add `.screenshots/` and `pnpm-workspace.yaml.*`.
- [ ] `.env.example`: add `BETTERME_DEV_AUTH_BYPASS=` (documents the dev bypass the code reads).
- [ ] Remove empty directories left behind by Task 1.

### Task 4: Documentation updates

**Files:** Modify `docs/architecture.md`, `docs/repo-audit.md`.

- [ ] `docs/architecture.md`: prepend a "Current state vs roadmap" banner — the canonical Phase 1 scaffold was removed on 2026-07-06; the sections below describe the future target, not shipping code; the live app is Supabase auth + localStorage dashboard.
- [ ] `docs/repo-audit.md`: prepend a note marking it a superseded 2026-07-04 planning snapshot (its "package.json/.git do not exist" claims are no longer true).

### Task 5: Final verification

- [ ] `pnpm typecheck` — clean.
- [ ] `pnpm test` — 18/19 (only the pre-existing `'82%'` dashboard failure).
- [ ] `pnpm lint` — 0 errors.
- [ ] `pnpm build` — succeeds.
- [ ] Review `git status` for a coherent deletion set; do not commit.
