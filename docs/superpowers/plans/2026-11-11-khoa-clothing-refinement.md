# Khoa — hoàn thiện trang phục và độ rủ

**Goal:** Bản trang phục Khoa chi tiết hơn, phom mềm và cử chỉ không lộ các mảng
gãy ở vai, giữ nguyên chân dung Harry-inspired đã duyệt.
**Spec:** art design hiện hành và `../../research/2026-11-11-khoa-clothing.md`.
**Execution:** inline theo yêu cầu “Em tiến hành”; tự review, không subagent.
**Architecture:** sửa bản VRM đã duyệt trong ignored `output/research/khoa-clothing-v2/`;
thay riêng robe/lining/uniform bằng script local. Giữ các mesh chân dung, metadata
giấy phép, expressions và rig humanoid. Bổ sung xương phụ đúng chuẩn VRM cho vải.

1. [x] Lưu/check hash baseline, viết kiểm tra bảo toàn chân dung, mesh/weights và
   spring chains có vertex thực sự dùng; chạy RED về chuyển động phụ trên bản cũ.
2. [x] Xây cổ–vai–tay liền phom, gile/cà vạt rõ lớp, mép cửa tay có độ dày;
   thêm nếp vải/viền/khuy vừa đủ. Render cùng ánh sáng, sửa lỗi nhìn thấy.
3. [x] Thêm độ rủ có damping cho tà và cà vạt. Đối chiếu skin/bind/collider;
   kiểm cử chỉ và quay người ở 30/60 Hz, stall/reset, reduced motion.
4. [x] Lưu ảnh trước/sau và clip liên tục qua loader thật, xem ở viewport điện
   thoại và camera xa. Chạy kiểm asset/morph/reproduction, self-review và handoff.

**Acceptance:** có mẫu thật và clip để chủ sở hữu nhận xét; chân dung byte-identical
ở các dữ liệu liên quan, garment geometry hữu hạn, skin hợp lệ, vải mới thực sự
theo spring, không lỗi nhìn thấy trong tư thế đã chọn. Không hứa tự va chạm toàn
bộ vải/mobile thật. Không commit/push/deploy. Tích hợp public chỉ sau khi mẫu được
xem; vòng này tiếp tục quy trình art preview đã dùng để duyệt chân dung.

**Review focus:** mép vai và cổ, lớp lót cùng weights, tay chạm cuff, bind matrices
xương mới, ổn định sau stall, preservation của face/hair/glasses và 18 expressions.

**Kết quả bản thử:** `output/research/khoa-clothing-v2/README.md` ghi nguồn,
reproduction, ảnh/clip và giới hạn. `verify.cjs.txt`: `CLOTHING_DRAFT_PASS`,
`reproduction: IDENTICAL`, năm public assets không đổi. Browser: `RUNTIME_PASS`,
chênh đầu xương vải 30/60 Hz tối đa 1.587 mm, stall/reset và reduced-motion drift
bằng 0; `EXPRESSION_PASS` 18 presets. Console 0 errors/warnings. Đã tự review
ảnh sáu tư thế và clip liên tục 19.94 giây. Đây là hoàn thành bản thử, chưa phải
nghiệm thu mỹ thuật hoặc tích hợp game; không chạy/báo bốn gate sản phẩm.
