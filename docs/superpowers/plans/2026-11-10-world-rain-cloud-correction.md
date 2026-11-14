# Visible rain and cloud correction implementation plan

> Execute inline using executing-plans. The existing owner-authorized sky asset worker may finish its scoped cloud asset correction; parent owns all rain/integration. No commit/push.

**Goal:** Rain visibly falls when weather says rain; remove the three unnatural cloud silhouettes.
**Architecture:** Pure deterministic rain particle data + allocation-free position-buffer updates, two GPU batches with tapered lines/animated ground rings, driven by effective weather. Clouds retain V3 relighting with three replacement source maps.
**Stack:** Existing TypeScript, Three.js, R3F, Vitest, repo Playwright; no new dependency.
**Spec:** ../specs/2026-11-10-world-rain-cloud-correction-design.md

## Work and ownership

- [x] Prior asset worker: fantasy-sky-assets.ts/tests, three new derived cloud textures, V3 README and offline derivation/provenance under output. Rejected mapping regression is green; old artwork is preserved. Current source/output hashes rechecked on resumption.
- [x] Parent: rain-model.ts/tests. Deterministic bounded field; downward/wind motion and wrapping; state gating for rain/reduced motion. Pure TypeScript with no renderer/browser imports.
- [x] Parent: world-rain.tsx renderer + WorldScene hookup after PlayerRig so camera is current. Batches share buffers; stable uniforms, dispose lifecycle, hide both batches when dry/reduced-motion; ground bounds clip splash placements.
- [x] Parent: Playwright assertions/screenshots day/night/dry, reduced motion, motion/reset, mobile, three map cycles; record scene draw counts. Separate self-review covers changed files and optional source failure behavior.
- [x] Parent: stop verified dev tree, pnpm verify, record results, restart preview.
- [ ] Owner visual acceptance: inspect current day/night rain and replacement cloud silhouettes in the running preview. Screenshots are captured, but the resumed agent cannot view image inputs; automated assertions are not visual approval.

## Review focus

- Rain buffer advances downward with no per-frame geometry allocation; camera moves must not drag nearby drops.
- Draw order/depth: clouds and avatar keep working; rain is spatial, no full-screen overlay.
- No particles under reduced motion, dry weather or stale neutral weather; no new data request.
- No splash outside ground bounds; flat-ground assumption documented for any future terrain.
- Reuse/disposal and repeat map mounts; source cloud hashes/provenance kept.

## Progress

Root cause confirmed: V1 deliberately excluded particle rain; no rain renderer exists. Rejected images map to V3 layered-2, distant-0 and distant-2. Prior full verification was 684 tests. Camera/fade remain outside edits.

- Ruling: update one preallocated 1200-line position buffer using the tested pure sampler, rather than duplicate the motion equations between CPU tests and a GPU shader. Two render batches remain; 28.8 KB of positions per rendered frame, no particle objects allocated per frame. Impact ring animation stays on GPU. Validate frame pacing in-browser before acceptance.
- Rain RED: missing module, then stub run 3 failed / 1 passed for field generation, falling and state gating. GREEN: four model tests passed. Initial browser view shows rain and small impact rings by day/night, 0 shader errors. Initial typecheck exposed Three's generic TypedArray declaration; changed to BufferAttribute over the existing Float32Array, with no cast/copy.
- Resumed 2026-11-10 after the original chat failed before handoff. No further runtime or asset edits were needed. Focused run: 4 files / 26 tests passed. Fresh full `pnpm verify`: exit 0, typecheck and lint passed, 74 files / 729 tests passed, production build succeeded. Dev was stopped and the checkout's process/port state verified before building.
- Fresh browser assertions passed: moving rain in day/night and both spaces, stable position geometry, dry-state fade-out, immediate reduced-motion suppression/restoration, walking/jumping/orbit coverage, portrait width 390 with no horizontal overflow, three map cycles with stable retained texture/geometry counts, no page exceptions or shader compilation errors. Screenshots and raw logs are under `output/playwright/rain-cloud-correction/`; see `acceptance.md` for evidence and limitations.
- Separate self-review: effective live/preview weather is shared with the scene; expired/unavailable readings are neutral with `isRaining=false`, while the existing 30-minute-to-2-hour stale-reading policy remains unchanged. Rain adds no fetch, texture, audio, dependency, camera/fade behavior, or persistence change. Existing cloud load failure keeps its code-native fallback. Impeccable manual detector returned `[]`.
- Ground limitation: impacts use a fixed y=0.055 above the current flat playable floors, with 0.3-unit inset centers. This is not terrain sampling or roof occlusion; a future raised/sloping terrain needs a separate change.
- Preview restarted on loopback only at `http://127.0.0.1:3000/world`; HTTP 200 verified. Dev auth bypass is local-only, with sync/social off by design. No commit, push, deployment, or SQL action.
