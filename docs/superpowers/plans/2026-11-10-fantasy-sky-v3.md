# Fantasy sky V3 implementation plan

> Execute integration inline with executing-plans; one owner-authorized asset subagent owns only the asset package. No commit/push.

**Goal:** A cohesive fantasy day/sunset/night sky with expressive clouds and bounded rendering cost.
**Architecture:** Pure visual state from existing solar/weather snapshot, deterministic asset data, GPU shading and Points stars; preserve accepted camera and fade.
**Stack:** Existing React Three Fiber, Three.js, TypeScript, Vitest, repo Playwright CLI; no dependency additions.
**Spec:** ../specs/2026-11-10-fantasy-sky-v3-design.md

## Tasks and ownership

- [ ] Asset worker: src/lib/world/fantasy-sky-assets.ts + tests, versioned public/world/plaza/sky/v3 assets and provenance. Interface: cloud shape/placement arrays, palette, star catalog. Preserve all old assets.
- [ ] Parent: src/lib/world/fantasy-sky-model.ts + tests. RED then GREEN for continuous solar blends, night thinning, storm attenuation, finite bounds.
- [ ] Parent: src/components/world/fantasy-sky-environment.tsx and WorldSkyEnvironment integration. Reuse existing sky resources where useful; no camera/fade or Personal behavior changes.
- [ ] Parent: screenshot and performance QA against baseline; fix evidenced defects. Check shader colors, texture transparency, directional sunset and moon/star cloud occlusion.
- [ ] Parent: stop exact dev tree, pnpm verify, self-review final files, evidence/plan update, restart preview.

## Review focus

- Shader material color-space output, sphere far clipping at all camera positions.
- No hard jumps at phase/weather boundaries or night-cloud visibility thresholds.
- Sun direction matches shadow; separate moon never repurposes sun's orbital data.
- Delayed/failed texture load and StrictMode/map cleanup do not retain disposed resources.
- Reduced motion freezes decoration; no per-frame geometry allocation, avoid excess cloud overdraw.

## Progress

Baseline screenshots and three-run RAF samples requested before renderer edits. Existing complete gates: 670 tests green from fade task. ImageGen unavailable confirmed by parent and worker; no API fallback authorized. Camera/fade hashes recorded in terminal output.
