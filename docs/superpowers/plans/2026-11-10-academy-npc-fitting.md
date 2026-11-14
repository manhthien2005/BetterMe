# Academy NPC outfit fitting

Execute inline; separate self-review, no subagents per owner's AGENTS.md.
Spec: `../specs/2026-11-10-academy-character-art-design.md`, NPC fitting amendment.
Owner approved player appearance and requested matching NPCs. Do not re-open
style approval or overwrite accepted player/source VRMs.

## Task 1 — generation and asset contract

- [x] Extend `npc-character-assets.test.ts` RED: three slots resolve distinct
  academy IDs, unknown still resolves original sample, accepted player hash stays
  `519821d5a5b494b956f8591e548f52533a316bbc1db948befb426390ee807ad6`.
- [x] Extend `scripts/create-academy-character.mjs` with explicit player/an/khoa/minh
  recipes. Default invocation retains byte-identical player output; `--npcs`
  generates only the three NPC VRMs. Reuse original rig/permissions and garment
  helpers. Give An a mantle/skirt, Khoa a standing collar/belt/pouch/trousers,
  Minh a scholar stole/glasses/trousers with slimmer sleeves for existing book.
  Optional hair length edit must be local mesh data with valid skin weights.
- [x] Add the three generated files and real metrics to TS/public manifests;
  change only NPC slot IDs. No runtime variant/character-creator framework.
- [x] Extend real-asset tests to all generated variants: embedded textures,
  license/rig/expressions, finite indices/weights and deformed garment vertices
  through idle/greet/explain/attentive/close, including reduced motion. Extend
  `tests/helpers/load-world-vrm.ts` with optional asset id for fixture loading.

## Task 2 — visual check and finish

- [x] Inspect neutral front/side/back and greeting/reading poses for each NPC.
  Use existing Playwright route fulfillment on loopback 3020; no extra server.
  Verify silhouette, hair/collar, cuff/hand and Minh book clearance. Fix garment
  source and regenerate without altering accepted player or gesture behavior.
- [x] Inspect actual `/world` in both maps: An/Khoa interaction and Minh with book;
  day/night, phone viewport/reduced motion, failed NPC-model load and recovery.
  Save actual cast render for owner review, not a generated concept image.
- [x] Record provenance, metrics and limits in `docs/academy-character-assets.md`;
  update handoff and this checklist. Separate diff/license/player-preservation
  self-review. Stop verified dev process, run `pnpm verify`, restore local preview.
  No commit/push/deploy/SQL.

## Acceptance and review focus

All three NPCs wear distinct clothes from the approved wizard-school world;
player bytes and accepted movement code stay unchanged. Preserve original
permission metadata, rig, facial expressions and per-instance disposal. Tests
must catch unknown-slot fallback, wrong ID/metrics, corrupt skin weights and
nonfinite deformation. Visual evidence must include the book-holding pose;
finite vertices alone cannot establish absence of clothing intersections.
No final portrait/cloth-simulation or real-phone performance claim.

## Continuation ledger — completed 2026-11-10

Resumed after the previous chat failed during visual review. Task 1's existing
implementation and recorded RED were preserved. Fresh focused tests: 18/18 across
three files. Regenerated all four fittings and checked all five hashes including
the source: byte-identical. No new product behavior was needed in this continuation.

Task 2: fresh six-pose cast captures; An/Khoa plaza and Minh library conversations;
day/night; 390×844 reduced-motion viewport; each NPC's aborted load and reload
recovery. Corrected the isolated viewer's book colour to the unchanged runtime
gold prop so review images reflect the game. No shipped viewer/debug route added.

Separate self-review (owner requires one agent): no critical/important finding
for the outfit fitting. Checked generator/rig ownership, permissions, manifest
agreement and unchanged accepted player/movement paths. Known limits remain
sample faces, unsimulated cloth, unoptimized files and the pre-existing mobile HUD.

Fresh `pnpm verify` exit 0: typecheck, lint, 843 tests / 86 files, production build.
Evidence: `output/research/academy-npcs/continuation-*.log`; details and limitations
in `docs/academy-character-assets.md`. Keep source/plan and uncommitted changes.
