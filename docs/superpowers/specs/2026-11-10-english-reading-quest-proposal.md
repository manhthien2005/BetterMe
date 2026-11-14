# Reading Quest — đề xuất cơ chế nhiệm vụ tiếng Anh

## Điều chỉnh mới nhất — 2026-11-11

**Checkpoint hiện tại:** owner tiếp tục bác hướng giả kim vì giống hóa học,
yêu cầu gameplay gắn trực tiếp tiếng Anh/IELTS. Đã dựng ba mẫu HTML trong
[IELTS Playlab](../../research/2026-11-11-ielts-playlab.md): tra cứu và bằng
chứng Reading, điều phối từ cuộc gọi Listening, thẻ lập luận Writing. Đây là
các mẫu để owner so sánh, chưa nghiệm thu gameplay. Không lấy hướng giả kim
hoặc bản trắc nghiệm cũ làm mặc định cho lượt tiếp theo.

Chủ sở hữu yêu cầu thử gameplay trực tiếp bằng HTML, không cần di chuyển hay
tích hợp 3D. Prototype True/False/Not Given sau đó bị bác bỏ vì giống bài IELTS
bọc giao diện, thiếu gameplay cuốn hút. **Ưu tiên desktop, chưa tập trung mobile.**
Bản đề xuất/mẫu thay thế là điều tra tại bàn với ghép manh mối, khóa ký hiệu
và nối sao; xem [prototype v2](../../research/2026-11-11-reading-quest-detective-prototype.md).
Chưa được chủ sở hữu duyệt gameplay. Phần đề xuất trắc nghiệm dưới đây là lịch
sử, không phải hướng mặc định để agent triển khai tiếp.

Ngày 2026-11-10. **Đề xuất để chủ sở hữu xem trước; chưa duyệt triển khai.**
Ưu tiên đang là [ngoại hình player/NPC](2026-11-10-academy-character-art-design.md).

## Người học làm gì?

Một nhiệm vụ gắn một tình huống nhỏ trong học viện với một kỹ năng đọc cụ thể.
NPC đưa lý do đọc; nội dung tiếng Anh và cách tìm bằng chứng là phần luyện tập.
Thời lượng 3–5 phút là ước tính cho bài mở đầu, không phải đồng hồ đếm ngược.

Ví dụ: Minh cần kiểm lại thông tin về một góc đọc mới trước khi thông báo cho học
viên. Người chơi đọc bản tin rồi phân biệt thông tin được xác nhận, bị phủ định
và chưa được đề cập — kỹ năng cần cho dạng True / False / Not Given.

## Vòng chơi đề xuất

1. **Nhận tình huống:** An giới thiệu khu học; Minh mời kiểm bản tin. Các lần sau
   có thể mở lại bài từ nơi học, không bắt đi qua quảng trường cho mỗi câu hỏi.
2. **Đọc:** đoạn tiếng Anh khoảng 120–180 từ cho bài đầu; hướng dẫn và phần hỗ trợ
   có thể bằng tiếng Việt. Trình độ cụ thể chưa chốt; không suy band IELTS từ avatar.
3. **Luyện:** ba câu bám một kỹ năng. Người học được xem lại văn bản khi trả lời.
4. **Hiểu đáp án:** hiện kết quả cùng câu làm bằng chứng; với Not Given, giải thích
   thông tin nào còn thiếu. Có thể thử lại hoặc xem giải thích ngay, không mất lượt.
5. **Khép lại:** lưu bài đã làm và điểm cần ôn. Phần thưởng thị giác nhỏ là tùy chọn
   cho thiết kế sau; chưa thêm XP, tiền tệ hay liên kết vào kinh tế thú cưng.

## Ví dụ nội dung để hình dung

Đoạn minh họa do dự án tự soạn; chưa phải bài kiểm tra trình độ hoặc nội dung đã
biên tập để phát hành:

> The academy library is opening a quiet reading room next month. It will be on
> the second floor, beside the language section. The room will be open from nine
> in the morning until six in the evening, Monday to Friday. Students will not
> need to book a seat, but they will need to show their academy card at the desk.
> Small group discussions will continue in the rooms on the ground floor. The
> new room is intended for individual reading, so phone calls and conversations
> will not be allowed inside. Students may bring water in a closed bottle, but
> food must be left outside. Staff will collect comments during the first month
> and use them to decide whether any changes are needed.

| Câu | Đáp án | Cách giải thích |
| --- | --- | --- |
| Students must reserve a seat before using the new room. | False | “will not need to book a seat” phủ định yêu cầu đặt chỗ; “reserve” là cách diễn đạt lại của “book”. |
| Students can take water into the room if the bottle is closed. | True | “may bring water in a closed bottle” xác nhận đúng điều kiện. |
| The new room will have more seats than the language section. | Not Given | Bài nói vị trí cạnh khu ngôn ngữ, không so sánh số ghế. Không thể lấy sự im lặng làm bằng chứng cho False. |

Phản hồi mẫu khi chọn False cho câu cuối: “Đoạn này chưa cho biết số ghế ở hai khu.
Mình chọn Not Given khi thông tin chưa được xác nhận hoặc phủ định.” Sau lời giải,
cho một câu tương tự nếu người học muốn luyện thêm; không coi việc nhớ đáp án cũ
là bằng chứng đã thành thạo kỹ năng.

## Phạm vi cần chốt sau mốc ngoại hình

- Điểm bắt đầu theo nhu cầu/trình độ tự chọn của người học; ví dụ trên chưa được
  hiệu chuẩn CEFR hay band IELTS.
- Một kỹ năng, một bài nhỏ và phản hồi có bằng chứng trước. Các dạng matching
  headings, từ trong ngữ cảnh hoặc đọc suy luận được thiết kế sau khi vòng này rõ.
- Không coi ba câu hỏi là bài thi IELTS đầy đủ, không quy đổi sang band score.
- Có thể dừng, quay lại, thử lại; không phạt, giảm tiến độ hoặc trách người bỏ ngày.
- Không thêm chấm speaking/writing bằng AI, dịch vụ trả phí, backend, dữ liệu thật,
  cơ chế XP hay thay đổi sync khi chưa có thiết kế và yêu cầu triển khai riêng.

Tài liệu này giải thích trải nghiệm; chưa phải implementation plan và không cho
phép agent tự chuyển trọng tâm từ ngoại hình sang xây bài học.
