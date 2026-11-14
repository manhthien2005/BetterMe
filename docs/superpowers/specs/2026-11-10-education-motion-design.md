# Reading Quest — relaxed education movement

Owner approved 2026-11-10: refine the existing clip set for an education-focused
academy, verify the visual result, preserve accepted walking and idle. This
supersedes the hands/jump round's fixed-jump-height constraint for this refinement.
No commit/push, no delegation. Continue in reading-quest-environment-v1.

## Approach and intent

Keep the CC0 source and retarget pipeline. Selectively reduce jump expressiveness
using its settled pose as the reference, retain the coordination/timing from the
authored clips, and lower the physical jump. Uniform playback slowdowns risk foot
sliding; replacing all clips discards accepted motion without justification.
Replacing just jump remains a fallback only if selective refinement looks poor.

The focal movement is a small playful hop: immediate Space response, arms nearer
the body, less knee tuck, shallow landing absorption, smooth recovery/re-jump.
Initial tuning choice: jumpSpeed 4.8 with gravity 20 (~0.6m at normal frame rates),
unchanged horizontal speeds. Exact pose weights are implementation choices to
resolve by real-rig tests and side-by-side front/side/gameplay inspection.

Use different regional influence for upper body/arms/legs; reference the source's
settled landing pose, never scale every joint toward the T-pose. Landing hips and
leg bend must agree so soles remain on the floor. Fingers retain the accepted
relaxed pose and greeting behavior. Walk/idle must remain unchanged. Review run
in the same scene; refine only upper-body exuberance if visually justified, while
keeping the leg cycle, cadence and speed intact.

## Acceptance and boundaries

- A configured hop lifts immediately, peaks about 0.5–0.7m at 30/60/120Hz, keeps
  mid-air control/collision and returns to y=0 without a double jump.
- Articulation remains visible; no wide airborne T-like silhouette, excessive
  tuck, deep landing squat, foot penetration, rigid knees or snapped recovery.
- Moving/stationary/repeated jumps, releasing movement on contact, immediate
  re-jump, greeting, reduced motion and unavailable clips remain usable.
- Physics owns root height; only the configured impulse changes. Camera, model,
  NPC behavior, sky, interface, habit data and economy stay outside this scope.
- Reuse installed Three/VRM stack and existing assets. No new library, external
  asset download or permanent tuning UI. This is visual tuning, not a claimed
  performance optimization. Existing mobile HUD limits are recorded separately.
- Separate self-review, focused tests and fresh pnpm verify; stop this checkout's
  dev tree before build, then restart loopback 3020 for owner playtesting.

## Owner visual correction — balanced hop

Owner accepts the low height but reports the pose still looks odd. The previous
regional reduction retained the source's asymmetric lifted leg, hip yaw and wide
knee trajectory even in a stationary hop. Its settled reference is also a split
stance, so attenuating toward it cannot remove that imbalance. Technical clearance
checks did not cover this visual requirement.

Keep 4.8 impulse/gravity/speeds and all accepted ground locomotion. Refine the
source sampling into a balanced two-leg stationary hop, with forward/back knee
flexion and a small coordinated arm swing. Avoid a dangling straight leg,
bowed-out knees and sideways hip twist. Moving jumps may keep a modest lead/trail
difference; retain smooth interruption and floor contact. No anticipation delay
may be added to Space. Same-source data/rights, no dependency or model change.
Compare the current low-hop baseline and candidate at the same physics/time in
front, side and gameplay views; owner aesthetic acceptance remains separate.
