# The Last Page — Bản thảo biến mất

Owner duyệt hướng điều tra kiểu Sherlock Holmes và yêu cầu một gameplay chơi
thử cho Reading. Giữ tương tác trong phòng 3D đã được chấp nhận; phạm vi một
căn phòng, một hồ sơ chính, ba bằng chứng. Desktop, single agent, log/ảnh gọn.

## Chơi thử

**http://127.0.0.1:3028** — server exec session 59574 tại lúc bàn giao.

```powershell
node output/prototypes/missing-manuscript/serve.mjs
```

Chạy tại `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`.
Server whitelist file, chỉ bind127.0.0.1, không xác thực/dữ liệu riêng tư; không
mở LAN. ES modules cần localhost, không mở HTML trực tiếp bằng file://.
Không cần âm thanh. Không đổi app hoặc các mẫu3025/3026/3027.

## Vòng chơi

19:00, thủ thư phát hiện bản thảo F-17 biến mất khỏi tủ kính. Cửa công cộng đã
đóng lúc18:00. Người chơi khám xét, đọc và tìm xem bằng chứng xác nhận điều gì.

- Ngăn trên bàn thủ thư trượt ra, lộ sổ trực. Ngăn dưới có chìa khóa thật.
- Nhặt chìa khóa, kéo biểu tượng vào model tủ kính hoặc bấm tủ để dùng chìa.
  Nắp kính mở bằng bản lề, lộ phiếu chuyển.
- Ba tủ đều mở tự do, có đồ vật khác nhau. Đoạn Reading mô tả vị trí kho khô
  bằng quan hệ với kệ sách và đồng hồ, đồng thời mô tả hai tủ gây nhiễu.
- Bấm tài liệu để đọc/lưu; có thể tìm bản thảo trước nhưng cần đủ ba nguồn để
  tái dựng. Không bắt buộc mở bài đọc như một điều kiện giả tạo để mở tủ.
- Đọc ba mốc giờ rồi bấm các địa điểm theo thời gian. Nhân vật mờ và dấu chân
  phát lại mỗi sự kiện. Chọn sai giữ nguyên bằng chứng và cho đọc lại.
- Kết thúc đối chiếu ba nguồn và giải thích giới hạn kết luận từ hồ sơ.

Hồ sơ chính nguyên bản245 từ; ba tài liệu tiếng Anh ngắn. Kỹ năng được nhắm
tới: tìm dữ kiện, nối mã vật/người/thời gian, phân biệt phạm vi phát biểu.
Reading chỉ đường trong cảnh và hỗ trợ tái dựng; không có câu hỏi trắc nghiệm.

## Điều khiển

- Chuột: bấm model hoặc nhãn; mở ngăn rồi bấm vật bên trong. Kéo chìa khóa
  từ dụng cụ xuống model tủ kính, hoặc bấm tủ khi đã có chìa.
- Tab/Enter dùng các nút tương đương. Hồ sơ cuộn độc lập, hỗ trợ End/mũi tên.
- R mở/thu hồ sơ; Esc hủy kéo hoặc tạm dừng. Có gợi ý thao tác, không thời hạn.
- Thu bằng chứng xong, bấm “Tái dựng vụ việc” và chọn địa điểm trong cảnh.
- Chơi lại đặt về trạng thái ban đầu; tải lại trang cũng bắt đầu lại, chưa lưu.

## Case truth — dành cho tiếp tục phát triển

Sổ trực: Mira Vale, conservator on duty, vào qua service door18:20. Phiếu
chuyển: Mira chuyển F-17 khỏi trưng bày18:35 do humidity indicator amber.
Nhãn gắn với bản thảo: F-17 đến kho khô18:40. Hồ sơ chính giải thích quy trình,
quyền vào sau giờ đóng cửa và vị trí đồ vật, không đưa sẵn diễn biến vụ việc.

Kết luận: chuyển để bảo quản; tủ trống và đóng cửa với khách chưa đủ để kết
luận có trộm. Sổ trực một mình không chứng minh ai đã di chuyển bản thảo.
Không cáo buộc người khi thiếu chứng cứ, không đánh đồng thiếu thông tin với sai.

## Kiểm tra và tự review

- `node --test output/prototypes/missing-manuscript/engine.test.cjs`:
  **7 pass, 0 fail**; trước triển khai RED0/7. Kiểm tra nội dung bị che khi đóng,
  lấy/dùng chìa, bằng chứng duy nhất, tìm bản thảo trước, tủ sai, thứ tự tái dựng,
  chặn thao tác lúc phát lại, hoàn thành/reset, thời gian khớp nguồn.
- `node --check` game.js, scene.js, serve.mjs: exit0.
- `pnpm browser run-code --filename=output/prototypes/missing-manuscript/qa.txt`:
  **MANUSCRIPT_FULL_PLAY_PASS**,1440x900,0 errors/warnings. Kéo chìa khóa thật
  vào model, đọc ba hồ sơ, mở tủ sai, chọn thứ tự sai, tạm dừng và hoàn thành.
  QA chỉ đọc snapshot/project; không sửa state để vượt gameplay.
- `qa-edge.txt`: **MANUSCRIPT_EDGE_PASS**,1280x800/reduced motion,0 errors/warnings.
  Tìm bản thảo trước, keyboard/scroll, mở/thu hồ sơ, thả chìa ngoài đích,
  pointercancel/blur, HUD không tác động cảnh, hủy/xác nhận reset sau khi phá án,
  WebGL fallback. Blur mô phỏng; chưa kiểm tra đổi cửa sổ thật ở mức hệ điều hành.
- Tự review riêng đối chiếu hồ sơ với vị trí3D, bằng chứng và kết luận; đọc
  luồng pointer capture, busy/pause/reset. Phát hiện nút hồ sơ kế thừa màu mực
  giấy trên nền tối: contrast1.06:1, sửa thành9.38:1 (`qa-contrast.txt` GREEN).
- Ảnh1280 phát hiện objective/banner che ba nhãn đồ vật. Dời nhãn kệ sách và
  thông báo; `qa-layout.txt`: **ROOM_LABEL_LAYOUT_PASS**,0 overlaps. Đã xem ảnh
  sau sửa và chạy lại full play. Đây không phải audit accessibility toàn bộ.
- HTTP smoke: root200, HANDOFF.md404, POST405. Không chạy/tuyên bố bốn gate app.

Ảnh JPEG, script/log QA và source nằm trong ignored
`output/prototypes/missing-manuscript/`. Three.js0.187 và license sao chép từ
mẫu trước, không thêm package/CDN. Không commit/push/deploy.

## Giới hạn để đánh giá đúng bản thử

Đây là vụ việc hướng dẫn ngắn, một lời giải cố định; chưa có hệ thống nhân chứng,
đối chất, nhiều giả thuyết hoặc các vụ án biến đổi. Có thể khám hết tủ và thử
thứ tự, nên hoàn thành chưa chứng minh đã hiểu Reading. Chưa đo độ cuốn hút,
hiệu quả học, band hoặc CEFR; chưa thay một passage IELTS đầy đủ. Chờ phản hồi
chơi thật trước khi tăng độ khó hoặc mở rộng nội dung. Chưa tích hợp game chính.
