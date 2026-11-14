# Plaza study 02 — academy terraces

Owner approved the proposed terraced direction and requested another polygon
prototype, using “view of inazuma genshin impact city” as spatial reference.
This continues the authorized disposable study; final art/production planning
remain pending review. No commit, push or deployment requested.

Reference inspected: Bing Images with that exact query and the HoYoLAB city
view at https://upload-os-bbs.hoyolab.com/upload/2021/09/25/170779872/1d169e72227273f3d91c9e37e68a1be2_3460821949312921727.jpg .
Observed cues: masonry retaining terraces, stairs/landings framed by trees,
dark overlapping roofs, a higher architectural focal point, short bridges,
alternating open and partially concealed views. Apply those spatial cues at
academy scale; no game assets, statues, insignia or city-size replication.

Composition: low eastern water garden (-2 m), broad central gathering court
(0), western reading pavilion (+4), northern quiet overlook (+7). Cut the
square footprint into an irregular summit with masonry/rock sides. A direct
stair with a landing connects court to pavilion; a longer garden ramp gives
another route. Short ascending garden bridge joins pavilion and overlook.
Two gentle ramps connect lake-side paths back into the main loop. Keep the
approved mountains, floating islands, atmosphere and original `/world` intact.

Execution scope: shared terrace polygons and ramp/stair definitions in pure
world data; rendering and movement sample the same surface. Add optional
height sampling to physics/camera, adjust elevated colliders and contact ring,
keep flat default behavior. This has one surface per XZ: no walk-under bridge
or stacked interior. No new dependencies. Render the study with polygon trees,
roofs, benches, low rails, broad paths and a few outdoor learning tables.

Acceptance: distinct heights visible from entry and overlook; actor ascends,
descends and jumps onto the correct surface; hard ledges/outer edge blocked;
props rest on their terraces; camera does not clip terrain; lake remains
blocked; portal round-trip/default scene intact. Test physics before wiring;
sample authored routes; inspect overview/eye-level/day/dusk/mobile; run all
four gates after stopping this checkout's dev tree. Self-review only.

## Implemented design study

Authored four polygon terraces and five connectors in `plaza-study-terrain.ts`:
20 shallow steps with a 2 m landing, a 24 m garden ascent, a 13 m ascending
bridge, and two 12 m lake ramps. The irregular base tapers into faceted rock.
Low timber rails frame edges; placeholder canopy colors and layered slate
roofs carry the approved palette. Three outdoor tables suggest reading/study.

`groundHeight` is optional on the map, shared with renderer/collision/camera.
The actor follows slopes/steps, lands on the correct height, and cannot cross
abrupt ledges or the outer footprint; the contact ring follows the surface.
Camera target follows terrain height and ray sampling shortens the orbit
before it crosses a raised terrace. Flat maps keep their existing behavior.

Physics RED→GREEN evidence: `output/playwright/plaza-terraces/terrain-red.log`
and `terrain-green.log`. Focused regression: 26 passing checks across terrain,
layout, camera, original world and character tests. Includes every connector
in both directions, path clearance/continuity, finite geometry, upward paving
and outward rock winding. The initial real-browser images exposed a path edge
that crossed the lake wall; narrowed that promenade to its available width.

Visual reference and review files are local/ignored under
`output/playwright/plaza-terraces/`. No downloaded game art enters runtime.
Still a blockout: final masonry, foliage, water, ambient sound, wildlife,
sitting interactions and touch navigation remain future work.

## Runtime review

Actual keyboard navigation covered entry, stair landing (+2), reading terrace
(+4), jump/landing, bridge ascent to +7 and return, garden ramp to 0, southern
lake descent to -2, eastern promenade, northern ramp to 0 and portal round-trip.
The return walk exposed a triangular gap where the diagonal bridge met the
straight overlook edge. Matched the overlook outline to the entire bridge end
cap, with a failing-then-passing entrance-width regression. Geometry/terrain
checks now pass 10/10. Evidence: `bridge-seam-red.log`, `bridge-seam-green.log`,
`navigation.log` under `output/playwright/plaza-terraces/`.

Final visual review: 1440 × 900 overview and eye-level views, day/dusk/night,
390 × 844 overview without overflow. Seven merged batches / 46,819 triangles;
shader failures 0. Three public/personal cycles retain stable geometry/texture
counts: study 179/122, personal 93/29. Overview near plane restores 5 → .2;
keyboard light selector works. “Cảnh đã chốt” restores original landscape,
live environment and near=.2 with no study mesh. Page exceptions: 0.
Existing Three.js Clock/shadow-map deprecation warnings remain. See
`visual.log`, `final-browser.log`, `overview-day.jpg`, `lake.jpg` and
`overview-mobile.jpg`. This is local dev-auth-bypass QA, not live auth/sync
validation or a physical-mobile performance benchmark.

Final gate: stopped the verified checkout dev process tree (pnpm PID11248,
Next PID32612/server30192), confirmed port3004 closed, then `pnpm verify`
exited 0: typecheck passed, lint 0 errors / 26 pre-existing QA-script warnings,
765 tests / 85 files passed, production build generated 11/11 pages.
Evidence: `output/playwright/plaza-terraces/verify.log`. Separate self-review
covered default-map isolation, collider elevations, route continuity, camera,
mesh winding and resource cleanup. No commit/push/deployment in this iteration.
Restarted loopback dev on port3004 after the build; a fresh browser loaded the
study/avatar, walked from spawn [0,0,40] to [0,0,38.205], and returned to overview.
See `restart-smoke.log`; the fresh console also reports the existing favicon404.
Closed the isolated QA browser; preview server remains running for owner review.
