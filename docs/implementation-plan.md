# BetterMe Phase 1 Implementation Plan

## Goal

Deliver a local-first, themeable BetterMe web app that preserves legacy score/streak behavior while replacing spreadsheet mechanics with pure domain modules, accessible web flows, and a replaceable persistence adapter.

## Phase 0 — Establish an executable baseline

**Goal:** Turn the unversioned partial prototype into a reproducible pnpm/Next.js/TypeScript test environment without allowing auth/Supabase code into the canonical Phase 1 dependency graph.

**Dependencies:** Repository audit, this plan, and a valid Git repository restored or initialized with explicit user approval before `using-git-worktrees` runs.

**Work:** Establish manifest/lock/config/test tooling at the architecture floors; add an import-boundary test; decide prototype files one by one through characterization rather than deletion; make the root route local-first.

**Verification gate:** Clean install from lockfile, strict type-check, boundary test, and a minimal Next build/type-check succeed without Supabase environment variables.

**Acceptance criteria:**

- pnpm is established by a committed lockfile.
- Canonical modules do not import prototype auth/server/database modules.
- The app can type-check without login or remote credentials.
- Existing files are preserved until a tested migration explicitly replaces them.

## Phase 1 — Pure domain foundation

**Goal:** Implement timezone/date, scoring/status/missed-habit, streak, weekly summary, and chart-data transforms from canonical types.

**Dependencies:** Phase 0.

**Work:** Follow red-green-refactor for date/week boundaries, score edge cases, target thresholds, planned/pre-start dates, chronological streak resets, weekly aggregates, 30-day series, and selected-week habit rates.

**Verification gate:** Focused unit suites pass in multiple timezones and have no React/Next/browser imports.

**Acceptance criteria:**

- Legacy formulas and Monday-week behavior match `docs/data-model.md`.
- The clock and timezone are injectable.
- Derived values are deterministic and renderer-neutral.
- Zero active weight, threshold equality, future dates, pre-start dates, and missing entries are covered.

## Phase 2 — Persistence and client state

**Goal:** Persist only source data through swappable adapters and expose typed actions/selectors to feature containers.

**Dependencies:** Phases 0–1.

**Work:** Implement validation/migration, memory and local adapters, seeded defaults, reducer actions, hydration, serialized saves, retryable degraded state, and memoized read-model selectors.

**Verification gate:** Adapter contract tests run against memory and browser-local implementations; reducer/store tests prove reload persistence and save-failure recovery.

**Acceptance criteria:**

- `BetterMeData` is the sole persisted root.
- Domain and components never access `localStorage` directly.
- Corrupt data is distinguishable from an empty dataset.
- UI state updates optimistically without losing retry information.

## Phase 3 — Theme and accessible UI foundation

**Goal:** Implement the complete theme contract and shared interaction/feedback primitives before product screens.

**Dependencies:** Phases 0 and 2; chart color validation also consumes Phase 1 chart types.

**Work:** Define four themes, validate token completeness/contrast, compile semantic CSS variables, implement provider/switcher, theme-aware Sonner wrapper, chart renderer shells, app layout/navigation, and shared empty/error/loading states.

**Verification gate:** Theme schema and contrast tests pass for all four definitions; component tests cover keyboard focus, reduced motion, and semantic-token-only styling.

**Acceptance criteria:**

- Every theme supplies every contract category.
- No product component contains raw theme literals.
- Toasts and charts resolve semantic theme tokens.
- Focus, contrast, and reduced-motion requirements pass automated checks plus manual keyboard review.

## Phase 4 — Product flows and screens

**Goal:** Build the daily/weekly loop and all six Phase 1 routes from the shared store and domain read models.

**Dependencies:** Phases 1–3.

**Work:** Implement entry routing, dashboard, tracker/selected-day/reflections, calendar, habit configuration, settings, motivation, and responsive navigation in the dependency order in `docs/task-breakdown.md`.

**Verification gate:** Each page has a focused interaction/accessibility suite; one end-to-end flow completes habits and reflections, and another proves persistence after reload.

**Acceptance criteria:**

- The dashboard communicates today, selected week, missed habits, streak, motivation, and progress.
- The tracker supports keyboard/pointer daily and weekly updates.
- Calendar, habits, and settings update the same canonical dataset.
- All pages have loading, empty, planned, pre-start, validation, and storage-error behavior where relevant.

## Phase 5 — Integrated verification and release readiness

**Goal:** Prove architectural, functional, accessibility, and build integrity without expanding Phase 1 scope.

**Dependencies:** Phases 0–4.

**Work:** Run the full unit/component/end-to-end suite, strict type-check, lint, production build, import-boundary check, theme contrast scan, keyboard/manual flow checklist, and cross-timezone fixtures.

**Verification gate:** Every command is rerun from a clean dependency install and current outputs are captured before completion is claimed.

**Acceptance criteria:**

- All automated gates pass.
- Legacy scoring/streak fixtures match expected results.
- No auth/backend/social dependency is required.
- No raw theme values exist in components.
- Known non-blocking limitations are documented with owners and future task candidates.

## Open questions and risks

These are explicitly logged rather than left as placeholders:

1. **Prototype disposition:** Some existing UI may be reusable, but it is coupled to Supabase types and missing `dashboard-client.tsx`. Default: quarantine it behind the import-boundary test, then adapt only pieces whose characterization tests make reuse cheaper than replacement.
2. **Exact dependency pins:** No manifest/lockfile exists, so versions cannot be audited today. Default: Phase 0 selects current mutually compatible stable releases satisfying the documented floors, records the decision, and commits the pnpm lockfile; no floating ranges in CI.
3. **Root scaffold verification:** This planning session can verify isolated canonical TypeScript stubs, but the pre-existing Next app cannot production-build without its missing manifest/dependencies/component. Default: treat Phase 0’s clean Next build as the first implementation gate, not as evidence to add business logic during planning.
4. **Local-only durability:** Browser storage can be cleared and does not synchronize devices. Default: explain this in settings and retain a future export/remote-adapter seam; export itself is not automatically promoted into Phase 1.
5. **Timezone library edge cases:** DST does not affect Bangkok but the setting permits other zones. Default: unit-test spring/fall transitions and week boundaries in at least one DST-observing zone before the date module is accepted.
6. **Theme font delivery:** Theme-specific web fonts can create privacy, performance, or offline tradeoffs. Default: use system/local fallback stacks until a font-loading decision meets performance and licensing requirements.
7. **Git metadata is absent:** The current `.git/` directory is empty, so commits and worktrees cannot run. Default: stop before implementation and obtain explicit user approval to restore or initialize Git; do not hide `git init` inside T-001.

## Superpowers Compliance Notes

### Invoked in this planning session

- `using-superpowers`: read first to bootstrap skill discovery and precedence.
- `brainstorming`: used in the user-directed self-answered batch mode. Context exploration, scope assessment, alternatives, design, and self-review are recorded in `docs/product-spec.md`; live approval and commit gates were superseded by the session brief.
- `writing-plans`: used after the design was resolved. Its small-task, exact-path, explicit-interface, per-task-verification, scope, and self-review conventions drive `docs/task-breakdown.md`; the requested deliverable paths supersede the skill’s default paths.
- `verification-before-completion`: invoked only at the final gate after docs and scaffold exist.

### Explicitly deferred

- After the Git prerequisite is satisfied, the next implementation session starts with `using-git-worktrees` to isolate work, then consumes this existing plan rather than rewriting product scope.
- Each implementation task uses `test-driven-development`.
- Execution uses `subagent-driven-development` when delegation is requested/available, or `executing-plans` for inline checkpointed execution.
- `requesting-code-review` runs after implementation milestones, not in this planning/scaffolding session.
- `finishing-a-development-branch` runs only after all implementation verification passes.

No implementation skill, worktree, branch, commit, or code-review pass is invoked in this session.
