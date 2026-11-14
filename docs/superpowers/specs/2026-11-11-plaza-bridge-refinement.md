# Plaza refinement 3 — sky bridge

## Approved correction — gently arched deck, 2026-11-11

Owner found the straight inclined deck too rigid and approved a gentle arch
with matching rails and smooth transitions at both ends. This supersedes the
linear walking plane below. Keep13×4 m, endpoints Y4/7, materials, ten posts,
diamond infill and curved supports; no other layout/planting changes.

Use a single bridge height profile in studyConnectorHeight, shared by physics,
camera, deck/core, rail/post coordinates and colliders. Implementation choice:
cubic endpoint easing plus an850 mm middle lift above that eased profile;
end slopes are zero. Midpoint Y6.35; a small upper crest stays belowY7.06.
Deck boards may approximate the profile with straight500 mm faces (max20 mm
contact error); core approximation <=5 mm. Swept bevelled rails must be closed
continuous meshes, not separate straight pieces with gaps at the joints.
Support ribs follow the same rise; post bases remain supported on steep bays.

Allow <68,000 study triangles for the curved rails/core (previous64,837),
still7 batches and no new textures/dependencies. Review identical before/after
side views, both landings, day/dusk/night and mobile. Geometry rays, endpoint
slope/crest and full three-lane movement checks, then four gates and preview
restart. Same single agent / no commit / preserved worktree workflow.

Correction verified:67,645 triangles/7 batches; focused33/33; full788 tests/
88 files plus typecheck, lint0 errors/28 prior QA warnings, build11/11. Three
lanes both ways and jump/landing pass, including a post-build smoke. Shared
curve used for geometry/contact; base overlap fixed with a failing raycast
regression. Final screenshots and before/after comparison are under
`output/playwright/plaza-bridge-curve/`. Preview restarted, QA closed.

## Original straight-bridge design and verification (historical)

Owner approved the finished staircase and authorized continuing one asset at
a time in the same manner. This pass finishes only the sky bridge connecting
the reading terrace to the belvedere. The choice of the next asset and its
construction details below are the implementer's decisions within that brief.

Preserve endpoints (-20,-12) → (-8,-17), 13 m horizontal span, 4 m clear deck,
Y4→7 linear walking plane, all four terraces and the approved staircase.
Use the approved cream stone / brown timber / muted slate metal vocabulary.
Deck boards have small inward bevels, restrained alternating tones and sparse
joinery; rails have capped posts, continuous handrails and open geometric
infill. Two curved timber ribs beneath the deck, transverse ties and short
uprights give the span a readable support structure. No roof over the view.

## Approaches

- Import a bridge kit: likely requires replacing materials and fitting the
  exact diagonal slope; unnecessary for the existing procedural scene.
- Copy the staircase's heavy stone cheeks: matches details but hides the
  open bridge span and makes the elevated connection read as another wall.
- Chosen by implementer: timber span with the same post/cap vocabulary,
  light open rails and visible curved ribs; preserves the accepted layout.

Reuse the existing Three.js batches and the two existing joinery mesh helpers.
Shared bridge coordinates must drive both geometry and diagonal collider
strips. Keep substantial side structure outside the clear deck and block
avatar/camera passage there. Rails end at the landings; no transverse barrier.
Deck mesh contact stays within 2 cm of the unchanged ground sampler; existing
18 mm terrace paving at the upper seam has a 2.5 cm total tolerance. The
under-deck arch is visual structure, not a new walkable underpass (terrain
remains single-valued in XZ). No new dependencies, textures or asset purchases.

Acceptance: actual mesh rays verify deck plane, connected rails and solid
under-deck ribs; both directions and three lanes remain walkable; side contact
stops the player and camera without snagging approaches. Review close views,
day/dusk/night, overview and mobile 390×844. Preserve <=7 batches and <65,000
triangles (baseline 61,942). Check lifecycle, original /world and four gates.
Use maxWorkers=4 for full Vitest. Stop only this checkout's verified dev tree
before build, restart loopback3004 afterward. Single agent and a separate
author self-review; no commit/push/deploy.

## Implementation and review

26 beveled deck boards over a closed core; ten capped posts, continuous upper
and lower rails with open diamond infill. Two closed curved ribs, uprights,
cross ties and four stone bank corbels support the span. The staircase's
beveledBlock/timberBeam implementations were extracted unchanged into
plaza-study-joinery.ts and reused; no new material or dependency.

Two local clearance repairs: move the one placeholder tree from(-16.2,-11)
to(-15.2,-8.8) to clear its trunk/canopy from the rail; remove the inward
sky-terrace corner(-12,-17), whose wall previously stood up to0.798 m above
the outer bridge lane. The diagonal end cap/endpoints and all elevations
stay. Existing upper terrace paving is22.6 mm above the ramp within its last
20 mm; the seam tolerance is25 mm. No other destination or planting moves.

Six bridge tests exercise actual scene raycasts and existing camera/physics
functions. The outer-lane obstruction and end-post camera gaps each failed
before correction. Focused bridge/stair/ground/geometry/terrain:30/30.
Total64,837 triangles/7 batches (+2,895 over the approved staircase pass).
Real keyboard traversal covers both directions in all three lanes, bridge
jump/landing and side barrier. Three identical lifecycle cycles: study179
geometries/122 textures; personal93/29. Original landscape/live/near=.2
restore, page exceptions0. Four gates exit0: typecheck; lint0 errors/28
warnings in prior QA scripts; full Vitest785 tests/88 files (4 workers);
build11/11. Evidence is in output/playwright/plaza-bridge/. Post-build
navigation and preview delivery are recorded in the plan ledger/HANDOFF.
