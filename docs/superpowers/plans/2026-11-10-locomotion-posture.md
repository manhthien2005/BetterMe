# Locomotion posture implementation plan

Use superpowers:executing-plans inline; owner approved implementation, no repeat
approval or delegation. Spec: ../specs/2026-11-10-locomotion-posture-design.md.
Goal: upright relaxed walk and forward-looking jog with natural momentum.
Architecture: small local pitch offsets in the existing locomotion sampler, using
existing runWeight/fade and single VRM writer. Three 0.187 / VRM 3.5.5 / Vitest.

## Task 1 — measured upper-body refinement

Files: src/lib/world/character-locomotion.ts,
src/lib/world/character-locomotion.test.ts,
src/lib/world/locomotion-posture-vrm.test.ts.
Consumes: current clips, createLocomotionPlayer and shipped VRM fixture.
Produces: same APIs with calmer torso/head posture; no source-asset changes.

- [x] Save baseline sampler/actions in ignored output/research/locomotion-posture.
- [x] Add RED real-rig head-pitch/trunk-lean bounds over full cycles at 30/60/120
  Hz; protect source gait/arm tracks and reset/fade without accumulating offsets.
  Run pnpm vitest run src/lib/world/locomotion-posture-vrm.test.ts; expect failures
  showing the excessive downward head pitch before implementation.
- [x] Apply small distributed pitch offsets after fresh sampling, blended by
  runWeight. Keep root, hips, gait, hands, idle and jump ownership unchanged.
- [x] Run posture, locomotion, authored-VRM and action-VRM tests; expect all pass.

## Task 2 — visual verification and handoff

- [x] Inspect same-model/time before/after front/side at several walk/run phases,
  plus actual plaza movement. Adjust only if measurements and visuals justify it.
- [x] Check start/stop, walk/run switching, turn, jump/land, greeting, desktop,
  mobile/reduced-motion and clip fallback. No phone hardware claim.
- [x] Separate self-review: sign/order of rotations, per-rig state, repeated
  sampling/fade/reset, inherited arm motion, jump recovery and unchanged assets.
- [x] Update HANDOFF, motion-verification and provenance. Stop verified dev/lab,
  pnpm verify (expect exit 0), restore loopback 3020 and close QA/lab.

Global constraints: reuse the existing worktree and stack, no source asset,
dependency, NPC, HUD, physics or economy changes. No staging/commit/push/deploy.
Review focus: full-cycle pitch (not one frame); transitions without snaps;
no accumulating correction while stopped; unchanged feet/cadence; retain jog lean.

Completed inline: RED six rig cases → focused GREEN49/49 and posture9/9; browser
A/B/plaza/reduced-motion/fallback and separate self-review complete. Full
pnpm verify exit0, 830 tests/85 files, typecheck/lint/build. Evidence/results in
../../character-motion-verification.md. No commit/push; owner visual review next.
