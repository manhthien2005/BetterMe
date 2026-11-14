# Reading Quest — Xưởng Đèn Lồng

2026-11-11. Owner requested an HTML design after the educational-gameplay
research. This is a playable desktop prototype for feedback, not an accepted
gameplay design or integration into `/world`.

## Open and play

- URL: `http://127.0.0.1:3023`.
- Self-contained file: `output/prototypes/lantern-workshop/index.html`.
- Start server: `node output/prototypes/lantern-workshop/serve.mjs`.
  Loopback only; no authentication, private data or filesystem routes exposed.
  Running exec session at delivery: 89529. Availability depends on that process.
- The HTML also works directly through `file://`; no external library, font,
  network asset or backend required. Browser storage may vary by file origin.

Read the client's request on the left. Select an ingredient on the right and
read its English behavior note (optional Vietnamese translation). Grind a dry
portion, add it, or boil the mixture. Each batch holds four portions; repeats
are allowed. Drag-to-add is optional; all actions have click/keyboard controls.
Observe the light, temperature, lifetime and smoke. Deliver when all conditions
match; the story advances and the recipe is recorded. Undo/new batch, notebook
replay and confirmed reset are available. Three clients unlock sequentially.

## What the sample demonstrates

- An wants a warm clear light; Khoa wants a bright cool light; Minh wants a
  soft warm long-lasting light. Different constraints reuse the same system.
- Six ingredient rules combine rather than checking one predetermined recipe.
  Heat can destroy moonseed's light; amber retains light after cooling; spores
  react to current temperature; resin trades brightness for duration.
- At least two tested solutions per request. Four recipes per client can be
  retained; additional successful deliveries still work without replacing them.
- Discoveries persist separately from the current experiment. No timer, quiz
  gate, streak penalty, comparison or connection to the app's pet economy.
- English facts inform decisions; learning transfer and player engagement have
  not been established by QA. Gameplay must still be evaluated by the owner.

## Design and scope

One desktop workbench with a central lantern whose light/liquid/smoke reflect
the simulation, a client letter and an ingredient notebook. Moss-green, ivory,
warm brass and Cambria extend the prior academy desk prototype. Geometric SVG
lantern and ingredient glyphs are interactive vector assets, not replacements
for accepted 3D character art. No mobile QA or new visual-system documents.

Plan and exact rules: `docs/superpowers/plans/2026-11-11-lantern-workshop-html.md`.
Research: `docs/research/2026-11-11-educational-gameplay-references.md`.

## Verification evidence

- RED: `node --test output/prototypes/lantern-workshop/logic.test.mjs` initially
  reported 0 passed / 7 failed against a placeholder engine, including the
  expected `0 !== 3` ground-moon assertion. GREEN after implementation: **7/7
  passed**, exit 0. Tests execute the actual HTML's pure engine via Node VM.
- `pnpm browser run-code --filename=output/prototypes/lantern-workshop/qa.txt --raw`
  returned **LANTERN_WORKSHOP_GAMEPLAY_PASS**: six recipes, three deliveries,
  keyboard, drag/drop, undo, reload, notebook, capacity, confirmations,
  corrupt/blocked storage; 1440×900 and 1280×800; **0 console/page errors**.
- `pnpm browser run-code --filename=output/prototypes/lantern-workshop/final-qa.txt --raw`
  returned **LANTERN_WORKSHOP_FINAL_PASS**: notebook replay, confirmed reset,
  external invalid drag rejection, standalone `file://` play, final screenshot.
- Compact JPGs in the prototype folder: `final-desktop.jpg`, `an-ready.jpg`,
  `desktop-1280.jpg`, `three-deliveries.jpg`, `recipe-book.jpg`. At 1280×800
  the footer can require vertical scrolling; no horizontal overflow, and the
  main interaction controls remain reachable. No claim about physical devices.
- The single Impeccable detector pass flagged a radial halo and an SVG-shape
  advisory. Self-review retained these as intentional functional geometry:
  the halo is zero when there is no light and varies with actual brightness;
  the lantern is a dynamic vessel with liquid level, heat and smoke states.
- Separate self-review found inherited disabled-button opacity dimming a full
  lantern independently of its light value. Reproduced at opacity 0.45, fixed
  locally to 1, and checked in the browser regression. External drag IDs now
  require own dictionary keys. No reviewer agent per owner's instruction.

Only isolated prototype artifacts and documentation changed in this task.
No app-wide build/test, commit, push or deployment. Existing character and
other worktree changes preserved. Browser QA session closed after checks;
the app-browser open request was queued for the owner.
