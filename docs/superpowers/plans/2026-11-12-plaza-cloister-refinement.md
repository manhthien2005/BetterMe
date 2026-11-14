# Cloister refinement plan

Inline, single-agent continuation in plaza-landscape-v1. Spec in matching
2026-11-12-plaza-cloister-refinement.md. Keep all earlier uncommitted work.

1. Save fixed before cameras for wings, junction, interior and whole academy.
2. Add scene-ray tests in src/components/world/plaza-study-cloister.test.ts:
   roof thickness/winding/ridge, separated junction, supporting feet and roof
   bearings, open aisles and camera bounds. Record failure on the old blockout.
3. Add src/lib/world/plaza-study-cloister.ts with wing selection, dimensions
   and colliders; adjust north height in plaza-study-architecture layout.
   Add createReadingCloisters(): PlazaAssetPart[] in matching component file.
   Integrate only west/north branches in plaza-study-architecture and config.
   Raise total budget guard explicitly to96k from spec, enforce16k asset cap.
4. Run focused geometry, ground, stair, bridge, pavilion, cloister and movement
   tests. Inspect browser views; correct observed joins/supports/collisions.
   Walk existing routes/wing openings, day/dusk/night/mobile and scene lifecycle.
5. Separate author self-review of scope, roof winding/joins, support contact,
   collision shape, resource disposal and budgets. Stop the verified dev tree,
   run pnpm typecheck, pnpm lint, pnpm vitest run --maxWorkers=4, pnpm build.
   Restart preview3004, smoke, update spec/HANDOFF, close QA session. No commit.

Review focus: intersecting northwest eaves; camera clipping below brackets;
base widening blocking north path; false roof solidity from backfaces; renderer
geometry leaks hidden by static batch count. Steps2/4/5 cover these explicitly.

## Execution and separate author self-review

Steps1–4 complete; focused51/51 in seven files (`focused-final.log`). Initial
blockout failed roof ridge/thickness/junction/base/contact checks (`red.log`).
The existing bench also exposed an unsuitable QA sample atx=-30,z=-11; moved
that sample10 cm east beyond its radius, furniture unchanged. First refinement
failed the original path7 clearance: one outer west entry foot now retains its
original0.6 m width, all three stone layers and collider use the same size.

Ruling: north height4.8 (700 mm step), replacing initial4.5 sketch. Mesh rays
require>280 mm top-to-top separation over20 northwest samples so the160 mm
shell and underside rafters do not cross. The lower sketch did not clear this.

Author review found exposed timber at hip ends; first center rays caught cross
beams, then a full bracket-vertex envelope test caught the remaining corners.
Adjusted bearing dimensions and arm heights, preserving connected supports.
Evidence: roof-contact-red.log, bearing-envelope-red.log and focused-final.log.
All10 cloister tests now pass, including camera, headroom, physical base and
roof seam coverage. Final static geometry92,217 triangles/seven batches, both
wings<=16k. Original hall/pergola/gate/observatory meshes untouched. Existing
batch merger consumes/disposes all new geometry; no textures/dependencies added.

Walking passed ramp approach, full west aisle, north passage to bridge, hall
side opening, column stopping and jump/landing (`navigation.log`). Visual views
cover both wings, junction, underroof, day/dusk/night/mobile. Three warmed
scene cycles identical, original/live/near=.2 restored, no page exceptions;
console0errors/4existing Three warnings. Logs: visual-final.log, final-browser.log.

Evidence note: the second before-camera run overlapped HMR, so its snapshots
are named iteration1-* and are NOT the baseline. The valid court baseline is
the prior completed pavilion pass's pavilion-hero.jpg, copied to
before-academy-court.jpg; camera matches academy-court.jpg exactly. Comparison
uses only that pair.

Step5 complete: all four gates exit0 in gates.log (typecheck, lint0errors/
28existing warnings, Vitest806/90 files with four workers, build11/11).
Verified dev tree stopped before build; restarted loopback3004. Smoke walked
the garden approach to west aisle atY4. Fresh three-cycle lifecycle stable:
study179geometries/122textures, personal93/29, original/live/near=.2 restored,
page exceptions0. See restart-smoke.log, restart-lifecycle.log. QA session
closed; preview remains running. Spec/HANDOFF updated, no commit/push/deploy.
