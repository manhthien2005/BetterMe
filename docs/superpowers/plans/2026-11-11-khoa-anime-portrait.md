# Khoa — sửa chân dung anime để duyệt

**Goal:** Render một bản sửa mặt/tóc Khoa cùng nét anime/toon của player.
**Spec:** `../specs/2026-11-10-academy-character-art-design.md`, phản hồi 2026-11-11.
**Execution:** Inline theo yêu cầu thực thi của chủ sở hữu; tự review riêng.
**Architecture:** Bản thử trong ignored `output/research/khoa-portrait/`, dùng
generator và loader hiện có. Không thay asset đang chạy khi chưa xem bản thử.

- [x] Tái sử dụng mặt, texture và từng lọn tóc nguồn; bỏ mắt co mạnh/hàm nở và tóc
  dạng khối của Khoa. Chỉnh nhẹ mắt/mày và tóc ngắn, giữ skin/morph đồng bộ.
- [x] Render trước/sau/chính diện/3-4/bên, blink/happy qua loader thật bằng
  Playwright. So sánh với player cùng camera và ánh sáng. Sửa lỗi nhận diện rõ.
- [x] Kiểm VRM: số hữu hạn, weights, morph topology, metadata, quần áo giữ nguyên;
  hash player/An/Minh và asset Khoa đang chạy không đổi. Không thêm dependency.
- [x] Lưu script tái tạo, file VRM, ảnh xem và bằng chứng; cập nhật handoff. Đóng
  browser QA. Bản thử chưa tích hợp nên không tuyên bố toàn bộ game được kiểm lại.

Thành công: có chân dung mẫu thực để chủ sở hữu nhận xét, nét mắt/tóc vẫn thuộc
cùng hệ anime/toon; không che bằng ánh sáng render thực hay thay đổi trang phục.
