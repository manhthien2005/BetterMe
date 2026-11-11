# Kế hoạch hoàn thiện bản dựng thô Public Plaza Summit

> Bàn giao cho Argon 4. Triển khai tuần tự trên worktree `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`, nhánh `feat/reading-quest-environment-v1`. Dùng hiện trạng sau A–D làm mốc trước khi sửa. Owner duyệt bố cục trực tiếp trong game trước lượt hoàn thiện vật liệu và chi tiết.

**Mục tiêu** — Từ góc spawn mặc định của `/world`, người chơi nhận ra sân nằm trên đỉnh núi, thấy sương trong thung lũng phía dưới và có khoảng nhìn mở đến chân trời.

**Kiến trúc** — Vách và núi là geometry tĩnh. Dùng các lớp sương, mây và ánh sáng hiện có để đọc được chiều sâu. Tận dụng cách gộp geometry hiện có và hướng mặt trời lấy từ snapshot môi trường.

**Stack** — Three.js/R3F, TypeScript, Vitest, Playwright qua `pnpm browser`.

**Tài liệu** — [Spec Summit](../specs/2026-11-09-public-plaza-summit-design.md) · [Kế hoạch A–D](2026-11-09-public-plaza-summit.md) · [Concept 07:30](../../../output/world-plaza-summit-2026-11-09/reference/plaza-dawn-approved.png) · [Preview Sol tại spawn](../../../output/world-plaza-summit-2026-11-09/sol-preview-spawn.png) · [Preview Sol sát mép sân](../../../output/world-plaza-summit-2026-11-09/sol-preview-rim.png) · [Báo cáo A–D](../../../output/world-plaza-summit-2026-11-09/report.md)

## Hiện trạng cần sửa

- **Chân trời chật.** `createCraggyPeakGeometry` trong `public-plaza-backdrop.tsx` xuất phát từ `ConeGeometry` cho cả các nhóm núi. Ở spawn, các đỉnh nhọn lặp lại và chiếm nhiều khoảng trời. Khoảng xa giữa các lớp khó đọc.
- **Độ cao khó nhận ra.** Bậc rìa phía Bắc có mặt trên từ khoảng −0,05 đến −0,55 m. Hai vành sương gần có đỉnh khoảng −0,70 và −0,62 m so với mặt sân. Từ vị trí chơi, tổ hợp này đọc như một dải trắng bám mép đá. Cần đánh giá độ tách lớp trong khung hình sau khi sửa, kể cả khi vị trí Y đã thấp hơn trên source.
- **Khoảng nhìn bị ngắt.** Cổng và đài phun nằm trên trục giữa, nên cần mở đường nhìn ở một bên cổng bằng bố cục cảnh nền. Ở 390 × 844 HUD đang che nhiều cảnh. Ghi riêng hiện tượng này khi kiểm tra mobile để phân biệt vấn đề bố cục cảnh và vấn đề HUD.

## Phạm vi

- File chính là `src/components/world/public-plaza-backdrop.tsx`. Chỉ xét nhánh Plaza trong `world-scene.tsx` nếu cần nối mặt sân với vách. Chỉ xét nhánh Plaza trong `world-sky-environment.tsx` nếu độ tương phản hoặc mây cao còn làm mất đường chân trời sau khi đã sửa địa hình.
- Dùng camera và spawn đang có trong `src/lib/world/map-config.ts`, cùng FOV 46, pitch mặc định 0,25, distance 11,8 và `far = 140` trong cấu hình hiện tại. Dùng vị trí cổng, đài phun, NPC và giới hạn di chuyển hiện hành làm điểm cố định để bố trí cảnh. Kiểm tra nhánh hình ảnh riêng của Personal World khi đi qua cổng và quay lại.
- Mốc này duyệt hình dáng, bố cục và chiều sâu với vật liệu phẳng, bảng màu hiện có và dependency hiện có. Texture hoàn thiện, thay đổi HUD, trang trí chi tiết và mưa nhìn thấy được thuộc các lượt sau.

## 1. Lưu mốc và dựng lại bố cục

- [ ] Chụp mốc trước tại `/world`, camera reset, desktop 1440 × 1000, DPR 1, ngày TP.HCM 2026-11-09 lúc 07:30, ít mây 42%, HUD hiện bình thường và đóng bảng preview. Lưu thêm góc sát mép và đường đi tái lập.
- [ ] Tạo một khoảng mở đọc được bên cạnh cổng. Dựng vách gần như một sườn đá liên tục bám mép sân, có mặt vách nhìn thấy khi đứng sát rìa. Đặt sương thấp và lùi đủ để có khoảng rơi nhìn thấy trước khi vách chìm vào sương.
- [ ] Tạo silhouette núi bất đối xứng bằng vài sống núi nối tiếp và các khoảng yên ngựa, với tỷ lệ khác nhau giữa các lớp. Dùng lớp gần rõ nét, lớp giữa nhô khỏi sương, lớp xa thấp và giảm tương phản để nhường khoảng trời. Kiểm tra bằng mắt khi đi ngang sân để lớp xa dịch ít hơn mép vách gần.
- [ ] Tự duyệt ảnh spawn trước khi tinh chỉnh những hướng còn lại. Nếu giới hạn camera khiến tiêu chí không thể đạt qua bố cục cảnh, gửi hai ảnh cùng camera thể hiện phương án tốt nhất và điểm vướng để Sol xem cùng owner. Mọi đề xuất đổi camera, spawn hoặc vùng chơi là quyết định riêng của owner.

## 2. Kiểm tra và bàn giao

- [ ] **Tiêu chí chính ở 07:30, camera mặc định.** Trong cùng khung spawn có một đoạn mép/vách đi xuống, một khoảng sương đọc được là dưới cao độ sân và ít nhất hai lớp núi phân biệt được trước chân trời mở. Cổng và đường đi dễ nhận ra. Núi xa đọc thành sống núi, với khoảng trời nhìn thấy bên trên. Đĩa mặt trời có thể nằm ngoài khung theo hướng tính từ giờ TP.HCM.
- [ ] **Tiêu chí khi chơi.** Đi sát một mép có thể tiếp cận, lia đủ vòng và thử hai đầu zoom. Kiểm tra vách tiếp giáp mặt sân, clipping, khe hở, biên lớp sương và chân trời. Chụp cùng góc spawn lúc 17:30 để kiểm tra độ tách lớp khi ánh sáng đổi, và chụp 390 × 844 ở 07:30 với HUD thật.
- [ ] Đo bản trước và sau sửa trên cùng browser, thiết bị, DPR, preset, warm-up và đường đi. Dùng lộ trình trong báo cáo A–D, ba lượt mỗi bản nếu đủ điều kiện. Ghi p95/p99 frame interval, số khung >50 ms, draw calls và triangles. Nếu chênh lệch lặp lại, ghi rõ vị trí và nguyên nhân trước khi bàn giao.
- [ ] Chạy `pnpm vitest run src/lib/world/world.test.ts src/lib/world/environment-v1.test.ts src/lib/world/solar-position.test.ts src/components/world/world-client-shell.test.tsx`, `pnpm typecheck` và `pnpm lint`. Ghi kết quả. Nếu chạy build, dừng đúng dev process của checkout trước theo AGENTS.md. Commit và push theo ủy quyền của owner.
- [ ] Lưu bằng chứng ở `output/world-plaza-summit-2026-11-09/blockout-revision/`: ảnh trước/sau cùng khung spawn, ảnh sát mép, ảnh 17:30 và mobile, một clip ngắn từ spawn ra mép sân có xoay camera, và báo cáo ngắn gồm file sửa, kết quả đo và tiêu chí còn vướng. Sol review kỹ thuật, owner duyệt bố cục trong game.
