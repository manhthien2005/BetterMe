# Hợp đồng kỹ thuật — asset và renderer

Đi cùng [quy chuẩn mỹ thuật](STYLE-GUIDE.md). Đây là mô tả pipeline **đã có**, không phải yêu cầu thêm framework hay thư viện. Phiên bản nguồn chốt: Blender **4.5.10 LTS**, Three.js **0.187.0** trong repo; generator seed `12112026`.

## 1. Nguồn, đầu ra và phụ thuộc

Gốc làm việc hiện tại: `output/tiny-glade-island-v1/`. Các liên kết dưới đây là file thật tại gốc đó.

| Nhóm | Nguồn có trách nhiệm |
|---|---|
| Lắp ghép, terrain, material cơ sở, vị trí và export | [build.py](../../../output/tiny-glade-island-v1/build.py) |
| Thân/mép đảo, texture khoáng | [landform_assets.py](../../../output/tiny-glade-island-v1/landform_assets.py) |
| Cỏ và trường cao thấp | [grass_assets.py](../../../output/tiny-glade-island-v1/grass_assets.py) |
| Thân cây, tàn tích vòm, UV đá xây | [structure_assets.py](../../../output/tiny-glade-island-v1/structure_assets.py) |
| Đá rời, hoa, dây leo | `rock_assets.py`, `flower_assets.py`, `vine_assets.py` |
| Đáy hồ, hồ/suối/thác | `riverbed_assets.py`, `water_assets.py` |
| Đảo nhỏ và đá bay | [satellite_assets.py](../../../output/tiny-glade-island-v1/satellite_assets.py) |
| Rêu, cây bám, cột đổ, đèn, bụi quả và anchors | [details_assets.py](../../../output/tiny-glade-island-v1/details_assets.py) |
| Load/batch, normals/gió, camera, ánh sáng, trạng thái | [viewer.js](../../../output/tiny-glade-island-v1/viewer.js) |
| Quang học nước | [water-surface.js](../../../output/tiny-glade-island-v1/water-surface.js) |
| Đèn, đom đóm, giọt/tia/sương | [scene-effects.js](../../../output/tiny-glade-island-v1/scene-effects.js) |

Đầu ra: `source/vuon-gio.blend`, `assets/vuon-gio.glb`, `assets/<kit-id>.glb`, `manifest.json`. Texture gói trong GLB/Blend; bản PNG nguồn ở `textures/cliff-color.png` và `textures/cliff-normal.png`.

Generator hiện kiểm hash file gốc Mạch Nguồn ở `D:/Dev/Tools/Blender/assets/floating-island-v1/glb/floating-island.glb`. Snapshot không chép file ngoài repo này và không kèm Blender/Node/node_modules. Khi chuyển máy cần cung cấp đúng reference, kiểm hash và điều chỉnh đường dẫn trong **bản làm việc mới**; không bỏ assertion hay sửa snapshot để chạy cho qua. Lệnh build ghi đè các đầu ra trong thư mục của nó.

`serve.py` tìm Three.js qua `ROOT.parents[1]/node_modules/three`; vì vậy bản làm việc nên ở `output/<tên-thư-mục>/`, không chạy server ngay trong snapshot lồng sâu. Preview chỉ bind `127.0.0.1`, không có auth, có allowlist/Host guard. Nếu thêm module public cần cập nhật allowlist và restart đúng server của bản làm việc.

## 2. Kit và định danh

| Nhóm | Kit ID đã có |
|---|---|
| Cây/bụi | `oak`, `birch`, `hazel` |
| Thảm/cây thấp | `fern`, `grass-tuft` |
| Khoáng/kiến trúc | `boulders`, `garden-arch` |
| Hoa | `chamomile`, `foxglove`, `bellflower`, `buttercup`, `clover`, `cornflower`, `poppy` |

Kit có gốc/footing ở mặt nền cục bộ; assembly raycast xuống mặt đất thực để đặt gốc. Footing vòm được điều chỉnh phần chôn khi lắp, không làm méo kit gốc. Đèn, cột fantasy, rêu, bụi quả và cây bám hiện là chi tiết **trong assembly**, chưa phải các GLB kit độc lập. Việc tách chúng cần giữ pivot/material/metadata và có kiểm tra riêng; không hứa sẵn kit chưa xuất.

`manifest.json` ghi tên, seed, reference/hash, paths, triangles/bytes/objects, kits, placements, satellites, số lá và details. `objects` bao gồm empties/anchors, không đồng nghĩa draw calls. `triangles` là geometry xuất, không phải tổng tam giác GPU qua shadow/capture passes. Không in cả mảng placements vào context.

## 3. Geometry, màu, normal và UV

- Blender Z-up → glTF/Three Y-up: `(x,y,z)` thành `(x,z,-y)` trong world sau load. Dùng matrix world thật, tránh chuyển hai lần.
- `Color` là vertex color POINT, đi từ sRGB qua hàm `rgb()` sang linear. Màu cơ sở/shading cục bộ nằm trong mesh; texture khoáng nhân với vertex color. Chỉ đổi Principled Base Color khi có node màu nối vào sẽ không đổi đúng kết quả.
- Giữ winding mặt đúng rồi mới dùng normal mỹ thuật. Tán/cỏ có custom normals hướng theo thể tích; cả hai mặt giữ hướng normal thống nhất qua shader. Material lì: lá/cỏ/cánh hoa roughness 1, specular 0. Không dùng roughness để che mặt lá ngược.
- Cỏ: 9 đỉnh, 7 tam giác mỗi lá; bản nguồn UV gió gốc 0 / ngọn 1. Sau export V bị đảo: glTF gốc 1 / ngọn 0; viewer dùng `1.0-uv.y`. Không lấy UV gió làm UV khoáng hoặc tính lại normal sau merge mà chưa đối chiếu.
- Cỏ không cast bóng từng lá trong viewer hiện tại, vẫn nhận bóng cây/đá; root shading cho chiều sâu. Thay đổi quyết định này phải kiểm visual và chi phí GPU.
- Main cliff có seam 192 đỉnh trùng mặt cỏ, custom normals nối mép; main mineral U theo chu vi × `.18`, V theo cao độ × `.23`, normal strength `.85`. Ruin UV là face projection metric × `.42`, normal `.45`. Đảo khác giữ **tỉ lệ vân**, không buộc seam 192 hoặc hình dáng y hệt.
- Hình học hữu hạn, solids đóng/hướng ra ngoài, mép nối không hở; base/root dùng BVH/contact. RNG cục bộ cho nhóm mới, không đổi chuỗi RNG của props hiện có.

## 4. Metadata và batching: không được đánh mất

| Trường | Giá trị / ý nghĩa |
|---|---|
| `kit` | ID trên mesh kit; viewer nhận diện hoa qua các ID trên |
| `kitAsset` | ID trên bản đặt ở đảo; phục vụ source/placement |
| `waterKind` | `pool`, `stream`, `fall`; chọn shader đúng từng loại |
| `effectKind` | Empty `lantern`, `waterfall-spray`, `shrub-fireflies` |
| `satelliteRole`, `islandId` | Phân loại và đối chiếu đảo nhỏ/đá bay |
| `detailKind` | Phân loại props/chi tiết trong kiểm tra nguồn |

Exporter dùng `export_extras=True`, không xuất animation/camera/light. `prepare()` phải đọc anchors **trước batching**, qua `getWorldPosition`; clone geometry và áp matrix world, batch theo material/kind/attributes. Mesh hiện dùng một material; nếu nhập mesh nhiều material, cần xử lý nhóm trước, không mặc định loader hỗ trợ mọi mô hình.

Tên material cũng đang là một phần hợp đồng của viewer (`folded broad leaves`, `blades`, `lantern warm glass`...). Đừng đổi tên vô tình. Nếu tổng quát hóa cho các đảo khác, thay nhận diện bằng metadata có chủ đích và test tương thích, không refactor chung ngay trong một worker chỉ làm hình khối.

## 5. Phần nằm trong GLB và phần phải tích hợp vào engine

| GLB/Blend tĩnh có | Runtime phải cung cấp |
|---|---|
| Mesh, vertex colors, normals, UV, texture đóng gói | Gió bám gốc, chỉnh normal hai mặt, transmission mỹ thuật của tán |
| Hồ/suối/thác và waterKind, thông số PBR fallback | Phản xạ/khúc xạ, độ sâu, ripple, dòng thác và fade |
| Đèn có kính màu, metadata anchor; emission nguồn tắt | Point light ban đêm, emission kính, halo |
| Anchor bụi rậm và thác | Đom đóm, tia/giọt/sương, màu/độ sáng theo ngày đêm |

Import GLB một mình không tái tạo được preview. Khi dùng engine khác cần port hợp đồng thị giác, không nhất thiết chép nguyên Three shader. Nước có 1 bed/scene capture và 1 reflection capture dùng chung cho pool/stream/fall; update phải khôi phục target, viewport, scissor, visibility, shadow update, XR kể cả khi lỗi. Từng kind có material riêng.

Effects thuộc root đảo, dùng cùng clock. Root ẩn không chiếu đèn vào reference/kit hoặc nửa so sánh khác. `dispose()` dọn Points/instanced ribbons/material/texture/render targets đúng một lần. Bounding box phải gồm vị trí particle động để camera không cắt plume.

Chuyển động khởi đầu tắt; nút bật/dừng điều khiển cả gió, nước, đom đóm. Hidden tab dừng RAF; khi reduced motion thay đổi sang reduce thì dừng. User vẫn có thể chủ động bật; không mô tả đây là khóa animation tuyệt đối. Night selector không tự bật motion.

## 6. Rig tham chiếu và thông số v18

- Orthographic camera, ACES Filmic, exposure 1.05, sRGB output, pixelRatio cap 1.5; shadow PCF 4096. Đây là rig đánh giá của preview, chưa phải tối ưu cuối cho game.
- Ngày: sun 3.1 / hemi 2.5 / fill .55. Chiều: sun 3.4 / hemi 2.2 / fill .55. Đêm: sun .72 / hemi .7 / fill .20, daylight factor .14. Màu và camera chi tiết ở `viewer.js`; dùng cùng preset khi so sánh.
- Đèn: vị trí Blender `(-1.65,2.35,ground)`, cao 2.76, rộng mái 1.30, đế 1.14; point light `#ffcc75`, intensity 26, distance 22, decay 1.4. Kính sRGB `#e3a34b`, emissive `#ff9c32`/.85. Đèn hiện không có point-shadow riêng.
- 26 đom đóm quanh đèn và 6 × 3 quanh bụi, chỉ đêm. Thác có 92 instance ribbon, 300 giọt và 76 mist sprites. Toàn bộ dùng deterministic phases và shader clock; không thêm vòng RAF riêng.
- Thông số kích thước/intensity chỉ đúng với đơn vị và tone mapping hiện tại. Khi đổi scale/engine, dùng ảnh đã duyệt để cân lại; không coi intensity 26 là thông số vật lý dùng được mọi nơi.

## 7. Ranh giới sẵn sàng

Mẫu đã sẵn sàng làm **chuẩn mỹ thuật và nguồn dựng**, chưa được chứng nhận ngân sách production: khoảng 40,8 MB / 2,04 triệu tam giác, chưa LOD/collider/navmesh/compression hay benchmark điện thoại thật. Các kiểm tra ở 390 px là layout/render mô phỏng desktop, không phải số FPS điện thoại.

Trước tích hợp nhiều đảo: xác định số đảo cùng hiện, thiết bị mục tiêu, memory/draw calls/frame time; chọn batching/instancing/LOD/texture budget bằng đo đạc, giữ mẫu v18 để so chất lượng. App integration là một việc riêng và phải tuân theo AGENTS.md cùng các gate liên quan; tài liệu này không cho phép tự deploy hay thay asset hàng loạt.
