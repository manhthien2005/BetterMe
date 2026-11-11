# Public Plaza — camera orbit giữ focus nhân vật

> Argon 4 thực thi inline, một agent theo `superpowers:executing-plans`; không spawn subagent. Đây là sửa hướng camera theo phản hồi owner, thay kế hoạch `2026-11-09-public-plaza-sky-camera.md`. Sol tự review kế hoạch; không yêu cầu owner duyệt lại cơ chế đã nêu rõ trong chat.

**Goal:** Ngẩng camera bằng quỹ đạo quanh nhân vật, giữ nhân vật là focus và vị trí camera an toàn trên sân.

**Architecture:** Trở lại một tâm bám cho orbit và `lookAt`. Cho phép orbit xuống góc thấp, chặn pitch theo nền và khoảng cách trước khi đặt camera. Bỏ hướng nhìn trời tách riêng 70° và những trường chỉ phục vụ nó.

**Stack:** TypeScript strict, Three.js/React Three Fiber và Vitest đang cài; không thêm dependency.

**Worktree:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`

**Spec:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/docs/superpowers/specs/2026-11-09-public-plaza-sky-refinement-v2-design.md`, mục “Camera ngẩng trời vẫn focus nhân vật”.

## Ràng buộc và thứ tự ưu tiên

- Nhân vật tiếp tục là tâm gameplay. Không cố nhìn đủ thiên đỉnh, không làm nhân vật rời khung bằng cách nghiêng hướng nhìn riêng.
- Giữ góc mặc định, FOV 46°, zoom yêu cầu 4,8–20,5 và cách smoothing/di chuyển/va chạm hiện có. Không tự ép zoom nhỏ hơn 4,8 để đạt góc ngắm trời; khoảng cách bị rút bởi vật cản vẫn theo cơ chế cũ.
- Giữ mây, mặt trời, vector nắng và bóng đã duyệt. Mặt trời trưa cao có thể ngoài FOV; đĩa dưới chân trời vẫn ẩn.
- Personal World giữ camera cũ. Không mở mốc B. Không revert thay đổi khác, đọc env, commit hoặc push.

## Trọng tâm self-review

1. Ngẩng cực hạn vẫn hướng về tâm nhân vật, không chỉ chứng minh thấy đĩa mặt trời.
2. Nền phải giới hạn pitch trước phép đặt camera, không chỉ cắt Y sau khi đã tính vị trí.
3. Kéo quá giới hạn rồi kéo lại phải phản hồi ngay; zoom khi sát nền không gây bật góc, xuyên nền hoặc tự lao sát người.
4. Tâm va chạm có thể được hiệu chỉnh theo cơ chế cũ; bỏ tilt riêng không được làm hỏng tường, phục hồi khoảng cách, tracking hay R.
5. Ảnh/clip phải chứa nhân vật và HUD thật; kiểm hai đầu zoom, mép sân và đổi map. Không dùng ảnh chỉ có trời để đánh dấu PASS.

## Task 1 — Phục hồi character orbit và thêm giới hạn nền

**Files sửa:**

- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/camera.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/map-config.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/types.ts`
- `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/components/world/world-scene.tsx`
- Test: `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/src/lib/world/world.test.ts`

**Quyết định triển khai:**

- `CameraRigState.targetX/Y/Z` tiếp tục là tâm bám và điểm `camera.lookAt`. Xóa `lookAtX/Y/Z`, `maxSkyLookElevationRad` và nhánh nội suy hướng ngắm trời, sau khi kiểm hết call sites/fixtures.
- Đặt `PUBLIC_PLAZA_CAMERA_ORBIT_CONFIG.minPitch` khởi đầu `-20 * Math.PI / 180` (Sol chọn để thử; không phải số owner đã chốt). `maxPitch`, default và zoom giữ nguyên. Personal config không đổi.
- `pitch` dùng cho quỹ đạo thật. Trước khi tính offset, tính giới hạn pitch an toàn dựa trên tâm bám, khoảng cách quỹ đạo và sàn Y = 0,6 hiện có. Với tâm cao hơn nền, giới hạn hình học là `asin((0.6 - targetY) / distance)`, chặn tỷ lệ vào [-1, 1], rồi lấy giới hạn nghiêm hơn giữa giá trị đó và `minPitch`. Dùng khoảng cách và tâm thực đang giải quyết; xử lý hữu hạn khi khoảng cách gần 0 do vật cản. Không để kiểm nền phá vòng xử lý va chạm/đẩy tâm hiện có.
- Chặn cả pitch hiệu lực và target pitch hợp lý để input quá giới hạn không tích lũy. Khi zoom hoặc tâm bám đổi cao độ, cập nhật giới hạn mượt và giữ camera phía trên nền. Tường vẫn có quyền rút khoảng cách như trước; không dùng nền làm lý do auto-zoom sát người.
- Giữ chữ ký các hàm camera hiện có. Không thêm state React, raycast terrain toàn cảnh, thư viện camera hoặc thay hệ input trong lượt này; sân Plaza hiện tại phẳng.

- [x] Viết test RED cho orbit góc thấp trên sân phẳng: tâm cao 1,25, zoom 4,8, không collider, kéo ngẩng quá giới hạn và settle; camera hạ đến Y ≈ 0,6 (sai số 0,001), bán kính tới tâm vẫn ≈ 4,8. Bản tilt hiện tại giữ quỹ đạo ở pitch +0,08 nên test này phải FAIL đúng lý do không hạ quỹ đạo.
- [x] Kiểm thêm focus: dựng camera từ pose và điểm ngắm thực được renderer tiêu thụ, project tâm bám bằng Three.js; tâm bám phải trong khung. Khi bỏ trường lookAt riêng, tích hợp renderer phải dùng đúng target. Browser ở Task 2 xác minh hành vi cuối cùng, tránh test tự gọi lookAt(target) rồi coi đó là bằng chứng renderer hiện tại đã làm đúng. Không giữ test yêu cầu nhìn 70°/mặt trời 61°.
- [x] Test RED hai đầu zoom và default: kéo lên quá giới hạn, settle, vị trí Y >= 0,6; khi không vật cản khoảng cách quỹ đạo thực khớp zoom yêu cầu; tâm không chạy lên trời. Không chỉ assert một số config.
- [x] Test RED kéo nhiều lần vượt ngưỡng rồi kéo ngược một delta nhỏ: pitch/view thay đổi trở lại ngay, không phải kéo bù phần đã vượt.
- [x] Test RED zoom in/out trong lúc ở ngưỡng nền: mọi frame hữu hạn và không dưới nền; sau settle giữ khoảng cách yêu cầu. Kiểm một bước qua ngưỡng an toàn để phát hiện giật vị trí/góc.
- [x] Giữ và cập nhật test collision sát tường, camera-relative movement, R, và config Personal World. Chỉ thay test gắn với cơ chế tilt đã bị bác, không bỏ regression cũ cho xanh suite.
- [x] Chạy `pnpm vitest run src/lib/world/world.test.ts`, ghi RED đúng nguyên nhân; implement rồi chạy GREEN cùng `pnpm typecheck`.

## Task 2 — Duyệt trải nghiệm và bàn giao

**Đầu ra:** `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1/output/world-plaza-summit-2026-11-09/sky-refinement-v2/day-in-game/camera-orbit-revision/`.

- [x] Browser `/world`, 1440 × 1000 và 390 × 844 với HUD thật: clip liên tục từ góc mặc định → kéo thấp hết mức → xoay một vòng → kéo lại → R. Nhân vật tiếp tục là focus, không chuyển thành góc chỉ có trời. Ghi hạn chế input cảm ứng đang có, không tự xây controls mới.
- [x] Lặp ở zoom min/default/max, khi đứng sát mép, cạnh tường, đi/chạy và nhảy. Kiểm lúc đạt giới hạn rồi kéo ngược, zoom khi sát nền, collider rút rồi trả khoảng cách, chuyển Personal World → Plaza hai vòng.
- [x] Trời quang, ngày 09/11: 06:00 Đông Nam và 17:00/17:20 Tây Nam phải ngắm được nắng thấp cùng nhân vật. Thử 07:30/15:30 ở zoom gần, ghi thực tế HUD che bao nhiêu. 12:15 không bắt buộc thấy đĩa; 17:30 vẫn dưới chân trời. Không nén góc nắng hay đổi shader để qua kiểm camera.
- [x] Chạy `pnpm vitest run src/lib/world/world.test.ts src/lib/world/solar-position.test.ts src/lib/world/environment-v1.test.ts src/components/world/world-client-shell.test.tsx`, `pnpm typecheck`, `pnpm lint`. Báo đúng output/exit code; không đổi `pnpm lint` thành chỉ lint src. Sol đã đổi audit hỗ trợ của mình từ CJS sang ESM để xử lý lỗi lint trong lượt trước; nếu còn failure khác thì report rõ.
- [x] Đo frame time ngắn cùng điều kiện trước/sau khi xoay và di chuyển; không thêm globals per-frame vào production.
- [x] Nếu build/full verify, dừng đúng dev và Next child của worktree trước; giữ app chạy local trở lại để owner thử. Không dừng Node khác.
- [x] Report nêu source đổi, kết quả gates, ảnh/clip, góc ngẩng thực tại ba mức zoom, giới hạn còn lại; tự review diff. Dừng ở mốc camera để Sol review và owner duyệt cảm giác.
