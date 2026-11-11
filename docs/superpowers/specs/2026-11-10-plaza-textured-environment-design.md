# Plaza — textured fantasy environment upgrade

Status: approved by the owner on 2026-11-10; implementation and technical gates
passed. Visual acceptance and sequential sky/backdrop integration remain open.
See the matching execution ledger and `docs/plaza-assets.md` for measured evidence.

This amendment follows `2026-11-10-plaza-landscape-design.md` and the summit
spec. The owner's new request supersedes the earlier geometry-only asset
decision and fixed 32 × 30 m footprint. Other behavior contracts remain intact.

## Intent and chosen approach

Create a larger, explorable mountain-academy plaza with distinct places and
convincing materials: rooted trees, mossy rocks, weathered paving, planted
crevices and a coherent transition from the inhabited summit to the mountain.
Genshin Impact is an artistic reference, not an asset source or a promise of
equivalent AAA production quality. Do not extract or redistribute game assets.

Choose a hybrid kit: curated licensed textured models for organic forms,
plus project-specific paving, architectural details and placement. Reconcile
asset scale, roughness, saturation and silhouette into the established warm
limestone / jade / slate / dark timber / muted gold palette. A photorealistic
scan pasted among flat primitives is not acceptance. Dense primitive meshes
with flat color are not a substitute for the requested material detail.

Alternative considered: a fully custom sculpted and baked environment kit.
That requires a separate modeling/texture-authoring pipeline not currently
established here. Image generation is unavailable in this session; no paid
image API, paid asset purchase or new authoring service is authorized.

## Existing constraints established from code

- Public movement bounds are X -16..16, Z -15..15.
- Player physics lands at Y=0 and resolves horizontal circle/AABB collisions.
  No heightfield, stair support or walkable slopes exist.
- Current landscape merging removes UVs and uses seven vertex-color material
  groups. The current rock has 52 triangles and no texture. An actual
  textured-model path is needed, not just new placements.
- The backdrop's continuous cliff and valley-mist geometry both contain
  fixed half-extents 16.35 / 15.35. Expanding only movement bounds would expose
  a floor/cliff mismatch. This is a real integration dependency.
- Spawn, fountain, NPCs, portal destination/activation, camera parameters,
  input controls and personal-world behavior stay unchanged.

## Layout proposal

Expand the maximum playable envelope to X -28..28 and Z -24..24:
56 × 48 m, about 2.8 times the present bounding area. Actual clear walking
space is smaller because planted pockets and solid props occupy portions.
Use irregular planted edges and stone boundaries rather than presenting the
envelope as one empty rectangle.

The new places are landscape groupings, not new gameplay zone IDs or quests:

1. **Central fountain court:** retain the fountain at the origin and the
   established NPC approaches. Weathered pale paving, varied slab joints,
   inset stone bands and moss concentrated at shaded edges. Keep the core
   visually calm and navigation legible.
2. **Western pavilion garden:** bring the existing out-of-bounds pavilion
   into the expanded accessible setting. Add a paved approach, seating,
   rooted trees, planting and a lower-density resting pocket. Roof and posts
   must remain safe for the unchanged camera and collision system.
3. **Eastern moss-and-water garden:** irregular boulder groups, ferns,
   exposed roots and a shallow decorative basin adjacent to a continuous
   dry path. No walkable stepping stones over deep water, swimming or new
   water physics.
4. **Northern grove and portal setting:** keep the portal at its current
   location and preserve its approach/activation clearance. Frame the
   northern area with trees, weathered stone remnants and a quiet pocket
   beyond; do not obscure the portal or put a new focal object in its passage.
5. **Southern arrival and overlook walk:** a gently curving route, planted
   edges, stone lanterns and openings toward the mountain vista. Main paths
   connect into a loop, with readable returns to the central court.

All playable surfaces remain at Y=0, with visually shallow paving relief.
Planting beds, roots and water banks can have height outside circulation.
Walking down to the mountain base or climbing stepped terraces is excluded: it
would require the separate terrain/physics scope the owner has not requested.

## Environment kit and mountain treatment

- At least two tree silhouettes, including a focal rooted tree and supporting
  conifers; use visible bark relief, natural branch junctions and leaf detail.
  Low branches/roots belong outside the clear path or inside an honest collider.
- Several rock forms with modeled irregular profiles and actual moss/stone
  texture detail. Vary rotation, scale and grouping rather than laying out
  identical copies at regular intervals.
- Small secondary vegetation: ferns, grass tufts, groundcover, flowers and
  fallen wood where composition supports them. Avoid uniform scatter.
- Paving with retained UVs, stone normals/roughness and controlled seams;
  decorative joints must not become gameplay obstacles or flicker.
- Existing gate, pavilion, fountain and lanterns keep their recognizable
  identity, with material/detail upgrades necessary to fit the new kit.
- Near cliffs: continuous sealed support beneath the expanded floor, rock
  shelves, moss seams, rooted vegetation and transitions into the lower
  mountain. Do not merely stretch the old rock faces and their texture.
- Mid/far mountains: retain broad silhouette layering and the existing
  atmospheric response. Prioritize near-field fidelity; do not duplicate
  expensive hero assets across the distant landscape.

Signature view: from the unchanged spawn, weathered pale stone leads through
the fountain toward the portal; asymmetric foliage frames it, and textured
rock/vegetation connects the summit to the mountain beyond. At close walking
distance, bark, roots, moss and worn stone remain visible—not only in an
overhead screenshot.

## Research and provenance

Primary pages checked on 2026-11-10:

- Official Genshin region reference: https://genshin.hoyoverse.com/ja/map?region=3
  — inspiration only. No assets copied.
- Poly Haven license: https://polyhaven.com/license — its HDRIs, textures and
  models are CC0; site branding and example renders are not asset CC0.
- Poly Haven Rock Moss Set 02:
  https://polyhaven.com/a/rock_moss_set_02 — credited to Kless Gyzen; CC0. The
  page reports roughly 58K triangles and a 37.16 MB selected 4K download.
  This is a candidate, not yet downloaded or approved for direct shipping.
- Quaternius Ultimate Stylized Nature:
  https://quaternius.com/packs/ultimatestylizednature.html — 63 models,
  textures/normal maps, glTF among the formats, CC0. The download link
  redirected to Google sign-in in this session. Do not require the owner's
  account or bypass that flow; select an accessible licensed alternative if
  necessary.

These are source candidates, not a verified complete kit. Select real assets
after checking accessible downloads, material quality and optimization
options. Record asset URL, author, license, retrieval date, source hash,
conversion/optimization steps and shipped path in `docs/plaza-assets.md`.
Host runtime assets locally; no runtime hotlinks to source providers.

## Loading, rendering and performance

- Keep GLB/glTF UVs and material assignments; do not route textured assets
  through a merger that deletes UVs. Share repeated geometry/materials and
  use instancing where supported by the selected models.
- Color textures use sRGB; normal/roughness data remains linear. Avoid
  baked directional illumination that contradicts the live day/night cycle.
- Use 1K textures for most props, at most 2K for a justified hero asset.
  Reject unprocessed 4K/8K scan bundles as browser-ready deliverables.
- Initial targets, to measure rather than claim: added Plaza download at
  most 25 MB; visible environment geometry at most 300K triangles; added
  environment draw calls at most 100 on the fixed desktop QA view. Character
  and sky costs are reported separately. Exceeding these requires documented
  profiling and an explicit tradeoff, not silently lowering visual acceptance.
- Load scenery within a localized boundary; an unavailable decorative asset
  must not blank the world, controls, NPCs or portal. Preserve a safe ground
  and minimal fallback. A fallback displayed during QA is a failure to meet
  visual acceptance, not the finished art direction.
- Collision/layout data does not depend on asynchronous visual loading.
  Loading failure must not introduce invisible blocking props across routes.
- Clearly assign ownership for cached resources versus per-mount clones.
  Dispose owned resources without invalidating materials still in use by
  another instance; repeated map swaps must not accumulate GPU resources.
- No new global postprocessing, fog, lights or sky shader. Reuse the existing
  environment snapshot and reduced-motion behavior. Evaluate tooling already
  installed before adding an optimization dependency.

## Worktree and ownership boundary

Work only in `D:/Dev/Projects/BetterMe/.worktrees/plaza-landscape-v1`. Preserve
all existing uncommitted work. This task uses one agent with a separate
self-review, following current repository instructions.

Expected implementation scope after approval:

- Plaza asset files and provenance under `public/world/` and `docs/`.
- Plaza-specific asset loader/material renderer and their tests.
- `plaza-landscape-layout.ts`, `plaza-landscape-geometry.ts`,
  `public-plaza-landscape.tsx` and associated tests.
- Public-Plaza portions of `map-config.ts` for bounds/colliders and the
  minimum required `world-scene.tsx` integration.
- Near terrain/vegetation in `public-plaza-backdrop.tsx`; identify exact
  shared hunks before integration.

The sky chat owns sky/rain/cloud behavior, shared lighting, camera/fade and
controls. Do not edit its checkout or send it messages without authorization.
Worktree isolation prevents simultaneous overwrites; it does not prove later
integration is conflict-free. The backdrop mixes cliff and mist code, so the
expanded footprint must be reconciled sequentially after the sky work settles.
If unchanged mist no longer fits, record that as an integration requirement;
do not silently take ownership of cloud behavior here.

No commits, pushes, deployment, purchases or production SQL are authorized.

## Acceptance and verification

1. Real imported models/textures visibly replace the primitive look in the
   important organic assets; inspect close-range roots, bark, moss and stone.
2. Five distinct places and a continuous accessible loop are apparent at
   gameplay scale. Spawn/fountain/NPC/portal clearances remain intact.
3. Ground and cliff form a sealed continuous edge under overhead and orbit
   views; no exposed underside, repeated stretched textures or floating trees.
4. Check fixed-camera desktop 1440×1000 and mobile 390×844, noon/dusk/night,
   rain and reduced motion. Compare spawn, root/rock close-up, pavilion,
   overlook and rim views. Captures must be actually inspected before
   claiming visual fidelity. Image viewing is unavailable in this session
   so far; do not substitute file existence or pixel statistics for review.
5. Exercise walk/run/jump, added solid collision, NPC dialogue, portal and
   return, reset, map swaps and camera zoom/orbit limits. No physics or
   controls rewrite is part of this task.
6. Unit/contract tests cover deterministic placement, bounds, clear routes,
   finite geometry/transforms, material/UV preservation, source paths,
   safe fallback and resource lifecycle as applicable. Use TDD for new logic.
7. Compare render counts, asset bytes, resource counts over repeated map
   swaps and a fixed 10-second frame sample against the same baseline.
   Desktop automation does not establish performance on a real phone.
8. Stop only this checkout's verified dev process before full gates:
   `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`. Record
   actual results and limitations. Do not use historical green runs as proof.
9. Review the exact diff and complete a separate code/design self-review.
   Integrate into the sky checkout only with owner authorization and a
   subsequent combined acceptance pass.

## Design self-review before owner approval

- The requested visual leap requires new asset/material data, not only more
  primitives; the approach now reflects that.
- Expanded bounds are coupled to floor, cliff and mist extents; integration
  risk is named rather than claiming parallel work cannot conflict.
- Flat-ground physics rules out walkable descending terraces within scope.
- No selected complete downloadable kit or visual QA is claimed yet.
- Historical pre-approval review above; owner approval was subsequently received
  and the implementation evidence is recorded in the execution ledger.
