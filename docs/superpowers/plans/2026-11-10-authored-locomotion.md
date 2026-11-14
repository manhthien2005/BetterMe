# Authored locomotion implementation

> Execute inline in the existing environment worktree. No delegation or commit.

Completed inline 2026-11-10: source selection/conversion, integration, real-rig
and browser checks, self-review and four gates. `pnpm verify` exited 0 with
799 tests / 81 files; details and limits are in `docs/character-motion-verification.md`.

**Goal:** fix persistent stride after stopping and replace stiff walk/run with
licensed authored motion; preserve the accepted idle, model, NPCs, sky and physics.
Source of truth: `../specs/2026-11-10-locomotion-research-design.md` and the prior
character-motion spec. Owner approved suitable free clips on 2026-11-10.

**Motion thesis:** walking and running should show coordinated weight transfer,
knee flexion and foot roll from an authored source. Start/stop and walk/run changes
remain responsive. Existing idle/expression details remain. Budget: two compact
animation-only clips, reused immutable data, private actor playback; no new package,
no extra skinned mesh or per-frame network/retarget work.

## 1. Select and convert source

Selection update: KayKit was previewed but rejected for its short-leg/weapon pose.
The chosen source is Quaternius UAL Standard's pinned 2025-06-10 CC0 distribution,
Walk_Loop and Jog_Fwd_Loop. Exact license, hashes and rationale are recorded in
`docs/locomotion-assets.md`; all subsequent conversion steps below apply to UAL.

- Inspect KayKit CC0 Walking_A/B/C and Running_A/B in a temporary local preview.
- Pin source commit/hash/license. Keep only selected humanoid rotations and hips
  displacement; discard meshes, accessories, control bones and horizontal motion.
- Add reproducible conversion under `scripts/`, runtime data under
  `public/models/animations/`, attribution and conversion notes in docs.
- Validate rest-transform retarget, target scale, forward axis and loop closure.

## 2. Sample, blend and apply (TDD)

- Add `src/lib/world/character-locomotion.ts` and colocated tests for loading,
  validation, quaternion sampling, rate from actual speed, independent state,
  interruptions/stop, reset and corrupt/missing-data fallback.
- Add only locomotion intent to `HumanoidPose` in `animation-state-machine.ts`.
  Keep procedural output as the no-clip fallback and non-locomotion source.
- Integrate once in `vrm-loader.ts` / `character-avatar.tsx`: sample and blend before
  the existing single normalized-skeleton writer, then VRM update. No second mixer
  writing the rendered rig. Preserve idle/jump/interact and NPC behavior.
- Adapt `vrm-foot-contact.ts` to preserve authored swing and foot orientation.
  Restrict correction to stance/ground penetration, with bounded displacement and
  continuous release; never overwrite all authored leg motion with synthetic gait.

## 3. Verify rendered motion

- Extend real-VRM tests: multiple stop phases at 30/60/120 Hz, no residual anchor,
  unchanged root, bounded foot speed, stance drift <=5 cm, loop and transitions.
- Browser QA source and target from front/side; record gameplay walk/run/stop,
  repeated transitions, turn, blocked movement, jump/land, reduced motion and asset
  fallback. Inspect rendered frames and preserve local video evidence.
- Self-review actual diff, licensing and lifecycle; update HANDOFF and motion
  verification with measured results and remaining visual acceptance limits.
- Stop this checkout's dev process tree, run `pnpm verify` (four gates), restart
  `127.0.0.1:3020` with local auth bypass; close the named QA browser session.

Acceptance: no stuck stance after release; authored coordination visible without
losing foot articulation; no T-pose, discontinuity or root motion introduced by the
adapter; fallback remains usable. Green tests alone do not establish artistic quality.
