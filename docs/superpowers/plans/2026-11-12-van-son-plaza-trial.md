# Vân Sơn 05 — thử kích thước và độ sâu trong Plaza

**Goal:** Owner thấy mẫu 05 tạm ổn, cho đặt thử lên Plaza ở vài kích thước/khoảng cách. Dùng nhánh/worktree `codex/plaza-landscape-v1` đang có. Single-agent, không commit/push/deploy.

**Design:** Trong Plaza study hiện có (`/world?plaza=study`), dùng năm placements của mẫu 05 ở ba khoảng cách, khoảng trống trời và đảo vẫn đọc rõ. Giữ góc nhìn/đi bộ có sẵn. Bản `/world` thường giữ bộ núi cũ để đối chiếu. Không thay kiến trúc, đảo hoặc auth. Tạo ba mức mesh dẫn xuất từ source 05; giữ proportions bằng scale đều, không kéo dài cây. Màu mờ dần theo lớp và đá opaque dùng shader hiện có; không thêm tuyết vào mẫu thử.

**Files:** `output/van-son-plaza-trial/export-runtime.py`, `public/world/mountain-study/`; `plaza-mountain-study.ts`, `plaza-mountains.ts`, `public-plaza-mountains.tsx`, `public-plaza-backdrop.tsx` và tests liên quan.

- [x] Export near/mid/far từ blend 05, nguồn read-only; manifest provenance/hash/bounds. Tổng năm placements <500k triangles, download <20MB; finite/closed rock trước và sau export.
- [x] Test RED: 5 placements, 3 distance/size bands, shared loader dùng collection tùy chọn, no duplicate old horizon in study, late-load disposal/partial failure giữ nguyên.
- [x] Implement data collection + chuyển study prop ở backdrop; dùng chung instancing/haze/disposal, giữ mặc định cũ.
- [x] Focused tests, typecheck/lint, browser toàn cảnh/eye/rim, 390px, ánh sáng, lỗi shader và map-swap resources. Xem ảnh thật, chỉnh placements nếu che đảo hoặc chìm quá sâu.
- [x] Bốn gate app trước khi báo hoàn tất thay code; dừng đúng dev checkout trước build, restart loopback, smoke lại. Ghi QA và mở link.

**Acceptance:** thấy đủ các cỡ và lớp xa gần khi xoay, không chỉ một hàng núi trùng nhau; núi đỡ bởi haze thấp, không hở chân; navigation không đổi; 05 nguyên hash; không rò tài nguyên hoặc shader lỗi. Đây là trial, chưa là owner chốt bố cục.

QA: `output/van-son-plaza-trial/QA.md`. Bốn gate cuối exit0 (823 tests/95files, lint0errors/28warnings, build11/11). Regression sky-center bổ sung sau phát hiện far-clipping ở góc overview mới. Chờ owner nhận xét trial.
