# Six additional floating island models

Owner request (2026-11-11): create six distinct flying-island models: two large,
two medium and two small. The approved Mạch Nguồn island is the medium reference.
The owner explicitly asked to proceed; the following compositions are author
choices within that request, not additional owner-selected concepts.

## Direction

Preserve the approved weathered stone, irregular grass/rock rim, botanical trees,
warm pale ruins and moving turquoise water. Create genuinely different silhouettes
and compositions, not recolored or scaled duplicates of the medium reference.

| Model | Size | Distinguishing composition |
| --- | --- | --- |
| Thiên Viên | Large | Broad garden plateau, old tree, curved colonnade, lake and falls |
| Thác Tầng | Large | Three offset stepped plateaus, cascades connecting levels, grove |
| Nguyệt Hồ | Medium | Crescent-like edge enclosing an off-center lake, broken arch |
| Song Đỉnh | Medium | Two separate rocky peaks, narrow arched bridge, asymmetrical trees |
| Tán Mây | Small | Compact leaning rock mass, one dominant tree and tiny spring |
| Phong Đăng | Small | Tall narrow crag, slender trees, stone lantern pavilion |

Size refers to the main landform footprint in consistent world units, not camera
zoom or satellite debris. Mạch Nguồn's main top is approximately 33 x 24 units;
large models span roughly 50–60 x 35–42, mediums 32–39 x 23–29, smalls 14–19 x 11–15.
Exact generated bounds go in the manifest. Retain the original unchanged.

## Approach and delivery

Use the established Blender/GLB pipeline. Reuse approved material maps and tree
mesh parts; author fresh landforms, placement, ruins, water paths and vegetation.
Full sculpting of every tree would add little to this variation task; simply
warping the existing whole island would retain its repeated composition.

New source/output package: `D:/Dev/Tools/Blender/assets/floating-island-collection-v1`.
Deliver six GLBs, six packed Blender sources, provenance/manifest and a local
gallery with individual orbit views and a consistent-scale comparison. Reuse the
existing water shader contract, with explicit resource cleanup while switching.
Unauthenticated static viewer binds only to loopback, with an explicit file allowlist.

No placement of all six in the live Plaza is implied by this modeling request.
Do not change the approved original, gameplay, camera, production data, dependencies
or other worktrees. No commit, push or deploy. Continue with one agent and a separate
self-review, following AGENTS.md.

## Acceptance

- Exactly six additional distinct models; 2/2/2 sizes clearly visible at one scale.
- Irregular connected grass/cliff boundaries; no flat-cut rim, floating trees or
  grass in water. Different landform mesh signatures and compositions.
- Finite geometry, UVs/materials retained, model-local waterfall descriptors and
  packed resources. Report file/triangle budgets rather than inventing FPS claims.
- Inspect all six from front and back, plus detailed edge/water views. Gallery
  desktop and mobile, keyboard orbit/select, reduced motion, load failure/recovery
  and repeated switching must work without growing owned GPU resources.
- Reference hash unchanged; no app source changes required. Run generator/output
  and viewer/server checks. App's four gates are needed only if app code changes.
