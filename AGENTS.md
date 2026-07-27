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

Current state: 574 tests green. Social Garden Phases 0–3 are all committed; auth is live
email+password with a signup OTP (see `docs/auth-email-config.md`). UI overhaul: **U0** (design
tokens, fonts, `ui/` primitives, four-space shell), **U1a** (habit model v3 + v2→v3 migration),
**U1b** (habit editor, day view grouped by part of the day, archive screen) and **U1c** (the sync
contract speaks v3) and **U2a** (sky hero, `ProgressRing`, `TabSwitch`, weather lifted into the
provider) are all merged into `main`; **U2b** (the Hôm nay/Tuần này switch, the T2→CN week grid,
and the hero's dots turned into that same week) is on branch `u2b-day-week-tabs`.

⚠️ **U1c needs `supabase/schema.sql` applied to Supabase BEFORE the app deploys.** Reversing the
order loses no data (the client classes `PGRST202` as retryable, so the queue re-pushes), but sync
stalls until the SQL lands. As of this writing the owner has not confirmed the apply.

See `docs/superpowers/specs/2026-07-26-uiux-overhaul-design.md` §10 for what is left and
`HANDOFF.md` for progress and next steps.

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
  `icon.tsx`, `nav-rail.tsx`, `bottom-tab-bar.tsx`, `progress-ring.tsx`, `tab-switch.tsx`.
- `src/components/dashboard/**` — the panels each space renders: `dashboard-data.ts` (pure state +
  pet economy), `habit-day-list.tsx` + `habit-entry-control.tsx` + `habit-editor-sheet.tsx` (the
  day view and the create/edit sheet), `hero-banner.tsx` + `sky.ts` (the sky hero),
  `calendar-panel.tsx`, `pet.tsx` / `pet-voice.ts` (companion + VN voice), `friends-card.tsx`,
  `garden-visit-overlay.tsx`, `sync-onboarding.tsx`.
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
- **The sky is three token SETS, not three classes** (`sky.ts` + `--sky-{phase}-{from,to,ink,ink-soft}`).
  Evening is a dark ground, so its ink flips light — which is why ink belongs to each phase instead
  of sharing one `--ink`. `design-tokens.test.ts` checks each ink against BOTH ends of its
  gradient; checking one end only would be self-deception, since a gradient shows both.
- **A Tailwind class must appear verbatim in source.** `SKY_STYLES` spells out whole strings rather
  than composing them from a template — a class Tailwind cannot see is a class it does not generate.
  This is the same failure mode as the `Baloo 2` font fallback found in U0: silent, and invisible
  to every test that does not read computed styles.
- **There is exactly one progress ring**: `src/components/ui/progress-ring.tsx`. Do not hand-roll
  another conic-gradient. It renders `role="img"` with a text label, so a screen reader gets "6/7"
  rather than silence — and the visible number must therefore be rendered ONCE, not duplicated per
  breakpoint, or it is announced twice.
- **Weather lives in `StateProvider`** — one fetch for the whole app, exposed as `app.weather`.
  The hero and the weather card read the same object, so they can never show two different numbers.
- **A week cell tells `off`, `future`, `empty` and `missed` apart** (`week-model.ts`). They all look
  like "not done" and mean four different things: a weekday the habit was never scheduled for, a day
  that has not arrived, TODAY with nothing on it yet (still the user's to spend), and a day that
  fully passed empty. Collapsing them is the fastest way to turn a grid into a scoreboard of blame.
  `total.scheduled` counts only cells that were **scheduled AND have arrived** — counting future days
  makes every Monday open with eleven failures that have not happened.
- **All week arithmetic is pure and takes `today` as a parameter** (`week-model.ts`); `week-grid.tsx`
  only draws. Sunday is the trap — `getDay()` returns 0, so a naive `1 - day` jumps *forward* a week
  and shifts the whole grid. `getWeekStartIso` handles it and `src/lib/date.test.ts` guards it.
- **`VI_WEEKDAY_LABELS` / `viWeekdayLabel` in `@/lib/date` are the only source of "T2"**. The hero's
  seven dots and the week grid label the SAME calendar week, so they read one array; `week-model.ts`
  re-exports it rather than redefining it. `dashboard-data.ts` cannot import `week-model.ts` (that
  is the cycle), which is why the labels live in `lib/date` and not in either.
- **The hero's dots are a calendar week, not a rolling window** (spec §4.1). A last-seven-days row
  puts a different weekday under each dot every day, so the shape never means the same thing twice.
  A dot later in the week is `isFuture`: drawn faint, named "chưa tới", and never `completed`.
- **A week square carries meaning in text, not only in fill** — its `aria-label` names the habit, the
  date and the state ("Uống nước, T2 20 tháng 7: 4/8 ly"), so the view survives colour blindness
  (WCAG 1.4.1). Today's column also carries `aria-current="date"`, not just an accent colour.
- **`habitStreaks` is keyed on EVERY habit, not just today's.** The week grid shows a row for a habit
  that repeats on Tuesday only, and that row needs its 🔥 on a Monday too; keyed on today's habits,
  it would silently read 0. The day list looks habits up by id, so the extra keys cost it nothing.
- **`TabSwitch` requires `idPrefix`** — tab `${idPrefix}-tab-${value}` sets `aria-controls` to panel
  `${idPrefix}-panel-${value}`, and the consumer puts that id plus `role="tabpanel"` +
  `aria-labelledby` on its panel. Only the selected panel is mounted: a panel hidden by a media
  query or CSS is still in the accessibility tree for a screen reader to wander into.
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
