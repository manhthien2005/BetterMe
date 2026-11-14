# Sky Bridge Refinement Implementation Plan

> Execute inline using superpowers:executing-plans. Owner requests one asset
> at a time and single-agent work. No commit steps are authorized.

**Goal:** Finish the existing sky bridge to the quality of the approved stair.
**Architecture:** Shared local bridge frame and collider strips; focused mesh
builder merged into the existing seven study batches. Extract only the two
joinery helpers already used by the stair to share the same detailing.
**Tech stack:** Existing Three.js, TypeScript, Vitest, repo Playwright CLI.
**Spec:** `docs/superpowers/specs/2026-11-11-plaza-bridge-refinement.md`.

## Global constraints

Keep 13×4 m span, Y4→7, endpoints and all accepted layout. <65,000 triangles,
<=7 batches. No dependencies, default-world changes, commits or deploys.
Preserve prior uncommitted work; keep generated next-env.d.ts unstaged.

## Review focus

Diagonal AABB inflation near rail ends; endpoint post support; deck seams and
coplanar surfaces; arch joins/underside normals; resource cleanup and views.

## Task 1 — Bridge structure and contact

Files: new `src/lib/world/plaza-study-bridge.ts`, new
`src/components/world/plaza-study-bridge.ts`, new
`src/components/world/plaza-study-bridge.test.ts`, new
`src/components/world/plaza-study-joinery.ts`; modify study geometry/config
and stair imports only for the shared joinery extraction.

Interfaces: `skyBridgePoint(across, run, offsetY)` returns a Vec3Tuple using
the existing connector; `skyBridgeColliders()` returns Aabb2D[].
`createSkyBridgeDetails()` returns PlazaAssetPart[] including the deck.
Joinery exports the existing `beveledBlock` and `timberBeam` unchanged.

- [x] Add real scene ray tests for rail continuity at five stations and
  between them, top contact across the deck/seams and under-deck ribs.
- [x] Add collision tests using collectMapColliders, existing circle/AABB
  resolution and camera occlusion; all three lanes retain clearance.
- [x] Run the new test and record missing-detail/collider failures (RED).
- [x] Implement shared coordinates, rails/caps, plank deck, ribs and side
  collider strips. Replace only sky-bridge primitive geometry/rail generation.
- [x] Run focused bridge/stair/ground/geometry/terrain tests (GREEN), retain
  cap <65,000 and <=7 batches. Expected: all pass.

## Task 2 — Visual review and delivery

- [x] Capture/inspect approach, side, underside/detail, top, day/dusk/night
  and mobile. Walk both directions/three lanes with real keyboard input,
  test the side barrier, jump and camera at the edge.
- [x] Separate author self-review of changed source and geometry. Correct
  material defects with a reproducer before changing the implementation.
- [x] Verify scene lifecycle and original /world restoration. Expected:
  stable matching-cycle resources and no page/shader errors.
- [x] Stop verified dev process tree, run pnpm typecheck, pnpm lint,
  pnpm vitest run --maxWorkers=4, pnpm build in order. Expected exit0.
- [x] Restart preview, smoke the bridge, update HANDOFF and this ledger,
  show a screenshot and live link. Close isolated QA browser.

## Execution ledger

Pre-flight: task2 consumes task1's fully integrated mesh/config. Existing
worktree codex/plaza-landscape-v1 reused; checkpoint e3f606e and all previous
uncommitted plaza edits retained. Approval to continue is in the current
user message; choices above are implementer decisions, not newly solicited
owner approvals. No cross-task interface conflict found.

Task1 RED: four assertions fail on the original bridge (caps, ribs, unblocked
edges, plus inherited upper paving contact 22.6 mm). First integrated run:
26/28 pass, existing movement/stair/ground/cap checks all green. Ruling:
uppermost 5 cm allows 25 mm because pre-existing paving sits18 mm proud and
overlaps the slope by20 mm; do not redesign the accepted terrace paving for
a 2.6 mm mismatch. Rail samples moved outside the new post caps; sloped
cross-section top allowed1.14 m (1.06 m center + .07/cos(slope)).

Visual inspection and rail ray at side+1/run2.9 both expose tree1 crossing
the new rail. Ruling: move only this placeholder from(-16.2,-11) to
(-15.2,-8.8), keeping its size and terrace, to clear trunk/canopy. No other
planting/layout move. Add four small bank corbels under the rib ends.

Upper view exposed the old sky-terrace corner(-12,-17) overhanging the outer
bridge lane. A new scene ray from2 m above the lane reproduces a surface
0.798 m above the intended deck (landing-red.log). Ruling: remove this single
inward corner so the terrace return edge meets the existing diagonal end cap
without crossing the bridge. Endpoints,4 m deck and terrace elevation stay;
the small unusable overlap triangle is removed. No destinations move.

Separate author self-review: shared joinery extraction is unchanged; material
batch/disposal path preserved, no additional GPU resources. Found camera
strips stopped at the run endpoints while post bases extend240 mm. Endpoint
mesh ray hits the base but camera test returns full4 m (RED). Extend only
the first/last strip to cover the bases, keeping three lanes clear. Browser
keyboard already walked three lanes both directions, jumped and stopped at
the side rail. Recheck endpoint movement after this collider correction.

Task1 complete: focused30/30, five files. Separate author review complete
(owner's single-agent preference, no reviewer delegation). No remaining
blocking finding. Rendering tests confirm64,837 triangles/7 batches,
shader failures0 and no horizontal overflow. Existing stairs unchanged.

Task2 gates: verified pnpm25016 → cmd45704 → Next25052 → server31820 /
worker35292 stopped; port3004 confirmed closed. Fresh ordered commands all
exit0: pnpm typecheck; pnpm lint (0 errors/28 warnings, all in prior QA
scripts including the earlier staircase restart script); pnpm vitest run
--maxWorkers=4 (785 tests/88 files); pnpm build (11/11 pages). Evidence:
output/playwright/plaza-bridge/gates.log. Restarted local-only preview on
3004 (dev session3026).

Task2 complete: post-build navigation again passes all three lanes in both
directions with corrected endpoint colliders, jump/landing and side barrier
(restart-navigation.log). Final screenshots regenerated and inspected:
hero/front/side/top/detail/underside/day/dusk/night/mobile390×844. Metrics
64,837 triangles/7 batches, badPrograms0, overflowfalse. QA browser closed.
First navigation logged missing favicon404; final console recorded Open-Meteo
CORS/network2 errors (restart-console.log), while scene preview lighting and
bridge behavior still work. This external weather request remains outside
the bridge scope; do not report the entire console as error-free. Physical
phone performance and touch walking not tested. Keep worktree and evidence,
no commit/push/merge/deploy. HANDOFF updated; ready to show owner.
