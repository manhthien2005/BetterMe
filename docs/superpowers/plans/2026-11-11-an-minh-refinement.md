# An and Minh academy refinement

> Execute inline, single-agent self-review; no commit/push/deploy.

**Goal:** Continue the approved cast polish with An and Minh, and show them in
the real local game alongside the accepted player/Khoa.
**Spec:** Latest amendment in `docs/superpowers/specs/2026-11-10-academy-character-art-design.md`.
**Architecture:** Extend the existing two NPC recipes, with smaller collars,
higher waistcoat V and coordinated academy embroidery on the actual robe grid.
Keep their colors, silhouettes, face/hair, rig, role accessories and behavior.
No new clothing physics, source masters, runtime code or dependencies.

## Design and acceptance

- An: moss robe and shoulder mantle, long pleated skirt, brown hair; compact
  collar/facing, softer pleat contrast, pale brass book/star crest below hair.
- Minh: warm brown robe, scholar bands, trousers, glasses and book; compact
  collar and matching muted brass crest, positioned clear of hair and book.
- Both: remove old floating badge and wavy sleeve motif; retain neat narrow
  cuff/hem trim, add a small sewn chest crest. No new hood/head styling.
- Reuse `scripts/assets/academy-crest.svg`; mipmapped alpha-mask textures;
  decals use matching garment grid/weights so gestures keep them attached.
- Preserve public player/Khoa/sample bytes. Retain current garment lengths,
  hand/book alignment, expression and permission metadata. Keep existing IDs.
- Full artistic approval remains with the owner; local integration allows review.

## Files / tasks

- [x] Pin original An/Minh and hashes in ignored output; add RED asset checks
  for actual compact collars and two mipmapped crests in
  `src/lib/world/academy-npc-refinement.test.ts`.
- [x] Refine the An/Minh branches of `scripts/create-academy-character.mjs` and
  add `scripts/academy-npc-embroidery.mjs`. Use existing part/skin/material
  helpers. Generate/review in a routed fitting viewer before final integration;
  compare front/back/gestures, all expressions, phone/distant frames.
- [x] Synchronize An/Minh in both manifests and historical hash pins; verify
  deterministic rebuild, portrait/accessory preservation and unchanged player/
  Khoa/sample. Run focused model/NPC checks and the four gates (full tests with
  `--maxWorkers=2` to avoid the known machine-concurrency timeout).
- [x] Inspect real `/world` An and personal-library Minh: dialogues/gestures,
  day/night/reduced motion and separate missing-model fallback/recovery.
  Self-review, save compact screenshots, update HANDOFF/spec/asset docs, and
  leave local dev available to the owner.

## Evidence

Completed locally on 2026-11-11; owner subsequently accepted this appearance
iteration (“Ok. Tốt rồi”) and asked for next-step advice. No new implementation,
commit or deployment authorization is inferred from that question.
Impeccable context allowed the narrow refinement against incumbent assets;
its changed-script detector returned `[]`. Product UI/runtime is unchanged.

- RED: both new asset checks failed on missing compact collars. GREEN: 2/2.
  Focused asset/NPC command passed **22 tests / 4 files**:
  `pnpm vitest run src/lib/world/academy-npc-refinement.test.ts src/lib/world/academy-character-asset.test.ts src/lib/world/academy-khoa-male.test.ts src/lib/world/npc-character-assets.test.ts --maxWorkers=2`.
- Repeated `node scripts/create-academy-character.mjs --npcs` gave identical
  metrics/hashes. Default player generation also stayed identical.
  Preservation checker returned `NPC_PRESERVATION_PASS`, `3 UNCHANGED`:
  player/Khoa/sample exact; An/Minh face/body/hair/role accessories/boots,
  rig/expressions/springs/license and original texture bytes preserved.
  First-person mesh annotations were compared by mesh identity because the
  new embroidery shifts mesh/node indices.
- Fitting viewer: `NPC_REFINEMENT_RENDER_PASS`; front/back/side, greet/explain,
  An welcome and Minh glasses adjustment sampled. All 18 expression weights
  per NPC exercised. Chest crests moved lower/outward after visual inspection
  to clear the existing hair and scholar bands. No obvious new clipping in
  these samples; this is not exhaustive cloth collision validation.
- Four gates run sequentially with this checkout's dev server stopped:
  `pnpm typecheck` and `pnpm lint` exit 0;
  `pnpm vitest run --maxWorkers=2` → **855 passed / 88 files**;
  `pnpm build` exit 0, 11 pages generated.
  Log: `output/research/an-minh-refinement/gates.log`.
- Unmocked local `/world`: `AN_WORLD_PASS`, `MINH_WORLD_PASS`.
  Actual day/night renders, greeting/explaining, Escape close and 390×844
  reduced-motion dialogue checked. Final screenshots use public assets;
  no fitting-viewer route replacement. The existing mobile HUD/player
  substantially obscure NPC art, so mobile dialogue success is not a claim
  of good outfit visibility or physical-phone performance.
- `AN_MINH_FALLBACK_PASS`: separate targeted request aborts produced the
  expected NPC fallback with the player still ready; unroute/reload restored
  ready models. HTTP 200 hashes match both manifests. Normal console had
  only the existing favicon 404 and Three Clock/shadow deprecation warnings;
  deliberate abort diagnostics are separate.
- Compact pictures/scripts: `output/playwright/an-minh-refinement/`;
  before/after boards and preservation/reproduction evidence:
  `output/research/an-minh-refinement/`. QA browser closed; local dev left on
  loopback port 3020 for owner review. No commit, push or deployment.

## Separate self-review

Reviewed the generator branches, optional UV default, embroidery material and
skin construction, the new asset assertions and both manifest entries. The
default ramp UVs preserve the accepted player; deterministic hashes also pin
Khoa/sample. Crests share garment grid/weights, use alpha masks and mipmaps,
and add a net 242/210 triangles respectively rather than full duplicate robes.
No behavior or dependencies added. Earlier unrelated working-tree changes,
including Next's generated dev type paths, remain intact. `git diff --check`
passed. Owner acceptance covers this appearance iteration; physical-phone/cloth
stress testing remains outside this local integration checkpoint.
