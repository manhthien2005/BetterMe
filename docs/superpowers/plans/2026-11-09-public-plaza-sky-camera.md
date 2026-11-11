# Public Plaza — ngẩng camera ngắm trời

> Argon 4 thực thi tuần tự trong worktree hiện có, theo workflow inline của `superpowers:executing-plans`. Một agent; không spawn subagent. Sol đã tự review kế hoạch. Owner đã duyệt cho phép ngẩng camera; góc 70° là thông số khởi đầu Sol chọn để owner duyệt trong game.

**Goal:** Player ngẩng nhìn được mặt trời ban ngày và vùng thiên đỉnh, với vị trí camera vẫn an toàn trên sân.

**Architecture:** Giữ tâm bám và quỹ đạo vật lý cũ khi đến ngưỡng ngẩng hiện tại, rồi cho hướng ngắm tiếp tục lên trời. Tách điểm `lookAt` của renderer khỏi tâm dùng cho bám và kiểm va chạm. Bật mở rộng này riêng cho Plaza.

**Tech stack:** TypeScript strict, React Three Fiber / Three.js đang cài, Vitest, Playwright CLI qua pnpm. Không thêm dependency.

**Worktree:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`

**Spec:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/docs/superpowers/specs/2026-11-09-public-plaza-sky-refinement-v2-design.md`, mục “Bổ sung ngẩng nhìn trời”.

**Bằng chứng:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/output/world-plaza-summit-2026-11-09/sky-refinement-v2/day-in-game/sun-visibility-sol/report.md`.

## Ràng buộc

- Giữ các thay đổi hiện có, camera mặc định, FOV 46°, zoom 4,8–20,5, xử lý che khuất, hướng di chuyển và mây/màu trời đã duyệt.
- Giữ đúng vector đĩa/quầng/đèn bóng. Đĩa dưới chân trời vẫn ẩn. Không sửa model thiên văn để ép đĩa vào khung.
- Personal World dùng cơ chế camera hiện tại. R phục hồi đầy đủ góc/zoom/hướng nhìn; đổi map không giữ dư độ ngẩng.
- Không tự xoay về mặt trời khi đổi giờ. Không đổi preset hoặc mở mốc B trong lượt này.
- Không commit/push. Không đọc `.env*`. Không build khi dev của worktree đang chạy; không dừng Node của task khác.

## Trọng tâm self-review

1. Góc ngẩng mới phải đo qua hướng nhìn thực tế, kể cả lúc vị trí camera bị chống va chạm điều chỉnh.
2. Qua ngưỡng cũ phải mượt, không giật hướng hoặc đổi vị trí camera đột ngột.
3. Hai đầu zoom, mép sân và sát tường không xuyên mặt đất/vật thể hoặc lộ mặt dưới sân.
4. Đi/chạy, reset R, đổi map vẫn đúng; kiểm cả camera cũ Personal World.
5. Nhìn thiên đỉnh/đủ vòng không lộ lỗ vòm hoặc lỗi mặt sau của mây; ngắm nắng đúng vùng trời và thời điểm, không chỉ test helper.

## Task 1 — Camera logic và tích hợp renderer

**Files sửa:**

- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/types.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/map-config.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/camera.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/components/world/world-scene.tsx`
- Test: `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/world.test.ts`

**Interfaces / quyết định:**

- Thêm `maxSkyLookElevationRad?: number` vào `CameraOrbitConfig`; chỉ config Plaza đặt `70 * Math.PI / 180`. Thiếu tùy chọn giữ hành vi cũ.
- `pitch` / `targetPitch` tiếp tục nhận input và smoothing. Với Plaza, cho phép giới hạn input thấp đến `-maxSkyLookElevationRad`. `minPitch` cũ vẫn là ngưỡng quỹ đạo vật lý, không biến thành số âm.
- Khi pitch xuống dưới `minPitch`, quỹ đạo vật lý giữ ở `minPitch`; hướng ngắm tiếp tục ngẩng theo input. Góc ngắm tối đa +70° so chân trời. Không dùng điểm ngắm trời làm tâm chống va chạm.
- Thêm `lookAtX`, `lookAtY`, `lookAtZ` vào `CameraRigState`. Khởi tạo và cập nhật chúng trong module pure; bình thường trùng `targetX/Y/Z`, khi ngắm trời tách ra. `world-scene.tsx` dùng ba trường mới cho `camera.lookAt`. Không tạo state React hay object/array mới trong mỗi frame để làm việc này.
- `createInitialCameraRig`, `rotateCameraOrbit`, `resetCameraOrbit`, `stepFollowCamera` giữ chữ ký công khai hiện có. Tìm mọi chỗ tạo/đọc state trước khi sửa; cập nhật fixture nếu cần.

- [x] Viết test RED trước: kéo quá giới hạn đạt trần ngắm +70°; vị trí vẫn trên mặt đất; ngắm được hướng nắng 12:15 ngày 09/11 với FOV 46°. Đo từ `lookAt - position`, không chỉ assert config.
- [x] Test ngưỡng `minPitch ± 0,001`: thay đổi hướng nhỏ liên tục, vị trí không nhảy; chạy tại hai đầu zoom và một collider sát camera. Thêm test kéo trở lại góc cũ.
- [x] Test R từ góc ngẩng tối đa trở về góc/zoom mặc định sau smoothing; trường `lookAt` không còn độ ngẩng dư. Đường đi không có NaN/Infinity.
- [x] Giữ test va chạm/tường/camera-relative movement cũ. Bổ sung case config không có tùy chọn mới giữ giới hạn và điểm ngắm cũ; đây là regression Personal World.
- [x] Chạy `pnpm vitest run src/lib/world/world.test.ts`, ghi failure đúng nguyên nhân.
- [x] Implement các quyết định trên, tích hợp renderer; chạy lại cùng file đến GREEN, rồi typecheck. Nếu phát hiện cần đổi cách biểu diễn để đạt liên tục khi collider điều chỉnh camera, ghi giải thích và bằng chứng vào report; không nới điều kiện nghiệm thu.

## Task 2 — Kiểm trong game và bàn giao

**Source cần đọc, giữ nguyên trừ khi có bug mới được chứng minh:**

- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/components/world/world-client-shell.tsx` — chuột phải + kéo đã tạo delta pitch; HUD không kéo camera.
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/components/world/world-sky-environment.tsx` — vị trí mặt trời và hướng sáng.
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/solar-position.ts` — vector thiên văn hiện có.

**Đầu ra:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/output/world-plaza-summit-2026-11-09/sky-refinement-v2/day-in-game/sky-camera/`.

- [x] Chạy subset `pnpm vitest run src/lib/world/world.test.ts src/lib/world/solar-position.test.ts src/lib/world/environment-v1.test.ts src/components/world/world-client-shell.test.tsx` cùng `pnpm typecheck` và `pnpm lint`. Ghi command, exit code, số test thực.
- [x] Dùng browser thật `/world`, ngày 09/11/2026, Trời quang. 1440 × 1000: thử 06:00 hướng Đông Nam; 07:30 Đông Nam; 12:15 Nam/Tây Nam; 15:30 Tây Nam; 17:00 và 17:20 Tây Nam. Với các mốc trên chân trời, player chủ động xoay/ngẩng phải đưa được đĩa vào vùng canvas không bị HUD che. 17:30 dưới chân trời phải ẩn đĩa. Không dùng góc mặc định nhìn Bắc làm bằng chứng “mất mặt trời”.
- [x] Chụp ảnh thật ở 07:30, 12:15, 17:20 và 17:30; kèm clip kéo từ mặc định lên trời rồi về góc cũ. Kiểm đủ vòng, thiên đỉnh, zoom min/max, mép sân, sát tường, đi/chạy khi ngẩng và R.
- [x] Kiểm 390 × 844 để xác nhận mặt trời và cảnh không bị cắt/lộ lỗi khi khung hẹp; kiểm chuyển Personal World → Plaza và ngược lại. Báo rõ giới hạn input cảm ứng hiện có, không tự xây controls mới.
- [x] So ngắn trước/sau cùng góc, thiết bị, DPR và warm-up; đo frame time thực khi xoay/ngẩng và đi. Giữ mục tiêu FPS khoảng 60 trên máy owner; không suy FPS từ test logic. Không thêm diagnostic globals vào production.
- [x] Nếu chạy build hoặc full verify: dừng đúng dev của worktree cùng Next child, chạy gate rồi khởi động lại local server và kiểm `/world` hoạt động. Nếu chưa chạy build, ghi rõ.
- [x] Self-review diff chỉ liên quan; không revert thay đổi khác. `report.md` nêu files đổi, kết quả test/QA, ảnh/clip, giới hạn và cách owner thử. Dừng để Sol review và owner duyệt camera; không làm texture đêm.
