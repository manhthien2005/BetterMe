# Grand reading pavilion refinement

Owner authorized continuing asset-by-asset after accepting the curved bridge.
This pass refines only the grand reading pavilion in the approved academy
layout. Builder choice: two curved hipped roof tiers, exposed warm timber
joinery, cream stone feet and restrained bronze. This develops the existing
silhouette; a closed hall would obstruct the reading court and its through route.
Adding surface ornament alone would leave the coarse roof and unsupported eaves.

Keep center (-25,-2), floor Y4, footprint 13x11, four columns at x +/-4.94,
z +/-4.18 from center, roof footprint 16.9x14.3 and overall height about Y14.
Use shaped roof shells with closed, 18 cm thick edges, gently lifted corners,
subtle tile courses and hip caps. Expose rafters, stacked corner brackets,
knee braces and overhead cross beams. Layer the four stone feet within 1x1 m;
colliders must cover their actual footprint without blocking the existing paths.
Threshold stays flush. No new columns, screens, stairs, furniture or lights.
Retain open views through the center and toward the cloister/bridge.

Use existing material batches, joinery helpers and procedural geometry, no new
dependencies or textures. Dedicated grand-pavilion builder replaces its inline
blockout; lake pavilion and cloisters keep their original builder. Render and
collision dimensions share a small pavilion module. The camera roof envelope
must cover lifted corners, soffit and finial; avatar headroom remains generous.

Budget: pavilion <=14k triangles, full static study <82k (previous 67,645),
at most seven batches. The increase explicitly pays for roof shells, courses,
rafters and joinery. This is a geometry guard, not a physical-phone benchmark.

Acceptance: visually legible roof curvature, edge thickness and timber supports
at eye level and overview; no floating column feet or open underside; all prior
routes remain usable. Ray tests cover roof top/underside and corner lift, feet
and overhead clearance. Walk into/through/around the pavilion and onward to the
bridge, inspect day/dusk/night and mobile, verify disposal and original /world.
Single-agent author self-review and four gates before completion. No commit,
push or deployment. Evidence: output/playwright/plaza-pavilion/.

## Implemented and verified

Grand-only builder now has two closed curved roof shells, lifted corners,
restrained roof seams/hip caps, visible rafters, bearing frame, coffer grid,
stacked brackets/knee braces, layered stone feet and bronze collars/finial.
Separate foot/shaft/joinery/roof colliders cover the new geometry. Asset stays
within 14k triangles; total study 80,257 triangles / seven batches (<82k).

Eight pavilion tests cover real scene rays, outward fascia, lifted corners,
base support, clear sightlines, bearing contacts, camera coverage and budget.
Focused geometry/terrain/bridge/stair/pavilion subset: 41/41. Full four gates
exit0: typecheck; lint0 errors/28 existing QA warnings; Vitest796 tests/89 files
with --maxWorkers=4; build11/11 pages. Verified preview dev tree stopped before
build. See gates.log, red.log, fascia-red.log, bearing-red.log and focused-final.log.

Browser verified all four entrances, north passage to bridge, base barrier and
jump/landing at Y4. Desktop1440x900 and mobile390x844, day/dusk/night, roof,
underside and feet inspected. Shader failures0, overflow false. Three warmed
scene cycles identical, original landscape/live mode/near=.2 restored, page
exceptions0. Browser console0 errors at final pre-build check (existing Three
warnings remain). See navigation-final.log, visual-final.log, final-browser.log
and before-after.jpg. The first west route hit the existing bench; the passing
route goes through z=-2 without moving furniture.

Author self-review was separate, no delegation. It caught and fixed inward
fascia winding and missing roof bearing contacts with failing tests first.
No physical-phone performance benchmark, touch movement or final lighting pass.
This is one refined study asset, not a declaration that the whole plaza is done.

Post-build preview restart smoke passed: climbed the stairs into the hall atY4.
Fresh lifecycle three cycles stable at study179 geometries/122 textures and
personal93/29, original/live/near=.2 restored, no page exceptions. Evidence:
restart-smoke.log, restart-lifecycle.log. Final console0 errors/4 existing Three
warnings; QA session closed, preview remains running locally.
