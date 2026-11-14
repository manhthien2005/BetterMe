# Arcana Academy — Backpack visual proposal

Status: Current revision is **v5 / equipment around the player**, specified at the end of this document. V5 preserves the approved four-tab architecture, restores six equipment slots and clarifies the right-aligned occupancy label. This remains a visual proposal and local interactive prototype, not an integrated game inventory/economy contract. Existing AGENTS.md invariants still apply.

## Initial v1/v2 purpose and composition (superseded by v3)

The owner wants an education-game backpack with the character always on the left, clothing equipment slots and quick outfit sets, and inventory slots on the right. Three tabs: Vật phẩm, Trang phục, Thực phẩm. Example inventory includes clothing, food for the pet, carried water, stamina food and tickets representing XP or gold. The owner authorized illustrative items and values for visual evaluation only. Do not add rarity, gacha, purchase flows, capacity penalties, decay or product economy rules.

Reuse the approved cream/indigo/bronze Arcana HUD, Spectral + Be Vietnam Pro typography, sharp 9-degree details and the approved white academic-backpack/settings icons. Approved player HUD remains unchanged. Character preview reuses the existing Minh An portrait asset; no newly generated character or live 3D try-on is claimed.

## Proposed screen

- Desktop modal panel 1120 × 760 over the existing 1920 × 1080 gameplay capture. Character panel about 340 px; inventory region about 680 px.
- Character identity + six equipment positions: head, top, outerwear, bottom, shoes, accessory. Three named quick-set choices: Đến lớp, Dạo vườn, Khám phá.
- Inventory grid: 24 visible slots, 6 columns × 4 rows; 104 × 82 px cells with 12 px gaps. This is display density, not storage capacity. Duplicate consumables stack and show quantities. Empty slots remain quiet.
- Three tabs, one selected-item information strip below the grid. Item name, class, short description and appropriate sample action: Mặc thử, Dùng 1, or Xem. Illustrative water/food values do not establish health advice or gameplay rates.
- One clear selected outline plus a corner marker; selection is not color-only. Fixed character region and stable grid prevent layout jumps across categories.
- Detail and labels use readable 14–18 px type; title uses Spectral. Magical accents concentrated on corners, portrait and selection, not every cell.

## Prototype scope

Three native Figma screens for the three tabs. Tab clicks switch between them; close returns to the gameplay frame, and the existing backpack button opens the inventory. Sample item selection and quick-set changes may be demonstrated without asserting persistence or actual item consumption. Clearly name prototype-only outcomes in handoff.

## Research and rationale

- Atelier Yumia official manual, Main Menu: https://www.gamecity.ne.jp/manual/3Tr5Fw2Y/en/8100.html — separates equipment and owned-item inspection. Borrow grouping, not combat stats, capacity limits or controls.
- Xbox Accessibility Guideline 112: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112 — predictable navigation, logical grid focus and consistent interaction prompts. A Figma prototype is not proof of keyboard/controller implementation.
- Existing saved Infinity Nikki wardrobe reference is a visual example of character-left/item-right composition; no claim about its behavior from a screenshot.
- 24 slots is a proposal specific to this panel's width and readable item size, not a universal UX optimum. For narrower screens prefer 5 × 4 or reflow, rather than shrinking every slot and label.

## Execution and checks

1. Remove superseded action-icon nodes, retaining approved masters and current copies.
2. Create reusable slot/tab/equipment primitives in Design Component.
3. Build native Figma composition in UI Design; create three gameplay previews using the same backdrop and approved HUD.
4. Inspect screenshots for hierarchy, Vietnamese text, clipping, cell counts and selection; inspect prototype destinations and verify approved HUD pixels.
5. Save small screenshots and handoff; no app source changes, database changes, deploy, commit or push.

## Cleanup evidence

Deleted 49 explicitly identified superseded icon roots from masters, samples, previews and the icon archive. Current Cài đặt and Túi đồ masters are unique. The approved icon-board export is visually unchanged after cleanup. Prior player-HUD comparisons are unrelated to rejected icons and retained.

## Delivered v1 design and self-review (superseded by v2 below)

Three 1120 × 760 panels are complete on UI Design: Trang phục `35:2269`, Vật phẩm `35:2572`, Thực phẩm `35:2830`. Three corresponding 1920 × 1080 gameplay previews are on Preview: Trang phục `37:3274`, Vật phẩm `37:3678`, Thực phẩm `37:4057`. The original gameplay frame is `8:266`; its backpack control opens Vật phẩm, including from both existing hover screens. Preview tabs navigate among the three screens; close and the shaded outside area return to gameplay. The active tab has no redundant navigation.

The Design Component page holds 16 editable item components on board `35:2219` and reusable slot/tab primitives on `35:2528`. The screens use synchronized vector clones because this MCP exposes no instance-creation tool; they are not linked instances.

MCP inspection confirmed 24 slots, six equipment positions and three outfit presets in each panel. All 15 configured click destinations passed readback checks. Rendered exports were visually reviewed for Vietnamese text, spacing, selection visibility and gameplay placement. Python/Pillow comparison printed `HUD pixel identical: True` and `Approved icons pixel identical: True`; the approved player HUD and final action-icon board remain pixel-identical to the earlier exports. Screenshot exports completed successfully. Evidence and node mappings are in `output/backpack-figma-validation.json`.

Scope limits: live presentation clicks were not exercised in this pass; verification covers reaction configuration and rendered screens. Individual item selection, quick outfit changes and the use/view buttons remain visual samples. The character is the approved bust portrait, not a full-body preview or working try-on. No keyboard shortcut is claimed; the close label reads “Đóng”. No application/economy code was changed for this design task, so application gates were not run. No commit, push or deployment was performed.

Final exports: `output/playwright/backpack-{clothing,items,food}-final.png` and gameplay previews `backpack-world-clothing-final.png`, `backpack-world-items.png`, `backpack-world-food.png` in the same folder.

## V2 refinement — previous visual proposal, 11 November 2026

The owner rejected v1 as too basic and requested more game-specific craft and suitable item art. V2 retains the approved composition, palette and typography, and introduces an indigo character bookplate, engraved corners, dimensional inventory trays, licensed painted item illustrations, category glyphs, an explicit equipped label separate from selection, and six slot-state components.

Current editable panels on UI Design: Trang phục `37:4454`, Vật phẩm `42:4705`, Thực phẩm `42:4911`. Existing Preview roots are retained (`37:3274`, `37:3678`, `37:4057`) with replacement panel children `42:5334`, `42:5542`, `42:5749`. V1 panels are stored in hidden archive `42:5965`; superseded v1 asset boards are hidden. Approved player-HUD and action-icon masters remain unchanged.

Design Component has 22 item-art components on board `37:4455` and six native slot-state components on board `42:5278`. Item artwork is raster; frames, ornaments and Vietnamese text remain editable. Instance creation is not exposed by this MCP, so screens use clones and do not claim automatic propagation from components. The existing portrait remains a bust; no full-body avatar, live equipment or economy implementation is included.

The v2 research selected Ravenmore, CraftPix, LudicArts and Glitch assets after inspecting source pages and licenses. Attribution, modifications, source links and exclusions are recorded in `output/backpack-v2-final/ASSET-CREDITS.md`. Asset alpha and optical bounds were checked; an empty bread SVG was replaced before delivery. Illustrative outfit names/quantities and consumables remain samples, with no rarity or capacity rules.

Separate self-review: exported all three panels, their gameplay previews and state board. `python output/verify-backpack-v2.py` passed: 15/15 click destinations, six compositions each with 24 slots/6 equipment slots/3 presets/3 tabs, pixel-identical approved HUD and icon board, unchanged gameplay outside the inventory/shadow area, seven text pairs above 4.5:1 (minimum 6.18:1), and 22 nonblank transparent item PNGs below 100 KB each. Reaction readback was tested; live Figma presentation clicks, keyboard input and actual item actions were not exercised. No app source changed or app gates were run; no commit, push or deploy.

Current exports are in `output/backpack-v2-final/`, with compact JPGs for viewing and full PNGs for inspection. Current node mappings and check results are in `output/backpack-v2-validation.json`. Start continuation from `output/backpack-v2-handoff.md`, without loading full chat history or document trees.

## V3 / Cá nhân — owner-directed behavior retained in v4

The owner approved v2 provisionally, then requested cut-corner/arcane/technical border craft and a change to the backpack's information architecture. Vật phẩm, Trang phục and Thực phẩm now contain inventory only, with no character column. A fourth tab, **Cá nhân**, expands the panel to show a full-body player model at left and outfit inventory at right. No player name, title or level appears inside any backpack panel. Cá nhân shows the currently worn set, three quick outfit choices, and labeled stamina/water bars. The existing gameplay HUD outside the modal is unchanged.

The three inventory-only panels are 856 px wide; Cá nhân is 1216 px wide. Each retains 24 visible slots; narrow browser views reflow to four columns. Cut-corner frame plates, chamfered controls and restrained arcane linework keep the established cream/indigo/bronze identity. Decorative frame source masters are SVGs in `output/backpack-v3/`; their Figma fills are raster imports, with separate editable text, slots, meter bars and control layers.

Actual player model: existing `public/models/characters/scholar-vrm1.vrm`, loaded through `src/lib/world/vrm-loader.ts` with the existing Three/VRM packages. The local preview renders and rotates the full-body VRM, supports dragging/buttons/keyboard rotation, and stops rendering when the character tab is hidden or the dialog closes. Figma holds a still captured from this renderer and links to the live local preview; it does not claim to host interactive 3D. The old bust portrait is absent.

The project currently contains one clothing mesh. The three quick-set buttons demonstrate colorway presets on that mesh and update the worn-set label; they do not replace garment meshes with the illustrated cloaks. Stamina `80/100`, water `6/8`, item names and quantities are visual samples with no persistence or economy effects. Clothing inventory selection shows details only. Full outfit mesh integration and authoritative game state remain future work.

Current UI Design roots: items `49:6029`, clothing `49:6031`, food `49:6033`, personal `49:6035`. Preview roots: items `37:3678`, clothing `37:3274`, food `37:4057`, personal `51:6789`. V2 masters are hidden in archive `51:7193`. Complete mappings are in `output/backpack-v3/validation.json`.

Verification: `pnpm browser run-code --filename=output/backpack-v3/check-preview.js` passed 30 assertions at 1440×1000 and 390×844, including real VRM readiness, rotation, changed rendered pixels on a colorway switch, tab visibility/render suspension, item selection, Escape/focus return and no horizontal overflow. Reduced-motion was enabled for captures. Impeccable detector finished with exit 0 and no findings after text-size/background fixes. MCP readback passed 35 navigation targets and eight live-preview links; live Figma presentation clicks were not exercised. `python output/backpack-v3/verify-artifacts.py` verifies the saved contract, pixel-identical approved HUD/icons, nonblank full-body capture, server allowlist and compact exports.

The local visual preview is at `http://127.0.0.1:4318/?tab=personal`, served by `node output/backpack-v3/serve.cjs`. It binds loopback only, serves an explicit file allowlist and has no authentication or persistence. It is not a deployment. Existing dirty application source was not edited; no application gates, commit, push or database changes were performed for this output-only design task.

## V4 / refinement — current visual revision, 11 November 2026

The owner approved v3's direction and asked for a skill-led brainstorm and a more beautiful interface. The short exploration in `output/backpack-v4-plan.md` compared technical framing, ornate fantasy framing and refinement of the existing academy identity. The chosen refinement concentrates craft on cut corners, fine bronze engraving, warmer surfaces and the selected item. Empty cells and inactive tabs recede; the 24-slot inventory, four tabs and Personal-only character remain unchanged.

Inventory-only compositions are now 864 × 785; Personal is 1216 × 843. Occupied slots have softly lit recessed surfaces, a selected corner motif and an explicit check. Quantity badges appear only on stacks above one and use `×N`. Hover never selects an item. Keyboard focus has a distinct 3 px ivory outline, measured at 12.54:1 against the indigo tray. The header and tabs stay reachable while content scrolls on small or low-height viewports.

The real VRM stands on a low 3D plinth with contact shadow. Three quick-set thumbnails are captured from the actual renderer, and exactly one worn marker follows the chosen preset. A failed model load exposes “Thử lại”. Reduced motion freezes idle hair/cloth physics while deliberate rotation and colorway changes still work. There is still one garment mesh: these presets change material colors, not garment geometry. Inventory illustrations, meter values and item quantities remain samples.

Current UI Design roots: items `56:7194`, clothing `58:7301`, food `58:7397`, personal `58:7506`. Preview roots stay `37:3678`, `37:3274`, `37:4057`, `51:6789`; their current panel children are recorded in `output/backpack-v4/validation.json`. Five reusable slot-state components live on Design Component board `58:7639`. V3 masters and replaced Preview panels are retained in hidden archive `58:7671`. Approved HUD/icon masters and item-art board remain unchanged.

Figma compositions contain separate text, cell geometry, art, meter bars and control layers. Decorative material skins and glyphs are raster layers with CSS/SVG sources retained. The meter fills are editable solid approximations of the browser gradients. Screens use clones, not linked instances, because instance creation is not exposed by this MCP. The Figma character is a renderer-captured still; its character and preset hotspots link to the working local 3D preview.

Separate single-agent self-review inspected rendered browser/Figma panels, gameplay context and the state board. Evidence: `check-preview.js` passed 30 interaction assertions; `check-polish.js` passed 36 assertions across 1440×900, 1024×768, 768×1024 and 390×844; `capture-focus.js` confirmed actual `:focus-visible`, ivory color and 3 px width. Impeccable detector returned exit 0 and `[]`. Figma readback passed 35/35 navigation targets and 8/8 local 3D links; all eight design/preview compositions have four tabs, 24 cells and no identity text. `python output/backpack-v4/verify-artifacts.py` passed approved-HUD/icon pixel equality, avatar/thumbnail checks, server allowlist and artifact hashes. Live Figma presentation clicks were not exercised.

Final exports and concise handoff: `output/backpack-v4-final/` and `output/backpack-v4-handoff.md`. Local preview URL and server command remain the same as v3. Output-only work: no production app integration, persistence, new dependencies, schema changes, application gates, commit, push or deployment. Item/model/font licenses are preserved in the final README and the v2 asset credits.

### V4 copy/icon cleanup — latest owner adjustment

Removed “Chọn vật phẩm để xem chi tiết”, “Hành trang của bạn”, “Chọn đồ để xem chi tiết” and the redundant “1 / 1” footer. The food tab now uses the installed Lucide Drumstick glyph with the same stroke/size as neighboring icons. All four panels use an occupied-visible-cell label: Vật phẩm `9/24 ô`, Trang phục `8/24 ô`, Thực phẩm `7/24 ô`, Cá nhân `8/24 ô`. A stack counts as one occupied cell; this introduces no storage penalty or game capacity rule. The accessible label clarifies that the denominator is the displayed grid.

Removing the footer reduces inventory-only panels to 864 × 755 and Personal to 1216 × 838.5. Eight existing Figma compositions were updated in place, retaining panel/tab/reaction IDs. Current exports in `output/backpack-v4-final/` were refreshed; pre-cleanup copies and focused evidence live in `output/backpack-v4-cleanup/`. `pnpm browser run-code --filename=output/backpack-v4-cleanup/check.js` passed 26 assertions; all eight Figma compositions passed copy/count/icon/24-cell readback. Impeccable returned exit 0 and `[]`. The artifact verifier passed with the new dimensions. Earlier full VRM interaction tests remain recorded as prior evidence, not claimed as rerun for this small edit.

## V5 / equipment around the player — current

The owner requested right alignment and clearer wording for occupied cells, and restored equipment positions around the player for changing clothing. Counters now read `N/24 ô đã dùng`, aligned to the right edge above the grid. They count all occupied cells in the category even while an equipment filter is active; a stack counts once. The denominator remains a visual-prototype grid size, with no capacity penalty or new economy rule.

Personal has six slots, three on either side of the real player: head, top, outerwear, accessory, bottom and feet. A check denotes currently worn equipment; a separate active outline denotes the selected category. Clicking a slot filters inventory. The filter is clearable and resets when switching tabs. Empty head inventory keeps the 24-cell grid and shows “Chưa có đồ cho vị trí này”. Selecting an inventory item shows details; it does not equip automatically.

The existing VRM has top, bottom and shoe material groups. Three top colorway samples plus the current shorts and shoes are now represented alongside the previous eight illustrated items, so clothing/Personal show `13/24 ô đã dùng`; items show `9/24`, food `7/24`. Only the three top colorways support “Mặc thử”, which changes actual rendered model pixels and updates the worn slot and quick preset. The current shorts/shoes show “Đang mặc”. Illustrated cloaks, ring and boots have no fitted model: their action is disabled and reads “Chưa có bản mặc thử”. There is no garment mesh replacement, undressing, persistence or fabricated equipped state for unavailable assets.

Live preview stays at `http://127.0.0.1:4318/?tab=personal`; `&slot=top` (or another valid slot key) opens its filtered inventory. Figma remains a still-based composition with links to the interactive preview. Current UI Design roots: items `60:8176`, clothing `60:8280`, food `62:8385`, Personal `62:8491`. Preview roots remain unchanged; their new panel children and 12 equipment hotspots are mapped in `output/backpack-v5/validation.json`. V4 masters are retained in hidden archive `62:8650`. Approved external HUD/icons remain unchanged.

Verification: the focused equipment check first failed because slots were absent, then passed **51 assertions** after implementation. `check-regression.js` passed **30 assertions** for the existing VRM interactions. Viewports include 1440, 1024, 768, 390 and 320 px widths. Figma readback passed **35 navigation links and 20 live-preview links**, with six equipment positions only in Personal and right-aligned counters in all eight compositions. Impeccable returned exit 0 and `[]`. Rendered browser/Figma screens were visually inspected. `verify-artifacts.py` checks saved evidence, approved-asset pixel equality and source/export hashes. Live Figma presentation clicks were not exercised.

Current handoff: `output/backpack-v5-handoff.md`; final compact images: `output/backpack-v5-final/`. Standalone preview sources remain in `output/backpack-v3/` to keep the local URL. No production app/dependency/database changes, application gates, commit, push or deployment.
