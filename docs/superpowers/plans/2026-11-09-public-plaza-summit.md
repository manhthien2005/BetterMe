# Public Plaza Summit Implementation Plan

> Argon 4 triển khai tuần tự trong worktree Environment V1. Sol review kỹ thuật và owner nghiệm thu mẫu. Dùng workflow một agent theo `AGENTS.md`, TDD cho các hành vi mới và Playwright CLI của repo cho QA hình ảnh.

**Mục tiêu** — Dựng mẫu Plaza trên đỉnh núi theo concept đã duyệt, với biển sương, chân trời xa và ánh nắng theo vị trí mặt trời TP.HCM.

**Kiến trúc** — Thay backdrop và sky riêng của Plaza. Giữ geometry cảnh gần theo tọa độ world và lớp bầu trời theo hướng nhìn. Một snapshot điều khiển màu, mây và hướng nắng cho cả trời lẫn đèn.

**Stack** — Next.js, React, Three.js/R3F, TypeScript, Vitest, `pnpm browser`. Dùng các dependency và hệ thống thời gian/thời tiết hiện tại.

**Spec** — `docs/superpowers/specs/2026-11-09-public-plaza-summit-design.md`. Đọc kèm `docs/superpowers/specs/2026-11-07-world-environment-v1-spec.md` về giờ, thời tiết và preview. Ảnh owner đã duyệt ở `output/world-plaza-summit-2026-11-09/reference/plaza-dawn-approved.png`.

## Checkout và các điều kiện cố định

- `D:\Dev\Projects\BetterMe\.worktrees\reading-quest-environment-v1`, nhánh `feat/reading-quest-environment-v1`, HEAD quan sát `e0a9108012323a1abcab2a2333f0d60dcc8ebb29`. Phần `/world` chủ yếu untracked. Ghi trạng thái đầu/cuối và đối chiếu cả file untracked. `next-env.d.ts` có thể đổi theo phiên Next. Giữ công việc hiện có trong checkout.
- Lưu baseline camera và vị trí spawn từ `PUBLIC_PLAZA_CAMERA_ORBIT_CONFIG` và `PUBLIC_PLAZA_MAP_CONFIG` trước khi sửa. Giữ default distance `11.8`, pitch `0.25`, FOV `46`, zoom/pitch bounds, input, occlusion, map bounds, physics, props gameplay và route auth. `camera.far` hiện `140`. Bố cục/geometry mới phải vừa miền nhìn hiện tại.
- Cảnh mới áp dụng ở `public_plaza`. Dùng scope Plaza đã có cho sky và backdrop. Snapshot của Personal World tiếp tục dùng ánh sáng trước đó. Mưa nhìn thấy được là hạng mục riêng sau khi duyệt mẫu cảnh. Giữ no-guilt/no-decay, bảo toàn source, chỉ commit/push theo chỉ định của owner.

## A. Lấy baseline và dựng sườn núi

**File** — `src/components/world/world-scene.tsx` tại `PublicPlazaPerimeterBackdrop` và `WorldGround`. Tách thành `src/components/world/public-plaza-backdrop.tsx` nếu cần một component sở hữu geometry/material rõ ràng.

- [ ] Chụp baseline tại spawn với cùng avatar và ở góc xoay thấy mép sân. Ghi URL, browser/GPU, viewport, DPR, mode, preset và mốc lộ trình chạy. Lưu riêng dưới `output/world-plaza-summit-2026-11-09/baseline/`. Sử dụng dev server đúng checkout và phiên QA cô lập theo Playwright skill. Giữ phiên dev đang dùng của owner.
- [ ] Thay vành đồi hiện tại bằng vách đá nối sát mặt sân, có chân chìm dưới dải sương. Vách và cảnh xa là hình ảnh ngoài vùng chơi, không thay collider hiện có. Dùng các nhóm núi world-space tĩnh, cắt silhouette thành lớp rõ ràng và giảm chi tiết theo khoảng cách. Đặt mái tháp xa lệch trục cổng. Dùng mesh thấp hoặc sườn đá ở rìa để vùng đi lại vẫn dễ đọc và tránh đường chân đế cắt ngang khung hình.
- [ ] Thử riêng tầng sương thấp với geometry/texture hoặc shader lớp mỏng. Giữ độ trong suốt và số lớp có giới hạn, kiểm tra thứ tự độ sâu khi xoay và zoom. Phân biệt sương thung lũng với sương xa áp lên dãy núi. Giữ scene fog đủ xa để thấy cổng/NPC. Gộp các cụm nền tĩnh khi hợp lý, bỏ cast shadow ở cảnh xa và dispose tài nguyên theo vòng đời của component.
- [ ] Chụp ảnh blockout ở góc spawn và góc xoay ngang. Đi sát biên đã cho phép và xoay/zoom hết giới hạn để phát hiện đường nối, mảng lộ sau núi, fog band cắt ngang và clipping. Sửa bố cục cảnh trên camera hiện tại. Chỉ chuyển bước khi từ spawn thấy được một phần sườn núi hạ xuống biển sương.

## B. Dựng bầu trời và mây cao

**File** — nhánh `PublicPlazaSkyEnvironment` trong `src/components/world/world-sky-environment.tsx`. Nếu cần texture mây vẽ, đặt asset gốc ở `public/models/world/plaza/`, ghi nguồn và dung lượng trong bàn giao.

- [ ] Giữ gradient theo hướng nhìn, đặt nền trời đi theo camera với orientation cố định theo trục world và nằm trong far clip. Tạo lớp mây có đường viền bất đối xứng và chuyển sắc mềm. Dùng ít lớp mây xa và dải mây mỏng, để bầu trời có khoảng trống ở góc nhìn chính. Texture chỉ chứa hình mây hoặc độ trong suốt, để màu thay đổi được theo snapshot.
- [ ] Điều khiển độ phủ và sắc mây từ weather snapshot. Dừng chuyển động trang trí khi reduced motion bật. Giữ mây xa ổn định khi nhân vật đi qua sân. Kiểm tra xoay đủ vòng và chuyển map để phát hiện seam, cảnh nháy, cloud overdraw và tài nguyên tồn đọng.
- [ ] So góc spawn trước/sau trên desktop và viewport hẹp. Ghi tên/kích thước texture, số lớp mây/sương và chênh lệch draw calls. Cảnh phải đọc được độ cao ngay cả khi mặt trời ngoài khung.

## C. Đồng bộ vị trí mặt trời và hướng bóng

**File** — tạo `src/lib/world/solar-position.ts` và `solar-position.test.ts`. Nối `src/lib/world/environment-model.ts`, `environment-v1.test.ts` và nhánh Plaza trong `world-sky-environment.tsx`.

**Interface** — `resolvePlazaSolarPosition(utcMs: number): PlazaSolarPosition` với `{ azimuthRad, elevationRad, direction: readonly [number, number, number] }`. Azimuth đo theo chiều kim đồng hồ từ Bắc. Vector world là `[sin(azimuth)*cos(elevation), sin(elevation), -cos(azimuth)*cos(elevation)]`. `EffectiveEnvironmentSnapshot` nhận `plazaSun: PlazaSolarPosition | null`, với `null` cho Personal World.

- [ ] Viết test RED cho buổi sáng, trưa, chiều và đêm theo giờ TP.HCM trên ngày cố định. Với `2026-11-09`, test `07:30` có `direction.x > 0`, `16:30` có `direction.x < 0`, `12:00` có elevation cao hơn hai thời điểm đó và `22:00` thấp hơn chân trời. Kiểm tra hai ngày thuộc hai mùa cho hướng mọc khác nhau, vector đơn vị hữu hạn, đầu vào từ ngày preview và cùng kết quả khi máy ở múi giờ khác. Thêm đối chiếu số ở một fixture độc lập theo [công thức NOAA](https://www.gml.noaa.gov/grad/solcalc/solareqns.PDF) để bắt sai dấu kinh độ và sai đổi độ/radian.
- [ ] Tính solar position bằng TypeScript thuần từ UTC epoch và tọa độ TP.HCM sẵn có, cập nhật khi snapshot thời gian đổi. Nối epoch thật và epoch preview qua `resolveEffectiveEnvironmentSnapshot`. Dùng phase hiện tại cho palette, label và độ sáng nền. Đĩa mặt trời ẩn theo elevation khi dưới chân trời. Giữ ánh sáng đêm đủ đọc cảnh. Quỹ đạo trăng tiếp tục là mỹ thuật.
- [ ] Dùng vector snapshot cho hướng đĩa mặt trời và quầng sáng trong lớp trời theo camera. Đặt đèn theo `target + direction * distance`, với target/shadow frustum phủ vùng sân. Giữ sun disk và đèn dùng cùng vector trong mỗi frame nếu làm mượt. Không đổi nguồn thời tiết, cache hay clock schedule. Mây/mưa điều chỉnh độ sáng trực tiếp; hướng nắng phụ thuộc ngày giờ.
- [ ] Chạy focused test và kiểm tra hình ảnh từ cùng vị trí quanh đài phun nước. Chụp một góc nhìn về Đông buổi sáng và về Tây buổi chiều. Đối chiếu hướng bóng trên sàn ngược với hình chiếu hướng mặt trời, giữ frame đủ thấy cả vật và bóng. Kiểm tra qua ranh giới giờ, thoát preview, offline và đổi Plaza → Personal World → Plaza.

## D. QA và giao mẫu

- [ ] Chụp góc spawn cố định cho bình minh, trưa, hoàng hôn, đêm và mưa. Chụp thêm góc xoay thấy vách đá và biển sương dưới sân. Quay một clip ngắn từ spawn tới mép vùng chơi, xoay/zoom gần cổng và đặt lại camera bằng `R`. Dùng cùng preset giữa ảnh đối chứng khi so thay đổi.
- [ ] Đo trước/sau bằng cùng lộ trình và trạng thái HUD, sau warm-up, cùng browser/GPU/DPR. Lặp ít nhất ba lượt trên cấu hình mục tiêu nếu có. Ghi frame interval p95/p99, số lần trên 50 ms, draw calls/triangles, lượng tải asset mới và phần tải map đo riêng. Báo hạn chế nếu chỉ đo được trên cấu hình khác. Render theo nhịp trình duyệt và giữ mục tiêu gần 60 FPS ổn định đã chốt.
- [ ] Chạy test tập trung cho solar, environment, camera và shell, rồi `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`. Kiểm tra process của chính checkout trước build và tuân thủ quy tắc dừng dev. Ghi kết quả từng lệnh và những phần còn cần thử trong phiên owner.
- [ ] Self-review riêng trước khi bàn giao. Đối chiếu ảnh concept và spec tại góc camera thật, kiểm tra trạng thái Personal World và file ngoài phạm vi. Trả report ngắn, ảnh, clip, bảng before/after và log vào `output/world-plaza-summit-2026-11-09/`. Dừng ở mẫu Plaza để Sol review và owner nghiệm thu.
