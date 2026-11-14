# Visible rain and natural cloud silhouettes

2026-11-10. Owner requests completion of missing rain and rejects the pointed lens/feather clouds in two supplied screenshots. Follow-up to fantasy sky V3; accepted camera/fade stay fixed. The choices below are implementation decisions under the owner's request to complete the work.

## Direction and scope

- Add visible gentle rain for `EffectiveEnvironmentSnapshot.isRaining`, in both outdoor spaces and both live/preview modes. This explicitly supersedes V1's exclusion of particle rain. Use the existing weather classification; no extra fetch or invented rainfall telemetry.
- World-space rain streaks fall slightly diagonally with varied speed/length, visible by day and night. Fade onset/cessation; local camera-centered field keeps coverage while walking/rotating. Depth test against the scene, soften very close drops, and add a small bounded batch of ground impact rings only inside flat playable bounds. No audio, thunder, wetness simulation or physics changes.
- Reduced motion suppresses falling/splash particles; existing gray sky/fog and weather label still communicate rain. Changing the preference while running applies immediately.
- Replace V3's `layered-2`, `distant-0`, `distant-2` silhouettes (lens triplets, feather and crossed plume) with the existing V2 `layered-1`, `distant-1`, `distant-3` artwork after inspecting it. Preserve the approved cumulus images, old files and day/sunset/night relighting. Keep asset provenance honest; no new ImageGen tool is available.

## Approach

Chosen: bounded GPU batches for rain/splashes and reuse existing textured cloud artwork. Screen-overlay rain has no scene depth; hundreds of independent meshes add avoidable draw calls. Full fluid/weather simulation and generating all clouds again exceed this correction. Use existing Three.js/R3F dependencies.

## Acceptance

1. Rain preset shows falling streaks in desktop/portrait, day/night, while walking and orbiting. Clear/overcast renders no rain after fade-out. Rain exists in both spaces and follows the effective weather snapshot.
2. One streak batch and one splash batch; no new textures or per-particle React objects. Rain randomness is deterministic, finite/bounded; positions wrap continuously. Splashes stay inside playable ground bounds and terminate near ground; no guaranteed roof occlusion beyond existing scene depth.
3. Reduced motion removes particle animation, restoring it when disabled. Three map cycles do not grow retained geometry/texture counts. Console/shaders are clean.
4. The three rejected source silhouettes are absent from active cloud mapping; inspect full scene across compass and day/night, preserving soft alpha edges and approved hero clouds.
5. Focused RED/GREEN, rendered Playwright inspection, separate self-review, all four gates with dev stopped before build. Restart local preview; no commit/push.
