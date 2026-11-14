# Hands and jump refinement

Owner accepted walk/run/idle on 2026-11-10 and requested natural hands and a less
stiff jump. Existing authorization permits suitable free clips. Keep accepted
body locomotion/idle, model, NPC actions, camera, sky and physics. Work inline in
the same worktree; no commit/push or delegation.

Investigation: only walk/run use authored clips. Jump/fall/land still use the old
procedural poses. Fingers are a generic low curl from `decorateCharacterPose`,
while wrists come from the source clip, so the hand silhouette is disconnected.
The existing CC0 UAL archive has full finger tracks and Jump_Start/Loop/Land.

Approaches: tuning old jump angles repeats the rejected method; replacing all
movement violates the accepted scope. Extend the existing source retarget pipeline
with a separate hands/jump supplement, preserving the locomotion asset byte for
byte. This is the implementation choice within the owner's requested refinement.

Hands: use source finger coordination, softened from the source's clenched fist
to a relaxed hand at rest/walk and a loose curl during run. Preserve greeting
open hand and the NPC book pose. Verify thumb clearance and no hyperextension on
the rendered rig. Do not change accepted idle/body/arm trajectories.

Jump: inspect source timing, trim grounded wind-up because physics jumps without
input delay; map rising/apex/falling pose to actual vertical velocity, then play
landing absorption on actual ground contact. Blend interruptions and re-jumps.
No root translation or authored hip rise that duplicates physics height. Landing
may recover visually while controls remain responsive; walk/run resume smoothly.
No floor IK on airborne feet, including locomotion fade-out.

Acceptance: visibly articulated arms/legs/feet through launch, air and absorption;
no return to rigid spread-arm pose, snap, T-pose, foot lock or underground hips;
natural hands without finger intersection. Real-rig tests at 30/60/120 Hz and
browser comparison against source, including stationary/moving/repeated jumps,
greeting, reduced motion and asset fallback. Preserve accepted locomotion byte
hash and test its old contracts. Owner visual acceptance remains a separate step.
