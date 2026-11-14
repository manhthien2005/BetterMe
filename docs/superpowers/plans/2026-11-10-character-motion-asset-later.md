# Character Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Inline execution and a separate self-review per AGENTS.md. Owner approved implementation; no further approval loop, no automatic commits.

**Goal:** Improve player and NPC movement using the existing VRM, leaving final art replacement to a later asset-integration pass.

**Architecture:** Keep physics and the current animation machine. Extend the resulting pose with optional hand/toe detail and ground-contact hints, solve bounded leg IK in the VRM adapter, and drive NPC poses through a small deterministic dialogue-motion controller using the same avatar renderer.

**Tech Stack:** Existing TypeScript, Three 0.187.0, three-vrm 3.5.5, R3F 9.8.2, Vitest, repo Playwright CLI. No new packages.

**Spec:** `docs/superpowers/specs/2026-11-10-character-motion-asset-later-design.md`

## Global Constraints

- No generated/downloaded art, API keys, paid services, schema/deploy changes, or changes to accepted camera/environment/physics constants.
- Keep no-guilt/no-decay, names/roles/colliders/dialogue content and authorization.
- Flat-ground contact only; humanoid/expressions missing must degrade safely.
- All edits in the existing isolated worktree. pnpm only; no secrets.
- Full four gates before handoff, stop verified checkout dev process before build. No commit/push authorization.

## Review Focus

- Interrupted gestures and rapid line changes must never leave a raised hand or repeat a greeting (Task 3).
- Reused VRM URL must not share mutable skeletons or dispose another actor's GPU data (Tasks 2/4).
- Teleport, turn, stall and missing bones must release contact safely, without moving physics (Task 2).
- Reduced motion must work for NPCs too, including markers and idle sway (Tasks 3/4).
- A held dialogue is not recorded speech: mouth remains quiet, motion settles while reading (Tasks 1/3).

## Task 1: Optional pose detail and motion contract

**Files:** `src/lib/world/character-pose-details.ts`, `.test.ts`; modify `animation-state-machine.ts`.

**Interfaces:** `decorateCharacterPose(pose, state, phase, time, reducedMotion): HumanoidPose`; pose gains optional detail bones and foot contact hints. Core 20-bone consumers retain compatibility.

- [x] Add tests: relaxed finger bend >0; greeting opens fingers relative to rest; detail finite at all states; toe detail evolves; airborne contacts false; reduced motion preserves necessary leg motion.
- [x] RED: `pnpm vitest run src/lib/world/character-pose-details.test.ts`.
- [x] Add detail generation after existing inertial blending, using the blended arm pose for hand opening; no second state machine for locomotion. Remove silent greeting mouth oscillation, tone down greeting smile.
- [x] GREEN: run new test plus `animation-v03b.test.ts`, `character-v03.test.ts`.

## Task 2: Rig capability and bounded foot contact

**Files:** `src/lib/world/vrm-foot-contact.ts`, `.test.ts`; `vrm-loader.ts`; extend real-VRM regression tests.

**Interfaces:** `createVrmFootContact(vrm)`, controller `update(contacts, dt)`, `reset()` owned by each loaded rig. IK writes normalized leg rotations only.

- [x] Test real rig at 30/60/120 Hz: continuous stance drift ≤0.05 m over full held phases; swing lifts; missing rig, root rotation, jump/teleport/stall reset finite; root unchanged.
- [x] RED: real-rig regression must fail without contact solver.
- [x] Capture ankle floor height from rig rest pose, lock world target at touchdown, solve two links with a forward knee pole, maintain foot orientation. Ease entry/exit; clamp reach; release on large root motion/turn and when airborne. Apply after smoothing, before VRM update.
- [x] Apply optional detail bones (missing ignored/reset), discover capabilities, dispose invalid VRM outcomes.
- [x] GREEN: new solver test and existing real-rig suites.

## Task 3: Deterministic NPC dialogue motion

**Files:** `src/lib/world/npc-motion.ts`, `.test.ts`; `character-assets.ts`.

**Interfaces:** `createNpcMotionState(id)`, `stepNpcMotion(state, {lineIndex, targetYaw, targetPitch, reducedMotion}, dt)` returns pose/expressions and state ID; null line means closed. `resolveNpcCharacterAsset(slot)` maps existing slots to existing manifest entry.

- [x] Test closed→greet→explain→attentive; unchanged line does not retrigger; line change triggers once; close/rapid reopen finite and continuous; ID desynchronizes idle; bounded head; reduced-motion steady pose; mouth aa=0.
- [x] RED: `pnpm vitest run src/lib/world/npc-motion.test.ts`.
- [x] Build smooth gesture envelopes with interruptible pose blend; authored open-palm/point/reading-support poses by role. No NLP or new dialogue mechanics.
- [x] GREEN: NPC and asset resolver tests.

## Task 4: Shared avatar integration

**Files:** new `src/components/world/npc-actor.tsx`; modify `character-avatar.tsx`, `world-scene.tsx`, `world-canvas.tsx`, `world-client-shell.tsx`; relevant component tests.

**Interfaces:** `activeDialogueLineIndex?: number | null` forwarded shell→canvas→scene; NPC consumes per-actor pose/expressions. Camera fade optional, player behavior unchanged. Avatar step callback receives loaded rig for prop alignment when needed.

- [x] Add regression assertions at real event boundary for line progression/closure; test independently loaded VRM ownership and capability degradation.
- [x] RED: focused component/rig tests.
- [x] Replace primitive NPC body with shared CharacterAvatar; keep rings/marker/positions; bound gaze/body turn. Use one ordered frame callback per actor, reset on visibility/map/asset change; attach simple existing book geometry to librarian hand.
- [x] Respect reduced motion for NPC marker and pose; fallback remains visibly articulated and uses one frame owner.
- [x] GREEN: focused tests + typecheck/lint.

## Task 5: QA, handoff and verification

**Files:** `docs/character-asset-handoff.md`, `HANDOFF.md`, this plan and ignored QA artifacts.

- [x] Baseline/candidate same viewport/map/preset: loading, p95/p99 and >50ms frames. Inspect walk/run/turn/jump/land, interactions, escape/out-of-range, portals, close camera, mobile, reduced motion and load failure.
- [x] Review rendered screenshots and captures; correct observed regressions with RED→GREEN tests. No invented claims about final assets or 60 FPS.
- [x] Document asset mapping, VRM rig/expressions/rights requirements, original sample provenance, later re-calibration and outstanding art work.
- [x] Run four gates after stopping verified local dev process. Record outputs and separate self-review against spec. No commit/push.

## Execution record

- Baseline: 24/24 tests, 3 files (`animation-v03b`, `character-v03`, `world`) passed on 2026-11-10.
- Existing isolated worktree verified on `feat/reading-quest-environment-v1`; not main, not submodule.

- Continuation completed 2026-11-10: 108/108 focused tests; full pnpm verify exit 0 (748 tests / 79 files, production build success). See docs/character-motion-verification.md for browser evidence, self-review and performance limits; docs/character-asset-handoff.md for final model integration. No commit/push. Final art and owner visual acceptance remain pending.
