# Reading court cloisters

Owner accepted the pavilion pass and authorized continuing asset-by-asset.
Refine the west/north cloisters only. Keep their centers, footprints, six post
positions each, floor Y4, benches and walking routes. Use cream stone feet,
warm wood, slate blue roofing and restrained bronze consistent with the hall.

Builder choice: long hipped roofs with horizontal ridges, gently lifted eaves,
closed 16 cm shells, roof courses, ridge/hip caps, exposed rafters, repeated
brackets and bearing frames. A pyramid stretched along the corridor reads too
heavy; ornament on its existing thin shell would not resolve its underside.
The low wings should frame the taller pavilion and the views out of the court.

North roof/columns rise 0.7 m (height4.8 vs4.1) to make a stepped roof junction
over the existing northwest corner; west height remains4.1. Roof overhangs
remain1 m as in the blockout. No new ground obstructions beyond widened post
feet within0.74 m (the west entrance foot beside the curved ramp approach stays
at its original0.6 m), no rail/screens/new furniture. Preserve center walking lanes,
side entries and north route to the bridge. Camera covers foot/shaft/brackets
and roof; pedestrians retain at least2.4 m headroom beneath braces.

Dedicated cloister builder reuses joinery helpers and studyColonnadePosts;
new shared cloister constants/colliders follow the same model as the pavilion.
No edits to the approved hall, lake pergola, arrival gate, observatory, terrain
or original /world. No dependencies, textures, sound, planting or lighting work.

Budget: both refined cloisters together<=16k triangles, complete static study
<96k triangles, still seven batches (previous80,257). Pay only for roof shells,
rafters and visible structural detail; physical-phone performance is unproven.

Acceptance: distinguishable roof ridge and solid eaves, grounded feet, connected
bearing frames, no crossing roof surfaces at the northwest join. Ray tests at
real scene points plus collision/camera/path tests. Inspect fixed before/after,
eye-level/roof/junction, desktop/mobile and day/dusk/night. Walk west corridor,
north passage and bridge approach, check bases/side entries and lifecycle.
Separate author self-review, four gates with dev stopped before build; restart
and smoke. No commit/push/deploy. Evidence: output/playwright/plaza-cloisters/.

## Implemented / verified

Both wings now have closed curved hip roofs with long ridges, roof seams and
caps, exposed rafters, repeated bracket/brace/bearing frames, stepped cream
stone feet, bronze collars and flush floor inlays. North height is4.8, west4.1.
The original western entry foot remains0.6 m to clear the curved approach;
others are0.74 m. Positions, floor and furniture unchanged. Dedicated study
builder and colliders; lake pergola, arrival gate and hall keep prior geometry.

Ten cloister tests and focused51/51 in seven files. Initial failures captured
thin/inverted shell, pyramid peak, roof intersection and insufficient foot
coverage; review found cross beams/bracket corners poking through tiles.
Failing contact/vertex-envelope tests preceded their fixes. Both wings remain
within16k triangles, full study92,217 / seven batches (<96k). No new textures.

Browser walked the ramp approach, west/north aisles, hall side opening and
bridge approach; column stops correctly and jumping/landing holdsY4. Roof,
junction, underside and feet inspected at1440x900,390x844, day/dusk/night.
Shader failures0, no overflow. Three warmed scene cycles stable; original
landscape/live/near=.2 restored, page exceptions0. Console0errors/4existing
Three warnings before build. See navigation.log, visual-final.log and
final-browser.log. Baseline comparison uses the prior completed pavilion
hero camera; iteration1-* files are early implementation, not before images.

Four gates exit0: pnpm typecheck; pnpm lint (0errors/28existing QA warnings);
pnpm vitest run --maxWorkers=4 (806tests/90files); pnpm build (11/11 pages).
Verified the checkout dev tree and port3004 stopped before build. Evidence:
gates.log. Author self-review, no delegation. No commit/push/deploy.
Physical-phone performance, touch walking and final night lighting untested.

Post-build restart smoke walked the approach into the west aisle atY4; fresh
three-cycle lifecycle stays study179geometries/122textures, personal93/29,
original/live/near=.2 restored, page exceptions0. QA closed; preview running.
See restart-smoke.log, restart-lifecycle.log and final-console.log.
