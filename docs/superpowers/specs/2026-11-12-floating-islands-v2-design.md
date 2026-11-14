# Bộ đảo bay v2 — thiết kế và phạm vi

Ngày 12/11/2026. Owner yêu cầu áp dụng chuẩn Vườn Gió v18 lên các đảo cũ, ưu tiên biến hóa bố cục, cho phép subagent và yêu cầu kiểm duyệt đầy đủ. Đính chính của owner: Vườn Gió là bản nâng cấp Mạch Nguồn; Vườn Gió thay vị trí Mạch Nguồn, không làm thêm Mạch Nguồn v2.

## Phương án thực thi

Dựng lại sáu bố cục cũ bằng cùng bộ botanical kit, vật liệu, hình học cỏ và runtime đã duyệt. Dùng một pipeline chung có mô tả riêng từng đảo. Giữ bản cũ làm đầu vào chỉ đọc. Không dùng cách đổi màu trên mesh cũ hoặc nhân bản bố cục Vườn Gió: hai cách đó không đạt chất lượng/đa dạng owner yêu cầu.

Tất cả đầu ra mới ở `output/floating-islands-v2/`; chuẩn và snapshot v18 chỉ đọc. Không sửa app/Plaza, package hay asset cũ trong lượt sản xuất asset này. Bộ catalogue mới có Vườn Gió + sáu v2; mã `mach-nguon` cũ là alias thay thế bằng Vườn Gió khi tích hợp, không phải một model bổ sung.

## Sáu đặc trưng cần giữ và phát triển

| ID | Đặc trưng v1 | Biến hóa v2 |
|---|---|---|
| thien-vien | Vườn cổ lớn, đại thụ, hàng vòm, hai đảo phụ | Vườn kiến trúc đổ theo nhịp, cây cao thấp, thảm hoa thành mảng, lối đi mở nhìn hồ |
| thac-tang | Ba tầng lệch, hồ nối thác | Dòng nước nối thật từ hồ trên tới hồ dưới, khe ẩm/rêu/dương xỉ, cây chia tầng |
| nguyet-ho | Đảo khuyết ôm hồ, cổng đá vỡ | Hồ rộng dẫn mắt, bờ mềm nhiều cao độ, vòm gãy và mảnh đá, hoa xanh/kem |
| song-dinh | Hai đỉnh rời và cầu cong | Đối trọng cây hai bờ, cầu đá có cấu trúc/mòn, dây leo theo vách khe |
| tan-may | Đảo nhỏ một tán, ghế đá, mạch nước | Tán cây rộng che khoảng nghỉ, bụi quả thấp, hoa nhỏ, chi tiết vừa quy mô |
| phong-dang | Mỏm cao, đình đèn, cây đón gió | Đình fantasy có đế/cột/mái nhiều lớp, kính cam/ánh vàng, cây lệch hướng gió |

Nguồn v1 thật: `D:/Dev/Tools/Blender/assets/floating-island-collection-v1/{build.py,reference_details.py,glb/<id>.glb,source/<id>.blend}`. Giữ hai lớn/hai trung/hai nhỏ và tỉ lệ footprint gốc trong khoảng 15%; kích thước cây/hoa/cỏ theo đơn vị thế giới, không phóng cỏ theo cỡ đảo.

## Chuẩn bắt buộc

Đọc `docs/art/floating-islands/STYLE-GUIDE.md`, `TECHNICAL-CONTRACT.md`, `BUILD-AND-QA.md`. Dùng mẫu ảnh `output/floating-islands-v2/renders/reference-v18.jpg` và `original-six.jpg`.

Mép liền bo mềm, thân khoáng có vân cùng scale; cỏ rõ gốc/ngọn và thấp/cao theo mảng; lá/hoa lì; kit v18 giữ custom normals và UV gió. Rêu loang nhẹ trên vách, dây leo thân lớn/nhỏ dài ngắn, quả trong bụi. Công trình có kiến trúc và hư hỏng có nguyên nhân; đường đá mòn chìm nhẹ, không gạch hình hộp đều. Nước thấy đáy, có phản xạ dịu và flow; thác chuyển tiếp liên tục. Chỉ tạo bọt va chạm nếu có mặt hồ hứng thực. Đèn vàng, kính cam, night effects gắn root, cùng clock/pause/dispose.

## Nghiệm thu

Mỗi đảo có Blend/GLB, metadata, số liệu/hash, ảnh trước/sau, ngày/đêm, mặt sau, cận thác/cỏ/công trình, viewport desktop/390px. Source checks: finite geometry, normals, seams, ground contacts, water continuity, distinct composition. Browser: tải cả bảy mục, đổi mẫu, pause/reduced-motion, root isolation, water motion/reflection, không lỗi console hoặc resource leak rõ ràng. Đánh giá hình ảnh cùng rig; độc lập rà soát bộ đầu ra, sửa lỗi rồi chạy lại checks liên quan.

Các bản v2 là candidate đã kiểm, chờ owner duyệt hình ảnh. Không tự gán approved. Không cam kết FPS điện thoại; giữ ghi chú ngân sách mesh/file và chưa có LOD. Không commit/push/deploy.
