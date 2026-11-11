# Snow mountain integration — inline plan

Spec: ../specs/2026-11-11-plaza-snow-mountains-design.md. Owner authorized execution.

1. Derive six optimized runtime GLBs from approved packed sources using installed
   Blender; write a manifest with source/runtime hashes, bounds and budgets.
   Keep authoring files/gallery untouched. Verify mesh/UV/texture export.
2. Add failing tests for placement bands, selected snowy distant peaks,
   transformed bounds, resource sharing and idempotent/late/partial disposal.
   Implement `plaza-mountains.ts` with `MOUNTAIN_MODELS`, `MOUNTAIN_PLACEMENTS`,
   `createMountainInstances(source, model)` and `loadPlazaMountains(parent)`.
   Use existing `disposeNatureResources` and GLTFLoader; no cache ownership leak.
3. Add a small `PublicPlazaMountains` component for load/unload and environment
   haze uniforms. Mount it at the old backdrop mountain group; remove only the
   obsolete procedural mountain generation/materials. Keep ridge helper tests.
4. Inspect actual GLBs in Plaza and tune snow/height/haze/shape in batches.
   Check spawn/eye/rim/rear, four lighting/weather states, mobile, controls,
   partial/late load and three map-swap cycles. Save reduced JPEG evidence.
5. Separate self-review; focused tests then stop verified dev tree, `pnpm verify`,
   restart 3004 and inspect final scene. Update HANDOFF/provenance and deliver.

Review focus: local scene fog erasing distant assets; snow color after lighting;
invisible mountain bases writing depth; source disposal of shared textures and
instance buffers; old request mutating a new mount. Each has a test or runtime
probe above. No app build while dev is running, and no commit is authorized.

## Progress

- Existing worktree and current 31-mountain / 12-island backdrop inspected.
- Spec/plan recorded from owner's explicit authorization. Implementation next.
- Six runtime GLBs exported read-only from approved sources: 14,049,944 bytes,
  466,984 placed triangles, 30 instance batches. Buffer/normal/UV/hash checks pass.
  Simplification moved two ground fans millimeters below zero; export now anchors
  the ground plane before validation. Authoring originals remain unchanged.
- Implemented selective snow, slope-aware edges, depth haze and base fade;
  replaced old mountain geometry and its now-unused builder/materials only.
  First visual pass was too tall/pale: capped vertical stretching to 1.5x
  horizontal and reduced haze. Six selected middle/far placements have snow.
- Focused suite: 17 tests across 5 files (latest individual mountain 6/6);
  malformed source disposal and initial night palette both observed RED → GREEN.
  A render-updated userData prop erased loader status; loader now owns metadata.
- Browser lifecycle PASS: after an equal 360-degree view sweep, 3 visits hold
  Plaza 248 geometries / 162 textures and personal 104 / 29. Initial counts
  differed with unvisited frustums (lazy GPU uploads), not increasing resources.
  One failed GLB leaves 5 models; late results release without changing personal
  GPU counts; returning recovers all 6. No JS errors in that run.
- During development HMR temporarily retained objects from the old return shape
  while the frame callback used the new method; fresh page load cleared it.
  Final acceptance must use fresh reload, not that stale development session.
- Separate self-review: resource ownership, bounds, snow scale, atmosphere order,
  no extra shadow/reflection pass, approved island hashes, and final art images.
  Host React-best-practices skill is not exposed; existing R3F load/frame/dispose
  patterns used, with no new React/Next API or dependency. Full gates next.
- Full `pnpm verify` exit 0: typecheck, lint 0 errors / 26 existing QA warnings,
  751 tests / 83 files, build 11/11. Dev wrapper 5392 and verified descendants
  stopped, port3004 closed before build. New wrapper 37044 on loopback only.
- Final visual states inspected, no bad shader programs. Handoff/provenance and
  authoring README updated to distinguish originals from integrated derivatives.
- Fresh restart: SNOW_RESTART_PASS — 6 models / 31 placements / 6 snowy groups,
  4 mist layers / 7 main islands / 0 failed shader programs. Preview ready on
  port3004, wrapper37044. QA session closed; no commit/push/deploy.
