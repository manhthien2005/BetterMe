# Plaza water visibility implementation plan

> Execute inline with superpowers:executing-plans; single agent per owner instructions.

**Goal:** Reduce unnecessary water scene renders while preserving the approved Plaza.
**Architecture:** Visibility guard at the shared water capture boundary; negative
camera frame priorities followed by ordinary R3F rendering.
**Stack:** Existing Three 0.187.0, R3F 9.8.2, Vitest and repo Playwright CLI.
**Spec:** `docs/superpowers/specs/2026-11-14-plaza-water-visibility-design.md`.
**Constraints:** Preserve assets/materials, 512px capture limit, current scheduler,
reduced motion and cleanup. No dependencies/GPU edits/commit/push/deploy.

## Implementation and review focus

- [x] Add RED tests in `island-v2/water-surface.test.ts`: behind camera and return,
  transformed/hidden ancestors, camera layers, edge intersection, a visible fall
  with an offscreen pool, and post-dispose update. Keep existing cleanup tests.
- [x] Record actual baseline capture count and camera mismatch in the browser.
- [x] Add conservative visibility guard in `island-v2/water-surface.ts`. Retain
  slots in `plaza-floating-island-frame.ts` unchanged so skipping reduces work.
- [x] Set PlayerRig priority -2 in `world-scene.tsx`; overview -1 and remove its
  manual render in `public-plaza-study.tsx`. Verify actual registered ordering,
  capture/main camera equality and one main render in both camera modes.
- [x] Run focused water/frame/overview/loading/asset tests. Inspect day/night,
  walking/turn-away/return, mobile, reduced motion and map swaps using `pnpm browser`.
- [x] Run typecheck, lint, full Vitest and build (stop verified checkout dev first).
- [x] Self-review final scope/failure cleanup and record measurements/limits in
  `output/plaza-water-visibility/QA.md` and `HANDOFF.md`; restart Plaza preview.
