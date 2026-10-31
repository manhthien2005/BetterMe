# BetterMe — điểm bắt đầu cho tài liệu

## Trạng thái hiện tại

- `AGENTS.md` ở thư mục gốc: quy tắc làm việc và các bất biến đang áp dụng.
- `HANDOFF.md` ở thư mục gốc: bàn giao ngày 2026-07-27; đọc ghi chú cập nhật đầu file
  trước khi dùng thông tin về nhánh hoặc kết quả kiểm thử.
- Code và test là bằng chứng cho hành vi đang thực thi. Đặc tả liên quan trong
  `superpowers/specs/` ghi lại các quyết định thiết kế và quy tắc cần đối chiếu.
- `auth-email-config.md`: hướng dẫn cấu hình đăng nhập bằng email.

## Tài liệu kế hoạch cũ

`architecture.md`, `implementation-plan.md`, `task-breakdown.md`, `data-model.md`,
`product-spec.md` và `repo-audit.md` ghi nhận các giai đoạn trước. Chúng có thể hữu ích để
tra cứu lịch sử, nhưng không đại diện cho kiến trúc, backlog hay định hướng hiện tại.
Các kế hoạch trong `superpowers/plans/` cũng cần đối chiếu ngày và code trước khi sử dụng.

## Chuẩn bị giai đoạn tiếp theo

Ưu tiên hiện tại là chuẩn bị dự án để chủ sở hữu sử dụng cá nhân trước; khả năng mở rộng
cho cộng đồng sẽ được xem xét sau. Chưa có lộ trình sản phẩm mới được phê duyệt.

- Xác minh việc áp dụng schema U1c lên Supabase trước khi dựa vào đồng bộ trên môi trường triển khai.
- Các thư mục skill dự án đã được chủ sở hữu xóa để cài lại bộ mới.
- Git đã được khởi tạo lại và kết nối với `main` trên GitHub; các worktree cũ chưa được kết nối lại.
- Rà soát code, phụ thuộc và tài nguyên trước khi kết luận chúng không còn dùng.
- Chạy lại các kiểm tra dự án để có kết quả hiện tại; không dùng số liệu kiểm thử lịch sử
  làm bằng chứng cho phiên làm việc mới.
