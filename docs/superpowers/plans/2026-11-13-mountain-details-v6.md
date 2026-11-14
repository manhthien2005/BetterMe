# Kế hoạch V6

Spec: `../specs/2026-11-13-mountain-details-v6-design.md`. Thực thi inline đã được owner giao; không cần hỏi lại cách trang trí.

1. Tạo `output/rock-mountains-v6/`, giữ input V5/kit bất biến. Viết `verify.py` dựa bộ kiểm GLB V5: 10 ID, band, trần triangles/bytes, chỉ mid được có landmark, near có chi tiết, kiểm solid và nguồn. Chạy RED trước khi có asset.
2. `build.py` tái sử dụng helper V5 qua AST, giữ nguyên sáu mesh đá/cây cũ. `details.py` thêm màu rêu/địa y, cụm dương xỉ/rễ bám đá, thay đá vụn bằng ít hình đá có mặt gãy. Mọi gốc/đá/công trình raycast trên mesh xuất thực; không sửa đỉnh sau khi đặt.
3. `new-mountains.py` tạo bốn cấu hình khối độc lập với sculpt V2, cap worn/slanted; tái sử dụng kit lá V5 và bố trí cây riêng. Thêm cổng hỏng/tường thấp cho hai mẫu trung. Kiểm một mẫu gần ở browser trước khi hoàn tất bộ.
4. Mở rộng viewer/catalog/serve allowlist lên 10 ID, cận cảnh nhắm vị trí chi tiết thực. Không tăng quyền server. Chạy build, GLB verification, browser QA 10 mẫu/2 vòng switch/mobile/error retry, HTTP allowlist, ảnh contact + cận.
5. Self-review riêng: so sánh V5 hình đá, đọc toàn bộ diff V6, xác nhận không công trình gần/xa, đá giảm số lượng, chi tiết không trôi, trần tài nguyên, nguồn hash. Cập nhật CONTEXT/QA/HANDOFF/style guide, mở preview và báo số đo thực.

Review focus: import GLB đổi trục/normals; rễ hoặc đá nổi ở gờ dốc; lá mọc trong đá; chia sẻ mesh gây sửa nguồn; các mẫu mới làm vượt trần, nhất là 3 cây trung. Test input bất biến và geometry fingerprint; contact assertions; exported-solid checker fixture; browser images/counters.

## Hoàn tất 13/11/2026

Các bước 1–5 đã xong trong `output/rock-mountains-v6/`. [QA](../../../output/rock-mountains-v6/QA.md) ghi lệnh và output; [PROGRESS](../../../output/rock-mountains-v6/PROGRESS.md) ghi RED/GREEN và các điều chỉnh. 10 GLB, 10.741.212 bytes, 1.007.898 triangles cho 31 placements. Asset, geometry nguồn, màu, rễ, browser/mobile và HTTP PASS; đã tự rà riêng và mở preview.

Điều chỉnh có căn cứ: load `.blend` V5 để giữ cây/đá chính xác rồi đối chiếu GLB độc lập; đóng gói màu ushort để giữ trần 12 MB; dương xỉ lớp trung giảm tàu lá để giữ trần 56k. Núi gần giữ đầy đủ chi tiết. Chưa tích hợp app hoặc được owner duyệt mỹ thuật V6.
