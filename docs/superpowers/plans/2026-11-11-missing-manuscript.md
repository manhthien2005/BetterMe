# The Last Page — Reading detective vertical slice

Owner explicitly approves the proposed one-room missing-manuscript case and
requests a playable test. Single agent, existing worktree, desktop only; preserve
all app/character edits and prototypes. No commit/push/deploy, paid APIs or deps.

## Design

One 3D library, original 245-word main report, three short English evidence
records. Skill: locate facts, distinguish scope of a statement (closed to visitors
vs empty building), connect referents and chronological events. Player can read
at any time and manipulate real drawers, key, hinged case and storage cabinets.
No generic item matching, text-only detective desk, timers or punishment.

Case truth: conservator Mira Vale entered via staff door at18:20, moved F-17 out
of display after humidity warning at18:35, put it into dry storage at18:40.
Front door closed to visitors at18:00. Main report gives procedures and spatial
description of storage, not the case solution. Reading informs which drawer and
cabinet to search. Every discovery remains available; only task-specific scene
state persists within the current session, no localStorage required.

Interactive room: center locked glass case; librarian's desk with upper drawer
containing entry ledger, lower drawer holding spare key; staff door at rear;
three cupboards, one near window (umbrellas), one near entrance (returns), one
between tall bookshelf and clock (manuscript). All cupboards can open freely;
no magical document-read gates. Duplicate transfer slip in display; original
storage tag with manuscript. Key acquired physically and dragged/click-used on
case. Short inspection panel shows source text, no MCQ answers. Found manuscript
can be opened/examined and added to evidence. Three evidence records support
reconstruction; no claim that finding the manuscript alone proves who moved it.

When all three records found, reconstruction mode: click room locations in
order (staff entrance → display → safe cupboard), using recorded times. Each
accepted location starts a ghost silhouette/footprint/light playback. Wrong
order gives neutral reread feedback; no lost evidence. Finish explains what is
supported and why public closing time alone cannot exclude staff access.

## Files / execution

- [x] `output/prototypes/missing-manuscript/content.js`, `engine.js`, tests:
  independent drawer/cabinet state, key possession/use, access validation,
  evidence uniqueness, reconstruction gating/order/idempotence, reset.
- [x] `scene.js`: local Three.js0.187 + license, procedural room/props, animated
  drawers/lids/doors, raycast interactables, key drag, reconstructed actor/route,
  reduced motion. Reuse accepted material language; no new art/model dependency.
- [x] `index.html`, `style.css`, `game.js`: visible mission, 3D hotspots, readable
  report/inspection dock, evidence tray, keyboard equivalents, explicit help,
  pause/reset/finish, no HUD click-through, pointer capture/blur safety.
- [x] loopback whitelist server3028, focused node tests and real browser play
  including alternate discovery order, wrong cupboard/order, drag key, UI focus,
  1440×900 and1280×800, reduced motion, WebGL fallback. Compact JPEG/logs.
- [x] Separate self-review, evidence/report/handoff, close QA, request sample open.

Acceptance: player can complete whole case with real controls, clues trace to
actual passages, no automatic accusation or claims of IELTS gains. Scripts may
read QA snapshots but never mutate state to bypass gameplay. Missing records
and source uncertainty stay distinct from falsity. No full-app gates claimed.

## Ledger

Plan written before implementation. This is a concrete playable test of the
already-approved investigation loop; no additional scope confirmation required.

Implemented the one-room case with real 3D drawers/cupboards, key drag and
hinged display, read-only evidence dock, chronological room reconstruction.
Engine RED: 0 pass / 7 fail; GREEN: 7 pass / 0 fail. Syntax checks exit 0.
Browser full play at 1440x900: MANUSCRIPT_FULL_PLAY_PASS, 0 errors/warnings.
Edge play at 1280x800/reduced motion: MANUSCRIPT_EDGE_PASS, 0 errors/warnings;
alternate discovery, keyboard/scroll, drag cancel/blur, pause/reset and WebGL
fallback. Native OS focus change remains unverified.

Separate self-review: matched all evidence/times to main report, physical
positions and conclusion; reviewed access checks, replay busy gate, drag cleanup
and reset. Browser RED exposed document action contrast 1.06:1 (inherited paper
ink on dark button). Explicit light ink gives 9.38:1, regression GREEN. Layout
RED found objective/banner overlap with three room labels at 1280; moved book
label and banner, ROOM_LABEL_LAYOUT_PASS with no overlaps. Refreshed full play
after these changes. HTTP smoke: root200, HANDOFF404, POST405. No app gates,
commit, push or deploy; preserved all previous app/character work.

QA browser closed. App-browser open for3028 returned queued; not claimed as
observed. Server remains running for owner. Report/handoff saved.
