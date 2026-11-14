# Chốt chuẩn asset đảo bay — Vườn Gió v18

Owner duyệt v18 và yêu cầu hoàn thiện tài liệu/quy tắc để chuẩn bị xây các asset khác. Đây là lượt chốt tài liệu và bản tham chiếu, chưa triển khai đảo mới hoặc tích hợp vào app.

- Rà nguồn hiện tại, các quyết định cuối và QA; bỏ sự nhập nhằng giữa thông số lịch sử với chuẩn đã duyệt.
- Tạo bộ chuẩn trong `docs/art/floating-islands/`: điểm vào, mỹ thuật, hợp đồng dữ liệu/runtime, quy trình dựng/QA, brief đảo mới và context bàn giao gọn.
- Lưu snapshot v18 có SHA-256 cho source, GLB/kit, texture, runtime và bằng chứng hình ảnh. Giữ nguyên nội dung asset đang phục vụ; snapshot là bản sao cục bộ, không phải deploy hoặc commit.
- Cập nhật liên kết ở README/STYLE-RULES/RESUME cũ, HANDOFF và spec; các tài liệu cũ được lưu lịch sử. AGENTS.md vẫn là nguồn hướng dẫn agent duy nhất, không thay đổi quy tắc tác nghiệp.
- Kiểm tra hash gói, liên kết và số liệu tài liệu; rà soát riêng các ràng buộc export, gió, nước, đèn, ngày/đêm và giới hạn hiệu năng. Không chạy lại toàn bộ app hay chỉnh asset ngoài phạm vi.

Hoàn tất khi người tiếp theo tìm được bản mẫu duyệt, biết được phần nào cố định/phần nào được biến thể, có brief và checklist áp dụng cụ thể, cùng đường dẫn kiểm tra tái lập. Không gán tên/chủ đề cho các đảo chưa có brief.

## Kết quả — 12/11/2026

Đã hoàn tất bộ tài liệu trong `docs/art/floating-islands/`, liên kết từ HANDOFF/spec và các điểm vào cũ. Snapshot `output/tiny-glade-island-v1/approved/v18/` lưu 97 file nguồn/art/runtime và bằng chứng; README/rules/resume trước khi chốt nằm ở `history/pre-finalization/`. Snapshot là bản sao cục bộ, chưa commit hoặc xác nhận backup từ xa.

**Tự rà soát riêng:** đã phân biệt bất biến riêng Vườn Gió với quyền biến thể của đảo mới; giữ các hướng owner đã duyệt/loại; ghi rõ GLB tĩnh cần runtime, phụ thuộc Mạch Nguồn và độ sâu thư mục khi chạy preview. Các lệnh QA dùng `pnpm browser` theo repo. Context bàn giao chỉ cần brief và phần tài liệu liên quan. AGENTS.md không thay đổi; không dựng lại asset hoặc triển khai đảo khác trong lượt này.

Kiểm chứng cuối:

```text
Command: & 'C:/Users/MrThien/AppData/Local/Programs/Python/Python312/python.exe' -X utf8 docs/art/floating-islands/verify-reference.py --working
APPROVED_V18_INTEGRITY_PASS: 97 snapshot files, 58 working files, 32 local documentation links
GLB_SHA256 dd9f43ba6dc4dc19220d6f77b4b14e1dabdf420638a05984c17a9dec3b44f779

Entry-point link check (HANDOFF/spec notices and three compact art documents):
ENTRY_POINT_LINKS_PASS: 12 local links across 5 entry points

git diff --check: exit 0 (only a line-ending normalization warning)
GET http://127.0.0.1:8772/?v=landscape-v18: HTTP 200
```

Các kết quả Blender/browser/GPU ở QA v18 là bằng chứng từ lượt dựng v18 trước đó, không phải kiểm tra chạy mới trong lượt tài liệu. Không chạy lại bốn gate app vì không sửa app hay commit; các thay đổi app/package có sẵn không thuộc phạm vi lượt này. HTTP 200 chỉ xác nhận preview còn phục vụ, không thay kiểm tra hình ảnh.
