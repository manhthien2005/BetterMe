# Plaza Mountains V6 Implementation Plan

> Execute inline with `superpowers:executing-plans`; single agent/self-review per AGENTS. No commit/push.

**Goal:** Replace all old Plaza mountain scenery with the ten V6 assets in a balanced surrounding layout.
**Architecture:** Existing Three loader/instancing and atmosphere. Explicit band/placement catalog, byte-identical asset copy, remove study-specific old collection. Existing app/worktree stays intact outside mountain scope.
**Spec:** `../specs/2026-11-13-plaza-mountains-v6-design.md`.

- [x] 1. Add RED assertions to `plaza-mountains.test.ts`: ten V6 assets/hashes/geometry budgets, 4/4/8 placements uniform scale/band/sky/safety/coverage, role-aware foliage/snow. Keep lifecycle/opaque tests. Baseline 16 tests passed before editing.
- [x] 2. Copy ten files and compact manifest to `public/world/mountains`; preserve root sources. `plaza-mountain-layout.ts` owns authored layout; `plaza-mountains.ts` consumes it and preserves V6 leaf normals, restricts snow to rock. Remove old horizon placement constant and migrate its bounding coverage checks to actual layout. Remove study selector from component/backdrop, obsolete `plaza-mountain-study.ts` + duplicate old asset tests, retire `public/world/mountain-study` runtime files. Update preview copy/count in `world-client-shell.tsx` and verify in its test.
- [x] 3. Run focused suite GREEN. Browser compare baseline; tune only placements/scale/heading within same budget. Save screenshots at actual cameras and four directions, near detail, day/dusk/night/rain/mobile; check regular route too. Three lifecycle cycles, partial network failure/recover; record renderer/frame counters and limitations.
- [x] 4. Stop verified checkout dev parent/child. Run `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build` with logs. Self-review changed files/assets, source hashes and evidence. Update `docs/plaza-assets.md`, `HANDOFF.md`, QA/context and this plan. Restart local preview and smoke, close QA session, open owner preview.

Review focus: no index-based band assignment; uniform scale preserves tree proportions; clear sky gaps instead of a wall of peaks; leaf material shader works for V6 IDs; no snow on ferns/trees/props; assets don't collide with islands; old study branch cannot silently keep old models; late loads and three map swaps release resources. Tests cannot establish visual quality or real-device performance; inspect screenshots and report limits.

Progress and rulings: `output/mountain-v6-integration/PROGRESS.md`.

Final: 23 focused / 822 full-suite tests pass, typecheck/lint/build exit0; inspected rendered evidence, post-build smoke passed; local preview restarted on3004, QA closed. Details and performance limits in `output/mountain-v6-integration/QA.md`.
