# Lost Signal — mẫu Listening trong không gian 3D

Ngày 2026-11-11. Owner bác các mẫu trước vì vẫn giống thao tác văn bản, và
cho phép tự nghiên cứu, brainstorm, thực thi gameplay sinh động trên máy tính.
Sau khi xem mẫu, owner xác nhận: "đó là game tương tác mà anh muốn" và muốn
áp dụng hướng này cho các bài học IELTS sau. Đây là chấp thuận hướng tương tác,
chưa phải nghiệm thu chương trình học hoặc bằng chứng hiệu quả IELTS.

## Nghiên cứu và lựa chọn

- [Keep Talking and Nobody Explodes](https://keeptalkinggame.com/): trang chính
  thức mô tả người nhìn thấy thiết bị và người có hướng dẫn nắm các thông tin
  khác nhau, cần trao đổi để phối hợp. Áp dụng việc lời nói cung cấp thông tin
  cần cho hành động; không lấy chủ đề bom, áp lực thời gian hoặc cơ chế trừng phạt.
- [IELTS Listening](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening):
  dùng định hướng từ trang định dạng chính thức đã đọc ở lượt nghiên cứu trước:
  hiểu thông tin cụ thể và các mối quan hệ trong nội dung nghe. Các câu chỉ vị trí,
  điều kiện và đính chính trong mẫu là lời thoại tự biên soạn, không phải đề thi.
- Đã thử đọc Operation Tango nhưng phần nội dung tải về không đủ để đối chiếu
  cơ chế; không dùng trang đó làm bằng chứng trong quyết định này.

Đã cân nhắc điều phối thời gian thực, phối hợp với người giữ thông tin khác,
và hội thoại nhân vật bằng giọng nói. Chọn một lát cắt chơi đơn với đồng đội
qua radio có kịch bản: có thể thử ngay, không cần người chơi thứ hai hoặc API
giọng nói. Chưa trực tiếp chơi các game thương mại để đánh giá độ cuốn hút.
Đây là suy luận thiết kế, không phải bằng chứng hiệu quả học tập.

## Vòng chơi cụ thể

Anh điều khiển robot trên ba đảo nối bằng bốn cầu. Maya giữ thông tin vị trí
bộ tiếp sóng và thay đổi đường đi; anh thấy không gian và tự điều khiển robot.
Không có mũi tên đánh dấu đúng mục tiêu hoặc danh sách đáp án.

1. Nghe vị trí bộ tiếp sóng cạnh café ở phía tây, phân biệt với greenhouse.
   Cấp điện cầu phía nam, đi tới đúng điểm, nhấn E thu vật phẩm rồi mang về trạm.
2. Nghe chỉ dẫn tới library. Khi robot bắt đầu đi về phía bắc, hoặc sau 22 giây
   trong nhiệm vụ, Maya báo cầu bắc mất điện. Đích vẫn là library; anh chuyển
   sang cầu nam rồi đi lên phía bắc trên đảo bên kia. Đổi cầu không xảy ra khi
   robot đang trên cầu, tránh làm robot mắc kẹt giữa kênh.
3. Nghe vị trí gallery đối diện greenhouse ở phía đông. Cầu bắc hoạt động trở
   lại; chọn một trong hai mạch. Tránh vùng nhiễu di chuyển hoặc bật xung bảo vệ
   để đi qua. Giao bộ thứ ba sẽ bật các vòng sáng và chùm sáng hải đăng.

Nhiễu làm chậm robot còn 30% tốc độ; xung bảo vệ kéo dài 2,2 giây, hồi sau
4,5 giây. Không chết, không mất tiến trình đã giao, không tính điểm phản xạ
ngôn ngữ. Tới nhầm điểm nhận thông báo địa điểm, có thể nghe lại và tiếp tục.
Đây vẫn là màn nhiệm vụ tuyến tính ngắn, chưa có hệ thống chơi lại đa dạng.

## Bản chạy và điều khiển

URL: **http://127.0.0.1:3025**.

Khởi chạy từ worktree `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`:

```powershell
node output/prototypes/lost-signal/serve.mjs
```

Server chỉ bind loopback và phục vụ danh sách file cố định, không có xác thực
hay dữ liệu riêng tư. Không mở ra LAN/Internet. URL cần tiến trình server đang
chạy; đây là HTML + ES modules nhiều file, không mở trực tiếp bằng file://.

| Điều khiển | Tác dụng |
|---|---|
| WASD / phím mũi tên | Lái robot trực tiếp |
| Bấm mặt đất / tên công trình | Đặt đường tự đi; chỉ tới điểm anh chọn |
| E | Thu vật phẩm hoặc giao ở vòng tròn trung tâm |
| Q / Bắc–Nam | Chuyển mạch cầu; chỉ một mạch được cấp điện |
| Space | Xung bảo vệ khỏi nhiễu |
| R / Nghe lại | Phát lại thông tin phù hợp trạng thái hiện tại |
| C / CC | Bật/tắt lời thoại tiếng Anh |
| 0.8× / Hỏi rõ vị trí | Nghe chậm / nghe lời giải thích đã soạn |
| Escape | Tạm dừng, tiếp tục |

Lưu cục bộ sau mỗi lần giao thành công. Reload quay lại trạm với số tín hiệu
đã giao; chặng đang đi chưa được lưu. Save của mẫu này tách khỏi ứng dụng chính.

## Hình ảnh và âm thanh

Cảnh là hình học 3D thật bằng Three.js 0.187 có sẵn trong repo: mặt nước
shader, công trình, cây, đèn, drone, cầu đổi độ cao, vùng nhiễu, hạt sáng,
khoang hàng và hải đăng phục hồi từng phần. Giữ nguyên các model nhân vật
đã được owner duyệt trong `/world`. Không tạo hoặc thay artwork nhân vật.

11 lời thoại tiếng Anh tự soạn, chuyển thành MP3 bằng Windows Zira + FFmpeg.
Giọng tổng hợp, đồng đội có kịch bản; không có microphone, nhận dạng giọng nói,
hội thoại AI tự do hoặc chấm Speaking. Nghe lại/phụ đề không bị trừ điểm.
Khi giảm chuyển động, bỏ chuyển động trang trí; vùng nhiễu vẫn dịch chuyển vì
đó là thông tin cần cho gameplay.

## Kiểm tra và tự review

- `node --test output/prototypes/lost-signal/engine.test.cjs`: **8 pass, 0 fail**.
  Luật đường đi, va chạm, cầu đóng/mở, tốc độ, nhiệm vụ, vật phẩm, xung, checkpoint.
  Regression mới cho lái sát kênh/công trình rồi dùng đường tự đi có RED→GREEN.
- `node --check` cho `game.js`, `scene.js`: exit 0.
- `pnpm browser run-code --filename=output/prototypes/lost-signal/qa-first.txt`:
  `LOST_SIGNAL_FIRST_PASS` — audio thực sự chạy, phụ đề/tốc độ, bàn phím, pause,
  tới nhầm điểm, thu đúng vật phẩm, mang về giao.
- `qa-finish.txt`: `LOST_SIGNAL_FULL_MISSION_PASS` — bấm mặt đất, vào nhiễu,
  dùng xung, nghe đính chính, đổi cầu, reload checkpoint, hoàn thành đủ ba nhiệm vụ.
  **0 lỗi console/page, 0 cảnh báo** trong lần chơi này.
- `qa-resilience.txt`: `LOST_SIGNAL_RESILIENCE_PASS` — 1280×800, giảm chuyển
  động, HUD không điều khiển nhầm thế giới, Escape/focus, reset/hủy, save lỗi/sai
  thứ tự/bị chặn. Headless Chromium giữ cả hai tab focused/visible nên kiểm tra
  blur bằng sự kiện mô phỏng; chưa xác minh chuyển cửa sổ thật ở mức hệ điều hành.
- `qa-final.txt`: `LOST_SIGNAL_FINAL_PASS` — chuyển từ lái sát kênh sang đường
  tự đi, thông báo lỗi WebGL, chỉ phục vụ file cho phép, từ chối POST. Các log
  404/405 là lỗi cố ý của phép thử server, không được tính là lỗi hiển thị.
- Xem ảnh thật 1440×900 và 1280×800; tăng cỡ chữ chức năng lên 12px. Detector
  Impeccable trên HTML/CSS: **0 primary findings**, 3 advisory về viền/bóng của
  ba dialog riêng. Dialog không xuất hiện thành một hàng như detector suy đoán.
- Tự review riêng, không dùng subagent. Sửa hằng shadow đã bỏ ở Three phiên bản
  hiện tại, tách material của cổng cần đổi màu, giảm chuyển động trang trí,
  khóa nút bắt đầu cho tới khi tải xong, sửa làm tròn vị trí đầu đường đi.

Ảnh và script QA ở `output/prototypes/lost-signal/` (ignored). Ảnh JPEG gọn:
`start-final.jpg`, `gameplay-final.jpg`, `desktop-1280.jpg`, `lighthouse.jpg`,
`completed.jpg`. Không gửi toàn bộ lịch sử hoặc ảnh base64 trong hội thoại.

Không chạy hoặc tuyên bố bốn gate của app chính: lượt này chỉ thêm prototype
cục bộ và tài liệu, không sửa mã Next.js. Không commit, push hoặc deploy.

## Giới hạn cần đánh giá khi chơi thử

Mẫu thử sức hút của việc nghe để điều khiển hành động; chưa chứng minh tăng
band IELTS. Một người chơi, một bản đồ, ba nhiệm vụ cố định; chưa có nội dung
ngẫu nhiên, độ khó thích ứng hoặc chơi hợp tác. Voice chưa có độ đa dạng của
bài nghe thật. Cần WebGL; số khung hình quan sát trên trình duyệt QA không
đảm bảo hiệu năng trên mọi máy. Chưa có kiểm tra khả năng sử dụng bằng screen
reader cho toàn bộ cảnh 3D. Không làm bản mobile.
