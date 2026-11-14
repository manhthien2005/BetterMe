# Vườn Gió grass and canopy refinement

Goal: a softer, deliberately planted meadow and matte coherent canopies, as immediately requested by the owner. Single-agent inline execution; no application or reference-asset changes, commits or deployment.

Spec: `docs/superpowers/specs/2026-11-12-tiny-glade-island-study-design.md`, owner refinement section. Existing Blender 4.5 / Three.js 0.187 pipeline, no dependencies.

- [x] Preserve before source/GLB and equal-camera screenshots in `output/tiny-glade-island-v1/renders/foliage-v2/`.
- [x] Diagnose leaf fronts, vertex normals and exported material. Add `verify-foliage.py`, observe RED, fix in shared `leaf()` / `Mesh.make()` / botanical materials in `build.py`; check GREEN.
- [x] Rework shared `blade()` and meadow placement in `build.py`: curved tapered blades, coherent tufts, broad density/height patches, ground-matching roots, path/water exclusion. Use local RNG to decouple future grass changes from prop scatter.
- [x] Refine botanical lighting in `viewer.js`: diffuse matte response, stable authored normals on both sides; keep water/reference materials and common light rig unchanged. Check real shader output through browser screenshots and targeted assertions.
- [x] Inspect meadow/canopy before/after, low grazing angle, rear, two light presets, motion, mobile; run source/foliage/viewer checks and JS syntax. Save evidence and update README/RESUME with actual budgets and limitations.

Acceptance: visible improvement in grass coverage and shape, no metallic leaf glints or backface light flip, no roots floating or grass covering water/path, reusable kit still loads, resource/keyboard/retry checks remain green. Visual quality is evaluated from renders, not test counts.

Evidence: baseline oak had only 0.0004 upward-facing surface fraction, RED. Corrected winding gives 1.0 for oak, birch and hazel, GREEN. GPU pixel test renders equal normals with opposite triangle winding: both leaf and grass give identical RGBA on front/back, `[54,89,36,255]`. Both botanical material specular intensities are zero. 57,265 curved meadow blades independently checked against actual terrain/water geometry; low/high heights p10=.126, p90=.668; root wind weights 0, tips 1. Source shape refinement and normal fixes change the GLB; two-sided volumetric shading and root-pinned wind require the viewer shader.

Ruling: the new grass RNG is independent of prop RNG. Removing the prior shared grass consumption changes the exact flower/rim scatter once, within the same authored colonies. Main tree, stone, arch, water and path layout is retained. Avoided preserving a long obsolete scatter loop solely to advance RNG state.

Self-review: grass pass 2 was too uniform; pass 3 introduced stronger broad height patches and darker roots while retaining brighter tips. The new GLB is 893,487 triangles / 30,026,632 bytes: this pass optimizes appearance, not runtime cost. No claim of mobile game readiness.
