# Garden journal HUD proposal

**Status: rejected by owner on 2026-11-12.** Owner prefers the previously approved angular cream/indigo/bronze HUD. Stop this exploration; do not finish, integrate or promote the journal/arched-portrait variant. Original HUD remains the visual authority. The unfinished proposal is retained only as history; browser QA/export work was interrupted and is not complete.

Owner requests one HUD variant suited to the new Tiny Glade inspired Vườn Gió assets, applying the relevant skills. This authorizes a scoped visual proposal, not replacing approved production UI or changing gameplay. Follow the research at `output/tiny-glade-ui-research-2026-11-12/ANALYSIS.md`.

## Design contract

Mode: Operate. New variant: garden explorer's journal, inheriting the approved cream/indigo/bronze identity and Spectral/Be Vietnam Pro fonts. Same name Minh An, title Người khám phá, level12,XP240/400, stamina80/100 and water6/8; these remain explicitly sample data in reviewer chrome. Preserve meaning of red stamina and blue water. No new currency or game mechanic.

Desktop footprint448×128. Warm ivory paper, narrow aged-bronze line, upright portrait in a soft architectural arch, restrained engraved corners; pale indigo level area rather than a dark slab. Same portrait artwork for fair comparison, original source/crop retained. No generative portrait, new illustration or texture needed: surfaces are CSS/SVG geometry. Existing menu silhouettes remain recognizable.

Same unchanged Vườn Gió render across before/after. Reviewer controls outside the game view choose new/approved HUD, source lighting/camera captures and sample meter states. Compact layout at320/390px preserves readable text, full state values and44px menu hit targets. Game preview has no locomotion or real state persistence.

## Written plan

1. `output/garden-hud-v1/`: prepare original portrait, unchanged scene JPGs, existing SVG icon recolors, fonts; record source hashes. Create separate local HTML/CSS/JS preview and loopback-only allowlist server4322. No dependency or app changes.
2. Build the HUD at448×128, mobile reflow, original overlay comparison, native controls, image failure/retry and sample states. Keep reviewer labels outside the game region. Links open existing backpack/settings previews.
3. Browser verification: same scene/no camera change on comparison, full and empty meters, text labels, keyboard/focus, image failure, desktop/mobile/short landscape,130% text/long name, reduced motion. Visual self-review + Impeccable detector. No unsolicited app-wide test gates for output-only work.
4. Deliver cropped transparent HUD, full scene captures, same-scene comparison and SVG source with native text/geometry plus portrait image. If Figma reconnects, add a separate variant and readback/export it; original masters unchanged. If unavailable, report the observed connector error and deliver importable source.

Acceptance: clearly softer/materially related to Vườn Gió while retaining deliberate details; all approved information readable; native text and values separated from decoration; no new behavior beyond explicit reviewer controls; original HUD hash unchanged. Single agent with separate self-review per owner AGENTS.md. No commit/push/deploy.
