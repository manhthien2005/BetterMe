# Brief asset đảo bay — mẫu để điền

**Trạng thái:** chưa điền / candidate / chờ duyệt / approved. Copy nội dung sang brief của asset cụ thể; không biến mẫu này thành hồ sơ của một đảo.

## Nhận diện và mục tiêu

| Mục | Điền trước khi dựng |
|---|---|
| Tên/ID đảo | Tên thật, ID ổn định, tên file export |
| Nguồn hiện tại | Path generator/Blend/GLB, version/hash, ảnh hiện trạng |
| Thư mục candidate | Nơi có quyền ghi; snapshot v18 chỉ để tham khảo |
| Yêu cầu của owner | Kết quả cần đạt, phần được thay và phần cần giữ |
| Theme/câu chuyện | Khí hậu, mức chăm sóc/hoang dại, dấu tích văn hóa; không bịa thay owner |
| Chức năng trong sản phẩm | Góc camera, điểm tương tác, vùng di chuyển nếu đã có spec |
| Quy mô | Tỉ lệ với Vườn Gió, kích thước dự kiến và số đảo cùng hiện nếu biết |
| Chuẩn dùng chung | Vườn Gió v18, [STYLE-GUIDE](STYLE-GUIDE.md), [TECHNICAL-CONTRACT](TECHNICAL-CONTRACT.md) |

## Thiết kế riêng và các điều giữ nguyên

| Thành phần | Giữ từ chuẩn | Biến thể đề xuất của đảo này | Vì sao phù hợp brief |
|---|---|---|---|
| Silhouette/thân/mép/đáy | Khối đá có cấu trúc, mép mềm | … | … |
| Đảo nhỏ/đá bay | Họ khoáng và hình dáng đa dạng | … hoặc không áp dụng | … |
| Cỏ/nền | Cụm rõ, thấp–cao, chân/ngọn | … | … |
| Cây/hoa/bụi/quả | Matte, bám đất, khối tán có cành | … | … |
| Rêu/dây leo/cây bám | Mảng loang và tiếp xúc vách | … | … |
| Công trình/tàn tích/đường | Kiến trúc đọc được, mòn có nguyên nhân | … | … |
| Hồ/suối/thác | Độ sâu và flow nhiều lớp | … hoặc không áp dụng | … |
| Đèn/ngày đêm/đom đóm | Ánh ấm dịu, kính có màu, chuyển động nhẹ | … hoặc không áp dụng | … |

Palette chủ đạo: …; palette nhấn: …; khác Vườn Gió ở điểm: …; dấu hiệu vẫn cùng bộ: …

**Bất biến cụ thể của task:** liệt kê mesh/module/palette/vị trí phải giữ. **Ngoại lệ được phép:** khai báo trước khi sửa để checker không tự nới sau khi fail. Đừng áp nguyên yêu cầu “đáy v15 không đổi” lên đảo mới có nguồn khác; đó là bất biến của Vườn Gió.

## Thực thi và đầu ra

- Phạm vi file/module được sửa: …
- Phụ thuộc dùng lại, nơi tích hợp material/runtime chung: …
- Nguồn reference và quyền dùng: …
- Người/agent chịu trách nhiệm: …; mặc định một implementer theo AGENTS.md.
- Nếu owner yêu cầu delegation: ownership từng thư mục/file, đầu ra cần báo lại, parent tích hợp, không concurrent build chung.
- Mốc 1: khối và palette; mốc 2: botany/material; mốc 3: details/runtime; mốc 4: QA và bàn giao.

Đầu ra phải có source, GLB/kit, manifest, runtime/config, QA/log, ảnh desktop/phone, hash và context ngắn. Vật liệu hoặc metadata đổi phải áp dụng nhất quán cả kit lẫn assembly.

## Nghiệm thu

- [ ] Dùng cùng camera/đèn/clock với chuẩn; overview và mặt sau đọc tốt.
- [ ] Đủ các hạng mục trong [BUILD-AND-QA](BUILD-AND-QA.md), ghi rõ mục không áp dụng.
- [ ] Bám nền/UV/normal/geometry và những bất biến đã khai báo có bằng chứng.
- [ ] Chuyển động/ngày đêm/pause/disposal và viewport đạt nếu có runtime.
- [ ] Ghi tam giác, byte, texture, draw calls/memory khi đo; không tự nhận đạt điện thoại chỉ vì viewport 390 px.
- [ ] Đã rà soát riêng: phần nào không cùng phong cách, lỗi tiếp xúc, ánh phản quang, lặp shape, phần còn thiếu.
- [ ] Owner đã duyệt bản cụ thể; lưu ngày, version, hash và ảnh tương ứng.

**Kết quả lệnh:** …
**Giới hạn chưa kiểm:** …
**Quyết định cuối và thay đổi so với brief:** …
