# Cây trên núi — Implementation Plan

> Thực thi bằng superpowers:executing-plans, single-agent theo AGENTS.md. Owner đã giao thiết kế cây; lựa chọn kỹ thuật theo spec. Không commit/push/deploy.

**Goal:** Thêm cây lớn/cong/đa dạng và mật độ hợp núi, dùng kit đảo bay với lá dịu và ít mặt.
**Architecture:** Đọc GLB V2, giữ geometry đá/đá vụn, thay vegetation. Dẫn xuất thân và lá riêng lẻ từ kit v18, giữ nguyên hình/nếp lá, uốn đồng bộ, chia sẻ mesh. Theo phản hồi cuối V3: 3 cây lớn ở gần/giữa, 2 cây xa, chỉ trên đỉnh/thềm; dây leo trên vách, rêu và xám loang nhẹ bằng vertex color. Xuất riêng V3, giữ V2 để so.
**Tech Stack:** Blender 4.5/Python/numpy có sẵn, Three.js viewer hiện hành, pnpm browser.
**Spec:** `docs/superpowers/specs/2026-11-13-mountain-trees-design.md`.

## Task 1 — cây và sáu bố cục
Files: `output/rock-mountains-v3/{build.py,verify.py,assets,source,reports,manifest.json}`.
- [x] Viết kiểm asset kế thừa verify V2, thêm tree counts/variants/contact và dấu vân geometry đá; RED khi chưa có bộ mới.
- [x] Đọc kit, giữ lá gốc, tạo biến thể thân lớn/cong, trồng ít cây trên thềm; vách chỉ có dây leo. Kiểm một mẫu trước khi chạy sáu.
- [x] Xuất nguồn/GLB, giữ budget, kiểm export và nguồn immutable GREEN.

## Task 2 — preview, rà hình, bàn giao
Files: `output/rock-mountains-v3/{index.html,viewer.js,viewer.css,serve.py,qa-browser.cjs,renders,QA.md,CONTEXT.md}`, `HANDOFF.md`.
- [x] Kế thừa viewer V2 và nhãn số cây; preview loopback cổng 8781, không xác thực, file allowlist.
- [x] Xem front/back/detail, daylight/night và mobile; kiểm xoay, chọn mẫu, lỗi/tải lại, resource ổn định, server allowlist.
- [x] Tự rà geometry/cây bám thềm/budget. Asset PASS: 6 mẫu, 7.267.436 bytes, 177 solids, 10 nguồn bất biến. Browser PASS, errors [], HTTP SERVER_PASS 8.

**Phản hồi sau V3:** owner thấy bố cục tạm được nhưng lá/dây leo còn giả, thân chưa đủ uốn. V3 chỉ là baseline; tiếp tục tại kế hoạch `2026-11-13-mountain-foliage-v4.md`, không coi V3 được duyệt mỹ thuật.

App không đổi: gate lượt này là verify asset + browser/visual. Chưa có quyền commit hoặc triển khai.
