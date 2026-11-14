# Gentle Bridge Arch Implementation Plan

> Execute inline with superpowers:executing-plans; owner approved this correction.

**Goal:** Make deck, rails and supports form a gentle arch and keep actual walking aligned.
**Spec:** Approved correction in `../specs/2026-11-11-plaza-bridge-refinement.md`.
**Architecture:** One height function in terrain; bridge coordinate helper
consumes it. Existing plank/rib construction follows the new rise; lofted
closed rail sections and sampled closed core replace the straight profiles.

Constraints: endpoints/footprint/other assets unchanged, midpoint6.35 m,
crest<7.06, zero end slopes, <=7 batches/<68k triangles. No dependency,
commit/push/deploy. Reuse current isolated worktree and prior uncommitted work.

## Task 1 — Curve and contact

Files: `src/lib/world/plaza-study-terrain.ts`, `plaza-study-bridge.ts`;
`src/components/world/plaza-study-bridge.ts`, `plaza-study-ground.ts`;
bridge/ground/geometry tests. Existing `studyConnectorHeight` is the sole
height interface; no cycle from terrain back into bridge config.

- [x] RED: update bridge geometry tests to an independent curved survey;
  add midpoint/crest/end-tangent and supported-post tests. Ground ray tolerance
  for sampled curved core <=5 mm, other connectors retain exact checks.
- [x] Implement shared height, curved closed core and welded rail meshes.
  Keep boards, plumb posts, caps and diamonds; deepen lower base just enough
  to contact the curved side beam on steep bays. Update only study cap68k.
- [x] GREEN: focused bridge/stair/ground/geometry/terrain tests; all connectors
  walk both directions in three lanes. Separate author self-review of winding,
  curve extrema, seams, rail joins, bases and batch/disposal handling.

## Task 2 — Verify and show

- [x] Reuse browser scripts with curve expected heights. Same camera before/
  after, detail/landings/day/dusk/night/mobile; actual three-lane ascent/descent,
  jump and side barrier. Confirm no shader/page errors attributable to change.
- [x] Verify scene lifecycle, stop only this checkout dev tree, run typecheck,
  lint, Vitest --maxWorkers=4, build. Expected all exit0. Restart3004, smoke,
  close QA browser, update HANDOFF and show screenshot/live preview.

## Ledger

Starting from the completed bridge pass:64,837 triangles,785 tests. Owner
explicitly approved the gentle-arch proposal. One agent, no new worktree or
integration action. Reused skills from this conversation; do not rerun setup.

Curve RED: original midpoint5.5 vs6.35, capped rails and upper deck positions,
and camera height failed before implementation. Shared height,52-sample core,
26-segment closed bevelled rails implemented; focused32/32 initially passed.
Post support probe corrected from an upward ray starting inside the base to
a horizontal ray just above the beam. Visual review found coplanar foot/beam
faces after deepening the pedestal: explicit ray reports2 faces instead of1
(foot-face-red.log). Recess the beam40 mm under the440 mm stone foot; preserve
the deck clearance and collider outline. Final study geometry67,645/7 batches,
within the documented68k curve budget (+2,808 over the straight version).

Task1 complete: focused33/33 in5 files. Foot/beam regression now1 visible
face per ray. Separate author self-review covered curve endpoints/extrema,
closed rail winding/caps, mesh/sampler tolerance, post contact, index disposal
and default-world isolation. No further code finding. Existing connector
walkability test covers five connectors in both directions/three lanes.

Browser navigation passes real keyboard travel in three lanes both directions;
jump reachesY7.279 near the middle and lands back on the curve, side barrier
stops at across1.464 m. Three lifecycle cycles remain identical: study179/122,
personal93/29 geometries/textures. Original scene/live/near=.2 restores;
page exceptions0. Closed QA and verified/stopped this checkout's dev tree
pnpm30384/cmd16856/Next20584/server47552/worker39044 before four gates.

Fresh ordered gates all exit0: pnpm typecheck; pnpm lint (0 errors/28 old
QA warnings); pnpm vitest run --maxWorkers=4 (788 tests/88 files);
pnpm build (11/11 pages). Evidence gates.log. Preview restarted on loopback
3004, dev session52393. Post-build smoke passed center traversal both ways,
jump/landing and rail barrier; before/after, side, front/top, detail, dusk/
night/mobile screenshots regenerated and inspected. No shader failure or
overflow. Final console0 errors/2 existing Three.js warnings; first fresh
browser request had the existing favicon404. QA browser closed. HANDOFF
updated. Preserve worktree/evidence; no commit/push/deploy. Task2 complete.
