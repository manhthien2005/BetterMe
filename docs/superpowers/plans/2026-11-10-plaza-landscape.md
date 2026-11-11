# Plaza Landscape Implementation Plan

> Execute with superpowers:executing-plans. Owner explicitly requests one asset subagent; root implements integration and evaluates code, visuals and experience.

**Goal:** A playable fantasy academy plaza and surrounding gardens based on the owner's reference image.

**Architecture:** Keep the existing map and sky contracts. Geometry asset factories feed a static batched renderer; pure placement data feeds both visual placement and collision registration.

**Tech Stack:** Existing React Three Fiber, Three.js, TypeScript, Vitest and pinned Playwright CLI.

**Spec:** `docs/superpowers/specs/2026-11-10-plaza-landscape-design.md`.

## Global constraints

No sky/camera/fade changes, no dependency, no secrets, no commit/push. Only plaza changes. All checks and browser processes use this worktree; browser session `plaza-landscape`, port 3001. Stop its dev before build. Preserve no-guilt/no-decay.

## Review focus

1. Solid decorative objects agree with colliders; spawn, both NPC approaches and portal passage remain free.
2. 360-degree camera and phone view: canopy/roof do not block player or useful view; verify visually.
3. Reduced motion and day/night switch: effects freeze; materials still respond to snapshot.
4. Repeated space transitions: owned geometries/materials dispose and renderer counts stabilize.
5. Source is an uncommitted snapshot: deliver only task delta for later integration, never claim all baseline files are new work.

### Task 1 — Isolate and record baseline
- [x] Create `.worktrees/plaza-landscape-v1`, copy stable source/assets without secrets/caches, record hashes.
- [x] Install with frozen lockfile; world baseline tests: 9 files / 71 tests pass after copying required moon provenance source.
- [ ] Capture baseline noon screenshot and renderer/frame sample on 3001.

### Task 2 — Original fantasy asset kit (asset specialist)
Files: `src/components/world/fantasy-plaza-assets.ts`, `fantasy-plaza-assets.test.ts`, provenance note.
- [ ] RED then GREEN for finite geometry, bounds, normals, deterministic fresh instances, portal opening and tree headroom.
- [ ] Export kind-based factory with grouped material geometry, document palette and disposal ownership.

### Task 3 — Ground, gardens and integration (root)
Files: `src/lib/world/plaza-landscape-layout.ts`, colocated test; `src/components/world/public-plaza-landscape.tsx`; narrow edits to `world-scene.tsx` and `map-config.ts`.
- [ ] RED tests for clear spawn/routes, collider registration only in public plaza and nonoverlapping solid decorations.
- [ ] GREEN placement/collider model; integrate asset kit and paving, planted edge pockets, pavilion and water/lantern treatment. Retain personal-world renderer.
- [ ] Root reviews actual code and factory resource lifecycle; run focused tests/typecheck.

### Task 4 — Rendered acceptance and handoff
- [ ] Inspect desktop and phone screenshots, noon/dusk/night/rain, rotate and walk around, interact/travel/reset. Check reduced motion and console/shader errors.
- [ ] Compare frame/renderer evidence and repeat space transitions; fix observed issues.
- [ ] Run Impeccable detector once on changed targets.
- [ ] Stop verified 3001 dev process; `pnpm verify` (all four gates); record output.
- [ ] Record task-only changed paths against baseline manifest. Restart server on 3001 and present review link/screenshots to owner.

## Execution ledger

Ruling: existing summit spec and owner's supplied image establish direction; implementation follows owner's request to build for hands-on review. No extra approval cycle or separate design system documentation.
Ruling: repository's browser script hardcodes `betterme-qa`; adding a second -s yields a comma-named unusable session. Use the same pinned executable through `pnpm exec playwright-cli -s=plaza-landscape` for isolation, without editing package.json.
Ruling: skills' automatic commits/reviewer spawns are overridden by repository/owner scope: no commits; asset agent plus root self-review.
