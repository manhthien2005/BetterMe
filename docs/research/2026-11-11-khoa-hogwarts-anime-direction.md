# Khoa — hướng trang phục Hogwarts anime

Ngày 2026-11-11. Nghiên cứu tiếp nối sau khi chủ sở hữu bác bỏ trang phục v2.
Phương pháp: tự review một người theo quy định repo. Đây là brief trang phục,
không phải model mới hoặc nghiệm thu mỹ thuật.

## Quyết định đã có

- Chủ sở hữu chọn **nam sinh Hogwarts chững chạc**, yêu cầu research Harry Potter
  anime, đồng ý nền áo choàng đen dài có mũ, sơ mi, áo len cổ V xám và cà vạt đỏ trầm.
- Giữ chân dung `output/research/khoa-harry/khoa-portrait-draft.vrm`, SHA-256
  `db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312`.
  Giữ mặt, tóc, kính, tỷ lệ đầu và biểu cảm đã duyệt; giữ chất anime/toon hiện có.
- `khoa-clothing-v2` đã bị bác bỏ về mỹ thuật. Các kiểm tra kỹ thuật trước đó
  không làm thay đổi phản hồi này. Không tiếp tục lấy phom v2 làm chuẩn đẹp.

## Tham chiếu đã kiểm tra

Ba trang sau đọc lại thành công (HTTP 200) trong lượt này. Ảnh trong bảng là
ảnh nguồn đã lưu ở lượt trước; dùng để đối chiếu, không đưa vào tài nguyên game.

| Nguồn | Điều nguồn thực sự cho biết | Cách dùng cho Khoa |
| --- | --- | --- |
| [Harry Potter Shop — Gryffindor Robe](https://harrypottershop.com/products/personalized-gryffindor-robe) | Bản replica lấy từ phim, phom rộng thoải mái, lót đỏ. Ảnh trước/sau cho thấy áo dài, mũ rủ sau, thân mở và tay rộng. | Học silhouette áo choàng và quan hệ giữa lớp ngoài/lớp trong. Không bê nguyên huy hiệu sang Khoa. |
| [Harry Potter Shop — Knitted School Sweater](https://harrypottershop.co.uk/products/gryffindor-knitted-school-sweater) | Áo len cổ V, sọc màu nhà ở gấu và tay, bo cổ tay và gấu. | Dùng lớp len cổ V thay gile cài hàng khuy; giữ vùng ngực đọc rõ sơ mi và cà vạt. |
| [HarryPotter.com — Kawaii designs, 17/3/2016](https://www.harrypotter.com/news/harry-potter-characters-kawaii-designs) | Minh họa Warner Bros. cho sản phẩm được cấp phép tại Nhật, phong cách kawaii. | Tham khảo cách giản lược mảng áo và điểm nhận diện. Đây là chibi, không phải chuẩn tỷ lệ anime toàn thân cho game. |

![Bảng tham chiếu](../../output/research/khoa-hogwarts-direction/reference-board.jpg)

## Vì sao bộ v2 chưa đúng hướng

Quan sát trên `khoa-clothing-v2/front.png`: ve nhọn lớn và kéo dài chiếm vùng
ngực; vai tròn nở, tay áo khá thẳng; gile nhiều khuy cùng áo ngoài ngắn khiến
bộ đồ đọc như áo khoác cách điệu. Nhiều chi tiết may hơn vẫn giữ nguyên phom
này. Đây là nhận xét thiết kế từ render, không phải kết luận lỗi rig.

## Set đồ đề xuất

| Phần | Quyết định thiết kế | Điều cần tránh |
| --- | --- | --- |
| Áo choàng | Đen than, dài qua gối đến khoảng giữa bắp chân; mở trước, hai tà rủ chủ yếu theo chiều dọc; mũ nằm sau gáy. | Áo khoác ngắn, ve nhọn kiểu blazer, vạt xòe cứng như váy. |
| Vai và tay | Đường vai rõ, bớt phồng; tay rộng vừa và thu gọn về phía trên; cửa tay đủ mở để thấy bo áo len. | Tăng bề ngang cơ thể hoặc làm vai vuông như giáp để tạo vẻ nam tính. |
| Lớp trong | Sơ mi trắng ngà, cổ áo nhỏ; áo len cổ V xám than ôm vừa, mặt trước sạch, bo gấu rõ. | Mảng cổ trắng quá lớn, gile nhiều khuy cạnh tranh với cà vạt. |
| Cà vạt và lót | Cà vạt đỏ rượu, sọc vàng trầm mảnh; lót đỏ chỉ hiện ở mép mở, mũ và lúc cử động. | Đỏ tươi chiếm mảng lớn, viền vàng sáng quanh mọi cạnh áo. |
| Quần và giày | Quần âu xám đậm, ống thẳng; giày tối màu đơn giản, thấy đủ dưới gấu choàng. | Quần quá bó, bốt chiến đấu hoặc phụ kiện biến bộ đồ thành chiến binh. |
| Chất anime | Giữ MToon hiện có, 2–3 mức sáng tối dễ đọc, nếp lớn từ vai/khuỷu/gấu; chi tiết nhỏ tiết chế. | Shader bóng, vải PBR thực, nếp nhỏ dày đặc hoặc thay tỷ lệ đầu/thân bằng chibi. |

Màu là đề xuất để thử dưới ánh sáng game: áo `#242830`, len `#464951`, sơ mi
`#E8E3D7`, đỏ `#783D48`, sọc `#AE9761`, quần `#30343B`. Không lấy mã hex làm
bằng chứng đã đẹp; nền tối phải còn phân biệt được áo, quần và lớp lót.

Nét chững chạc/nam tính ở đây là diễn giải theo brief của chủ sở hữu: phom thẳng,
vai gọn, cổ áo gọn và phân lớp rõ. Nguồn chính thức không đưa ra quy tắc giới tính
cho các chi tiết đó. Không cần sửa khuôn mặt hoặc cơ thể để đạt hướng này.

## Điều kiện cho vòng dựng thử kế tiếp

### Bổ sung nghiên cứu chi tiết — 2026-11-11

Chủ sở hữu thấy áo choàng dài phù hợp nhưng còn ít chi tiết, yêu cầu tìm thêm
mẫu đẹp hơn, ví dụ logo mặt sau. Các lựa chọn dưới đây là đề xuất, chưa phải
huy hiệu hoặc trang phục được duyệt. Giữ chân dung và phom áo dài đã chọn.

![Ba mẫu có thêm chi tiết](../../output/research/khoa-robe-details/detail-reference-board.jpg)

| Mẫu đã xem | Chi tiết đáng học | Mức độ phù hợp |
| --- | --- | --- |
| House Fan-atic School Robe | Hoa văn chìm và phối mảng dọc, giữ lớp sơ mi/cà vạt bên trong. | Gần đồng phục; dùng làm mức nền khi thêm chi tiết. |
| Gryffindor Relic House Uniform | Hình sư tử lớn ở lưng, đường uốn và dải viền ở gấu/cổ tay. | Học cách tạo một điểm nhấn sau lưng; cả bộ khá cầu kỳ cho Khoa. |
| Ravenclaw Relic House Uniform | Đại bàng ở lưng, nét thêu kéo dọc thân và viền vai đối xứng. | Bố cục lưng dễ nhận diện; nên giảm số nét, diện tích và tương phản khi chuyển sang anime. |

Nguồn mở thành công trong lượt bổ sung:

- [Hogwarts Legacy — Fan Account Integration](https://www.hogwartslegacy.com/en-us/link-account):
  nguồn chính thức xác nhận tên House Fan-atic School Robe và có ảnh bốn bộ.
- [Game8 — House Fan-Atic School Robe Preview](https://game8.co/games/Hogwarts-Legacy/archives/404808):
  nguồn ảnh nhìn trước dùng ở cột 01.
- [Gfinity — Relic house uniform robes](https://www.gfinityesports.com/article/hogwarts-legacy-relic-house-robes):
  nguồn ảnh gameplay nhìn sau Gryffindor/Ravenclaw ở cột 02–03. Đây là báo game,
  không phải nguồn thiết kế chính thức. Nhận xét về hoa văn dựa trên ảnh đã xem.
- [Game8 — Relic House Uniform Preview](https://game8.co/games/Hogwarts-Legacy/archives/406629):
  ảnh trước đối chiếu cấu trúc. Trang Fandom bị chặn truy cập, không dùng làm bằng chứng.

**Đề xuất cho Khoa:** nền đen than/lót đỏ đã chọn, thêm một huy hiệu thêu màu
đồng nhạt ở giữa lưng, nằm dưới mép mũ khi mũ buông; bề ngang thử khoảng 1/3–2/5
bề ngang lưng. Thêm viền mảnh ở mép mũ, cổ tay và gấu, một khóa cài nhỏ trước
ngực và huy hiệu ngực nhỏ cùng hệ hình. Chi tiết chính là huy hiệu lưng; các
viền hỗ trợ nó. Không cần họa tiết phủ kín, ánh sáng phát quang hoặc vai giáp.

Huy hiệu học viện có thể là **sách mở + ngôi sao**, hoặc một biểu tượng chim
cách điệu nếu chủ sở hữu thích nét của mẫu Ravenclaw; chưa chốt icon. Đây là
thiết kế riêng đề xuất, không tự gán logo franchise hoặc thay nhận diện game.
Chỉ tham khảo trang phục của game nguồn; giữ MToon, tỷ lệ anime và gương mặt
đã duyệt. Nét thêu cần ít, rõ ở camera chơi; dưới mũ không bị che, qua xương vai
không bị kéo méo. Kiểm các điều này trên bản dựng sau, không suy từ bảng ảnh.

Bảng ảnh đã crop/thu nhỏ từ nguồn, 1000×660, 86.645 byte. Mọi tệp tham khảo và
URL ảnh nằm trong `output/research/khoa-robe-details/`. Lượt này chưa dựng logo,
chưa chỉnh model hoặc code ứng dụng.

### Kiểm tra khi dựng thử

1. Dựng riêng trên chân dung đã duyệt; không ghi đè public model bằng recipe cũ.
2. Ưu tiên silhouette trước. Xem trước/sau/bên và camera chơi; chưa thêm đường may
   nhỏ hay spring mới khi phom còn sai. Hướng tổng thể đã chốt, model mới chưa duyệt.
3. Áo choàng dài cần thử gối/chân, ngồi nếu có, chạy/nhảy và quay người; giữ các
   cử chỉ chào, chỉ hướng, mở tay, chỉnh cổ tay. Rig đã kiểm ở v2 chưa chứng minh
   một áo dài mới sẽ không xuyên. Mũ cũng phải tránh tóc khi quay đầu.
4. Kiểm mặt/tóc/kính/morph/license nguyên vẹn, lớp áo không tách khi gập tay,
   giảm chuyển động, 30/60 Hz và stall. Tự review riêng trước khi đưa anh xem.
5. Chỉ tích hợp asset/manifests sau vòng xem thật; chạy gates phù hợp cho thay đổi
   sản phẩm và đủ bốn gates trước commit. Không suy diễn hiệu năng điện thoại thật.

## Phạm vi đã hoàn tất

Đã đối chiếu nguồn, xem bảng ảnh, ghi nhận v2 bị bác bỏ và chốt brief tiếp nối.
Lượt này chỉ thêm tài liệu và bảng tham chiếu JPEG 1.140×615 (77.226 byte),
không sửa code/model/manifest hoặc dựng trang phục mới. Không chạy bốn gates
ứng dụng cho thay đổi tài liệu. Không commit, push hay deploy.

Để tiếp nối nhẹ: đọc bản ghi đầu `HANDOFF.md` và tài liệu này; không cần nạp
lại toàn bộ lịch sử chat, log công cụ, VRM nhị phân hoặc ảnh gốc lớn.
