# Pavilion refinement plan

Execute inline in the existing plaza worktree under the owner's continuation
authorization. Spec: ../specs/2026-11-12-plaza-pavilion-refinement.md.

1. Capture the current pavilion at fixed overview, approach and interior cameras.
2. Add `src/components/world/plaza-study-pavilion.test.ts`: ray tests for both
   sides of the thick eaves, lifted corners, supported feet, clear headroom and
   camera coverage. Run against the blockout and record meaningful failures.
3. Add `src/lib/world/plaza-study-pavilion.ts` for shared structural dimensions
   and grand-only colliders. Add `src/components/world/plaza-study-pavilion.ts`
   exporting `createReadingPavilion(): PlazaAssetPart[]`; reuse beveledBlock
   and timberBeam. Integrate in plaza-study-geometry and plaza-study-config.
   Update the explicit total triangle guard to the documented 82k budget.
4. Focused geometry, pavilion, ground, stair, bridge and movement tests; inspect
   rendered views, fix observed defects, walk all pavilion entries and bridge
   approach. Check mobile, three lighting phases and lifecycle/original route.
5. Separate author self-review: roof winding/joins, support contacts, collision
   bounds, resource disposal, route clearance and unchanged lake/cloisters.
6. Stop only this checkout's verified dev process tree. Run pnpm typecheck,
   pnpm lint, pnpm vitest run --maxWorkers=4, pnpm build. Restart preview,
   smoke-check, record evidence and update HANDOFF. Close QA browser. No commit.

Review focus: top-only roof masquerading as solid; low corner brackets obstruct
camera; base wider than collider; path clipping at northwest column; geometry
growth hidden by batching. Tests and browser inspection above cover each.

## Execution / author self-review

Steps 1–4 complete. Initial tests failed for roof thickness, corner lift, foot
extent and finial camera coverage (`red.log`). The first implementation exceeded
the declared 82k total; using simple box sections for small rafters removed 3,072
triangles without losing the silhouette. Final geometry is 80,257 triangles in
seven batches, including the extended rafters and four roof bearing stacks.

Separate author review found inward fascia winding and a gap between the
bracket stack and roof bearing line. Added failing ray tests before fixing each
(`fascia-red.log`, `bearing-red.log`); focused suite passed 41/41 in six files.
Fascia trim is offset 8 mm to avoid coplanar metal/wood; finial foot overlaps its
pad. Base, shaft and camera-only roof/joinery use separate height envelopes.
Roof shells face outward above/below/around the edge; source geometry disposal
flows through the existing batch merger. Lake pavilion and cloister builder
remain unchanged. No new dependencies, UI, lights, furniture or terrain changes.

Walking passed south/north/west/east, bridge approach, column-base stopping and
jump/landing. The first west QA route hit the existing bench; route changed to
the clear z=-2 aisle, furniture unchanged (`navigation-final.log`). Final visual
inspection covers roof, underside, foot, day/dusk/night and mobile390x844.
Steps 5–6 complete: gates.log records all four gates exit0 (typecheck, lint0
errors/28 existing warnings, Vitest796/89 files with four workers, build11/11).
Stopped verified checkout dev tree, restarted preview on127.0.0.1:3004.
restart-smoke.log confirms walking up the stairs into the final pavilion atY4.
HANDOFF and spec updated; no source commit/push or deployment.
