# Prototype Reconciliation Register

## Purpose

This register keeps the pre-existing Supabase/auth prototype available for reference without allowing it to become a dependency of the canonical local-first Phase 1 architecture. T-002 removes prototype dependencies only from the root composition and adds an executable import boundary; it does not delete, port, or revive prototype features.

## Canonical modules protected now

The architecture test covers canonical types, data, date/scoring/storage directories, chart transforms, themes, store, hooks, features, the new component directories, the root app composition, local-first page stubs, and the canonical dashboard stubs. These modules may not import:

- `src/lib/supabase/`
- `src/lib/server/`
- `src/lib/tracker.ts`
- `src/lib/date.ts`
- `src/lib/types.ts`
- `src/components/auth/`

Imports into `src/lib/date/` remain valid; the boundary distinguishes that directory from the legacy sibling file `src/lib/date.ts`.

## Temporary prototype exclusions

The following paths are intentionally outside the canonical scan until their owning implementation task decides whether to adapt or retire them:

| Prototype path | Current coupling | Decision point |
|---|---|---|
| `src/components/ui/` | Uses legacy `src/lib/utils.ts` class composition | Adapt primitives to semantic tokens during T-010/T-012; retain only primitives used by Phase 1 |
| `src/components/dashboard/` except `dashboard-client.tsx` and `dashboard-overview.tsx` | Uses legacy tracker/date/types/defaults | Characterize useful presentation in T-013, then adapt or retire file-by-file |
| `src/components/query-provider.tsx` | TanStack remote-state provider | Retire when T-012 installs the local tracker provider; TanStack Query is not needed in local-only Phase 1 |
| `src/components/auth/` | Supabase browser client and login behavior | Keep quarantined for a future authenticated adapter phase; do not mount in Phase 1 |
| `src/lib/tracker.ts`, `src/lib/date.ts`, `src/lib/types.ts`, `src/lib/defaults.ts`, `src/lib/optimistic.ts` | Mixed prototype domain/read models | Replace through T-003–T-008 canonical modules and characterization fixtures; retire after consumers migrate |
| `src/lib/server/`, `src/lib/supabase/` | Server actions, auth, and remote persistence | Keep as future backend reference; no Phase 1 canonical import |
| `src/app/login/`, `src/app/auth/`, `src/app/dashboard/` | Authenticated prototype routes | T-013 replaces dashboard composition; login/auth remain unreachable and are removed only in an approved cleanup task |
| `src/middleware.ts` | Supabase session refresh | Retire when prototype auth routes are removed; it is not part of the local-first request path after reconciliation |
| `supabase/` | Multi-user database schema | Preserve as future adapter research; never required to run Phase 1 |

## Root composition decision

- `src/app/page.tsx` performs a deterministic server redirect to `/dashboard` and never reads authentication state.
- `src/app/layout.tsx` remains a Server Component containing only metadata, fonts, global CSS, and children.
- Prototype Query, toast, and tooltip providers are not mounted globally. T-010 and T-012 add canonical theme, feedback, and store providers at deliberate client boundaries.

## Reconciliation rules

1. Do not delete a prototype file merely because it is excluded; first migrate or remove every consumer under its owning task.
2. Reuse presentation only after it accepts canonical types and semantic theme tokens.
3. Do not move Supabase ownership fields into canonical Phase 1 domain types.
4. Any new canonical-to-prototype import must fail `tests/architecture/import-boundaries.test.ts`.
5. When a prototype group has no remaining consumers, remove it in a separately reviewed cleanup change with build and boundary verification.
