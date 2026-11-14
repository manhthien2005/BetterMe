# Replace Plaza floating islands with approved V2 collection

Owner approved the six V2 images and explicitly requested replacing/removing the old assets and running the app preview on 12 November 2026. Vườn Gió v18 replaces Mạch Nguồn; six other IDs stay unchanged. This authorizes asset promotion and app integration, not commits or deployment.

Use existing Plaza checkout and placements. Copy the seven approved GLBs into public/world/floating-islands; remove superseded GLBs/manifests in the active public island folders. Preserve immutable authoring snapshots and v1 source dependencies outside the app: those are required for reproduction, not active assets. Do not change unrelated dirty Plaza/study work.

Port approved V2 geometry preparation, matte foliage/wind, layered water, lamp/firefly/splash runtime. Preserve normals, vertex colors, inverted glTF wind UV and per-land water elevations; retain effect anchors before batching. Bake placement into prepared geometry and anchors so shader/reflection world coordinates agree. Lamps follow app night state; motion uses shared clock and respects reduced motion/hidden tab. Root owns and disposes all resources and pending loads.

Seven detailed islands are expensive together. Keep shared geometry batching and stagger water captures with bounded resolution, at most one water-system capture per frame, rather than rendering all reflections every frame. No quality reduction of the approved meshes in this task. Report actual preview behavior without claiming mobile production performance.

Acceptance: exactly seven current asset IDs/hashes; no active legacy GLB/URL; world bounds clear Plaza and each other; rooted effects at nonzero rotated/scaled placement; layered falls and basin impact preserved; night/day and reduced motion work; late loads/disposal are safe; focused tests plus four app gates; browser desktop/mobile viewport and console inspection. Start preview loopback only with authorized local dev auth bypass. No secrets read, no commit/push/deploy.
