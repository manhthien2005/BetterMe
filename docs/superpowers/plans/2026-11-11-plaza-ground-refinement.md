# Plaza ground refinement implementation plan

> Execute inline with superpowers:executing-plans. Owner requires single-agent
> work and sequential area completion. No commit/push or unrelated assets.

**Goal:** solid, coherent terrain and paving on the approved Plaza 03 footprint.
**Spec:** `docs/superpowers/specs/2026-11-11-plaza-ground-refinement.md`.
**Architecture:** reusable Three.js ground mesh builders consume the existing
pure terrace/connector data. Ground style is a per-vertex mask in the existing
stone batch; a study-only shader adds masonry scale. Movement uses the same
height sampler; no speculative engine rewrite.
**Stack:** Three0.187, R3F9.8, TS5.9, Vitest4, existing Next16/pnpm/PowerShell.

## Constraints and review focus

- Preserve four heights, route endpoints, all architecture/vegetation placements.
- Continuous top and outward sides at diagonal bridge and stair landing.
- No paving strip connecting the top of a cliff to its bottom.
- Shared renderer resources dispose on space switches; default stone unaffected.
- Compare side views as well as overview; tests cannot establish visual quality.

## Tasks

- [x] 1. Add failing raycast checks for ground contact at ramps/stairs and
  supported sides in `plaza-study-ground.test.ts`; implement closed connector
  and rock builders in `plaza-study-ground.ts`. Integrate into study geometry,
  retaining rails and footprint. Check winding, seam/underside, sample heights.
- [x] 2. Replace incomplete retaining segments with continuous support walls;
  clip path triangles that span discontinuous heights. Add tests for paths
  beside terrace edges and supported connector openings. Keep all routes clear.
- [x] 3. Add study-only masked stone paving/masonry shading with antialiasing;
  preserve other stone material and seven batches. Inspect baseline/final
  overview, ramp sides, lake wall, floor closeups, day/dusk/mobile together.
- [x] 4. Walk the original loop and test edge/offset approaches. Run typecheck,
  lint, full tests --maxWorkers=4, then stop verified dev tree and build.
  Restart and smoke; document evidence and limits in HANDOFF/spec. No commit.

## Execution ledger

- Initial state: version03 accepted; all source edits from earlier studies remain
  uncommitted above checkpoint e3f606e. Only this task's files are changed further.
- Pre-flight: mesh builders and shader mask must both be handled by batch add;
  tests consume standalone mesh builders to distinguish floor from prop roofs.
- Tasks1–2 complete: initial three ray/edge checks RED; exact connector solids,
  rim/underside and clipped paths GREEN. Extra lower-terrace foundation ray
  caught podium walls ending at0 above a -2 garden; now bottoms sample the
  actual lower terrace. 14 geometry checks pass. Logs foundation/contact red/green.
- Ruling: keep rendering-only ground refinements; physics already matches the
  intended profiles. Existing bridge stays a span, other connectors get solid
  foundations. No new terrain levels or layout changes.
- Ruling: local seam repair extends the west reading-terrace corner from x=-36
  to -38.1 at z=9, covering the already approved 4.2 m ramp mouth. An offset
  exit test proved the old corner dropped4 m on half the entrance. This is a
  7.35 m² landing repair, not a change to routes or overall composition.
- Landing review: thick retaining caps overlapped the last stair tread; opening
  caps now lie exactly on their edge plane. Full-scene raycast guards contact.
- Ruling: shift only placeholder tree1 from x=-17 to -16.2 (same z=-11)
  after the bridge's offset-lane test identified its trunk as an obstruction.
  This is approach clearance, not the later vegetation asset pass.
- Task3 complete: rendered near/distant/day/dusk/night/mobile, shader failures0,
  final58,846 triangles/7 batches. New geometry decreases the count despite
  closing foundations. Other stone assets retain mask0/original style.
- Task4 runtime complete: real traversal includes west offset garden lane;
  all three lanes/two directions pass unit movement. Three lifecycle cycles
  stable179/122 study,93/29 personal; default scene restores, exceptions0.
  Full gates running with four test workers after verified dev-tree shutdown.
- Task4 complete: ordered gates exit0 (typecheck, lint0 errors/26 old warnings,
  full774/86 with4 workers, build11/11). Restart smoke ascended/descended west
  lane atx=-37.457, reaching4 and returning0, then restored overview. Isolated
  QA browser closed; loopback preview remains. No commits or deployment.
