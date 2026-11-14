# Khoa long robe implementation plan

> Execute inline with `superpowers:executing-plans`; single-agent self-review per owner preference. No commit/push.

**Goal:** A real, reviewable Khoa VRM with a long charcoal robe, original book/star back crest, restrained trim and front clasp; no hood this round.

**Architecture:** Reuse the accepted portrait and local clothing builder/VRM loader. Author garments into an isolated preview under `output/research/khoa-long-robe/`, preserving all portrait/morph/license bytes. Use the existing MToon pipeline and installed Sharp for a vector crest texture, with real garment UVs and shared deformation weights. No public replacement until the new art can be reviewed.

**Tech stack:** Existing Three.js, three-vrm 3.5.5, Node, Sharp, repo Playwright CLI; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-academy-character-art-design.md` latest amendment; `docs/research/2026-11-11-khoa-hogwarts-anime-direction.md`.

## Constraints and review focus

- Owner approved implementing the richer robe and explicitly deferred the hood.
- Face/hair/glasses, head proportions, expressions and licensed metadata remain intact.
- Long silhouette with grey V-neck knit, ivory shirt, muted wine tie, original trousers/shoes; avoid the rejected blazer lapels and round puffed shoulders.
- Back crest must sit on the cloth, read under neutral light, follow skinning without seams or inverted UVs.
- Long hem needs actual motion inspection, including a locomotion stress probe, not just finite matrices.
- Public assets/manifests and pre-existing changes stay intact; output is a preview, not a production integration.
- Local-only browser. Bounded tool summaries and reduced contact sheets to respect the owner's 413 concern.

## Tasks / execution ledger

- [x] Add artifact checks for the accepted portrait, long hem, crest material/UV, finite skin data and deterministic reproduction. Run against v2 and confirm the new design requirement fails.
- [x] Adapt the local garment builder: remove lapels/vest buttons, reshape shoulder/sleeve, lengthen robe, add trim/clasp/crest, preserve original trousers and replace only the obsolete chest pin if needed.
- [x] Render front/back/side/gesture and inspect a small contact sheet. Correct visual faults, verify no hood, then capture the final result.
- [x] Exercise expressions, 30/60 Hz, reduced motion, stall/reset and existing locomotion clips on the candidate. Record actual limits rather than claiming full cloth collision.
- [x] Self-review artifact diff/preservation, record checks, save a short motion clip, update handoff and deliver the preview.

## Initial evidence and rulings

- Existing linked worktree confirmed: `.git/worktrees/reading-quest-environment-v1`, branch `feat/reading-quest-environment-v1`; reuse it.
- Ruling: isolated art preview remains the scope because the owner is approving the design iteration; preserve the actual in-game assets for visual review.
- Ruling: reuse v2's garment IO/skin helpers, not its rejected silhouette. The accepted portrait is the binary source.
- Ruling: this plan itself is the compact execution ledger; no separate generic orchestration files.

## Completion evidence

- `check.cjs.txt` against v2: expected RED, `Long robe hem must reach mid-calf`.
- `verify.cjs.txt`: `LONG_ROBE_PASS`, finite/normalized authored skin data,
  original portrait/morph/license bytes preserved, deterministic output and five
  public VRMs unchanged. Final metrics/hash recorded in the adjacent JSON report.
- `layer-check.txt`: `LAYER_PASS`. Original ray evidence found the knit 9.8 mm
  in front of the robe at x=.11/y=1.22. Matching underlayer weights fixes the leak.
  The check permits no knit hit when the corrected knit no longer crosses that ray.
- `runtime-check.txt`: `RUNTIME_PASS`, 30/60 Hz difference 2.344 mm, stall/reset
  and reduced-motion settled drift 0. `final-capture.txt`: 18 expressions pass.
- Front/back/side/cuff, phone viewport, distant view, dim studio light and full
  turn reviewed. Chest badge simplified for small size; exact shoulder sampling
  avoids a separately interpolated decal's differing deformation.
- `stress-capture.txt`: matrices finite in actual authored walk/run/hop/land
  samples. Visual run-back inspection finds calf/cloth penetration. Ruling:
  keep this clearly labeled as an NPC art preview, not production locomotion
  acceptance; do not change NPC behavior or hide this limit behind numerical tests.
- No full application gates for ignored art preview + docs; no commit/push/deploy.
  See `output/research/khoa-long-robe/README.md` for commands, evidence and limits.
