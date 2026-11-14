# Núi V4 — lá, dây leo và thân cây tự nhiên hơn

Owner yêu cầu tiếp tục sửa V3: lá và dây leo còn giả, thân còn thẳng. Thực hiện inline, một agent; không tích hợp app hoặc commit.

## Chẩn đoán và hướng sửa

Ảnh `output/rock-mountains-v3/renders/thien-mach-detail.jpg` cho thấy lá phóng lớn thành các phiến thưa, tán bị kéo ngang và dây leo thành hàng răng cưa. Code V3 nhân lá 1,9–2,65 lần, giữ khoảng tán gốc sau khi bỏ gần 90% lá; giảm thân trước khi uốn, giữ nguyên normal sau biến dạng; dây leo có bước lá cố định, các dây gần song song, thiếu cuống/nhánh con.

V4 giữ lá gốc của kit v18 nhưng nhỏ hơn, tăng lá vừa phải và gom theo cụm nhánh để tán đầy có chiều sâu. Bảo toàn normal theo phép uốn, giữ thêm topology cho thân cong chữ S và khuỷu lệch nhiều hướng. Dây leo có nhánh mẹ/con, cuống, lá gập nhẹ xoay khác nhau, vùng dày/thưa và ngọn nhỏ. Chỉ gốc/cuống bám đá, phiến lá có thể nhô nhẹ khỏi vách; cắt dây khi gặp khoảng hở lớn.

## Phạm vi, phụ thuộc và nghiệm thu

- `output/rock-mountains-v4/`: dẫn xuất builder/verifier/viewer V3; nguồn đá V2, kit v18 chỉ đọc; V3 giữ để so.
- Đỉnh/thềm: 3 cây chính ở gần/giữa, 2 ở xa; không cây thân gỗ trên vách đứng.
- Giữ geometry đá, rêu và xám nhẹ của V3; không thêm texture hoặc dependency.
- Giữ trần 74k/56k/9k tam giác theo lớp và <12 MB cho sáu GLB; công bố số đo thực.
- Lá vẫn là mesh riêng có nếp, không khối đa diện; ảnh cận và toàn cảnh cần đọc thành tán lá mềm, có cụm dày và khoảng nghỉ.
- Thân có ít nhất hai lần đổi hướng rõ ở cây già; nhánh đi cùng tán. Dây leo không có hàng lá đều hoặc cầu bắc qua khoảng trống.
- Chạy kiểm GLB, nguồn bất biến, tiếp xúc, ngân sách; xem sáu mẫu trước/sau/cận, ngày/đêm, mobile và lỗi/tải lại. Tự rà riêng. Không suy ra FPS điện thoại từ viewport giả lập.

## Thực thi

- [x] Lưu baseline V3; chỉnh một mẫu Thiên Mạch rồi xem cận/toàn cảnh.
- [x] Xuất đủ sáu mẫu; kiểm asset GREEN: 9.694.468 bytes, 177 solids, 10 nguồn bất biến. Kiểm 90 normal và thân S PASS.
- [x] QA browser và hình ảnh: passed=true/errors=[], HTTP SERVER_PASS 8; hoàn tất spec/style-guide/QA/CONTEXT/HANDOFF.

Bằng chứng và giới hạn: `output/rock-mountains-v4/QA.md`. Candidate chưa được owner duyệt chất cây; chưa tích hợp app hoặc đo điện thoại thật.
