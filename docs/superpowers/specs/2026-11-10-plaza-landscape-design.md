# Public Plaza — cảnh quan fantasy

User requested implementation in this chat with one asset specialist and root handling code, visual and UX acceptance. The supplied image (2026-11-10, clipboard 165d4af8) pins direction: pale jointed paving, timber academy architecture with swept slate eaves, pines and blossom, warm stone lanterns, a low water feature, exposed rock and distant mountains. This extends the approved summit spec, not camera or sky behavior.

## Direction and scope

- Keep spawn, movement, camera, fountain position, NPCs and portal destination/interaction intact. Fountain stays inside its existing collision footprint.
- Replace plaza graybox props with original geometry assets; use a cohesive warm limestone / dark timber / slate blue / muted gold / jade / blossom palette. Give paving physical joints, a circular inset around the fountain and understated moss along the perimeter.
- Compose planted pockets around the edges, keeping routes around the fountain and to both NPCs and portal open. Low curbs and rocks signal the boundary. A small academy pavilion sits outside the west walkable boundary. Existing mountain/valley backdrop supplies the large-scale vista.
- Add subtle water/ripple and lantern response to the existing environment snapshot. Reduced motion freezes decorative movement. No new lighting system, sky edit, persistence, economy, or backend behavior.
- Original code-native Three.js assets are used because native image generation is unavailable and all props must read in 360 degrees. No new dependency or paid API.

## Approach

Extend the existing geometry scene with a small authored asset kit and merged static landscape batches. A textured GLB art pipeline could eventually match the reference's fine material detail more closely, but needs authored models and textures absent here. Flat image billboards would lose depth when walking around them. Root chooses geometry as a practical implementation medium, with the supplied image as visual direction rather than a claim of equal fidelity.

## Isolation and ownership

Worktree: `D:/Dev/Projects/BetterMe/.worktrees/plaza-landscape-v1`, branch `codex/plaza-landscape-v1`, base `e0a9108` plus a hash-recorded copy of uncommitted source/assets/docs from `reading-quest-environment-v1`. The source worktree remains untouched. Snapshot inventory: local `output/plaza-landscape-qa/baseline.json`. A baseline sky test references its moon source under output; that exact nonsecret source file is also copied.

Asset subagent owns only `fantasy-plaza-assets.ts`, its test and an asset provenance note. Root owns placement data/tests, renderer, minimal world-scene wiring and collider registration. Do not modify sky, camera/fade, package dependencies or personal-world visuals. Dev binds 127.0.0.1:3001; browser session is `plaza-landscape` using the pinned CLI. No commit, push, merge or deploy is authorized.

## Acceptance

- Spawn composition, edge/overhead views and 360-degree rotation on desktop 1440x1000 and phone 390x844; noon, dusk, night and rain with the same camera.
- Walk/run/jump, fountain/added solid prop collision, NPC dialogue, portal travel and return, reset and both zoom limits. Plants must not hide the passage or interaction targets.
- Geometry finite, normals valid, deterministic output; all solid additions have colliders, no added collider overlaps spawn or primary circulation. Own allocated geometry/material resources are disposed on space switch.
- Compare baseline/candidate renderer counts and a fixed 10s frame window on the same viewport/preset. Record limitations of two simultaneous render sessions; do not infer target-device 60 FPS from automated desktop sampling.
- Root conducts a separate code self-review and inspects actual screenshots. Run all four gates via `pnpm verify` with this worktree's dev stopped, then restart 3001 for owner acceptance.
