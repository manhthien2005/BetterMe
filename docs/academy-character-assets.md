# Academy outfit fittings v1

2026-11-10. First playable outfit fitting based on the owner's three costume
references. The owner accepted the player outfit and requested matching NPCs.
This is a clothing iteration on the accepted rig; see current acceptance below.

## Current An and Minh — refined and integrated locally, 2026-11-11

After accepting Khoa in-game, the owner authorized continuing the cast polish.
An and Minh now share compact white collars, higher waistcoat V openings,
cleaner cuffs and the original academy book/star crest on their backs and
chests. The old floating badge and wavy sleeve motif are removed. An retains
the moss robe/mantle, long skirt and brown hair, with softer pleat shading.
Minh retains warm brown cloth, scholar bands, trousers, glasses and the book.
Portraits, role accessory geometry, garment lengths, rig, expressions and
license are preserved. Player, Khoa and sample remain byte-identical.

| Asset | Bytes | Triangles | Meshes / primitives / materials |
| --- | ---: | ---: | --- |
| `academy-an-v1` | 12,984,340 | 63,612 | 10 / 28 / 25 |
| `academy-minh-v1` | 12,754,468 | 57,636 | 9 / 25 / 25 |

- An SHA-256: `0b02133a385983dc88fbc2d618a0b558f514f981b3980e7f53a76d7d7fb6210d`.
- Minh SHA-256: `346976316274c1f48be2383864b77f9157e259cacaaa47486f631c97246c8ee0`.
- Each retains 54 humanoid bones and 18 expressions. Both manifests agree.
- Reproduce with `node scripts/create-academy-character.mjs --npcs`.
  `scripts/academy-npc-embroidery.mjs` uses the tracked crest SVG and existing
  Sharp dependency. Cropped embroidery shares robe grid/weights and uses
  mipmapped alpha-mask textures; no floating rigid badges or new dependency.
- Actual world/dialogues, gestures, night, reduced-motion phone viewport and
  separate model fallback/recovery passed. Full gates: 855 tests / 88 files,
  typecheck/lint/build exit 0. See the [execution ledger](superpowers/plans/2026-11-11-an-minh-refinement.md).
- Owner accepted this An/Minh appearance iteration with “Ok. Tốt rồi”. The existing mobile HUD obscures much of
  the cast; no physical-phone performance or exhaustive cloth collision claim.
  These are the current An/Minh metrics; older tables below are historical.

## Current player — accepted refinement integrated, 2026-11-11

The owner accepted the female refinement and requested the actual local game.
The existing player ID/URL now serves the reviewed VRM with mipmapped crest sampling: compact collar,
cleaner shoulder/sleeve transitions, softer pleats and silver academy crest
below the long hair. Face/hair, garment lengths, boots and movement stay intact.

- SHA-256: `8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f`.
- 13,757,752 bytes; 67,380 triangles; 8 meshes / 26 primitives / 32 materials;
  54 humanoid bones and 18 expressions. Both manifests record these metrics.
- `node scripts/create-academy-character.mjs` recreates the original pinned
  fitting in memory, then calls `scripts/refine-academy-player.mjs` with the
  tracked `scripts/assets/academy-crest.svg`. No ignored preview files are
  needed. Generation first matched the approved preview byte-for-byte; final
  in-game QA exposed broken thin crest lines at distance with linear sampling.
  Two dedicated mipmapped samplers fix that minification aliasing. Every approved
  geometry/texture/morph/bind byte is unchanged; JSON differs only in those
  samplers and their two texture assignments. The final asset adds 128 bytes.
- The VRM's embedded preview name/stage are retained as provenance to preserve
  the approved art provenance; the spec and this section record integration status.
- At that player-integration checkpoint the NPCs/sample were unchanged.
  Khoa and An/Minh have since been integrated as described in their sections.
- Integration checks: see
  [the current execution ledger](superpowers/plans/2026-11-11-female-player-integration.md).
  The original player metrics and fitting results below are historical.

## Current Khoa — accepted long robe integrated, 2026-11-11

Khoa's existing steward slot now uses the approved charcoal mid-calf robe,
wine lining/tie, grey V-neck knit, book/star crest, small clasp and trim, without
a hood. The accepted charcoal textured hair, green eyes and round glasses are
retained. This is the standing/turning/gesturing NPC; the known calf penetration
under forced player running is not resolved or approved for locomotion.

- Public SHA-256: `ce7e1f46ced9613082cc4f1cd24c1e9f87618062fb14de35b7dc94e3f1b9c483`.
- 17,762,116 bytes; 75,936 triangles; 8 meshes / 26 primitives / 32 materials;
  54 humanoid bones, 18 expressions and five garment spring chains.
- `node scripts/create-academy-character.mjs --npcs` builds from the pinned
  `scripts/assets/khoa-portrait-source.vrm` through `scripts/refine-khoa-robe.mjs`.
  The source portrait stays outside `public`; no ignored files are required.
  Repeated generation preserves the current public player and all NPC/sample hashes.
- Before sampler normalization, reproduction matched the approved long-robe
  preview exactly. Final JSON adds two mipmapped crest samplers/assignments;
  every binary mesh/texture/morph/bind byte is unchanged (+128 metadata bytes).
- Review and checks: [integration ledger](superpowers/plans/2026-11-11-khoa-integration.md).
  Earlier Khoa portrait/short-hair/triangle descriptions below are historical.

## NPC fitting and behavior before the long-robe integration — 2026-11-11

An, Khoa and Minh now resolve to distinct VRMs through `NPC_CHARACTER_ASSET_IDS`:

- An: moss robe, short shoulder mantle, longer pleated skirt and brown hair.
- Khoa: male anime fitting, short side-parted hair and rectangular glasses;
  a separately authored navy coat, wine lining/tie, waistcoat, straight trousers
  and leather shoes. The rejected robe/belt/pouch version is superseded.
- Minh: warm brown robe, scholar bands, slim sleeves, trousers and thin glasses.
  The existing hand-mounted book and its in-game gold cover remain unchanged.

All three retain the original rig, expression bindings and permission metadata.
Khoa's face vertices and morph endpoints are reshaped together: narrower eyes,
clearer jaw/brows and warmer neutral skin shading. His short hair is new geometry
following the head, as are the glasses and menswear. An/Minh retain their original
faces and previously fitted hair/clothing. Player, An and Minh stay byte-identical.
The owner rejected the first male attempt and explicitly requested glasses and
male clothing; the current revision is ready for feedback, not art-approved.

Reproduce NPCs with `node scripts/create-academy-character.mjs --npcs`; the default
invocation still generates only the accepted player. Both commands were rerun:
all four fitting hashes and the original sample hash stayed identical. Khoa's
separate garment source is `scripts/academy-menswear.mjs`. No new
dependency, external asset, image API or runtime wardrobe system was introduced.

| Asset | Bytes | Triangles | Meshes / primitives |
| --- | ---: | ---: | ---: |
| `academy-an-v1` | 12,943,052 | 63,370 | 9 / 28 |
| `academy-khoa-v1` | 15,424,676 | 44,834 | 8 / 22 |
| `academy-minh-v1` | 12,714,428 | 57,426 | 8 / 25 |

An/Minh have 22 material definitions; Khoa has 23. Each retains 54 humanoid bones
and 18 preset expressions. Khoa's binary is larger despite fewer triangles because
the source bytes remain and transformed face/morph arrays are appended.
Exact SHA-256 values are enforced against both manifests:

- An: `4d478aca4e88578c018b045c4f40fab3d3f19520a9b23731cc9460577eaaaf10`
- Khoa: `b61845f78775f7ae194dd5244988a75746d396c8559ef9197b8812ac317eca63`
- Minh: `767c500b35ef45ca3d604d7e89d989cbb4bb7b1102465048254a04629a193de1`

Behavior follows `superpowers/specs/2026-11-10-npc-personality-design.md`.
`npc-motion.ts` owns timing/proximity; `npc-pose.ts` owns role poses:

- An looks around, makes a small welcoming gesture and waves on greeting.
- Khoa watches the gate, adjusts his cuff, nods and alternates pointing/open palm.
- Minh looks toward the held book, adjusts glasses and explains with the free hand.
- Approach at 3.8 m triggers one acknowledgement; attention persists until 4.6 m.
  An 8-second cooldown plus leaving/re-entering prevents repeated greetings.
  Dialogue has priority; farewell is interruptible. Reduced motion removes
  decorative idle and large gestures. No silent speech, walking or new dialogue.

Current evidence under ignored `output/research/academy-npcs/`:

- `personality-green.log`: **16 tests / 3 files passed** before the final shoulder
  seam adjustment. Full gates below cover the final asset. Initial RED covered
  proximity/role behavior and male geometry; `contact-red.log` caught both hands
  missing accessories by over 40 cm. `contact-green.log` verifies their corrected
  positions within 8 cm on the real VRM rig. Garment sampling exercises all seven
  states with/without reduced motion. Morph topology/finite deltas are checked.
- `khoa-male-front.png`, `khoa-male-three-quarter.png`, `khoa-male-back.png`,
  `khoa-face-neutral/blink/happy.png`: actual generated VRM in the isolated viewer.
  No shipped review route. Neutral face, blink and full happy morph visually checked.
- `personality-world.log`: actual plaza An/Khoa and library Minh, keyboard dialogue
  open/advance/close, day/night, plus 390×844 reduced-motion viewport. Screenshots
  use `plaza-*`, `library-*`, `mobile-minh-reduced.png`.
- `personality-proximity.log`: in-game approach → notice → nearby, distance
  deadband, quick leave/return without repeat, dialogue → farewell → interrupted
  greeting. Player position/state samples are recorded, not app teleport hooks.
- `personality-fallback.log`: each NPC request aborted separately; affected actor
  uses fallback, other actors remain ready, removal/reload recovers. These are
  intentional request failures, not spontaneous runtime errors.
- Fresh **`pnpm verify` exit 0**: typecheck, lint, **851 tests / 87 files**, and
  production build with all 11 pages. Log: `personality-verify.log`. Six lint
  warnings were confined to two ignored research scripts/bundles; retained those
  artifacts with `.txt` suffix and reran lint: exit 0, no warnings
  (`personality-lint-final.log`). Preview restored at loopback port 3020, HTTP 200;
  isolated QA browser closed.
- Separate self-review covered transition priority/blending, reduced motion,
  per-actor state, geometry/skin weights, source permissions and both manifests.
  Cuff/glasses contact, button winding and shoulder coverage were corrected.
  Reproduction gives identical NPC metrics/hashes. No player movement, camera,
  world, dialogue text, book asset or economy changes. No commit/push/deploy.
- The prior outfit-only checkpoint passed **843 tests / 86 files**, typecheck,
  lint and build (`continuation-verify.log`). That result predates this iteration.

### Previous outfit-only checkpoint evidence — 2026-11-10

- `continuation-focused.log`: **18 tests / 3 files passed** (asset contract,
  original permissions/rig, geometry/weights, dialogue deformation and reduced
  motion). These supplement the earlier recorded RED in `red.log`.
- `cast-front/side/back/greet/explain/attentive.png`: actual models through the
  real loader in the isolated fitting viewer. Checked hair/collar, shoulders,
  cuffs, hems, glasses and the book pose. The viewer's book colour now matches
  the existing in-game prop. Route fulfillment adds no shipped route/server.
- `continuation-world.log`: `/world`, 1440×1000; An and Khoa in the plaza, Minh
  in the personal library, opening/advancing/closing dialogue, day/night, plus
  Minh at 390×844 with reduced motion. Screenshots use `plaza-*`, `library-*`
  and `mobile-minh-reduced.png`.
- `continuation-fallback.log`: separately aborted each new NPC VRM. The affected
  NPC used its fallback while player/other NPCs remained ready; removing the
  abort and reloading restored all three. Expected aborted-request errors are
  injected failures. Normal game QA had no console errors; existing Three.js
  deprecation warnings remain (initial navigation also requested a missing favicon).
- Separate self-review: checked generator branches, pinned base hash, permission
  preservation, embedded textures, skin weights, manifest selection, safe unknown
  NPC fallback, deterministic regeneration and diff scope. Accepted motion,
  camera, dialogue, book and environment implementation files are unchanged.
- Fresh **`pnpm verify` exit 0**: typecheck/lint passed, **843 tests / 86 files**
  passed, production build compiled and generated all 11 pages. Full output:
  `continuation-verify.log`. The verified dev parent, Next child and build worker
  were stopped before the gates. No commit, push, deployment or SQL execution.

Limits: the three current NPC files add about 41.1 MB of uncompressed assets. Geometry
and source textures are retained rather than optimized for distribution. Clothes
are skinned, without cloth collision/simulation. Small pose-specific overlaps
remain possible. Phone viewport QA exposed the existing tall HUD covering the
NPC; it does not establish physical-phone usability or performance. Final NPC
art acceptance, further portrait polish and a mobile/performance pass remain later work.

## Player fitting — accepted before the NPC pass

## Appearance and scope

Charcoal open robe, forest-green lining/folded collar, restrained pewter trim,
ivory shirt, striped tie, fitted waistcoat, pleated skirt, opaque stockings and
plain dark footwear with boot uppers. An original open-book badge and small wave
stitching replace reference-specific house decoration. The images themselves
are not textures or redistributed assets.

Face, hair, expressions, skeleton and original sole geometry remain from the
sample. New skinned garment surfaces replace covered shirt/shorts/body surfaces.
At that checkpoint NPC slots still resolved to the original sample. No physics, motion clip, camera,
environment, lesson, habit, sync or dialogue changes belong to this fitting.

## Source and permission

- Base: [VRM1_Constraint_Twist_Sample, pixiv Inc.](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample),
  copyright `(c) 2022 pixiv Inc.`; local `public/models/characters/scholar-vrm1.vrm`.
- Base SHA-256: `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`.
- Embedded [VRM Public License 1.0](https://vrm.dev/licenses/1.0/) metadata permits
  everyone, corporation commercial usage, redistribution and modification with
  redistribution. All original permission/copyright/author fields are preserved.
- The derivative name/version and `extras.academyFitting` identify the change;
  its manifest credits pixiv for the base and the BetterMe project for clothing.
  The stale sample thumbnail is removed. No source model overwrite.
- No external asset or generated concept image was adopted. The owner images
  are retained only in ignored `output/research/academy-character/`.

Official context read: [Studio Tour costumes](https://www.wbstudiotour.co.uk/explore-the-tour/costumes/)
(robe weight and school palettes; its Quidditch photograph is not the target
uniform) and [Hogwarts Legacy](https://www.hogwartslegacy.com/en-us). Those pages
are visual/context research, not a grant to redistribute their assets.
VRoid help license pages returned 403; no mirror asset was accepted from them.

## Reproduction and integration

Run from this checkout with its installed dependencies:

```powershell
node scripts/create-academy-character.mjs
```

The generator checks the exact base hash, appends garment geometry and an embedded
256×1 grayscale cloth-shading texture, and writes
`public/models/characters/academy-scholar-v1.vrm`. The script is the editable source;
there is no `.blend` or `.vroid` source for this fitting. It uses existing Three.js
and Node modules, with no new dependency or image API. It prints the actual metrics;
after changing the garment, update both `src/lib/world/character-assets.ts` and
`public/models/characters/manifest.json`. Tests enforce their exact agreement.

MToon 1.0 does not consume vertex colours by default, so authored fold shading
travels through the embedded ramp texture and UVs. Reused stocking/shoe geometry
receives constant ramp UVs instead of sampling it with the sample's texture UVs.
Skinning uses the original bind matrices and joints. Robe and skirt hems partly
follow thighs. Inner robe/cuff surfaces have a small offset from the outside.

| Measurement | Final fitting |
| --- | --- |
| Bytes | 12,184,932 |
| SHA-256 | `519821d5a5b494b956f8591e548f52533a316bbc1db948befb426390ee807ad6` |
| Meshes / primitives / material definitions | 8 / 25 / 22 |
| Triangles | 60,576 |
| Humanoid bones / preset expressions | 54 / 18 |

Material count includes retained, unused source definitions. This first fitting
also retains source binary data; it is not a compressed distribution build.
The player is a separate 12.2 MB cold download. Current NPC sizes are recorded
above. Deduplication/asset optimization should follow visual acceptance.

## Verification and self-review

- Focused five-file run: **26 tests passed**. Includes manifest/hash equality,
  retained permissions/humanoid/expressions, embedded textures, triangle indices,
  finite positions, normalized weights/joints and sampled real skinned vertices
  across idle/walk/run/jump/landing, plus existing posture/action regression tests.
  `output/research/academy-character/rig-tests.log`.
- Real loader, front/side/back, walk/run/jump inspected in a neutral fitting viewer.
  Fixed the folded collar crossing the back hair and the neck seam during jump.
  This viewer uses Playwright route fulfillment in the isolated QA browser against
  the existing loopback origin; it is not a shipped app route or another server.
- `/world`, 1440×1000: walk → run → idle, two jumps returning to idle, noon/clear
  and night/clear rendered. NPC sample actors remained ready. At 390×844 with
  reduced motion, keyboard walk/run feedback remained available. Existing tall
  mobile HUD and touch controls are outside this fitting.
- Aborted only the new VRM request: fallback avatar remained movable and NPCs
  loaded. Removing the abort and reloading restored the 60,576-triangle outfit.
  The expected aborted-request console error is not a spontaneous loading fault.
  Existing Three.Clock/PCFSoftShadowMap warnings remain.
- Evidence: `output/research/academy-character/gameplay.log`, `*-v1.png`,
  `plaza-*.png`, `mobile-*.png`, `model-fallback.png` (all ignored).
- Separate self-review: source hash guard, embedded license, GLB chunk alignment,
  original rig ownership, manifest selection, NPC fallback and diff scope checked.
  No source asset or accepted animation/controller file changed.
- Fresh **`pnpm verify` exit 0**: typecheck and lint passed, **834 tests / 86 files**
  passed, production build compiled successfully. Log:
  `output/research/academy-character/verify.log`. The verified checkout dev parent
  and Next child were stopped before the gates; loopback preview restarted after
  the build. Separate regeneration produced the exact same SHA-256 as the table.
  No commit, push, deployment or SQL execution in this fitting iteration.

## Remaining art work and limits

The owner accepted the player outfit's silhouette and palette. Its face/hair remain
the sample; NPC outfit status is recorded above. Cloth is skinned, not
simulated: robe tails will not have independent wind/inertia or collision, and
small overlaps in untested poses are possible. Fabric texture, folds, footwear,
accessories and final hair/face need subsequent art passes. No wand/bag or final
ornate embroidery is included.

Neutral and in-scene captures establish a usable fitting, not a guarantee against
all cloth intersections. Night clothing is intentionally dark and may need a
lighter value after owner review. No production/mobile performance claim: one
desktop capture showed 98 FPS, while one narrow viewport capture showed 19 FPS;
these are short dev-session samples, not controlled benchmarks or physical-phone
measurements. Recheck on real devices before release.
