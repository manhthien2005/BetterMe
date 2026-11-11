# Environment V1 Stability and Public Plaza Implementation Plan

> Argon 4 thực thi theo thứ tự bên dưới. Sol review source và bằng chứng. Owner nghiệm thu từng mốc. Áp dụng TDD cho hồi quy logic theo `AGENTS.md` và dùng Playwright của repo để kiểm tra `/world`.

**Mục tiêu** — Sửa đồng hồ lúc tải trang, làm số đo FPS đáng tin, thử giảm chi phí bóng đổ và dựng mẫu Public Plaza có chiều sâu với camera dễ khám phá.

**Kiến trúc** — Một mốc thời gian từ server khởi tạo snapshot chung của HUD và Canvas. Đo nhịp khung hình từ vòng R3F hiện có. Tách thay đổi hiệu năng khỏi thay đổi cảnh để đo trước/sau. Miền góc nhìn của Public Plaza được thử cùng bầu trời và vành cảnh nền.

**Stack** — Next.js 16.4.3, React, TypeScript, Three.js/R3F, Vitest và Playwright CLI qua pnpm.

**Tài liệu** — `docs/superpowers/specs/2026-11-07-world-environment-v1-spec.md` §2, §4–6. Đọc `output/world-environment-audit-2026-11-08/report-addendum.md` cùng phản biện Sol. Các kết quả stress là cơ sở chọn ứng viên thử.

## Điểm xuất phát và phạm vi

- Checkout `D:\Dev\Projects\BetterMe\.worktrees\reading-quest-environment-v1`, nhánh `feat/reading-quest-environment-v1`, HEAD quan sát `e0a9108012323a1abcab2a2333f0d60dcc8ebb29`. Source `/world` còn untracked, vì vậy ghi lại `git status --short --untracked-files=all` và xem cả các file untracked. Bảo toàn các thay đổi đã có của owner và các audit artifacts.
- Giữ no-guilt, no-decay, xác thực `/world`, nguồn thời tiết TP.HCM, freshness/offline, snapshot chung và preview tách biệt live. Giữ baseline nhân vật gồm model, pose, springs và tốc độ đi/chạy. Mưa V1 dùng màu trời, mây và ánh sáng.
- Dùng nhịp render tự nhiên của trình duyệt. **Khoảng 60 FPS ổn định là mục tiêu nghiệm thu trên cấu hình mục tiêu**. Các màn hình chạy nhanh hơn vẫn dùng nhịp sẵn có. Vòng này ưu tiên cải thiện frame time và các lần khựng; FPS cap, thiết lập đồ họa tự động, cải tổ HUD thời tiết và đo lưu lượng nằm ngoài phạm vi.
- Mọi thay đổi ảnh hưởng source world được review trong worktree này. Quyền commit/push thuộc owner. Giữ phiên dev của owner. Chỉ chạy build sau khi dev process của checkout đã dừng theo `AGENTS.md`. Báo kết quả production là chưa xác minh nếu phiên dev cần tiếp tục chạy.

## Mốc A — Đồng hồ, đo FPS và thử bóng đổ

### A1. Sửa hydration qua ranh giới phút

**File** — `src/app/world/page.tsx`, `src/components/world/world-client-shell.tsx`, `src/components/world/use-world-environment.ts`, `src/app/world/page.test.tsx` và `src/components/world/world-client-shell.test.tsx`. Có thể đặt test hồi quy hydrate riêng ở `src/components/world/use-world-environment.test.tsx` nếu fixture hiện có khó kiểm soát thứ tự SSR/hydrate.

- [ ] Viết regression render server lúc `2026-11-08T15:18:59.950Z`, hydrate lúc `15:19:00.050Z` cùng initial props. Dùng forecast đang chờ để chứng minh render đầu khớp `22:18`, đồng hồ sang `22:19` ngay sau mount và không có `onRecoverableError`. Chạy test trước khi sửa và lưu lỗi tái hiện.
- [ ] Truyền `initialNowMs: number` lấy phía server tại lúc dựng shell sau bước auth/bootstrap ở cả nhánh authenticated và dev bypass. Nối prop tới `useWorldEnvironment({ isPersonalSpace, initialNowMs })` và khởi tạo `useState(initialNowMs)`. Đồng bộ `Date.now()` trong effect lúc mount ngay trước khi refresh thời tiết, độc lập tốc độ request. Cập nhật các test gọi shell với mốc cố định.
- [ ] Chạy focused test cho route, shell và environment. Kiểm tra preview/thoát preview, thời gian vẫn cập nhật khi forecast chậm hoặc offline, và đổi không gian dùng snapshot chung. Kiểm tra console khi reload `/world`; lưu bằng chứng đối với hydration của đồng hồ.

### A2. Hiển thị nhịp FPS theo vòng render hiện có

**File** — `src/components/world/world-scene.tsx`, `src/components/world/world-performance-hud.tsx`, `src/components/world/world-client-shell.test.tsx` và một test logic đặt cạnh module đo nếu cần.

- [ ] Dùng `delta` của `PlayerRig.useFrame` để tích lũy số khoảng frame và tổng thời gian trong cửa sổ khoảng một giây, tính FPS bằng số khoảng chia tổng giây và frame time bằng tổng ms chia số khoảng. Đây là nhịp vòng R3F; giữ nhãn phân biệt với thời gian GPU. Dùng refs cho hot path và một điểm công bố sample cho HUD. Giữ các trường debug hiện có mà script audit đang đọc.
- [ ] Đưa các khoảng chậm `>=250ms` vào phép đo khi tab visible. Xóa cửa sổ cũ khi tab ẩn/quay lại và bỏ khoảng đầu tiên đi qua lần resume. Hiển thị `—` trước sample đầu tiên hoặc khi sample hết hạn, thay giá trị khởi tạo 60. Gỡ RAF fallback của HUD. Giữ chip hiển thị khi popover đóng bằng một cập nhật gọn khoảng mỗi giây; thu thập các trường chi tiết khi bảng mở. Gỡ nhãn `FPS thấp nhất (Rolling)` ở HUD nếu field vẫn là giá trị hồi phục theo frame. p95/p99 lấy từ benchmark, tránh thêm lịch sử dài vào HUD.
- [ ] Chứng minh bằng test hồi quy cụ thể rằng sample chậm visible được tính, khoảng tab ẩn được bỏ và nút HUD vẫn có trạng thái đọc được trước/sau khi đủ mẫu. Kiểm tra mở, đóng, Escape, unmount và tab resume bằng phiên QA. Đo FPS với cùng trạng thái popover ở cả baseline và candidate.

### A3. Thử một nhóm bóng đổ nhỏ ở Public Plaza

**File** — `src/components/world/world-scene.tsx` nếu ứng viên đạt; scripts và bằng chứng đo dưới `output/world-environment-fix-2026-11-09/`.

- [ ] Lấy baseline sau A1/A2 và trước thay đổi shadow. Dùng cùng route có đi/chạy/xoay camera, cùng preview, viewport, buffer/DPR, browser và GPU. Bắt đầu tại spawn, làm ấm sau mỗi lần đổi biến và xác nhận các mốc trên route bằng vị trí/góc camera. Đo ít nhất ba cặp trước/sau trong cấu hình mục tiêu nếu truy cập được, ghi từng lượt và khoảng dao động. Khi cần stress test, giữ nó thành bảng riêng. Ưu tiên phiên QA cô lập, dùng `pnpm browser` theo skill repo.
- [ ] Thử một treatment tắt `castShadow` cho ba tấm nhỏ của biển chỉ đường, tán phụ của cây và vật trang trí nổi trên đài phun nước ở Plaza. Giữ bóng của thân cây, cổng, sàn và nhân vật để kiểm tra cảm giác có trọng lượng. Thử trước qua diagnostic runtime có kiểm tra đúng đối tượng hoặc patch tạm có kiểm soát trong phạm vi các mesh này. Tránh dùng tắt toàn bộ shadow pass làm số liệu thay thế cho ứng viên.
- [ ] Giữ thay đổi nếu cải thiện lặp lại vượt dao động baseline ở frame time hoặc chi phí render, ảnh so sánh sáng/đêm giữ được bố cục và độ đọc cảnh, và đuôi frame time không xấu đi rõ rệt. Nếu lợi ích chìm trong nhiễu, trả evidence và bỏ đúng phần thử của mình. Giữ lựa chọn chất lượng bóng cho vòng sau nếu thực tế cần tới.

**Bảng nghiệm thu hiệu năng** — Ghi loại phép đo (nhịp R3F hoặc RAF proxy), FPS trung bình, p95/p99 khoảng frame, số lần trên 50 ms và 100 ms theo cùng thời lượng, tỷ lệ thời gian rơi vào stall, draw calls/triangles và GPU timer nếu công cụ hỗ trợ. Với màn 60 Hz, so khoảng frame với mốc khoảng `16,7 ms` và xem độ đều khi chạy/xoay camera; với màn nhanh hơn, ghi tần số đo thật. Báo tên browser/GPU/viewport/DPR, dev hay production, dữ liệu gốc theo từng lượt và ảnh before/after. Chỉ xác nhận đạt cấu hình mục tiêu sau khi đo ở cấu hình đó.

## Mốc B — Mẫu Public Plaza để owner duyệt

### B1. Sửa giới hạn va chạm rồi chỉnh góc ngắm cảnh

**File** — `src/lib/world/camera.ts`, `src/lib/world/world.test.ts`, `src/lib/world/map-config.ts` và phần chọn camera occluders trong `src/components/world/world-scene.tsx` nếu cần. Giới hạn thay đổi cấu hình góc nhìn vào Public Plaza trong mẫu này.

- [ ] Thêm test RED cho hai ca đã tái hiện trong review. Ca 1 target `(0,1,0)`, hướng `(0,0,1)`, distance `6`, tường `x[-2,2], z[1,4], maxY=3`. Khoảng cách an toàn phải ở trước `z=1`, hiện trả `2,4`. Ca 2 cùng target, hướng `(0,0.4,√0.84)`, distance `16`, tường `x[-2,2], z[1,2], maxY=3`. Tia cắt tường trước `1/√0.84` dù camera đích nằm cao hơn mái. Thêm hồi quy kéo vào ngay và trả ra mượt khi vật cản rời khỏi tia.
- [ ] Dùng giao tia với collider theo cả ba trục để lấy khoảng an toàn thực tế. Giới hạn bởi giao điểm gần nhất trừ khoảng đệm có tính near plane, cho phép gần hơn khoảng zoom do người chơi chọn khi tránh va chạm. Theo dõi khoảng cách thực tế trong `CameraRigState`; giảm tới ngưỡng an toàn ngay trong frame, tăng dần khi đường nhìn mở lại. Xử lý riêng trường hợp target nằm trong collider do smoothing; kiểm tra lại reset `R` và chuyển map để tránh dùng khoảng cách cũ.
- [ ] Kiểm tra cổng ở góc đi sát và nhìn ngang. Nếu dầm/cột có hình nhìn thấy nhưng thiếu collider camera, thêm blocker dành riêng camera dựa trên geometry cổng, giữ player đi qua lối mở. Chọn pitch/zoom theo framing của mẫu, với default nhìn thấy avatar, lối đi và một phần chân trời. Kiểm tra desktop và viewport hẹp ở tâm sân, sát biên và khi orbit. Ghi rõ vùng góc đã kiểm tra thay vì cam kết zero xuyên cho mọi hình học chưa kiểm thử.

### B2. Dựng bầu trời và cảnh nền xa theo miền camera

**File** — `src/components/world/world-sky-environment.tsx`, `src/components/world/world-scene.tsx`, `src/lib/world/environment-model.ts` nếu cần mở rộng lighting profile, và cấu hình Plaza đã nối ở B1. Giới hạn phần hình ảnh mới vào `public_plaza`, giữ đường đi và kích thước vùng chơi.

- [ ] Dựng nền trời có chuyển sắc theo hướng nhìn từ chân trời lên cao. Tái sử dụng palette theo phase/mùa/thời tiết trong `EffectiveEnvironmentSnapshot`. Vòm trời theo camera trong phạm vi far clip, với màu sương hòa với chân trời. Vị trí đĩa mặt trời và hướng nguồn sáng dùng cùng một hướng từ dữ liệu ngày–đêm. Đảm bảo camera nhìn ra ngoài biên ở mọi góc được phép vẫn gặp cảnh nền.
- [ ] Thử ít lớp mây mềm không chịu ánh sáng và không tạo bóng, có màu/opacity chuyển đồng bộ. Dùng lớp hình hoặc texture nhẹ trên bầu trời trước khi cân nhắc thêm khối, instancing hay hiệu ứng đắt hơn. Cảnh ngoại vi dùng lớp địa hình đơn giản và silhouette tán cây/đồi/mái xa để che mép nền hiện tại. Giữ silhouette xa tĩnh, ít chi tiết và hòa sương. Đo lại chi phí thật của lớp mây, không suy draw calls từ số material.
- [ ] Chụp cùng góc cho sáng, hoàng hôn, đêm và mưa. Thêm clip ngắn đi từ spawn tới biên, xoay/zoom và đi ngang cổng. Sáng phải nhìn được chiều sâu, đêm vẫn nhận ra lối đi/cổng/nhân vật, mưa đổi ánh sáng và mây, reduced motion dừng chuyển động trang trí. Preview vẫn dùng được để so cảnh và thoát về giờ thật. So lại frame time với mốc A bằng cùng lộ trình và ghi chi phí của mẫu.
- [ ] Bàn giao mẫu Public Plaza để owner duyệt hình ảnh/camera trước khi nhân sang Personal World. Các thông số chiều cao mây, khoảng zoom và kích thước cảnh nền trong bản mẫu là ứng viên dựa trên ảnh và số đo.

## Kiểm tra và bàn giao

- [ ] Sau mỗi mốc, chạy focused tests liên quan. Trước khi bàn giao code, chạy `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, và `pnpm build` khi có cửa sổ an toàn theo `AGENTS.md`. Báo lệnh, kết quả thật và kiểm tra nào còn thiếu.
- [ ] Self-review riêng theo mốc. So source thực tế kể cả file untracked; lưu diff theo từng thay đổi và kiểm tra baseline avatar/animation. Ghi kết quả HUD/Canvas/preview, cả hai không gian, những vị trí camera đã thử, và các trường hợp chưa kiểm chứng.
- [ ] Trả owner phần A và phần B tách rõ: file đã sửa, bảng before/after, ảnh/clip, các tiêu chí đạt/chưa đạt và giới hạn thiết bị/mode. Gửi bằng chứng để Sol review kỹ thuật. Owner quyết định nghiệm thu mẫu Plaza và phạm vi mở rộng.
