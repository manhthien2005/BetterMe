# Arcana NPC dialogue — portrait proposal

## Brief and visual contract

Owner requested research → implement → acceptance checks, then explicitly required the interacting NPC's name and image. Research evidence: `output/dialogue-v1/research/RESEARCH.md`. Preserve approved HUD, backpack, settings, fonts and cream/indigo/bronze identity. Single-agent work; no game source repair, new dependencies, commit or deployment.

THESIS: the player immediately recognizes who is speaking and reads at their own pace while the scene remains visible. Extend the existing game's lower dialogue panel into a portrait panel. Operate mode. This is a narrow UI extension within the established visual system, not a new visual-world selection.

Layout: approximately 1080px wide, low on the screen with a safe bottom inset. Chamfered cream panel; compact indigo portrait frame at left; live NPC name and 20px body copy to the right. One primary Continue/Finish action with E hint; secondary History; top-right close target. No line counter, player stats or invented branching choices inside the dialogue. Phone: compact portrait/name row, text and actions below; long content scrolls inside a constrained region, controls remain reachable.

NPC portraits use the existing source graybox geometry/material identity, rendered into separate transparent PNGs. No player portrait reuse, no third-party character asset. Học giả An and Quản sự Khoa source dialogue/name/colors come from `src/lib/world/map-config.ts`. Use the existing pure `stepDialogueInteraction` helper through an output-only bundle. The world capture remains unchanged; this is not live engine integration.

## Behavior

- Nearby state: NPC identity plus a single Talk/E affordance; click or E opens at line zero.
- Speaking state: full line immediately visible; E or native button advances exactly once; repeats are ignored. Last line uses Finish and returns to nearby. Escape/close also return there and restore focus.
- History: only already seen lines for the current NPC/session. Back/Escape returns to the same line; E does not advance while reviewing history. Reopening starts a new session. No timed text or autoplay.
- Native dialog protects keyboard focus and blocks scene interactions while talking. Clicking outside does not advance the dialogue. No claim that the real game is paused.
- URLs can select the two known NPCs and nearby/talking preview states; invalid values fall back to Học giả An/nearby. Unknown parameters cannot inject markup or assets.
- Browser portrait load failure presents the speaker identity and a readable fallback; the normal state must show the real rendered portrait. Reduced motion removes the subtle entrance transition.

## Written execution plan

1. Research portrait patterns and accessibility, record actual observations and limits (complete before UI code).
2. `output/dialogue-v1/build.cjs`: extract approved NPC data and bundle the existing pure helper, render utility and preview using installed esbuild/three/lucide. No production file changes.
3. Tests first in `model.test.mjs`; implement `model.mjs` for open/advance/close/history and safe NPC selection.
4. `index.html`, `style.css`, `preview.mjs`: responsive portrait panel; `portrait.html`/`portrait.mjs` render source NPC geometry for export. `serve.cjs` exposes an explicit allowlist on loopback port 4320.
5. Browser checks: both NPC identities/portraits, first/middle/last lines, history limits, reopen/reset, keyboard repeat, Escape/focus, click-through exclusion, unknown URL, portrait fallback, reduced motion and long Vietnamese copy at desktop/phone sizes.
6. Capture actual renders, run Impeccable detector and separate self-review. Create native text/control Figma panels and gameplay prototypes for nearby/talking/history; PNG portraits and raster skin have source files retained.
7. Read back Figma links, preserve HUD/icon pixels, record hashes and limitations, close only the QA browser and leave local previews running. Deliver compact exports, live preview and acceptance evidence.

## Delivery — 2026-11-12

### Revision v4 — slight softening only, 2026-11-12

Owner found v3 slightly too technological and asked to soften only a little. Scope: reduce outer border from 3px to 2px, soften its indigo, shorten/thin the two corner fittings, reduce avatar rim weight and mute the primary button's inset line. Preserve v3 geometry, typography, content, controls and framed character identity. Update preview and only affected skin/portrait image layers in existing Figma frames; retain text/hit nodes and all links. Check rendered desktop/mobile and both NPCs, unchanged layout, E/history/Esc, plus Figma asset/readback. No new behavior/tests or broader redesign.

Delivered: all 14 captured state layouts retain exact v3 text/control geometry. Existing browser composition checks: 49 pass. Figma readback: 50 pass; native text/hit IDs retained. Only art layers replaced. HUD/icon exports hash-identical; text contrast and HTTP checks pass. Evidence `output/dialogue-v4/validation.json`, handoff `output/dialogue-v4-handoff.md`, final images `output/dialogue-v4-final/`. This is an art-only adjustment; no full app/model/detector rerun claimed.

### Revision v3 — restore crafted game framing, 2026-11-12

Owner rejected v2 as too simple and specifically requested improvement to the dialogue border, NPC avatar border and internal composition. This supersedes v2's area-reduction target and single-sans/minimal-outline direction. Impeccable + game-ui-workflow continue to lead; preserve the approved cream/indigo/bronze identity, actual NPC content and interactions.

Design: a medium-width panel (approximately 920px) with a definite indigo chamfered perimeter, finer bronze inner line and restrained corner fittings. A larger 126×152px portrait receives its own matching indigo/bronze chamfered mount. Restore Spectral for the NPC name, keep Be Vietnam Pro for readable dialogue/actions. Align header, text and footer on one column, use an understated rule to separate actions, and keep one primary button with an inset border. Nearby identity prompt follows the same framing. No new copy, branches or artwork.

Plan: snapshot v2 source in output/dialogue-v3/before; edit preview CSS and the frame SVG path renderer; verify both NPCs/all lines/history, E/Esc/touch/focus, long text and image fallback at established sizes; visually inspect before Figma; refresh the existing 14 panels/14 gameplay frames keeping root IDs; read back mappings and 64 links; compare approved HUD/icon hashes; write output/dialogue-v3-handoff.md and validation.json. Preview runtime remains output/dialogue-v1 on port 4320. Acceptance: borders visibly feel part of the approved game family, NPC name/portrait are a coherent identity group, readable content and ≥44px controls fit at 320px and short landscape, no changed dialogue behavior. Single-agent self-review; output-only, no production changes or deployment.

V3 delivered at 920×229.39px with 126×152px framed portrait, Spectral 24px NPC name and Be Vietnam Pro 18px dialogue. Both border systems and nearby prompt share the indigo/bronze chamfer. Verified 6 model tests, 117 browser assertions, 202 Figma readback assertions including 64 links, 6 AA text contrast pairs, 9 HTTP checks; HUD/icon hashes unchanged. One detector contrast false positive remains for the nearby prompt because its opaque cream pseudo-element covers the indigo border parent; actual background and text bounds were read from browser and visually inspected. No blanket suppression. Evidence: output/dialogue-v3/validation.json; handoff and review images: output/dialogue-v3-handoff.md / output/dialogue-v3-final/. UI roots kept stable; former v2 children hidden as archives. Original output-only limitations remain.

### Revision v2 — compact interaction, 2026-11-12

Owner requested Impeccable + game-ui-workflow to refine the entire dialogue flow toward compactness, immediate NPC recognition and clear controls, with a more modern appearance. This supersedes the original spacious portrait-panel dimensions below; approved HUD/backpack/settings remain the visual context.

Design decision (Operate mode, distill): preserve actual NPC identities/portraits, source dialogue and existing interactions. Reduce the desktop box to approximately 840×190px, portrait to 96×112px, use one thin chamfered outline and one sans font family inside the dialogue. Remove nested inset borders, oversized display heading, footer divider and in-game prototype label. Group NPC portrait/name with the text; expose E on the single primary action and Esc on close. History remains a quiet secondary action. Nearby prompt becomes a compact identity/action chip. History opens only on demand. All clickable targets remain at least 44px.

Plan: (1) snapshot current preview sources under output/dialogue-v2/before; (2) update output/dialogue-v1/index.html, style.css and only required markup rendering in preview.mjs; keep model unchanged; (3) verify source-line identity, interaction regression and compact geometry at desktop/phone/short landscape, long Vietnamese content, 130% body size, image failure and reduced motion; (4) export output/dialogue-v2-final screenshots and refresh the existing Figma dialogue flow while retaining stable root IDs; (5) read back links/native text and recheck approved HUD/icon hashes; record evidence in output/dialogue-v2/validation.json and output/dialogue-v2-handoff.md. No production integration, dependencies, commit or deployment.

Acceptance: first-line desktop panel area at least 35% smaller than v1 1080×275, normal body text at least 18px, name and portrait visible together, primary E and close Esc discoverable, no clipped controls or scene click-through, history still limits to visited lines. Separate visual self-review after automated checks. Reuse established research; no new character artwork is required for this UI refinement.

V2 delivery: actual desktop 840×190 (46.26% less area), 96×112 portrait, 18px body/name. E/Esc hints now follow the actual talking/history behavior; touch contexts omit keyboard-only hints. Verified 6 model tests, 118 browser assertions, 202 Figma readback assertions (64 links), 6 AA text contrast pairs and 9 HTTP checks; Impeccable detector exit 0, no findings. Approved HUD/icon SHA256s unchanged. All 28 existing Figma roots retain IDs; previous children are archived hidden. Source preview remains output/dialogue-v1; v2 evidence/exports/handoff live under output/dialogue-v2*. Scope and limitations from the original output-only proposal still apply.

Implemented under `output/dialogue-v1/`; final images in `output/dialogue-v1-final/`; full handoff in `output/dialogue-v1-handoff.md`. Desktop panel is 1080×275px with 166×190px portrait; browser layout adapts down to 320×480. Both actual NPC identities and source lines are wired. Portraits are deterministic renders of current graybox models, not final character art. Live preview: http://127.0.0.1:4320/?state=talking.

Verification: 6 model tests pass, 68 browser assertions pass, Impeccable detector exit 0 with no findings, 174 Figma readback assertions pass (including 64 navigation links), 9 HTTP/allowlist checks pass. Approved HUD and icon-board exports are SHA256-identical to the baseline. Separate visual self-review inspected desktop, phone, short landscape, history, second NPC and Figma exports. Evidence and mappings: `output/dialogue-v1/validation.json`.

Figma contains 14 native-text panels and 14 gameplay frames covering nearby, all three lines and session-correct history for both NPCs. Frames, glyphs and portraits remain separate raster assets with CSS/SVG/source PNGs retained; this is not a claim of a fully vector skin. Browser is authoritative for keyboard, focus, portrait retry, scrolling and responsive layout. Gameplay remains the approved screenshot; no engine integration or app-wide gate result is claimed. No production source/dependency/SQL changes, commit, push or deployment in this work.
