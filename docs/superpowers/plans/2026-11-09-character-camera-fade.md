# Character camera proximity fade

**Goal:** Owner accepts the current camera and asks for Genshin-like character transparency when the camera moves too close. Implement directly under the existing coding authorization.

**Spec:** `../specs/2026-11-09-public-plaza-sky-refinement-v2-design.md`, camera proximity amendment.

## Design

Use spatially eased transparency on the local player only. Start fading within 2 world units of the character's vertical body segment and reach zero opacity within 0.6 units. These are implementation tuning values. Measure the rendered camera against the actual player transform, including jumping, rather than preferred zoom or the smoothed orbit target. The existing smoothed camera supplies temporal continuity; no extra animation delay, including with reduced motion.

Apply one screen-space pixel coverage mask to all VRM materials, including outlines, and the fallback avatar. Preserve opacity, transparency, alpha cutoff and depth writing unchanged. Coverage updates after VRM animation and camera updates, with no time-dependent noise. Restore visibility and original shader hooks/cache-key callbacks on cleanup. Fade can remove the avatar at very close range while the orbit remains anchored to the character. Ground marker and other actors stay separate.

Ruling after rendered QA: replace alpha blending with a small shared screen-door fragment hook. Alpha blending with depth writing disabled let MToon's back-face outline cover the face; preserving depth fixed the face but still exposed rear hair through clothing. A shared per-pixel mask keeps those layers occluded and opens the same pixels through the entire avatar. This introduces fine visible stippling at intermediate coverage, without another pass, texture, render target or dependency. Camera behavior is unchanged.

## Tasks

1. RED: tests in `src/lib/world/character-camera-fade.test.ts` exercise near/middle/far distances, real camera vs moving/jumping player, material arrays/shared materials, unchanged alpha cutouts, shared MToon coverage uniforms, repeat updates and shader-hook restoration.
2. GREEN: implement `src/lib/world/character-camera-fade.ts`; install in a layout effect in `character-avatar.tsx` and call after the camera update in `world-scene.tsx`, preserving animation/spring update ordering. Cache materials once per model; no per-frame scene traversal or React state updates.
3. Verify: focused tests, rendered desktop/portrait near/partial/far/reset and map switching, fallback if practical, reduced motion and console. Stop this checkout's dev process and run `pnpm verify`. Self-review final delta. Restart local preview. No commit/push.

## Review focus

- Coverage must reach MToon and fallback shader uniforms in the frame rendered.
- Texture cutouts and outline materials must fade with the body and restore exactly.
- A wall compressing the camera must fade immediately; distance uses the player rather than an ejected orbit target.
- Fallback-to-VRM replacement and cleanup must not retain faded materials.
- Shared coverage must not expose rear hair or outline surfaces through the front; inspect imagery and shader errors rather than relying on unit tests.

## Progress

- Prior session: initial alpha-fade RED/GREEN reported (4 tests, then 17 focused tests passed); no completed visual acceptance.
- Resumed directly in the named worktree; no subagent, CUA or JS reset in this continuation.
- Rendered QA rejected the initial partial alpha fade. Depth-only correction was insufficient, so the final coverage implementation supersedes it. Five coverage/lifecycle tests failed against the old implementation, then `pnpm vitest run src/lib/world/character-camera-fade.test.ts src/lib/world/world.test.ts` passed: 2 files, 18 tests.
- Desktop script passed near/middle/far, reverse pull, R reset, walk/run/jump, three map round trips and reduced motion. All 20 VRM materials shared coverage (about 0.5 at middle, 0 at closest, 1 when restored); no shader errors. Scripts/logs/images are in `output/playwright/camera-sky-acceptance/`.
- Portrait 390×844 passed far/partial/close/restored with normal and reduced motion. The current HUD still covers much of the portrait view; this task does not redesign that existing layout or add touch controls.
- Fallback asset-failure test passed far/partial/close/restored on all 10 fallback materials. Delayed model loading exposed a real lifecycle issue twice: the passive effect had not installed the fade on the newly mounted VRM. Switched only that effect to `useLayoutEffect`; the same delayed-load regression then passed, keeping the replacement hidden while close and restoring all 20 materials on R.
- Browser console after normal loads: 0 errors; existing Three.Clock deprecation and PCFSoftShadowMap fallback warnings remain. The intentional local VRM 503 is an expected failure fixture. No routes remain registered; the isolated QA browser was closed.
- Self-review: controller touches only avatar-owned material hooks/visibility; texture cutouts, opacity and depth settings are unchanged. Shared materials are deduplicated, hook/cache-key callbacks restore on cleanup, and material collection is outside the frame loop. Fade is installed before a replacement's first frame and updated after VRM and camera. No React state writes, dependencies or extra render passes were added. Camera/map-config SHA256 values match the start of this continuation. This is a self-review, not an independent review.
- First full verification completed 68 files / 670 tests and production build, with 4 CLI artifact lint warnings. Added narrowly scoped comments explaining the intentional function expressions in those QA scripts; rerunning all four gates to persist a clean final exit code.
- Final `pnpm verify`: exit 0, clean typecheck/lint, 68 test files / 670 tests passed, production build succeeded with 11/11 pages. Full output: `output/playwright/camera-sky-acceptance/fade-pnpm-verify-final.log`.
- Local dev restarted with the authorized bypass on `http://127.0.0.1:3000/world`; HTTP 200 confirmed. Technical verification is complete. Owner visual acceptance of the fine stippled fade remains separate. No commit/push.
- Acceptance details, self-review and explicit limitations: `output/playwright/camera-sky-acceptance/fade-acceptance.md`.
