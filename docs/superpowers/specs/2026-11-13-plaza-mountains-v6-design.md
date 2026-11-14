# Plaza — tích hợp bộ núi V6

Owner yêu cầu thay bộ núi cũ bằng V6, bố trí bao quanh vừa đủ, tối ưu và kiểm visual để preview. Thực thi ngay trong worktree Plaza đang có; owner giao agent quyết định vị trí. Không hỏi lại duyệt asset hay bố cục trước khi làm bản xem.

## Phạm vi và lựa chọn

Nguồn `D:/Dev/Projects/BetterMe/output/rock-mountains-v6/`: 10 GLB đã qua QA, 10.741.212 bytes. Giữ nguyên file nguồn và hình/màu; copy byte-identical vào `public/world/mountains/`. Thay cả `/world` và `/world?plaza=study`, bỏ đường runtime mẫu Vân Sơn 05 riêng. Giữ các đảo bay, kiến trúc, camera, điều khiển, sương và môi trường hiện có.

Agent chọn 16 placements (4 gần/4 trung/8 xa), thay 31 vị trí cũ và 5 vị trí study. Giữ 31 sẽ lặp nhiều và tăng tải; chỉ đổi asset tại vị trí trial thì không bao quanh. 16 cụm cho đủ mười dáng, cả phía sau, với khe trời và các lớp so le. Đây là lựa chọn bố cục của agent, cần owner xem preview.

- Gần khoảng 220–285m, bốn mẫu tự nhiên và uniform scale khoảng 2,8–3,6; có vách/rêu/cây khi nhìn về mép.
- Trung khoảng 400–490m, bốn mẫu dùng scale phù hợp để khung núi lùi sau đảo bay. Công trình chỉ ở lớp này.
- Xa khoảng 650–820m, tám vị trí từ hai model xa nhẹ; độ cao và bearing không đều. Giữ tuyết chọn lọc trên mặt đá xa theo hợp đồng môi trường cũ, không phủ cây/công trình hoặc núi gần.
- Geometry toàn bộ placements <600k triangles, file <12MB, không thêm shadow/reflection/texture/dependency. Batching/instancing theo model, opaque depth và haze theo môi trường; lá giữ normals hai mặt của kit V6.
- Dùng band/ID explicit, không suy ra band từ thứ tự manifest. Bounding envelope nằm trong sky/camera và ngoài vùng đi được; tránh chạm bảy đảo đã đặt.

## Nghiệm thu

Focused tests: hash/bytes/triangles từng asset, 10 ID/3 band/16 placements, uniform scale, vùng an toàn/sky, đủ vòng quanh có khe, tuyết theo role, foliage shader, opaque depth, partial failure và late disposal. Study/normal dùng cùng bộ núi.

Browser: baseline trước thay; toàn cảnh, đi bộ/spawn/mép, quay đủ bốn hướng, cận một núi gần, ngày/chiều/đêm/mưa, mobile 390×844; ba vòng personal↔Plaza không tăng GPU resources; lỗi tải một model vẫn giữ cảnh. Đo frame time/counters trong cùng thiết bị/camera và tách chi phí núi; không coi viewport mobile là FPS điện thoại thật.

Baseline study ngày 1440×1000: 3 model/5 placements, 246 geometry/86 texture, 291 draw calls và ~10,69M triangles trong counter toàn scene. 90 RAF samples median115ms/p95~140ms trong browser automation hiện tại. Những đảo bay chi tiết cao vẫn ngoài phạm vi tinh chỉnh này; không tuyên bố toàn Plaza đạt60fps.

Sau QA: dừng đúng dev process của worktree, chạy bốn gate, tự rà riêng, restart loopback3004 bằng dev-auth bypass và mở preview. Không commit/push/deploy.


## Owner correction — cylindrical Cổng Mây, 2026-11-13

Owner supplied the lecture-court view and requested fixing the two straight cylindrical masses, then capturing all surrounding directions. Original upper widths were 83–89% of shoulder widths; low placement hid lower mass in valley haze. Raising/rotating alone was insufficient. Cổng Mây alone now uses a derived upper-rock mesh: narrowed shoulders/crest, asymmetric inclined tops; original lower12.3m, all tree/shrub/fern/ruin geometry and transforms stay exact. Ivy and upper loose rocks follow the same spatial mapping. Original V6 directory remains immutable; nine other runtime models remain byte-identical.

Placement Cổng Mây: same bearing176°/radius420m; base -50 (was -60), uniform scale5 (was5.2), turn+.1 (was-.2), showing more connected lower shelves. Same41,880 triangles, no added runtime work. Per-model manifest records derivative hash and parentSha256. The former byte-identical runtime rule is amended only for this owner-requested correction. Full collection remains below12MB and600k placed triangles.

Acceptance: broad crests (>4m), upper width/shoulder width <.72 for both lobes; exported closed oriented solids and lower-support/plant preservation; actual same-camera comparison plus eight eye-level/eight elevated captures, day/dusk/night/mobile. Evidence in `output/mountain-v6-silhouette/`. Geometry tests support but do not replace visual review.
