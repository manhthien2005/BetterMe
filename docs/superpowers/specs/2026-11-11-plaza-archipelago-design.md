# Approved islands around Plaza

## Latest owner correction: layered horizon and distant island scatter

The eight-mountain revision feels too close and sparse. Increase mountain
coverage across three depth bands: low isolated peaks at roughly 220–300,
overlapping distant ridges at 400–540, and a pale broken skyline at 660–850.
Use unequal widths/heights, asymmetric shoulders and staggered bearings;
keep clear views of the approved main islands and the mist below Plaza.
The prior eight-cluster target is superseded. Keep near-cliff mist unchanged;
extend only the distant veil to meet the new horizon.

Add twelve small distant floating islands at 370–690 with varied shapes,
sizes, elevations and bearings. "Random" means natural, deterministic scatter,
stable across frames and visits. Use lightweight static geometry at that scale;
do not duplicate heavyweight GLBs or create more reflection cameras. The seven
approved island assets and their transforms remain unchanged. Distant scenery
uses atmosphere-aware colors so depth remains legible in day/dusk/night/rain.

Expand only public camera/sky/reflection ranges together, with sky behind all
landscape bounds: public far 1500, sky scale 11, reflection far 3000. Personal
camera remains 140. Replace old decorative mountain
attachments when their supporting peaks move, avoiding floating remnants.
Acceptance: several depth bands visible from spawn, eye level and rim; far
islands clearly separated from the seven main ones; no clipping, lost mist,
runtime errors or accumulating GPU resources on map swaps. No new dependency,
commit, push, deployment or delegation.

The owner authorized arranging the six approved islands at irregular positions
and distances to make Plaza feel majestic. This extends the existing landscape
and floating-island specs. Work stays in `.worktrees/plaza-landscape-v1`.

## Composition

Owner correction, 2026-11-11: the first composition still read as a surrounding
ring. Arrange a landscape receding northward in distinct depth and height layers.
One large island (Thác Tầng) belongs in the middle distance, low enough to look
down onto its three terraces; the other large island (Thiên Viên) belongs far
away. Place one new medium near (Nguyệt Hồ), one far (Song Đỉnh), and both small
islands near. Retain Mạch Nguồn as a lower lateral supporting medium island.
Do not fill the rear with an evenly spaced necklace of islands.

Implementation direction: near roughly 40–75 world units from spawn, middle
roughly 110, far roughly 220–240. Unequal elevations and open sky/waterfall gaps
must remain legible at spawn, eye level and the northern rim. Preserve each
approved GLB once and stable authored transforms. Distances are visual tuning
ranges, not exact product values; rendered composition determines final poses.
Owner correction after reviewing the depth revision: restore the sea of mist
and retain a sparse mountain landscape. Plaza is a mountain summit overlooking
mist, distant uneven peaks and floating islands. The previous shared -32 offset
hid the mist and mountains and must not remain their shared transform.
Keep the summit cliff anchored, restore mist near its base and let the cloud
blanket descend gently into the valley so it does not obscure the low island.
The earlier eight-cluster target is superseded by the latest horizon correction
above. Preserve the accepted main island placements and art.
The sealing floor may remain deep below the mist; it must not read as a flat lid.
Mist remains independently anchored and descends 26 units into the valley.
Its distant deck stays below Thác Tầng's lowest basin. Preserve soft alpha
edges and continuous descent; do not lower the whole mist group again.

## Boundaries and runtime

- Copy exact GLBs from the frozen `six-floating-islands-2026-11-11` snapshot;
  verify SHA-256. Do not regenerate, simplify or recolor the approved art.
- Whole transformed model bounds stay outside X ±28 / Z ±24 with a margin.
  Islands remain scenery. Preserve camera, sky, movement, NPCs, portal and
  personal-world behavior. Extend the public camera far plane to 1500 to contain
  the distant layer from the whole walkable area; keep personal at 140. Preserve
  camera controls, sky and water art. Reflections must reach the distant layer too.
  Scale the existing sky rig uniformly to 11 (1232–1386 radius) so stars/sun remain
  behind the landscape; reflection far plane is 3000 to see across that sky from
  the distant islands. This changes distance, not sky textures or shader design.
- Reuse existing static batching and water effects. Each source owns its GPU
  resources; successful loads survive other asset failures. Cancelled/late loads
  and public/personal transitions release all owned resources.
- Reduced motion freezes water. Reflections update after lighting settles,
  at most one island per frame, never continuously while idle.
- Six new GLBs total 81,163,968 bytes / 1,437,246 triangles. With one original,
  scenery totals 95,895,292 bytes / 1,743,420 triangles. This local art acceptance
  does not establish mobile production performance; no LOD is added here.

## Acceptance

Seven distinct stable placements, clear near/far depth, no intersection with
walkable space; exact approved hashes; functional water and lighting; partial
failure and late-load cleanup; stable GPU counts on map swaps. Inspect desktop
and narrow viewport, noon/dusk/night/rain, orbit and rim views. Check existing
interactions. Run all four gates with this checkout's dev stopped. Perform a
separate author self-review under the owner's single-agent rule. No commit,
push, SQL or deployment is authorized.
