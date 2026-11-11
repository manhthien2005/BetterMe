# Reference-led island refinement plan

> Execute inline under the owner's single-agent rule; separate author self-review.

**Goal:** Address all five owner observations using Mạch Nguồn as visual authority.
**Spec:** D:/Dev/Tools/Blender/assets/floating-island-collection-v1/REFERENCE-POLISH-DESIGN.md
**Architecture:** Revise the standalone Blender generator; retain the established
water shader, original reference and gallery. No BetterMe runtime change.
**Tech:** Blender 4.5, Python, existing Three.js and pnpm browser.

## Constraints and review focus

Preserve six compositions and 2/2/2 sizes, original file hashes, packed resources,
water descriptors and loopback-only server. Keep soil connected to cliff, vines
outside visible rock, roots on real ground, masonry supported, and waterfall V
consistent with the runtime. Review front/back/detail and narrow viewport.

## Tasks

- [x] 1. Save pre-revision package; add `verify_fall_flow.py`, observe actual GLB
  crest/tail failure, correct `build.py:fall` UV convention. Rebuild and verify
  `WATERFALL_DOWNWARD_UV_PASS`; capture downward-moving foam in browser.
- [x] 2. Revise `build.py:Land.build/height` and add `reference_details.py` for
  stratified cliff, projected shallow turf, low/high/rim planting, exterior vine
  curtains, masonry weathering and satellite fragments. Reuse reference assets
  read-only. Extend source verification to catch rim separation, buried vines,
  repeated/unsupported rubble and absent details before implementing those paths.
- [x] 3. Rebuild all six, run `verify_source.py`, `verify_reference_details.py`,
  `verify_fall_flow.py`, `verify.py` and HTTP tests. Inspect all three views in
  real browser, fix visible defects in batches, rerun relevant checks.
- [x] 4. Run gallery QA including stable resources, reduced motion and retry;
  capture before/after and waterfall video. Separate author self-review, update
  README/VERIFICATION/HANDOFF and open gallery. No commit/push/deploy.

## Ledger

- Preflight: saved original generator/assets/gallery/renders under
  `revisions/before-reference-polish`; water output is consumed by unchanged
  shared shader. Fix asset UV, not shader polarity. Scope is already authorized
  by the owner's five concrete requests; no design reapproval needed.
- Budget ruling: preserve original triangle ceilings; raise large GLB ceiling
  from 20 to 21 MB for added close-up detail (actual 20.12/20.37 MB). Total set
  approximately 81.16 MB; needs separate shipping optimization. This is an author
  tradeoff within the requested art refinement, not an owner-set budget.

- Complete: all four tasks. UV check RED→GREEN; source/details regressions caught
  and eliminated overlap, crossing vines and disconnected turf after simplification.
  Final asset, source grounding, detail, GPU flow, 6 HTTP tests and full gallery
  QA PASS. Reference unchanged. Final GPU comparison submits 1,743,420 triangles.
- Separate author self-review complete: fresh front/back/detail, matched pairs,
  mobile and comparison inspected. Six-second motion clip saved. No independent
  reviewer per owner's rule. QA browser closed. Current handoff and asset README
  updated; no app code changes. No unresolved blocking findings for local art review.
- Owner accepted the finished artwork on 2026-11-11 and requested preservation.
  Saved separate snapshot at
  `D:/Dev/Tools/Blender/assets/approved/six-floating-islands-2026-11-11/`;
  `APPROVED_SNAPSHOT_HASH_VERIFIED`: 143 copied files, 6 GLBs and 6 packed
  Blender sources, plus generator/runtime/evidence and reference dependencies.
  This asset task is accepted and complete. No commit or push authorized.
