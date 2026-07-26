---
name: betterme-verification
description: Use before claiming any BetterMe task is done, or when verifying a change — the exact 4-gate sequence (typecheck, lint, vitest, build), Windows/PowerShell/pnpm specifics, single-test and dev-bypass usage, and what counts as evidence.
---

# BetterMe — verification before completion

BetterMe ships as a real product. "Done" means the gates were **actually run and passed**, and
you can quote the output. Belief is not evidence.

## The 4 gates (run in this order)
```
pnpm typecheck    # tsc --noEmit — TS 5.9 strict, no unchecked domain `any`
pnpm lint         # eslint . (next/core-web-vitals + next/typescript)
pnpm vitest run   # full suite (jsdom); same as `pnpm test`
pnpm build        # next build — the final gate
```
All four must be green before any commit. If you changed only docs/config outside `src/`
(e.g. `AGENTS.md`, `.kiro/**`), typecheck/lint/build are unaffected — say so rather than
implying you ran a full verification you didn't need.

## Targeted runs
- Single test file: `pnpm vitest run src/path/to/file.test.ts`
- Watch mode is not used in CI-style checks — always use `vitest run`.
- Invariant tests to never break: `src/components/dashboard/pet-voice.test.ts` (no-guilt /
  no-comparison) and the sync `merge.test.ts` / `dashboard-data.test.ts` (economy + no-decay).

## Environment notes (Windows + PowerShell)
- pnpm only — never npm/yarn. Node ≥ 20.9, pnpm 11.7.
- No unix pipes (`head`, `grep`, `|`) in shell calls — they fail in PowerShell. Use the
  read/search tools instead, or PowerShell equivalents (`Select-Object -First N`).
- Dev server + login bypass: set env `BETTERME_DEV_AUTH_BYPASS=true` (the string `"true"`, not
  `1`). Under bypass, sync/social are OFF by design (localStorage-only) — not a bug.

## What cannot be verified here
There is **no live Postgres / Supabase** in this environment. RLS matrices, RPC race tests,
rate-limit counting, and trigger behavior can only be validated after `supabase/schema.sql` is
applied to a real project (see `HANDOFF.md §5`). When work depends on the DB, state clearly that
DB-level verification is pending and list exactly what to test there.

## Completion checklist
- [ ] Ran every gate the change touches; quoted the real output.
- [ ] No new eslint warnings; build output pristine.
- [ ] Invariant tests still green (no-guilt, no-decay, economy).
- [ ] Temporary files/scripts cleaned up.
- [ ] Stated explicitly anything that could not be verified (e.g. DB-level checks).
