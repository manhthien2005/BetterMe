# The Aurora Gallery — Reading trong phòng triển lãm 3D

Owner chuyển ưu tiên từ mẫu Listening sang Reading, giữ mong muốn gameplay
tương tác đã được xác nhận với Lost Signal. Một bài thử nhỏ, không mở rộng
thành chương trình học hoặc dạng bài trắc nghiệm trên bàn.

Phản hồi sau mẫu: owner chưa hiểu rõ cách chơi nhưng thấy có tiềm năng, hỏi
về hướng giải đố/điều tra kiểu Sherlock Holmes cho Reading. Đây là định hướng
đang trao đổi, chưa nghiệm thu độ rõ ràng của mẫu hoặc duyệt một game mới.
Cần giữ tương tác trong cảnh thật; mẫu detective bàn giấy trước đã bị bác.

## Chơi thử

**http://127.0.0.1:3027**. Server exec session 31946 tại lúc bàn giao.

```powershell
node output/prototypes/reading-gallery/serve.mjs
```

Chạy từ worktree `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`.
Server localhost, whitelist file, không xác thực/dữ liệu riêng tư hoặc mở ra
LAN. Cần server còn chạy; không mở trực tiếp HTML bằng file://. Không cần âm thanh.

## Kỹ năng và vòng chơi

**Tìm thông tin cụ thể và nhận ra cách diễn đạt tương đương.** Một hồ sơ hư cấu
243 từ, ba đoạn về chuyến tàu Aurora. Sáu hiện vật có model thật: compass,
telescope, bell, whistle, camera, journal. Khôi phục ba câu chuyện bằng cách
đọc mô tả, tìm bằng chứng, rồi trực tiếp kéo hiện vật phù hợp lên bục giữa phòng.

Yêu cầu dựa vào dữ kiện riêng trong bài, không chỉ công dụng phổ biến:

- Hiện vật đổi người dùng khi người dùng trước bị thương: compass.
- Hiện vật đổi vai trò sau khi người ngoài hiểu nhầm tín hiệu: bell.
- Hiện vật tạo ra sản phẩm giúp gây quỹ sửa tàu: camera.

Mỗi vật gây nhiễu có chi tiết đối chiếu: telescope giữ nguyên người dùng,
whistle giữ nguyên mục đích, journal không góp tiền cho quỹ. Sau lần đặt đúng,
hiện vật tự di chuyển vào vị trí triển lãm, một vòm sáng lên và trích dẫn được
tô trong hồ sơ. Giải thích nối cụm trong câu hỏi với nội dung và từ quy chiếu
trong đoạn. Người chơi chủ động bấm tiếp sau khi đọc phản hồi.

Hồ sơ nằm bên phải, chữ 16–17px và cuộn độc lập. Có thể thu gọn để thao tác
rộng hơn. Không đánh dấu đáp án trước khi đặt thành công. Chọn nhầm trả hiện
vật về chỗ, giữ những gì đã khôi phục và nhắc đối chiếu lại mà không nêu đáp án.

## Điều khiển

- Kéo trực tiếp model 3D lên bục và thả.
- Hoặc bấm model/tên hiện vật, rồi bấm bục.
- Bàn phím: Tab/Enter chọn, WASD/mũi tên di chuyển hiện vật đang cầm, E đặt.
- R mở/thu hồ sơ. Escape trả vật đang cầm; khi không cầm vật thì tạm dừng.
- Focus trong bài đọc dùng mũi tên/End để cuộn, không kéo theo hiện vật.

Ba câu chuyện cố định, không thời gian/điểm/band. Reload bắt đầu lại; reset
giữa màn có xác nhận. Mẫu không lưu phiên hoặc liên kết kinh tế BetterMe.

## Kiểm tra và review

- `node --test output/prototypes/reading-gallery/engine.test.cjs`:
  **7 pass, 0 fail**, RED trước triển khai 0/7. State, vị trí đặt, distractor,
  không nhận cùng vật hai lần, tiếp bước có chặn, movement và trích dẫn đúng nguồn.
- `node --check` game.js, scene.js, serve.mjs: exit 0.
- `qa.txt`: `GALLERY_FULL_PLAY_PASS` — thực sự dùng bàn phím đặt nhầm, raycast
  kéo compass/bell, click model camera và bục, đọc/trích dẫn/tiếp, hoàn thành.
  **0 page/console errors, 0 warnings**. QA chỉ có hook đọc, không sửa state.
- `qa-edges.txt`: `GALLERY_EDGE_PASS` — 1280×800, giảm chuyển động, bàn phím,
  đọc/cuộn không làm vật chuyển động, thu hồ sơ, blur hủy pointer capture,
  pause/reset/evidence cleanup, WebGL thất bại có thông báo. Blur được mô phỏng;
  chưa xác minh chuyển cửa sổ thật ở mức hệ điều hành.
- Regression browser: thông báo sai còn hiện khi đặt đúng → RED, xóa ngay khi
  thành công → `SUCCESS_BANNER_PASS`. Tự review tách material của vòng chọn và
  xóa phím đang giữ khi focus/pointer vào hồ sơ. Không dùng subagent.
- Ảnh thật 1440×900 và 1280×800; detector HTML/CSS exit 0 sau chỉnh ink phụ.
  Đây không phải kiểm chứng toàn bộ khả năng tiếp cận của scene WebGL.
- HTTP smoke: root 200, HANDOFF.md 404, POST 405.

Ảnh/script/log gọn trong ignored `output/prototypes/reading-gallery/`. Thư viện
Three.js 0.187 + license từ mẫu cũ, không thêm package/CDN. Không sửa những mẫu
3025/3026 hoặc app chính. Không chạy/tuyên bố bốn gate app, commit/push/deploy.

## Giới hạn

Đây là thử nghiệm cách biến bằng chứng Reading thành lựa chọn hiện vật có hậu
quả trong cảnh. Chưa đo hiệu quả học hoặc độ cuốn hút với người dùng. Bộ đáp án
cố định cho phép nhớ sau lượt đầu; chưa có biến thể hoặc bài chuyển giao. Có
thể thử lần lượt các vật, nên không xem hoàn thành là chứng cứ đã hiểu bài.
Không hiệu chuẩn band/CEFR, không thay thế passage đầy đủ của IELTS. Desktop
và WebGL; không mobile. Chờ owner chơi thử trước khi mở rộng gameplay.
