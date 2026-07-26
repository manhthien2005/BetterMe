# AGENTS.md — BetterMe / "Nếp's Garden" (Vườn Có Bạn)

> **This file is the source of truth for AI-agent instructions.** When conventions change,
> update THIS file and `.kiro/` — do not scatter guidance elsewhere. Human handoff context
> lives in `HANDOFF.md`; product/behavior truth lives in `docs/` and `docs/superpowers/specs/`.
> Read the relevant spec before non-trivial work.

BetterMe is a **Vietnamese, cozy habit tracker with a raiseable pet companion** — local-first,
now growing a friends-only "Social Garden" layer (Duolingo-style, positive-only). It is a
**real product being shipped**: spec-driven, adversarially reviewed, test-enforced. Not a
prototype and not vibe coding. Be meticulous; match the existing style; verify before claiming done.

## 🚫 Two sacred invariants (test-enforced — never negotiate)
1. **No-guilt.** No copy or UI ever blames the user or compares them *downward* to anyone.
   Forbidden in pet/voice text: "thua", "kém hơn", "xếp cuối", shaming a missed day, guilt-trips.
   Enforced by `src/components/dashboard/pet-voice.test.ts`.
2. **No-decay.** Pet growth/bond only ever increases (Postgres triggers enforce it). The only
   decrease path is the `reset_companion` RPC. This does NOT apply to habit completions — an
   untick is a valid action and MUST sync. Never add a decay/penalty path.

Breaking either is a failure, not a tradeoff. If a request seems to require it, STOP and ask.

## Commands (pnpm only — never npm/yarn; Windows + PowerShell)
- Install: `pnpm install`
- **The 4 gates — all must pass before any commit:**
  `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`
- Dev server: `pnpm dev` (login bypass: set env `BETTERME_DEV_AUTH_BYPASS=true` — the string
  `"true"`, not `1`; when bypassed, sync/social are OFF by design — localStorage only)
- Single test file: `pnpm vitest run src/path/to/file.test.ts`
- NEVER run `pnpm build` while `pnpm dev` is running — they share `.next/`, and the
  production build corrupts the dev server's cache (manifest errors, 500s). Stop dev first,
  or restart it after the build.
- Remotion (logo video): `pnpm remotion` / `pnpm remotion:render`
- In shell calls, use PowerShell-safe commands — no `head`/`grep`/`|` unix pipes. Prefer the
  dedicated read/search tools over shell for reading and searching.

Current state: 467 tests green. Social Garden Phases 0–3 are all committed; auth is live
email+password with a signup OTP (see `docs/auth-email-config.md`). UI overhaul: **U0** (design
tokens, fonts, `ui/` primitives, four-space shell), **U1a** (habit model v3 + v2→v3 migration) and
**U1b** (habit editor, day view grouped by part of the day, archive screen) are all merged into
`main`; **U1c** (the sync contract speaks v3) is on branch `u1c-sync-v3` and needs
`supabase/schema.sql` applied to Supabase BEFORE the app deploys. See
`docs/superpowers/specs/2026-07-26-uiux-overhaul-design.md` §10 for what is left and `HANDOFF.md`
for progress and next steps.

## Stack
Next.js 15.5 (App Router) · React 19 · TypeScript 5.9 **strict** · Supabase (`@supabase/ssr`) ·
TanStack Query · Tailwind 3.4 + Radix + `class-variance-authority` · sonner (toasts) ·
lucide-react · Remotion 4 · Vitest + Testing Library (jsdom). Node ≥ 20.9, pnpm 11.7.

## Project map
- `src/app/**` — App Router routes. The four spaces live in the `(app)` route group
  (`/dashboard`, `/calendar`, `/nep`, `/friends`) behind one auth gate in `(app)/layout.tsx`;
  plus `/login` and `/auth/callback`. Server Components by default.
- `src/components/app/**` — the shell: `state-provider.tsx` (ALL app state + the sync engine,
  consumed via `useAppState()`), `app-shell.tsx` (nav rail / tab bar / global overlays),
  `nav-items.ts`, and one file per space (`today-page.tsx`, `calendar-page.tsx`, `nep-page.tsx`,
  `friends-page.tsx`).
- `src/components/ui/**` — design-token primitives: `button.tsx` (3 tiers), `card.tsx`, `chip.tsx`,
  `icon.tsx`, `nav-rail.tsx`, `bottom-tab-bar.tsx`.
- `src/components/dashboard/**` — the panels each space renders: `dashboard-data.ts` (pure state +
  pet economy), `todays-habits.tsx`, `calendar-panel.tsx`, `pet.tsx` / `pet-voice.ts` (companion +
  VN voice), `friends-card.tsx`, `garden-visit-overlay.tsx`, `sync-onboarding.tsx`.
- `src/lib/sync/**` — local-first sync engine (queue, shadow LWW, merge laws, importer, engine,
  and `payloads.ts` — the only place local state becomes a wire payload).
- `tests/schema-contract.test.ts` — reads `supabase/schema.sql` as text; the only gate on SQL,
  since CI has no database.
- `src/lib/server/**` — server actions (`sync-actions.ts`, `social-actions.ts`) + mappers.
- `src/lib/supabase/**` — SSR/browser clients + env helpers.
- `supabase/schema.sql` — full schema, RLS, and every RPC (idempotent; 4 banner sections: base / Phase 0 / Phase 1 / Phase 2).
- `docs/` + `docs/superpowers/specs/**` — specs are the source of truth for behavior.

## Conventions
- **Files** kebab-case; **React components/types** PascalCase; **functions/fields** camelCase.
  Import alias `@/*` → `src/*`. Dates: IANA timezone + ISO `YYYY-MM-DD` at module boundaries.
- **Server actions** (`"use server"`): NEVER redirect or throw. Every failure returns
  `{ ok: false, reason }`. Under dev-auth bypass (no session) they no-op with `reason: "no-session"`.
- **Supabase security**: RLS is owner-only by default; every cross-user read goes through a
  **SECURITY DEFINER RPC**. Writes to social tables go through RPCs, not direct table writes.
  Never weaken or disable RLS to "make it work". Schema is idempotent (`create ... if not exists`,
  `drop policy if exists`), with the shared `set_updated_at()` trigger pattern.
- **Pet economy** = append-only food **ledger**; the balance is *derived* (`deriveFoodBalance`),
  never stored and never merged. Treat `CompanionState.food` as a cache — recompute after any ledger change.
- **Sync merge laws** (`src/lib/sync/merge.ts`): monotonic `max()` for reward state (no-decay),
  per-cell LWW for habit completions (untick propagates), append-only ledgers for the economy,
  per-field LWW for pet name/species, tombstones for habit deletion. Seed/demo history
  (`date <= seedCutoverDate`) NEVER uploads.
- **The sync contract is v3 from U1c** (Amendment 2026-07-27 in the social spec). A log cell
  carries `value` + `completedAt` beside `done`; `done` stays the boolean truth, computed by the
  CLIENT with `isEntryComplete` because only the client knows the tracking rule — and it is what
  `refresh_my_summary` and `shared_rhythms` read. A habit carries all twelve v3 fields.
  LWW granularity is unchanged: one stamp per cell, one per habit, never per column.
- **A `DashboardHabit` becomes a wire payload ONLY through `habitSyncPayload()`**
  (`src/lib/sync/payloads.ts`), and a log cell only through `logSyncMutation()`. There are six
  call sites; a mapping hand-written at each is how a field ends up syncing on create but staying
  silent on edit. Wire optionals are explicit `null`, never `undefined` — an absent key lets the
  RPC fall back to its SQL default instead of clearing the column.
- **Enqueue a log by "did THIS CELL change?", never "did the day's completed count change?"** The
  latter silently drops every bit of partial progress. Anything that edits a habit's definition —
  including pause, archive and reorder — must push an upsert, and a reorder pushes BOTH habits
  that swapped.
- **Changing an RPC's signature means `drop function if exists <old signature>` first**, then
  re-`grant` the new one. `create or replace` with a different argument list OVERLOADS rather than
  replaces, and PostgREST's named-argument call then fails with 42725; the drop also removes the
  old grant, and a Postgres function defaults to `EXECUTE` for `PUBLIC`.
  `tests/schema-contract.test.ts` guards both — it reads `schema.sql` as text because CI has no DB.
  `PGRST202` is retryable on purpose: it means the deployed schema is behind the deployed app.
- **Domain purity**: scoring/date/economy are pure TypeScript — no React/Next/browser/persistence imports.
- **Habit model v3** (`habit-model.ts` + `habit-migration.ts`): a log cell is
  `{ value, completedAt? }` where `value` means check 0|1 · count units · duration minutes ·
  checklist bitmask. `DashboardDayRecord.entries` is the SOURCE OF TRUTH; `completions` is a
  DERIVED boolean cache (same pattern as `CompanionState.food` over the ledger) — only
  `setHabitEntry` and the migration may write it, and it is never merged as truth. Migration
  functions run on every load, so they must stay idempotent. `repeatDays` uses ISO weekday
  numbers (1 = Monday). `timesOfDay` is an ARRAY — a habit can sit in several parts of the day,
  and `"anytime"` is exclusive. `completedAt` is a local `"HH:mm"`, never a full timestamp.
  Storage key is `betterme.dashboard.v3`; v2/v1 are read-only fallbacks kept as rollback
  snapshots. The derived cache is written ONCE per cell and never re-derived on load — editing a
  target must not re-interpret finished days (spec §5.1). Increments go through
  `adjustHabitEntry`, which reads `stateRef`, so two taps in one React batch both land.
- **Design tokens** live in `src/app/globals.css` `:root` and are mapped in `tailwind.config.ts`
  as `var(--token)`. Colour is a role: `--action` is the ONLY primary/streak/link colour (max one
  primary button per region), `--success` is completion, `--alert` is the new-mail badge and
  nothing else. `--success` is a FILL — text uses `--success-ink` (the fill is 3.2:1, below AA).
  Never use a Tailwind opacity modifier on a token colour (`bg-action/10` cannot work with
  `var()`); add a token instead. Font fallbacks in `tailwind.config.ts` must be valid unquoted
  CSS identifier sequences — one bad name silently voids the whole utility.
  `src/app/design-tokens.test.ts` gates presence + AA contrast. The v2 palette
  (rice/matcha/sakura) is still in the config and retires surface by surface across U1–U4.
- Never assume a library is available — check `package.json` and existing imports first.
- Pure logic is unit-tested; components get interaction + accessibility tests. Tests are colocated `*.test.{ts,tsx}`.

## 🚫 Never touch / never do
- Never read, print, edit, or commit secrets: `.env`, `.env.local`, or any `.env.*`.
- Never weaken RLS, drop the no-decay trigger, or add a growth/bond decrease path.
- Never merge the derived food balance; never upload seed fiction.
- Never `git push --force`, `git reset --hard`, `git clean -f`, `rm -rf`, or run destructive SQL
  (`DROP`, `TRUNCATE`, `supabase db reset`). These are irreversible and hard-blocked.
- Never commit without all 4 gates green. Commit or push only when the user explicitly asks.

## Workflow
Spec-first for features (brainstorm → written plan → execute — use the skills). TDD for logic
(red → green → refactor). Debug systematically (root cause before fix; don't stack patches).
Before claiming done, run the gates and **cite the command output as evidence** — see the
`betterme-verification` skill. For risky parallel work, use git worktrees under `.worktrees/`.

## Skills (on-demand — `.kiro/skills/` + `.agents/skills/`)
- Project: `betterme-verification`, `supabase-schema-conventions`, `sync-engine`, `pet-voice-invariants`.
- Process (superpowers): brainstorming, writing-plans, executing-plans, test-driven-development,
  systematic-debugging, verification-before-completion, subagent-driven-development,
  requesting-code-review, receiving-code-review, using-git-worktrees, dispatching-parallel-agents.

## Security
This file and `.kiro/**` are an instruction channel an agent will follow — treat edits with
code-review rigor (it is part of the supply chain). Never expose a network endpoint/server
without flagging missing authentication. Trust model is documented in the social spec §0.7
(data is self-reported and local-first).
