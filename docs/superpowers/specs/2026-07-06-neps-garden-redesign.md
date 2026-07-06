# Nếp's Garden Redesign — Design Spec

Date: 2026-07-06

## Goal

Redesign the BetterMe dashboard: keep the bento grid, make it soft and cute with real
micro-interactions, fold the app into fewer routes, and bake in retention mechanics
borrowed from the habit apps that survive the 90-day drop-off (Finch, Fabulous, Streaks).

## Retention research → product decisions

- **Missed-day handling predicts survival** (Finch's non-punishing model, ~60% D1
  retention): the UI never says "streak lost". The hero anchors progress to a
  **rolling 7-day rhythm** (`streak.rhythm`) instead of a fragile unbroken chain; the
  copy reframes misses as rest ("Yesterday counts as rest. Today we start soft").
- **Sub-10-second logging**: habits stay one tap; the check pops with a spring
  overshoot, the label gets a crayon strike, everything pressable squishes (`.squishy`).
- **Companion emotional loop** (Finch's pet): **Nếp**, a sticky-rice blob mascot
  ("nếp" = sticky rice + the root of "nề nếp", routine). The sprout on his head IS the
  daily progress meter: asleep → leaf → two leaves → bud → sakura flower at 7/7 with a
  one-shot confetti burst. He jelly-squashes on every check and speaks one gentle line.
- **Easy first win** (Fabulous' tiny-actions coaching): the cheapest unfinished habit
  gets an "✨ easy win" chip.

## Visual system — "Nếp's Garden"

Chosen from a 3-direction parallel design exploration (kawaii companion / cozy study
café / claymorphism); two of three directions independently converged on the
sticky-rice mascot, which decided the signature.

- **Palette (pastels are fills, deep tones carry text):** Rice Paper `#FDF5F1` page,
  Mochi White `#FFFDFC` cards, Plum Ink `#4A3D46` text, Dusk Mauve `#6F6069` secondary,
  Wafer `#F5E6E0` borders, Matcha `#7FB069` / Matcha Deep `#4C7A43`, Sakura `#F6C6CE` /
  Sakura Deep `#B14B66`, Butter `#FFD98E`, Honey `#F2B04C`, Dawn Blue `#A9C6E8` /
  Dawn Deep `#38678F` (weather), Spotify card stays brand-dark.
- **Type:** Baloo 2 (display) + Nunito (body) via `next/font/google`, both with the
  `vietnamese` subset. Inter is gone.
- **Background:** rice-paper base, sakura + matcha mists, rice-grain dot grid
  (`.meadow` replaces `.note-grid`).
- **Cards:** 24px radius, wafer border, warm plum-tinted "set-down mochi" shadow,
  hover lift. Buttons are squishy pills.
- **Signature discipline:** Nếp is the only illustration; every other card stays quiet.
- **Motion:** all animations are CSS keyframes gated behind
  `prefers-reduced-motion: reduce`; Nếp's stage is still readable from the static pose.

## Route reduction

`/tracker`, `/calendar`, `/habits`, `/settings` were "coming soon" placeholders —
deleted along with their test and the header nav. The dashboard is the whole app
(7 routes remain, from 11). Habit management (the old `/habits` promise) now lives in
the dashboard: an inline add-habit form (`addHabitToState`, slugged ids, Vietnamese
diacritics folded) and an edit mode with per-row remove (`removeHabitFromState`).

## Bento layout (xl)

Hero full-width (greeting + metric pills + 7-day beads + Nếp). Below, an 18-column
grid: Calendar (r1, c1–7), Upcoming Events (r2, c1–7), Today's Habits (r1–2, c8–18),
Analytics full-width (r3). Right rail: Weather + Spotify, sticky. Mobile stacks with
Today's Habits first. Explicit `grid-area` placement replaced the old `order-*`
classes, which had been sorting the hero below the grid.

## Kept stable (tests + behavior)

localStorage key/shape `betterme.dashboard.v1`, toggle semantics, calendar donut
mechanism (radial 82% hole + conic fill), all tested strings (weather values, Spotify
URLs, headings, 💪 emoji), Supabase auth flow, dev bypass.

## Verification

`pnpm typecheck` / `lint` / `test` (18/18) / `build` (7 routes) green; screenshots in
`.screenshots/` (desktop, mobile, login) reviewed; adversarial multi-agent review
(correctness / a11y / design-QA) run on the diff before commit.
