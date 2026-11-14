# Accepted female player integration

> Execute inline with `superpowers:executing-plans`; single-agent self-review.

**Goal:** Use the accepted female VRM in the actual local `/world` game and leave
a working URL for the owner to try.
**Spec:** `docs/superpowers/specs/2026-11-10-academy-character-art-design.md`.
**Architecture:** Keep the existing player ID/URL and loader. Promote the exact
approved garment builder/crest into scripts and call it from the existing player
generator. Synchronize both manifests and existing accepted-hash assertions.
**Stack:** Existing Node/Three/Sharp, VRM, Next.js, Vitest and Playwright.

## Scope and acceptance

- Player only, accepted SHA-256
  `12c09afe2ac18a8546034b00e752672a30c5a0f262f5d43906af96977d8ea8f8`.
- Preserve base, An/Minh/Khoa files, motion, camera, permissions and fallback.
- No secrets, new dependencies, commit/push/deploy or unrelated changes.
- In-game loaded model must preserve accepted artwork and show the back crest.
  Approved-art bytes remain exact; the integration amendment below permits only
  two mipmapped crest samplers for correct display at gameplay distance.
- Check run/jump/landing, reload, reduced motion, phone viewport and failed-asset
  fallback. Browser QA uses local auth bypass; no live account/sync claims.
- Model regeneration must reproduce the approved bytes without ignored inputs.

## Execution

- [x] Update the existing accepted player hash assertions in
  `src/lib/world/{academy-character-asset,npc-character-assets,academy-khoa-male}.test.ts`;
  run focused tests to establish RED before asset promotion.
- [x] Add `scripts/refine-academy-player.mjs` and `scripts/assets/academy-crest.svg`
  from the approved preview; wire only the player generation path in
  `scripts/create-academy-character.mjs`. Rebuild
  `public/models/characters/academy-scholar-v1.vrm`; update its entry in
  `public/models/characters/manifest.json` and `src/lib/world/character-assets.ts`.
  Verify exact approved hash, deterministic repeat and four other files unchanged.
- [x] Run focused asset/loader checks, then `pnpm verify` with this checkout's
  verified Next dev process stopped. Restart loopback dev with authorized bypass.
- [x] Inspect real `/world` desktop/mobile and motion/fallback; save compact
  screenshots under `output/playwright/female-player-integration/`. Self-review
  diff, update asset docs/spec/HANDOFF and leave the local game open for the owner.

## Results

Completed. Existing `/world` returned HTTP 200 on 3020 at the start of this pass;
the prior preview's login-500 issue is no longer reproduced. Initial browser
console error was missing favicon only.

- RED: focused accepted-player test failed on the old `519821d5...` hash.
- Approved source promoted; generator reproduced `12c09afe...` exactly twice,
  with four other public model hashes unchanged. No ignored input dependency.
- Focused three-file asset tests: 18/18 passed. Initial full run: 850 passed,
  one deformation test timed out at 5 seconds under suite concurrency (7.278 s);
  no geometry assertion failed. Grouped its finite/bounds assertions per mesh
  and frame, retaining every sampled vertex, instead of constructing matchers
  for each vertex. Focused rerun: 10/10 passed. No timeout limit increased.
- Removed three unused preview-builder symbols reported by lint. Final full
  verification and in-world QA are recorded below.

### Integration amendment: crest minification

- First full verification passed (851 tests). Actual `/world` sampling passed
  walk/run/two hops/landing, reduced-motion phone viewport, night and fallback.
  Visual review then found broken thin crest lines at normal gameplay distance.
- Root cause/probe: crest textures inherited the cloth ramp's linear-only
  minification (9729). A routed temporary asset changing only the two crest
  samplers to trilinear mipmaps (9987) produced continuous shield/book outlines.
- Added an asset regression assertion: RED `expected 9729 to be 9987`; enabled
  mipmaps only in the builder's two decal samplers; focused GREEN 11/11.
- Final distribution hash:
  `8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f`,
  13,757,752 bytes (+128 metadata bytes). `APPROVED_ART_PRESERVED` verifies the
  full binary chunk unchanged and JSON differing only in two sampler definitions
  and their texture assignments; four other public models stay unchanged.
- The fast automated Space tap initially fell between render frames; the QA
  script now holds Space until the real jump state appears, then releases it.
  No input/physics/runtime changes were made for that automation timing issue.

### Final evidence and separate self-review

- `pnpm verify`: exit 0; typecheck and lint clean; **852 tests / 87 files passed**;
  build compiled successfully and generated 11 pages. Full log in
  `output/research/female-player-refinement/integration-verify.log`.
- Final regeneration repeated the distribution hash; `check-integration.cjs.txt`
  returned `APPROVED_ART_PRESERVED`, `4 UNCHANGED`. Normalization is limited to
  the two named crest textures; all other GLB JSON and binary content agrees
  with the accepted preview.
- Final `pnpm browser run-code --filename=output/playwright/female-player-integration/qa-gameplay.txt --raw`:
  `WORLD_PLAYER_PASS`; walk → run → idle, two airborne hops then grounded idle,
  day/night, reload, 390×844 reduced motion with walk/run feedback, usable
  missing-model fallback and recovery to the 67,380-triangle model. Final
  report: `output/playwright/female-player-integration/qa-report.json`.
- Normal application console errors and page errors: 0. The missing favicon
  and deliberately injected asset-fetch failure were separated from model QA;
  pre-existing Three deprecation warnings remain. No real auth/sync claim.
- Final live HTTP GET: 200, `SERVED_FINAL_MODEL_PASS` matching `8c8225f3...`.
  Final front/back captures used the unmocked route and were visually reviewed.
  The mipmap-only probe preceded this final verification and was not left active.
- Self-review: default ID/URL/fallback unchanged; mirrored manifests agree;
  source generator reproduces without ignored inputs; no rig/portrait/runtime
  motion/NPC changes; retained sampled geometry coverage in the faster test.
  No visible new garment clipping in reviewed motion samples. This is not full
  cloth collision certification or a physical-phone performance check.
- `git diff --check`: exit 0. QA browser closed. Local dev restarted at
  `http://127.0.0.1:3020/world` and left running for owner review; Codex browser
  open request queued. No commit, push or deployment.
