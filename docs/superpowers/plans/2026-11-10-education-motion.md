# Education movement implementation plan

Use superpowers:executing-plans inline. Owner authorized the refinement and visual
tuning; no repeated approval, no subagents, no commits/push.

Goal: relaxed academy hop with responsive controls and accepted walk/idle intact.
Architecture: configured physical impulse + selective source-pose blending in the
existing action sampler; same per-rig single writer and foot contact correction.
Stack: existing Three 0.187 / VRM 3.5.5 / Vitest / pnpm browser.
Spec: `../specs/2026-11-10-education-motion-design.md`.

## Tasks

1. Capture baseline modules and rendered movement in ignored output. Inspect
   source settled pose and current run. Add RED tests for actual configured hop
   peak/immediate launch and real-rig arm spread, knee flexion, shallow recovery
   and sole clearance at 30/60/120Hz.
   Files: `src/lib/world/education-motion.test.ts`, existing action VRM tests.
2. Change `map-config.ts` jump impulse; refine `character-action-motion.ts` with
   source settled-pose regional blends and consistent landing hip depth. Preserve
   actions/locomotion asset hashes, idle/walk/finger/greeting contracts. Only edit
   `character-locomotion.ts` if visual evidence justifies run upper-body tuning.
   Run new tests and action, authored locomotion, animation and world regressions.
3. Browser same-model before/after front/side at phases and in actual plaza;
   stationary/run/re-jump, stop during landing, collision, greeting, reduced
   motion, mobile viewport, missing supplement. Inspect images and continuity,
   adjust based on evidence, keeping meaningful test thresholds.
4. Separate self-review of recovery transitions, per-rig buffers, physics root
   ownership, floor contact and fallback. Update HANDOFF, provenance and motion
   verification. Stop verified dev tree; `pnpm verify` must exit 0. Restart 3020,
   check HTTP/browser, close QA/lab. No commit/push.

## Review focus

- Releasing movement during recovery must not rewind or deepen the squat.
- Re-jump before recovery ends must release floor correction and remain immediate.
- A smaller physical arc must still sample all phases and retain visible motion.
- Shallow landing hips/legs must agree at 30/60/120Hz; no foot hover/penetration.
- Missing supplement preserves controls and does not alter accepted walk/idle.

## Execution record

Tasks 1–4 implemented and reviewed inline on 2026-11-10. Baseline RED captured;
focused GREEN 67/67, then `pnpm verify` exit 0: typecheck/lint, 819 tests in
84 files, production build/static generation 11/11. Source assets and accepted
walk/run/idle unchanged. Front/side A/B and gameplay checked; separate self-review
completed. Details/limits: `../../character-motion-verification.md`, education
refinement section. Local evidence: `output/research/education-motion/` (ignored).
QA session/lab closed. Preview restarted after gates, HTTP 200 on loopback 3020,
ready for owner visual playtesting.
No stage/commit/push/deployment.

## Corrective pose round after owner playtest

1. Preserve current low-hop sampler in ignored `output/research/hop-pose/`.
   Inspect source joint curves and front/side silhouette. Add real-rig RED
   coverage for a stationary two-leg hop (similar foot height/depth, bounded
   lateral knee/foot spread); retain previous flight/clearance/body-pose checks.
2. Refine `character-action-motion.ts` at the shared sampler: balance paired
   source joints and settled reference, reduce sideways twist, keep authored
   sagittal flexion and coordinated arms. Do not change impulse or accepted
   ground clips. Test the smallest hypothesis in equal-height/time A/B first.
3. Inspect front/side phase sequences and plaza moving/stationary/repeated hops,
   stop on landing, reduced motion and fallback. Self-review the delta, then
   stop own dev tree and run `pnpm verify`. Update source/results/HANDOFF, restart
   preview and close lab/QA. No delegation, staging, commit or push.

Correction tasks 1–3 completed across the interrupted chat and its continuation.
Saved RED proves the source's ~11 cm stationary foot-height split; focused GREEN
67/67 and fresh full `pnpm verify` exit 0 (819 tests / 84 files) cover the final
pose. Fresh front/side comparisons and plaza interruption/fallback/reduced-motion
checks pass; separate self-review found no critical/important issue. Preserved
the saved implementation without further production changes in the continuation.
See the balanced-hop section of `../../character-motion-verification.md` and
ignored `output/research/hop-pose/` for evidence. Owner visual acceptance pending.
