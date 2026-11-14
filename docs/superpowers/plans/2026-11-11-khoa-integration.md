# Accepted Khoa NPC integration

> Execute inline; single-agent self-review. No commit/push/deployment.

**Goal:** Put the approved long-robe Khoa into the existing steward NPC slot in
the real local game and verify gestures/dialogue and reload/fallback.
**Spec:** `docs/superpowers/specs/2026-11-10-academy-character-art-design.md`.
**Architecture:** Preserve the approved portrait as a non-public source VRM under
`scripts/assets/`; promote the accepted robe builder into a module and wire it
into the existing character generator. Keep NPC behavior and asset URL unchanged.
Use mipmapped crest samplers, as required by the female integration's real-game QA.

## Scope and acceptance

- Approved art: `khoa-long-robe.vrm`, SHA-256
  `7c31fcb29f8bb9bba28ecb644eeb3d343cbd8a6b02dc48baca7f8b42151b2bc3`.
- Frozen portrait source: `db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312`.
  This is an editable VRM source, outside `public`; no new downloaded asset.
- Preserve every approved mesh/texture/morph/bind byte; only two crest sampler
  settings may change for correct minification. No hood.
- Existing Khoa NPC stands, turns and gestures; do not enable player locomotion
  or claim the known running robe/calf penetration is solved.
- Player, An, Minh and sample remain byte-identical. No secrets/new dependencies.

## Tasks

- [x] Add focused contract checks for the accepted long hem, crest/no hood,
  portrait preservation and mipmapped embroidery; establish RED on the old Khoa.
- [x] Promote source/builder; wire `scripts/create-academy-character.mjs`; update
  public Khoa and both manifests. Prove deterministic reproduction, unchanged
  approved artwork and four unaffected models. Update obsolete portrait tests.
- [x] Run focused asset/NPC deformation tests, then all four gates with this
  checkout's dev process stopped. Restart local loopback dev with authorized bypass.
- [x] Inspect real Khoa front/back, greeting/explanation/cuff/turn, day/night,
  reduced-motion phone viewport, reload and isolated asset failure/recovery.
  Save small screenshots, self-review, update spec/HANDOFF and leave the local
  game available for owner review.

## Results

Complete. Relevant files: `scripts/refine-khoa-robe.mjs`,
`scripts/assets/khoa-portrait-source.vrm`, existing generator,
`public/models/characters/{academy-khoa-v1.vrm,manifest.json}`,
`src/lib/world/{character-assets.ts,academy-khoa-male.test.ts}` and asset docs.

- RED: old short jacket's hem was 0.68 m, failing the accepted <0.39 m contract.
- Raw promoted builder reproduced approved `7c31fcb2...` bytes exactly. Final
  crest-only mipmap normalization gives `ce7e1f46...` / 17,762,116 bytes.
  `check.cjs.txt`: `KHOA_APPROVED_ART_PRESERVED; 4 OTHER MODELS UNCHANGED`.
  Repeated `--npcs` generation retained that result.
- Focused three-file asset/NPC suite: 20/20 tests passed; targeted lint clean.
  The obsolete short-hair/small-eye fixture was replaced with a stronger pin
  of the approved portrait file and byte-preservation of its head/face/glasses.
- Initial `pnpm verify`: typecheck/lint passed; two unrelated plaza deterministic
  geometry tests timed out at 5 seconds under concurrency (5.251/5.454 s);
  851 other tests passed. Full suite rerun with `--maxWorkers=2` passed;
  test timeouts/assertions and unrelated scene code unchanged.

## Final verification and separate self-review

- Typecheck/lint passed in `verify.log`; `pnpm vitest run --maxWorkers=2`:
  **853 tests / 87 files passed**, exit 0 (`full-tests.log`). `pnpm build`:
  exit 0, compiled and generated 11 pages (`build.log`). Verified checkout dev
  processes stopped before build; unrelated checkout processes left alone.
- Real `http://127.0.0.1:3020/world`, desktop 1440×1000: player/An/Khoa ready;
  `KHOA_DIALOGUE_PASS` through greet → explain → farewell, plus reduced-motion
  dialogue at 390×844. Day/night and actual front/back screenshots reviewed.
- 18-second idle image series includes the cuff-adjustment gesture; inspected
  in `idle-review.jpg`. No visible new clipping in sampled standing/turning/
  dialogue/cuff frames. This is not full cloth collision certification.
- The phone viewport's existing tall HUD and player obscure Khoa's body during
  dialogue. Conversation controls work; no claim of physical-phone performance
  or complete mobile art visibility. No unrelated HUD redesign in this task.
- Normal browser console: 0 errors, 2 existing Three warnings. Fallback probe
  deliberately aborted only Khoa; player/An remained ready, then all recovered
  on reload (`KHOA_FALLBACK_PASS`). No route replacements in final screenshots.
- Live asset fetch returned HTTP 200 and exact `ce7e1f46...` SHA-256:
  `SERVED_KHOA_PASS`. Repeated source generation and final preservation checker
  passed; all four other public assets unchanged. `git diff --check`: exit 0.
- Self-review: exact approved portrait and all original license/morph data;
  source outside public, no ignored build inputs; manifests/tests match;
  existing default player and NPC slot/behavior/fallback unchanged. Older male
  tests now pin the accepted portrait rather than the rejected rectangular-glass
  short-hair recipe. No commit/push or deployment. Next-generated `next-env.d.ts`
  switches to dev-type paths on restart; no manual framework changes.
- QA browser closed; local loopback dev restarted with authorized bypass and
  left running for owner review. No real auth/sync or full locomotion claim.
