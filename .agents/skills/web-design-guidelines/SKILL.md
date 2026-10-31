---
name: web-design-guidelines
description: Use when reviewing web UI for accessibility, keyboard and focus behavior, forms, responsive layout, motion, or interface quality. Use Impeccable for visual direction and implementation.
---

# Web interface review

Read the repository's `AGENTS.md`, the task's relevant UI spec, and the selected
source files. Load [the pinned guidelines](references/guidelines.md) for this
review; do not fetch newer remote instructions as part of a normal review.

Apply the guidelines as review criteria in the context of the approved product:

- Preserve Vietnamese copy and its natural sentence case. English title case,
  English pronoun rules and ampersands are not requirements for Vietnamese UI.
- A native button already supplies keyboard activation; do not duplicate it with
  key handlers. Inspect custom widgets and actual keyboard/focus behavior.
- URL state, virtualization, uncontrolled inputs and additional packages need a
  demonstrated use case; they are not automatic fixes for every `useState` or list.
- Use the existing tokens and UI primitives. A generic recommendation cannot
  replace an approved product behavior or design decision.

For each actionable finding, give the file and line, user-visible consequence,
priority and smallest suitable correction. Keep unrelated suggestions separate.
Distinguish source inspection from behavior verified in a real browser; use the
repo's Playwright workflow when interaction or visual evidence is needed.

Upstream snapshot and adaptations: `docs/agent-skills.md`. The upstream MIT notice
is retained in `LICENSE` beside this file.
