# Reading Quest — relaxed upright locomotion

Owner approved 2026-11-10: refine the proposed walk/run head and back posture.
Walk should look relaxed and upright; jog keeps forward momentum while the upper
back opens and the head looks ahead. This supersedes the prior freeze on these
upper-body poses only. Existing education/hop specs remain authoritative elsewhere.

Use the current locomotion sampler and normalized VRM rig. Apply small distributed
pitch adjustments after sampling, blend them with the existing walk/run weight,
and let the existing locomotion fade restore idle. Keep source twist/sway and
avoid a rigid straight back or upward chin. Choose offsets by full-cycle real-rig
measurements and equal-phase front/side A/B. No new animation asset or dependency.

Acceptance: settled walking/jogging gaze is approximately forward (head pitch
within -8 to +8 degrees walk, -8 to +10 jog; positive means looking down).
Hip-to-neck forward lean stays below 12 degrees walk / 18 jog, with a visible
positive jog lean. These are broad regression bounds, not a claim of anatomical
precision. Visual review decides the final offsets inside those bounds.
Verify at 30/60/120 Hz and inspect several phases, starts/stops and transitions.

Preserve root/physics/speed/cadence, hip displacement, lower-limb and arm local
tracks, hand gestures, accepted balanced hop and idle. Parent torso rotations
naturally move the arms in world space. No whole-model tilt, gaze-tracking system,
camera/environment/HUD change, NPC behavior change or new tuning UI.

Use existing worktree, single-agent execution and separate self-review. Preserve
all earlier uncommitted work. Browser desktop/mobile/reduced-motion and missing
locomotion fallback checks, relevant regressions, then pnpm verify with own dev
tree stopped. Restore loopback preview. No staging/commit/push/deploy/SQL.
