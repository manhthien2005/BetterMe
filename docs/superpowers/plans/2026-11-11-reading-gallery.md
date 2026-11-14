# The Aurora Gallery — Reading gameplay

Owner requests Reading after accepting 3D interaction. Implement one short
exercise for locating specific information and recognizing paraphrase. Existing
authorization covers a playable sample. Preserve current samples/main app;
single agent, no commit/push/deploy. Desktop 1440×900 and 1280×800 only.

## Design

Restore three display stories using a single original 243-word museum record.
Six physical 3D objects sit on stands: compass, telescope, bell, whistle,
camera, journal. Each story is an English paraphrase; read the record and move
the matching artifact onto the illuminated center plinth. Three targets:
compass (changed user after injury), bell (changed purpose after a complaint),
camera (its output raised money for ship repairs). Each distractor is discussed
in passage with a contrasting purpose, so outside knowledge is insufficient.

Directly drag model in 3D, or select model/label then click plinth. Keyboard:
Tab/Enter selects, arrows/WASD move held artifact, E places, Escape returns
held item / pauses, R opens record. Equal artifact styling; no target arrow.
Correct placement animates artifact into a permanent display, lights one
architectural arch and reveals supporting quote. Next story waits for explicit
continue, preserving time to read evidence. Wrong placement returns artifact,
leaves all progress and offers rereading without revealing exact answer.
Completion recap records three paraphrase/quote relationships, not IELTS score.
No timer, guilt, penalty, physics puzzles, audio or voice APIs, persistent save.

Passage stays in readable docked side panel; can collapse for unobstructed 3D.
Reading directly controls which physical action succeeds. Still a micro-lesson,
not proof of learning or full IELTS passage difficulty. No text answer buttons.

## Implementation tasks

- [x] `output/prototypes/reading-gallery/content.js`, `engine.js`, `engine.test.cjs`:
  pure selection, bounds, movement, placement tolerance, reject wrong/repeated
  actions, three-story completion, immutable accepted artifacts and reset.
- [x] `scene.js`: use local Three.js 0.187/vendor/license, model six recognizable
  objects, shelves/plinth/arches, object ray picking, world projection, carrying,
  accepted transfer animation, lighting/particles and reduced motion.
- [x] `index.html`, `style.css`, `game.js`: start, record, task, drag/click/keyboard,
  feedback/continue, pause/reset/end, focus and pointer cancellation. Use accepted
  teal/gold/stone material language; no new package or raster assets.
- [x] `serve.mjs` loopback whitelist at 3027. `qa.txt`: play all tasks through real
  controls, wrong placement, reading evidence, keyboard, HUD no click-through,
  cancel/blur/reset, desktop sizes, WebGL fallback. Compact screenshots.
- [x] Self-review, evidence + handoff, close isolated browser and request sample open.

Review focus: drag cancelled during blur, selecting already accepted artifact,
held key while reading, repeat placement/continue, clipped document at 1280.
TDD for domain logic, browser checks for actual integration; no app gate claims.

## Ledger

Design and file scope written before implementation. Spec history from earlier
quiz/desk versions is superseded by owner's explicit interactive 3D preference.

Self-review: initial prompts could be guessed from familiar object functions;
rewrote source/prompts to depend on particular expedition events (handover,
changed role, funding), preserving the narrow skill and physical loop. Passage
now 243 words. Engine tests RED 0/7 → GREEN 7/7; includes evidence consistency.
Browser regression exposed stale wrong-placement banner after success; fixed
and reran to SUCCESS_BANNER_PASS. Isolated per-object highlight materials and
cleared held movement keys on document focus/pointer access. Static UI detector
exit 0 after stronger secondary ink; WebGL reviewed through actual captures.
Final content rerun: GALLERY_FULL_PLAY_PASS (0 errors/warnings), GALLERY_EDGE_PASS
(0 page errors). Both desktop screenshots inspected. Isolated QA closed; app
browser open queued for 3027; server left running. No app/source commits.
