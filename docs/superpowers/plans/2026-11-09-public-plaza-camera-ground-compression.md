# Public Plaza — ngẩng trời quanh nhân vật khi chạm nền

**Goal:** Sửa phản hồi nghiệm thu của owner: ngẩng nhìn trời rõ ràng trong khi nhân vật vẫn là tâm camera. Sol trực tiếp thực thi; owner nghiệm thu cảm giác.

**Spec:** `../specs/2026-11-09-public-plaza-sky-refinement-v2-design.md`, bổ sung nghiệm thu cuối ngày 09/11.

**Architecture:** Giữ một tâm orbit/lookAt trên nhân vật. Pitch cấu hình tới −55°; nền là vật cản rút bán kính hiệu lực thay vì khóa góc. Zoom yêu cầu vẫn 4,8–20,5 và tự phục hồi khi hạ hướng nhìn. Dùng TypeScript/Three.js/Vitest hiện có.

**Ruling:** Thay ràng buộc Sol đặt ở kế hoạch character-orbit cũ về giữ nguyên bán kính khi chạm nền. Ràng buộc đó chỉ cho ngước 3,16° ở zoom mặc định và owner đã báo chưa đạt. Không thay đổi mặc định, FOV, input, Personal World hoặc môi trường. Góc cao có thể chỉ giữ đầu/thân trên trong khung; không yêu cầu toàn thân. −55° là lựa chọn triển khai của Sol, chờ owner nghiệm thu.

## Thực hiện và tiêu chí

- [ ] Trong `src/lib/world/world.test.ts`, thay regression khóa bán kính cũ bằng test ngẩng đạt 55° ở min/default/max zoom, renderer vẫn nhìn tâm nhân vật; mặt trời cao 61° cùng đầu nhân vật còn trong FOV desktop/portrait. Chạy RED trước sửa code.
- [ ] Trong `src/lib/world/camera.ts`, clamp pitch theo config; giới hạn bán kính bởi nền và AABB, giữ preferred zoom độc lập, phục hồi mượt. Không đổi chữ ký public hoặc renderer. `map-config.ts` chỉ đổi minPitch Plaza.
- [ ] Kiểm kéo quá ngưỡng rồi đảo chiều, zoom trong lúc chạm nền, đi/chạy/nhảy, collider sát tường và target-inside, R và camera Personal World. Chặn nền trước phép đặt vị trí.
- [ ] QA `/world` desktop 1440×1000 và portrait 390×844; hình/clip thật có HUD và nhân vật. Kiểm clipping/góc cao, trời quang buổi trưa và lúc nắng thấp, chuyển map hai vòng. Touch controls chưa có nằm ngoài phạm vi.
- [ ] Dừng đúng dev/Next child của worktree, chạy `pnpm verify`, tự review thay đổi với snapshot trước sửa; khởi động lại local để owner thử. Không commit/push.

## Bằng chứng

Baseline source và QA lưu tại `output/playwright/camera-sky-acceptance/`. Subagent 6.1 sol max kiểm độc lập hình học từ excerpt, không có filesystem/browser; Sol chịu trách nhiệm sửa và kiểm thực tế.
