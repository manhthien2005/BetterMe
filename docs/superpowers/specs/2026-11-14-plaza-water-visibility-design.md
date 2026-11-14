# Plaza water captures by camera visibility

Continue the owner's authorized Plaza performance work; GPU selection is resolved
by the owner and is outside this change. Previous probes isolated expensive scene
captures for island water, including water behind the camera.

## Approach

Skip a land's reflection/refraction pair when none of its pools, streams or falls
intersects the final camera frustum. Use Three's frustum and transformed geometry
bounds, checking hidden ancestors and camera layers. Bounds are conservative;
occluded water within the frustum may still capture. Water vertices are static.
Keep the existing round-robin slots and 0.1-second global interval: an invisible
slot is skipped, not reassigned, so visible water keeps its previous cadence and
total scene renders decrease. Returning water refreshes on its next slot (about
one second for the current ten lands). Keep animation and reduced-motion behavior.

Alternatives considered: lowering all capture quality would affect approved
visuals; filtering the scheduler then spending every slot on visible water would
retain the same render cost. The selected change preserves resolution and cadence.

Run walking camera/physics at frame priority -2, overview pose at -1, effects and
water at 0; retain R3F's automatic main render. Negative priorities are supported
by installed R3F 9.8.2 and do not take over rendering. Refresh camera/world matrices
before testing bounds. No asset/placement/shader/resolution changes or dependency.

## Acceptance

- Offscreen, hidden, layer-excluded or disposed water causes no capture renders.
- Partial intersections and a visible waterfall with an offscreen pool still capture.
- Turning back resumes captures; current transforms are used before the main render.
- Existing failure cleanup, target disposal, animation and round-robin tests pass.
- Real Plaza capture cameras match the main camera, with one main render per frame;
  inspect overview/walking/day/night/mobile and map-return visuals.
- Compare capture counts and frame times in matched views; do not claim universal
  FPS recovery from this one optimization. Asset streaming/distance LOD is later.
- Single-agent execution/self-review. No commits, pushes, deployment or GPU edits.
