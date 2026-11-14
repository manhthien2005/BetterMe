# Portal interaction visual proposal

Owner approved designing the next interaction flow: approach a portal → identify destination → press E → travel transition → arrive. Extend the accepted dialogue v4 cream/soft-indigo/bronze world, not a new visual identity. Impeccable + game-ui-workflow, single-agent, output-only proposal. No production repairs, dependencies, commits or deployment.

## Source truth and research

`src/lib/world/map-config.ts` has two portals: public_plaza → personal_world at [0,0,-9.8], return at [0,0,10.8], both radius 3.4. Personal spawn is [0,0,5.5], outside the return gate's radius. `findNearestInteractablePortal` owns range selection. `world-client-shell.tsx` currently switches space directly on E and clears nearby NPC/portal/dialogue state. No payment, level gate or confirmation exists; none is invented here. Existing source has unrelated duplicate declarations/syntax; keep it untouched.

Prior verified official Atelier exploration/manual and Xbox XAG 116 timing guidance are available locally under output/dialogue-v1/research/. Read relevant passages before implementation. Adopt explicit destination and a single contextual action, stable readable ground, no timed decision window, no automatic retrigger on arrival. This is our proposed visual flow, not a claim of copying a reference game's exact behavior.

## Composition / behavior contract

- Near gate: bottom-center cream panel 540px wide (112px tall on desktop), a small portal emblem, destination title (Spectral), short destination descriptor and one framed indigo action `Đi qua` with E hint. Soft indigo/bronze chamfers like accepted v4. No NPC avatar in a portal prompt, no duplicated portal title or invented stats.
- Outside range: prompt absent. Reviewer controls outside the game viewport can simulate approach; this is not gameplay locomotion.
- Travel: one short gentle fade, centered destination and `Đang chuyển khu vực…`; no fake percentage/countdown, no flashing. Input locked against repeated E/click. Image decode is the actual readiness signal for this screenshot-based prototype. Minimum visual dwell is brief; slow readiness remains honestly loading.
- Arrive: actual target map preview plus a small arrival title that fades after a few seconds; current area name remains accessible and visible. Spawn outside return radius, so holding E cannot bounce back. Return requires simulated approach to the return gate.
- Failure: keep source space, explain `Chưa thể chuyển khu vực`, offer `Thử lại` and `Ở lại`; Escape stays. Retry creates a new request token; stale completion/cancelled requests cannot move the user later. No persistence or real network account access.
- Reduced motion: remove the travel fade/pulse while keeping understandable static state. Mobile uses touch buttons; no keyboard-only hints. Focus enters loading/error modal, returns to source prompt on cancel, or focuses persistent area title on arrival.

Scene captures will reuse exact map configuration and existing source geometry + the approved local player VRM. Isolate only the existing scenery render functions into output, without modifying broken game source. Capture near/public, far/public, spawn/personal and near/return with the same lighting/camera family. These are renders of actual game assets/config, not live engine integration. Preserve HUD/icon masters.

## Written execution plan

1. output/portal-v1/build.cjs bundles source data/range helper, extracts scenery functions and builds a small renderer utility and prototype using existing esbuild/Three/React packages.
2. TDD model.mjs: valid range, begin/finish/error/cancel/retry tokens, stale events, safe URL states and bidirectional targets. Use source helper for range, source spawn for arrival.
3. index.html/style.css/preview.mjs implement prompt, loading, arrival and error; review.html contains explicit prototype state controls outside an iframe of game UI. Loopback-only allowlist server on 4321.
4. Browser: E/native click/Enter/touch, repeat lock, cancel/stale completion, both directions, real asset failure/retry, long labels, 130% text, reduced motion, responsive sizes and blocked scene interaction during travel.
5. Visually inspect captured states desktop/phone; create native-text Figma panels and click prototypes with separate scene/skin images. Read back text/state links and compare approved masters. Deliver live review, compact images, validation/handoff. Close only QA browser.

Acceptance: destination and action recognizable immediately; approved restrained game border style; transition reports arrival only after target asset decode; no false live travel claim; failure recoverable, no auto-bounce; controls remain >=44px and inside small/short viewports. No app-wide gates claimed for output-only work.

## Delivery — 2026-11-12

Surface mode: Operate; preserve accepted dialogue v4 materials. Completed output-only browser proposal at http://127.0.0.1:4321/review.html and9 native-text Figma panels/9 gameplay states. UI Design starts y11000; Preview y6400/y7640; review board88:18061. Independent skin/glyph assets retain CSS/SVG sources. Figma uses timed transitions; browser waits for actual image decode and rejects stale cancelled results. One initial-readiness race and a coarse-pointer hint specificity bug were found and fixed during QA.

Evidence: `output/portal-v1/validation.json`, `output/portal-v1-handoff.md`, `output/portal-v1-final/`.8 model tests,39 browser assertions,113 Figma readback assertions and10 HTTP checks pass. Static and rendered-mobile Impeccable scans return no findings. Approved HUD/icon hashes unchanged. Live engine movement/travel integration and application-wide gates are outside this proposal; no production fixes, dependencies, commits, SQL or deployment.
