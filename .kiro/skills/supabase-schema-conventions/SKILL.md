---
name: supabase-schema-conventions
description: Use when editing supabase/schema.sql, RLS policies, RPCs, or the server actions in src/lib/server/** — covers owner-only RLS, SECURITY DEFINER cross-user reads, RPC-only writes, idempotent schema patterns, the append-only food ledger, and the never-throw server-action contract.
---

# BetterMe — Supabase schema & server-action conventions

The backend is defense-in-depth: the database enforces security, not the client. Everything in
`supabase/schema.sql` is idempotent and re-runnable.

## Schema patterns (all idempotent)
- Tables: `create table if not exists public.<name> (...)`. Every user-owned table has
  `user_id uuid ... references auth.users(id) on delete cascade`.
- Timestamps: `created_at`/`updated_at timestamptz not null default now()`, plus the shared
  trigger: `drop trigger if exists <t> on <table>; create trigger <t> before update ...
  execute function public.set_updated_at();`.
- Indexes: `create index if not exists ...`.
- Policies: `drop policy if exists "<name>" on <table>; create policy ...`.
- Schema is organized in 4 banner sections: base / Phase 0 (sync) / Phase 1 (identity) /
  Phase 2 (garden visits). Keep new work under the right banner.

## Security model (never weaken)
- **RLS is enabled and owner-only by default**: `using (auth.uid() = user_id)`.
- **Cross-user reads** (a friend's summary, feed, etc.) go through a **SECURITY DEFINER RPC** —
  never a broadened SELECT policy. A `SECURITY DEFINER` helper (e.g. `is_sharing()`) is used
  where a subquery would otherwise be blocked by RLS.
- **Writes to social tables** go through RPCs (`revoke` from public/anon, `grant` to
  `authenticated`), not direct table writes. The one documented exception is `unfriend` (a
  direct DELETE covered by its RLS policy).
- Rate-limited RPCs burn quota **server-side before** the lookup (so garbage input still costs
  quota); use advisory locks for money-like operations (food gifts) to survive concurrent merges.
- Published summaries are **projections recomputed from source** by `refresh_my_summary` — a
  client can never upsert fabricated values, and the projection contains no field from which a
  miss-day or inactivity gap could be inferred.

## Food economy (append-only ledger)
- The balance is **derived** by `deriveFoodBalance` (carryover + Σ granted + Σ gifts − Σ|spent|,
  clamped 0–21). It is **never stored** in a column and **never merged**. `CompanionState.food`
  is a cache — recompute after any ledger change.
- No-decay: growth/bond only increase (Postgres trigger). Only `reset_companion` decreases them.

## Server actions (`src/lib/server/*-actions.ts`)
- Begin with `"use server"`. **Never redirect and never throw.** Every failure returns
  `{ ok: false, reason }`; success returns `{ ok: true, ... }`.
- Under the dev-auth bypass (no Supabase session) every action no-ops with
  `{ ok: false, reason: "no-session" }`.
- Use `createClient()` from `@/lib/supabase/server`; call RPCs via `supabase.rpc("name", args)`
  and parse the jsonb `status` union into a typed result. Keep the select column list in sync
  with the schema — selecting a dropped column is a runtime bug against the real DB.

## Verifying DB work
Schema/RLS/RPC correctness can only be proven against a real Postgres (not available here).
Apply `supabase/schema.sql` to the project, then run the RLS matrix / race / rate-limit tests
described in `HANDOFF.md §5`. Until then, treat DB behavior as reviewed-on-paper only.
