# Plaza refinement 2 — academy staircase

Owner approved the researched direction with “Ok. Em tiến hành đi anh xem”.
Implement the academy staircase only, following
`docs/research/2026-11-11-plaza-stair-assets.md`. Preserve the accepted academy
composition and previous ground repair. Existing worktree, single agent,
separate self-review; no commit/push/deploy or model purchase.

Keep the 7 m clear stair surface, 12 m run, Y0→4, two 5 m flights and 2 m
landing at Y2. Warm cream stone, brown timber and muted slate metal caps.
Finish beveled tread edges, restrained slab joints, supported side cheeks
with continuous coping, layered post bases/caps and open timber balustrades.
Main posts at run distances 0, 2.5, 5, 7, 9.5, 12 m on each side. Handrails
follow each flight's continuous incline and the horizontal landing, not the
stepped floor sampler. Keep planting, lamps and all other connectors as they
are. Decorative supports may extend roughly 0.55 m outside the clear stair
surface, within the available gap to existing planters; do not narrow it.

Use current Three.js merged batches, no dependencies or downloaded textures.
Share stair dimensions/rail positions with colliders. Contact surface stays
at the existing sampler except an inward edge bevel <=2 cm; no cap stacked
above the final step. Ensure the expanded trim supports its posts, and the
avatar/camera cannot pass through substantial rail/cheek geometry. Keep
terrain single-valued in XZ. Total study geometry remains <65,000 triangles
and <=7 batches; aim for <=4,000 net added triangles.

Acceptance: near views show bevels, post construction and closed rail joints;
day/dusk/night and mobile view remain readable; all stair lanes work in both
directions; no floating foundations, snag at landing/end or shader failures.
Check actual geometry using raycasts, existing movement tests, real keyboard
navigation and scene lifecycle. Four gates, full Vitest with --maxWorkers=4;
stop verified checkout dev tree before build, restart preview afterward.

## Implemented details and review

Study-only builder adds closed side cheeks, beveled coping, twelve layered
posts with muted metal caps, continuous upper/lower timber rails and open
balusters. Main tread profiles have 18 mm inward bevels and sparse inset slab
joints. End caps/rail sections meet inside the posts. No model downloads or
new material batches. Ground height and all five connectors stay unchanged.

The old east approach path cut through the newly solid rail. One local
control point (-22,23) now routes it into the mouth, with a 7×1.3 m paving
apron. Width/endpoints and destinations stay. This narrowly scoped repair was
driven by the existing path-clearance test; it is not a layout redesign.

Five new tests use actual scene raycasts and shared physics/camera helpers:
rail continuity, support, bevel/contact, edge collision and no coplanar
cheek/coping overlap. Focused checks24/24. Real keyboard navigation covers
three lanes in both directions, side contact and jump/landing. Reviewed
front/side/close/top, day/dusk/night and mobile viewport. Three scene-switch
cycles are stable179/122 for study and93/29 for personal, original/live/near=.2
restore, page exceptions0. Author performed a separate self-review.

This finishes the academy stair geometry/material pass; other plaza rails,
lamps, planting, architecture and ambient effects retain their earlier state.
No physical-mobile performance claim; touch walking remains unfinished.

Fresh ordered gates pass, each exit0: `pnpm typecheck`; `pnpm lint` (0 errors,
27 warnings in local QA scripts:26 previous plus1 research script);
`pnpm vitest run --maxWorkers=4` (779 tests/87 files); `pnpm build` (11/11).
Evidence: `output/playwright/plaza-stair/gates.log`. Verified checkout dev
tree was stopped before build, including Next and its worker. No commit/push.
