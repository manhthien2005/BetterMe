---
inclusion: always
---

# BetterMe — workflow & verification

Environment: **Windows + PowerShell + pnpm** (never npm/yarn). Use PowerShell-safe shell
commands — no `head`/`grep`/`|` unix pipes. Prefer the dedicated read/search tools over shell
for reading and searching files.

## The 4 gates — all green before any commit
1. `pnpm typecheck`  2. `pnpm lint`  3. `pnpm vitest run`  4. `pnpm build`

Single test file: `pnpm vitest run <path>`. Dev bypass: env `BETTERME_DEV_AUTH_BYPASS=true`
(the string `"true"`). See the `betterme-verification` skill for the full checklist.

## How to work
- **Features**: brainstorm → written spec/plan → execute (use the superpowers skills). Specs in
  `docs/superpowers/specs/` are the source of truth — read the relevant one before coding.
- **Logic**: TDD — write the failing test, watch it fail for the right reason, minimal code to pass.
- **Bugs**: find the root cause before proposing a fix; don't stack speculative patches. After
  two failed attempts, step back and diagnose instead of patching again.
- **Libraries**: never assume one is available — check `package.json` and existing imports first.
- Match the surrounding code's style and patterns; read neighbouring files before adding new ones.

## Definition of done (cite evidence — do not assert)
Work is "done" only when the relevant gates were actually run and passed. Quote the command
output as evidence. If a check cannot run in this environment (e.g. no live Postgres for RLS /
race tests), say so explicitly and note exactly what remains to verify. Clean up any temporary
files created during verification.
