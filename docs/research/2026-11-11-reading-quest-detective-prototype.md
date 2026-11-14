# Reading Quest — Hồ sơ Đèn Lồng (prototype v2)

2026-11-11. Chủ sở hữu bác bỏ v1 vì giống bài IELTS bọc giao diện, yêu cầu
tập trung desktop và gameplay. Bản thử này thay vòng trắc nghiệm; không sửa
game 3D, không đi từ A tới B. Tên/cơ chế dưới đây là đề xuất để chơi thử.

## Câu chuyện và mục tiêu

Bản đồ sao rời khỏi thư viện trước buổi ngắm đêm. Người chơi điều tra ngay
trên bàn hồ sơ: xác định nơi giữ bản đồ, mở hộp bảo quản và phục hồi tuyến sao.
Không có True/False/Not Given, chấm điểm hay đếm từ. Đọc tiếng Anh để biết
mình cần làm gì trong thế giới trò chơi. Không giới hạn lượt hoặc thời gian.

## Ba vòng tương tác

1. **Điều tra tự do.** Ba tài liệu mở theo thứ tự tùy ý. Ghim câu đáng chú ý vào
   khay manh mối. Bấm hoặc kéo hai thẻ vào hai ô ghép. Phiếu chuyển + sổ thiết
   bị suy ra đài quan sát, mở túi hồ sơ mới. Có hai suy luận phụ về người chuyển
   và lý do bảo quản, bổ sung kết thúc nhưng không chặn tiến trình chính.
2. **Khóa ký hiệu.** Đọc lời chỉ dẫn về thứ tự, xoay bốn ô Mặt trời/Nước/Hạt/Lá.
   Bấm mở khóa, cánh hộp mở khi khớp; chưa khớp có phản hồi để thử lại. Đây là
   điều khiển một vật thể, không chọn câu trả lời trong đề thi.
3. **Bản đồ sao.** Bấm các nút sao để vẽ một đường đi theo chỉ dẫn tiếng Anh về
   phương hướng/vị trí. Có quay lại một bước/xóa tuyến. Tuyến đúng thắp sáng
   chòm sao và hoàn thành câu chuyện. Sai không phá đồ hay xóa khám phá đã có.

## Khác biệt cần chứng minh

- Tự chọn tài liệu và thông tin nào đáng giữ; có manh mối không dùng ở đường chính.
- Hành động thay đổi trạng thái vật thể, tài liệu mở được và kết thúc truyện.
- Ba động từ chơi khác nhau: ghép → xoay → nối. Kết quả hiện trực tiếp trên bàn.
- Câu hỏi cho owner sau thử: suy luận có đáng suy nghĩ không, mở khóa/nối sao
  có tạo hứng thú không, đoạn nào cảm giác vẫn đang làm bài tập? Prototype
  không tự chứng minh là cuốn hút; cần phản hồi chơi thật.

## Scope

HTML độc lập, desktop 1440×900 và 1280×800. Mouse drag/click, keyboard thao tác
cơ bản, lưu local riêng và chơi lại. Không ưu tiên mobile. Dùng màu giấy/xanh
rêu của hướng học viện; trình bày vật chứng và dụng cụ thay cho trang bài thi.
Không backend/AI/network assets. `output/prototypes/reading-quest-detective/`.
Kiểm tra đường chính, ghép sai/khóa sai/tuyến sai, suy luận phụ, lưu/tải lại,
hủy reset, kéo thả, bàn phím và screenshot desktop. Self-review single-agent.

## Bản chạy và bằng chứng

- `http://127.0.0.1:3022` phục vụ duy nhất HTML mẫu, không dữ liệu repository.
  File tự chứa: `output/prototypes/reading-quest-detective/index.html`.
- `pnpm browser run-code --filename=output/prototypes/reading-quest-detective/qa.txt --raw`
  trả `DETECTIVE_GAMEPLAY_PASS`: đủ ba giai đoạn, hai suy luận phụ, kéo thả,
  ghép sai, khóa sai/đúng, tuyến sai/đúng, lùi bước, khám phá sau kết thúc,
  lưu/tải lại từng giai đoạn, reset/Escape/focus, keyboard, storage hỏng/bị chặn.
  Console/page errors: 0. Desktop 1440×900 và 1280×800, không cuộn ngang.
- Sau điều chỉnh chữ/biểu tượng: `final-capture.txt` trả
  `DESKTOP_FINAL_AND_CONTEXT_HINTS_PASS`; gợi ý đi theo ngữ cảnh bảng suy luận
  và hộp khóa, không bị nhầm giai đoạn khi quay lại.
- Tự review riêng: đã xem ảnh desktop, bảng ghép, khóa, bản đồ và đoạn kết.
  Đổi serif sang Cambria để tiếng Việt hiển thị liền; phân biệt icon hạt/lá;
  tăng nhãn nhỏ lên 12px. Detector chỉ có advisory chữ nhỏ trước lần tăng này;
  không có primary finding. Giữ sắc giấy từ hệ thị giác dự án.
- Đây là code-led prototype, không có comp đã được chủ sở hữu duyệt. Không
  reviewer agent theo yêu cầu owner. Không sửa DESIGN.md hoặc luật UI app.
  Chưa xác nhận độ cuốn hút, giá trị học tập hay nghiệm thu gameplay; không QA
  mobile theo chỉ đạo mới. Không chạy bốn gate app vì không sửa code app,
  không commit, không deploy. QA browser đóng; server mẫu còn chạy để xem.
