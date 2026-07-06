# BetterMe UI System

## Visual direction

BetterMe should feel like a tidy desk that happens to understand habits: warm, focused, personal, modern, spacious, and gently playful. The approved dashboard direction is a Playful Soft-Bento Productivity Dashboard with soft card surfaces, subtle borders, restrained shadows, large friendly radii, friendly typography, pastel accents, purposeful illustrations, and calm whitespace. It avoids spreadsheet density, dense admin dashboards, childish styling, excessive gradients, heavy neumorphism, excessive glassmorphism, hardcoded theme colors, distracting decoration, and reward mechanics that shame missed days.

## Dashboard Bento contract

The dashboard uses a 12-column Bento grid and keeps the same information architecture in every theme.

Desktop allocation:

- Greeting Hero + Streak: 12 columns.
- Calendar: 4 columns.
- Today's Habits: 5 columns.
- Personal Widgets: 3 columns.
- Upcoming Events: 4 columns, directly below Calendar.
- Analytics: 8 columns.

Tablet uses an intentional two-column layout. Personal Widgets may become a full-width horizontal row. Mobile uses full-width cards in this order: Greeting Hero + Streak, Today's Habits, Calendar, Upcoming Events, Personal Widgets, Analytics. Mobile widgets may scroll horizontally, analytics may simplify its density, and the dashboard must not create horizontal page overflow.

The Greeting Hero is the emotional hook. It shows contextual greeting, current date, a short motivational message, current streak, best streak, seven-day streak chain or weekly completion indicator, and one contextual streak-protection message. Themes may change illustration, decoration, typography, and motion character, but not the hero's information hierarchy.

Today's Habits is the primary interaction area and remains visually central on desktop and first after the hero on mobile. Habit items are soft interactive list items with icon, name, lightweight category or schedule metadata, completion control, immediate feedback, completed/total count, daily progress, add habit action, and open full tracker action. They must not render as spreadsheet rows and must not prominently expose score weights.

The Calendar communicates daily completion with both semantic status color and proportional fill amount, such as a progress ring or `conic-gradient`. Calendar cells are circular or softly rounded, do not show percentages inside every date, and distinguish empty, partial, complete, Good/Okay/Bad, future, no-data, today, focused, and selected states. Hover, focus, or selection may reveal date, completed habits, total habits, completion percentage, and daily status. The card also includes a concise monthly summary.

Personal Widgets use a reusable widget model rather than hardcoding Weather and Spotify into the dashboard. Weather stays concise for daily planning. Spotify is a compact focus-music controller, not a full music application. Widget UI covers disconnected, loading, permission-denied, unavailable, and error states, with future slots for Pomodoro, Google Calendar, focus timer, sleep summary, water tracking, countdown, and quick notes.

Upcoming Events shows the nearest 3-5 events from the current time by default. When a calendar date is selected, it may switch to that date and must clearly label the active date context. The UI supports internal BetterMe events in Phase 1 and a future Google Calendar source without changing the event component contract.

Analytics is a wide Bento section with summary metrics, a 7D/30D/90D completion trend chart, and habit performance. It includes average completion rate, change from previous period, Good days, total completed habits, most consistent habit, and habit needing attention. It does not duplicate streak metrics from the Greeting Hero.

## Token strategy

Theme data has two layers:

1. **Raw tokens** are theme-owned values: named color ramps, font families, spacing scale, radii, shadows, and motion durations/easing.
2. **Semantic tokens** map product meaning to raw tokens: application background, surfaces, elevated surfaces, text hierarchy, borders, shadows, accent colors, Good/Okay/Bad/Planned states, focus rings, calendar empty/fill states, chart colors, widget states, toast states, radius, spacing, typography, motion, card frame, icon treatment, and interaction states.

`ThemeDefinition` contains both layers. A theme compiler/provider resolves semantic references into CSS variables such as `--color-surface`, `--color-surface-elevated`, `--color-status-good`, `--color-calendar-fill`, `--color-widget-surface`, `--color-toast-success-surface`, `--card-shadow`, `--chart-series-1`, and `--motion-fast`. Components may consume only semantic variables or semantic utility aliases; raw color names and literal theme values are forbidden in component files.

Spacing and layout tokens may remain globally stable while a theme changes their semantic use. The token names reserve a future `mode` axis so dark variants can remap semantic values without changing components; Phase 1 ships only light definitions.

## Full theme contract

Every `ThemeDefinition` must provide:

- Identity: stable `ThemeId`, display name, and light mode.
- Colors: page/background, elevated and sunken surfaces, primary/accent, text levels, border, focus, disabled, selection, Good/Okay/Bad/Planned states, calendar empty/fill/selection states, chart surfaces, widget states, and toast intent states.
- Typography: body/display/mono families, heading/body/label styles, weights, sizes, line heights, and tracking.
- Radius: control, card, panel, pill, and illustration radii.
- Card frame: border width/style, shadow token, optional inset/highlight treatment, and frame personality (`soft`, `notebook`, `crisp`, or `quiet`).
- Card variants: only meaningful reusable variants are allowed: `default`, `soft`, `accent`, `illustrated`, `dark`, `compact`, and `interactive`.
- Icon style: line/filled/duotone intent, stroke width, container shape, and decorative treatment.
- Illustration style: subject vocabulary, line/shape treatment, density, and empty-state composition.
- Background treatment: solid/gradient/pattern strategy, pattern scale, opacity, and surface contrast.
- Motion/effects: fast/normal/slow durations, easing, hover lift, press scale, reveal behavior, and reduced-motion fallback.
- Toast styling: surface, text, border, shadow, icon container, success/info/warning/error accents, radius, and entrance behavior.
- Chart styling: grid, axes, tooltip, cursor, line/bar treatment, point shape, series colors, status colors, and empty-chart presentation.
- Widget styling: compact layout, connected/disconnected/permission/error states, icon treatment, control density, and loading skeletons.
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
- Dashboard sections are Bento cards, not table cells. Only interactive elements receive strong hover or elevation feedback. Do not nest UI cards inside other UI cards; repeated habit rows, widgets, and metric summaries may be individual cards only when they are the actual repeated items.
- Selected date is always visible in text. “Today,” selected day, planned day, and pre-start day have distinct labels in addition to color.
- Reflection fields use calm progressive disclosure: short previews on overview surfaces, full labeled editors in selected-day contexts.
- Destructive reset is isolated in settings, requires confirmation, and is not styled like a primary action.

## Toast theming

All feedback goes through `ThemedToaster`; feature code emits semantic intents (`success`, `info`, `warning`, `error`) and concise copy. The wrapper maps intent to theme tokens for surface, border, icon container, typography, radius, shadow, and motion. Storage failures persist until dismissed/retried; success toasts are brief and non-blocking. Toasts use a polite live region by default and an assertive mode only for data-loss risk.

## Chart theming

Pure transforms output semantic `colorToken` references, never hex/HSL values. Renderers resolve chart background, grid, axes, tooltip, cursor, line/bar, point, area fill, and status colors through semantic CSS variables. The dashboard trend chart supports 7D, 30D, and 90D using completion rate by date, restrained grid lines, accessible tooltips, and theme-aware line or area styling. Cute Cat may alter point/container shape, Study Corner may use a paper-like grid, Modern Focus may emphasize crisp lines, and Minimal Calm may reduce grid contrast, but axis labels, tooltips, keyboard summaries, and data meaning remain consistent.

Every chart has a nearby textual summary and an accessible data-table alternative or equivalent list. Color is never the only series/status differentiator; labels, shapes, patterns, or direct annotations are used as needed.

## Motion and effects

- Motion communicates change: checkbox completion, selected-date movement, calendar selection, widget connection state, save state, route/content reveal, toast arrival, and streak milestone.
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
- Calendar and week controls announce the selected date and updated score/status through restrained live regions. Calendar completion is not color-only: the proportional fill, status label, focus ring, and tooltip/selection detail carry the same meaning.
- Charts provide textual summaries and non-visual access to values.
- Theme selection does not change information architecture or control placement, preventing a personalization choice from becoming a usability penalty.
