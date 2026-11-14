# Tinh chỉnh nhẹ nhân vật hiện có

**Status: dừng theo phản hồi chủ sở hữu.** Chủ sở hữu bác bỏ mặt/thần thái Khoa;
chỉnh áo không giải quyết yêu cầu. Đã lưu bản thử trong ignored output và hoàn
nguyên generator, VRM, metrics của riêng lượt này về snapshot ban đầu. Không
được tiếp tục kế hoạch này như một hướng đã duyệt. Xem phản hồi mới nhất đầu spec.

**Goal:** Giữ bộ anime/toon hiện tại; làm gọn các lớp cổ/ve áo Khoa.
**Spec:** `../specs/2026-11-10-academy-character-art-design.md`, điều chỉnh 2026-11-11.
**Execution:** Inline, một agent và tự review riêng theo AGENTS.md. Chủ sở hữu đã
yêu cầu tiếp tục thực thi, sửa dần; không mở lại lựa chọn dựng nhân vật mới.

## Phạm vi và kiểm tra

- [x] Xác minh player/NPC đang dùng và hướng Blender chưa được tích hợp. Lưu
  ảnh/model trước sửa trong ignored `output/research/character-light-polish/`.
- [ ] Chỉnh tọa độ lớp áo trong `scripts/academy-menswear.mjs`; không sửa mặt,
  tóc, kính, vật liệu hoặc chuyển động. Dựng lại bằng generator hiện có, cập nhật
  metrics Khoa ở `src/lib/world/character-assets.ts` và JSON manifest.
- [ ] Kiểm layer trực tiếp qua loader thật, cùng ánh sáng/góc trước–sau; bên/sau,
  chào/giải thích/cuff, giảm chuyển động và `/world`. Chạy bộ asset/NPC/rig có sẵn.
  Đây là thay đổi hình học thẩm mỹ, không thêm logic sản phẩm/test sao chép tọa độ.
- [ ] Xác minh player/An/Minh, mặt/tóc/kính Khoa, rig, morph và license giữ nguyên;
  generator tái tạo đúng cùng hash. Lưu bằng chứng, cập nhật handoff và tự review.
- [ ] Dừng đúng dev process của checkout; `pnpm verify` xanh, khôi phục preview.
  Không commit/push/deploy. Ngoại hình vẫn để chủ sở hữu nhận xét từ ảnh thực.

Rủi ro cần xem: ve áo xuyên gile khi xoay vai; đường cổ hở; mép áo lật ở góc bên;
phong cách thay đổi ngoài ý muốn; sửa nhầm asset khác. Dùng ảnh nhiều góc/pose và
so sánh binary các phần giữ nguyên. Không làm lại khuôn mặt/kiểu tóc/vóc dáng.
