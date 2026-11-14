# Vườn Gió botanical depth v3

Single-agent refinement of the accepted v2 art study. Spec: `2026-11-12-tiny-glade-island-study-design.md`, continued refinement v3. Owner explicitly asked to continue; retain placement/composition and existing runtime pipeline.

- [x] Save v2 source/viewer/manifest/GLB and equal-camera images under `output/tiny-glade-island-v1/renders/foliage-v3/`; inspect official image and incumbent renders.
- [x] Add a meaningful short-blade aspect-ratio regression to `verify-foliage.py`; watch it fail against v2. Adjust `blade()` and meadow distribution in `build.py`: height-scaled width, coherent curved tufts, gentler low-root contrast and uninterrupted coverage between tall patches. Keep local RNG and prop placement unchanged.
- [x] Refine `tree()` in `build.py`: crown-shaped normals, local cluster overlap occlusion, cooler interior / gentle exterior color and oval leaf size. Retain matte material and front-facing geometry. Keep geometry within the existing order of magnitude.
- [x] Render front/back/meadow/tree and low grass at both light presets, compare with v2, correct visible issues. Verify source, foliage, GPU double-sided shading, viewer interaction regression and JS syntax. Update README/RESUME and open the final viewer.

No new dependencies, application changes, reference asset edits, commits or deploys. Self-review separately. Rendering observations, rather than triangle counts or passing checks, decide the visual result.

## Evidence and separate self-review

- RED: 22,428 v2 grass blades had height/width below 4, appearing as short broad stumps. GREEN: all current meadow blades meet aspect >4, curve and terrain/water tests pass; height p10=.182 / p90=.647. Width cap and more distributed tuft roots address the visible issue without more blades.
- Crown volume: overlap-based vertex cavity tint, ellipsoid/crown normals, wider but same-topology leaves, cooler dark palette. Pass 1 had an overly dark underside; pass 2 adds gentle stylized transmission and cool fill to broad-leaf materials only. Petals retain prior response. Hazel gets the same coherent volume treatment.
- Fresh verification: `FOLIAGE_SOURCE_PASS`, `ISLAND_SOURCE_PASS`, `FOLIAGE_GPU_PASS`, 21-check `VIEWER_QA_PASS`, `node --check viewer.js` exit 0, detector `[]`, console 0 errors/warnings. GPU opposite-winding pairs match exactly: leaf `[60,105,45,255]`, grass `[54,89,36,255]`.
- `COMPOSITION_PASS`: every recorded prop placement equals the v2 snapshot. Original reference hash still matches. 892,492 triangles / 29,953,400 bytes / 57,066 meadow blades, slightly below v2's 893,487 / 30,026,632 / 57,265.
- Visual self-review: compared v2/v3 at equal camera/light, low grass angle, front/back, day/afternoon. Cavity depth and leaf edges read more clearly; short meadow coverage is finer and less clustered into stumps. Foreground still has modeled blade repetition and the shader uses an artistic transmission approximation, not physical subsurface scattering. LOD/performance remain out of scope.

Evidence and preserved v2 source/GLB are in `output/tiny-glade-island-v1/renders/foliage-v3/`; current exports remain in `assets/` and `source/`.
