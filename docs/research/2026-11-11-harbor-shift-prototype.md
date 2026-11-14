# Harbor Shift — một bài Listening nhỏ

Owner yêu cầu tập trung một bài/kỹ năng và xây gameplay để chơi thử, sau khi
chấp nhận hướng tương tác 3D của Lost Signal. Chọn **nhận ra lời đính chính
trong một lượt nói**. Không mở rộng cả bốn kỹ năng hoặc chương trình học.

## Bản chơi

**http://127.0.0.1:3026** — mở trên máy tính, bật âm thanh. Server session 8936
tại thời điểm tạo. Khởi chạy lại từ worktree reading-quest-environment-v1:

```powershell
node output/prototypes/harbor-correction/serve.mjs
```

Server chỉ bind 127.0.0.1 và phục vụ danh sách file cố định, không có xác thực
hoặc dữ liệu riêng tư. Cần server chạy; ES modules không hỗ trợ mở HTML bằng
file://. Bản Lost Signal tại 3025 được giữ nguyên.

## Một vòng chơi

Anh vận hành cần cẩu trên một bến cảng 3D. Nghe Maya gọi bến, sau đó tự sửa
lời vừa nói; gắp kiện hàng ở LOADING rồi thả vào bến ứng với thông tin cuối.
Ba kiện hàng lặp cùng một kỹ năng, với ba cụm đính chính khác nhau.

- WASD / mũi tên: di chuyển cầu trục và nam châm.
- Bấm mặt sàn hoặc nhãn địa điểm: tự đưa cần cẩu tới điểm đã chọn.
- Space / E: hạ nam châm để gắp hoặc thả; cần cẩu đứng yên trong lúc hạ/nâng.
- R: nghe lại; C: phụ đề; 0.8×: nghe chậm; Escape: tạm dừng.

Lời nhắn phải phát hết trước khi gắp/thả; người chơi vẫn di chuyển được khi
nghe. Chủ động bật phụ đề cũng mở thao tác để dùng hỗ trợ. Không tự dịch hoặc
đánh dấu đúng bến. Cả bốn bến đều tương tác như nhau. Đặt sai giữ kiện trên
nam châm, phát lại lời nhắn, không xóa tiến trình. Giao đúng thì thuyền nhận
hàng và rời cảng. Hoàn thành ba kiện mới hiển thị cặp thông tin trước/sau.

Đích thay đổi trong lời nói; kiện hàng không đổi:

| Kiện | Lời đính chính | Đổi bến |
|---|---|---|
| BLUE | Sorry, I mean… | 2 → 4 |
| AMBER | Actually, make that… | 3 → 1 |
| MINT | No, that has changed… | 1 → 3 |

Ba đích cố định, không chấm band, không tính tốc độ hoặc trừ điểm. Bài thử
ngắn không lưu phiên: tải lại bắt đầu lại. Nút chơi lại giữa màn có xác nhận.
Giọng Zira tổng hợp từ lời thoại tự soạn; chưa đánh giá mức chuyển giao sang
bài thi IELTS thật. Các yếu tố học và hỗ trợ cần thử với người dùng tiếp.

## Phạm vi kỹ thuật / hình ảnh

Thư viện Three.js 0.187 đã có, copy local build và license; không thêm package
hoặc gọi API. Cảnh hình học 3D: cần cẩu, ray, dây cáp thay chiều dài, nam châm,
kiện hàng treo, thuyền di chuyển, nước shader và hạt sáng. Tiếp tục bảng màu
và chất liệu của mẫu đã được duyệt. Điều khiển overlay không phát lệnh xuống
mặt sàn. Không sửa app Next.js, nhân vật, dữ liệu BetterMe hoặc mẫu 3025.

## Evidence và tự review

- `node --test output/prototypes/harbor-correction/engine.test.cjs`: RED 0/6,
  sau triển khai **6 pass, 0 fail**. Giới hạn di chuyển, dt/đường chéo, chờ nghe,
  khóa cần khi hạ, đích cũ giữ hàng, đích mới tăng một lần, đủ ba kiện, reset.
- `node --check` trên game.js, scene.js, serve.mjs: exit 0.
- `pnpm browser run-code --filename=output/prototypes/harbor-correction/qa.txt`:
  `HARBOR_FULL_PLAY_PASS`, đủ ba chuyến bằng điều khiển thật, audio thực sự phát,
  thử bến cũ rồi bến mới, gắp bằng phím, raycast mặt sàn, tạm dừng, phụ đề/chậm,
  màn tổng kết. Không sửa state bằng QA hook. 0 page/console errors, 0 warnings.
- `qa-edges.txt`: `HARBOR_EDGE_PASS`, 1280×800, giảm chuyển động, reset/hủy,
  focus bàn phím, HUD không click-through, nhấn nghe lại liên tiếp, audio bị
  chặn dùng phụ đề, WebGL lỗi có thông báo. Blur kiểm tra bằng sự kiện mô phỏng;
  chưa xác minh chuyển cửa sổ thật ở mức hệ điều hành.
- Đã xem ảnh thực ở 1440×900 và 1280×800; functional text ≥12px (kbd ngắn 11px).
  Impeccable detector báo màu bóng đổ; đổi sang bóng trung tính rồi kiểm tra
  lại exit 0. Không tuyên bố detector kiểm tra được toàn bộ cảnh WebGL.
- Tự review riêng, không dùng subagent: sửa hướng dẫn gắp vẫn xuất hiện khi
  đang giữ hàng ở LOADING; kiểm tra ended trước khi mở quyền thao tác sau audio;
  kiểm tra giữ phím, reset giữa lúc chơi, repeated action và readiness.

Ảnh JPEG/script/log chỉ nằm trong ignored `output/prototypes/harbor-correction/`.
Không chạy bốn gate app chính vì không sửa app; không commit/push/deploy.
Không làm mobile hoặc đánh giá khả năng sử dụng toàn cảnh bằng screen reader.
