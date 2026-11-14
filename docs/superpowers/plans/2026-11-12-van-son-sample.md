# Vân Sơn — one mountain sample implementation plan

> Execute inline with `superpowers:executing-plans`; single agent and separate self-review per AGENTS.md. Owner approved making one sample on 12/11/2026. No additional approval needed for this local candidate.

**Goal:** Deliver one original 3D mountain, visible in a local orbit viewer and review images.
**Architecture:** A deterministic Blender script creates overlapping rooted rock masses, irregular vertical facets, green terraces and a few trees reused from approved v18 kit geometry. Export one GLB and editable Blend; a small Three viewer uses the existing installed modules and allowlisted loopback server pattern.
**Tech stack:** Blender 4.5.10, Python, Three 0.187.0, repo Playwright CLI. No packages added.
**Spec:** `docs/superpowers/specs/2026-11-12-rock-mountains-design.md`.

## Constraints and review focus

- One sample `van-son`, not three variants or the whole collection; this is the owner's narrowed request.
- Work only in `output/rock-mountains-v1/` plus this plan and handoff documents. Existing app/worktree, old mountain sources and approved/v18 stay intact.
- Reference 4 defines broad faces and truncated peaks; 2/6 define the asymmetrical assembly. Preserve plain rock faces between grooves; grasses must sit on actual shelves.
- Native 3D geometry is the deliverable; screenshots are rendered evidence. No generated 2D stand-in.
- Check all sides, no hidden camera-only tricks; closed rock meshes, finite bounds, tree contact, real exported colors, day/dusk/night and clay mode.
- This is a visual authoring candidate; runtime LOD/budget and app integration are later. No claim of production readiness.
- Preview binds 127.0.0.1 only, no authentication; explicit public file allowlist and Host guard. Do not serve source files or workspace directories.

## Tasks

- [ ] Create `build.py` with deterministic rock construction, terrace surface/contact helpers, reuse v18 oak kit, export `source/van-son.blend`, `assets/van-son.glb`, and `manifest.json`. Include assert-based geometry/contact validation; no app logic to change or test.
- [ ] Create `index.html`, `viewer.css`, `viewer.js`, `serve.py`: one sample with front/back/detail, color/clay and day/dusk/night; no automatic motion; keyboard orbit/zoom and loading/error feedback.
- [ ] Run Blender with output to `build.log`; read result lines and errors. Inspect exported GLB in real browser, capture front/back/clay and narrow viewport. Revise if the image loses the reference's broad planes or tree footing.
- [ ] Run focused verification (source assertions, GLB parse and browser controls/errors), record exact evidence in `QA.md`. App's four gates aren't relevant unless app files change; no commit.
- [ ] Update `CONTEXT.md` and HANDOFF with file paths, local preview URL, measured counts and limits; show the model to owner.

## Self-review before execution

### Owner correction during execution

Candidate 01 was too tall, narrow and ribbed; candidate 02 still resembled stacked rectangular construction blocks. Owner explicitly rejected the square structure and emphasized natural rock texture/structure. Correction: use the first new screenshot as the silhouette authority, with a wide connected foot, irregular interlocking rock faces, one main tree and thin green shelves. Replace the rectangular footprint generator, fuse the volumes into a continuous weathered outcrop, and inspect clay before claiming the visual problem resolved. Keep the existing viewer and inspect actual images; a passing export test does not establish resemblance.

The earlier plan proposed three blockouts, but the latest owner asks for one focused sample. Build that one to a useful visual level with optional clay display; do not halt at a plan or demand another approval. Tree kit reuse affects triangle count, so report authoring counts separately from future middle-band runtime target. Keep the plant material and loaded geometry verifiable in GLB, not just Blender render.
