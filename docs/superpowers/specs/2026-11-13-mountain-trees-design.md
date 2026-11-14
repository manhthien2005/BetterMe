# Cây trên núi — yêu cầu hiện hành 13/11/2026

Phạm vi: tinh chỉnh sáu asset núi đá và preview độc lập; chưa tích hợp app/Plaza. Nguồn mỹ thuật là kit cây Vườn Gió v18 đã duyệt. Chỉ đạo mới nhất của owner thay thế các phương án bị loại trong quá trình thử.

## Yêu cầu của owner

- Cây trên núi cần nhẹ vì thường nhìn xa, nhưng vẫn là cây có lá bình thường. Không thay tán bằng khối đặc/đa diện, không làm tán quá thưa nhìn xuyên.
- Ít cây chính hơn, kích thước lớn hơn, có nhiều dáng cong/nghiêng. Thân cần uốn nhiều đoạn, không chỉ nghiêng một trục thẳng.
- Cây thân gỗ chỉ mọc trên đỉnh hoặc thềm đá có chỗ bám rễ. Vách đứng dùng cây bám/dây leo phù hợp; tổ chim là ví dụ, không phải hạng mục bắt buộc.
- Rêu loang nhẹ từ đỉnh xuống thân và xám khoáng tăng nhẹ; vẫn thấy vân đá, không phủ xanh cả núi.
- Phản hồi mới nhất: bố cục V3 tạm được nhưng lá và dây leo còn giả. Sửa cách dựng lá, nhánh, nhịp phân bố và độ cong; không chỉ tăng số lá hoặc đổi màu.

## Hướng dựng V4

Tái dùng hình lá 9 đỉnh/8 mặt, màu và cấu trúc cụm nhánh của oak/birch/hazel v18. Lấy mẫu theo cụm, thu khoảng rải trong từng cụm và tăng số lá vừa phải. Lá nhỏ hơn V3, có vùng chồng lớp và khoảng nghỉ; không phóng to quá mức để lấp phần bị lược bỏ. Normal tán được biến đổi đúng theo phép uốn để ánh sáng đi cùng hình khối.

Ba dáng chính: cây già cong chữ S thấp, sồi nghiêng có khuỷu, bạch dương mảnh đổi hướng. Uốn nguồn thân trước khi giảm mặt để giữ đường cong; tăng lượng mặt ở thân/cành chính, bỏ chi tiết vỏ và cành cực nhỏ. Cả thân, cành và tán dùng cùng phép biến dạng.

Dây leo là mạng nhánh mẹ/con nối thật, đi theo vách. Lá có cuống, nếp gập nhẹ, cỡ/góc và nhịp dày–thưa khác nhau; nhỏ dần ở ngọn. Gốc và thân bám đá, phiến nhô nhẹ có giới hạn; dừng dây ở chỗ mặt đá gián đoạn thay vì bắc cầu qua khoảng trống.

## Bố cục và giới hạn

- Bốn núi gần/giữa: 3 cây chính và 1–2 bụi nhỏ trên thềm; thêm 1–2 mảng dây leo trên vách. Hai núi xa: 2 cây giản lược trên đỉnh/thềm.
- Geometry đá V2 giữ nguyên; rêu và xám loang dùng vertex color như V3. Không thêm texture, thư viện hoặc shader cho app.
- Nguồn v18/v1/V2 chỉ đọc. Giữ V3 tại `output/rock-mountains-v3` (8781) để so; candidate mới tại `output/rock-mountains-v4` (8782).
- Trần rà soát: 74k/56k/9k tam giác gồm đá và cây theo lớp gần/giữa/xa; sáu GLB <12 MB. 31 placements dự tính tối đa 1.027.000 tam giác. Đây là giới hạn kỹ thuật, không chứng minh FPS và không thay quyết định chất lượng hình ảnh.
- Viewer kế thừa giao diện hiện hành; có chọn mẫu, trước/sau/cận/clay, ánh sáng, bàn phím và tải lại khi lỗi.

## Nghiệm thu

Đủ sáu GLB và nguồn Blender; giữ nguyên nguồn đầu vào, đá kín và geometry đá không đổi. Cây gỗ có gốc trên mặt hướng lên; dây leo nối nhánh và bám đá. Kiểm lá sau export vẫn là lá riêng, kiểm normal sau biến dạng và thân đổi hướng. Xem cả sáu trước/sau/cận, ngày/đêm và viewport điện thoại; công bố dung lượng/tam giác thực và giới hạn chưa tích hợp toàn cảnh hoặc benchmark thiết bị thật.

Kết quả kỹ thuật không tự có nghĩa owner đã duyệt mỹ thuật. Xem kế hoạch `2026-11-13-mountain-foliage-v4.md` và QA của candidate hiện hành.
