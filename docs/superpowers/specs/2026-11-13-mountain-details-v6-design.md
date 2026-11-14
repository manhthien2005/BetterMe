# Núi V6 — chi tiết gần và thêm bốn hình thái

Owner đã duyệt hình khối V5 columns-02. Lượt này tăng nhẹ độ rõ rêu, thêm chi tiết tự nhiên nhìn được khi zoom núi gần, thay đá vụn lặp bằng ít cụm đá đa dạng hơn, thêm mẫu gần/trung. Owner giao agent chọn trang trí phù hợp; núi gần không có công trình, công trình dành cho núi trung.

## Hướng thực hiện

Giữ nguyên mesh núi/cây của sáu V5, chỉ sửa màu và đồ trang trí. Tạo V6 riêng, nguồn V5 và kit v18 chỉ đọc. Cách dựng lại tất cả từ V2 có nguy cơ làm lệch dáng đã duyệt; chỉ scale/copy sáu mẫu không đáp ứng đa dạng hình thái. Vì vậy bốn mẫu mới được ghép khối độc lập theo cùng ngôn ngữ trụ đá mặt gãy và mép mòn nhẹ.

- Gần: **Khe Rêu**, hai vai ôm khe thấp, dương xỉ trong khe, cây thấp tán lệch; **Bàn Thạch**, khối bàn rộng lệch tầng, cây rủ và rễ ôm một mép.
- Trung: **Cổng Mây**, hai trụ lệch cùng thềm trước mang cổng đá hỏng; **Dốc Vân**, dải trụ tăng cao về một phía, nền tường đá cũ ở thềm thấp.
- Hai núi gần cũ thêm dương xỉ, rễ ngắn sát đá, địa y xám xanh nhạt ở vài vị trí, mỗi mặt có khoảng nghỉ. Không phủ đều, không hoa màu rực, không công trình.
- Rêu bám mặt đá bằng vertex color, tăng tương phản vừa phải theo vệt ẩm; giữ phần lớn vách màu khoáng. Địa y cũng là màu trên đá, không lớp chồng gây z-fighting.
- Thay toàn bộ đá vụn gần/trung bằng 3 họ hình: phiến nghiêng, tảng bè, mảnh gãy có mặt rộng. Khoảng 6–10 viên gần và 4–6 viên trung, phân thành 2–3 cụm; đỡ trên mặt thật.
- Chuyển mái trú Thanh Sơn ra khỏi lớp xa: V6 lớp xa chỉ cảnh quan. Vân Sơn giữ cổng đã có, hai mẫu trung mới có tàn tích nhỏ. Thiên Mạch giữ khe thoáng.

## Căn cứ trang trí

Đọc ngày 13/11/2026: [Michigan Natural Features Inventory — Granite Cliff](https://mnfi.anr.msu.edu/communities/description/10706) mô tả thực vật tập trung trong khe/gờ, dương xỉ ở gờ ẩm và khe được che; [Missouri Department of Conservation — Cliffs](https://mdc.mo.gov/discover-nature/habitats/cliffs-and-talus/cliffs) mô tả đất tích ở gờ, thảm thực vật vách thường thưa. Áp dụng làm quy tắc bố trí mỹ thuật, không tuyên bố mô phỏng một quần xã cụ thể. Không tải/copy asset bên thứ ba.

## Giới hạn và nghiệm thu

10 mẫu: 4 gần / 4 trung / 2 xa. Giữ trần 74k/56k/9k triangles; tổng GLB <12MB; 31 placements 5 gần+9 trung+17 xa <=1.027M triangles. Lá riêng của kit v18, tán đầy và thân cong; gỗ chỉ trên thềm. Chi tiết mới gọn, static, không texture/animation/dependency mới.

Kiểm nguyên hình đá sáu mẫu cũ trước/sau; input hash; solid exported geometry; contact dương xỉ/rễ/đá/công trình; ngân sách; tất cả 10 mẫu trước/sau/clay, cận núi gần, ngày/chiều/đêm, mobile và resource cleanup. Preview loopback 8784. Không tích hợp app, commit, push hoặc deploy. Tự rà riêng, single agent theo AGENTS.
