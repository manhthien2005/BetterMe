# Plaza atmosphere and occlusion correction

**Goal:** Resolve the owner's mountain artifacts, dense mist and primitive distant islands.
**Execution:** Inline in the existing `codex/plaza-landscape-v1` worktree; author
self-review as required by AGENTS.md. Continuation is authorized by the owner.
**Stack:** Existing Three 0.187 / R3F / Vitest / repo Playwright; no new packages.
**Spec:** `docs/superpowers/specs/2026-11-11-plaza-snow-mountains-design.md`, latest correction.

## Evidence and constraints

The old loader forces all opaque and alpha-masked GLTF materials to transparent
with depthWrite enabled, then fades every fragment's alpha by height. A matched
browser probe restoring opaque drawing removes the rectangular patches, while
exposing the old alpha cutoff as a hard base. Atmospheric fading therefore must
be color-based, preserving foliage alphaTest and normal opaque depth rendering.
Approved seven main models/transforms and all source mountain GLBs stay intact.
No changes to auth, sync, camera controls, sky or personal world. No delegation,
commit, push or deployment. Baseline copies and probes in ignored
`output/plaza-atmosphere-fix/`.

## Tasks

- [x] 1. Regression RED -> GREEN in `plaza-mountains.test.ts` / `plaza-mountains.ts`:
  opaque rock remains opaque, cutout foliage retains alphaTest and depthWrite;
  height haze blends lighting color, never terrain alpha. Preserve batching,
  selective snow and cleanup tests. Tune depth palette in `public-plaza-mountains.tsx`.
- [x] 2. Refine `plaza-horizon.ts` and the distant-island construction/material in
  `public-plaza-backdrop.tsx`: uneven ledges, fluted rock and varied clustered
  foliage, restrained depth haze; retain deterministic placements. Check finite
  geometry, outward winding, deterministic variation and modest triangle budget
  in `plaza-horizon.test.ts`. Reduce existing mist opacities without moving summit.
- [x] 3. Browser: matched before/after west view, north rim/eye/rear/spawn,
  noon/dusk/night/rain, 390x844, reduced motion, main-island placements,
  no shader failures and three personal/public lifecycle swaps.
- [x] 4. Separate author self-review; detector; stop only verified dev tree for
  this checkout, `pnpm verify` all four gates; restart and check fresh assets.
  Record results in this plan and HANDOFF. Leave preview available, close QA.

## Review focus

Check terrain does not show a hard horizontal cutoff; snow stays lit; leaves
retain cutouts; far slopes keep shading rather than flat gray; island rock does
not look like a smooth cone; reduced mist does not expose a sealing-floor lid;
lighting changes and reloads do not flash; source GPU ownership stays intact.

## Progress

Matched `before.jpg` and `opaque-probe.jpg` confirm the transparency root cause.
Material regression: expected transparent=false received=true before fix; 13/13
focused tests now green. Geometry safety test also passed the original geometry;
the visual screenshot is the evidence for its art deficiency, not a false RED.

The thinner mist exposed a second mismatch: terrain was tone-mapping haze but
the sky does not. Haze now blends linear sky colors after terrain tone mapping.
Mountain feet extend 22 units lower while preserving each summit's height;
fog transitions at -48..-18, exposing more rock, with no hard base silhouette.
Initial QA: 6 models / 466,984 triangles / 30 batches, 0 transparent mountain
materials and 0 bad shaders; noon/dusk/night/rain, five angles and 390x844 viewed.
Temporary baseline copies renamed `.txt` because TypeScript includes `output/`;
no production compiler configuration changed.

Lifecycle PASS: three same-view public/personal cycles, public 249 geometries /
155 textures and personal 93 / 29; partial failure and late-load cleanup passed.
ATMOSPHERE_FINAL_PASS: 6 models, 7 main / 12 distant islands, mist .52/.28/.22/.20,
0 bad shaders, reduced motion pass. Separate author self-review of the exact
baseline diff found no blocking issue. Impeccable detector `[]`.

`pnpm verify` exit 0: typecheck passed, lint 0 errors / 26 existing scratch
warnings, 753 tests / 83 files passed, production build 11/11. Verified dev tree
37044 stopped and port3004 closed before build. Restarted wrapper28124 on loopback
3004 with dev-auth bypass. HORIZON_RESTART_PASS and ATMOSPHERE_FINAL_PASS on fresh
scene: 6/7/12, zero failed shaders, reduced motion passed. Current real weather
was rain, correctly increasing opacities to .60/.36/.30/.28. QA session closed,
diff check clean, index empty. No pending work, commit, push or deployment.
