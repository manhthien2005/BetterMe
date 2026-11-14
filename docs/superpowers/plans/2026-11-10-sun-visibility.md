# Sun visibility refinement — 2026-11-10

Authority: the owner's request for a clearer, brighter sun and
`docs/superpowers/specs/2026-11-10-fantasy-sky-v3-design.md`.

Scope: amplify only the Public Plaza sun. Keep its solar vector, weather/time
attenuation, moon, clouds, scene lighting, camera, avatar fade and rain unchanged.

## One small implementation task

1. Capture the existing sun in the isolated browser at clear morning/noon/sunset.
   Use the actual scene projection as RED evidence: the old disk is about 17 px
   at 1000 px viewport height; the new disk should be at least 30 px when centered.
2. In `fantasy-sky-environment.tsx`, enlarge the warm-white core about 2x.
   In `fantasy-sky-shaders.ts`, give only the sun a bright near corona and a soft
   outer halo in its existing single glow draw. No bloom pipeline or new dependency.
3. Verify rendered projection, shader compilation, weather/night suppression,
   reduced motion, desktop/portrait and stable resources across map switches.
   Re-run sky/solar tests and all four gates after stopping this checkout's dev.
4. Separate self-review (owner's single-agent preference), retain evidence locally,
   restart loopback preview. No commit, push, deployment or unrelated fixes.

The visual correction introduces no domain logic. Runtime before/after evidence
is the acceptance test; do not add source-string or constant-only unit tests.
Screenshot capture does not establish visual quality when image input is unavailable.

## Evidence

- Implemented: core radius 0.85 → 1.8, warm-white color; sun-specific corona/halo
  in the existing material, no added mesh/texture/dependency.
- Browser: desktop disk 16.83 → 35.63 px; portrait 30.08 px. Clear-noon center
  RGB (255,244,213) → (255,253,240), +10 px now inside the bright core.
- Solar/weather, night suppression, moon, reduced motion and three map round trips
  passed. Existing favicon 404 and two Three deprecation warnings retained.
- Focused: 3 files / 28 tests passed. `pnpm verify` exit 0: typecheck, lint,
  74 files / 729 tests and build all passed with dev stopped.
- Separate self-review performed; Impeccable source detector had no findings
  (regex-only, not visual approval). Screenshots cannot be visually inspected
  by this agent; owner aesthetic acceptance remains.
- Evidence: `output/playwright/sun-visibility/acceptance.md`, `acceptance.log`,
  `pnpm-verify.log`, before/after PNGs. No commit/push.
