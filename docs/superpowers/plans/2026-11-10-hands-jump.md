# Hands / jump implementation plan

Execute inline using executing-plans and TDD; no agents or commits.
Spec: `../specs/2026-11-10-hands-jump-design.md`.
Stack: existing Three r187 / VRM 3.5.5 / Vitest only.

- [x] Inspect source Jump_Start/Loop/Land and finger orientations; record timing
  boundaries and before screenshots.
- [x] Add RED tests in `character-action-motion.test.ts` for validation, clamped
  one-shot sampling, physics-synced air pose, landing recovery and reset. Guard
  accepted locomotion SHA-256; no body changes for walk/run/idle.
- [x] Extend `scripts/convert-locomotion.mjs` to emit separate `actions.json` with
  fingers/jump from the same pinned archive. Verify original JSON hash.
- [x] Add `character-action-motion.ts` for hands/jump sampling. Wire action intent
  from `animation-state-machine.ts`, load per player in `character-avatar`, apply
  via `vrm-loader.ts`'s single writer. Block floor correction while airborne,
  including locomotion fade-out.
- [x] Test raw rig stationary/run jumps, landing at 30/60/120 Hz; hand flexion,
  unchanged accepted body pose, retrigger/reset and existing locomotion/NPC tests.
- [x] Browser source/target front/side, gameplay jump/hands close-up, reduced
  motion, missing supplement. Self-review, update provenance/HANDOFF/verification;
  stop dev tree, `pnpm verify`, restart 3020, close QA.

Review focus: source wind-up cannot delay physics; source hips cannot duplicate
ballistic root height; late load/unmount must not write disposed rigs; fingers
must follow greeting intention rather than arm-angle guesses during jump; fast
landing-to-run or re-jump cannot keep prior contact or crouch.

Completed 2026-11-10: fresh `pnpm verify` exit 0, typecheck/lint, 816 tests / 83
files and production build. Continuation fixed landing rewind after releasing
movement (RED→GREEN); real-rig greeting and immediate re-jump verified. See
`docs/character-motion-verification.md` and `docs/locomotion-assets.md` for evidence
and remaining limits. Owner visual acceptance remains pending. No commit/push.
