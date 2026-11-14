# Xưởng Đèn Lồng — mẫu HTML desktop

## Scope và quyết định

Owner yêu cầu tổng hợp nghiên cứu thành thiết kế mẫu HTML. Triển khai ngay hướng
xưởng đã đề xuất; đây là prototype để owner đánh giá, không coi là nghiệm thu
gameplay hoặc thay đổi sản phẩm chính. Nguồn: nghiên cứu educational-gameplay
2026-11-11 và prototype v2. Kế thừa xanh rêu/giấy ngà/chữ Cambria của bàn học viện.
Mode Experience, một bàn chơi trung tâm; không tạo hệ thiết kế cạnh tranh với docs.
Thực hiện inline, self-review riêng theo AGENTS; không agent, commit hay deploy.

## Hợp đồng gameplay

- Sáu nguyên liệu; tối đa bốn phần trong bình, cho phép lặp nguyên liệu.
- Ba thao tác: nghiền nguyên liệu khô, thêm vào bình, đun tới 90°C.
- Moonseed nghiền sáng 3; sôi làm mất sáng vĩnh viễn trong mẻ đó.
- Sunamber sôi sáng 4; nghiền trước khi thêm thì trong, nguyên hạt gây khói.
- Embermoss tăng 25°C; Frostpetal giảm 45°C; nhiệt độ giới hạn 5–90°C.
- Reed resin giảm sáng 1 và tăng thời lượng 4; Starspore sáng 2 khi ≤30°C.
- Nhiệt nền 20°C, thời lượng nền 1, độ sáng hiển thị 0–8; tất cả nguyên liệu
  đang ở ≥80°C đều chịu hiệu ứng sôi; amber đã kích hoạt vẫn sáng khi nguội.
- An: sáng ≥2, 35–65°C, không khói. Khoa: sáng ≥4, ≤30°C, không khói.
  Minh: sáng 2–3, 35–65°C, thời lượng ≥5, không khói.
- Hành động được ghi và tính lại bằng hàm thuần. Hoàn tác không xóa đơn đã giao.
  Giao đèn lưu công thức, mở đơn tiếp theo; sau ba đơn có thể thử tự do.
- Đọc mô tả tiếng Anh để dự đoán; bản dịch/gợi ý tùy chọn không phạt. Không timer,
  điểm học tập, tài nguyên pet, backend, mất streak, mobile hoặc đi lại 3D.

## File và bước thực hiện

1. `output/prototypes/lantern-workshop/logic.test.mjs`: RED cho nhiệt/chuẩn bị,
   thứ tự, sáu lời giải (hai/đơn), khói, giới hạn bình, replay/khôi phục an toàn.
2. `output/prototypes/lantern-workshop/index.html`: engine thuần trong script
   riêng được test bằng Node VM; UI/CSS/geometry inline để mở offline được.
   Không thư viện/font/assets mạng. Các hình bình/đèn là vật thể tương tác dạng
   hình học, không thay artwork nhân vật đã duyệt.
3. `serve.mjs`: dùng server tối giản mẫu cũ, loopback port 3023, chỉ HTML.
4. Kiểm tra browser thực ở 1440×900 và 1280×800, keyboard/Escape, drag,
   recipe log, đủ ba đơn, thứ tự sai/hoàn tác, reload và storage lỗi/bị chặn.
5. Chụp JPG nhỏ, detector một lần, self-review sửa theo bằng chứng. Cập nhật
   HANDOFF và kết quả bên dưới. Không chạy build app vì không đổi code app.

## Acceptance

HTML có thể chơi hết ba đơn; mỗi đơn có hai lời giải khác nguyên liệu hoặc
thao tác. Kết quả đèn phản ánh nhiệt/độ sáng/khói hiện tại. Tương tác không phụ
thuộc drag; focus và trạng thái đọc được. Không scroll ngang ở hai cỡ desktop.
Giữ nguyên tài sản /world và prototype cũ. Console không lỗi ở luồng thông thường.

## Review focus

Lửa làm hỏng moonseed nhưng amber vẫn sáng sau làm lạnh; nghiền sau khi thả
không sửa lại phần đã ở trong bình; undo khôi phục đúng; add phần thứ năm bị
chặn; dữ liệu lưu không thể chèn HTML hay mở khóa bằng object tùy ý.

## Progress

- Scope/design/plan recorded; HTML and loopback server implemented.
- Engine RED→GREEN: seven tests passed, including six recipes across three clients.
- Browser: LANTERN_WORKSHOP_GAMEPLAY_PASS and LANTERN_WORKSHOP_FINAL_PASS;
  1440×900 / 1280×800, zero console/page errors, standalone file:// confirmed.
- Separate self-review corrected full-vessel opacity and external drag validation.
  Detector's geometry/halo findings documented as functional game feedback.
- Delivery and limitations: `docs/research/2026-11-11-lantern-workshop-prototype.md`.
  No app changes, commit/push/deploy. Owner gameplay assessment remains pending.
