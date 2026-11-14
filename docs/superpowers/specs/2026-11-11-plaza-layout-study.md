# Học viện trên sống núi — bản thử bố cục 01

Historical flat study. The owner requested terracing after review; current
`?plaza=study` follows `2026-11-11-plaza-terraced-study.md`. Evidence below is
for version 01, not the current elevated layout.

Status: owner requested a walkable polygon blockout, not final art or an
implementation plan. This is a disposable design study for review after the
approved landscape checkpoint `e3f606e`. No new art assets, audio, commit or
deployment in this step. Impeccable mode: Experience; inherit the existing
limestone / dark timber / slate / jade world and the accepted mountain vista.

Owner wants a spacious academy with ambient sound, birds, flowers, foliage,
butterflies, gardens, attractive paths, majestic pavilions, views, water and
seating. Fine assets come later. This study tests the main footprint, human
scale, circulation, architectural masses, garden/water balance and sightlines.

Proposed composition: an 80 × 80 m summit, extended southward to preserve the
northern floating-island composition. Central fountain court; grand western
pavilion; eastern lake and smaller waterside pavilion; southwest flower garden;
southern arrival grove; northern open belvedere. A continuous garden walk joins
the places with broad spokes to the court. The north portal stays accessible.
Seating faces water or views rather than the traffic route.

Use polygon massing and a small shared material palette. Trees and flower beds
are volume markers. Bird/butterfly/leaf motion and sound are deferred design
layers: grove = birds/rustle, garden = butterflies, water = fountain/lake,
overlooks = wind. Benches are positions for future seating; no sit animation.

Prototype route: `/world?plaza=study`, behind the existing auth gate; ordinary
`/world` retains the checkpoint composition. Add overview/walking controls for
review. Movement remains on Y=0, with non-walkable water and solid columns;
retaining walls below the deck suggest the mountain slope. No heightfield or
stair physics added. Personal space and all approved distant assets stay intact.

Review with actual avatar at arrival, court, lake, garden, both pavilions and
belvedere; also overhead, narrow viewport, day/dusk/night. Verify navigation,
portal return, colliders and finite geometry. Record screenshots and checks in
ignored `output/playwright/plaza-study/`, then ask the owner about the layout.

## Prototype review evidence — 2026-11-11

Implemented a 25 m diameter court, two open two-tier pavilions, an 18 × 26 m
lake, 13 bench placements, 21 placeholder trees, garden beds, north belvedere
and eight connecting paths. Initial light is a labeled noon preview; the
overview offers other phases and live time. Overview pauses movement and
restores the walking camera on exit. Its temporary near plane of 5 avoids
depth flicker in thin paving/water layers at mobile overview distance.

The geometry adds 26,590 triangles in seven shared surface batches. Path
curves are sampled with the actual avatar radius: all centerlines, spawn,
pavilion interiors and portal approach are clear. Water, fountain and columns
block movement. Browser walking reached the court and grand pavilion, used
the portal both ways and confirmed fountain/lake stops. Route tests retain
authentication, and personal space keeps its own config.

`pnpm verify` exited 0: typecheck passed; lint 0 errors / 26 pre-existing QA
warnings; 758 tests in 84 files passed; build generated 11/11 pages. This
checkout's dev tree was stopped first. Focused checks: 15/15. Design detector:
`[]`. Self-review covered scope, collision/render alignment, winding, resource
ownership and default-world isolation.

Rendered inspection: 1440 × 900 desktop, 390 × 844 overview; arrival, court,
pavilion interior, lake, garden, north overlook; day/dusk/night. No horizontal
overflow or shader compilation errors. Local ignored evidence lives under
`output/playwright/plaza-study/`: `verify.log`, `focused-green.log`,
`navigation.log`, `visual.log`, `overview-day.jpg`, `overview-mobile.jpg`,
`arrival.jpg`, `pavilion.jpg`, `lake.jpg`.

Post-build browser check (`final-browser.log`): three full public/personal
round trips after the same camera sweep retained identical GPU counts:
study 180 geometries / 122 textures; personal 93 / 29. Overview near=5 restores
to .2 when walking. The original-scene link remounts the live world, has the
approved landscape and no study geometry. Keyboard light selection passed;
no page exceptions. The only console error was the existing favicon 404.

Pending owner feedback. Walking terrain is flat; final slope transitions,
planting/architecture/water assets, sitting, audio and wildlife are deferred.
Mobile inspection covers the overview; touch walking and real-device GPU
performance are not established. No commit/push/deployment of the study;
approved-landscape checkpoint remains `e3f606e`.
