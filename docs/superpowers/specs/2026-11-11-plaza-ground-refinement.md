# Plaza refinement 1 — ground and foundations

Owner approved the version 03 blockout and authorized sequential refinement,
one item at a time. This pass completes the ground/foundation item first:
the existing four levels, five connectors, footprints and destinations stay.
Architecture, planting, water assets, fauna/audio and sitting are later items.

Observed issues: garden ramp and staircase are thin disconnected boxes with
daylight under the edges; base rock starts below/outside its floor edge;
retaining walls are omitted wholesale around connector openings; broad paving
has no legible masonry scale. Existing path ribbons can interpolate between
different heights along their width, producing steep strips over terrace edges.

Direction: continuous cream-stone foundations and restrained staggered paving,
anchored in the same muted rock/grass palette. Build exact closed profiles for
grounded connectors, retain the deliberate bridge span, join bedrock to the
lowest floor. Only exposed terrace edges need masonry/rails; an entry opening
must leave a supported surface beneath it. Keep all walkable heights identical
to the shared sampler. No asset downloads, dependencies or default-world edits.

Acceptance: sampled mesh top equals ground height; horizontal rays cannot see
through grounded ramp/stair sides; rock has a closed top rim/underside; paths
do not draw vertical ribbons over cliffs. Every connector remains walkable both
ways, including offset approaches. Stone joints readable at eye level without
moire from overview. No new shader errors, stable scene cleanup, same palette
and four-level silhouette. Review desktop/mobile/day/dusk and complete four
gates (full Vitest uses maxWorkers=4 due previously reproduced default-worker
timeouts). Stop this checkout's dev tree before build. Self-review, no commit.

## Implementation and review

`plaza-study-ground.ts` builds exact extruded stair/ramp profiles with closed
sides/undersides. The bridge retains its thin span. The rock rim now starts at
the floor boundary (-2.01) and the bottom is closed. Retaining walls reach the
actual lower terrace; openings keep their support plane without a thick cap
intruding into the last tread. Path edges trim to their own coplanar terrace,
so broad ribbons cannot drape down a cliff or float above a descending ramp.

The study-only `plaza-ground-material.ts` uses a vertex mask within the existing
stone batch: paving, masonry and subtle rock strata. Other architecture keeps
its previous material. Joint antialiasing fades with pixel footprint; no image
assets or new draw batches. Final study: **58,846 triangles / 7 batches**.

Two local clearance repairs were necessary: extend the west landing corner
2.1 m to cover the full existing ramp mouth (7.35 m² wedge), and move placeholder
tree1 from x=-17 to -16.2 at z=-11 to clear the bridge's right lane. All four
heights, connector endpoints, destinations and building positions remain.

Seven new checks exercised real Three.js raycasts and mesh contact: solid
grounded connector sides, exact full-width top heights, landing contact,
lower podium foundation, rock rim/underside and path continuity. Existing
movement checks now walk all connectors in both directions in three lanes,
and check their prop clearance. Focused result: **19/19**, with RED→GREEN logs
for the original defects, landing seam and bridge obstruction.

Real keyboard walkthrough covers the four heights, jump/landing, main stairs,
bridge both ways, garden descent at x=-37.4 (previously blocked edge lane), lake
loop and portal round-trip. Visual inspection includes overview/day/dusk/night,
390×844/mobile and eye-level ramp side, stairs, podium and paving. No overflow
or shader failures. Three matching public/personal cycles: study179 geometry/
122 texture, personal93/29, stable; original landscape/live mode/near=.2 restore.
No page exceptions. Self-review covered cap intrusion, supporting heights,
mask isolation and scene cleanup. Evidence: `output/playwright/plaza-ground/`.

This completes the ground/foundation scope only. Detailed architecture/rails,
planting, water animation, wildlife/audio, sitting and touch walking retain
their previous prototype state. No physical-mobile performance claim.

Final gates all passed in one ordered run (exit0): typecheck; lint0 errors/
26 existing QA warnings; full Vitest with4 workers **774 tests / 86 files**;
build11/11. Evidence `gates.log`. Verified dev tree pnpm46484/Next47608/
server25524 stopped and port3004 closed before build; restarted loopback dev
afterward. No commit/push. Keep incidental generated `next-env.d.ts` unstaged.
Fresh post-build smoke walked the repaired west lane up to4 m and back to0,
then restored overview (`restart-smoke.log`). QA session closed; preview left
running for owner review.
