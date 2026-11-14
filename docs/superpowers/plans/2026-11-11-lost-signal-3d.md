# Lost Signal — dynamic 3D listening mission

Owner explicitly authorizes research, brainstorming and implementation. Their
rejection: desk/text manipulation is unengaging. Build an actual animated game
world with direct controls, meaningful changing state and polished feedback.
Desktop first, separate local prototype; single agent and self-review. Do not
change existing app/character assets, commit, push or deploy.

## Research / choice

Official https://keeptalkinggame.com/ read 2026-11-11: asymmetrical information,
players communicate because one sees the device and the others have its manual;
mission/free-play variation. Borrow information dependency, not bombs or a quiz
gate. https://www.operation-tango.com/ fetched but no useful body description;
do not cite it as verified evidence. Previous Cambridge/IELTS official reading
in `docs/research/2026-11-11-ielts-playlab.md` remains basis for listening details,
directions, paraphrase, corrections and constraints, not proven IELTS outcomes.

Three alternatives considered: real-time dispatch, information-gap co-op and
open spoken negotiation. Choose one-player 3D dispatch with a scripted radio
partner; works locally without voice APIs and lets owner assess actual movement,
timing and spatial decisions. Not described as free conversation or multiplayer.

## Vertical slice

Fixed-angle 3D floating academy facility at night; full viewport, real geometry,
lit windows, water, trees, moving interference fields, rotor/hover and rescue
effects. Camera is overview, no player avatar artwork replaced. User directly
pilots a small rescue drone with WASD/arrows or click-to-route via grid BFS.
E interacts, Q switches north/south bridge circuit, Space emits a protective
pulse, R repeats radio, C toggles English subtitles, Escape pauses.

Map: central dock; west/east channels each have north/south bridges. Only one
bridge circuit is powered at a time. All beacon locations are visible and
equally styled. Radio alone specifies current destination; no correct-target
arrow or answer selection. Scenic buildings block travel. Wrong beacon gives
location feedback, never a quiz score. Carry relay home to restore lighthouse.

Three missions: café relay; library relay with live north-bridge closure and
spoken correction; gallery relay opposite greenhouse. Every return lights one
section of lighthouse and alters environment. Temporary storm interference
slows the drone unless protected; pulse radius visible and cooldown recovers.
No death, timed reading pressure, shaming, pet growth/food changes or leaderboard.
Subtitles/replay/slow playback are optional without penalty. Completion screen
shows what was heard and which English relationship was used, not a band score.

## Files under output/prototypes/lost-signal/

- `engine.js` + `engine.test.cjs`: pure geometry, gates/pathfinding, movement,
  pulse/hazard, target/pickup/delivery and checkpoint validation. RED→GREEN.
- `scene.js`: Three.js 0.187 rendering and screen→ground/project helpers;
  copy installed build modules + license into vendor, no new package/CDN.
- `game.js`, `index.html`, `style.css`: lifecycle/input/audio/HUD/focus, save only
  verified checkpoints, clear controls and short onboarding in actual scene.
- `radio.json`, `make-audio.ps1`, `audio/*.mp3`: original scripted English;
  installed Windows voices, clearly synthetic. No user microphone/network TTS.
- `serve.mjs`: fixed whitelist at 127.0.0.1:3025; no private or repo routes.
- `qa-first.txt`, `qa-finish.txt`, `qa-resilience.txt`, `qa-final.txt`: real browser,
  all three missions via actual controls,
  gate changes/correction, wrong target, pulse cooldown/storm, pause/audio,
  keyboard/click routes, reload/storage, desktop screenshots.

## Acceptance / checks

Game is operable at 1440×900 and 1280×800, no horizontal overflow; HUD clicks
never steer drone. Raycast and pathfinding agree with visible terrain. Locked
bridge prevents crossing and active routes recover after state changes. Pulse
works only with cooldown and temporary effects do not erase discovered progress.
Pause/blur/hidden tab stop simulation/audio and clear held keys. Large frame dt
clamped. WebGL failure shows useful message. No false learning/effectiveness
claim. Review actual rendered screen, frametime and console; desktop only.

## Ledger

- Implemented isolated local prototype, including 11 English audio clips and
  vendored Three.js 0.187 with its license. No added package or CDN dependency.
- Engine RED→GREEN initially 7 tests; self-review found a valid position beside
  a channel could round into a blocked grid cell. New regression failed, then
  passed after connecting the actual position to a reachable adjacent node.
  Final engine result: 8 passed, 0 failed. Game/scene syntax checks passed.
- Real controls completed all three missions, including wrong target, ground
  click, moving interference/pulse, north closure, south reroute and checkpoint
  reload. Zero page/console errors and warnings in the full-mission check.
- Resilience check passed: desktop 1280×800, reduced motion, keyboard dialogs,
  HUD isolation, reset/cancel, corrupt/invalid/blocked storage, radio playback.
  Headless Chromium keeps background pages focused/visible, so blur handling was
  tested with a dispatched event; physical OS tab-switch behavior is unverified.
- Final check passed for the manual-to-route edge case, WebGL failure message,
  server whitelist and rejected POST. Expected 404/405 logs were excluded only
  in that intentional failure check. Startup stays disabled until scene/radio ready.
- Visually reviewed 1440×900 and 1280×800 JPEGs. Enlarged functional text.
  Impeccable static detector: 0 primary findings, 3 advisory notes for shadows on
  separate native dialogs. Procedural scene itself was reviewed in screenshots.
- Single-agent self-review completed. Fixed obsolete Three shadow constant,
  shared mutable gate material, decorative reduced motion, and route start edge.
  No app gates claimed; isolated output assets and documentation only in this turn.
- Research, limitations, launch/controls and evidence recorded in
  `docs/research/2026-11-11-lost-signal-prototype.md`.
