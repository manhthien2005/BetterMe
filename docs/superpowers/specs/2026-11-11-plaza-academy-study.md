# Plaza study 03 — garden academy

## Owner acceptance — 2026-11-11

The owner approved the current version 03 as the rough-design baseline:
“Về tổng quan, khá là đẹp rồi … Hơi nhiều lỗi nhưng không sao, vì đây chỉ là
bản thô … chốt bản thô hiện tại này”. Preserve its composition, four elevations,
circulation and area arrangement as the basis for subsequent refinement.

This approves the blockout direction, not defect-free geometry, finished assets
or production readiness. The remaining issues mentioned by the owner were not
individually identified; do not treat the earlier automated/browser checks as
proof that these issues do not exist. Inventory them during the next refinement
phase. No new implementation, commit, push or deployment was requested with
this acceptance; this turn only records the decision.

## Design iteration brief (historical)

Owner finds the architecture acceptable and requests more beautiful, complex,
distinguished areas. Continue the authorized polygon design exploration in the
same worktree/preview. This is a study for feedback, not final art or deployment.

The existing four levels and tested connectors are the foundation. The current
isolated pavilions and scattered circular beds lack a strong ensemble. Chosen
direction: connect architecture into courts and give each destination a distinct
purpose. Enlarging the entire map dilutes the intimate academy; adding ornament
alone leaves the spatial composition unchanged. This iteration instead adds:

- Two lower cloister wings around the elevated reading pavilion.
- An open octagonal observatory canopy on the +7 overlook, with a suspended
  celestial instrument as the academic landmark; center remains walkable.
- A garden lecture court with three semicircular stone seating tiers.
- A reflecting garden and stepped planting beds framing the academy stair.
- A three-stage water cascade at the lake head and a timber pergola promenade.
- A modest arrival gate and coordinated roof, beam and retaining-wall details.

Preserve cream stone, slate-blue roofs, warm timber and muted planting. Largest
roof remains the reading hall; the observatory is a slender skyline accent.
Keep the main court open. Trees, planting and water remain polygon masses;
sound, fauna, final assets, sitting and touch walking stay out of this pass.

Implementation scope: shared architectural positions/solids in a small world
layout module, consumed by study geometry and colliders. Reuse merged material
batches and the existing terrain/physics. Add branch paths to destinations.
No dependencies, generic construction engine or changes to default `/world`,
personal space, approved sky/mountains/islands. Only study labels change.

Acceptance: recognizable new places in overview and eye-level images; clear
walkable entries and original loop; columns, pools and seating block correctly;
roofs leave headroom and block camera. Existing connector tests remain green.
Inspect desktop/mobile/day/dusk, actual walking and public/personal lifecycle.
Self-review only. Stop this checkout's dev tree before full `pnpm verify`.
No commit/push requested. Save before/after and checks under ignored
`output/playwright/plaza-academy/`.

## Implemented / reviewed

Added shared colonnade, column, pool, planter, cascade and seating data in
`src/lib/world/plaza-study-architecture.ts`; geometry additions in the matching
component module reuse the existing seven batches. The lecture court is at
(-23,42), not the initially sketched (-23,44): the foundation check exposed the
outer arc crossing the diagonal terrace boundary. Moving it north keeps all
tiers on the 0 m court. The curved seat segments replace coarse tangent blocks.
Main-hall rafters now sit under the eaves instead of crossing the roof surface.

The north passage bends through the cloister's open center before the existing
ascending bridge. The outdoor lecture court and reflecting garden have branch
paths. The octagonal roof remains open below, with a suspended armillary form
above head height and a small roof finial. Existing heightfield, connectors and
physics were unchanged in this iteration. Sitting and moving water are not yet
implemented; the cascade is a visible static blockout of water and masonry.

Focused checks: 12 passing tests in geometry + terrain. Initial pool/column
checks failed before architecture existed; path sampling found two proposed
column conflicts, resolved through spacing and the cloister passage. Separate
foundation check caught the lecture placement. Logs: `layout-red.log`,
`layout-green.log`, `foundation-check.log`, `final-focused.log`.

Real keyboard navigation reached the observatory center, west cloister,
reflecting garden, lecture floor, lake pergola, all four heights and portal
round-trip. `navigation.log` includes executed code and positions. Later edits
only moved the lecture seating north, curved its segments and refined roof
details; the entire navigation script was not repeated for those edits.

Final visual review: overview + arrival/court/pavilion/lake/garden/observatory/
lecture/reflection/cloister/pergola, 1440×900; day/dusk/night and 390×844.
No horizontal overflow; shader failures 0. Study geometry: 60,611 triangles,
7 material batches (under the existing 65k cap). Three space-switch cycles
with matching camera sweeps: study 179 geometries/122 textures, personal 93/29,
stable. Default landscape, live mode and near=.2 restore; no page exceptions.
See `visual.log`, `final-browser.log`, `overview-day.jpg`, `lecture.jpg`,
`cloister.jpg`, `pergola.jpg`. Separate self-review covered collider/geometry
alignment, foundation height, roof clearance, shared cleanup and scope.

The first full gate stopped at two 5-second test timeouts (route sampling and
the unchanged app-shell greeting test), with no failing assertions. The route
helper recomputed the same ground height for every collider; hoisted that
calculation once per sample without reducing coverage. Both affected files
then passed, 17/17, before repeating the full gate. Preserved evidence in
`verify-timeout.log` and `timeout-recheck.log`.

Second default-worker `pnpm verify` again timed out in unrelated app-shell
interactions and one existing world HUD test; the geometry checks now passed.
The full unchanged suite with `pnpm vitest run --maxWorkers=4` passed **767
tests / 85 files** in 66.76 seconds, retaining the normal 5-second timeouts.
No runner configuration or unrelated tests were modified. Typecheck and lint
already passed in both full-gate attempts (lint 0 errors / 26 old QA warnings).
Report this worker cap explicitly; do not claim that `pnpm verify` exited 0.
See `verify-default-workers.log`, `full-tests.log`, and `verify.log`.
`pnpm build` then exited 0, TypeScript and all 11/11 pages complete; dev was
confirmed stopped before building. Evidence: `build.log`. Restarted the preview
with local-only bypass on 127.0.0.1:3004 afterward.
Fresh browser smoke passed: walked through arrival gate, into the final lecture
court, then up to reflecting water (correctly stopped at z=31.15) and restored
overview. `restart-smoke.log` records positions. Closed the QA browser; preview
remains running for owner review. No commit or push was made.
