# Floating-island art study implementation plan

**Goal:** Research Tiny Glade, build and visually refine a reusable 3D meadow-island kit, and compare it against Mạch Nguồn.

**Architecture:** Standalone Blender generator and GLB gallery, isolated in `output/tiny-glade-island-v1/`. Existing application and approved reference assets stay read-only.

**Spec:** `docs/superpowers/specs/2026-11-12-tiny-glade-island-study-design.md`

**Execution:** Single agent and a separate self-review, per repository instructions. Owner explicitly authorized this experimental build and visual iteration.

- [x] Research official imagery; write `STYLE-RULES.md` with sources and concrete tree/ground/flower/rock/light rules.
- [x] Author `build.py`: deterministic terrain, botanical kit, ruins, planted assembly; export `assets/*.glb`, packed `source/*.blend`, manifest and geometry checks.
- [x] Create an allowlisted loopback `serve.py` and comparison viewer using installed Three.js. Load the existing GLB read-only; use equal-scale comparison.
- [x] Inspect front/back/close-up renders; fix visible deficiencies and record changes with screenshots.
- [x] Validate geometry, exports, reference hash, resource lifecycle, failed loading, desktop/mobile and keyboard/reduced-motion behavior. Create final comparison board and handoff README.

Review focus: misplaced roots and grass in water; repetitive or faceted foliage; detached grass rim; unfair comparison lighting/zoom; UI hiding failed loads or retaining disposed GPU resources. No app gates are needed unless application code is changed. No commits.

## Completion ledger — 2026-11-12

Resumed after prior chat hit HTTP 413. Fresh RED: `verify_source.py` rejected downward terrain faces. Fixed mesh winding for terrain and stream; GREEN: `ISLAND_SOURCE_PASS`. Fresh RED: `verify-viewer.js` found pool/stream/fall sharing a shader; cloned material per batch/kind; GREEN. Refined canopy, meadow and cliff over several screenshot passes; kept original reference hash unchanged.

Final evidence under `output/tiny-glade-island-v1/renders/`: front/back/tree/meadow, comparison and mobile captures; source check PASS, viewer 21 checks PASS, JS syntax PASS. Separate self-review and remaining art/production limitations in README. No app integration or commits.

Ruling: use installed `pnpm exec playwright-cli -s=vuon-gio-resume` for QA because the normal `pnpm browser` session was concurrently used by another chat. Reused the existing loopback-only study server. Isolated assets stay in the previously authorized output directory; no new worktree or application edits were needed.
