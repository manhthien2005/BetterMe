# Bộ núi đá V2 — 13/11/2026

> Execution: superpowers:executing-plans, single agent theo AGENTS.md. Không commit/push/deploy.

**Goal:** Phát triển mẫu Vân Sơn 05 đã được owner chấp nhận thành sáu dáng núi khác nhau, có nguồn Blender, GLB nhẹ và preview.
**Spec:** docs/superpowers/specs/2026-11-12-rock-mountains-design.md; amendment dưới đây căn cứ yêu cầu cuối chat 01a1cfdd-c54c-7ce2-b20b-e91223fb6b39.
**Authorization:** Owner đã chấp nhận preview 05 trong Plaza và yêu cầu triển khai nhiều núi lớn/nhỏ, tối ưu lớp xa. Lượt gửi yêu cầu lỗi 413 trước khi dựng. Chat hiện tại yêu cầu tiếp tục thực hiện.
**Architecture:** Tái dùng fractured_block/sculpt_outcrop mẫu 05; tác giả bố cục riêng cho từng ID. Vân Sơn lấy nguyên nguồn approved-in-context 05. Dẫn xuất runtime giảm geometry theo lớp. Viewer tái dùng rig hiện tại. Không đổi app trong lượt sản xuất này.
**Tech:** Blender 4.5/Python, Three.js đã cài, pnpm browser.

## Design amendment / decisions
- Giữ 6 ID/thứ tự gần/gần/giữa/giữa/xa/xa. Ảnh mới references/latest.png dẫn nhịp vách đứng, khối chính lớn, vai thấp, khe sâu và thềm xanh; không dựng kiến trúc trong ảnh.
- Sơn Trụ: trụ chính gọn, chân rộng vừa, vai thấp lệch một phía. Thạch Lĩnh: sườn ngang bậc chéo, đỉnh thấp hơn, nhiều đoạn vách rộng.
- Vân Sơn: giữ hình mẫu 05. Thiên Mạch: khối chủ cao rộng và tháp phụ lệch, khe trời ở phần trên, chân chung.
- Thanh Sơn: dải thấp thưa, đỉnh lên xuống không đều, vài mảng xanh. Viễn Phong: một đỉnh lớn cao hẳn, khối phụ thấp, mặt đá đọc bằng mảng.
- Giữ vật liệu đá/rêu không texture của 05. Gần dùng cây kit v18 đã giảm mặt, giữa ít cây, xa chỉ mảng xanh/khối tán nhẹ. Không cỏ, thác, đèn hoặc shader mới.
- Chọn tự dựng bố cục trên pipeline 05: scale/rotate một mẫu không tạo đủ sáu dáng; dựng lại toàn pipeline không cần thiết. Đây là lựa chọn kỹ thuật của agent trong phạm vi owner đã giao.
- Nguồn dựng to vừa để thao tác; scale runtime chỉ thay kích cỡ hiển thị. Giảm geometry thực tế mới giảm tải.

## Constraints / acceptance
- Runtime gần <=35k, giữa <=20k, xa <=7k triangles/mẫu (bao gồm cây). 31 placements theo 5/9/17: trần bảo thủ <=474k, <500k. Tổng tải 6 GLB <20 MB.
- Mặt đá kín, thể tích dương, tọa độ hữu hạn; giữ anti-flip trong sculpt. Kiểm cả sau export. Report triangles đọc lại từ GLB phải khớp.
- SHA nguồn 05 và kit v18 không đổi. Không ghi vào staging/releases v1 hoặc app/worktree. File mới trong output/rock-mountains-v2; docs plan + handoff/context gọn.
- Kiểm sáu silhouette trước/sau; desktop/mobile; ngày/chiều/đêm; bàn phím, console và load đủ 6 mẫu. Preview loopback, không xác thực, allowlist file/Host.

## Review focus
- Hai đỉnh không được tách khỏi chân sau remesh: connected-component gate giữ nguyên.
- Export không xóa mặt làm hở đá: manifold và triangle counts kiểm lại sau export.
- Decimation làm cây bay: giữ vị trí gốc, kiểm lại mặt đất sau simplify và điều chỉnh cả cụm cây nếu cần.
- Xa ít mặt nhưng không biến thành nón: ảnh trước/sau và silhouette, phân biệt sáu dáng.
- Ngân sách phải tính theo số lần đặt; báo rõ đây là projection 31 placements, chưa benchmark điện thoại thật.

## Task 1: Author and export
Files: output/rock-mountains-v2/{build.py,verify.py,assets,source,reports,manifest.json,references/latest.png}.
- [x] Viết verify.py kiểm sáu GLB, bytes, triangle/index/position hợp lệ, budgets và source hashes; chạy RED thiếu manifest.
- [x] Viết build.py với sáu bố cục/seed, dùng pipeline 05 read-only; tạo source và runtime, report.
- [x] Chạy Blender; sửa lỗi có bằng chứng; chạy verify.py GREEN.

## Task 2: Reviewable preview
Files: output/rock-mountains-v2/{index.html,viewer.js,viewer.css,serve.py,qa-browser.cjs,renders,QA.md,CONTEXT.md}.
- [x] Tái dùng viewer 05; chọn 6 mẫu, fit bounds, tải GLB đúng hash, keyboard/resize/light/clay.
- [x] Server loopback allowlist; kiểm HTTP private paths/Host; browser đủ model/viewport/light, chụp front/back/clay.
- [x] Tự rà riêng hình ảnh và code, ghi giới hạn, cập nhật context/handoff, mở preview.

App không thay nên không dùng gate app cũ làm bằng chứng; verification của asset và browser là gate lượt này.

## Kết quả thực thi 13/11/2026

- Task 1 complete: `python -X utf8 output/rock-mountains-v2/verify.py` exit 0, `COLLECTION_PASS`: 6 models, 3.984.984 bytes, 444.915 projected placed triangles, 177 exported solids, 8 source hashes unchanged.
- Ruling: Viễn Phong fail ba mặt lật sau 32 lượt bảo vệ; thêm một lượt trên dữ liệu lỗi hết cả ba. Sao sculpt 05 sang V2 và dùng giới hạn hội tụ theo số đỉnh, assert tiến triển. Bản v1 giữ nguyên; thuật toán mới có thể bảo vệ vùng rộng hơn, nên đã xem silhouette và kiểm lại export.
- Task 2 complete: `pnpm browser run-code --filename output/rock-mountains-v2/qa-browser.cjs` → `passed:true`, `errors:[]`; HTTP → `SERVER_PASS 8`.
- Final review: self-review theo yêu cầu single-agent. Impeccable chỉ báo nền cream của viewer kế thừa 05; giữ theo brief, không đổi palette. Chưa benchmark điện thoại thật hay tích hợp 31 núi.
- Bàn giao: [QA](../../../output/rock-mountains-v2/QA.md), [context gọn](../../../output/rock-mountains-v2/CONTEXT.md). Không commit/push/deploy.
