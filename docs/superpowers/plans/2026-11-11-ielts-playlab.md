# IELTS Playlab — three playable desktop experiments

Owner correction: alchemy is off-target. English/IELTS must be the activity,
not instructions wrapped around another subject. Owner explicitly requested
research and playable alternatives; implement an isolated comparison now.
Keep accepted /world assets and previous prototypes intact. Single-agent,
inline execution and separate self-review; no commit/push/deploy.

## Evidence and design

Read on 2026-11-11:
- Cambridge Adventures in English: puzzles, characters, mysteries; A1+ children.
  https://www.cambridgeenglish.org/learning-english/games-social/adventures-in-english/
- Her Story: type search terms, discover interviews containing those words,
  reconstruct a non-linear story. A game-mechanic reference, not an English course.
  https://www.herstorygame.com/about/
- Lingo Legend Yorthwood (previous research): strategic cards gated by questions.
  https://www.lingolegend.com/yorthwood — borrow hand/choice, avoid quiz-to-attack.
- Influent (previous research): object-linked vocabulary, insufficient by itself
  for IELTS reading/argumentation. https://playinfluent.com/
- Official IELTS Academic format: reading scans/details/claims/main ideas;
  listening detailed information and relationships; writing relevant arguments,
  evidence and logical organization. No inference of efficacy or band calibration.
  https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading
  https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening
  https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing

## Three distinct loops (original authored content)

1. **The Missing Clause / Hồ sơ bản tin** — Reading. Search a small English
   archive (max three results per search), follow wording to discover documents,
   pin evidence, edit an inaccurate newspaper summary's three claims. Publishing
   requires the selected evidence to support each claim, not just a guessed answer.
   Source-content and answer semantics are separate. No special-subject knowledge.
2. **Switchboard / Tổng đài đổi lịch** — Listening. Hear three English callers,
   assign actual appointment tokens to room/time cells with capacity/projector
   constraints. A later correction forces rearrangement. Replay and transcript
   assistance are allowed, with no penalty. Local generated English audio is
   explicitly synthetic, not authentic IELTS listening or varied-accent coverage.
3. **Argument Arena / Bàn tranh biện** — Writing Task 2 preparation. A finite
   hand of English sentences; choose and order two cards under a three-point
   budget to address each of three objections. Successful cards leave the hand;
   several pairs work, so conserve flexible arguments. End with a readable draft
   and optional personal rewrite. Curated checks only, no AI or band score.

All three retain progress independently, can restart independently with
confirmation and let the owner record a local preference. Desktop 1440×900 and
1280×800. No movement/mobile/leaderboard/streak/pet penalties/backend. Existing
academy palette and readable paper typography, distinct board composition per
game. Product context remains in docs; no competing PRODUCT/DESIGN files.

## Implementation files

Under `output/prototypes/ielts-playlab/`:
- `data.js`: authored passages, requests/transcripts, argument cards.
- `engine.js`: pure search, evidence checks, schedule validation, card rules,
  safe restore; classic script + Node export for exact same logic under tests.
- `engine.test.cjs`: RED→GREEN for valid paths, alternate card paths, unsupported
  evidence, source-not-discovered, query boundaries, room collisions and update,
  card order/reuse/budget, malformed persisted state.
- `styles.css`, `ui.js`: accessible desktop shell, three actual boards, modal
  confirmations, focus, drag alternatives, audio lifecycle, isolated local storage.
- `audio/`, `make-audio.ps1`: generate four short original fictional messages
  with installed Windows English voices; encode with FFmpeg, no network TTS.
- `build.mjs`: inline sources/audio into single `index.html`, no remote resources.
- `serve.mjs`: whitelist HTML only at loopback port 3024; no repo file serving.
- `qa.txt`: browser tests for each full loop, branch/replay/undo, audio playback,
  reload/reset/corrupt/blocked storage, keyboard, desktop screenshots.

## Acceptance and review focus

Three games work independently and have different decisions, not just skins.
Direct English evidence determines outcomes. Reading facts must be logically
accurate and clearly distinguish popularity from temporary contract expiry.
Listening schedules must be solvable before/after the correction and must reject
collisions. Actual audio files must play; any fallback explicitly labels text mode.
Argument acceptance checks relevance and logical pairing, not invented writing scores.
No unsafe rendering of search/rewrite/localStorage. Switching modes stops audio.
Preference means owner's feedback, not inferred engagement or a learning outcome.

## Execution ledger

- Research/design and three playable loops completed. One standalone HTML with
  embedded audio, 385606 bytes at final build. Server port 3024/session 39608.
- Engine RED 0/6 → GREEN 6/6; IELTS_PLAYLAB_QA_PASS across all three games and
  actual audio; IELTS_PLAYLAB_FINAL_PASS after self-review/race correction.
- Added coherent mixed argument pairs and conditional text casing; card checks
  explicitly limited to authored combinations. Corrected cancellation feedback
  leaking across tabs with a generation guard, reproduced before correction.
- Report/evidence/limitations: `docs/research/2026-11-11-ielts-playlab.md`.
  Owner engagement and suitability assessment pending; no band/efficacy claim.
