# Núi V5 — Implementation Plan

> Thực thi bằng superpowers:executing-plans, inline một agent theo AGENTS.md. Scope đã được owner giao; không commit/push/deploy.

**Goal:** Sáu mẫu núi giữ trụ đá với mặt đỉnh gồ ghề/mép mòn nhẹ, kiểu cây và điểm nhấn khác nhau; giữ chất lá V4 và ngân sách hiện hành. Không chóp/vòm theo phản hồi mới nhất.
**Architecture:** Dẫn xuất builder V4; một module tạo hình đỉnh đá + rêu/xám và props tĩnh. Builder đặt cây/bụi/ivy trên BVH đá đã đổi, uốn/định hình cụm lá theo style từng mẫu. Nguồn V2 và kit v18 bất biến, V4 giữ để so.
**Tech Stack:** Blender 4.5/Python/numpy, Three.js viewer cũ, Playwright CLI qua pnpm browser.
**Spec:** `docs/superpowers/specs/2026-11-13-mountain-variety-v5-design.md`.

## Ràng buộc và tự rà

Trần gần/giữa/xa 74k/56k/9k; sáu GLB <12 MB. Không cây gỗ trên vách, không lá khối đặc. Đỉnh không gai mặt lật; debris và props không nổi; normal theo biến dạng; seed tái dựng; nguồn giữ hash. Kiểm silhouette cả mặt sau, không chỉ camera trước. Hai công trình đơn giản không mang gameplay.

## Task 1 — hình núi và bố cục

Files: `output/rock-mountains-v5/{build.py,landscape.py,verify.py,verify-landscape.py,assets,source,reports,manifest.json}`.
- [x] Tạo verifier RED cho sáu profile khác nhau, đỉnh/thềm, props, ngân sách/nguồn bất biến.
- [x] Tạo hình đỉnh bằng biến dạng liên tục hướng lên, thêm mặt ở vùng đổi hình trước khi warp; giữ kín và kiểm dấu mặt/thể tích. Pha rêu/xám theo mảng có vị trí. Sau phản hồi, bỏ chóp/vòm, dùng relief nông trên đầu trụ rộng, mòn riêng mép.
- [x] Tạo profile tán/thân riêng, bố trí lại cây và bụi; hai props nhỏ; thử Sơn Trụ rồi xuất đủ sáu. Sau phản hồi, thử Thiên Mạch với đầu trụ gồ nông trước khi nhân bộ cuối.
- [x] Kiểm asset/biến dạng/tiếp xúc GREEN. 5.766.768 bytes, 177 solids, 16 hash nguồn bất biến; 720 mẫu z đơn điệu/240 normal cây PASS. Gate đầu trụ được đổi theo yêu cầu mới: rộng/relief nông, thay điều kiện tăng chiều cao nhọn của bản bị bác.

## Task 2 — xem và bàn giao

Files: viewer/serve/qa/renders/QA/CONTEXT trong V5, HANDOFF, style-guide.
- [x] Viewer đọc mô tả riêng sáu mẫu, giữ điều khiển/cleanup, server 8783.
- [x] Browser desktop/mobile, trước/sau/clay/cận, ánh sáng, đổi mẫu/lỗi retry PASS; HTTP SERVER_PASS 8.
- [x] Xem ảnh, tự rà code riêng, ghi số thực và giới hạn tại `output/rock-mountains-v5/QA.md`; mở preview cho owner.

Không chạy bốn gate app cho asset độc lập. Nếu tiếp tục tích hợp sẽ cần task và gate app riêng.
