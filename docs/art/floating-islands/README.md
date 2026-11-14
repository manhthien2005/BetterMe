# Chuẩn asset đảo bay — Vườn Gió v18

**Cập nhật sau duyệt V2, 12/11/2026:** Owner đã duyệt bộ sáu V2 và yêu cầu thay toàn bộ đảo cũ trong app. Tích hợp đã thực hiện tại `.worktrees/plaza-landscape-v1`; xem [Plaza mới](http://127.0.0.1:3004/world?plaza=study) và [QA tích hợp](../../../.worktrees/plaza-landscape-v1/output/island-v2-integration/QA.md). Những dòng candidate/chưa tích hợp bên dưới ghi trạng thái lịch sử trước lượt này. Nguồn/snapshot v18 vẫn bất biến.

**Đã được chủ sở hữu duyệt ngày 12/11/2026.** Vườn Gió v18 là mẫu mỹ thuật chính và là bản nâng cấp **thay thế Mạch Nguồn** trong bộ đảo hiện hành. Sau lượt chốt chuẩn, owner đã cho phép sản xuất sáu đảo v2 còn lại. Các bản v2 đã được dựng tại `output/floating-islands-v2/` và đang chờ owner duyệt hình ảnh; chưa thay asset trong app/Plaza.

## Đọc theo công việc

| Tài liệu | Dùng để làm gì |
|---|---|
| [Quy chuẩn mỹ thuật](STYLE-GUIDE.md) | Hình khối, bảng màu, cỏ/cây/hoa, đá/rêu, tàn tích, nước, ánh sáng; điều đã duyệt và hướng đã loại |
| [Hợp đồng kỹ thuật](TECHNICAL-CONTRACT.md) | Nguồn, kit, màu/UV/normal, metadata GLB, shader/runtime, vòng đời và giới hạn tích hợp |
| [Quy trình dựng và nghiệm thu](BUILD-AND-QA.md) | Các bước dựng đảo mới, lệnh kiểm tra, ảnh cần chụp, tiêu chí đạt và bàn giao |
| [Mẫu brief đảo mới](ASSET-BRIEF.md) | Điền đặc trưng từng đảo và phạm vi trước khi sản xuất |
| [Context bàn giao ngắn](HANDOFF-CONTEXT.md) | Khởi động chat/worker bằng đúng thông tin cần thiết, tránh mang cả lịch sử |
| [Dấu vân tay bản chuẩn](reference-v18.json) | Danh sách file snapshot, kích thước và SHA-256; thông số chính thức của bản duyệt |
| [Bộ đảo v2](../../../output/floating-islands-v2/README.md) · [QA](../../../output/floating-islands-v2/QA.md) · [Context v2](../../../output/floating-islands-v2/HANDOFF.md) | Candidate, nguồn/export, cách xem, bằng chứng kiểm tra và việc tiếp theo |

Tài liệu mỹ thuật hiện hành nằm trong thư mục này; lịch sử nghiên cứu ở [spec](../../superpowers/specs/2026-11-12-tiny-glade-island-study-design.md) và [QA v18](../../../output/tiny-glade-island-v1/renders/landscape-v18/QA.md). AGENTS.md vẫn quyết định quy trình làm việc của agent. Không dùng một đề xuất cũ trong lịch sử để ghi đè lựa chọn cuối ở đây.

## Bản mẫu và cách xem

- [GLB đang phục vụ](../../../output/tiny-glade-island-v1/assets/vuon-gio.glb) và [nguồn Blender](../../../output/tiny-glade-island-v1/source/vuon-gio.blend).
- Snapshot đã chốt: [approved/v18](../../../output/tiny-glade-island-v1/approved/v18/). Đây là bản sao cục bộ có kiểm tra hash, không phải bản đã commit hay lưu từ xa.
- Preview: [Vườn Gió v18](http://127.0.0.1:8772/?v=landscape-v18). `?v=` chỉ là nhãn; URL luôn tải file hiện tại. Dùng snapshot để đối chiếu bản đã chốt.
- Chọn **Ban đêm** để xem ánh đèn và đom đóm; bật **Bật gió, nước & đom đóm** để xem chuyển động. Hai góc **Thác nước / Cuối thác** dành cho mặt nước và bụi nước.

![Toàn cảnh ban ngày](../../../output/tiny-glade-island-v1/approved/v18/evidence/front-day-preview.jpg)

![Đèn vàng và lồng kính vàng cam](../../../output/tiny-glade-island-v1/approved/v18/evidence/lantern-night-preview.jpg)

## Mốc đo đã duyệt

| Hạng mục | V18 |
|---|---:|
| Toàn đảo | 2.036.998 tam giác |
| GLB đảo | 40.825.800 byte |
| Đối tượng scene nguồn | 760, có cả anchor không có hình học |
| Bộ kit | 14 mẫu / 15 GLB tính cả đảo |
| Cỏ đảo chính / đảo nhỏ | 28.575 / 3.526 lá |
| Đường đi | 24 phiến đá v16 |
| Đom đóm | 26 quanh đèn + 18 quanh 3 bụi |
| Hiệu ứng cuối thác | 92 dải tia + 300 giọt + 76 hạt sương |

Các số này là mốc so sánh của Vườn Gió, **không phải định mức bắt buộc cho mọi đảo hoặc ngân sách điện thoại**. Đảo khác giữ chất lượng và quan hệ tỉ lệ; thay bố cục, loài cây, dấu tích và địa hình theo brief riêng. Chưa chốt số tam giác, LOD hoặc FPS cho bản game.

Kiểm chứng trước khi chốt: source/preservation PASS; viewer 26, runtime 15, hiệu ứng GPU 16 kiểm tra đạt; waterfall GPU và phản xạ/tiếp giáp nước đạt. Gói tài liệu được kiểm lại bằng [verify-reference.py](verify-reference.py). Nội dung GLB tĩnh và hiệu ứng động là hai phần cần tích hợp cùng nhau.

## Bộ đảo hiện hành và trạng thái v2

Catalogue có **7 đảo: Vườn Gió + sáu candidate v2**. Phạm vi sản xuất được ghi trong [spec v2](../../superpowers/specs/2026-11-12-floating-islands-v2-design.md). Việc cho phép sản xuất asset không đồng nghĩa với duyệt hình ảnh, tích hợp app hoặc triển khai.

| Asset / ID | Vai trò hiện tại | Bước tiếp |
|---|---|---|
| Vườn Gió v18 / `vuon-gio` | Mẫu chính đã duyệt, thay Mạch Nguồn | Giữ snapshot bất biến; catalogue dùng bản sao nguyên hash |
| Thiên Viên / `thien-vien` | Candidate v2 lớn: vườn cổ, đại thụ, hàng vòm, đảo phụ | Owner duyệt hình ảnh |
| Thác Tầng / `thac-tang` | Candidate v2 lớn: ba tầng lệch, hồ nối thác | Owner duyệt hình ảnh |
| Nguyệt Hồ / `nguyet-ho` | Candidate v2 trung: bờ khuyết ôm hồ, cổng đá vỡ | Owner duyệt hình ảnh |
| Song Đỉnh / `song-dinh` | Candidate v2 trung: hai đỉnh rời, cầu cong | Owner duyệt hình ảnh |
| Tán Mây / `tan-may` | Candidate v2 nhỏ: một tán cây, ghế đá, mạch nước | Owner duyệt hình ảnh |
| Phong Đăng / `phong-dang` | Candidate v2 nhỏ: mỏm cao, đình đèn, cây đón gió | Owner duyệt hình ảnh |

Nguồn sáu đảo v1 đã xác minh ở `D:/Dev/Tools/Blender/assets/floating-island-collection-v1/`: generator `build.py` + `reference_details.py`, GLB trong `glb/<id>.glb`, Blender trong `source/<id>.blend`. Candidate mới dùng `output/floating-islands-v2/assets/<id>.glb` và `source/<id>.blend`. Nguồn cũ giữ nguyên để đối chiếu.

Mạch Nguồn là nguồn lịch sử cho relief/vân khoáng và bản v1 để so sánh; không phải đảo thứ tám, không tạo Mạch Nguồn v2 riêng. File gốc vẫn là phụ thuộc chỉ đọc của pipeline v18 theo [hợp đồng kỹ thuật](TECHNICAL-CONTRACT.md).

**Điểm bắt đầu cho lần tới:** đọc [README v2](../../../output/floating-islands-v2/README.md), [QA](../../../output/floating-islands-v2/QA.md) và [context gọn](../../../output/floating-islands-v2/HANDOFF.md), rồi brief của đảo cần chỉnh. Giữ snapshot v18; chỉ sửa candidate theo phản hồi. Chưa tích hợp app, chưa có LOD/benchmark điện thoại thật, chưa commit/push/deploy; phê duyệt hình ảnh và kế hoạch tích hợp là các bước tiếp theo riêng.
