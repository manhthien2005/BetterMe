# Plaza distant island asset optimization

Owner reports heavy loading/lag, then specifies keeping detailed originals and
adding distant LOD plus view-based loading. Latest steering: ASSETS FIRST, focus
on optimizing the floating islands. No product loader, water scheduler, placement
URL or current app asset switch in this step. Work single-agent in existing Plaza
worktree. No commit/push/deployment.

Baseline same desktop overview:294.73MB island GLBs,10.09M island triangles,
median115ms; skipping water captures54.6ms; hiding islands as well18.2ms. CPU
submission8ms. Geometry/GPU cost and duplicate water passes dominate render cost.
Local asset responses finish around19.4s after navigation. These are diagnostic
samples, not physical-phone benchmarks.

Create a separate `public/world/floating-islands/lod/` collection using existing
Meshoptimizer1.1.1. Deterministic attribute-aware reduction preserves silhouettes,
canopy coverage, materials/textures, ruin locations, node metadata/transforms and
all effect anchors. Water geometry/UV remain exact. Pack reduced geometry with
EXT_meshopt_compression and bounded float precision: position error<=2mm in local
units, other attributes<=0.0002; retained normals and wind UV are not regenerated.
Original detailed GLBs, their manifest and authoring sources remain byte-identical.

Target: distant collection<45MB, <1.8M placed triangles. The initial1.6M target was revised after visual comparison showed thin canopy coverage; keep more canopy triangles. Preserve all seven island
identities, outlines and landmarks. No new dependency. Avoid removing entire
islands, redesigning their vegetation or lowering viewport resolution.

Acceptance: actual byte/triangle reduction; decoded geometry/indices finite and
valid; metadata/material/texture identity; source hashes unchanged; seven-island
same-camera image comparisons including a real Plaza context, day/night/mobile.
Inspect rendered images. Isolated browser substitutes decoded LOD for visual QA,
and roundtrip verification establishes exact equivalence to compressed deliverable.
Compression requires the existing Meshopt decoder when integrated later. Identical texture images are shared by URI across the seven LODs; pixel data is unchanged.

View-based loading, distance switching and water capture optimization are the next
step, expressly deferred. This step must not claim the normal app's lag is fixed.
Run focused tests and four gates with dev stopped before build; keep preview,
evidence and measured limits in QA/handoff.

## Owner promotion for Plaza review

Owner now asks to place the lightweight collection into Plaza for review. Both
normal and study Plaza use the seven verified compressed LOD URLs; register the
existing Three Meshopt decoder before loading. Preserve exact placements, two-load
concurrency, effects, cleanup and originals. This is a fixed lightweight preview;
view-dependent loading/distance switching remains deferred. Verify real requests
and textures (no QA interception), visual day/night/walking/mobile and map swaps.
