# Female player clothing refinement plan

> Execute inline with `superpowers:executing-plans`; single-agent self-review per owner instructions. No commit/push.

**Goal:** Refine the accepted female player outfit, preserving face/hair/proportions and the existing movement, then deliver an actual VRM preview before applying the approach to An/Minh.

**Spec:** Latest amendment in `docs/superpowers/specs/2026-11-10-academy-character-art-design.md`.

**Architecture:** Append replacement garment meshes/materials to the pinned public `academy-scholar-v1.vrm` in an isolated ignored preview folder. Retain source binary, portrait, body, boots, expressions, rig and licensed metadata. Reuse the existing MToon/loader/locomotion pipeline, with the approved book/star emblem adapted to silver. No new dependency or runtime clothing system.

## Scope and constraints

- Player only; An/Minh follow after this visual iteration is accepted.
- Keep charcoal/moss/silver palette, green striped tie, waistcoat, pleated skirt, stockings and boots.
- Smaller shirt collar; connected/refined shoulder and sleeve forms; restrained fold shading and trim.
- Keep the existing coat/skirt lengths and close silhouette, place back emblem below the long hair, use a readable small chest badge and a small fastening.
- No new hood, hairstyle, head/body proportions, realism shader or movement changes.
- Preserve existing lower-garment leg following initially; do not transplant the male robe's known running limitation.
- Model checks and visual baseline comparisons are separate: finite matrices cannot certify cloth collision.
- Public assets/manifests remain unchanged. Use compact contact sheets and `--raw` tool summaries to reduce payloads.

## Tasks / compact execution ledger

- [x] Pin baseline and add checks: unchanged portrait/rig/binary, narrowed collar, emblem materials, valid mesh/skin, garment budget, deterministic output. Confirm baseline fails the new garment requirement.
- [x] Build local garment refinement under `output/research/female-player-refinement/`; retain original portrait and boots, replace only garment meshes and obsolete chest badge.
- [x] Render before/after in the same viewer/light/pose. Inspect front/back/side and collar/shoulder/crest; correct visible issues as one batch.
- [x] Run real player idle/walk/run/hop/land clips and reduced-motion/frame-stall checks; inspect phone/distant views and all expressions. Compare any collision with the baseline.
- [x] Record a short continuous clip; run preservation/reproduction checks; self-review and update handoff with actual evidence/limits.

## Initial evidence

- Existing linked worktree confirmed at `.worktrees/reading-quest-environment-v1`.
- Accepted female player hash: `519821d5a5b494b956f8591e548f52533a316bbc1db948befb426390ee807ad6`.
- Current female garments use torso/leg weights; no new cloth solver needed to refine their silhouette.
- Ruling: reuse original lengths/leg-following and verify player motion in the existing fitting viewer. The approved male is an emblem/style reference, not the female geometry base.

## Completion evidence

- Candidate: `output/research/female-player-refinement/female-player-refined.vrm`,
  SHA-256 `12c09afe2ac18a8546034b00e752672a30c5a0f262f5d43906af96977d8ea8f8`.
  13,757,624 bytes, 67,380 whole-model triangles (baseline 60,576).
- RED: baseline rejected with `Player academy crest required`. GREEN:
  `node -e "eval(require('fs').readFileSync('output/research/female-player-refinement/verify.cjs.txt','utf8'))"`
  returned `FEMALE_REFINEMENT_PASS`, `portraitPreserved: true`,
  `reproduction: IDENTICAL`, `publicAssets: 5 UNCHANGED`. Garment geometry:
  34,110 triangles / 19,743 vertices. Final rerun passed after clip export.
- `pnpm browser run-code --filename=output/research/female-player-refinement/capture.txt --raw`
  returned `POSE_MATRIX_PASS`; nine poses/views and all 18 expression presets.
- `runtime-check.txt` returned `RUNTIME_PASS`: maximum 30/60 Hz body-bone
  sample difference 0.02235396 m, stall/reset difference 0, reduced idle drift 0.
  These are body/spring stability samples, not cloth collision certification.
- Self-review: inspected front/back/side/three-quarter, matched baseline/candidate
  run and rear-run, 390×844 viewport, distant view and light intensity ×0.35.
  No obvious new clipping in reviewed samples; full cloth/self-collision and
  physical mobile performance remain unverified. Small trim/badge naturally
  loses detail at distant scale.
- Continuous recording saved with idle/walk/run/turn/hop/return-to-idle;
  MP4 duration 19.9 seconds, 904,509 bytes. Reviewed full-sequence and jump
  filmstrips: the jump remains within the wider frame.
- `pnpm browser console error --raw`: `Total messages: 0 (Errors: 0, Warnings: 0)`.
  `pnpm browser close`: `Browser 'betterme-qa' closed`.
  `git diff --check`: exit 0, no output.
- Routed fitting viewer used the real repository loader and locomotion; live
  `/world` was not checked because the existing dev login returned HTTP 500.
  Existing dev process untouched. No public integration, app code change,
  full four-gate run, commit/push or deployment in this preview pass.
- Preview README records sources, reproduction and limitations. An/Minh remain
  unchanged; visual acceptance of this female draft is still the owner's decision.
