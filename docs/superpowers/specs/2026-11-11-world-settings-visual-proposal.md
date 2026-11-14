# Arcana game Settings — visual prototype

## Revision 2 plan — owner feedback

Delivered: five categories plus English/expanded-picker references in Figma. Existing four UI/Preview root IDs preserved; Language UI `73:10727`, Preview `75:11254`; English reference `73:10762`; dropdown reference `75:11535`. Six model tests, 80 regression browser assertions, 203 revision browser assertions, and 72 Figma readback assertions passed. Detector returned exit 0 / no findings. Footer now has a 28px bottom inset. Details and limits: `output/settings-v2-handoff.md`, `output/settings-v1/validation-v2.json`. No game integration claimed.

Keep the accepted visual direction. Replace the wheelchair-specific Lucide Accessibility glyph with PersonStanding for universal accessibility. The desktop footer currently has only 7px below its 44px buttons while frame corner art rises 38px; reserve a real bottom inset in an auto-sized footer rather than placing controls in the border area. Check saved, dirty and error states in both languages at narrow/short viewports.

Theme the existing native select picker with CSS `appearance: base-select` where supported; preserve native keyboard behavior and fallback on other engines. Do not add dependencies or a custom popover. Add a fifth Language category (Languages glyph) with autonyms Tiếng Việt / English; switching previews all Settings UI copy immediately, including accessible names, confirmations, status and document language. Save persists the language under the existing versioned key. Discard restores the saved language; reset affects the language group only. Existing stored values default safely to Vietnamese.

Files: `output/settings-v1/{model.mjs,model.test.mjs,i18n.mjs,preview.mjs,index.html,style.css,build.cjs}`, browser checks/captures and Figma handoff. Dependencies: existing lucide-react/esbuild, browser native selects. Acceptance: universal icon, footer text/buttons at least 24px inside bottom edge with no overlaps, styled opened dropdown verified by screenshot and keyboard, complete EN/VI Settings switch/save/discard/reset. Update Figma screens and links, preserve approved HUD/backpack. Single-agent self-review; no production app changes or commits.

Status: owner approved Backpack v5 and requested the next surface, game Settings, with Genshin Impact as the style reference. This is a local interactive visual proposal and Figma handoff. Do not repair unrelated dirty game source or claim game integration.

## Direction contract

THESIS: a calm game-settings sheet with category navigation at left and aligned label/value rows at right. Learn the familiar Genshin-style navigation rhythm without reproducing its branding or assets.

OWN-WORLD: inherit approved Arcana cream/indigo/bronze, Spectral headings, Be Vietnam Pro controls, restrained cut-corner frame and the approved settings glyph. Controls carry state through text, shape and focus, not color alone.

STORY: choose a category, adjust values, see which changes remain unsaved, save locally or return safely to the scene.

FIRST VIEWPORT: approximately 1160 × 744, 232 px indigo category rail, generous cream settings rows, 44 px close target, fixed footer with section reset/status/save. Gameplay capture stays visible outside the sheet. Mobile categories form a horizontal four-item strip and only content scrolls.

FORM: two-column list, selected because the owner pinned the game-settings reference and the existing visual world. No concept tournament or system rebrand. Operate mode. Single-agent self-review under the owner's AGENTS.md preference.

FINISH: inspect rendered desktop/mobile states, check model/state and input behavior, read back Figma prototype links, record limitations and sources, and hand off compact exports.

## Categories and behavior

- Hình ảnh: quality preset, FPS selection, antialiasing, brightness and blurred menu background. Graphics choices are prototype values; brightness/blur visibly affect the preview scene only.
- Âm thanh: master/music/effect volume, mute, mute when backgrounded, and a click-to-play synthesized test chime. No copyrighted audio or automatic playback.
- Điều khiển: pointer sensitivity and vertical inversion as prototype values; read-only current key bindings from `use-keyboard-controls.ts` (WASD, Shift, Space, E, R).
- Trợ năng: font size, high contrast, reduced motion and key hints. These change the preview UI itself. Default reduced motion follows the device preference on first use.

Draft values survive switching categories. Save writes only this prototype's versioned localStorage key. Closing dirty settings asks to save, discard, or continue. Reset affects the current category's draft only. Cancel/discard reverts the visible preview to saved values. Storage failures leave the draft intact with a readable retry message. Parse saved data with an allowlist, valid enums, booleans and bounded finite numbers; malformed/unsupported data falls back safely.

Native select/range controls and native dialog focus handling. Tablist arrow/Home/End navigation. Escape closes the dirty confirmation before the parent; parent close returns focus to the settings opener. Opening the menu prevents clicks through to the scene. No account settings, cloud sync, game pause claim, fabricated hardware diagnostics or game renderer integration.

## Scope and checks

New output-only files in `output/settings-v1/`, local server on 127.0.0.1:4319 with an explicit file allowlist; existing Backpack server/assets unchanged. New Figma design and gameplay-preview frames on existing pages, plus click links from the three approved gameplay settings controls while retaining hover reactions and backpack links.

Tests first for normalization, dirty comparison and category reset. Browser checks for all controls, draft switching, saving/reload, discard/continue, storage failure, reset scope, keyboard/focus, mute, reduced motion and desktop/mobile/large-text layouts. Inspect renders, run Impeccable detector, read back Figma links and compare approved HUD/icon pixels. No app gates, dependency changes, SQL, commit/push/deployment.

## Research honesty

The prior Arcana/Genshin inventory study is retained in `output/imagegen/world-ui-research-v2/RESEARCH.md`. This session attempted current Settings references on Genshin Wiki, PCGamingWiki and Game UI Database; each returned a Cloudflare security page. Google returned 429 and Bing image results were unrelated. No challenge was bypassed, no current Settings screenshot was obtained, and no latest-client/pixel-fidelity claim is made. The proposal follows the owner's requested genre/style, general game-interface knowledge and the approved Arcana visual evidence. No third-party screenshot is shipped as a UI asset.

## Delivered proposal — 2026-11-11

Four working local categories at `http://127.0.0.1:4319/?tab=graphics`. Figma UI Design roots: graphics `70:9180`, audio `70:9232`, controls `70:9286`, accessibility `70:9344`. Preview roots: `72:9407`, `72:9675`, `72:9945`, `72:10219`. Three existing gear controls now open the graphics screen while preserving the prior hover action. Preview tabs and close/outside navigation are wired.

Validation: 5 model tests, 70 browser assertions, 47 Figma readback assertions and 10 local HTTP checks passed. Detector returned exit 0 / empty findings. Desktop and mobile renders reviewed; compact footer save-status placement and 11px minimum compact nav labels corrected. Approved HUD and action icon exports remain pixel-identical. Single-agent self-review completed; no app integration or production gates claimed.

Figma text and control shapes are editable; frame surfaces and glyph images are raster layers with CSS/SVG sources retained. Handoff: `output/settings-v1-handoff.md`; evidence/hashes: `output/settings-v1/validation.json`; final exports: `output/settings-v1-final/`. Settings v1 is a delivered proposal awaiting owner feedback. Backpack v5 remains the approved inventory design.
