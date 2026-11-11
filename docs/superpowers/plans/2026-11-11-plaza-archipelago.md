# Plaza archipelago implementation

## Latest: mountain horizon and distant island scatter

Owner's explicit correction authorizes this refinement; execute inline in the
existing worktree. Reuse current terrain builder and static batching.

- [x] Add `plaza-horizon.ts` for deterministic three-band placements, small
  faceted island geometry and shared public view/sky/reflection ranges. First
  add `plaza-horizon.test.ts`: bounds beyond the main islands, finite/repeatable
  lightweight geometry, varied heights and coverage inside sky/camera. RED→GREEN.
- [x] Update `public-plaza-backdrop.tsx`: reuse sculpted ridges for 5/9/17
  mountain clusters, batch by depth/color, replace obsolete mountain ornaments
  with distant island silhouettes, preserve near mist and extend distant veil.
  Reuse existing memoized ownership/disposal and palette changes. Check the
  render rather than relying on numerical distances alone.
- [x] Use shared ranges in `world-canvas.tsx`, `world-scene.tsx`,
  `world-sky-environment.tsx`, `plaza-island-water.ts`; extend reflection test.
  Keep personal range, controls, approved GLBs and their transforms unchanged.
- [x] Browser: fresh desktop/mobile, spawn/eye/rim/rear, noon/dusk/night/rain,
  public-personal-public range and resource checks. Inspect reduced JPEGs.
  Separate self-review; stop this checkout's dev, run `pnpm verify`, update
  current handoff/provenance/ledger, restart preview and close QA browser.

Review focus: silhouettes washed out by the old 92-unit scene fog; sky drawn
in front of far terrain; mist obscuring low island terraces; orphan ornaments;
skyline bases exposed beyond the mist; unstable scatter on rerender; GPU cleanup.
No asset regeneration, dependency, machine-setting change, commit or delegation.

Gate finding: two existing `fantasy-plaza-assets.test.ts` cases exceeded 5s.
Installed Vitest 4.1.9 probes deep equality even for negated identity assertions.
Change only the geometry/array identity assertions to boolean identity; retain
full element checks and timeout. Isolated 35/35 pass; pavilion/gate comparison
times improved from 1784/1650ms to 108/94ms. Final verify exit 0: 745 tests /
82 files, lint 0 errors / 26 scratch warnings, build 11/11. HORIZON_RESTART_PASS
after restart on loopback 3004; QA session closed. No pending work or commit.

Design: `../specs/2026-11-11-plaza-archipelago-design.md`.
Execute inline in the existing isolated worktree, without delegated agents.

1. Preserve the current integration in ignored `output/plaza-archipelago-qa/baseline`.
   Add failing coverage in `plaza-floating-islands.test.ts` for all seven models,
   transformed full bounds and near/far diversity. Retain batching/UV/disposal
   coverage. Add loader lifecycle tests for partial failure and cancellation.
2. Copy approved GLBs and manifest to `public/world/floating-islands/`. Check all
   hashes. Extend `plaza-floating-islands.ts` with explicit source URLs and
   composition transforms; own one model per placement. Extend
   `public-plaza-floating-islands.tsx` for independent asynchronous loads and
   staggered reflections. Keep `plaza-island-water.ts` unchanged.
3. Run focused Vitest. Start loopback dev on 3004; inspect and tune the composition
   with `pnpm browser`. Save screenshots and runtime evidence under the new QA
   directory. Exercise partial/all failure, late loads, map swaps, motion,
   environment states, mobile viewport and existing controls.
4. Self-review code and rendered results. Stop this checkout's dev and run
   `pnpm verify`. Record current evidence, cost and limits in `docs/plaza-assets.md`
   and `HANDOFF.md`. Restart local preview for owner inspection. No commit/push.

Baseline: the existing island/water focused suite passed 4 tests in 2 files.

## Owner depth correction — 2026-11-11

1. Tune the seven existing placement transforms in the browser into near/middle/
   far layers; inspect spawn, eye-level and northern-rim views before saving.
   `plaza-floating-islands.ts` owns placement. Do not regenerate model assets.
2. Add a focused failing composition assertion in `plaza-floating-islands.test.ts`
   for the requested size/depth relationships and lower Thác Tầng. Save tuned
   transforms; expand `world-canvas.tsx` public far plane and the existing water
   reflection camera far plane to include the new distant layer. Test full
   transformed bounds against that range and retain collision/hash checks.
   Lower the decorative group/floor in `public-plaza-backdrop.tsx` to clear the
   terrace sightline, preserving the summit cliff. Update `world-scene.tsx`'s
   existing camera loop because Canvas retains the camera across map swaps;
   browser regression must see public 420 → personal 140 → public 420.
3. Browser-check saved positions after reload, view/frustum coverage at rim,
   moving parallax, narrow viewport and lighting. Self-review. Stop only this
   checkout's dev, run four gates, update current provenance/HANDOFF, restart
   preview. No commit, delegation or deployment. The owner's detailed correction
   authorizes this revision without repeating a design approval round.

## Restore summit mist and sparse distant mountains — owner correction

1. In `public-plaza-backdrop.tsx`, separate mist from the mountain transform;
   retain the summit cliff and accepted island placements. Reduce 7/8/8 mountain
   placements to 2/3/3 and move them outward. Keep their decorative parts aligned.
2. Extend the existing mist geometry with an optional gradual valley drop, with
   a focused RED→GREEN geometry test proving clear cliff-side edges, continuous
   descent, bounded elevations and unchanged default behavior. Extend the sea's
   radius to the distant peaks while preserving its soft inner/outer alpha fade.
3. Inspect fresh desktop spawn/rim/orbit and narrow viewport, noon/dusk/night/rain.
   Confirm mist is visible and low terraces remain legible. Self-review, stop
   this checkout's dev, run all four gates, update handoff and restart preview.
   Single agent; no commit/push/deploy. This carries out the owner's explicit
   correction; no additional approval round or asset regeneration is needed.

Completed: independent mist group with 26-unit descent; eight mountain clusters
at [0,-22,0], scale [2.4,3,2.4]. Removed two decorative waterfall strips whose
massif was removed. Focused 10/10 tests, SUMMIT_MIST_PASS, DEPTH_WALK_PASS;
final pnpm verify exit 0 (742 tests / 81 files, lint 0 errors / 25 QA warnings,
build 11/11). Preview restarted on loopback 3004; seven saved placements checked.
