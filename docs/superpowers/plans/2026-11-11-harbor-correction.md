# Harbor Shift — focused Listening gameplay implementation

Goal: one playable desktop micro-lesson for hearing a speaker's correction.
Owner authorized implementation and accepted actual 3D interaction. Reuse the
Lost Signal material/palette and local Three.js 0.187, no new dependency. Work
inline in existing worktree; single-agent self-review; no commit/push/deploy.

## Design / acceptance

One crane over a small harbor. Three sequential crates, four physically equal
numbered bays. Hear a short English dispatch with an initial value corrected to
a different final value. Move the magnetic crane with WASD/arrows or ground
click. Space/E lowers to pick up or place. Actual cable lowering/lifting, cargo
sway, delivery boat departure, water and light effects. Wrong placement keeps
the crate on the magnet and replays the dispatch. All bays remain available;
world UI never reveals the correct bay before delivery. Final summary contrasts
heard first/final values. No timer/score/death/penalty, text-answer controls,
large curriculum, voice recognition, mobile or changes to main app.

Missions (same narrow skill): 2→4, 3→1, 1→3. The requested cargo stays unchanged.
Replay/slow/CC available; accept action after hearing clip or deliberately
turning on its transcript. Queue first pickup until dispatch has finished;
movement remains active. No hidden timer pressure. After success, new crate
arrives and next message plays; three deliveries complete the single exercise.
Replay resets this short session; no persistence needed. 1280×800 and 1440×900.

## Files / tasks

- [x] Pure engine + node tests in `output/prototypes/harbor-correction/engine.js`
  and `engine.test.cjs`: bounds, normalized motion/dt, action phases, listening
  gate, wrong destination, accepted delivery once, three deliveries/reset.
- [x] `scene.js`: real Three geometry, raycasting, all four equal bays, crane
  cables/magnet/cargo, boat dispatch, water, reduced motion.
- [x] `index.html`, `style.css`, `game.js`: live HUD, start/pause/end, audio,
  keyboard and pointer, accessible native controls, no click-through. Copy local
  vendor/license and synthesize original audio using existing Zira script.
- [x] `serve.mjs` whitelist bound 127.0.0.1:3026, no auth/private data;
  `qa.txt` checks real controls/audio and full exercise, wrong delivery, pause,
  replay/reset, UI sizing and reduced motion. Inspect compact JPEG renders.
- [x] Update handoff, record evidence/limits, close isolated QA, request sample open.

Review focus: audio readiness/races, held keys after pause, premature placement,
moving crane during hoist, repeated confirm advancing more than once. Tests
cover engine behavior; browser tests cover integration. No claim of IELTS gain.

## Direction contract

Extend accepted Lost Signal night-harbor world: teal water, stone platforms,
warm brass crane and cyan functional lighting. Full-viewport 3D as main view;
compact title/progress top, radio lower left, controls below. Startup explains
one action loop in three lines; English transcript only on demand. Distinct
physical cargo handling replaces traversal without changing the approved visual
language. Procedural geometry only. Completion means real play verified and
documented, not a final curriculum or production integration.

## Ledger

Plan written before implementation. User's prior instruction to proceed and
current request to build a small playable exercise authorize this scope; no
further design approval needed. No delegation per owner instructions.

Implementation: engine RED 0/6 → GREEN 6/6; syntax checks passed. Real browser
full exercise HARBOR_FULL_PLAY_PASS (0 errors/warnings). Edges HARBOR_EDGE_PASS
(0 page errors), including explicit failure fallbacks. Inspected both desktop
sizes; detector exit 0 after neutralizing panel shadows. Single-agent self-review
fixed invalid pickup hint while carrying and guarded audio readiness on ended.
Full details/limits in `docs/research/2026-11-11-harbor-shift-prototype.md`.
Final full play rerun passed after fixes. HTTP smoke: 200 root, 404 private path,
405 POST. Isolated QA closed; requested app-browser open. Server remains running.
