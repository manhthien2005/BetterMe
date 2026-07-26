---
name: sync-engine
description: Use when working in src/lib/sync/**, on offline/local-first behavior, multi-device merge, conflict resolution, localStorage state, or upload/import — covers the merge laws (monotonic max, per-cell LWW, append-only ledgers, tombstones), seed-fiction provenance, and the derived-cache rule.
---

# BetterMe — local-first sync engine

`localStorage` is the render source of truth; Supabase is the durable copy and multi-device
merge point. The pure-function layer in `dashboard-data.ts` keeps its shape — sync metadata
lives **outside** `DashboardState`. Files: `src/lib/sync/{types,time,storage,queue,shadow,merge,importer,engine}.ts` (+ tests).

## Merge laws (from the spec — `src/lib/sync/merge.ts`)
| Data | Rule | Why |
|---|---|---|
| Reward state (growth, bond) | monotonic **`max()`** | the no-decay invariant, as conflict resolution |
| Habit completion cells | per-cell **LWW** (shadow map `betterme.syncmeta.v1` + `habit_logs.mutated_at`) | an untick must propagate, not be lost |
| Food economy | **append-only ledger** union; balance is derived, never merged | money-like; deduplicate by ledger key |
| Pet name / active species | per-field **LWW** | last edit wins per field |
| Habit deletion | **tombstones** | deletion must survive merge |
| Reset supremacy | by server-issued `serverTime` | reset beats stale reward writes |

## Provenance & safety
- **Seed/demo fiction never uploads**: records with `date <= seedCutoverDate` never leave the
  device. `bestStreakFloor` and seeded `events` are fiction — never sync them.
- The sync queue (`betterme.syncqueue.v1`) carries SET-based idempotent mutations, coalesces,
  backs off, and must not head-of-line-block.
- LWW trusts the client clock for name/species/log cells (accepted tradeoff); watermark reset
  uses server time.
- Ledger imprecision has a hard cap (`FOOD_CAP = 21`); spend is never lost (union set).

## localStorage keys
- `betterme.dashboard.v2` — state (v1 is read-only; migration auto-runs)
- `betterme.syncqueue.v1` — pending mutations · `betterme.syncmeta.v1` — shadow LWW
- `betterme.synclast.v1` — watermark · `betterme.syncoptin.v1` — `'fresh' | 'memories'`
- `betterme.syncask.v1` — deferred prompt · `betterme.mailboxseen.v1` — celebrated visit ids

## Rules of thumb
- Any code touching the ledger outside a pure function MUST call `deriveFoodBalance` again;
  never merge/store the balance.
- JSDOM has no `window.matchMedia` — guard before using it (pattern already in `pet.tsx`).
- Changing a merge law is a spec change — re-read `docs/superpowers/specs/` §2.4 and add tests
  in `merge.test.ts` first (TDD).
