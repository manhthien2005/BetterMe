# Authored mountains and selective snow in Plaza

## Owner correction after visual review (2026-11-11)

The latest screenshots supersede the former mist-density and placeholder-island
acceptance: reduce the white blanket; remove rectangular/self-occlusion artifacts
on mountains; make distant ridges readable as blue/green depth layers with visible
rock relief; make the twelve distant islands organic rocky shelves with vegetation,
not plain inverted cones. The owner's three landscape references establish depth
and atmosphere, not a request to reproduce their buildings or change the Plaza.

Keep the seven approved main GLBs/transforms, 31 mountains, selective snow,
controls, sky, summit and personal world. Keep mist near the cliff and in low
valleys. Material alpha belongs to foliage cutouts, not atmospheric fading of
solid terrain. Use height/depth color haze on opaque terrain so occlusion stays
correct at every camera angle. Retain the four mist sheets at lower opacity.

Implementation choice: correct the existing shaders and small procedural island
meshes. Repeating full main-island GLBs is unnecessarily expensive; hiding the
artifacts with more mist would fail the owner's request. No new dependencies,
assets downloaded, commits or deployment. Verify screenshots at eye/rim/rear,
day/dusk/night/rain and narrow viewport, plus map-swap resource stability.

Owner approved the six mountain assets and explicitly authorized real Plaza
integration, visual inspection and overall fitting. Continue inline in the
existing landscape worktree; no delegation, commit, push or deployment.

Keep the accepted seven main islands, twelve distant islands, summit and four
mist layers. Replace the 31 procedural mountain placeholders with the approved
six silhouettes across the same 5/9/17 depth bands. Tune elevation/scale/yaw in
the rendered scene to preserve sky gaps and a distant, varied horizon.

Near mountains remain green and rocky. Only selected high middle/far peaks get
irregular ivory snow caps, broken by exposed cliffs. Snow follows elevation and
slope, never a uniform horizontal white stripe. Its lighting follows day/dusk/
night; atmospheric haze increases with depth and rain, bases fade into mist.

Use derived, decimated runtime GLBs under public/world/mountains, preserving
approved Blender/GLB originals. Share geometry/material/texture resources by
model and instance placements; no new reflections, shadows or dependencies.
Aim below 500k additional placed triangles and 20 MB downloaded mountain assets.
Keep an owner-scoped loader with partial success and late-load disposal. Failed
mountains leave a gap but must not break the world or remove other models.

Alternatives: full authoring GLBs repeated at every position cost unnecessary
geometry; all-white mountain chains change the green fantasy world. Chosen:
distance-appropriate derivatives with selective runtime snow and haze, retaining
approved sculpting and composition. Runtime coloring keeps the originals intact
and permits placement-specific snow rather than multiplying asset downloads.

Acceptance: inspect spawn, eye-level, rim and rear; noon/dusk/night/rain and
390x844. Snow reads as distant summit detail, bases have no dark rim or floating
roots, islands remain dominant. Test finite transforms/bounds, selective snow,
partial/late loads, actual GLB budgets, stable three-cycle public/personal GPU
resources. Run all four gates after stopping only this checkout's dev process;
restart local preview, then inspect and report final evidence.
