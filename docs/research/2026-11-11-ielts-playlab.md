# IELTS Playlab — nghiên cứu và ba mẫu gameplay

Ngày: 2026-11-11. Owner bác hướng giả kim vì hoạt động chính giống hóa học;
yêu cầu nghiên cứu gameplay tiếng Anh phù hợp IELTS và dựng các mẫu để thử.
Điều chỉnh cốt lõi: **việc hiểu và dùng tiếng Anh phải là nước đi của game**.
Đây là ba thử nghiệm để chọn hướng, chưa phải gameplay được owner nghiệm thu.

## Những mẫu đã đối chiếu

| Nguồn chính thức | Cơ chế được mô tả | Quyết định áp dụng |
|---|---|---|
| [Cambridge Adventures in English](https://www.cambridgeenglish.org/learning-english/games-social/adventures-in-english/) | Giải bí ẩn, gặp nhân vật, hoàn thành nhiệm vụ bằng tiếng Anh; dành cho trẻ em A1+ | Học cách tạo mục đích giao tiếp. Không lấy cấp độ hoặc kết quả học tập của sản phẩm này làm bằng chứng cho IELTS. |
| [Her Story](https://www.herstorygame.com/about/) | Gõ từ khóa, tìm các đoạn phỏng vấn chứa từ đó, tự tái dựng câu chuyện phi tuyến | Mẫu Reading dùng tra cứu và theo dấu từ khóa. Đây là game tham khảo cơ chế, không phải khóa tiếng Anh. |
| [Lingo Legend / Yorthwood](https://www.lingolegend.com/yorthwood) | Chọn thẻ, trả lời câu hỏi, kích hoạt khả năng; xây bộ bài | Giữ quyết định sử dụng/giữ thẻ. Thay cổng câu hỏi bằng chính câu lập luận được chơi. Nguồn đã đọc trong lượt nghiên cứu trước. |
| [Influent](https://playinfluent.com/) | Tương tác với vật thể để học tên và phát âm | Hữu ích cho từ vựng; không chọn làm gameplay chính vì mục tiêu IELTS cần đọc/nghe liên kết thông tin và phát triển ý. Nguồn đã đọc trước. |

Lượt này đọc trang Cambridge, phần About của Her Story và ba trang mô tả
IELTS chính thức. Không trực tiếp chơi các sản phẩm thương mại, không dùng
tóm tắt AI của công cụ tìm kiếm làm bằng chứng. Các lựa chọn thiết kế và
đánh giá độ phù hợp là phân tích, không phải kết quả nghiên cứu thực nghiệm.

## Liên hệ với IELTS

- [Academic Reading](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading):
  tìm thông tin cụ thể, phân biệt ý chính/ý hỗ trợ, nhận biết khẳng định và quan
  hệ giữa dữ kiện. Mẫu dùng nguồn hư cấu ngắn, không phải bộ đề đầy đủ.
- [Listening](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening):
  nghe chi tiết, theo hội thoại và nhận ra quan hệ giữa các thông tin. Mẫu biến
  thông tin nghe thành quyết định xếp lịch, có đính chính và ràng buộc chung.
- [Academic Writing](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing):
  trả lời đúng trọng tâm, phát triển ý bằng bằng chứng/ví dụ, tổ chức ý logic.
  Mẫu chỉ luyện lập luận trước khi viết; không kiểm tra toàn bộ bốn tiêu chí
  Writing, không thay thế bài Task 2 tự viết, không đưa band score.

## Bản chạy

**URL:** `http://127.0.0.1:3024`.

**HTML độc lập:** `output/prototypes/ielts-playlab/index.html` (~386 KB, gồm cả
âm thanh). Có thể mở trực tiếp bằng `file://`, không cần mạng hay cài thư viện.

Server: `node output/prototypes/ielts-playlab/serve.mjs`; exec session 39608 tại
thời điểm bàn giao. Chỉ loopback và hai đường dẫn HTML; không có xác thực hoặc
dữ liệu riêng tư, không phục vụ repository. URL cần tiến trình server còn chạy.

| Mẫu | Người chơi quyết định gì? | Điều cần quan sát khi owner thử |
|---|---|---|
| **Hồ sơ bản tin** | Tìm từ khóa nào, mở hồ sơ nào, bằng chứng nào chứng minh từng sửa đổi trong bản tin | Việc tự tìm nguồn có tạo tò mò hay vẫn giống kiểm tra câu trả lời? |
| **Tổng đài đổi lịch** | Đặt nhóm nào vào phòng/giờ nào; đổi chỗ ra sao khi cuộc gọi bổ sung thay yêu cầu | Người chơi có muốn giải xong lịch và chủ động nghe lại để xử lý xung đột? |
| **Bàn tranh biện** | Chơi cặp câu nào, thứ tự nào, giữ lập luận linh hoạt cho lượt sau | Thẻ câu có tạo cân nhắc thực sự hay chỉ là ghép câu có sẵn? |

### Hồ sơ bản tin — Reading

Kho tám nguồn, mỗi tìm kiếm trả tối đa ba kết quả. Đọc nguồn mới để khám phá
từ khóa tiếp; hồ sơ đã mở được giữ trong danh sách. Sửa ba diễn giải sai về
tuyến xe buổi tối: lượng khách, tạm dừng/vĩnh viễn và nguyên nhân. Phải gắn
nguồn đã đọc có nội dung hỗ trợ, không chỉ chọn đúng chữ. Có nguồn gây nhiễu
về tuyến sáng, khảo sát giờ đi và ngân sách không công bố.

### Tổng đài đổi lịch — Listening

Ba cuộc gọi, hai phòng, ba khung giờ. Room Oak có 24 chỗ và máy chiếu; Pine
có 12 chỗ, không máy chiếu. Maya cần 18 chỗ/máy chiếu, linh hoạt 9 hoặc 10;
Leo tám người, chỉ 10; Nora 12 người/máy chiếu, ban đầu 9. Lịch hợp lệ đầu
tiên mở cuộc gọi Nora đổi sang 10, buộc chuyển Maya sang 9. Đặt lên ô đã có
nhóm đổi chỗ hai nhóm, có hoàn tác. Gửi lịch khi chưa phù hợp trả phản hồi cụ thể.

Bốn MP3 được tạo từ lời thoại tự soạn bằng giọng Windows David/Zira, tổng
khoảng 61 giây. FFprobe xác nhận từng clip 12.7–17.2 giây. Có nghe lại và lời
thoại hỗ trợ. Đây là giọng tổng hợp rõ ràng, chưa phản ánh toàn bộ giọng nói,
ngữ điệu hoặc điều kiện nghe một lần của bài thi thật.

### Bàn tranh biện — chuẩn bị Writing Task 2

Đề mở cửa thư viện muộn. Mười thẻ câu, hai ô phản hồi, ngân sách ba điểm mỗi
lượt, ba phản biện về lợi ích/chi phí/quyền tiếp cận. Thẻ đã chơi rời tay; có
nhiều đường hoàn thành và cặp kết hợp hợp lý. Trả lại/đảo thẻ được phép trước
khi trình bày. Bản cuối ghép ý đã chọn và có ô viết lại tự do lưu tại máy.

Các cặp chấp nhận là nội dung biên soạn hữu hạn. Phản hồi nói rõ khi cặp chưa
được hỗ trợ, không coi đó là phán quyết toàn diện về tiếng Anh. Không có AI
chấm bài, không đánh giá bản viết tự do hoặc gán mức điểm IELTS.

## So sánh và tiến trình

Chuyển ba tab bất kỳ lúc nào; tiến trình riêng cho từng mẫu. Nút chơi lại có
xác nhận và chỉ xóa mẫu hiện tại. Chuyển tab dừng/giải phóng âm thanh. Nút
“Muốn chơi tiếp / Cần chỉnh thêm / Chưa hợp” chỉ lưu lựa chọn trong trình duyệt
người dùng; không gửi khảo sát và không tự thông báo cho agent.

Ưu tiên thử **Tổng đài đổi lịch** trước vì quyết định nghe → xếp lịch → thay
đổi kế hoạch thể hiện vòng chơi rõ nhất. Đây là đề xuất thiết kế; cảm giác
cuốn hút vẫn phải lấy từ phản hồi chơi thật. Không coi việc bấm hoàn thành,
thích giao diện hay nhớ lời giải là bằng chứng tăng năng lực IELTS.

## Kiểm tra và tự review riêng

- `node --test output/prototypes/ielts-playlab/engine.test.cjs`: RED 0/6, rồi
  GREEN **6/6**. Kiểm tra tìm kiếm, nghĩa và nguồn bằng chứng, lịch trước/sau
  thay đổi, đổi chỗ, hai chiến lược thẻ, cặp bổ sung, thứ tự/chi phí/tái dùng,
  khôi phục dữ liệu không hợp lệ. Cùng engine được nhúng trong HTML.
- `pnpm browser run-code --filename=output/prototypes/ielts-playlab/qa.txt --raw`
  trả **IELTS_PLAYLAB_QA_PASS**: cả ba luồng, phát thực bốn clip, lịch thay đổi,
  hai cách chơi thẻ, bàn phím/kéo thả, lưu/tải/reset riêng, lựa chọn yêu thích,
  storage hỏng/bị chặn và âm thanh offline; 1440×900 + 1280×800;
  **0 console/page errors**.
- `.../final-qa.txt` trả **IELTS_PLAYLAB_FINAL_PASS**: race chuyển tab khi audio
  đang bắt đầu, cặp nhượng bộ kết hợp, ảnh trạng thái mới ở 1280 và 1440.
  Tự review phát hiện promise phát audio bị hủy có thể ghi phản hồi nhầm sang
  tab khác; tái hiện rồi dùng generation guard, kiểm tra lại đúng.
- Đã xem ảnh thực ba mode desktop và hai mode 1280. Không cuộn ngang; màn thấp
  có thể cuộn dọc để xem phần kết/phản hồi. Nội dung đọc và thẻ không bị cắt.
- Một lần detector trên source template báo font đều 16px vì CSS được chèn
  lúc build. Computed styles của artifact thật: body 15px, h1 23px, h2 26px
  ở 1280; đây là giới hạn phân tích template, không sửa CSS theo cảnh báo giả.
- Nội dung được tự review: sửa ngày mơ hồ, mở thêm cặp lập luận hợp lý, sửa
  viết hoa khi nối mệnh đề, ghi rõ phạm vi chấm hữu hạn. Không reviewer agent
  theo yêu cầu owner. Chưa có review sư phạm độc lập hoặc đo kết quả học tập.

Nguồn tác giả HTML: `data.js`, `engine.js`, `styles.css`, `ui.js`, `shell.html`;
`build.mjs` nhúng mọi thứ. `make-audio.ps1` tái tạo audio từ nội dung `data.js`.
Ảnh JPEG nhỏ cùng thư mục, ưu tiên `final-desktop.jpg` hoặc
`final-listening-1280.jpg`, tránh tải lịch sử dài và ảnh lớn (yêu cầu giảm 413).

Không đổi code app, assets nhân vật, Supabase, mobile hoặc gameplay `/world`.
Không chạy build app cho prototype độc lập, không commit/push/deploy. Browser
QA đóng sau kiểm tra; server HTML được giữ để owner chơi.
