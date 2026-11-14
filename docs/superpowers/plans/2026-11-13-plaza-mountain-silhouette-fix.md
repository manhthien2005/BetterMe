# Mountain silhouette correction implementation plan

> Execute inline; single agent, self-review. Owner asked to fix cylindrical mountain visual and capture all around Plaza. Existing isolated Plaza worktree, preserve unrelated dirty changes. No commit/push/deploy.

**Goal:** Cổng Mây must read as irregular connected mountain rock rather than two extruded cylinders in the supplied lecture-court view; check the rest of the horizon in eight directions.
**Spec amendment:** The V6 integration spec's byte-identical rule remains for unaffected models. Owner's current correction authorizes two derived runtime models if needed (Cổng Mây, Thiên Mạch); original V6 source directory stays read-only. No new silhouette family (cones/domes), keep eroded vertical karst, rock shelves and plants.
**Architecture:** Offline Blender mesh deformation of upper exposed rock only, deterministic smooth taper/shear and inclined irregular crest. Preserve topology/triangle budget, recompute rock normals; transform attached ivy/upper debris with same mapping. Trees and lower ruin support remain anchored, retain normals/materials/color. Export derivative GLBs and record parent hashes; no per-frame deformation, package, extra textures or draw calls. Existing renderer stays.

- [x] Diagnose: model/placement/shader traced; photographed eight eye and eight elevated views. Culprit is Cổng Mây, original extruded upper mass amplified by submerged foot. Temporary placement probe still reads cylindrical; restore before shape work.
- [x] Create offline reproducible derivative in `output/mountain-v6-silhouette/`, with checks: parent hashes, finite geometry, closed rock/orientation, triangle counts unchanged, meaningful upper taper and top height range; unchanged lower support/vegetation, affected ivy contacts preserved. RED on original assets using shape measurements, then export.
- [x] Copy only accepted derivatives into `public/world/mountains/`; update compact manifest lineage/hash/bounds and adapt integrity test from exact old total to budget+source lineage. Keep 10 models /16 placements, uniform scale, safe bounds. Lower exposed foot only if needed after actual inspection. Test `plaza-mountains.test.ts` and horizon.
- [x] Capture same camera before/after, eight eye directions and eight overview directions; daylight/dusk/night/mobile; examine all images. Build contact sheets/HTML gallery from real screenshots (no synthetic media), owner can inspect surrounding visual. No claim of artistic quality based on unit tests.
- [x] Run focused checks and all four app gates with dev stopped before build. Self-review exact change, source hash/integrity check, restart and smoke. Record QA and handoff; open preview/gallery.

Review: no floating foliage or ruin footings; no pinched/sliced/pointed cone tops; no height budget drift; no extra runtime cost; shade normals consistent after deformation; widths/yaw and far silhouette overlap around the full circle, not just one favorable screenshot.


Final scope: only Cổng Mây derived. A two-model exploration was narrowed after diagnostics: Thiên Mạch stays byte-identical, its existing stepped mass retained. Cổng Mây initial steep opposing crest slopes were visually rejected as fin-like; final slopes are shallower and aligned, preserving broad karst crests. Final placement uses base-50, scale5, turn+.1. No other scenery/layout edited.

Verification: focused15/15; typecheck/lint/build exit0;823tests/94files. Three new scratch unused-variable warnings removed; final lint has28 pre-existing warnings. Post-build loopback3004 smoke:10models/16placements, current Cổng Mây hash, no failed shaders; QA session closed. Evidence, self-review and limits: `output/mountain-v6-silhouette/QA.md`.
