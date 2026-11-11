# Two approved floating islands in Plaza

Owner request: use the approved `owner-rim-v4` island as surrounding scenery,
one nearby and one farther away to judge depth from the playable Plaza.
Keep the approved rugged rim, existing movement, camera, portal, NPCs and personal world.
No walking on the islands, commit, push or deployment is part of this task.

## Implementation

1. Copy the exact approved GLB into `public/world/floating-island/`; record its
   SHA256 and source in `docs/plaza-assets.md`. Keep its textures and silhouette.
2. Add placement constants and a public-only `PublicPlazaFloatingIslands` mount
   in `world-scene.tsx`. Load the GLB once per mount; batch static meshes by
   material, share geometry/textures across two transformed roots.
3. Adapt the approved water shaders in a typed companion module: island-local
   spray transforms, scale-aware particles, Plaza fog/day/night, reduced motion,
   sparse reflection refresh and explicit GPU resource cleanup. Failure is local
   to scenery and must leave controls usable.
4. Test transformed placement, batching fidelity and resource ownership/cleanup.
   Capture baseline and candidate at the same camera/viewport; inspect both
   islands from ground level, weather presets, mobile and repeated map swaps.
5. Self-review the task delta; stop this checkout's dev server, run typecheck,
   lint, full Vitest and build, then restart a loopback-only local preview.

## Acceptance

- Exactly two root placements outside the walkable rectangle, with visible
  separation from Plaza and a clearly different apparent distance/size.
- Approved GLB hash unchanged; rough perimeter and flowing falls retained.
- Stable geometry/texture counts after repeated public/personal round trips;
  no frame-by-frame cubemap capture; no shader/runtime errors.
- Existing interactions still work; document actual performance, rather than
  infer it from offline geometry totals. No new dependency.

This extends the November 10 landscape/textured-environment specs only for
surrounding scenery. Placement may be tuned during rendered QA.

## Resume / completion ledger — 2026-11-11

- Steps 1–3 complete in the preceding chats: exact asset copied, two public-only
  placements and owned water effects integrated. Do not rebuild these steps.
- Step 4 complete: four focused unit tests and saved browser reports cover
  placement/batching/disposal, animated and reduced-motion water, sparse
  reflections, three map swaps, weather, mobile viewport, existing interactions
  and failure/recovery. SHA-256 matches the owner's approved source.
- Step 5: separate author code/visual self-review completed under the owner's
  single-agent rule. Fresh `pnpm verify` exit 0: 736 tests / 79 files, typecheck
  and build pass, lint 0 errors / 11 existing QA-script warnings. Evidence:
  `output/floating-islands-qa/verify-handoff.log`. The verified checkout had no
  running dev server during build; loopback preview restarted afterward at 3004.
- Handoff continuation changed documentation only. Human-facing compact is at
  the top of `HANDOFF.md`; source, measurements and limits are in
  `docs/plaza-assets.md`. No commit/push/deployment is authorized.
- Ruling: preserve the approved GLB for the requested local visual trial.
  The two instances add 612,348 submitted triangles; combined nature/island
  payload exceeds the earlier 25 MB target. Cost: no production/mobile
  performance sign-off until optimization and real-device profiling.
- Remaining owner acceptance: in-Plaza composition (distance/height/viewpoint).
  Existing sky/backdrop integration and narrow-screen HUD/touch work are separate.
