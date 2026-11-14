# Reading Quest — Mật thư Học viện

> Superseded: chủ sở hữu bác bỏ prototype v1 vì vẫn giống bài IELTS, yêu cầu
> desktop trước. Không lấy việc kiểm tra chức năng đạt làm bằng chứng gameplay
> được chấp nhận. Xem `2026-11-11-reading-quest-detective-prototype.md` cho bản v2.

Ngày 2026-11-11. Đề xuất gameplay và bản HTML để chủ sở hữu chơi thử.
Chủ sở hữu yêu cầu đi thẳng vào gameplay, chưa cần đi từ A tới B, tích hợp
3D hay làm tiếp ngoại hình. Đây là phạm vi prototype được yêu cầu; chưa là
duyệt cơ chế chính thức hoặc yêu cầu triển khai vào app.

## Tên và ý tưởng

**Reading Quest — Mật thư Học viện.** Người chơi là người giải mã tài liệu
trong thư viện học viện. Mỗi hồ sơ có một đoạn tiếng Anh và ba lời khẳng định.
Tìm đúng ý và bằng chứng sẽ mở từng dấu niêm phong của một trang nhật ký.
Phần thưởng là đoạn chuyện tiếp theo, không phải tiền, XP hoặc bảng xếp hạng.

Kỹ năng thử trước: phân biệt True, False và Not Given, nhận ra diễn đạt lại,
đọc điều kiện, không suy diễn từ thông tin còn thiếu. Nội dung tự soạn cho
prototype; không dùng để xác định CEFR, band IELTS hay mức thành thạo.

## Một lượt chơi cụ thể

1. Mở trang là thấy hồ sơ đầu, tài liệu và câu cần giải. Không phải đi bộ,
   chọn avatar hoặc vượt hội thoại mở đầu. Đọc hướng dẫn là tùy chọn.
2. Chọn **True / Đúng**, **False / Bị phủ định**, hoặc **Not Given / Chưa có thông tin**.
   Chọn lại thoải mái trước khi kiểm chứng.
3. Bấm một câu trong tài liệu để ghim làm bằng chứng. Muốn đổi thì bấm câu khác.
   Với Not Given, chọn **Tài liệu không cho biết**; không ép trích một câu để
   chứng minh sự vắng mặt của thông tin. Có thể làm bước 2 và 3 theo thứ tự bất kỳ.
4. Bấm **Kiểm chứng**. Nút chỉ bật khi đã chọn cả đáp án và căn cứ.
   Đúng cả hai: mở dấu niêm phong, hiện lời giải kèm câu trích. Đáp án đúng nhưng
   căn cứ sai: chỉ ra cần tìm căn cứ trực tiếp. Đáp án chưa khớp: gợi cách đọc lại,
   giữ lựa chọn cho người chơi chỉnh, không trừ điểm/mạng hay khóa lượt.
5. **Gợi ý** chỉ ra từ/cụm hoặc mối quan hệ cần chú ý. **Xem lời giải** luôn cho
   phép đi tiếp và được ghi là đã đọc lời giải, không tính như tự giải.
6. Bấm **Sang lời tiếp theo**. Sau ba lời, hiện trang nhật ký được khôi phục và
   bảng tóm tắt lời khẳng định, đáp án, căn cứ và cách hoàn thành.
7. **Mở hồ sơ thứ hai** có văn bản/câu hỏi mới để thử chuyển kỹ năng. **Chơi lại
   hồ sơ** có xác nhận trước khi xóa lượt hiện tại. Ghi nhớ đáp án cũ không được
   gọi là bằng chứng đã thành thạo. Không có đồng hồ, streak hay phạt bỏ ngày.

## Nội dung bản thử

- Hồ sơ 1 — **Phòng đọc Đèn Lồng**: đặt chỗ, điều kiện mang nước và so sánh số ghế.
  Trật tự đáp án False → True → Not Given.
- Hồ sơ 2 — **Lá thư từ nhà kính**: lịch mở cửa, thông tin còn thiếu và đối tượng
  được mượn cây. Trật tự True → Not Given → False.
- Từ khó có bảng nghĩa Việt ngắn trong mục trợ giúp. Không dịch toàn văn ngay
  từ đầu vì cơ chế cần người chơi đối chiếu nội dung tiếng Anh.
- Tiến độ chỉ lưu trong trình duyệt với khóa riêng của prototype; tải lại tiếp
  tục được. Nếu trình duyệt chặn lưu thì lượt chơi vẫn hoạt động, có báo rõ.

## Giao diện và thao tác

Giữ sắc giấy sáng, xanh rêu học viện và màu hành động nâu cam hiện có. Nội dung
đọc dùng serif, thao tác dùng sans. Dấu niêm phong là ba trạng thái có nhãn chữ,
không chỉ khác màu. Desktop đặt văn bản trái, bảng kiểm chứng phải. Điện thoại
xếp bảng câu hỏi trước, tài liệu sau, có liên kết nhảy giữa hai phần. Chọn câu
trên điện thoại đưa về bảng kiểm chứng. Tab/Enter/Space dùng được; dialog chơi
lại hỗ trợ Escape và trả focus. Tôn trọng giảm chuyển động.

```
Reading Quest                         Cách chơi · Chơi lại
Mật thư Học viện
Phòng đọc Đèn Lồng              [Đặt chỗ] [Nước] [Số ghế]
┌ Tài liệu tiếng Anh ─────────┬ Lời khẳng định hiện tại ┐
│ Bấm câu để ghim bằng chứng  │ True / False / Not Given│
│ ...                        │ Câu đã ghim / thiếu tin│
│ ...                        │ Kiểm chứng             │
└────────────────────────────┴────────────────────────┘
```

## Phạm vi và kiểm tra

Artifact tự chứa HTML/CSS/JS tại `output/prototypes/reading-quest/index.html`;
không sửa gameplay 3D, không backend, tài khoản, AI chấm bài hoặc dịch vụ trả
phí. Server xem thử chỉ phục vụ thư mục artifact trên loopback. Không đưa toàn
repository ra web. Không cần chạy lại build app cho artifact độc lập.

Kiểm tra cần làm: nhánh sai/đúng, đúng đáp án nhưng sai căn cứ, Not Given,
gợi ý/lời giải, cả hai hồ sơ, lưu/tải lại, reset/hủy reset, keyboard/Escape,
desktop/phone/reduced-motion, console và cuộn ngang. Tự review riêng theo yêu
cầu single-agent. Bản mẫu chứng minh luồng chơi, chưa chứng minh hiệu quả học.
