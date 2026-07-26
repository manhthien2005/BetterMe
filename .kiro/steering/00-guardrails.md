---
inclusion: always
---

# BetterMe — non-negotiable guardrails

These are STOP rules. If a task seems to require breaking one, stop and ask the user first.
Full context: `AGENTS.md`, `HANDOFF.md`, `docs/superpowers/specs/`.

## Product invariants (test-enforced, sacred)
- **No-guilt**: never write copy or UI that blames the user or compares them *downward* to
  anyone. Forbidden in pet/voice text include the Vietnamese words "thua", "kém hơn",
  "xếp cuối". `src/components/dashboard/pet-voice.test.ts` enforces this across every voice pool.
- **No-decay**: pet growth/bond only increases (enforced by a Postgres trigger). The only
  decrease path is the `reset_companion` RPC. Never add a penalty/decay path. This does NOT
  apply to habit completions — unticking is valid and must sync.

## Data & security
- Never read, echo, edit, or commit secrets: `.env`, `.env.local`, any `.env.*`.
- Never weaken or disable Supabase RLS. Cross-user reads go through SECURITY DEFINER RPCs only;
  social writes go through RPCs, not direct table writes.
- Never store or merge the derived food balance (`deriveFoodBalance` recomputes it). Never
  upload seed fiction (`date <= seedCutoverDate`).
- Never expose a network endpoint/server without flagging missing authentication.

## Destructive actions (hard-blocked / ask first)
- Never run `git push --force`, `git reset --hard`, `git clean -f`, `rm -rf`, or destructive SQL
  (`DROP`, `TRUNCATE`, `supabase db reset`).
- The working tree may hold uncommitted work (e.g. Phase 2) — never discard changes
  (`git checkout -- .`, `git restore <path>`) without explicit confirmation.
- Commit or push only when the user explicitly asks, and only after the 4 gates are green.
