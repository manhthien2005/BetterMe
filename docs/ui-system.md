# BetterMe UI System

## Visual direction

BetterMe should feel like a tidy desk that happens to understand habits: warm, focused, personal, and gently playful. It avoids spreadsheet density, productivity-dashboard aggression, glassmorphism overload, and reward mechanics that shame missed days. Information hierarchy is card-based and responsive, with one obvious action per region and calm whitespace around reflection content.

## Token strategy

Theme data has two layers:

1. **Raw tokens** are theme-owned values: named color ramps, font families, spacing scale, radii, shadows, and motion durations/easing.
2. **Semantic tokens** map product meaning to raw tokens: background, surface, text, border, focus, status, card frame, icon treatment, toast variants, chart series, and interaction states.

`ThemeDefinition` contains both layers. A theme compiler/provider resolves semantic references into CSS variables such as `--color-surface`, `--color-status-good`, `--card-shadow`, `--chart-series-1`, and `--motion-fast`. Components may consume only semantic variables or semantic utility aliases; raw color names and literal theme values are forbidden in component files.

Spacing and layout tokens may remain globally stable while a theme changes their semantic use. The token names reserve a future `mode` axis so dark variants can remap semantic values without changing components; Phase 1 ships only light definitions.

## Full theme contract

Every `ThemeDefinition` must provide:

- Identity: stable `ThemeId`, display name, and light mode.
- Colors: page/background, elevated and sunken surfaces, primary/accent, text levels, border, focus, disabled, selection, and Good/Okay/Bad/Planned states.
- Typography: body/display/mono families, heading/body/label styles, weights, sizes, line heights, and tracking.
- Radius: control, card, panel, pill, and illustration radii.
- Card frame: border width/style, shadow token, optional inset/highlight treatment, and frame personality (`soft`, `notebook`, `crisp`, or `quiet`).
- Icon style: line/filled/duotone intent, stroke width, container shape, and decorative treatment.
- Illustration style: subject vocabulary, line/shape treatment, density, and empty-state composition.
- Background treatment: solid/gradient/pattern strategy, pattern scale, opacity, and surface contrast.
- Motion/effects: fast/normal/slow durations, easing, hover lift, press scale, reveal behavior, and reduced-motion fallback.
- Toast styling: surface, text, border, shadow, icon container, success/info/warning/error accents, radius, and entrance behavior.
- Chart styling: grid, axes, tooltip, cursor, line/bar treatment, point shape, series colors, status colors, and empty-chart presentation.
- Empty states: illustration key, title/body tone, action style, frame treatment, and density.
- Micro-interactions: checkbox completion, streak emphasis, card hover, selection, save confirmation, and theme-switch feedback.

The TypeScript source of truth for this contract is `ThemeDefinition` and its supporting interfaces in `src/types/index.ts`.

## Initial themes

### Cute Cat

- Palette direction: cream and blush surfaces, cocoa text, berry accent, mint Good, honey Okay, coral Bad, and soft lavender Planned.
- Typography: rounded friendly display face with highly readable neutral body text.
- Geometry/frame: generous radii, soft outlined cards, tiny paw/cat-ear frame details only at decorative edges.
- Icons/illustrations: rounded line icons, expressive cat study moments, low-detail stickers, and paw-shaped chart points where accessibility is unaffected.
- Background/effects: faint paw/star pattern, gentle spring on completion, small celebratory tail-swish effect for a new streak milestone.
- Toast/chart/empty: speech-bubble toasts, rounded bars and tooltip, cat-at-desk empty states. Never rely on cuteness instead of labels.

### Study Corner

- Palette direction: warm paper, ink navy, desk-wood brown, highlighter yellow, bookmark coral, and leafy green.
- Typography: bookish display serif paired with a clean sans body; monospace only for dates or compact metrics.
- Geometry/frame: notebook cards, subtle ruled or grid details, medium radii, clipped-note accents.
- Icons/illustrations: hand-drawn line style, books, lamp, pencil, clock, and desk objects.
- Background/effects: quiet paper texture/grid using CSS, page-tab selection, short highlighter sweep on completion.
- Toast/chart/empty: sticky-note toasts, ink-like chart lines, notebook-grid chart area, empty desk/page illustrations.

### Modern Focus

- Palette direction: cool neutral background, white/graphite surfaces, electric teal primary, blue-violet accent, restrained semantic statuses.
- Typography: geometric sans for display and body, tight metric labels, strong numerical hierarchy.
- Geometry/frame: crisp medium-small radii, thin borders, controlled elevation, no ornamental frame details.
- Icons/illustrations: precise Lucide-style line icons and abstract geometric illustrations.
- Background/effects: subtle radial gradient, fast fades/slides, clear hover/pressed states, minimal celebration.
- Toast/chart/empty: compact floating toasts, sharp chart grid and clean points/bars, geometric empty states.

### Minimal Calm

- Palette direction: warm off-white, stone surfaces, charcoal text, sage primary, dusty blue accent, muted but contrast-safe statuses.
- Typography: humanist sans with relaxed line height and understated headings.
- Geometry/frame: quiet large surfaces, very subtle border/shadow, moderate radius, minimal nesting.
- Icons/illustrations: thin calm line icons, sparse botanical/sky shapes, ample negative space.
- Background/effects: near-solid background with one low-opacity wash, slow opacity transitions, no hover lift by default.
- Toast/chart/empty: inline-feeling low-elevation toasts, soft chart grid/area, contemplative empty-state copy and simple horizon/leaf illustration.

## Component behavior and layout

- Desktop uses a persistent compact navigation rail/header and a responsive content grid; mobile uses a clear top bar and reachable route navigation.
- Dashboard metrics are cards, not cells. The weekly quest board may use a seven-day matrix on wide screens but becomes day-focused cards or a horizontally scrollable, labeled grid on narrow screens.
- Selected date is always visible in text. “Today,” selected day, planned day, and pre-start day have distinct labels in addition to color.
- Reflection fields use calm progressive disclosure: short previews on overview surfaces, full labeled editors in selected-day contexts.
- Destructive reset is isolated in settings, requires confirmation, and is not styled like a primary action.

## Toast theming

All feedback goes through `ThemedToaster`; feature code emits semantic intents (`success`, `info`, `warning`, `error`) and concise copy. The wrapper maps intent to theme tokens for surface, border, icon container, typography, radius, shadow, and motion. Storage failures persist until dismissed/retried; success toasts are brief and non-blocking. Toasts use a polite live region by default and an assertive mode only for data-loss risk.

## Chart theming

Pure transforms output semantic `colorToken` references, never hex/HSL values. Renderers resolve chart background, grid, axes, tooltip, cursor, line/bar, point, and status colors through semantic CSS variables. Cute Cat may alter point/container shape, Study Corner may use a paper-like grid, Modern Focus may emphasize crisp lines, and Minimal Calm may reduce grid contrast, but axis labels, tooltips, keyboard summaries, and data meaning remain consistent.

Every chart has a nearby textual summary and an accessible data-table alternative or equivalent list. Color is never the only series/status differentiator; labels, shapes, patterns, or direct annotations are used as needed.

## Motion and effects

- Motion communicates change: checkbox completion, selected-date movement, save state, route/content reveal, toast arrival, and streak milestone.
- Default durations stay within roughly 100–300 ms; decorative milestone motion may reach 500 ms but cannot block interaction.
- Press feedback never shrinks controls below their hit target.
- `prefers-reduced-motion: reduce` removes transforms, parallax, looping decoration, and chart drawing; state changes remain visible through color/border/text.
- No auto-playing or continuously moving decorative scene is permitted.

## Accessibility

- All functionality is keyboard reachable in a logical order. Weekly-grid arrow-key navigation is planned in addition to Tab; Space toggles a habit and Enter opens selected-day detail.
- Every interactive control has a visible label or accessible name. Icon-only buttons include descriptive names and tooltips that are not the sole labeling mechanism.
- Focus uses a theme-aware, high-contrast ring with offset and is never removed. Selected and focused states remain visually distinct.
- Text and essential icons meet WCAG 2.2 AA contrast: 4.5:1 for normal text, 3:1 for large text and UI boundaries. Theme validation includes contrast checks for all semantic foreground/background pairs.
- Touch targets are at least 44 by 44 CSS pixels where controls stand alone.
- Status always includes text or icon-plus-label; Good/Okay/Bad/Planned cannot be inferred only from green/yellow/red/gray.
- Forms associate labels, descriptions, errors, and limits programmatically. Validation does not clear user input.
- Calendar and week controls announce the selected date and updated score/status through restrained live regions.
- Charts provide textual summaries and non-visual access to values.
- Theme selection does not change information architecture or control placement, preventing a personalization choice from becoming a usability penalty.
