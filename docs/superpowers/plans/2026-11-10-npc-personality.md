# NPC nam và hành vi riêng — implementation plan

Execute inline with executing-plans and TDD; no subagents per owner instruction.
Spec: `../specs/2026-11-10-npc-personality-design.md`.
Existing worktree and uncommitted fittings are retained. No commit/push/deploy.

## Task 1 — Khoa male fitting

- [x] Add real-asset regression for changed head/hair silhouette, finite morph
  geometry, retained expressions/permissions and byte-identical other cast.
  Run RED against current Khoa.
- [x] Edit only Khoa branch in `scripts/create-academy-character.mjs`: short hair,
  face proportion changes including morph deltas, straighter/broader uniform.
  Preserve source data and generate `academy-khoa-v1.vrm`; update real metrics
  in `src/lib/world/character-assets.ts` and public manifest. Owner correction:
  use separate `scripts/academy-menswear.mjs`, rectangular glasses and straight
  trousers. The first male attempt was rejected; current art awaits feedback.
- [x] GREEN asset tests and inspect neutral front/side/back and facial expressions.

## Task 2 — distinct NPC motion

- [x] Extend `npc-motion.test.ts` RED for proximity hysteresis/cooldown, per-role
  idle/greet/line variants, farewell interruption, independence and reduced motion.
- [x] Implement pure timing/state in `npc-motion.ts`; role pose authoring may
  live in `npc-pose.ts` to keep transitions readable. Existing three roles only.
  `NpcActor` passes player distance and applies body attention before avatar step.
- [x] Extend real-rig tests with longer idle/near/dialogue/leave sessions, all new
  poses, expression and cloth bounds; verify GREEN. No movement/camera changes.

## Task 3 — visual QA, self-review and finish

- [x] Use isolated Playwright fitting viewer with actual assets/motion. Inspect
  distinct idle and greeting, cuff/glasses gestures, book clearance, farewell and
  interruptions. Save images for owner; no shipped debug route.
- [x] Test actual `/world` An/Khoa plaza and Minh library proximity/dialogue,
  approach/retreat/re-enter, day/night, reduced motion, narrow viewport, load failure.
- [x] Self-review full diff and provenance. Update docs/HANDOFF with evidence and
  honest limitations. Stop only verified checkout dev, run `pnpm verify`, restore
  loopback preview and close QA browser. Leave changes uncommitted.

## Progress

Scope confirmed: Khoa is the male NPC; player selection is excluded. Motion/art
tuning are implementation decisions within the request to build and iterate.

Self-review (single agent): compared transition priorities, interruption blending,
bounded gaze and reduced motion with the spec; checked the root → pose → avatar
order, morph endpoint conversion, pinned source/license preservation and matching
manifests. Regeneration hashes match. Review caught hand gestures missing their
accessories, reversed waistcoat button faces and a shoulder gap; these were fixed
and visually rechecked. Original player/camera/map/dialogue content are untouched.
The real-rig test timeout is scoped to its 72-second pose simulation per asset;
no geometry/skin-weight tolerance was relaxed. No staged files or commit.

Final verification: `pnpm verify` exited 0, typecheck/lint, 851 tests in 87 files
and production build (11 pages) passed. Ignored generated JS artifacts caused six
lint warnings; archived those files as text and fresh `pnpm lint` exited 0 without
warnings. QA browser closed. Preview restarted on loopback port 3020, `/world`
HTTP 200. Logs/screenshots remain under ignored `output/research/academy-npcs/`.
