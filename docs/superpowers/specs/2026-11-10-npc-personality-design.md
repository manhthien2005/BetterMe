# NPC nam và hành vi riêng — 2026-11-10

Chủ sở hữu yêu cầu model nam và nâng cấp NPC với idle/tương tác khác nhau theo
vai trò; đã chọn **NPC trước: làm Khoa nam**. Tiếp tục cách làm đã cho phép:
dựng trực tiếp trong game để xem và chỉnh dần. Không thêm lựa chọn player nam.

## Phạm vi và hướng thực thi

**Góp ý tiếp theo của chủ sở hữu:** bản nam đầu quá xấu; cần nam anime đeo kính,
trang phục riêng dành cho nam, không áp đồ nữ. Thay hoàn toàn mẫu áo của Khoa bằng
menswear riêng trong `scripts/academy-menswear.mjs`: áo khoác có ve/tay gọn,
ghi lê nam, cà vạt, quần ống thẳng và giày da; kính chữ nhật. Không coi bản đầu
hoặc bản sửa là đã được chủ sở hữu duyệt. Rig/morph source vẫn được giữ hợp lệ.

Giữ thế giới học viện fantasy anime và bộ đồ đã có. Khoa được chỉnh mặt/tóc và
hình dáng đồng phục thành nhân vật nam: tóc ngắn rẽ bên, chân mày rõ, mắt bớt tròn,
hàm rõ hơn, thân áo thẳng/vai rộng hơn. Giữ navy–đỏ rượu, rig/expressions/license.
An, Minh và player không đổi bytes trong vòng này. Model vẫn là dẫn xuất được
phép sửa của sample, không phải asset thương mại hay chân dung hoàn thiện mới.

Ba phương án đã cân nhắc: chỉ tăng biến thiên cùng động tác không đủ khác biệt;
clip/download mới thêm phụ thuộc license và chưa có clip khớp vai trò; mở rộng
module pose thuần hiện tại cho ba vai trò giữ được rig, test và quyền sửa.
Chọn hướng cuối theo phạm vi chủ sở hữu giao; không thêm dependency.

## Hành vi nhìn thấy

| NPC | Khi rảnh | Khi người chơi tới | Hội thoại | Kết thúc |
| --- | --- | --- | --- | --- |
| An | Nhìn quanh, đổi trọng tâm nhẹ, một cử chỉ tay nhỏ xen khoảng nghỉ | Nhìn về người chơi, vẫy nhẹ một lần | Chào tay, mở lòng bàn tay khi giải thích; đổi biến thể theo dòng | Vẫy ngắn rồi về idle |
| Khoa | Dáng thẳng, nhìn hai phía cổng, thỉnh thoảng chỉnh tay áo | Quay chú ý và gật đầu | Gật chào, cử chỉ chỉ hướng hoặc tay mở có kiểm soát | Gật ngắn rồi về tư thế gác cổng |
| Minh | Nhìn sách đang cầm, thỉnh thoảng chỉnh kính bằng tay phải | Ngẩng khỏi sách và nhìn người chơi | Chào nhỏ, cử chỉ tay phải khi giải thích; tay trái đỡ sách | Gật nhẹ, nhìn lại sách |

Đạo cụ hiện là sách đóng; không mô tả là đang đọc trang/lật trang. Cử chỉ idle
chạy theo chu kỳ xác định riêng từng ID, có khoảng nghỉ, không đồng loạt.
Thông tin hội thoại vẫn tĩnh, không voice/lip-sync hay tự động mở hộp thoại.

## Chuyển trạng thái và an toàn tương tác

- Thêm notice, nearby và farewell bên cạnh idle/greet/explain/attentive.
  Nhận biết gần ở 3.8 m; rời ở 4.6 m để không nhấp nháy tại ranh giới.
  Notice không lặp khi đứng gần; chỉ tái kích hoạt sau khi ra xa và cooldown 8 s.
- Hội thoại có ưu tiên cao hơn proximity; đổi dòng kích đúng một cử chỉ. Đóng
  hoặc ra khỏi vùng hội thoại chuyển farewell ngắn rồi nearby/idle. Mở lại giữa
  cử chỉ phải blend từ pose đang thấy, không nhảy tay hay kẹt ngón.
- Root chỉ quay tại chỗ; không đi tuần/pathfinding hoặc thay collider. Ánh nhìn
  có giới hạn, không quay đầu 180 độ để nhìn người sau lưng. Giữ pipeline duy nhất
  root → pose → VRM, không thêm mixer ghi đè xương.
- Reduced motion: bỏ idle trang trí/gesture lớn; giữ tư thế nhận diện, ánh nhìn
  ổn định và phản hồi trạng thái. Giá trị bất thường/delta âm/lớn phải an toàn.
- Player movement/camera/map/dialogue copy, economy/sync/auth giữ nguyên.

## Nghiệm thu

Unit tests nhận biết proximity/cooldown, ưu tiên hội thoại, ngắt/mở nhanh, idle
khác nhau, biến thể dòng, reduced motion, state độc lập, dữ liệu hữu hạn. Real
VRM tests kiểm hình học mới và morph blink/happy, tư thế/đế chân/tay sách trên
ba NPC. Visual QA trước/bên/sau Khoa nam, idle và từng tương tác trong viewer
và game; kiểm ngày/đêm, viewport hẹp, tải lỗi/hồi phục. Test không thay duyệt mắt.
Tự review riêng, dừng dev rồi chạy pnpm verify, khởi động lại preview. Không commit.
