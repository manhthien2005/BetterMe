# Six Floating Islands Implementation Plan

> Use superpowers:executing-plans inline; the owner requires one agent.

**Goal:** Six distinct authored island assets (two large, two medium, two small),
viewable and comparable against the approved medium island.

**Architecture:** A deterministic Blender build script reuses read-only approved
materials/tree parts and builds six separate scenes. A loopback-only Three.js
gallery loads the exported GLBs with the established water effects contract.

**Tech:** Existing Blender 4.5 LTS, Python standard library, installed Three.js,
repository `pnpm browser`. No new dependency.

## Task 1 — Output contract and authored asset collection

- [x] Add `verify.py`: assert six models, 2/2/2 sizes, bounds hierarchy, distinct
  geometry, finite positions/normals/UVs, packed images, meaningful landscape
  features and waterfall descriptors; guard the approved reference hash.
- [x] Run before build, observe missing-catalog failure.
- [x] Add `build.py` with new ground/cliff forms, water routes, structures and
  planting; reuse materials/tree geometry from the approved packed `.blend`.
- [x] Export six `glb/<id>.glb`, six `source/<id>.blend`, `manifest.json`.
- [x] Run verification and render all six; fix visible defects in batches.

## Task 2 — Gallery and runtime checks

- [x] Add a small explicit-allowlist `serve.py` and its security/path tests.
- [x] Add gallery HTML/CSS/JS: named model picker, overview/rear/detail, common
  scale comparison, day/dusk, pause, download, loading/error recovery.
- [x] Adapt existing transformed-water effect; dispose meshes/materials/textures,
  ImageBitmaps, reflection targets and late loads when switching.
- [x] Use `pnpm browser` for desktop/mobile, keyboard, water/reduced motion,
  load failure and repeated-switch resource checks; inspect screenshots.

## Task 3 — Self-review and handoff

- [x] Review source/output against design, report actual sizes/triangle counts
  and limitations, verify reference unchanged. Close isolated QA session.
- [x] Record `README.md`, `VERIFICATION.md`, provenance and six-model contact sheet.
- [x] Update repo HANDOFF, open the gallery for the owner, leave loopback server
  running for the requested review. Do not commit/push/deploy.

## Decisions

- Six names/compositions are author choices under the owner's instruction to
  proceed; existing approved style and medium size are the binding references.
- Package is separate from the original; gallery is the review surface before
  owner-selected placement in Plaza. No app source changes are planned.

## Completion ledger — resumed 2026-11-11

- Tasks 1 and 2 were implemented in chat
  `01a1c6b0-fa31-7db2-8cc8-0bacc10e0b82`. The initial RED/build history is recorded
  in the asset package's `VERIFICATION.md`; do not rebuild those tasks.
- Fresh continuation checks all passed: `python verify.py` →
  `SIX_ISLANDS_ASSET_PASS`; Blender `verify_source.py` →
  `SIX_ISLANDS_GROUNDING_PASS`; server/HTTP unittest → 6 tests, `OK`;
  gallery QA → `SIX_ISLANDS_BROWSER_PASS`, errors `[]`;
  screenshots → `SIX_ISLANDS_CAPTURED`, errors `[]`.
- Task 3 complete: separate author self-review of viewer ownership/error paths
  and fresh front/back/detail/mobile/desktop/comparison captures, regenerated
  contact sheets, updated verification and HANDOFF. QA browser closed; existing
  loopback gallery opened in Codex and left running for the owner's review.
- Evidence: `D:/Dev/Tools/Blender/assets/floating-island-collection-v1/renders/`
  logs ending `-resume.log`. Models/viewer and app code unchanged by continuation.
- Scope remains the six-model art collection. Placement in Plaza and real-device
  performance/LOD work are follow-ups, not incomplete steps of this plan.
- No commit, push, merge, deployment or production-data operation performed.
