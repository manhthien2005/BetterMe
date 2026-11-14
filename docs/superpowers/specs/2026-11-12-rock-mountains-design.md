# Núi đá bậc tầng — phân tích tham khảo và kế hoạch sản xuất

> **Cập nhật 13/11/2026:** Owner đã duyệt mẫu 05 trong Plaza và cho sản xuất nhiều dáng núi, tối ưu lớp xa. Đã hoàn thành sáu candidate theo [plan V2](../plans/2026-11-13-rock-mountains-v2.md); [QA](../../../output/rock-mountains-v2/QA.md), [preview](http://127.0.0.1:8780/?model=thien-mach). Chờ nhận xét hình ảnh cả bộ; chưa thay app. Các nhãn đề xuất/chưa được phép sản xuất dưới đây mô tả giai đoạn trước.

> **Phản hồi sau 04:** Owner đánh giá khá ổn, chỉ sửa nhẹ mép đá nhọn/pixel/vỡ texture, bỏ vân như nét cắt để thay bằng gồ nông theo mảng nhỏ; đa dạng gồ/nhọn trên các đỉnh. [Plan 05](../plans/2026-11-12-van-son-surface-finish.md), [QA 05](../../../output/rock-mountains-v1/QA-05.md). Đây là tinh chỉnh một mẫu, chưa phải yêu cầu dựng các núi khác hoặc tích hợp.

> **Cập nhật 12/11/2026, sau bản 03b:** Owner đã cho phép dựng một mẫu, đánh giá bố cục 03b khá tốt và yêu cầu cải tiến đá theo hai ảnh mới. Ưu tiên ảnh `refinement-04-primary.png`: nhiều khối lớn/nhỏ/cao/thấp, phiến gãy gồ ghề, màu khoáng đậm và vân rõ. Thêm đá rơi trên thềm; bỏ ngọn cỏ, chỉ rêu/bụi/cây. Yêu cầu mới thay các câu “mép cỏ/ngọn cỏ” trong thiết kế cũ cho mẫu này. [Kế hoạch 04](../plans/2026-11-12-van-son-rock-detail.md), [QA](../../../output/rock-mountains-v1/QA-04.md). Phần đề xuất bên dưới là lịch sử; chưa có phê duyệt đưa mẫu vào app hoặc làm cả bộ.

Ngày: 12/11/2026. **Trạng thái: đề xuất thiết kế, chưa được owner duyệt; chưa dựng hay thay asset.**

Yêu cầu được khôi phục từ chat `01a1cbab-8dc3-70d0-a3c7-784103c027c4`: phân tích sáu ảnh núi đá, lên kế hoạch chi tiết để có bộ núi đẹp và phù hợp. Lượt gửi ảnh bị HTTP 413 trước khi được xử lý. Bộ bảy đảo V2 đã được tích hợp ở lượt trước; lần này chỉ chuẩn bị phần núi đá tiếp theo.

## 1. Điểm xuất phát và phạm vi

- Mỹ thuật đi theo [chuẩn Vườn Gió v18](../../art/floating-islands/STYLE-GUIDE.md): mặt đá có cấu trúc, chất liệu lì, xanh có sức sống, rêu loang theo vùng ẩm, chi tiết có khoảng nghỉ.
- App đang được làm ở `.worktrees/plaza-landscape-v1`. Núi hiện có sáu model và 31 vị trí, chia 5 gần / 9 giữa / 17 xa. Giữ hệ này làm điểm xuất phát; không tự thêm một vòng núi hay tăng số asset.
- [Spec núi hiện tại](../../../.worktrees/plaza-landscape-v1/docs/superpowers/specs/2026-11-11-plaza-snow-mountains-design.md) đã chốt: núi gần xanh/đá, tuyết chọn lọc trên vài đỉnh xa, địa hình opaque, sương thấp và có khoảng trời. Ảnh mới định hướng hình khối, không tự hủy các quyết định này.
- Mục tiêu đề xuất: nâng chất lượng sáu mẫu núi hậu cảnh để đồng bộ với đảo V2. Nếu sau này cần núi leo được, collider, đường đi hoặc khu vực gameplay thì phải có brief riêng.
- Không đưa nhà, đình, cầu, logo hoặc asset trích từ ảnh tham khảo vào bộ núi. Cây màu hồng và thác là khả năng mở rộng sau, không là yêu cầu bắt buộc của lượt này.

## 2. Đọc sáu ảnh

Ảnh được đánh số theo đúng thứ tự gửi. Bản gốc được sao vào [references](../../../output/rock-mountains-v1/references/manifest.json), kèm kích thước và SHA-256; bản ghép nhẹ dùng để trao đổi:

![Sáu ảnh tham khảo](../../../output/rock-mountains-v1/reference-contact-sheet.jpg)

| Ảnh | Điều quan sát được | Áp dụng cho BetterMe |
|---|---|---|
| 1 | Vách đá cao màu ấm; các mỏm lớn lùi sâu; kiến trúc và cây nằm trên những bậc đất khác cao độ. | Học cách chia chân–vai–đỉnh và dùng cây làm thước đo. Không mang mật độ kiến trúc vào hậu cảnh Plaza. |
| 2 | Khối núi chính rộng, vách dài gần đứng; thềm cỏ ngang ngắt nhịp; cây tập trung trên vai và hốc; thác nối các cao độ. | Tham khảo chính cho cấu trúc núi bậc tầng: đường đứng mạnh, đường ngang ít nhưng rõ, có thung lõm giữa khối. Thác được đánh giá riêng sau khi núi tĩnh đạt. |
| 3 | Ánh chiều làm rõ các mặt đá vàng ấm; khe đứng và mặt lùi tạo độ sâu; tán cây thấp nằm trên thềm. | Học mặt lớn bắt sáng và khe tối có kiểm soát. Không lấy màu ánh nắng làm màu đá cố định. |
| 4 | Một cụm núi nhỏ có thân chung, các khối đỉnh lệch cao, vai đá bậc thấp và một cây nổi bật trên cùng. | Mẫu thử tốt để kiểm ngôn ngữ đá ở quy mô nhỏ; phải đẹp bằng khối trước khi thêm texture, rêu hoặc sương. |
| 5 | Nhiều tháp đá cao thấp khác nhau, khoảng hở nhìn xuyên; nền xa nhạt và lạnh hơn; cây trên đỉnh giúp đọc quy mô. | Tham khảo nhịp đỉnh và độ tách giữa các cụm. Không dựng hàng cột đều nhau hoặc phủ trắng chân núi như ảnh. |
| 6 | Một khối đỉnh rộng chiếm ưu thế, tháp nhỏ lệch phía trước/bên cạnh, chân và thềm nối thành quần thể; khe dài, mặt gãy lớn, cây chỉ nhấn ở vài điểm. | Tham khảo chính cho silhouette và bố cục bộ núi: có khối chủ, khối phụ và khe trời; mặt đá đọc được cả khi không có cây. |

Ảnh 3, 4 và 6 có watermark Genshin Impact; các ảnh gợi ngôn ngữ cảnh quan núi đá fantasy. Đây là nhận xét thị giác, không phải xác nhận địa chất hay kỹ thuật dựng của trò chơi đó. Thiết kế mới học nhịp khối và quan hệ cảnh quan, không sao nguyên hình hoặc texture.

## 3. Hướng đề xuất và các lựa chọn

### Làm rõ sau khi xem riêng đủ sáu ảnh

Owner yêu cầu đọc kỹ hình ảnh để xác định hướng. Lượt này đã xem riêng từng ảnh, thay vì chỉ dùng contact sheet cho ảnh 1/3/4/5. Hướng mỹ thuật được làm rõ như sau; vẫn là đề xuất, chưa phải phê duyệt sản xuất:

- **Ảnh 4 là chuẩn cấu tạo khối đá cho toàn bộ núi**, không chỉ là mẫu nghiên cứu nhỏ: trụ/phiến kéo đứng, mặt rộng tương đối yên, đỉnh khá bằng, tiết diện bất quy tắc, cạnh vát/mòn vừa. Khối cao thấp lồng vào một chân chung. Khe ngang ngắt trụ ở vài cao độ, không chia toàn bộ núi thành các tầng gạch đều.
- **Ảnh 2/6 là chuẩn bố cục quần thể:** khối chính rộng và cao, vai thấp lùi ra bên, tháp phụ mảnh hơn, thềm nối từng phần, khoảng hở rõ. Mỗi núi cần một hướng phát triển riêng và trọng lượng thị giác lệch tâm.
- **Ảnh 1/3 là chuẩn đọc mặt và tiếp xúc:** đá sáng ấm ở mặt nhận nắng, khe và mặt khuất mát hơn; cạnh không trắng viền; mặt vách vẫn đọc thành mảng lớn. Phần vàng trong ảnh 3 chịu ánh chiều, không được bake nguyên vào albedo.
- **Ảnh 3 cho cách tổ chức cây:** thân/cành có hướng, tán trải ngang thành khối lệch, mọc từ đất trên thềm. Khi dùng kit v18, chọn góc và tỷ lệ thích hợp, kiểm silhouette; không mặc định mọi kit cây đều cho đúng hình ảnh tham khảo.
- **Ảnh 5 cho độ cao và khoảng cách:** tháp gần xa lệch cao độ, khe sâu nhìn xuyên, màu giảm tương phản theo khoảng cách. Ảnh gốc chỉ 500×500, phù hợp đọc bố cục; không dùng để kết luận vi cấu trúc vật liệu.

Ngôn ngữ đích: **núi đá fantasy Á Đông, các khối trụ lớn phân tầng, vách gần đứng, đỉnh cụt/mẻ và vai xanh; hùng vĩ nhưng dịu nhờ cây, màu và ánh sáng.** Chuyển chất lì, bảng xanh và rêu của Vườn Gió sang cấu trúc núi mới; không lấy hình đáy đảo v18 rồi kéo cao thành núi.

Kiểm tra quyết định ngay từ blockout: tắt cây/texture/sương vẫn thấy núi thuộc họ ảnh 4 và có bố cục ảnh 2/6. Ở góc 3/4, phải đọc được mặt sáng rộng, mặt bên và một khe lùi; không để noise làm mất ba mặt này. Thềm có mép cỏ mỏng, bám đất; bề rộng và cao độ thay đổi, tránh mép cỏ dày như bánh nhiều lớp.

| Hướng | Lợi thế | Đánh đổi |
|---|---|---|
| Tháp đá rất cao, hẹp, nhiều khe trời như ảnh 5 | Mạnh về độ cao và fantasy | Dễ thành hàng cọc; đứng sau đảo bay có thể quá vụn và tranh điểm nhìn. |
| Núi bậc tầng, khối rộng đi cùng tháp phụ như ảnh 2 và 6 | Có khối chủ, thềm trồng cây, dễ biến thể gần/xa; hợp vườn trên đá | Cần dựng cả mặt sau và chân núi tốt; không thể chỉ thêm noise lên khối nón. |
| Khối đá thấp, gọn như ảnh 4 | Dễ làm mẫu chuẩn, ít chi tiết vẫn rõ hình | Một mình hướng này không đủ cảm giác núi lớn quanh Plaza. |

**Đề xuất chọn hướng thứ hai cho cả bộ; dùng một nghiên cứu nhỏ theo ảnh 4 để kiểm chất đá.** Đây là lựa chọn do agent đề xuất, chưa phải owner phê duyệt. Mẫu chính sẽ là `van-son`: núi bậc tầng đủ lớn để kiểm được hình khối, vách, thềm cỏ và cây trong cùng một asset.

## 4. Phân rã thiết kế

### 4.1. Silhouette và nhịp khối

- Bố cục chính gồm một khối cao chiếm ưu thế, một vai thấp rộng và một tháp phụ lệch tâm. Tránh đối xứng, ba đỉnh bằng nhau hoặc hình nón được làm méo nhẹ.
- Phân ba cấp: khối núi đọc từ xa → trụ đá/mặt vách/thềm đọc ở khoảng giữa → khe nhỏ/vân/rêu chỉ hiện gần. Chi tiết cấp sau không được phá cấu trúc cấp trước.
- Với mẫu `van-son`, thử vai ở khoảng 45–60% chiều cao khối chính, tháp phụ 65–80%; dùng 2–4 thềm chủ đạo với khoảng cách không đều. Đây là tỷ lệ blockout đề xuất, không phải số đo từ ảnh.
- Đỉnh có mặt gãy hoặc mặt đất đủ rộng; vài mỏm nhô làm điểm nhấn. Giữ những đoạn vách rộng tương đối yên để mắt nghỉ.
- Nhìn đen trắng ở chiều cao ảnh khoảng 120 px vẫn phân biệt được sáu mẫu. Kiểm ít nhất trước, sau, hai bên và góc 3/4; không thiết kế riêng một mặt đẹp.

### 4.2. Thân đá, khe và chân núi

- Dựng một thân đá có cảm giác liên tục. Các trụ và phiến là cấu trúc của thân, có gốc chung, không là nhiều hộp hoặc viên sỏi dán lên bề mặt.
- Khe lớn hướng đứng, đổi độ sâu, rộng và điểm kết thúc; không xẻ các rãnh đều từ đỉnh xuống chân. Khe ngang ít hơn, liên quan đến thềm hoặc mặt gãy.
- Mặt đá có mặt chính rộng, mặt lùi, góc gãy và cạnh mòn vừa phải. Normal map chỉ bổ sung cảm giác khoáng; khe ảnh hưởng silhouette phải có geometry.
- Chân xòe và nối các khối; chôn xuống vùng địa hình/sương hiện có. Không kết thúc bằng một vòng đáy phẳng lộ rõ, mép đen hoặc gốc lơ lửng.
- Không nhân noise đồng đều lên toàn núi: nó tạo bề mặt vụn, mất quy mô. Cũng tránh làm mọi cạnh tròn như đất sét hoặc mọi mặt nhọn như pha lê.

### 4.3. Thềm đất và mép cỏ

- Thềm là phần hình học đỡ cây: mặt tương đối phẳng nhưng không bằng tuyệt đối, có dốc nhẹ, mép mòn và bậc đá bên dưới.
- Không làm những vòng xanh chạy kín quanh núi. Mỗi thềm có điểm bắt đầu, kết thúc, phần lõm và một đoạn đá trống.
- Chuyển tiếp theo đất/cỏ → mảng rêu/đất mỏng → đá lộ. Ranh giới mềm nhưng không biến vách thành một khối phủ xanh.
- Mật độ cây theo diện tích thềm và camera. Núi xa dùng mảng xanh và khối cây; không nhân số lá/cỏ của Vườn Gió lên 31 vị trí.

### 4.4. Cây, bụi và rêu

- Cây chủ nằm trên một vai hoặc đỉnh, tán lệch và có khe; cây phụ thấp hơn. Không đặt một cây giống nhau giữa đỉnh của mọi mẫu.
- Gốc cây phải bám thềm thật; bụi ở hốc có đất; mặt đá gần đứng chỉ có rêu/cây bám ở nơi hợp lý.
- Giữ họ xanh v18: xanh trầm ở gốc, xanh giữa ở khối, sáng hơn tại phần nhận sáng. Cây vàng hoặc hồng, nếu thử, chỉ dùng làm điểm nhấn ít và được duyệt riêng.
- Rêu là mảng màu loang cho thấy vân đá bên dưới, tập trung theo vùng ẩm và khe. Không dùng hạt xanh nổi hoặc phủ rêu mọi chỗ tối.

### 4.5. Chất liệu và màu

- Một họ đá xám ấm pha nâu nhẹ; các mặt lùi hơi lạnh hơn. Khối xa nhận màu khí quyển ở runtime, không bake sương xanh trắng lên texture nguồn.
- Ưu tiên tương thích màu khoáng Vườn Gió. Thử cạnh đảo dưới cùng ánh sáng trước khi chốt màu; không lấy mã màu screenshot làm albedo.
- Roughness cao, không kim loại, phản xạ nhẹ. Vân khoáng lớn–vừa có hướng, độ tương phản thấp hơn khe hình học; không sần hạt đều toàn mặt.
- UV/texel density giữ tỉ lệ thế giới, không kéo texture thành sọc dài khi đổi chiều cao. Kiểm material với vertex color, normal và color space sau xuất GLB.
- AO chỉ nhấn tiếp xúc và khe; tránh tô đen mọi rãnh, bake bóng nắng cố định hoặc dùng ánh sáng mạnh để che vật liệu quá tối.

### 4.6. Chiều sâu, tuyết và ánh sáng

- Gần: rõ mặt đá, xanh có độ sâu, ít haze. Giữa: còn đọc vách/thềm, giảm chi tiết nhỏ. Xa: silhouette và nhịp khối giữ vai trò chính, tương phản giảm.
- Sương nằm thấp và xuyên khe thung lũng; không dùng màn trắng phủ nửa núi. Giữ khoảng trời để đảo bay đọc rõ phía trước.
- Giữ tuyết chọn lọc ở đỉnh giữa/xa theo hợp đồng hiện tại; không bake tuyết vào tất cả model hoặc làm một sọc trắng ngang. Núi gần tiếp tục xanh/đá.
- Kiểm ngày, chiều, đêm và mưa với cùng rig. Núi không thêm đèn, bóng đổ động hay reflection pass riêng.

## 5. Sáu mẫu đề xuất, giữ ID runtime

| ID / lớp | Vai trò đề xuất | Đặc điểm nhận diện |
|---|---|---|
| `son-tru` / gần | Cụm đá có trụ chính | Khối chủ lệch, vai thấp có cây; học sự gọn của ảnh 4 nhưng vẫn giữ quy mô hậu cảnh. |
| `thach-linh` / gần | Sườn đá dài | Dáng ngang, các bậc lùi chéo; đá và thảm xanh rõ ở phần gần. |
| `van-son` / giữa | Núi bậc tầng — mẫu chuẩn đầu tiên | Khối cao rộng, vai thấp, tháp phụ, 2–4 thềm lệch; học ảnh 2 và 6. |
| `thien-mach` / giữa | Cụm đỉnh có khe mở | Hai khối không cân xứng, khe nhìn xuyên; không giống Song Đỉnh bằng cách thêm cầu. |
| `thanh-son` / xa | Dải núi thấp đứt nhịp | Mảng lớn thưa, vài tháp nhỏ; nhiều khoảng trời, ít chi tiết. |
| `vien-phong` / xa | Dãy đỉnh cao xa | Một đỉnh trội cùng đỉnh phụ, đá và tuyết đọc bằng mảng; tránh răng cưa lặp. |

Giữ đúng thứ tự gần/gần/giữa/giữa/xa/xa trong manifest: loader hiện chọn model bằng `band * 2 + i % 2`. Đây là phụ thuộc thực tế cần kiểm tra khi tích hợp. Giữ ID không đồng nghĩa giữ nguyên bounds hoặc ép mọi mẫu vào cùng tỷ lệ.

## 6. Kế hoạch sản xuất và điểm nghiệm thu

| Bước | Công việc / đầu ra | Điều kiện chuyển bước |
|---|---|---|
| 0 — bàn giao tham khảo | Lưu sáu ảnh, hash, bản ghép, tài liệu này và context gọn. | Đủ 6 ảnh; đọc được; đường dẫn ổn định, không phụ thuộc Temp. Đã thực hiện trong lượt lập kế hoạch. |
| 1 — duyệt hình khối | Sau khi thiết kế được duyệt: dựng ba biến thể blockout `van-son` cùng rig; kèm nghiên cứu đá nhỏ theo ảnh 4. Xuất nền xám và silhouette, chưa dùng sương/cây để trang trí. | Owner chọn được bố cục; rõ khối chủ/phụ, thềm và khe; kiểm đủ mặt sau. |
| 2 — hoàn thiện mẫu chuẩn | Dựng mặt gãy, khe có quy mô, chân liền; thêm vật liệu khoáng, đất, cỏ, cây và rêu. Xuất source/GLB, báo cáo mesh/material/bounds. | Cận cảnh không vụn; xa vẫn đọc hình; cây bám đúng; đồng bộ v18 ngày/chiều/đêm. |
| 3 — kiểm trong bối cảnh | Dùng bản xem candidate đặt cạnh đảo V2 và một góc Plaza tham chiếu, có ảnh cùng camera trước/sau. | Núi tạo nền, không nuốt silhouette đảo; không cần tăng sương để giấu chân; owner duyệt mẫu chuẩn. |
| 4 — phát triển năm mẫu còn lại | Dùng cùng họ đá và quy tắc, dựng silhouette riêng theo bảng §5. Tạo bản runtime theo từng lớp xa gần. | Sáu mẫu phân biệt được trong ảnh đen; không chỉ scale/rotate một mẫu. |
| 5 — kiểm tài nguyên | Đo GLB, texture, material groups, tổng tam giác theo số lần đặt, kiểm normals/UV, metadata/hash và giới hạn camera. | Đạt ngân sách §7; không có NaN, mặt lỗi hoặc material thiếu. |
| 6 — tích hợp khi được yêu cầu | Thay dẫn xuất tại worktree, cập nhật manifest/bounds và kiểm placements; chạy focused tests, browser QA và bốn gate. | Loading một phần/đổi cảnh ổn; ảnh ngày/đêm/mưa đạt; bằng chứng lệnh lưu kèm kết quả. |

Không sản xuất hàng loạt trước khi mẫu chuẩn được duyệt. Việc xin chọn mẫu ở các bước sau gắn với ảnh và file cụ thể, không xin lại các quyết định đã chốt.

## 7. File, phụ thuộc và ngân sách

**Đã tạo cho việc lập kế hoạch:** `output/rock-mountains-v1/references/`, `reference-contact-sheet.jpg`, `CONTEXT.md` và spec này. `v1` là vòng nghiên cứu mới theo sáu ảnh, không ghi đè bộ núi cũ.

**Đề xuất tạo khi bắt đầu sản xuất:**

- `output/rock-mountains-v1/build.py`: nguồn dựng, seed tái lập; module phụ chỉ tách khi cần.
- `source/<id>.blend`, `assets/<id>.glb`, `runtime/<id>.glb`: bản nguồn, bản mỹ thuật và dẫn xuất runtime tách nhau.
- `textures/`, `renders/<version>/`, `reports/<id>.json`, `manifest.json`, `QA.md`: texture, bằng chứng hình ảnh, số đo và trạng thái duyệt.
- Tái dùng viewer/rig và nguồn khoáng hiện có với attribution/phụ thuộc rõ ràng. Không sửa snapshot approved/v18 hoặc source núi cũ ngoài repo.

**Điểm tích hợp hiện hành, chỉ sửa khi bước tích hợp được giao:**

- `.worktrees/plaza-landscape-v1/public/world/mountains/<id>.glb` và `manifest.json`.
- `src/components/world/plaza-mountains.ts`: model mapping, bounds/scale, instancing, tuyết, opaque haze, resource ownership.
- `src/components/world/public-plaza-mountains.tsx`: môi trường ngày/đêm/mưa.
- `plaza-mountains.test.ts`, `plaza-horizon.test.ts`: hợp đồng six-model/31 placements, môi trường và loading/disposal. Không đổi `plaza-horizon.ts` nếu placement hiện tại vẫn phù hợp.

Các đường `src/` phía trên thuộc cùng worktree, không phải root checkout. Chưa có thay đổi code hoặc dependency trong lượt lập kế hoạch.

Theo manifest đọc ngày 12/11, bộ cũ ghi tổng **14.049.944 byte**. Đây là metadata baseline, chưa đo lại GPU hay file ở lượt này. Giữ mục tiêu spec cũ **dưới 20 MB tải về và dưới 500.000 tam giác được đặt trong cảnh**; không coi số tam giác một model hay tổng sáu model là tổng cảnh.

Mức khởi đầu đề xuất: gần ≤35k tam giác/mẫu, giữa ≤20k, xa ≤7k. Với 5/9/17 lần đặt, trần dự kiến là `5×35k + 9×20k + 17×7k = 474k`. Mức này bao gồm cây/cỏ/đá của model; là ngân sách sản xuất, chưa phải kết quả đo. Nguồn mỹ thuật có thể cao hơn, dẫn xuất runtime phải giữ silhouette khi giảm.

Loader hiện gộp/instance theo material và attributes; số object Blender không phải draw calls. Núi tĩnh không cần gió, nước hoặc particle mới trong lượt đầu. Nếu chọn thác sau này, phải có scope riêng cho runtime, ngân sách và nguồn nước; không xuất GLB rồi mặc định có chuyển động.

Đối với scale không đồng đều của placements hiện tại: kiểm vân đá và tỷ lệ trụ trong cảnh thực; không khẳng định đẹp chỉ từ viewer tỷ lệ 1:1. Nếu cần điều chỉnh scale, đó là thay đổi placement có kiểm chứng, không là lý do thay toàn bộ loader.

## 8. Checklist nghiệm thu

- Hình khối: sáu silhouette khác nhau; khối chủ, vai, thềm và chân đọc rõ; không nón, đá quý, cọc đều hoặc nền phẳng lộ.
- Chất liệu: vân đúng quy mô, mặt đá không bóng nhựa, khe không đen đặc, không seam/hở mặt hoặc texture kéo giãn.
- Sinh thái: gốc chạm đất, cây/rêu mọc có vị trí; không cỏ đều khắp vách hoặc sao chép mật độ v18 lên hậu cảnh.
- Bối cảnh: góc spawn, ngang mắt, mép Plaza và phía sau; desktop và 390×844; ngày/chiều/đêm/mưa; đảo vẫn là trọng tâm. Viewport hẹp trên desktop không chứng minh FPS điện thoại.
- Runtime: terrain opaque/depthWrite; không tái xuất hiện các ô chữ nhật hoặc tự che lỗi; tuyết chọn lọc; không fail cả cảnh khi một GLB lỗi.
- Vòng đời: rời/vào Plaza ít nhất ba chu kỳ, theo dõi geometry/texture và tham chiếu tài nguyên; kiểm late-load disposal. Số GPU ổn không tự chứng minh RAM được thu hồi.
- Gate khi thay app: focused mountain tests trước; sau đó `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`. Dừng đúng dev process của worktree trước build. Không dùng kết quả 818 test của chat cũ như chứng cứ cho bản mới.

## 9. Tự rà soát riêng và trạng thái bàn giao

Tự rà soát thiết kế theo vai người thực hiện: đã phân biệt quan sát từ ảnh với đề xuất; giữ luật tuyết/sương cũ; nêu giới hạn source/runtime; giữ thứ tự manifest; tính ngân sách theo 31 lần đặt; tách việc lập kế hoạch khỏi dựng và tích hợp. Không dùng subagent theo AGENTS.md của task này.

Điểm cần owner quyết định sau khi đọc: hướng núi bậc tầng và `van-son` có phù hợp làm mẫu đầu tiên hay không. Các tỷ lệ, biến thể và ngân sách ở đây là điểm bắt đầu kiểm chứng, chưa phải kết quả mỹ thuật được duyệt.

Lượt này chưa chạy Blender, chưa tạo asset 3D, chưa đổi app, chưa chạy lại gate code, chưa commit/push/deploy. Bước kế tiếp được đề xuất là dựng **mẫu blockout cụ thể** sau khi hướng thiết kế được chọn.
