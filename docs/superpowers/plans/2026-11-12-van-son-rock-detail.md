# Vân Sơn 04 — hoàn thiện chất đá

> Thực hiện inline bằng executing-plans, một agent theo yêu cầu owner. Không commit/push.

**Goal:** Cải tiến một mẫu núi 03b theo phản hồi đã cho phép thực hiện: màu đá sâu hơn, mặt gãy/khe nứt và khối lớn nhỏ đa dạng, đá vụn trên thềm, rêu/bụi cây thay ngọn cỏ.

**Architecture:** Giữ bố cục chân rộng và đỉnh lệch đã được đánh giá khá ổn. Tạo cấu trúc nứt ngay trên thể tích đá trước voxel union, giữ kiểm chống lật mặt 03b. Bổ sung đá rơi có điểm tựa và mảng khoáng theo vùng. Dùng Blender + Python hiện có, Three.js viewer hiện có; build chỉ vào staging.

**Spec:** `docs/superpowers/specs/2026-11-12-rock-mountains-design.md`, bổ sung bằng phản hồi trực tiếp của owner ở lượt này. Ảnh 1 mới là chuẩn chính cho nhịp khối lớn/nhỏ/cao/thấp; ảnh 2 cho mặt gãy, khe đứng và lớp rêu trên thềm. Không sao kiến trúc hoặc texture game.

## Quyết định thiết kế

- Chỉ làm đậm texture sẽ giữ lỗi khối mềm; thay toàn silhouette sẽ bỏ bố cục đang khá ổn. Chọn sửa hình khối cấp vừa cùng vật liệu: rãnh đứng không đều, nứt ngang lệch, mặt vát, phiến đá gắn vào chân và vai.
- Đá xám khoáng hơi ấm, vùng nâu đất/vệt lạnh có kiểm soát; các khe sâu tối tự nhiên, không viền trắng đều và không phủ noise li ti toàn mặt.
- Thềm rêu xanh loang sát đá, mép đứt đoạn; không tạo một ngọn cỏ nào. Cây chính giữ; thêm vài cụm bụi thấp và đá rơi gồm tảng vừa, nhỏ, mảnh nghiêng.
- Giữ release 03b nguyên vẹn; không đổi app hay nguồn v18. Đây là mẫu mỹ thuật, chưa là LOD runtime.

## Công việc và kiểm chứng

- [x] `natural-rock-shape.py`, `sculpt-rock.py`: mặt nứt có cấu trúc, giảm bo mềm; geometry đóng, thể tích dương, 0 mặt lật sau warp. Không nới gate chống gai.
- [x] `build.py`, module đá vụn: đá khoáng đậm hơn, không grass, rêu và bụi có tiếp xúc, đá rơi đa cỡ bám thềm. Nguồn cây chỉ đọc.
- [x] `verify.py`: kiểm version/hash/material, không grass, số và điểm tựa đá vụn/bụi, các mesh đá đóng. Build exit 0 rồi staging verification PASS.
- [x] Xem trực tiếp toàn cảnh và cận dưới ánh ngày, 8 góc clay, mobile, controls; tự rà soát riêng về gai, khe, màu, silhouette và tiếp xúc.
- [x] Chỉ phát hành `releases/rock-detail-04/` sau kiểm; ảnh JPG tối đa 1000 px; cập nhật QA/CONTEXT và mở preview có version/hash.

## Điểm cần tự rà soát

Khe nứt không biến thành sọc đều; đá vụn không nổi hoặc xuyên qua vách; rêu không thành thảm cỏ hoặc lớp bánh; chi tiết vẫn đọc được ở cỡ xem chính; ảnh đẹp không thay thế kiểm topology và kiểm GLB phục vụ thực tế.

Kết quả và tự rà soát: `output/rock-mountains-v1/QA-04.md`. Bản 04 chờ owner nhận xét; không tự suy ra duyệt mỹ thuật.
