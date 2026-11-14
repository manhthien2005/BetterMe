# Tiny Glade inspired floating-island art study

> **Approved baseline — 2026-11-12:** Owner approved Vườn Gió v18 and requested finalized standards for future islands. Current consolidated art and technical requirements are in [docs/art/floating-islands](../../art/floating-islands/README.md). The sections below retain the historical iterations; superseded experiments are not current acceptance criteria. The approved snapshot and file hashes are linked from the standard. This approval establishes the art reference; the current task does not start other-island rollout or app integration.

Owner request, 2026-11-12: research Tiny Glade's trees, grass, flowers and environment; author a new floating island, compare against the approved Mạch Nguồn GLB, and iterate the rendered result. This is an authorized art experiment, not a production-world replacement.

## Direction and scope

Create a real, editable 3D island and reusable botanical kit using the existing Blender 4.5.10 / glTF / Three.js pipeline. Match the reference's hierarchy of organic masses, individual leaf silhouettes, restrained palette, planted transitions and warm/cool light. Tiny Glade screenshots are visual research only; no game geometry or textures enter the deliverable.

Reference: `D:/Dev/Tools/Blender/assets/floating-island-v1/glb/floating-island.glb`, identical to worktree `plaza-landscape-v1/public/world/floating-island/owner-rim-v4.glb`. SHA-256 `7eb017b13db5ca909670d57f046db55a8994680c1c32682d0f29118710d2274b`.

Author choice: a medium meadow island, approximately the reference's 33 × 24 ground footprint, one dominant broadleaf tree, smaller trees and shrubs, flower colonies, a weathered garden arch, a winding path and a small water feature. Layered underside rock, roots and hanging vegetation make it read as floating. Keep a quiet clearing, avoid uniform procedural scatter.

## Approach

- A raster concept alone would not prove usable 3D assets or multiple views.
- Retexturing the approved island would retain its tree silhouettes and scatter patterns.
- Chosen: fresh procedural Blender geometry, deterministic plant placement, editable source, GLB exports, and a standalone comparison viewer. Reuse tooling and dependencies, preserve approved assets.

Deliverables under `output/tiny-glade-island-v1/`: source/build script, island GLB, reusable kit GLBs, research/style rules, iteration evidence, comparison images, local viewer. Repository docs hold the plan; no app behavior, sync, economy, dependencies or approved worktree files change. No commit, push or deployment.

## Acceptance

- Inspect official visual references and distinguish observation from inferred implementation.
- Real leaf geometry and branch hierarchy; dense and sparse canopy areas; no sphere-only trees.
- Clumped tapered grass, distinguishable flowers, soil at worn paths, rooted props, irregular grass/cliff interface.
- Whole island, rear and botanical close-up remain coherent. Compare the existing GLB and new GLB with the same camera scale and lighting.
- Packed Blender source and self-contained GLBs; finite geometry, declared triangle/file sizes, repeatable seed, reference hash unchanged.
- Loopback-only unauthenticated viewer, explicit allowlist, orbit/zoom and keyboard controls, narrow viewport, reduced motion, failed-load recovery and stable resources when changing view.
- Separate author self-review and record honest remaining differences from Tiny Glade; do not equate a subjective approximation with their production renderer.

## Owner refinement — grass and canopy, 2026-11-12

Owner requested immediate improvement: grass is the main weakness; leaves show strange reflective facets. Keep the island composition and kit; refine the existing Blender source and viewer. Grass should read as a soft planted meadow with curved broad blades, shared clump direction, lower path edges and taller patches. Canopies should shade as coherent matte volumes, preserving leaf silhouettes and gaps without bright per-triangle glints or front/back brightness popping. Preserve light/camera in before/after comparison. Correct geometric and shading causes; do not hide them with blur or globally dimming the scene. Validate exported GLBs, normals, matte material, root anchoring, front/back and close views, both lighting presets and motion.

### Continued refinement v3

Owner approved the visual improvement in v2 and asked to keep improving grass and canopy first. Preserve the accepted composition, matte response and no-glint fix. Improve broad canopy volume and interior occlusion, leafy silhouette and grass proportions at low height; retain readable quiet clearings. Same-camera/light comparisons against v2, front/back and botanical close-ups are the acceptance evidence. Avoid uncontrolled geometry growth; report measured budgets. This remains an authorized art study, not app integration.

### v4 water, rock, ruins and trunks

Owner accepted v3 vegetation and requested Tiny Glade research plus an asset upgrade focused on transparent, glossy, moving water and the rock mass. During work owner explicitly authorized one subagent to independently research/upgrade ruins and trunks. Preserve grass/canopy appearance and main layout. Root owns terrain, water geometry/runtime, cliff, integration and QA; delegated worker owns a separate structure module and its previews.

Water: readable shallow bed and deeper green-blue center, view-dependent actual scene reflection, gentle moving ripples, directional stream flow and falling water, shoreline contact. The waterfall must join the stream and taper without looking like a solid strip. Rock: broad fractured planes, limited weathering, integrated ledges and grass contact, no evenly distributed gem-like knobs. Ruins/trunks: worn pale masonry with readable joints/arch opening; organic continuous bark/root transition. No imported game assets. Report which effects live in GLB and which need the web shader.

### v5 landscape, aged ruin and botanical variety

Owner finds pale birch trunks confusing, ruins too new, large rock core and cut-flat island edge unsatisfactory. Explicitly asks for more wildflower models, better vines, and Mạch Nguồn inspired rim/underside with Tiny Glade style; copying owner's Mạch Nguồn underside is permitted. Author choice: rebuild a related layered rock silhouette to fit this island's terrain/water, keep reference unmodified. Preserve accepted grass/canopy and v4 water. Tone birch bark to warm grey with identifiable markings, make ruin age legible through broken silhouette/structural loss and rubble (not only surface decoration), add five botanically distinct wildflowers and organically branching/clumped vines. Rim needs soil/stone/grass transitions at varied heights and local overhangs; underside needs asymmetry, large interlocking masses and sheltered recesses rather than a smooth inverted bowl or evenly spaced knobs.

User authorizes agents; use isolated short briefs (`fork_turns=none`) with file ownership and compact evidence. Root owns generator/integration, geology, exports, viewer and tests. Workers own independent ruin, flower and vine modules. Same standalone study; no app integration, dependencies, commit, deployment or changes to the approved reference. Verify actual source/export geometry and rendered front/back/low rim/underside/ruin/flower/vine views, two light presets, mobile and existing water/foliage regressions.

### v6 water, geology, bark and flowers

Owner accepts v5 provisionally but finds water and rocks artificial, trunks too smooth, flowers reflective and white chamomile egg-like. Explicitly requests independently researched subagents and a complete v6 to evaluate. Continue the authorized standalone art study using existing Blender/Three pipeline. Preserve composition, grass/canopy geometry and accepted ruins/vines; refine the four named asset groups. No app/dependency/commit/deploy changes.

Author direction: retain stylization with stronger physical cues. Water needs readable bed/shallow/deep transitions, coherent reflected scenery, modest ripples and downstream flow without white striping. Rocks need broad fracture planes, limited edge rounding, weathering tied to recesses and ground contact rather than regular rings/random triangle colors. Bark needs actual longitudinal grooves/ridges, knots and root flare visible at close range; birch remains warm grey and recognizable. Flowers need matte two-sided stable shading and distinct petal silhouettes; chamomile gets slender separated curved ray petals and a small textured ochre disc, with leaning stems and varied heads. Avoid solving reflection by globally dimming the scene.

Alternatives considered: palette-only changes cannot correct silhouettes; photoreal texture density would compete with the accepted meadow. Chosen: targeted geometry/material/runtime corrections using existing helpers. Each worker independently retrieves and inspects official Tiny Glade images and records observation vs implementation inference in a compact research note. No game assets copied into exports.

Acceptance: same-camera v5/v6 renders for water/rock/bark/flowers and whole island; two lighting presets and motion; preserved canopy/grass data, finite and self-contained exports, rooted contact, no flower glints or detached bend parts; shader output/GPU behavior checks, viewer desktop/mobile/load/disposal regressions; honest measured file/triangle budgets and limits. Root owns shared integration/export to prevent racing writes. Baseline remains in renders/landscape-v6/baseline.

### v7 meadow, riverbed and living rock edge

Owner approves v6 water and chamomile. Requests: explain/remove the sawn boulder cut; correct odd riverbed; raise remaining flowers to chamomile detail; research a more convincing island underside; add more and longer natural vines; correct the odd island rim; explicitly dispatch a dedicated grass agent to improve softness and Tiny Glade resemblance. Execute this refinement within the standalone study. Preserve water runtime, chamomile kit geometry, canopy kit geometry and established composition; grass changes are now expressly authorized.

Direction: rounded organic river cross-section with locally refined terrain, avoiding radial mesh wedges; botanical detail driven by each species rather than generic extra petals. Geology should be a coherent weathered mass with staggered broken planes, restrained shelves and asymmetric lower lobes, avoiding a single cone, tall smooth drape, saw cut or detached gems. The rim should have thin variable turf, exposed earth and broken stone contacts instead of a uniform thick green gasket. Ivy should emerge in patchy rooted colonies with longer tapering runners, branching nodes/petioles and smaller terminal leaves; keep waterfall clear. Grass should read as soft grouped growth, with fine curved tips, coherent matte shading and calm wind, not spikes, uniformly thick carpet or excessive geometry.

Independent workers own grass, flowers and geology; parent owns riverbed, vines, integration and exports. Each researches relevant official images and distinguishes observations from inferred methods. Preserve v6 baseline. Verify source/export finite geometry, foliage/petal winding/materials/wind, root/shore/rim contact, manifold boulders, no cross-island vine bridges, final lighting at multiple views and mobile. Use visual before/after, not numerical tests alone, to accept each part. No app/dependency/commit/deploy work.

### v8 rock body, soft rim and a more legible river

Owner approves the overall v7 result, but the underside reads like artificial soil with attached fake rocks. Requests a larger river, clearer falling water and a softer island edge. Continue directly within the authorized standalone art study. Preserve botanical kit geometry and overall scene layout; vegetation along the enlarged river must move only as needed for water clearance.

Owner clarification during v8: prioritize a natural island appearance from a distance; keeping the warm tone is acceptable. This supersedes the optional light-grey palette suggestion. Parent completed interrupted agent work after quota recovery because the resumed turn did not expose agent-control tools; no agent restart was claimed.

Author choice: use connected weathered bedrock masses with unequal broken planes and sparse recessed joints; remove the attached buttress objects. Limit earth to the upper shoulder, keep matte quiet mineral colors, and round the shoulder from horizontal meadow to cliff using a short curved transition and irregular grass fringe. A palette-only patch cannot fix the smooth bowl or attached-rock silhouette; blanket subdivision would soften the rock excessively. Preserve exact mesh contact at the top boundary and root trailing ivy on the revised surface.

Widen the river channel roughly 1.5–1.7 times (nominal half-width 1.05 vs .63), widening the underlying basin and foliage exclusion too. Water surface must cover the channel to the banks and join a roughly 2.25-wide rounded fall lip. Preserve the accepted pond shader; strengthen only waterfall readability using a translucent body, fine downstream strands and broken low-contrast aeration, with gradual tail fade. Keep waterfall free of cliff intersections and support reduced motion.

Acceptance: same-camera v7/v8 front/back/underside/rim/water views, two lighting presets, water-on/off comparison; numerical source checks for wider wet channel, attached stream/fall, planted grass/ivy, finite outward cliff, joined rim, no glued buttress objects; existing viewer/material/UV/GPU checks. Report actual output budget. No app/dependency changes, commit, push, deployment or original-reference modification.

### v9 Mạch Nguồn relief, varied vine stems and grass assessment

Owner explicitly asks to use the rugged body design of Mạch Nguồn with Vườn Gió's earth colors. Vines are accepted; add thick main stems alongside existing thin branches and extend trailing length modestly. Owner requests a grass subagent to compare with Tiny Glade and authorizes applying a clear visual improvement. Current tool inventory has no subagent controls; parent disclosed that limitation and performs a separately recorded assessment, without claiming independent agent work.

Direction: adapt the actual owner's `nature_details.py` multiscale cliff profile (lobes, joints, eroded terraces and fine relief) to the accepted exact meadow seam, warm palette and waterfall clearance. Keep the original reference files untouched. Use a smooth outlet recess rather than its historical abrupt z cutoff. Preserve the accepted v8 shoulder, water, tree/flower kits and layout. Add sparse thicker woody vine leaders, with finer attached branches and tapered ends; extend selected runs around 15–20%, preserving open stretches of rock and the waterfall gap.

Grass direction is conditional: inspect official close imagery against current meadow, then try distinct low/open areas with taller clumps, coherent blade lean and restrained highlights. Keep blade curvature, rooted wind and matte response. Accept only after matched-camera high/low views show a readable improvement; avoid a blanket density increase. Numeric checks protect contacts/UVs and a controlled geometry budget, not aesthetic equivalence to Tiny Glade.

### v10 floating satellite details

Owner accepts v9 and requests floating rocks and smaller floating islands containing grass, flowers and trees or shrubs. Add three asymmetrically placed satellites at differing heights/scales: a small tree island to the west, a shrub/flower island to the east, and a low grassy flower/shrub islet toward the front-right. Use the existing botanical kit, warm earth/stone palette, rugged continuous underside and soft living edge. Scatter a small number of unequal floating fragments between these groups; avoid a uniform necklace. Preserve all existing main-island geometry, placements and water runtime exactly.

Keep sightlines around the waterfall and primary island clear. Satellite flora must be rooted on each actual exported triangulated surface and stay inside its rim. Reuse existing blade/kit helpers with isolated RNG so their addition cannot perturb the accepted main scene. The complete scene remains one GLB, with fourteen existing reusable kit exports; these additions do not require new UI, dependencies or app integration. Viewer auto-framing must fit the expanded composition at desktop/phone sizes. Validate joined mini rims, finite/outward rock shells, anchored vegetation, deterministic generation, preservation of original meshes/transforms and measured added geometry/file budget; visually inspect all sides before handoff.

### v11 richer greens and Mạch Nguồn ruin texture

Owner requests a livelier, slightly deeper dominant palette inspired by original Mạch Nguồn, starting with transferring its ruin surface texture to Vườn Gió. Preserve accepted geometry, island layout, water, flower shapes and satellites. Author choice: jade/grass greens with less grey and pale yellow, retaining warm sunlight, cool recesses and matte botanical shading. Apply the owner's existing cliff color/normal images to a dedicated ruin material on arch masonry, rubble and broken garden wall, with consistent face-projected UV scale. Pack maps into Blender and island/arch GLBs. This transfers surface treatment; rebuilding the ruin silhouette is outside this first requested step.

Approaches: a viewer saturation filter would also distort flowers/water and would not travel in the GLB; globally texturing the shared stone material would alter all rocks. Chosen: shared botanical palette edits plus isolated ruin material/UV changes. No new dependencies, app edits, reference edits, commit or deployment. Existing user instruction to proceed authorizes this scoped art iteration.

Acceptance: matched v10/v11 front, meadow, canopy and ruins under both existing light presets; reference close-up for material judgement; no stretched masonry textures, renewed leaf glints or lost color depth. Validate finite UVs/packed maps, preserved mesh positions/topology/transforms and water runtime, existing source/foliage/water/satellite checks and viewer regressions. Record measured export size and limits; keep v10 baseline.

### v12 thinner meadow, darker leaves and reference mineral color

Owner requests20–30% lower grass density,2–3 irregular tall clumps, slightly darker tree leaves, and Mạch Nguồn underside colors with a little earthy brown. Use25% thinning as the target, with three sparse tall groups as accents on the main meadow. Thin existing colonies with an independent RNG without re-scattering the plants or changing accepted prop placements. Apply comparable thinning to satellite grass. Preserve fine curved blades, grounded roots, wind anchors, clear paths/water and the accepted v11 grass hue.

Author choice: reduce canopy linear brightness about8% (a small perceptual change), retaining v11 hue and matte response. Reuse Mạch Nguồn's original mineral map and depth-dependent grey vertex palette, mixing a small brown component; apply consistently to main and satellite bodies. Keep current island shape, ruins/materials, flowers, water and floating stones. Direct source/material changes travel in GLB; no viewer filter, new packages, app changes, reference edits or commit/deployment.

Acceptance: measured final grass count70–80% of v11 including the tall accents; exactly three visibly distinct irregular groups with fewer taller blades rather than dense hedges. Existing plant contact and wind checks must pass. Confirm leaf brightness change is slight, non-grass geometry/placements are preserved, main/satellite mineral colors are consistent, and front/back/low grass/cliff views work under both existing lights. Preserve v11 baseline and report export budget and phone QA limits.

### v13 clearer grass and reference-scale mineral detail

Owner says grass blends into the ground and asks for slightly clearer blades, plus the underside detail of Mạch Nguồn. Preserve v12 density, three tall groups, tree colors, warm-grey body palette and layout. Increase grass root-to-tip color separation gently and lower only the grassy ground's brightness; keep materials matte, existing blade geometry and wind anchors. Apply consistently to satellites and reusable grass tufts.

Diagnosis: Mạch Nguồn uses circumferential UV `angle*radius*.18`, vertical UV `z*.23` and normal strength.85. Vườn Gió uses3 repeats around the whole main body, vertical.105 and strength.38, stretching the same mineral texture about6x horizontally and2.2x vertically. First restore reference world-scale UV density and normal strength on main/satellite bodies. Existing broad relief already derives from the owner reference; preserve it unless visual inspection proves material detail insufficient. No artificial sharpening filter or new geometry for texture-scale symptoms.

Acceptance: matched grass/low-angle/body detail/whole scene under both light presets; visible blade separation without pale glowing grass, finer mineral relief resembling reference without obvious repetitive stripes. Save v12 baseline; preserve all source geometry/placements/grass counts/tree colors/water; packed UV/material checks, source/foliage/satellite/viewer/GPU checks. No app/dependency/reference changes or commit/deployment.

### v14 meadow volume and legible height groups

After a candid review, owner authorizes further analysis and fixes for pale/unclear grass and weak visible height differences. The v13 color-only correction was insufficient. Root causes: narrow blades lose coverage at the overview camera, nearly vertical authored normals light similarly to the ground, scattered roots/directions fail to form readable tufts, and only280 accent blades out of28,195 form the named tall groups. Preserve the accepted20–30% thinning relative to v11; improve structure rather than restoring a dense carpet.

Chosen direction: modestly widen blade middles with fine tips, give blade halves gentle authored directional shading, reduce the uniform bright-tip lift and deepen sheltered roots. Keep matte, stable two-sided shading and rooted wind. Tighten existing tuft spreads/directions, distribute short/medium heights across broad irregular regions, and expand the influence of the three existing tall groups while keeping paths/water clear. Coordinate restrained ground-color variation with the height field. Use the same blade treatment on the kit and satellites; no new rendering dependency or per-blade shadow pass.

Alternatives considered: further global saturation/sharpening does not fix tuft shape; enabling all blade shadows risks noisy shadow patterns and extra cost. Chosen source geometry/color/normal changes travel in GLB. Preserve island mineral/body geometry, tree/flower/ruin shapes and colors, water/runtime, all non-grass prop placements and the current cozy palette. No app/dependency/reference edits or commit/deploy.

Acceptance: low grass and tall groups must read from the normal overview and low angle, without bright straw, dense hedges, broad stumps or excessive geometry. Target main count27k–30k, broader actual height distribution (p10 below.18, p90 above.50 world units) and demonstrably taller populations in each named group. Root/UV/water/path contacts and two-sided matte GPU checks pass. Match v13/v14 cameras/lights; inspect near/far, both light presets, back and phone. Numeric checks protect the implementation; visual review judges the improvement and records remaining limits.

### v15 main rim follows the accepted satellite shoulder

Owner identifies the small islands' rounding as the reference and explicitly requests fixing the large island's broken-looking rim. Close-up comparison confirms that the large island's separate grass/earth overlay terminates in abrupt beige steps, while the satellites use one continuous rounded mineral shoulder. The main ground/cliff seam also has a shading-normal discontinuity (mean 11.37°, max 54.78° before correction).

Apply the satellite approach to the main island: remove the separate surface overlay, broaden the existing rounded shoulder modestly, interpolate grass to mineral through the curve, and match the cliff's first-row shading normals to the ground boundary. Keep the original top boundary positions and the irregular outline. Preserve the v14 meadow, satellite assets, all props, water geometry/runtime and deep reference relief; only nearby vines may follow the adjusted shoulder. No global palette change, new dependency, app edit, reference edit, commit or deployment. A color-only patch cannot remove the overlay edge; a full terrain remesh would unnecessarily disturb planted assets.

Visual iteration: after removing the overlay, an abrupt shoulder/body tangent remained (p90 face-angle change 65.94°, max 92.10°), producing a dark cut below the roll. Continue vertically from the shoulder before blending into the existing deep reference profile within its existing upper 14% transition zone. Deep relief stays exact; validate fall clearance after this change.

Acceptance: matched front/west/back/waterfall rim and satellite-reference images under both lights, plus whole-island and phone views. No beige cutout band, cracks, turned faces or new water intersections; smooth rounded transition with the accepted warm-grey mineral treatment. Verify exact top seam, joined cliff topology, compatible shading normals and unchanged source geometry/colors/UVs/transforms outside cliff/overlay/vine contact adjustments. Run existing source, water, foliage, landscape, satellite and viewer checks; record export budget and separate self-review.

### v16 varied satellites and rock fragments; main island stays exactly v15

Owner rejected the exploratory underside direction: restore the whole large-island body/underside to v15 and make no further main-bottom changes. Owner then explicitly reaffirmed redesigning the floating rocks as well as the small islands. Preserve the v15 main island exactly, including all cliff geometry/normals/colors/UVs, grass, rim, vines, props and water. The final changes are confined to planted satellites and eight loose rock fragments.

Give the three satellites distinct footprints, aspect ratios and depths: a long tree-bearing ridge, a broad shallow shrub shelf, and a narrow offset fragment. Preserve their existing botanical families and softly rolled meadow/stone shoulders; replant on the actual changed surface. Do not modify shared botanical kits or island centers. Replace pale brick-like loose rocks with varied slab/wedge/chunk proportions, unequal fracture faces, worn edges and the shared warm-grey cliff mineral material. Keep their existing centers; use an independent pose RNG.

`landform_assets.py` must be byte-identical to the saved v15 baseline. Only `satellite_assets.py`, viewer version labels and evidence/docs may change. No app/dependency/reference edits, commit or deployment.

Acceptance: exact saved-source comparison against v15 for every main-island/kit mesh instance, including full main underside and ivy; same-camera before/after overview, three satellites and fragments in both lights; visually inspect underside restoration and phone. Satellite solids must be joined/manifold with grounded plants/wind roots; loose rocks must be closed solids with the shared mineral material and finite UVs. Existing source/water/foliage/landscape/viewer regressions pass. Earlier exploratory logs are superseded by the final scoped results.

### v17 living cliff, fallen fantasy masonry and evening details

Owner requests seven additions on Vườn Gió only: moss/cliff plants; one night lantern with fireflies; old paving; revised stone tones; a recognizable broken column beside the river/path end; dispersing water at the lower waterfall; restrained colorful wild fruit in bushes. Rollout to other islands is paused. Preserve approved v15 main shape, underside, grass and rim, plus v16 satellites and floating fragments.

Owner refinements during preview are authoritative: moss is a subtle green wash in irregular patches directly on the upper cliff, and this wash is approved. No raised moss beads. Fruit belongs to dense, low, interwoven wild bushes, including aggregate red mulberries, blue berries and grapes. The column lies collapsed close to the ground, with fantasy carved bands/flutes, a low broken footing, fallen capital and fragments; no tall upright shaft. Old paving is broad and flat with narrow connected joints rather than isolated raised stepping stones. Stone and masonry become modestly brighter than the first v17 pass while retaining neutral mineral character.

Static details and moss colors travel in the self-contained GLB/editable Blender file. Night lighting, fireflies and waterfall particles are owned by the preview scene and disposed with it. A manual night selector keeps the island readable with cool moonlight and one local warm lamp. Fireflies appear only at night; motion follows the explicit shared toggle, pauses when hidden, and stops on reduced-motion preference. No lamp leaks into reference/kit/first comparison view. Water's daylight contribution dims at night. Free-falling spray disperses downward into air, with no unsupported pool/impact ring.

Acceptance: all incumbent geometry/UV/normals/transforms and unrelated colors exact against v16; only upper-cliff color patches and requested stone/masonry tone may differ. Existing RNG scatter preserved. Flat pavers rooted to terrain, horizontal column with outward faces and grounded pieces, rooted cliff plants and bush-scale fruit. Verify source/export, water rendering/contact and state restoration, isolated firefly GPU motion/pause, effect disposal, modes/retry/keyboard, desktop and 390px phone. Keep compact evidence and a separate self-review; do not change app/dependencies/reference or commit/deploy.

Final v17 amendments from owner: reject the new paving and retain **the original v16 stepping stones**, with exact path geometry and colors. This replaces all earlier v17 paving requirements. The fallen column needs a complete fantasy carving vocabulary, including stone leaf relief along its panels, woven collars, flaring capital with acanthus/volutes, separate low footing and fragments. Replace the tall small lantern by a shorter, larger, detailed angular fantasy lantern near the island center; brighten and broaden its warm night illumination. Approved moss wash, current grass and underside remain unchanged. Acceptance adds exact 24-path-stone preservation, a horizontal shaft, carved capital/relief, centered low lantern and wider nighttime illumination.

Latest lantern refinement: place it on the opposite side of the path, still in the central area; enlarge stone foot and short support. Reduce the first bright lamp's intensity and emissive glare while keeping its broad warm illumination. Current placement (-1.65,2.35), lamp height2.76, roof width1.30, foot width1.14; preview point light27/range18.5, glass emission1.8.

### v18 warm lantern, shrub insects and waterfall refinement

Owner requests slightly wider yellow illumination, yellow-orange luminous glass, a few insects around wild bushes and a more developed waterfall. Keep v17 placement/shape, approved moss, fallen fantasy column, original v16 path, v15 grass/underside and v16 satellites. Widen light moderately while avoiding the rejected harsh hotspot; use saturated amber emission so glass retains its color. Add6fireflies at each of3actual shrub anchors; all insects remain night-only and use the existing explicit motion control.

Waterfall should transition from coherent translucent flowing sheets to aerated broken strands, accelerated elongated drops and soft uneven dispersal into air. Preserve all static geometry and bed/reflection behavior. No artificial impact pool in open sky. Layers share the existing clock, pause when hidden/reduced-motion, dim at night, stay local to Vườn Gió and release all GPU resources on disposal. Acceptance includes exact geometry/unrelated-color preservation, isolated GPU evidence of movement/pause/night fade, source and viewer regressions, meaningful near/whole/day/night/phone inspection.
