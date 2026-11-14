# Vân Sơn 05 — mép đá, vân nổi nông và nhịp đỉnh

**Phạm vi đã được owner yêu cầu:** sửa nhẹ mẫu 04 đang khá ổn, không dựng cả bộ núi. Một agent, không commit/push/app integration. Giữ release 04.

**Chẩn đoán:** ảnh cận bật/tắt maps lưu ở `renders/edge-04-{material,no-maps}.jpg`. Nét vân đến từ fractured-color/normal và đổi trục UV theo từng face, dễ đứt ở cạnh. Mép thềm/rêu vẫn răng cưa khi tắt maps: voxel ít làm mòn, sharp normals 32°, rêu là grid phủ riêng cắt theo tam giác. Đỉnh hiện đều dùng fan nắp gần phẳng.

**Thiết kế:** giữ bố cục, màu khoáng, đá vụn và cây/bụi. Bỏ ảnh vân vạch; dùng relief hình học liên tục cỡ mảng nhỏ, nông, cùng màu khoáng theo không gian. Mài mép trước gate biến dạng. Rêu trộn trực tiếp trên mặt đá theo độ dốc/vùng thềm để không có lớp phủ lưới bị răng cưa/z-fighting. Đỉnh xen mòn thấp, nghiêng, sống lệch, hai gò và mũi nhô thấp; giữ mặt bằng dưới cây chính.

- [x] `natural-rock-shape.py`, `build.py`: nắp đỉnh nhiều profile, có vòng đỡ bên trong; điểm tựa cây/bụi vẫn đạt.
- [x] `sculpt-rock.py`: voxel mịn hơn, mòn cạnh, gồ nông theo world, màu liên tục; giữ tam giác/closed solid/0 mặt lật, max warp < .25.
- [x] `build.py`, `rock-debris.py`: bỏ texture/UV trên đá, rêu trộn vào vertex color, đá vụn mòn mép hơn; không thêm cỏ.
- [x] `verify.py`: chứng minh bản 05 không còn map nét hoặc UV seam trên rock/debris, không mesh rêu phủ riêng; profile đa dạng, source hash giữ nguyên, count/export/HTTP khớp.
- [x] Browser cận mép/vách, clay 8 góc, mobile/controls/ánh sáng; self-review screenshot với mục tiêu gồ nông và đỉnh khác nhau, không vân cắt.
- [x] Release riêng + ảnh 1000 px + QA/handoff gọn. Chưa tự suy ra owner duyệt mẫu 05.

Kết quả, các thử bị bác và bằng chứng: `output/rock-mountains-v1/QA-05.md`. Chờ owner nhận xét 05.
