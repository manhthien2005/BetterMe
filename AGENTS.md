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

Current state: branch `main`, 221 tests green. Social Garden Phases 0–3 are all committed;
auth is live email+password with a signup OTP (see `docs/auth-email-config.md`). See `HANDOFF.md`
for progress and next steps.

## Stack
Next.js 15.5 (App Router) · React 19 · TypeScript 5.9 **strict** · Supabase (`@supabase/ssr`) ·
TanStack Query · Tailwind 3.4 + Radix + `class-variance-authority` · sonner (toasts) ·
lucide-react · Remotion 4 · Vitest + Testing Library (jsdom). Node ≥ 20.9, pnpm 11.7.

## Project map
- `src/app/**` — App Router routes (`/dashboard`, `/login`, `/auth/callback`); Server Components by default.
- `src/components/dashboard/**` — the app UI: `dashboard-client.tsx` (client shell),
  `dashboard-data.ts` (pure state + pet economy), `pet.tsx` / `pet-voice.ts` (companion + VN voice),
  `friends-card.tsx`, `garden-visit-overlay.tsx`, `sync-onboarding.tsx`.
- `src/lib/sync/**` — local-first sync engine (queue, shadow LWW, merge laws, importer, engine).
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
- **Domain purity**: scoring/date/economy are pure TypeScript — no React/Next/browser/persistence imports.
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
