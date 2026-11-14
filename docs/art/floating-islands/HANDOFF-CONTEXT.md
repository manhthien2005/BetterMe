# Context ngắn để tiếp tục bộ đảo

Đọc file này + brief của đảo được giao, rồi chỉ đọc module cần sửa. Không cần tải lịch sử chat hoặc toàn bộ manifest.

## Context gốc

Vườn Gió **v18 đã được owner duyệt** ngày 12/11/2026, là mẫu chính và bản nâng cấp **thay thế Mạch Nguồn** trong bộ đảo hiện hành. Tài liệu chuẩn: [README.md](README.md); mỹ thuật ở `STYLE-GUIDE.md`, kỹ thuật ở `TECHNICAL-CONTRACT.md`, QA ở `BUILD-AND-QA.md`. Snapshot bất biến: `output/tiny-glade-island-v1/approved/v18/`; SHA-256 ở `reference-v18.json`.

Vườn Gió giữ cỏ/đáy/mép v15, 24 phiến đá đường v16, đảo nhỏ/đá bay v16; rêu là mảng xanh loang trên vách, không hạt. Quả nằm trong bụi thấp. Cột fantasy có đủ thiết kế và hoa văn, nằm đổ sát đất. Đèn thấp, lồng lớn, đế chắc ở phía đối diện đường; ánh vàng, kính cam, không chói. Đom đóm quanh đèn/bụi chỉ hiện đêm. Thác trong, dòng chảy/tia/giọt/sương nối nhau; không có vòng sóng va chạm trong không trung.

Giữ cách dựng/matte/palette/tiếp xúc/nhịp chi tiết để đồng bộ; không sao cùng bố cục lên mọi đảo. Các bất biến v15/v16 nói trên dành riêng cho Vườn Gió. Đảo mới cần brief và source path thật. Lượt chốt chuẩn ban đầu chỉ lưu tài liệu/snapshot; owner sau đó đã cho phép sản xuất v2 và chia subagent. Quyền này không bao gồm thay asset app/Plaza, deploy hoặc tự gán approved.

Bản làm việc ở `output/tiny-glade-island-v1`; preview loopback cổng 8772, query `?v=` không lưu version. Blender 4.5.10 / Three 0.187.0; GLB khoảng 40,8 MB, 2,04 triệu tam giác, 14 kit. Nước/gió/đèn đêm/đom đóm cần runtime, không đi theo GLB tĩnh. Chưa có LOD hoặc benchmark điện thoại thật.

## Đợt v2 hiện tại

Catalogue có Vườn Gió v18 và **sáu candidate v2**: Thiên Viên (`thien-vien`), Thác Tầng (`thac-tang`), Nguyệt Hồ (`nguyet-ho`), Song Đỉnh (`song-dinh`), Tán Mây (`tan-may`), Phong Đăng (`phong-dang`). Mạch Nguồn giữ vai trò nguồn lịch sử/phụ thuộc chỉ đọc, không có model v2 riêng và không tính thành đảo thứ tám.

Điểm vào: [README v2](../../../output/floating-islands-v2/README.md), [QA](../../../output/floating-islands-v2/QA.md), [context kỹ thuật v2](../../../output/floating-islands-v2/HANDOFF.md), [spec](../../superpowers/specs/2026-11-12-floating-islands-v2-design.md). Nguồn v1 ở `D:/Dev/Tools/Blender/assets/floating-island-collection-v1/`; candidate ở `output/floating-islands-v2/`, với `source/<id>.blend` và `assets/<id>.glb`. Vườn Gió được sao nguyên hash từ chuẩn.

Các candidate đã được dựng, **chờ owner duyệt hình ảnh**. Preview loopback cổng 8773, không có xác thực, chỉ dùng local; hỗ trợ đối chiếu v1 cùng rig. Không suy ra kết quả QA từ preview hoặc test cũ: đọc bằng chứng trong QA v2. Chưa tích hợp app/Plaza, chưa có LOD/benchmark điện thoại thật, chưa commit/push/deploy. Giữ nguồn cũ và snapshot v18 nguyên vẹn; chỉ đọc brief/module liên quan khi chỉnh tiếp.

## Giao một task cụ thể

```text
Task: <đảo / phần việc / kết quả cần đạt>.
Nguồn và candidate: <path thật>; brief: <path>.
Đọc: AGENTS.md; brief; STYLE-GUIDE phần <...>; TECHNICAL-CONTRACT phần <...>.
Quyền ghi: <file/module>. Phần phải giữ: <...>. Ngoại lệ được phép: <...>.
Mẫu hình ảnh: <1–2 ảnh có góc phù hợp trong approved/v18/evidence>.
Đầu ra: file đã sửa, số liệu, ảnh trước/sau cùng rig, lệnh/kết quả, rủi ro còn lại.
Không ghi vào snapshot chuẩn; không đổi app/dependency hoặc build đầu ra chung ngoài ownership.
Nếu có nhiều người: bạn không làm một mình; giữ sửa đổi của người khác và báo xung đột.
Parent giữ assembly/shared materials/viewer và chạy build tích hợp khi workers đã xong.
```

Chỉ dùng worker khi task hiện tại có yêu cầu delegation phù hợp AGENTS.md. Dùng `fork_turns="none"` và context trên khi được giao quyền; không gửi cả transcript. Mỗi báo cáo ngắn chỉ nêu kết quả, file, checks, điểm chưa xong. Search đúng function; log chỉ đọc Result/PASS/lỗi; JPG review tối đa 1000 px, tối đa 2 ảnh mỗi lần gọi. Không dump base64 hoặc mảng placements/vertices.
