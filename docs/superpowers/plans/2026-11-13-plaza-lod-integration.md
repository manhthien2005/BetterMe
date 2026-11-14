# Put optimized islands into Plaza for owner review

Scope: `plaza-floating-islands.ts` URLs + existing Meshopt decoder; update asset
selection/loader assertions. Preserve seven original detailed GLBs and all layout,
materials, water scheduling and loader lifecycle. No dynamic LOD or deployment.
Spec: owner-promotion amendment in `2026-11-13-plaza-performance-design.md`.

- [x] RED current URLs and missing decoder, then switch to verified LOD files.
- [x] Focused source integrity/loading/preparation tests. Fresh browser with actual
  network (no substitution): seven LODs, relative textures, both Plaza routes,
  day/night/walking/mobile, repeated visit resources and no failed shaders.
- [x] Four gates with dev stopped before build; separate author self-review;
  update QA/handoff, restart and open Plaza preview. No commit/push.
