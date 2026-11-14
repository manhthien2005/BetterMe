# Plaza asset integration into the active sky checkout

> Execute inline with Superpowers writing-plans / executing-plans; scope is the owner's requested local integration, with a separate self-review.

**Goal:** Carry the existing plaza assets and scene integration from `codex/plaza-landscape-v1` into `feat/reading-quest-environment-v1`, the checkout serving port 3000.

**Architecture:** Copy only the plaza delta identified against `output/plaza-landscape-qa/baseline.json`. Apply narrow landscape hunks to the current scene/map files, retaining concurrent sky/rain work. Both branches currently point to `e0a9108`; the world code is uncommitted, so a Git branch merge alone would transfer nothing.

**Tech stack:** Existing Three.js, R3F, TypeScript and Vitest; no dependency changes.

**Spec:** `../specs/2026-11-10-plaza-landscape-design.md`; existing implementation and asset contract in `docs/plaza-assets.md`.

## Scope and acceptance

- Copy `src/components/world/{fantasy-plaza-assets.ts,fantasy-plaza-assets.test.ts,plaza-landscape-geometry.ts,plaza-landscape-geometry.test.ts,plaza-stone-material.ts,public-plaza-landscape.tsx}` and `src/lib/world/{plaza-landscape-layout.ts,plaza-landscape-layout.test.ts}`.
- Copy `docs/plaza-assets.md`, the plaza landscape spec and original plan for continuation context.
- Patch only landscape rendering/portal geometry in `src/components/world/world-scene.tsx` and garden/roof colliders in `src/lib/world/map-config.ts`.
- Preserve sky/rain, camera/fade, dependencies, character models, personal-world appearance and the source worktree. No new design or generator behavior.
- Acceptance: copied files match source hashes; existing asset/layout/camera regression tests pass; the combined scene renders at `/world`.

## Steps

- [x] Record target snapshots of shared files, copy the 11 new files, and apply the two narrow integration patches.
- [x] Run focused regression tests, `pnpm typecheck`, `pnpm lint`, and the full test suite. Inspect the actual delta as a separate self-review; results and remaining lint failure are below.
- [x] Use a separate browser session for a desktop/mobile smoke check and record results under `output/playwright/plaza-asset-merge/`.
- [x] Record status for the next module session. Keep the live sky dev server running; no production build in its shared `.next`, no commit/push while unrelated sky work is in progress.

## Review focus

Shared-file edits must retain concurrent rain imports/hookup. Garden colliders belong only to public plaza. Gate collision must cover the raised roof without blocking passage. Asset disposal and source provenance travel with the implementation. This transfer does not claim completion of the landscape's visual acceptance or of the ongoing rain task.

## Integration result — 2026-11-10

Local transfer is complete in `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`, branch `feat/reading-quest-environment-v1`, still at `e0a9108`. It is visible at `http://127.0.0.1:3000/world`. No Git merge commit, staging or push was performed: the source module and the surrounding world work are uncommitted. The original plaza checkout remains intact.

All 11 copied files match their source SHA-256 hashes. Separate self-review: target `map-config.ts` matches the plaza source; target `world-scene.tsx` matches the plaza source plus the concurrent `WorldRain` import and renderer hookup. This integration wrote neither the rain component nor sky/cloud/camera files. Source kit comprises 11 asset kinds and 20,928 unique-kit triangles; the scene also carries paving, planters and garden placement.

Fresh validation in the destination checkout:

- Focused asset, geometry, layout and world tests: **4 files, 53 tests passed**, exit 0 (`focused-tests.log`).
- `pnpm vitest run`: **74 files, 729 tests passed**, exit 0 (`full-tests.log`).
- `pnpm typecheck`: final run exit 0 (`typecheck-final.log`). Its initial transient failure in the concurrently edited rain component was resolved by that task.
- ESLint on the ten transferred/edited plaza TypeScript files: exit 0 (`plaza-lint.log`).
- `pnpm lint`: final run exit 1, two `react-hooks/immutability` errors at `world-rain.tsx` lines 106–107 (`lint-final.log`). This file belongs to the ongoing sky/rain task; no unrelated fix was applied here.
- Desktop 1440x1000 and mobile 390x844 screenshots inspected. Plaza renders, avatar is ready, no horizontal overflow, and public → personal → public travel works. Smoke run reports zero page exceptions. Console has an unrelated `favicon.ico` 404 and two Three.js deprecation warnings.
- `git diff --check`: exit 0. Nothing staged. Production build intentionally not run against the active sky dev server's `.next`; this is not a four-gate release acceptance.

Evidence is local under `output/playwright/plaza-asset-merge/`, including copied-file hashes, shared-file before snapshots, command logs, and desktop/mobile screenshots. The dedicated `plaza-asset-merge` browser session was closed; existing development servers and browser sessions were retained.

Continue landscape work here after sky is finished: use `docs/plaza-assets.md`, the original landscape spec/plan, and the integrated module files. The next commit must wait for the ongoing rain lint fixes and all four gates; broader landscape polish and full visual acceptance remain future work.
