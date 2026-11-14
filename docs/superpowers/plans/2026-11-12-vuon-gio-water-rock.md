# Vườn Gió water/stone/structures v4

Spec: `2026-11-12-tiny-glade-island-study-design.md`, v4. Owner-authorized asset upgrade. Preserve accepted botanical appearance, local-only viewer and reference hash; no application changes or commits.

- [x] Research official dev imagery/notes. Save v3 source/GLB/screenshots in `renders/water-rock-v4/`. Delegate structure module only to owner-requested worker.
- [x] Add `verify-water.py` for basin depth, submerged bed, water continuity and exported materials; observe baseline failure. Build water bed and shelf, submerged stones, pool/stream normals/UVs and fall taper in `build.py`.
- [x] Add `water-surface.js`: reuse installed Three Reflector for real orthographic scene reflection; capture opaque scene without water for refraction; procedural normals, Fresnel, shallow/deep absorption, stream direction and tapered fall. One shared reflection/refraction pair, correct viewport/scissor restoration, disposal. Add water/rock preset and motion controls.
- [x] Shape cliff into broad irregular fractured planes and integrated ledges in `build.py`; preserve top edge. Inspect before/after.
- [x] Integrate worker `structure_assets.py` into existing trunk/arch functions; rebuild final GLB/source and inspect whole scene, water closeup, rear, both lights and actual motion. Run water/source/foliage/viewer regression, console, mobile and resource lifecycle checks. Produce evidence and README/RESUME.

Visual acceptance: water reveals actual bed, reflects actual trees, visibly moves when enabled without uniform line texture; narrow stream joins fall. Cliff reads as one weathered geological mass. Grass/canopy remain accepted v3. Extra render passes are an explicit study cost; no unmeasured mobile game performance claims.

Completion evidence: `renders/water-rock-v4/QA.md`. Source checks went RED (old 0.18-deep basin) → GREEN. Water GPU probe verifies real reflection, bed visibility and moving pixels; 21 viewer checks and botanical GPU checks passed. Same-camera before/after, rear, closeups and 390px evidence retained. Final source: 920,346 triangles, 30,977,332 bytes.

Separate self-review: rejected detached cliff outcrops after pass 2; final uses connected fractured planes with small bevels. Smoothed bank transition without changing foliage algorithms. Retained incumbent cream viewer palette despite generic detector warning. Subagent reviewed integrated structures and found floating footings; added underside terrain fitting, reproduced RED on saved source and confirmed GREEN after rebuild. No app gates/commit/deploy; work is an output-only art study.

Context recovery: original `ruins_trunks` hit 413 after saving module/evidence. Fresh agents received file-scoped contexts with `fork_turns=none`; no full chat replay. Latest compact handoff is `renders/structures-v4/RESUME-COMPACT.md`.
