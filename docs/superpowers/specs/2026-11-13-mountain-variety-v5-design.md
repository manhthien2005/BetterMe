# Núi V5 — đa dạng hình thái và hệ cây

Owner đánh giá chất cây V4 tốt hơn và yêu cầu mỗi núi có style cây riêng, thêm biến thiên bụi/rêu/xám đá hoặc công trình đơn giản, đồng thời có đỉnh nhọn phù hợp thay vì mọi đầu núi đều phẳng. Đây là quyền sửa hình núi và thêm điểm nhấn kiến trúc nhỏ cho bộ candidate độc lập; chưa tích hợp app.

**Chỉ đạo hình thái mới nhất:** owner đã bác cả chóp quá nhọn lẫn đầu tròn dạng vòm. Giữ **trụ đá**, mặt đỉnh gồ ghề/cao thấp và mặt gãy; chỉ bo/mòn rất nhẹ ở mép. Không biến toàn bộ đầu trụ thành vòm, viên trứng hoặc chóp. Candidate cuối dùng relief nông trên một mặt đỉnh còn rộng, không bump hướng tâm. Hệ cây/bụi/rêu/công trình riêng từng núi vẫn tiếp tục.

## Cách thực hiện

Chọn sáu bố cục được thiết kế riêng, chi tiết phụ dùng seed cố định để tái dựng. Chỉ xoay/scale cây V4 sẽ vẫn lộ lặp lại; rải ngẫu nhiên hoàn toàn dễ đặt cây sai chỗ và mất khoảng trống. Vì vậy mỗi mẫu có silhouette đá và kiểu tán riêng, rêu/bụi/công trình hỗ trợ bố cục đó. Các lựa chọn cụ thể dưới đây do agent đề xuất trong phạm vi owner giao, không ghi thành phê duyệt hình ảnh của owner.

| Mẫu | Hình núi | Hệ cây và điểm nhấn |
|---|---|---|
| Sơn Trụ | Trụ chính cao, đỉnh gồ lệch nhẹ, vai bên giữ thềm | Sồi già thấp, tán xoè bất đối xứng; cây phụ cong ngược; bụi đậm ở chân vai, rêu dài hẹp |
| Thạch Lĩnh | Sống đá dài có răng đỉnh thấp lệch nhịp | Cây gió tán thấp ngang, cụm phỉ nhiều cỡ; ít dây leo, đá xám lộ theo dải |
| Vân Sơn | Giữ nhận diện bậc tầng, mặt đỉnh phía sau lệch nhẹ | Tán rủ xanh dịu, cây cong nhỏ; cổng đá cũ thấp ở thềm trước, rêu ở chân công trình |
| Thiên Mạch | Hai trụ cao thấp lệch, đỉnh gồ, khe trời còn rõ | Bạch dương uốn mảnh, nhóm cao/thấp trên các thềm thấp; ivy tập trung một khe |
| Thanh Sơn | Dãy thấp lượn thành sống đá tròn–nhọn xen nhau | Cây lùn tán tròn, bụi rộng; mái trú nhỏ trên thềm, không nhồi chi tiết ở lớp xa |
| Viễn Phong | Trụ chính cao, mặt đỉnh bất đều, sống phụ nghiêng | Cây gầy tán hẹp trên vai thấp; đá xám nhiều hơn, rêu ít, không công trình |

## Hợp đồng giữ lại

- Chất lá V4, lá riêng có nếp; không khối đặc, không tán nhìn xuyên mạnh. Ít cây chính, thân cong nhiều đoạn, gốc trên đỉnh/thềm đủ phẳng. Vách đứng chỉ ivy/cây bám.
- Đỉnh mới giữ đầu trụ rộng với relief nông khoảng 0,2–2,6 đơn vị, mặt gãy cao thấp; chỉ mòn ở mép. Không hình nón, vòm, viên trứng, kim/đá quý. Chừa thềm thực cho cây/công trình; đặt bằng raycast trên hình đá đã đổi.
- Rêu vẫn loang trực tiếp lên đá và vừa phải, xám khoáng theo mảng lớn. Không thay thành hạt rêu hoặc phủ toàn bộ xanh.
- Công trình tĩnh, đơn giản, cùng chất liệu lì; tối đa hai núi có công trình. Không đèn, nước, animation, gameplay hoặc dependency mới.
- Giữ sáu ID/thứ tự gần/gần/giữa/giữa/xa/xa. Nguồn V2/V4/kit v18 chỉ đọc; V5 mới tại `output/rock-mountains-v5`, preview loopback 8783.
- Trần 74k/56k/9k tam giác theo lớp, <12 MB sáu GLB. Đổi phân bổ cây để có chỗ cho bụi/công trình; không tăng vô hạn tài nguyên.

## Nghiệm thu

Sáu silhouette đá và hệ cây khác nhau đọc được ở toàn cảnh; đầu trụ không đồng phẳng nhưng vẫn rộng, không thành vòm/chóp; thềm trồng cây hợp lý. Lá/cây/ivy vẫn đạt yêu cầu trước. Công trình và đá vụn có điểm đặt trên nền, không nổi. GLB hữu hạn/kín đá/đúng winding và budget; kiểm biến dạng, tiếp xúc, màu, nguồn bất biến. Xem trước/sau/clay/cận/ngày/đêm/viewport điện thoại; báo số thực và không suy ra FPS. Tự rà riêng một agent, không commit/push/deploy.
