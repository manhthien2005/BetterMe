# Plaza asset provenance and verification

## Water capture visibility — 2026-11-14

Island water now skips its reflection/refraction pair when all of that land's
pools, streams and falls are outside the current camera frustum, hidden through
an ancestor, or excluded by camera layers. The existing round-robin slot is left
empty, preserving visible-water cadence and the 512px capture limit. Walking
camera updates run at -2, overview at -1, water/effects at 0, then R3F renders.
Detailed/LOD assets, geometry, shaders and placement are unchanged.
This is capture culling, not asset streaming or distance-based LOD switching.
See [spec](superpowers/specs/2026-11-14-plaza-water-visibility-design.md) and
[QA](../output/plaza-water-visibility/QA.md) for measured results and limits.

## Lightweight islands active in Plaza review — 2026-11-13

Owner promoted the optimized collection into both `/world` and `/world?plaza=study`.
`plaza-floating-islands.ts` selects all seven `/world/floating-islands/lod/*.glb`
URLs and registers Three's existing Meshopt decoder. Relative shared textures stay
beside these assets. Original detailed GLBs and their manifest remain unchanged.
Placement, materials, effects, two-load concurrency and disposal are preserved.
This is a fixed lightweight selection; view-based loading and distance switching
remain deferred. Water capture culling was added on 2026-11-14 above. See [integration QA](../output/plaza-lod-integration/QA.md)
and [plan](superpowers/plans/2026-11-13-plaza-lod-integration.md).

## Separate distant island LOD — 2026-11-13

Owner requested optimization while keeping detailed originals, then narrowed the
current step to assets first. `public/world/floating-islands/lod/` adds seven
lightweight GLBs plus shared pixel-identical textures. Detailed GLBs/manifest one
directory above remain byte-identical. They served the app during the asset-only
step; the owner promotion above supersedes that selection.

Bundle294,726,936→35,794,311bytes(-87.9%); placed triangles10,086,449→1,661,757
(-83.5%). Original node transforms, anchors, materials and all30water primitives
are preserved. Terrain borders are locked; canopy detail was increased after
visual review. Float encoding is bounded to2mm local position /0.0002attribute
error. `scripts/optimize-plaza-islands.mjs` uses existing Meshoptimizer1.1.1;
manifest records parent hashes and `optimized-preview` status. Sources untouched.

Integration uses GLTFLoader's existing Meshopt decoder and keeps the relative
`textures/` directory. No product loading/LOD/water scheduler was changed in the
asset-only step. [Comparison gallery](http://127.0.0.1:8786/compare.html),
[orbit viewer](http://127.0.0.1:8786/viewer.html),
[full evidence and limits](../output/plaza-performance/QA.md).

## Current mountain collection — V6, 2026-11-13

Both Plaza routes use the ten V6 models from
`D:/Dev/Projects/BetterMe/output/rock-mountains-v6/`: Sơn Trụ, Thạch Linh, Khe Rêu,
Bàn Thạch (near); Vân Sơn, Thiên Mạch, Cổng Mây, Dốc Vân (mid); Thanh Sơn, Viễn Phong
(far). Runtime files/compact hashes live in `public/world/mountains/`. Download
size is **10,741,224 bytes** after the owner-requested Cổng Mây correction below;
the other nine GLBs are byte-identical and all 21 immutable upstream hashes rechecked.
The old six files were replaced, four added, and the separate Vân Sơn trial runtime
removed. Historical source assets and evidence remain read-only.

`plaza-mountain-layout.ts` authors 16 placements (4/4/8), uniform scales and
staggered bearings. Radii 235–285m / 420–480m / 660–820m, **532,602 placed triangles**,
51 material/attribute batches; rotated bounds clear all seven islands with 12m
padding. No new textures, shadows, reflection cameras or packages. Three far
instances use rock-only snow; leaf normals, opaque terrain depth, cutout masks,
atmospheric haze and unmount/late-load ownership remain enforced.

Both routes, day/dusk/night/rain/mobile, four walking angles and near rock detail
were visually inspected. Three map swaps and one failed-model/reload case passed.
Final overview submitted **19 mountain calls / 208,468 mountain triangles**;
entire scene ~10.7M triangles / ~115ms RAF intervals. This is a bounded mountain
integration, not a claim that the existing high-detail island scene achieves 60FPS.
Latest gates: typecheck/lint/build exit0 (28 existing scratch lint warnings),
823 tests in94 files passed; restart smoke passed, QA browser closed.
No physical-phone benchmark. Detailed [QA](../output/mountain-v6-integration/QA.md)
and [spec](superpowers/specs/2026-11-13-plaza-mountains-v6-design.md).

### Cổng Mây silhouette correction — 2026-11-13

The owner identified two cylindrical upper masses in the lecture-court view.
Only Cổng Mây is now an offline derivative: upper rock tapers, broad crests slope
asymmetrically, and upper ivy/debris follow the surface. Geometry/transforms of
all trees, shrubs, ferns, ruins and lower rock supports stay unchanged. The
original V6 directory remains read-only. No runtime deformation was added.

Runtime Cổng Mây is971,152bytes /41,880triangles; SHA256
`279799d31d6585102ecd537a0fef813c66dc2e39821be9d934cad5565638ad68`, parent
`7cd4e1ac89423b47bf767ec7fde2b5cf9b186f3644f741162e59c7488a5d962e`.
Manifest revision is `upper-rock-silhouette-01`. Reproduction and independent
export validation: `output/mountain-v6-silhouette/build-shape.py` and
`verify-export.py`; seven closed rock solids,18 preserved plant/ruin meshes.
Final placement retains bearing176°/radius420m, with base-50, scale5, turn+.1.

Viewed same-camera before/after, eight eye-level and eight elevated directions,
day/dusk/night and390×844. [Correction QA](../output/mountain-v6-silhouette/QA.md)
records checks and limits; [surroundings gallery](http://127.0.0.1:8785/overview.html)
contains full-resolution captures. Geometry cost is unchanged; previous full-scene
performance limits still apply. No fresh FPS or physical-phone benchmark.

## Current floating islands — Vườn Gió + six V2, 2026-11-12

Owner approved the new collection and requested replacing all active old islands.
`public/world/floating-islands/` now contains the exact seven approved GLBs and
their compact manifest: Vườn Gió v18, Thiên Viên, Thác Tầng, Nguyệt Hồ, Song Đỉnh,
Tán Mây and Phong Đăng v2. Vườn Gió replaces Mạch Nguồn; the old
`public/world/floating-island/owner-rim-v4.glb` was deleted. All six former GLBs
were overwritten, and the unused legacy water runtime/test were removed.

Sources: `D:/Dev/Projects/BetterMe/output/floating-islands-v2/`. Approved Vườn Gió
GLB SHA-256 remains `dd9f43ba6dc4dc19220d6f77b4b14e1dabdf420638a05984c17a9dec3b44f779`.
Historical Blender/source snapshots remain read-only build dependencies; they are
not shipped as active old alternatives. Other Plaza assets are outside this change.

The typed adapter in `src/components/world/island-v2/` preserves authored normals,
wind UVs, botanical shading, per-land water planes and anchors before batching.
Transforms are baked once for placed geometry/effects. Nine lanterns, shrub
fireflies, waterfall spray and two receiving-basin impacts follow the app clock
and night state. Global water visibility and renderer state are restored after
captures. One capture pair is scheduled per 100ms, capped to 512 pixels; capture
camera matrices remain bound to the texture while the player camera moves.
Only two GLBs parse/batch concurrently; late arrivals are disposed after unmount.

See [integration QA](../../output/island-v2-integration/QA.md) and the
[spec](superpowers/specs/2026-11-12-island-v2-integration-design.md).
Preview: [Plaza overview](http://127.0.0.1:3004/world?plaza=study) or
[walking Plaza](http://127.0.0.1:3004/world). Local auth bypass only, no sync/social
verification or deployment. Sections below are historical records.

## Atmosphere and terrain occlusion correction — retained history, 2026-11-11

Owner's screenshot correction: less dense mist, no rectangular mountain
artifacts, readable far relief and organic distant islands. Source asset files
and seven main placements are unchanged. Mountains now remain opaque and keep
foliage alpha masks; height/depth haze blends sky colors after tone mapping,
before output conversion. Mountain feet extend 22 units down with summit heights
preserved. The four mist-sheet opacities are .52/.28/.22/.20 at clear noon.
Distant procedural islands gain fluted ledges, raised turf and clustered trees,
lit with MeshStandardMaterial and distance haze, still one batch/no new textures.

`pnpm verify` exit 0: **753/753 tests, 83 files**, typecheck passed, lint 0 errors
(26 existing scratch warnings), build 11/11 pages. Material regression RED→GREEN;
13 focused tests. Same-view three-cycle lifecycle: public 249 geometries / 155
textures, personal 93 / 29; partial failure/late arrival/recovery passed.
No JS exceptions, no failed shaders. Checked day/dusk/night/rain, five angles,
390x844, reduced motion; separate author self-review and detector `[]`.
Evidence: `output/plaza-atmosphere-fix/`; no commit/push/deploy or physical-phone
benchmark. This correction supersedes the initial alpha-fade implementation below.

## Authored mountains integrated with snow — initial integration, 2026-11-11

Owner explicitly authorized real integration and visual fitting. The 31
procedural placeholders now use the approved six mountain silhouettes with
5/9/17 depth bands. Six middle/far placements carry irregular slope/elevation
snow caps. Near mountains remain green/rocky. Seven main islands, 12 distant
islands, summit and four mist layers retain their approved art/layout.

Runtime derivatives in `public/world/mountains/` total **14,049,944 bytes** and
**466,984 placed triangles / 30 instance batches**. `manifest.json` records
original source/GLB hashes, derivative hashes, triangles and GLTF bounds.
Reproduction: installed Blender runs
`D:/Dev/Tools/Blender/assets/mountain-collection-v1/export_runtime.py`.
Approved authoring sources/GLBs/gallery are unchanged. Derivatives reduce
geometry and map sizes for the accepted viewing distances; no new package.

`plaza-mountains.ts` batches shared source materials and instances placements.
The shader applies snow before lighting and haze before output conversion;
local scene fog is disabled for these distant meshes. Bases fade into mist,
near-zero alpha is discarded, closed terrain culls backfaces, and transparent
double-sided foliage uses one pass. No additional shadows or reflection camera.
The first frame adopts the current night/day palette without a daylight flash.
Each mount owns loaded/pending resources; partial failure preserves successes,
late results dispose themselves, and a new visit retries naturally.

Evidence: `RUNTIME_BUFFERS_PASS`; focused **17 tests / 5 files**, mountain
subset **6/6**; full `pnpm verify` **exit 0**, **751 tests / 83 files**, lint
**0 errors / 26 existing scratch-script warnings**, build **11/11**.
Three equal-view lifecycle cycles: public **248 geometries / 162 textures**,
personal **104 / 29**. Partial failure leaves five models, stale loads add no
personal resources, re-entry restores all six. Zero JS errors in lifecycle QA,
zero failed shader programs in final visual check. See
`output/plaza-archipelago-qa/snow-{lifecycle,visual-final,verify}.log` and
`snow-final-{states,landscape}.jpg`. Snow on/off was inspected at the west rim.

Visual tuning reduced excessive vertical stretching and haze found in the
first integration. Inspected spawn, eye, rim, west/rear; noon/dusk/night/rain;
390×844. Preview remains local at port3004. Desktop rendering was responsive;
this is not a physical-phone performance certification. No commit/push/deploy.

## Authored mountain review kit — 2026-11-11

Owner approved the horizon arrangement below, then requested mountain assets to
inspect. Standalone package: `D:/Dev/Tools/Blender/assets/mountain-collection-v1`;
gallery **http://127.0.0.1:8769/** (read-only, loopback, no authentication).
No new GLB has been placed into Plaza; the accepted arrangement remains current.

Six packed source/GLB pairs: Sơn Trụ (103,400 triangles), Thạch Lĩnh (113,416),
Vân Sơn (51,536), Thiên Mạch (50,052), Thanh Sơn (13,996), Viễn Phong (15,512).
Total **40,559,044 bytes**. Terrain is new deterministic, asymmetric grounded
geometry with gullies, broken bedrock, embedded talus and 112 planted trees.
Read-only Mạch Nguồn materials/botany establish provenance; approved source and
GLB hashes are unchanged. Terrain albedo bakes the rock/meadow blend; normal-map
UVs remain separate, underside UVs are noncollapsed, glTF pivot is Y=0.

Verification: **6 Python tests passed**, `MOUNTAIN_ASSET_PASS`,
`MOUNTAIN_SOURCE_PASS`, `MOUNTAIN_BROWSER_PASS`. Checked actual GLB buffers,
normals/UVs/textures/budgets, saved-source closed geometry, upward top faces,
packed images and roots against actual triangles. Browser checked every model
front/back/detail, day/dusk/mist, same-scale comparison, keyboard, 390×844,
failure/retry and late-response disposal. Three swap cycles held each model at
**5 geometries / 9 textures**, comparison at **30 / 39**; zero unexpected errors.

Separate visual self-review fixed an exported black rim: double-sided underside
overlapped the low terrain while its UVs collapsed into a line. The bake now has
a real underside atlas strip and closed terrain culls inward faces. An independent
source check also caught folded grid corners; radial spacing and signed-area
triangulation correct them. Fresh checks and rendered images pass afterward.

See package `README.md`, `PROGRESS.md`, `verification.json`,
`source-verification.json`, `renders/browser-qa-final.log` and
`renders/review-reset.jpg`. This is art review, not integrated runtime/mobile
certification. No app code/build, commit, push or deployment in this step.

## Layered mountain horizon — current, 2026-11-11

Owner requested more mountains at far and very far distances plus varied
distant floating islands. This supersedes the eight-cluster mountain revision
and public/sky/reflection ranges below. Seven approved main GLBs and their
transforms remain unchanged; no approved source asset was regenerated.

| Scenery | Count | Radius from Plaza (world units) |
| --- | ---: | ---: |
| Low isolated mountains | 5 | 220–300 |
| Distant ridges | 9 | 400–540 |
| Pale horizon ridges | 17 | 660–850 |
| Small floating islands | 12 | 370–690 |

`plaza-horizon.ts` holds authored bearings with deterministic size/height
variation, lightweight island geometry and shared ranges. The existing ridge
builder is reused and all scenery is statically batched: **19,200 triangles /
4 meshes**, with no additional texture, GLB fetch or reflection camera. Obsolete
ornaments on the replaced mountains were removed with their supporting geometry.

Mountain vertex alpha fades from Y=-26 to +8, so bases disappear before the
mist surface cuts through them. Three depth-specific, atmosphere-responsive
colors avoid the old local 92-unit fog erasing all distant contrast. Distant
islands have rock undersides, turf, crowns and small detached rock chips. Their
positions are stable; no per-frame randomness or animation was introduced.

Public far **1500**, sky scale **11**, reflection far **3000**, personal far **140**.
Existing near-cliff mist and valley descent stay unchanged; distant veil outer
outreach grows to **980**. Unit checks cover full conservative bounds inside
the sky/camera, separated depth bands, stable geometry and silhouette budget.

- Focused suite **13 tests / 5 files passed**; typecheck passed. RED caught the
  missing module and then a sky range too small for full horizon bounds.
- `HORIZON_COMPOSITION_PASS`: 31 peaks + 12 silhouettes + seven unchanged main
  islands, four textured mist layers, zero JS errors. Desktop spawn/eye/rim/rear,
  noon/dusk/night/rain and 390×844 viewport inspected. No horizontal overflow.
- `HORIZON_LIFECYCLE_PASS`: three map round trips, public **222 geometries /
  119 textures**, personal **93 / 29**, stable in the matched sampled view.
  Camera **1500 → 140 → 1500**; far scenery absent from personal world.
  Alpha bounds/base fade verified. `DEPTH_WALK_PASS` reached the north rim.
- Separate author self-review of geometry, bounds, disposal, rendering order,
  preserved assets and screenshots; Impeccable detector `[]`. Final `pnpm verify`
  **exit 0**: typecheck passed, lint **0 errors / 26 scratch QA warnings**,
  **745 tests / 82 files passed**, build compiled and generated **11/11 pages**.
  Verified checkout dev tree stopped and port 3004 closed before build.
- Gate investigation fixed an existing timeout in pavilion/gate deterministic
  asset tests: Vitest 4.1.9 traverses buffers even for negated `toBe`; comparing
  reference identity as a boolean preserves the assertion and avoids that walk.
  Full per-element equality and 5s timeout retained. Isolated **35/35 pass**,
  affected cases **1784/1650ms → 108/94ms**. No asset implementation changed.
- Evidence: `horizon-current.log`, `horizon-lifecycle.log`, `horizon-walk.log`,
  `horizon-final-review.jpg`, `horizon-states-review.jpg`, `horizon-mobile.jpg`,
  `horizon-verify.log` under `output/plaza-archipelago-qa/`.
  Preview restarted at **http://127.0.0.1:3004/world**, loopback/dev-auth bypass.
  `HORIZON_RESTART_PASS`: 31 mountains, 12 silhouettes, seven main islands and
  four mist sheets retained. QA session closed; diff check passed; index empty.
  No commit/push/deployment. Real-phone performance/touch remain untested.

## Seven-island Plaza integration — current, 2026-11-11

The six approved reference-polished islands are now mounted once each alongside
one Mạch Nguồn. This supersedes the two-copy trial and the "not mounted" notes
in the historical sections below. The frozen art remains unchanged at
`D:/Dev/Tools/Blender/assets/approved/six-floating-islands-2026-11-11/`;
runtime copies and their manifest are in `public/world/floating-islands/`.

| Island | Position (X, Y, Z) | Scale | Yaw (radians) |
| --- | --- | ---: | ---: |
| Mạch Nguồn | -78, -9, -28 | 0.55 | 0.3 |
| Thiên Viên | -36, 20, -228 | 1.05 | -0.28 |
| Thác Tầng | 40, -16, -100 | 1.00 | -0.35 |
| Nguyệt Hồ | -48, 3, -64 | 0.60 | 0.8 |
| Song Đỉnh | 85, 22, -200 | 0.75 | -1 |
| Tán Mây | -22, -5, -38 | 0.55 | -0.5 |
| Phong Đăng | 35, -2, -34 | 0.60 | 2 |

Placements are authored and stable, with full transformed bounds clear of the
walkable Plaza and each other. Each loaded model owns its resources; failed
loads leave the other islands visible, and cancelled loads are disposed.
Existing water shader art, camera controls, movement and interactions are retained.
Reflections are staggered across frames after lighting settles.

### Owner's depth correction — current composition

The owner rejected the first surrounding-ring impression. The archipelago now
recedes northward: Tán Mây/Phong Đăng at 49/53 units from spawn, Nguyệt Hồ at 85,
low Thác Tầng at 113, Song Đỉnh/Thiên Viên at 223/237. Mạch Nguồn is a lateral
supporting medium at 85. Thác Tầng's highest terrain is below Plaza level, with
36 units of elevation separation from Thiên Viên. Its three terraces face the
northern rim rather than being hidden behind a nearby small island.

The first depth revision moved the whole decorative valley down 32, hiding the
mist the owner wanted to retain. That shared transform is superseded by the
separate mountain and mist groups described below; the sealing floor remains
down 76 and the summit cliff stays at 0.
Public camera range is 420 (personal stays 140), with the existing camera loop
updating the retained camera on map swaps. The sky rig moves uniformly out by
3×, preserving its angular artwork and keeping stars/sun behind the distant
islands; reflection range is 840 to include the opposite sky from far islands.

### Summit mist and sparse distant peaks — previous correction

The accepted island transforms and approved GLB bytes above remain unchanged.
Plaza overlooks a sea of mist from a mountain summit. Existing mountain
placements are reduced from 7/8/8 to **2/3/3**; the separate mountain group uses
position `[0,-22,0]` and scale `[2.4,3,2.4]`. Two legacy waterfall strips belonging
to a removed massif were removed during self-review; the central pair remains.

The mist group retains its own identity transform. Its three near sheets start
at Y=-2.88/-2.08/-1.38 and smoothly descend **26** units across 6–64 units of
outreach, reaching below the low island's bottom basin (approximately Y=-20.78).
Their outer outreaches are 260/245/230, with a distant veil from 75 to 270 at
Y=-26.5. The original textured alpha fades, palette response and resource
ownership remain; no new rendering system or model assets were introduced.

- Geometry RED→GREEN: preserve the cliff-side elevation, continuously descend
  to the valley, preserve UV endpoints and leave no-drop sheets level.
  Focused Vitest: **10 tests / 4 files passed**.
- `SUMMIT_MIST_PASS`: all seven saved transforms, four textured nonzero-opacity
  mist layers, separate mountain transform and anchored summit verified, zero
  JS errors. Desktop spawn, eye-level, northern rim, rear, dusk/night/rain and
  390×844 viewport inspected. `DEPTH_WALK_PASS` reached the actual northern rim.
- Separate author self-review checked geometry/UVs, existing disposal, range,
  retained mountain decorations and rendered results. No delegated review.
- Final `pnpm verify` after removing the two obsolete waterfall strips: **exit 0**,
  typecheck passed, lint **0 errors / 25 scratch QA warnings**, **742 tests /
  81 files passed**, build compiled and generated **11/11 pages**. This checkout's
  dev tree was stopped and port 3004 confirmed closed before build. Restart on
  loopback 3004 passed `ARCHIPELAGO_RESTART_PASS` with all seven saved placements.
  Evidence: `mist-current.log`, `mist-walk.log`, `mist-final-review.jpg`,
  `mist-walk-review.jpg`, `mist-verify.log` in `output/plaza-archipelago-qa/`.
  Restart log: `mist-restart.log`. Existing favicon 404 and Three deprecation
  warnings are outside this scenery correction; no runtime JS errors observed.
  Real-phone performance remains untested. No commit/push/deployment.

### Earlier depth verification (before restoring the mist)

- Regression RED: old placement failed the requested depth separation; old
  reflection range failed coverage. GREEN: **8 tests / 3 files** including
  approved hashes, nonintersecting bounds, far-plane bounds and lower terraces.
- Browser `DEPTH_COMPOSITION_PASS`: fresh load, correct placements, noon/dusk/
  night/rain, 390x844 no horizontal overflow, public → personal → public range
  **420 → 140 → 420**, zero JS errors. This caught and fixed Canvas retaining
  the initial camera range across map swaps.
- `DEPTH_WALK_PASS`: keyboard movement reached `[4.65,0,-23.55]` at the north
  rim; orbiting right frames the lowered island. The inspection-only terrace
  camera is supplemental evidence, not a replacement for that walk check.
- Reviewed screenshots: `depth-states-review.jpg`, `depth-final-mobile.jpg`,
  `depth-final-terraces.jpg`, `depth-final-walk-rim.jpg`. Scripts/reports remain
  under ignored `output/plaza-archipelago-qa/`; no GLBs were regenerated.
- Separate author self-review; no delegated agent. `pnpm verify` **exit 0**:
  typecheck passed, lint **0 errors / 24 scratch QA warnings**, **740 tests /
  80 files passed**, production build compiled and generated **11/11 pages**.
  Evidence: `depth-verify.log`. Dev was stopped before build and restarted after.

### Earlier integration verification (before the depth correction)

- Focused Vitest: **3 files / 7 tests passed**, checking exact approved hashes,
  transformed bounds, batching, UVs, shared-resource disposal, partial failure,
  late-load cleanup and water ownership.
- Browser: `ARCHIPELAGO_INTEGRATION_PASS`, `ARCHIPELAGO_STATES_PASS` and
  `ARCHIPELAGO_FAILURE_LIFECYCLE_PASS`. Seven islands, water animation and reduced
  motion, dusk/night/rain, NPC dialogue, jump, keyboard portal/return, rim walk,
  orbit, partial/all failure, late loads and recovery passed. Screenshots were
  inspected at 1440x1000 and 390x844; no narrow-viewport horizontal overflow.
- Three settled public visits in the matched eye-level view recorded
  **225 geometry / 119 textures**, and personal visits **92 / 29** each.
  Late loads after leaving Plaza left the separately sampled personal count
  unchanged at **93 / 29**. Renderer counts depend on view/load order and lazy
  GPU allocation; these are within-scenario comparisons, not universal totals.
  The first equality-only run failed without preserving differing counts;
  its instrumented repeat passed. Do not treat that first run as proof of a leak.
- Seven reflection targets each captured six faces on separate frames;
  **0** further cube faces while idle. No unexpected JS errors in these runs.
  Deliberately aborted GLB requests are expected resource errors; the initial
  browser session also reported the existing `/favicon.ico` 404.
- Ten one-second desktop dev samples: **105–111 FPS**, mean **109.3**;
  the eye-level view submitted **182 calls / 1,828,372 triangles**. Hiding only
  the island group in the same view yielded **133 / 656,132**. This is a scene
  contribution measurement, not a mobile or production benchmark.
- Separate author self-review: no blocking finding in placement, ownership,
  cancellation, partial failure, reduced motion or reflection scheduling.
  Impeccable's mechanical scan returned `[]`. No independent agent was used.
- `pnpm verify` **exit 0**: typecheck passed; lint **0 errors / 18 warnings**
  (all are expression-style scratch Playwright probes under `output/`);
  Vitest **80 files / 739 tests passed**; production build compiled successfully
  and generated **11/11** pages. The verified dev tree on port 3004 was stopped
  before building. Full output: `output/plaza-archipelago-qa/verify-current.log`.

Evidence and runnable QA probes: ignored `output/plaza-archipelago-qa/`.
Integration report: `integration-diagnostic.log`; states: `states-current.log`;
lifecycle: `lifecycle-current.log`; screenshots: `final-preview.jpg`,
`states-review.jpg`, `mobile-review.jpg`, `orbit-review.jpg`, `final-rim.png`.

**Cost and limits:** six new GLBs total **81,163,968 bytes / 1,437,246 triangles**;
with Mạch Nguồn, **95,895,292 bytes / 1,743,420 triangles** before scene culling.
No LOD or art reduction was authorized. A narrow desktop viewport does not
establish touch gameplay or performance on a real phone. Checks use local dev
auth bypass, so they do not validate live Supabase/auth/sync. No commit, push,
database change or deployment was performed.

## Six additional island models — 2026-11-11

The owner requested two large, two medium and two small variants, identifying the
approved Mạch Nguồn as medium. New authored package:
`D:/Dev/Tools/Blender/assets/floating-island-collection-v1`.
Thiên Viên / Thác Tầng are large; Nguyệt Hồ / Song Đỉnh medium;
Tán Mây / Phong Đăng small. The original remains unchanged.

Six GLBs and packed Blender sources, a local gallery at `http://127.0.0.1:8768/`,
orthographic size comparison and provenance/verification reports are in the
package. It reuses approved tree/material parts, with newly generated terrain,
water routes, structures, rocks and planting. See its `manifest.json`, `README.md`
and `VERIFICATION.md` for exact hashes, dimensions, 60.07 MB combined payload,
755,874 placed triangles, resource-lifecycle checks and limitations.

These six are not mounted in the live Plaza yet. No app code, physics or production
data changed. Design and execution records:
`docs/superpowers/specs/2026-11-11-six-floating-islands-design.md` and the matching plan.

## Approved floating islands — 2026-11-11

Owner request: surround the playable Plaza with two copies of the approved
`owner-rim-v4` island, one near and one far, retaining the approved rugged rim.
This is a local visual trial; the islands are scenery and cannot be walked on.
Plan: `docs/superpowers/plans/2026-11-11-plaza-floating-islands.md`.

### Source and placement

- Source: `D:/Dev/Tools/Blender/assets/floating-island-v1/glb/floating-island.glb`.
  Blender source and revision history remain in that asset directory.
- Runtime copy: `public/world/floating-island/owner-rim-v4.glb`, **14,731,324 bytes**.
  Both files have SHA-256
  `7eb017b13db5ca909670d57f046db55a8994680c1c32682d0f29118710d2274b`.
- Near placement: `[-19, 6, -44]`, scale `0.48`, yaw `0.3` radians.
  Far placement: `[25, 9, -76]`, scale `0.4`, yaw `-0.65` radians.
  Both complete bounds are outside the walkable Plaza.
- The public-only loader loads one GLB per mount. Static meshes are batched
  by material and vertex layout; both placements share geometry and textures.
  Water shaders, spray and reflection targets are owned per placement.
- Water follows the transformed island, responds to day/night/fog and freezes
  under reduced motion. Reflection capture waits for lighting to settle;
  there is no continuous cubemap render. Unmount and late-load cancellation
  release owned resources. Failed scenery loading leaves movement usable.
- No dependency, physics, camera, NPC or portal behavior was added by this step.

### Recorded runtime evidence

The preceding continuation ran the following browser checks on 2026-11-11.
Their saved reports were read again during handoff; these are desktop dev
measurements at 1440x1000, DPR 1, noon/clear, with the camera lowered to eye level.

| Measure | Result |
| --- | ---: |
| Ten one-second samples with islands | 105–108 FPS; mean 107.3 |
| Same view with only the island group hidden | 105–108 FPS; mean 106.0 |
| Whole scene submissions with / without islands | 163 / 133 calls |
| Whole scene submitted triangles with / without islands | 1,268,480 / 656,132 |
| Three settled public visits | 115 geometries / 78 textures each |
| Three settled personal visits | 93 geometries / 29 textures each |
| Idle cubemap face captures after settling | 0 |

The visibility comparison is a contribution measurement, not evidence that
adding islands improves FPS. Sources: ignored
`output/floating-islands-qa/integration-current.log` (`ISLAND_INTEGRATION_PASS`)
and `states-current.log` (`ISLAND_STATES_PASS`). Water animation, reduced motion,
three map round trips, dusk/night/rain, NPC dialogue, jump, keyboard portal/return,
rim approach, forced GLB failure and recovery passed. No unexpected runtime
errors were recorded. A 390x844 viewport had no document horizontal overflow.

The handoff visual self-review inspected noon, mobile and northern-rim captures:
two distinct silhouettes and flowing falls flank the gate at eye level; the
near island is visibly larger. The existing HUD occupies much of the narrow
viewport and the sides crop the islands. This is not touch-control or real-phone
performance acceptance. Owner acceptance of the in-Plaza composition remains open.

### Performance boundary and self-review

Retaining the approved mesh adds **612,348 submitted triangles** for two islands.
Together with the earlier 11,781,802-byte nature directory, the asset payload is
26,513,126 bytes before other world assets. This exceeds the earlier landscape
targets of 300K visible triangles and 25 MB; it is explicitly a preview tradeoff,
not a production performance sign-off. LOD/mesh and texture optimization plus
real-device profiling remain necessary before treating this as a shipping asset.

A separate author self-review covered the loader, batching, water, their four
unit tests and the public-only scene mount. It checked material/UV preservation,
transformed placement, reduced motion, load failure and resource disposal against
the plan and browser reports. No blocking defect was found for the local trial.
No independent reviewer was used, following the owner's single-agent instruction.
The earlier sky/backdrop integration requirement below remains separate.

### Final handoff verification

- Fresh `pnpm verify`: exit 0, **736 tests / 79 files**; typecheck and build pass;
  lint has 0 errors and 11 warnings in existing local QA scripts. Full output:
  `output/floating-islands-qa/verify-handoff.log`.
- After restarting dev on loopback port 3004, reran
  `pnpm browser run-code --filename=output/floating-islands-qa/verify-browser.cjs`:
  **ISLAND_INTEGRATION_PASS**, 0 scenario errors, water/reduced motion pass,
  0 idle cubemap captures and stable resources across three round trips.
  This fresh sample measured 98–101 FPS (mean 100.7), 163 calls and 1,268,480
  submitted triangles. Report: `output/floating-islands-qa/integration-handoff.log`.
- Initial page load logged a missing `favicon.ico` (404) and existing Three.js
  Clock/PCFSoftShadowMap deprecation warnings; these are separate from the
  error-free island scenario. No shader error was observed.
- The Impeccable source detector returned `[]` for the island mount; this does
  not assess canvas geometry, performance or touch usability. Images were
  inspected separately. `git diff --check` passed. QA browser session closed;
  local server left running for the owner's requested hands-on trial.

## Textured environment upgrade — 2026-11-10

The current public Plaza combines the retained architecture kit below with locally
hosted, optimized Poly Haven models and texture maps. Genshin Impact is visual
inspiration only; no game assets were extracted. Visual acceptance is still open.

### Sources and conversion

All eight source assets are CC0-1.0 under [Poly Haven's asset license](https://polyhaven.com/license).
Source URLs, author roles, source MD5 checksums, conversion recipes, output sizes
and SHA-256 checksums are recorded in `public/world/plaza-nature/provenance.json`.

| Source | Author(s) | Shipped triangles per variant |
| --- | --- | ---: |
| [Rock Moss Set 02](https://polyhaven.com/a/rock_moss_set_02) | Kless Gyzen | 1,200 / 1,200 / 1,200 |
| [Fern 02](https://polyhaven.com/a/fern_02) | Rob Tuytel; Rico Cilliers | 784 / 816 |
| [Tree Stump 01](https://polyhaven.com/a/tree_stump_01) | Rob Tuytel | 2,500 |
| [Tree Small 02](https://polyhaven.com/a/tree_small_02) | Rico Cilliers | 19,192 |
| [Fir Sapling](https://polyhaven.com/a/fir_sapling) | Rob Tuytel; Rico Cilliers | 7,036 |
| [Namaqualand Cliff 02](https://polyhaven.com/a/namaqualand_cliff_02) | Dario Barresi; Rico Cilliers | 3,500 |
| [Cobblestone Floor 08](https://polyhaven.com/a/cobblestone_floor_08) | Rob Tuytel | Color, OpenGL normal, roughness |
| [Forest Floor](https://polyhaven.com/a/forest_floor) | eye-candy.xyz | Color, OpenGL normal, roughness |

Rebuild with `node scripts/prepare-plaza-assets.mjs` after `pnpm install --frozen-lockfile`.
The offline preparation script uses the existing pinned meshoptimizer 1.1.1 and
sharp 0.35.5 packages, verifies source downloads, bakes node transforms, retains UVs
and normal/material channels, simplifies the meshes, and writes max-1024px WebP
textures (quality 93, alpha quality 100). The glTFs require EXT_texture_webp.
Source downloads are cached in ignored `output/plaza-source-cache/`; runtime never
contacts the source provider. No new package was added for this upgrade.

Tree origins use the lowest 5cm of the trunk rather than canopy bounds; a regression
test protects root/collider alignment. Other variants are horizontally bounds-centered
and sit at local Y=0. Cutout leaves use MASK, not transparent sorting.

### Layout and runtime contract

The public envelope is 56×48m with five landscape pockets and a connected outer
loop. Spawn, NPC and portal anchors remain unchanged. Flat Y=0 movement is retained;
the mountain base is scenery, not a new traversable level.

Placements: 4 broadleaf trees, 6 firs, 4 root/stump pieces, 33 ferns, 36 mossy rocks
and 6 textured cliff pieces. Root pieces are composed beneath trees, not a claim
that the source trees contain custom sculpted roots. Existing architecture remains
procedural; this is a hybrid kit, not a fully bespoke AAA environment.

`PublicPlazaNature` owns each GLTF load and instances repeated geometry/materials.
Owned resources and ImageBitmaps are disposed on unmount, including late loads.
Each model has a localized fallback; ground remains usable if textures fail.
`PlazaTexturedGround` preserves world-space UVs for paving and planted earth.

### Measured evidence (desktop dev build, 1440×1000, DPR 1, noon/clear)

| Measure | Result |
| --- | ---: |
| Entire new asset directory, including provenance | 11,781,802 bytes (11.78 MB / 11.24 MiB) |
| Placed textured nature | 219,408 triangles / 12 mesh batches |
| Ground | 686 triangles / 3 mesh batches |
| Complete landscape group, including retained architecture | 251,224 triangles / 23 mesh batches |
| Landscape contribution to renderer submissions | 38 calls (133 visible − 95 hidden) |
| Whole scene, including sky/backdrop/character and shadow passes | 133 calls / 656,132 submitted triangles |
| 10-second fixed-view sample after swaps | 106 FPS; 9.4–9.5 ms |
| Three settled public-world visits | 96 geometries / 68 textures each |
| Three settled personal-world visits | 92 geometries / 29 textures each |

The visibility comparison was temporary and restored in `finally`; it measures
landscape contribution, not a historical baseline. The pre-upgrade recorded noon
spawn snapshot was 135 calls / 182,748 submitted triangles / 101 FPS; that was a
single sample, not a controlled before/after benchmark. Higher triangle submissions
are expected with real meshes. The ≤300K target applies to landscape geometry,
not the whole scene including repeated shadow submissions. No real-phone FPS claim.

### Behavioral QA and remaining acceptance

- Gates: `pnpm typecheck` exit 0; `pnpm lint` exit 0 (QA-snippet warnings only);
  `pnpm vitest run` 77 files / 732 tests passed; `pnpm build` exit 0 with `/world`
  generated as a dynamic route. Separate author self-review, not an independent review.
- Both NPC dialogues, keyboard portal/return, walk/sprint/jump/landing, camera
  orbit/zoom/reset were exercised. The full outer loop at X±23/Z±19 and pavilion
  interior `[-20,0,-6.3]` were reached. The added lantern stopped the player at
  `[-20.983,0,12.75]`, matching its collider plus the player radius.
- Forced failure of `tree_small_02/model.gltf` showed its fallback while the other
  models, avatar, movement and world-switch button remained available; restoring
  the request and reloading recovered normal assets.
- All six model groups reported ready after each of three public/personal swaps.
  Resource counts did not grow between settled visits.
- Mobile 390×844: avatar ready, no document horizontal overflow. Reduced motion
  gave the Plaza ripple scale `[1,1,1]`. This does not certify all sky animations.
- Captures exist under ignored `output/plaza-landscape-qa/final-textured-*.png`
  for desktop noon/dusk/night/rain, mobile noon, reduced motion, pavilion, overlook,
  close-up, overhead and failure state. The image tool rejects image input in this
  session: these files have **not been visually inspected**. Material cohesion,
  clipping, rooted-tree quality, cliff sealing and small-screen composition remain
  an explicit human/rendered-review gate, not a technical-test pass.
- The sky checkout was not edited. Shared backdrop integration is still required:
  cliff extents are 28.35/24.35, while unchanged sky-owned mist uses 16.35/15.35.
  Do not copy the whole backdrop over concurrent sky work; reconcile its terrain
  hunks sequentially and recheck the combined scene.

## Earlier procedural architecture kit (retained history)

This kit extends the summit direction in `docs/superpowers/specs/2026-11-09-public-plaza-summit-design.md` using the owner's supplied mountain-academy reference: pale carved stone, warm timber, blue-gray tiled roofs, cream/lilac banners, layered pine and blossom trees, and turquoise water.

## Integration contract

`createFantasyPlazaAsset(kind: PlazaAssetKind): PlazaAssetPart[]`

Kinds: `fountain`, `tree`, `blossom`, `bench`, `pillar`, `signpost`, `lantern`, `rock`, `flowers`, `pavilion`, `gate`.

Each part has `geometry: BufferGeometry`, `color: string` and `material: 'stone' | 'wood' | 'foliage' | 'metal' | 'water' | 'glow' | 'cloth'`. Geometry is already positioned in local coordinates; the consumer applies the prop transform and owns disposal. Geometry is fresh for each call. Normals and bounds are computed. No textures, DOM, random source, frame updates or new packages are required. Same color/material shapes merge within each asset, leaving consumers free to merge repeated instances globally. Colors are material base colors; the kit does not require vertex colors.

## Scope and checks

Only the generator and its tests are owned by the asset implementer. Scene integration, spatial layout, sky, camera, interactions and visual acceptance belong to the parent task.

The acceptance checks protect finite geometry, valid normals/indices, independent buffers, deterministic output, collider envelopes, an unobstructed gate passage and a bounded unique-kit triangle budget. Focused tests run before handoff. Root performs rendered review and full integration gates.

Form language: a twelve-sided carved rim and staggered natural rocks for the fountain; upturned roof courses and narrow ridge caps for gate/pavilion; bent tapered trunk segments, visible negative spaces and layered foliage sprays for trees. Decorative edges stay small enough to read as craft rather than clutter at gameplay scale. All meshes were authored for this task with the installed Three.js package. No external model, texture or generated bitmap is included.

## Current integration measurements

The exact named export is **`createFantasyPlazaAsset`**. `tree` and `blossom` are separate kinds; each returns its own foliage palette in `color`. Root may preserve these colors as vertex colors when merging by `material`.

Final measurements from all positions: fountain radius 1.70 m, height 1.73 m; pine bounds X -2.10..2.08 m, Z -1.73..1.13 m, height 5.26 m; blossom same horizontal envelope, height 5.36 m. All foliage starts above 2.9 m; below 1.8 m, the wood remains within a 0.5 m trunk radius. Pavilion width 5.95 m, depth 4.92 m, height 5.87 m; post centers X +/-1.96 m, Z +/-1.48 m. Gate width 4.75 m including roof trim, depth 1.62 m above the lintel, height 4.94 m. Its low columns are strictly within the existing X +/-1.8 m centered 0.9 m squares. All geometry below Y 3.3 m remains outside the X -1.35..1.35 m passage. Roof decoration is above the old lintel and may overlap the old floating crystal position: parent should place that interaction ornament above the roof crest if retained.

| Kind | Triangles | Material/color parts | Height (m) |
| --- | ---: | ---: | ---: |
| fountain | 1,030 | 9 | 1.73 |
| tree | 1,788 | 5 | 5.26 |
| blossom | 2,940 | 5 | 5.36 |
| bench | 208 | 4 | 0.87 |
| pillar | 248 | 6 | 3.56 |
| signpost | 140 | 5 | 2.16 |
| lantern | 248 | 6 | 1.33 |
| rock | 52 | 1 | 0.70 |
| flowers | 846 | 5 | 0.40 |
| pavilion | 6,908 | 10 | 5.87 |
| gate | 6,520 | 10 | 4.94 |

The complete unique kit is **20,928 triangles**. Roofs have opaque undersides for ground-level viewing. Parts share no buffers across factory calls, and construction intermediates are disposed after merging. Returned buffers belong exclusively to the caller.

Verification: `pnpm vitest run src/components/world/fantasy-plaza-assets.test.ts` reports **35 passed**; `pnpm typecheck` exits **0**; `pnpm exec eslint src/components/world/fantasy-plaza-assets.ts src/components/world/fantasy-plaza-assets.test.ts` exits **0**. The focused test history includes an initial empty-factory RED (30 failures), then GREEN, and a separate roof-underside raycast RED/GREEN. No browser/visual fidelity or full integration acceptance is claimed by the asset implementer; root owns those checks.

Continuation review (2026-11-10): no further generator, material-contract, disposal or collider-envelope defect was found. One focused run hit the 5 s timeout in the pavilion determinism test (34 passed, 1 timed out). Comparing its large typed arrays through the deep matcher was unnecessary overhead; the test now checks equal lengths and every element with `Object.is`, retaining exact coverage and independent-buffer checks. The unchanged generator produced two pavilions in 73 ms in a direct probe, and the replacement comparison rejected a deliberately changed vertex. The focused suite then reported **35 passed** in **6.79 s**, and focused ESLint exited **0**. No geometry or palette changed; full gates and browser acceptance remain the parent task's responsibility.
