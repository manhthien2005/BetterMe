# Public Plaza trên đỉnh núi

**Trạng thái** — Owner duyệt phong cách qua ảnh concept bình minh ngày 2026-11-09 và đồng ý chuyển sang lập kế hoạch. Camera và cảm giác di chuyển dùng bản Environment V1 đã nghiệm thu.

**Tham chiếu** — [Ảnh concept được duyệt](../../../output/world-plaza-summit-2026-11-09/reference/plaza-dawn-approved.png) và [Inazuma trên bản đồ chính thức của HoYoverse](https://genshin.hoyoverse.com/ja/map?region=3). Ảnh định hướng khoảng cách, bố cục và ánh sáng. Khi đánh giá trong game, dùng camera và tỷ lệ nhân vật hiện tại. Kiến trúc và phong cảnh sử dụng thiết kế riêng cho Reading Quest.

## Trải nghiệm cần đạt

Public Plaza là điểm vào mặc định chung của `/world`. Người chơi xuất hiện trên sân học viện lát đá ở đỉnh núi. Ngay từ góc spawn, có thể nhận ra sân nằm cao hơn lớp sương bên dưới và thấy đường nhìn kéo dài đến các dãy núi xa. Khi xoay camera qua cổng hoặc ra hai bên, vách núi và chân trời tiếp nối quanh sân. Cảm giác cần giữ là **hùng vĩ, thơ mộng và dễ định hướng**.

1. **Sân và điểm đến.** Giữ mặt sân chơi được, đài phun nước, cổng và NPC ở vị trí hiện tại. Dùng khoảng mở bên cạnh cổng để mắt đi ra xa. Chất Inazuma thể hiện qua đá, cây dáng thanh và silhouette mái học viện, với trọng tâm ở phong cảnh. Một mái tháp nhỏ trên sống núi xa là điểm nhớ của vista.
2. **Độ cao.** Vách đá nối trực tiếp từ rìa sân xuống dưới, phần chân chìm trong sương. Tầng sương nằm thấp hơn mặt sân, đọc được như một thung lũng giữa các đỉnh. Mép sân có ranh giới tự nhiên và ít chi tiết vừa đủ để người chơi hiểu vùng đi lại.
3. **Khoảng cách.** Núi gần giữ đường nét đá, lớp giữa lộ từng đỉnh trên biển sương, dãy xa nhạt dần về xanh tím. Tách mây cao khỏi biển sương. Khi đi qua sân, các lớp xa có thị sai nhỏ, tương xứng với khoảng cách.
4. **Ngày và đêm.** Bầu trời có sắc riêng theo hướng nhìn. Mặt trời đi liên tục theo hướng và độ cao xấp xỉ thực tế tại TP.HCM, sáng phía Đông và chiều phía Tây, với hướng mọc/lặn thay đổi theo ngày. Mặt trời, quầng sáng và nguồn đổ bóng dùng cùng hướng. Trời âm u làm yếu nguồn sáng trực tiếp và giảm độ tương phản của bóng. Lối đi, nhân vật và cổng vẫn dễ đọc ban đêm.

## Cách dựng đã chọn

- **Vách đá và núi dùng geometry tĩnh, biển sương và mây dùng ít lớp.** Dùng vách nối sát sân, nhóm núi xa có đường nét rõ và dải sương ở dưới mặt chơi. Dùng nền trời theo hướng nhìn và mây mềm có kiểm soát độ phủ. Cảnh xa và mây dùng ít vật liệu, có thể gộp các mesh tĩnh cùng loại. Giữ một nguồn sáng định hướng đổ bóng cho vùng chơi.
- **Skybox ảnh cố định** cho hình ảnh ban đầu nhanh, nhưng khó đổi ánh sáng và hướng nắng nhất quán theo giờ. **Mây và sương thể tích** có thể tăng chiều sâu, nhưng đắt hơn để kiểm chứng trên trình duyệt. Hướng geometry tĩnh kết hợp lớp nền vẽ cho phép kiểm tra chiều sâu sớm với camera đã duyệt và giữ mặt trời độc lập với ảnh nền.
- **Mặt trời lấy từ thời gian hiệu lực của snapshot.** Giờ live dùng ngày giờ hiện tại, preview dùng ngày giờ người chơi chọn. Dùng tọa độ TP.HCM cố định của module và phép tính thiên văn cục bộ. Trong trục map, `+X` là Đông, `-Z` là Bắc. Dùng azimuth và elevation để ra một vector duy nhất. Khi hướng mặt trời nằm ngoài khung spawn, người chơi có thể xoay camera theo hướng đó. Khung spawn vẫn phải cho thấy vách núi, biển sương và núi xa.

## Phạm vi và nghiệm thu

- Camera, điểm spawn, vùng chơi, đường đi, NPC, tương tác cổng, VRM và tốc độ di chuyển theo baseline owner duyệt. Chỉ đổi cảnh và ánh sáng ở Public Plaza. Personal World giữ nhánh hình ảnh hiện tại.
- Đồng hồ, live weather, preview và chế độ reduced motion tiếp tục hoạt động. Biển sương là đặc điểm địa hình. Màu, độ che phủ và cường độ sáng phản ứng với weather snapshot. Yêu cầu **mưa nhìn thấy được** đã được ghi nhận cho hạng mục thời tiết sau khi duyệt cảnh đỉnh núi. Mẫu này dùng trạng thái trời mưa để đánh giá độ tương phản của núi và ánh sáng trước.
- Chủ yếu đánh giá ở **góc spawn đã khóa**, sau đó đi sát vùng biên cho phép, xoay đủ vòng và thử zoom hai đầu. Từ các góc đã kiểm tra, cảnh có đất nối xuống sườn núi, sương dưới sân và khoảng xa đọc được. Cổng và lối đi vẫn nhìn thấy. Xem cả viewport hẹp, tránh chỉ duyệt góc chụp rộng.
- Đối chiếu cùng vị trí/camera tại bình minh, trưa, hoàng hôn, đêm và mưa. Xoay riêng về Đông/Tây để kiểm tra vị trí đĩa mặt trời và hướng bóng trong cùng preset. Preview và HUD dùng chung snapshot với cảnh.
- Giữ mục tiêu quanh 60 FPS ổn định trên thiết bị mục tiêu. So baseline và candidate cùng browser, DPR, lộ trình, thời lượng và preset. Ghi p95, p99 và lần khựng trên 50 ms. Đo tải map riêng với lúc đã chạy ổn định. Chủ sở hữu duyệt hình ảnh và cảm giác thực tế sau review kỹ thuật.
