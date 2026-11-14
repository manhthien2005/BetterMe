# Floating islands v2 implementation plan

**Goal:** Six distinct v2 assets using approved Vườn Gió v18; Vườn Gió replaces Mạch Nguồn in the new seven-model catalogue.
**Spec:** ../specs/2026-11-12-floating-islands-v2-design.md
**Architecture:** Isolated art candidate in output/floating-islands-v2; shared terrain/ecology/landmarks modules consume exact brief interface; parent controls assembly/export/viewer and sequential builds. No app integration or commits.
**Tech:** Existing Blender 4.5.10, Python stdlib, Three 0.187, repo Playwright. No new dependencies.

## Tasks and ownership
- [x] Inventory real sources; inspect v1/v18 images; incorporate owner correction excluding a separate Mạch Nguồn v2.
- [x] Parent common.py/layouts.py/build.py: load approved kit, deterministic six layouts, metadata, export/manifest; safe sources read-only.
- [x] Terrain worker terrain.py: rounded seam-connected rim, mineral relief, real beds, linked waterfalls and spray anchors.
- [x] Parent ecology.py: rooted v18 kit trees/flowers, height-variable grass, ivy/moss/ferns per island.
- [x] Parent landmarks.py: individual architectural identities, path stones, lamps, fallen masonry and berry brambles.
- [x] Parent viewer: seven-model selector including Vườn Gió replacing old reference, shared v18 rig, runtime adapted for several water elevations/falls/lamps.
- [x] Parent validation: geometry/source/metadata checks, six builds, browser QA desktop/390px/day/night/motion, visual contact sheets.
- [x] Separate parent visual self-review, repairs and targeted rechecks; limited independent read-only runtime review; README, QA, hashes, briefs and compact handoff.

## Review focus
1. Thác Tầng multi-height surfaces and actual landing points: geometry continuity + rendered view.
2. Floating props and plants on sloped edges: root/contact probes + low camera.
3. Wind UV inversion and normals lost when copying/batching: source attributes + GPU movement.
4. Multiple lights/falls and stale load disposal: switching/night/root isolation.
5. Six layouts are diverse in structure and plant distribution; compare same rig and original footprints.

## Rulings
- Owner's latest correction overrides previous inventory: do not build a seventh new island.
- Output-only candidate isolation preserves all existing uncommitted app/source assets and frozen snapshots; workers have nonoverlapping single-module writes. No shared asset builds from workers.
- Existing standard is approved and user explicitly says apply/proceed; execute without another design approval round.
- Actual delegation: inventory explorer and terrain worker. Parent implemented ecology/landmarks and the complete visual review. A final independent code review covers only the three runtime modules; it is not whole-collection art approval. Scope and limits are explicit in output/floating-islands-v2/QA.md.
- Final evidence: six delivered sources PASS; browser 20 PASS with no errors; runtime 12 PASS; approved reference integrity 97 snapshot / 58 working files PASS. Six v2 models remain candidates; no app integration or commit.
