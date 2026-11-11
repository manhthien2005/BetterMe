# Public Plaza — Mây có chiều sâu và bầu trời đêm

**Trạng thái** — Owner đã duyệt hướng ngày và đêm trong chat ngày 2026-11-09 và giao Sol tạo asset, Argon 4 tích hợp. Sol chọn các thông số khởi đầu dưới đây để Argon có một bản thực thi cụ thể. Owner duyệt chất lượng bằng cảnh thật trong game ở từng mốc.

**Nguồn hành vi** — Bổ sung cho [spec Summit](2026-11-09-public-plaza-summit-design.md) và thay hướng hình ảnh của [Day Sky Lookdev](../plans/2026-11-09-public-plaza-day-sky.md) ở những phần được mô tả bên dưới.

## Trải nghiệm đã chốt

- Ban ngày trong, sáng và có chiều sâu theo hướng fantasy anime. Hình mây đa dạng, viền tan vào trời, sắc độ nhẹ hơn ở xa. Hướng nắng hiện hữu qua khối sáng và bụng mây, có chuyển động trôi chậm.
- Mặt trời hòa ánh sáng vào bầu trời, có lúc bị mây che một phần. Đĩa, quầng và đèn đổ bóng lấy cùng hướng nắng TP.HCM.
- Ban đêm xanh chàm trong. Trăng có chi tiết bề mặt thật. Sao nhỏ, thưa, chỉ một số lấp lánh lệch nhịp nhẹ. Cực quang là vài vệt mỏng thấy được trong hầu hết đêm quang, chuyển chậm về một phía chân trời. Mây dày làm sao, trăng và cực quang dịu xuống.
- Camera, spawn, giới hạn di chuyển và biển sương của bản đã duyệt là ràng buộc cho bố cục, với phần bổ sung ngẩng nhìn trời được owner duyệt bên dưới. Personal World giữ hành vi theo spec trước đó.

## Cách dựng

Dùng ba nhóm texture mây RGBA vẽ mới, ghép trên các mảng trời có độ cong nhẹ và có điều tiết sắc độ, alpha theo lớp. Mặt trời có aureole riêng. Trăng dùng bản đồ bề mặt LROC của NASA. Sao dùng sprite nhỏ có alpha, cực quang dùng một ribbon mỏng trên vòm. Mọi chuyển động lấy thời gian render, dùng snapshot chung để phản ứng theo giờ và thời tiết.

Cách này tiếp nối rig trời hiện có và cho phép so từng lớp trực tiếp trong game. Phương án chỉ thay texture trên các thẻ cũ vẫn để lại vấn đề độ sắc và hình lặp. Một hệ mây thể tích đầy đủ làm tăng phần việc GPU và việc kiểm chứng cho lượt này. Sol chọn các lớp có điều tiết khí quyển, kiểm qua camera đã khóa.

## Bổ sung nghiệm thu — nhân vật mờ khi camera quá gần (09/11)

Owner xác nhận camera hiện tại ổn và yêu cầu nhân vật blur/transparent tương tự cảm giác Genshin khi camera sát người. Giữ cơ chế orbit đã nghiệm thu; bổ sung trong suốt dần cho nhân vật điều khiển, áp dụng cả VRM và model dự phòng. Camera càng gần thân càng mờ, có thể ẩn hẳn khi quá sát; kéo ra xa phục hồi đầy đủ vật liệu gốc. Tâm orbit tiếp tục bám nhân vật kể cả khi hình ảnh nhân vật đang mờ.

Lựa chọn triển khai: đo khoảng cách camera thực tới đoạn thân đứng của nhân vật, bắt đầu mờ ở 2 đơn vị và hết ở 0,6; dùng đường cong mềm theo khoảng cách. Không thêm độ trễ vào fade; chuyển động camera hiện có tạo chuyển tiếp. Chỉ nhân vật mờ, cảnh và HUD giữ nét. Các ngưỡng là giá trị khởi đầu để nghiệm thu bằng hình thật. Kế hoạch: `../plans/2026-11-09-character-camera-fade.md`.

Điều chỉnh kỹ thuật sau QA hình thật: alpha blending làm viền MToon phủ mặt và tóc sau hiện xuyên áo. Dùng một mặt nạ độ phủ pixel chung cho thân/tóc/viền và model dự phòng, giữ nguyên alpha cutout và depth gốc. Mặt nạ tĩnh theo pixel màn hình, không nhấp nháy theo thời gian; có hạt nhỏ ở mức mờ trung gian. Đây là lựa chọn triển khai để owner xem thử, chưa phải owner duyệt hình thức cuối. Không đổi camera, không thêm render pass hoặc dependency.

## Bộ asset Sol bàn giao

Tất cả nằm trong `output/world-plaza-summit-2026-11-09/sky-refinement-v2/assets/`.

| File | Nội dung | Dữ liệu nguồn |
| --- | --- | --- |
| `cloud-cumulus-v2.png` | 4 dáng mây tích khác nhau | RGBA 1254 × 1254, 2 × 2 ô 627 × 627 |
| `cloud-layered-v2.png` | 4 dáng bè, tán, cụm thấu kính và đuôi tan | RGBA 1254 × 1254, cùng lưới |
| `cloud-distant-v2.png` | 4 dạng mây xa, lông chim, vệt chéo và dải thấp | RGBA 1254 × 1254, cùng lưới |
| `sun-aureole-v2.png` | Tán sáng ngà ấm, alpha giảm dần | RGBA 1254 × 1254 |
| `moon-lroc-color-2k.jpg` | Bản đồ màu bề mặt Mặt Trăng | RGB 2048 × 1024, equirectangular |
| `star-point-v1.png` | Chấm sáng bạc nhỏ, quầng và tia rất nhẹ | RGBA 1254 × 1254 |
| `aurora-ribbon-v1.png` | Một vệt xanh ngọc pha tím mỏng | RGBA 1536 × 1024 |

Các ảnh nguồn giữ nguyên trong output. Argon tạo bản runtime đã chuẩn hóa, có ghi kích thước và byte thực. Texture màu dùng sRGB, alpha là dữ liệu tuyến tính. Kiểm blend và mipmap ở kích thước thực trên màn hình.

## Thiết kế ban ngày

### Mây

- Ba lớp nhìn có hình và sắc độ riêng. Lớp nổi bật giữ khối lớn, lớp giữa giảm tương phản, lớp xa hòa nhiều hơn vào màu trời tại vị trí đó. Hình mây được lựa chọn theo tên và vùng trời, xác định ổn định qua render. Trong một hướng nhìn, mỗi silhouette lớn chỉ xuất hiện một lần. Lật hoặc co giãn là biến thể phụ.
- Thông số khởi đầu do Sol chọn cho phần hòa màu trời là 0,10–0,18 ở lớp nổi bật, 0,22–0,32 ở lớp giữa và 0,40–0,55 ở lớp xa. Độ mềm viền tăng dần theo độ xa, alpha từng lớp được hiệu chỉnh để vùng thân vẫn đọc được. Argon so bằng ảnh cùng góc ở 12:15 và 15:30.
- Dùng mipmap trên từng sprite có đệm để lọc chi tiết nhỏ. Các sprite xa có thể dùng mức mip mềm hơn. Nền trời vẫn sắc và sạch khi làm mềm mây. Hạn chế các lớp trong suốt chồng lên nhau.
- Sắc độ nhận nắng phụ thuộc vector nắng chiếu lên hướng mặt mây. Dùng một material dùng lại cho các cụm cùng chế độ, nhận màu trời cục bộ, màu sáng, màu bụng và hướng nắng. Viền nhận sáng nhẹ, tránh viền trắng liên tục quanh toàn bộ mây. Giữ trung tính đủ để buổi trưa và chiều đều đọc ra khối hợp lý.
- Rig trôi ổn định theo hướng map và ở xa vùng chơi. Khi player đi ngang sân, mây cao có thị sai rất nhỏ. Khi camera xoay, bố cục giữ hướng theo map. Giữ depth test để núi và tiền cảnh che đúng mây xa.

### Mặt trời và ánh sáng

- Sửa `computeDomeFramedSolarDirection` đang nén góc cao để đĩa lọt vào khung. Vị trí đĩa/quầng lấy từ vector nắng hiệu lực, có tính đến vị trí camera và transform cha. Góc chiếu của bóng khớp với đĩa theo cùng vector. Lúc trưa, đĩa có thể nằm cao hơn góc camera cho phép.
- Với 2026-11-09, đối chiếu 07:30, 12:15 và 15:30. Source hiện cho góc cao khoảng 23°, 61° và 26,2°. Đây là fixture kiểm dấu và nguồn hướng. Kiểm vị trí cuối cùng trong world space, tránh chỉ test hàm thiên văn.
- Lõi sáng nhỏ, khởi đầu 0,6–0,9° đường kính góc. Aureole là tán sáng rộng hơn lõi với alpha mềm. Tránh một bề mặt tròn phẳng có biên rõ hoặc quầng bị cắt thành vòng. Khi mây lướt qua, quầng và lõi giảm tự nhiên cùng độ che.
- Nắng thấp có sắc ấm tập trung về hướng mặt trời. Ánh sáng trên trời chuyển mượt theo giờ, thời tiết làm dịu nguồn trực tiếp.

## Camera ngẩng trời vẫn focus nhân vật — owner điều chỉnh ngày 2026-11-09

Owner đã xem bản camera ngẩng trời và bác cơ chế nghiêng rời nhân vật: “Vẫn bám sát kiểu cam của lối chơi game genshin impact ấy, vẫn lấy nhân vật làm focus”. Quyết định này thay thiết kế Sol chọn trước đó về tách điểm ngắm lên trời 70°. Bản triển khai tương ứng chưa đạt nghiệm thu trải nghiệm dù làm đúng kế hoạch cũ.

Camera là orbit third-person quanh tâm bám ở thân trên nhân vật. Kéo ngẩng làm camera hạ theo cung quỹ đạo và nhìn ngược về tâm bám đó. Điểm nhìn không chạy riêng lên trời. Khi đạt giới hạn nền/vật cản thì dừng hoặc điều chỉnh vị trí theo cơ chế va chạm, vẫn nhìn nhân vật; không ép zoom sát người hoặc làm nhân vật biến khỏi khung để đạt một góc ngắm trời.

Giữ góc mặc định, FOV 46°, zoom yêu cầu 4,8–20,5, smoothing, hướng di chuyển và va chạm đã duyệt. Sol đề xuất biên pitch cấu hình khởi đầu −20° cho Plaza; góc thực tế phải bị chặn sớm hơn bởi nền sân và khoảng cách camera. Giữ sàn an toàn hiện có Y = 0,6 trên sân phẳng hiện tại. Giới hạn nền phải tác động lên quỹ đạo trước khi đặt camera, tránh chỉ cắt Y làm sai quỹ đạo. Input quá giới hạn không tích lũy thành khoảng kéo chết khi kéo ngược lại. Personal World giữ giới hạn cũ.

Mặt trời vẫn theo vector TP.HCM chung với đèn bóng. Không nén độ cao hoặc gắn mặt trời vào camera. Chọn giờ preview không tự xoay camera về mặt trời. Các preset hiện tại là giờ cố định và tên buổi: “Sáng” = 07:30; “Hoàng hôn” = 17:30. Hoàng hôn bao gồm khoảng trời còn sáng sau khi đĩa đã lặn. Khi nghiệm thu khả năng nhìn đĩa, dùng trời quang ngày 2026-11-09: 06:00 hướng Đông/Đông Nam, 07:30 hướng Đông Nam, 12:15 hướng Nam/Tây Nam và 17:00 hoặc 17:20 hướng Tây/Tây Nam. Lúc 17:30, mô hình hiện tại cho độ cao −1,383°, nên đĩa phải ẩn.

Ưu tiên nghiệm thu là camera gameplay: nhân vật tiếp tục là focus trong khung khi ngẩng, xoay, đi/chạy, zoom và chạm giới hạn. Góc sát nền phải thấy được nhân vật cùng trời phía sau. Cho phép mặt trời gần đỉnh đầu nằm ngoài khung ở một số giờ/góc zoom; bỏ yêu cầu nhìn thiên đỉnh hoặc đưa đĩa 12:15 vào khung bằng mọi giá. Nghiệm thu nắng thấp 06:00 và 17:00/17:20; thử 07:30 và 15:30 ở zoom gần để đánh giá phần trời có thể thấy thực tế cùng HUD. Không đổi vị trí mặt trời để vượt giới hạn camera.

Kiểm đủ vòng ở hai đầu zoom, mép sân, sát tường, đi/chạy và R; không xuyên sân/tường, không giật ở giới hạn nền, không có chế độ quay trời độc lập. Giữ mây và màu trời owner vừa đánh giá đẹp. Phần tinh chỉnh texture đêm vẫn là mốc B riêng. Kế hoạch hiện hành: `../plans/2026-11-09-public-plaza-camera-character-orbit.md`.

### Bổ sung nghiệm thu cuối ngày 09/11 — cho phép tiếp tục ngẩng khi chạm nền

Owner kiểm bản character-orbit và báo vẫn chưa ngẩng nhìn trời đúng cách. Công thức khóa pitch theo bán kính chỉ cho ngước 3,16° ở zoom mặc định; bản trước đúng kế hoạch nhưng chưa đạt trải nghiệm. Bổ sung này thay các ràng buộc phía trên về khóa pitch sớm theo nền và cấm rút khoảng cách do nền.

Sol chọn tiếp tục orbit quanh cùng tâm thân trên, giữ `lookAt` tại nhân vật; cho pitch tới −55°. Nền Y = 0,6 được xử lý như vật cản: rút bán kính hiệu lực trên cùng tia tới tâm nhân vật, kết hợp với giới hạn tường bằng khoảng cách nhỏ nhất. Zoom người chơi chọn vẫn 4,8–20,5, không bị ghi đè, và phục hồi mượt khi hướng nhìn hạ lại. Default, FOV 46°, smoothing, input và Personal World không đổi. Không nghiêng điểm ngắm riêng lên trời.

Ở góc ngẩng cao, đầu/thân trên tiếp tục trong khung; chân có thể ra ngoài khung. Đây là lựa chọn triển khai của Sol để owner nghiệm thu, không phải thông số owner đã duyệt. Kiểm ảnh thật desktop/portrait để tránh camera chui vào model; test project tâm/đầu và hướng trời cao 61° cùng trong FOV. Không đổi vị trí mặt trời, không mở thêm touch controls hoặc mốc B. Kế hoạch bổ sung: `../plans/2026-11-09-public-plaza-camera-ground-compression.md`.

## Thiết kế ban đêm

Các thông số thẩm mỹ bên dưới là điểm khởi đầu do Sol chọn để owner duyệt.

- Trăng ở vị trí nghệ thuật hiện có, hình gần tròn cho góc mẫu, đường kính góc bắt đầu khoảng 1–1,4°. Dùng bản đồ LROC đúng phép quấn cầu và hướng mặt gần về player. Giữ những mảng tối lớn đọc được, quầng bạc rất mỏng và phơi sáng đủ để chi tiết bề mặt hiện ra. Mốc này dùng quỹ đạo nghệ thuật theo giờ của hệ hiện tại.
- Sao bắt đầu với 96 điểm cố định trên bán cầu trên. Cỡ lõi nhìn phần lớn khoảng 1 px ở DPR 1, vài điểm 2 px. Khoảng 15–20% điểm sáng lấp lánh nhẹ với chu kỳ lệch 6–12 giây, mức sáng chỉ dao động nhẹ. Mật độ giảm sát chân trời. Chia sẻ sprite và gộp qua Points hoặc một batch phù hợp.
- Cực quang dùng ribbon ở một cung trời phía Bắc, bắt đầu 315°–45°, cao khoảng 10°–25°, vừa ló trên núi từ một góc hợp lệ. Độ sáng ban đầu thấp như asset preview, chỉ một vệt chính và tối đa một vệt phụ mờ hơn. Độ phủ mây tăng thì giảm sáng và che theo lớp mây ở trước. Đây là yếu tố fantasy của Plaza.
- Reduced motion giữ trăng/sao/cực quang tĩnh về chuyển động trang trí và lấp lánh. Thời gian và thời tiết vẫn cập nhật.
- Kiểm chuyển ngày → hoàng hôn → đêm và thoát preview để màu, tài nguyên và mây chuyển nhất quán.

## Điều kiện duyệt và hiệu suất

Mốc A bàn giao ban ngày để Sol review và owner duyệt trước khi triển khai mốc B ban đêm. Cả hai mốc phải xem từ spawn, một góc nhìn trời hợp lệ, khi đi ngang sân, xoay đủ vòng và thử hai đầu zoom. So cùng góc 1440 × 1000 DPR 1 và kiểm 390 × 844 với HUD thật.

Giữ mục tiêu quanh 60 FPS trên thiết bị owner. Đo cặp trước/sau cùng browser, GPU, DPR, tuyến, warm-up và trạng thái HUD, ba lượt mỗi bản. Đề xuất kỹ thuật của Sol là p95/p99 tăng tối đa 10%, kiểm riêng mọi lần >50 ms xuất hiện lặp lại. Ghi draw calls, triangles, dung lượng tải và bộ nhớ texture ước tính theo kích thước giải mã. Giữ một đèn định hướng đổ bóng cho sân.

Asset tải chậm/lỗi phải có fallback. Chuyển Personal World → Plaza ba vòng để kiểm rò tài nguyên và tải lại texture. Duyệt chất lượng qua ảnh render và clip thật, kèm bằng chứng đúng hướng nắng.

**Tham chiếu dữ liệu trăng** — [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) · [Hướng dẫn dùng media NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/). Credit cụ thể và prompt tạo ảnh nằm trong [ASSETS.md](../../../output/world-plaza-summit-2026-11-09/sky-refinement-v2/ASSETS.md).
