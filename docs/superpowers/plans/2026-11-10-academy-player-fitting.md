# Academy player fitting v1 — implementation plan

Use inline execution and a separate self-review, as required by AGENTS.md.

**Goal:** Put a first editable, layered wizard-school outfit on the existing
player, using the owner's three references, for in-game visual feedback.
**Spec:** ../specs/2026-11-10-academy-character-art-design.md (owner reference amendment).
**Architecture:** Generate a derived VRM offline from the licensed pixiv sample.
Append original skinned garment geometry using the existing bind pose and rig;
preserve face, expressions, physics and motion. Select through the existing manifest.
**Tools:** Installed Three.js/Node, existing VRM loader, pnpm/Vitest/Playwright.

## Boundaries and research

- Main visual authority: owner's reference 1 silhouette/details, reference 2
  layering, reference 3 uniform proportions. Default charcoal/green/silver.
- Official context: https://www.wbstudiotour.co.uk/explore-the-tour/costumes/
  describes evolving robe weights and school-specific palettes; its Quidditch
  image is context, not the target uniform. https://www.hogwartslegacy.com/en-us
  establishes the student/wizard-school setting, not a reusable asset license.
- Existing sample embedded metadata allows modification and redistribution;
  preserve pixiv attribution and permission fields. Record source hash and edits.
- First fitting retains current face/hair, and NPCs retain accepted sample assets.
  No claim of final character design. No lesson, combat, scene, controller or API work.
- No Blender/VRoid executable found in checked locations/PATH; use deterministic
  mesh authoring through the installed Three.js library. No new dependencies.

## Task 1 — reproducible dressed VRM

- [x] Add `src/lib/world/academy-character-asset.test.ts`: generated asset exists,
  license/base humanoid and expressions retained, finite normalized skin weights,
  valid indices and embedded buffers, both lining and outside surfaces present.
  Run it RED before producing the asset.
- [x] Create `scripts/create-academy-character.mjs`: source-hash guard, local GLB
  reader/writer, new garment mesh (robe/sleeves/lining, shirt/collar/tie, fitted
  gile, pleated skirt, tights, boot uppers, small crest). Preserve hands/neck and
  shoes; remove covered original cloth/skin to prevent visible intersections.
- [x] Produce `public/models/characters/academy-scholar-v1.vrm`; leave source intact.
  Use original bind matrices for skinning. Clothing is fitted/skinned, not a cloth
  simulation; verify moving poses before making it the player default.
- [x] Record provenance/metrics in `docs/academy-character-assets.md` and run tests.

## Task 2 — integration and visual verification

- [x] Register new entry in `src/lib/world/character-assets.ts` and public
  `manifest.json`; use existing default resolver for player. Keep NPC IDs unchanged.
- [x] Load with the real VRM loader. Check finite deformed garment vertices at idle,
  walk, run, jump/land; preserved humanoid must pass existing motion regression tests.
- [x] Render front/side/back and motion phases in an ignored loopback-only fitting
  viewer; inspect actual screenshots. Adjust the source mesh and regenerate in a
  bounded iteration. Reject severe skin/garment protrusion, ground penetration,
  exposed gaps at cuffs/neck, unreadable layering or stiff flat panels.
- [x] Inspect `/world`, desktop and phone viewport, day/evening, fallback and reduced
  motion. Keep camera/physics/animations intact. Capture review images for owner.
- [x] Stop verified checkout dev process before `pnpm verify`. Record all four
  gate results, separately self-review diff/license/lifecycle/limits, restart the
  loopback preview. Do not commit/push without a new explicit request.

## Review focus

New geometry must use the same rest coordinate space as the original skin; test
weights and real deformation. Robe hem must allow strides and small jumps without
changing approved motion. Inner/outer surfaces must avoid z-fighting. Owner images
stay out of public assets. No default-manifest change before the actual render works.

## Completed verification

Fresh pnpm verify exit 0: typecheck, lint, 834 tests / 86 files and production
build passed. Evidence and separate self-review are in docs/academy-character-assets.md.
The fitting viewer used isolated Playwright route fulfillment against the existing
loopback origin; no additional server was launched. Real device/mobile performance
and final owner art acceptance remain open. Preview restored; no commit or push.
