# Textured Plaza — execution ledger

Approved scope: `../specs/2026-11-10-plaza-textured-environment-design.md`.
Worktree: `.worktrees/plaza-landscape-v1`. Inline execution; separate self-review,
no subagents, no commits, no integration into the sky checkout. Windows bookkeeping
is kept here instead of invoking the skills' Unix shell ledger scripts.

## Tasks and dependencies

1. **Asset pipeline and provenance** — `scripts/prepare-plaza-assets.mjs`,
   `public/world/plaza-nature/`, `docs/plaza-assets.md`. Fetch selected CC0 originals,
   verify source MD5s, simplify meshes retaining UV/material channels, resize texture
   maps, record source and shipped hashes/bytes. No runtime dependencies added.
2. **Layout and contracts (depends on 1)** — add failing tests for expanded bounds,
   deterministic natural placement, clear circulation, local assets/UVs and budget.
   Implement in `plaza-landscape-layout.ts`, Plaza-only `map-config.ts` sections and
   new Plaza kit manifest. Keep all interaction anchors and camera settings.
3. **Rendering (depends on 1–2)** — local GLTF loader with per-mount ownership,
   instanced organic kit, textured paving/planting, safe localized failures. Replace
   primitive trees/rocks in `plaza-landscape-geometry.ts`, integrate in
   `public-plaza-landscape.tsx`. Extend cliff support only; no sky behavior edits.
4. **Verify and self-review (depends on 3)** — focused tests and four gates; browser
   checks at desktop/mobile, resource/budget measurements, asset failure, map swaps,
   movement and important approaches. Stop own dev process before build. Report
   screenshot inspection limitations honestly; visual acceptance requires inspection.

## Observable acceptance

- Actual locally hosted bark, moss, roots, leaf and stone textures; no remote hotlinks.
- 56×48m public envelope, five landscape pockets and connected flat circulation.
- Spawn, NPC, gate/portal and personal world unchanged; no invisible route blockers.
- UVs/normal maps preserved; static instancing; owned GPU resources disposed.
- Asset bytes ≤25MB; report actual submitted triangles/draw calls, target ≤300K/100.
- Preserve existing dirty files and sky work; document shared backdrop integration.

## Evidence / progress

- Baseline: 3 focused files, 40 tests passed (`pnpm vitest run ...`, 2026-11-10).
- Tasks 1–3 implemented: eight CC0 sources, local textured/instanced kit, ground,
  expanded layout/collision and near-cliff support. Provenance and exact measurements
  are in `docs/plaza-assets.md` and `public/world/plaza-nature/provenance.json`.
- Task 4 technical QA completed, including the production build; visual
  acceptance and cross-checkout integration remain open. No commit or push.

## Regression evidence — 2026-11-10 (Asia/Bangkok)

- Fountain inlay overlap and missing lantern/post collider checks: RED (2 failures)
  → GREEN (6 tests). Ground normals/UV contract: RED missing module → GREEN.
- Tree anchoring: RED center offset 0.14481m on X (and approximately 0.76m on Z)
  → use the lowest 5cm of the trunk → GREEN. All six focused files: **16 passed**.
- `pnpm typecheck`: exit 0.
- `pnpm lint`: exit 0, no errors; warnings only from standalone Playwright callback
  expressions in ignored QA snippets. These snippets are not shipping application code.
- `pnpm vitest run`: **77 files / 732 tests passed**, 30.64s.
- `git diff --check`: exit 0. Impeccable detector on changed rendering targets: `[]`.
- Playwright: both NPC conversations; portal keyboard travel and return; both
  fountain bypasses; sprint, jump and ground landing; camera orbit/zoom/reset.
- Final extended-route check reached X±23/Z±19 around the full loop, pavilion
  `[-19.998,0,-6.309]`, and added lantern collision `[-20.983,0,12.75]`.
  The first QA route cut through a planted rock cluster at Z≈10 and timed out;
  approaching the lantern from Z=14 isolated its collider and passed. No product
  collision change was made to satisfy a bad QA route.
- Model-request failure injection: only the blocked tree group used fallback;
  other models, avatar, movement and world-switch control stayed available.
- Mobile 390×844: no document overflow, avatar ready. Reduced-motion Plaza
  ripple scale `[1,1,1]`. Noon/dusk/night/rain and close-up/overhead captures saved.
- All six model groups ready; three settled public visits at 96 geometries /
  68 textures, personal visits at 92 / 29. No monotonic growth in this sample.
- Final assets: **11,781,802 bytes**. Nature: 219,408tri / 12 batches. Complete
  landscape: 251,224tri / 23 batches. Controlled hide/restore comparison: landscape
  contributes **38 renderer calls**. Whole scene: 133 calls / 656,132 submitted
  triangles including shadows, character and sky. Ten-second desktop sample:
  106 FPS, 9.4–9.5ms; not a real-phone or production benchmark.

## Separate self-review

Performed as a distinct read-only pass under the repository's single-agent rule;
not an independent reviewer. Reviewed preparation/asset validation, loader ownership
and failure fallback, instancing/disposal, UV/color-space handling, ground/inlay
geometry, placement/colliders and scene/map integration. Regression fixes above
were checked RED→GREEN. No auth, sync, pet-economy or persistence changes.

Compared the imported-world files against the captured baseline hashes: only
`public-plaza-backdrop.tsx`, `world-scene.tsx`, and `map-config.ts` differ. The
other imported world files/assets and package/lockfile retain their baseline hashes.
Most of the world tree was already untracked at the baseline; Git's untracked
listing is not a list of files newly authored for this upgrade.

### Decisions and open gates

- Ruling: retain flat Y=0 physics, established anchors and cameras; the mountain
  base is scenery. Traversable slopes would require an unrelated movement rewrite.
- Ruling: use licensed source models plus retained architecture. Image generation
  is unavailable; no paid service or bespoke AAA-equivalent asset claim.
- Ruling: preserve sky-owned mist. The terrain footprint expands, but mist still
  uses old 16.35/15.35 half-extents. **Combined visual acceptance remains blocked
  on sequential backdrop reconciliation**, not a promise of conflict-free merge.
- Ruling: perform self-review only, following repository authorization. The cost
  is no independent second pair of eyes before eventual integration.
- **Visual acceptance not established:** image input is rejected by the tool.
  Screenshots exist, but were not inspected. Close-range material cohesion, canopy
  clipping, composed stump roots, floor/cliff sealing and mobile composition must
  be reviewed in the rendered scene. Technical passes cannot close that gate.
- Deferred minor: offline regeneration imports exact existing pnpm package paths;
  dependency upgrades require updating those paths. Runtime assets do not depend
  on the preparation script.

### Final build

Own `betterme-qa` browser closed; verified this checkout's dev and Next children
stopped before `pnpm build`. **Exit 0**: compiled successfully in 7.7s, TypeScript
finished in 12.3s, all 11 static pages generated, `/world` listed as dynamic.
All four project gates pass at this worktree; visual acceptance is still open.
Final post-build typecheck/lint rerun passed; lint reports 8 QA-callback warnings
and 0 errors. The local-only bypass dev preview was restarted at
`http://127.0.0.1:3001/world` for the owner (app browser-open request queued).
Do not build again while that preview is running.
