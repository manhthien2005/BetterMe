# Academy Staircase Implementation Plan

> Execute inline with superpowers:executing-plans. Owner requires a single
> agent and self-review; no automatic commits or reviewer dispatch.

**Goal:** Finish the existing academy staircase as one coherent asset.
**Architecture:** Shared stair dimensions and side collider data; a focused
Three.js detail builder merged into existing study material batches. Existing
closed ground profile receives a small inward bevel at exposed stair noses.
**Tech stack:** TypeScript, Three.js 0.187, R3F, Vitest, repo Playwright CLI.
**Spec:** `docs/superpowers/specs/2026-11-11-plaza-stair-refinement.md`.

## Constraints / review focus

- Preserve 7×12 m, Y0→4, landing at Y2; other connectors/areas unchanged.
- Rails meet at slope transitions; post feet have solid supporting cheeks.
- Full-width top contact, last tread and portal transition cannot regress.
- Side barriers stop avatar/camera while all three walking lanes remain open.
- <65k triangles, <=7 batches; cleanup stable across public/personal cycles.
- No dependencies, purchases, commits, push or deployment. Existing incidental
  `next-env.d.ts` stays unstaged. Stop dev before build; tests use 4 workers.

## Tasks

- [x] **1. Geometry and collision contract (RED→GREEN).** Add
  `src/lib/world/plaza-study-stair.ts` for academy connector, post stations and
  collider strips. Add `src/components/world/plaza-study-stair.ts` returning
  typed colored geometry parts. Update `plaza-study-geometry.ts`,
  `plaza-study-ground.ts`, and `plaza-study-config.ts`. Test in
  `plaza-study-stair.test.ts`: actual raycast of continuous handrail on both
  sides through landing transitions; post support; beveled edge vs flat
  tread contact; side collision vs clear lane. First run tests against old
  full-scene geometry to observe failure, then implement. Retain existing
  geometry/terrain regression checks and cap assertions.
- [x] **2. Render and walk.** Use `pnpm browser` on loopback3004; inspect
  front/side/landing/close detail, day/dusk/night, 390×844 and overview. Walk
  stairs up/down and side contact; check other routes via existing suite,
  portal lifecycle and shader/console diagnostics. Save evidence under
  `output/playwright/plaza-stair/`. Fix any observed defects in this scope.
- [x] **3. Review and gates.** Separate self-review of actual changes, fresh
  `pnpm typecheck`, `pnpm lint`, `pnpm vitest run --maxWorkers=4`, `pnpm build`.
  Stop only verified checkout dev tree before build. Update HANDOFF/spec with
  evidence and any limits, restart preview and run a fresh smoke. No commit.

## Execution ledger

- Plan started in existing `codex/plaza-landscape-v1`; prior uncommitted plaza
  work preserved. Authorization covers implementation; no further design
  approval needed. Research artifact remains historical; this spec records
  acceptance and defines the implementation scope.
- Task 1 complete: initial four tests failed on old scene (rail, support,
  bevel, collision). Added support cheeks, beveled blocks/beams, caps and
  inset joints; shared side colliders use the current stair coordinates.
  Focused geometry/terrain checks now **24/24** (four files).
- Ruling: the old approach crossed the east rail at its foot. Added one
  local path control point (-22,23), retaining its endpoints and width, plus
  a 7×1.3 m paving apron at the mouth. This makes the route enter through the
  open stair mouth. Route clearance test failed before, passed after. No
  building, terrace, tree or connector moved.
- Visual fix: cheek/coping had overlapping coplanar inner faces. A short
  ray reproduced two hits where one surface should exist (`coping-red.log`).
  Lowered cheek top to meet the beveled coping underside; regression passes.
- Task 2 complete: day/dusk/night, front/side/detail/top and 390×844 captures.
  Browser shader failures0, no horizontal overflow. Keyboard three lanes
  up/down; rail stops at x=-21.95; landing jump reaches Y2.932 and returns Y2.
  Three lifecycle cycles stable study179 geometry/122 texture, personal93/29;
  original scene/live/near=.2 restore; page exceptions0. Evidence in
  `output/playwright/plaza-stair/`. Initial browser console also records an
  existing favicon404 and two Three.js deprecation warnings.
- Separate self-review (owner requires no reviewer agent): reviewed geometry
  ownership/disposal, support and overlap, rail/collider footprint, landing
  and last tread, path repair and budget. No remaining blocking finding.
  Paving and bevels are cosmetic; sampled physics stays the accepted profile.
- Final gates first caught the new test reading raw prop colliders whose type
  omits `id`; switched to the existing `collectMapColliders` helper. Initial
  diagnostic preserved in `gates-initial-typecheck.log`. Fresh ordered gates
  running after stopping the verified pnpm26332/Next12068/server33008 tree.
- Fresh ordered gates exit0: typecheck; lint0 errors/27 QA-script warnings
  (26 prior warnings plus the previous research script); Vitest779 tests in
  87 files with4 workers; build11/11. `gates.log` records each command/exit.
  Runtime source is unchanged since this successful gate. No commit/push.
- Post-build preview restarted on127.0.0.1:3004. Fresh keyboard smoke reached
  Y2 landing, Y4 top, and returned Y0 (`restart-smoke.log`). No required
  implementation work remains in this staircase pass.
