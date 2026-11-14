# Plaza distant island assets — implementation plan

Spec: `docs/superpowers/specs/2026-11-13-plaza-performance-design.md`.
Execute inline; separate self-review. Preserve unrelated dirty work. No commit.

- [x] Profile source and render paths; retain diagnostic baseline.
- [x] RED separate LOD budget/lineage test in `plaza-island-assets.test.ts`.
  Create `scripts/optimize-plaza-islands.mjs`: immutable source argument, output
  separate directory, attribute-aware simplification, bounded quantization and
  meshopt compression. Water/node/material/texture data preserved.
- [x] Validate independent decode, geometry and original hashes. Copy accepted
  derivatives to `public/world/floating-islands/lod/` without altering originals.
- [x] Capture all seven original/LOD views and actual Plaza images in isolated
  QA browser. Check close contours/canopies/landmarks/water and far composition,
  daylight/night/mobile. Benchmark geometry-only substitution with unchanged
  viewport/render logic; document what this does and does not measure.
- [x] Focused tests, four gates with dev stopped before build, self-review,
  update provenance/HANDOFF/QA, restart preview and open comparison gallery.

Owner narrowing: dynamic loading/LOD switching/water scheduling are deferred,
not incomplete steps in this asset-only delivery. Production URLs stay original.

Review focus: wind UV preservation; tiny important landmarks; accessor stride and
types; decoded min/max bounds; water semantics; exact immutable detailed inputs.

Complete:14focused tests;824full tests/94files;typecheck/lint/build exit0. Final
35,794,311bytes/1,661,757triangles; original7GLBs unchanged. Actual compressed
viewer7/7, image comparisons and exported decoder checks passed. See QA for
render-time benefit and limits. No product loader/placement URL changes.
