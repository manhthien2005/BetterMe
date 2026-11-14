# Island V2 integration implementation plan

**Goal:** Replace all active old Plaza floating islands with Vườn Gió plus six approved V2 assets, then run the app.
**Architecture:** Existing worktree/placements; typed Three runtime consumes approved art metadata before batching and owns all effects/resources. Preserve the approved source snapshot. Reuse existing React scene mounting/environment inputs.
**Tech:** Next 16.4.3, React 19.2.7, Three 0.187, TypeScript strict, pnpm/Vitest/Playwright. No dependencies or framework changes.
**Spec:** ../specs/2026-11-12-island-v2-integration-design.md

## Tasks

- [x] Asset promotion: seven exact GLBs + compact manifest with bounds/hashes; delete only verified superseded public island files. Asset verifier pins IDs/hashes, old-file absence and approved source integrity.
- [x] Runtime adapter: typed `prepareIslandV2(source: Group, allWaters?: Mesh[]): { root, clock, daylight, effects, waters, dispose }` in `src/components/world/island-v2/`. Source already has placement transform. Tests for transformed anchors/water levels, UV normalization, normals, matte foliage, night effects and disposal. Port exact art shaders into typed modules; no ts-nocheck/any escape.
- [x] Parent loader/component: rename Mạch Nguồn placement; preserve loading/error/unmount ownership. Create placement wrapper before adapter, remove old runtime path. Connect night/day, shared clocks, hidden/reduced motion and bounded staggered captures. Update focused placement/resource tests, run RED then GREEN.
- [x] Validate: 20 focused tests, typecheck/lint/full suite/build (no dev running), self-review and independent bounded code review; run loopback preview and browser checks on actual scene. Repair failures, recheck affected paths. Record evidence in docs/HANDOFF.

## Interfaces and ownership

Runtime worker owns only island-v2/* modules/tests. Parent owns plaza-floating-islands.ts, public-plaza-floating-islands.tsx and their tests, integration docs and verification. Asset worker owns public/world/floating-islands/*, removal of obsolete public/world/floating-island files and asset-specific test/report. Workers are not alone; preserve others' edits and do not run shared dev/build. Existing unrelated changes remain.

Runtime `waters` expose update(renderer,scene,camera), dispose; `effects` exposes setNight(boolean), update(viewportHeight), state, dispose. All clocks are `{value:number}`; returned root coordinates already contain world placement. Adapter owns input source on success/failure. Parent does not dispose source twice. Reflection systems use a global shared water visibility list to avoid recursion and cross-island feedback.

## Review focus

World transforms/anchors and lamp scale; all-water hiding and renderer-state restoration; cancellation or partial-load failure; GPU capture budget in seven-island scene; unrelated existing work and authoring snapshots preserved.

## Execution rulings/evidence

Owner explicitly requested apply/run; no repeat approval step. Reuse existing isolated Plaza worktree rather than copying unrelated uncommitted changes. Delegation remains authorized by the current collection task. No commit without explicit user request; retain plan/evidence.

Parent handled asset promotion rather than an additional worker. Runtime worker owned island-v2 modules; separate read-only reviewer checked the integrated runtime/loader/scheduler. Camera capture regression found during parent review: staggered captures require frozen view as well as projection/inverse/world matrices; test RED then GREEN, final browser recheck passed. All seven world bounds pass unchanged placements. `pnpm verify` exit 0: 818/818 tests, 93 files, build 11/11; final lint 0 errors and 28 existing warnings. Browser final 11 PASS; two lifecycle cycles stable. No art source modifications, app dependencies, commits or deployment.

Final reviewer found retained CPU geometry references in the mounted adapter closure. Parent reproduced with `node --expose-gc output/island-v2-integration/verify-gc.mjs` RED, cleared original resource sets and batch map in finally, then same live-island GC probe GREEN. Full verify repeated after repair. No deferred review findings.
