# Reading Quest — học viện phù thủy theo phong cách fantasy anime

## An/Minh được chấp nhận; hỏi bước tiếp theo — 2026-11-11

Sau khi xem bản tích hợp local, chủ sở hữu phản hồi “Ok. Tốt rồi” và hỏi cần
làm gì tiếp. Chốt vòng ngoại hình An/Minh hiện tại cùng player/Khoa đã duyệt.
Các giới hạn kiểm thử đã ghi vẫn còn. Chưa có yêu cầu commit/deploy hoặc
triển khai đề xuất nhiệm vụ đọc tiếng Anh; bước tiếp theo đang được tư vấn.

## Khoa trong game được duyệt; tiếp tục An và Minh — 2026-11-11

Chủ sở hữu nhận xét Khoa trong game “đẹp rồi” và yêu cầu tiếp tục. Bước kế tiếp
theo lộ trình đã đề xuất là đồng bộ trang phục An/Minh: cổ gọn, viền tiết chế,
huy hiệu sách/ngôi sao cùng hệ. An giữ xanh rêu, choàng vai, váy dài và tóc nâu;
Minh giữ nâu ấm, dải học giả, quần, kính và sách. Giữ chân dung/rig/chuyển động,
không thêm mũ. Huy hiệu lưng đặt dưới tóc, huy hiệu ngực nhỏ không vướng sách.
Player/Khoa đã duyệt giữ nguyên. Dựng và kiểm tra rồi tích hợp local để xem;
không tự coi đó là nghiệm thu An/Minh hay yêu cầu commit/deploy.
[Kế hoạch](../plans/2026-11-11-an-minh-refinement.md).

Đã dựng và tích hợp An/Minh vào game local: cổ gọn, cổ V cao hơn, viền tay
tiết chế, huy hiệu sách/ngôi sao ở lưng và ngực. An giữ lớp choàng vai/váy dài
với nếp váy dịu hơn; Minh giữ dải học giả/kính/sách. Mặt/tóc/rig/biểu cảm và
chiều dài trang phục được giữ; player/Khoa/sample giữ nguyên từng byte.
Huy hiệu bám grid/skin của áo và dùng mipmap. Hội thoại/cử chỉ, giảm chuyển
động, cảnh đêm và fallback/phục hồi đạt. Typecheck/lint/build đạt; full suite
855 tests / 88 files đạt với hai worker. Ảnh thật ở
`output/playwright/an-minh-refinement/an-minh-in-game.jpg`.
Đây là bản local chờ chủ sở hữu xem, chưa là duyệt mỹ thuật An/Minh; HUD
điện thoại vẫn che nhiều nhân vật. Chưa commit hoặc deploy.

## Đã cho phép tích hợp Khoa — 2026-11-11

Sau khi xác nhận player nữ ổn trong game, chủ sở hữu đồng ý bước tiếp theo:
đưa bản Khoa áo choàng dài đã duyệt vào NPC quản sự để xem trong cảnh thật.
Giữ chân dung, áo không mũ và huy hiệu; kiểm tra cử chỉ/hội thoại, không thêm
chạy cho NPC. Giới hạn xuyên chân khi ép áo choàng chạy vẫn còn.
Giữ player/An/Minh; lưu chân dung VRM nguồn ngoài `public` và công thức dựng áo
trong `scripts/`. Chỉ chỉnh sampler huy hiệu nếu cần cho khoảng cách camera game.
[Kế hoạch tích hợp](../plans/2026-11-11-khoa-integration.md).

Khoa hiện đã dùng bản duyệt trong `/world` local; SHA-256 public
`ce7e1f46ced9613082cc4f1cd24c1e9f87618062fb14de35b7dc94e3f1b9c483`.
Chỉ hai sampler huy hiệu thêm mipmap so với preview; toàn bộ bytes hình học/
texture/morph giữ nguyên. Hội thoại/cử chỉ và fallback đạt; full suite 853 tests
đạt khi giới hạn hai worker, typecheck/lint/build đạt. Chưa deploy hoặc commit.

## Player nữ được duyệt để đưa vào game — 2026-11-11

Chủ sở hữu xác nhận bản nữ tốt và yêu cầu áp dụng vào game thật để xem thử.
Tích hợp đúng `female-player-refined.vrm`, SHA-256
`12c09afe2ac18a8546034b00e752672a30c5a0f262f5d43906af96977d8ea8f8`,
vào player hiện có; giữ ngoại hình, chuyển động và các NPC trong vòng này.
Lưu công thức dựng/crest vào scripts để tái tạo được asset đã duyệt, đồng bộ
manifest và kiểm tra `/world` local. Đây không phải yêu cầu commit hoặc deploy.
[Kế hoạch tích hợp](../plans/2026-11-11-female-player-integration.md).

Kiểm tra trong game phát hiện nét huy hiệu bị đứt ở khoảng cách camera thực.
Bản tích hợp thêm mipmap riêng cho hai texture huy hiệu; so sánh trước–sau
trong cùng cảnh xác nhận viền liền hơn. Hình học, hình vẽ texture, rig và morph
giữ nguyên từng byte. Bản dùng trong game có hash
`8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f`;
chỉ sampler và hai tham chiếu sampler khác bản đã duyệt.

Đã tích hợp tại `/world` local: kiểm tra đi/chạy/nhảy/tiếp đất, tải lại, chế độ
giảm chuyển động và fallback đạt. `pnpm verify` đạt 852 tests cùng typecheck,
lint và build. Chưa deploy; An/Minh/Khoa giữ public asset trước đó.

## Đã cho phép tinh chỉnh player nữ — 2026-11-11

Chủ sở hữu đã đồng ý triển khai đề xuất: bắt đầu từ player nữ, giữ mặt/tóc/tỷ lệ
anime hiện tại; làm gọn cổ áo, cải thiện vai–tay/phân lớp và độ rủ trang phục,
thêm huy hiệu/khóa cài/viền cùng hệ học viện với Khoa. Giữ xanh rêu–bạc, gile,
váy xếp ly, tất và bốt. Tóc dài giữ nguyên; đặt huy hiệu lưng ở vùng không bị tóc
che. Không thêm mũ hoặc đổi chuyển động. An/Minh chờ vòng player được xem trước.

[Kế hoạch và kiểm tra](../plans/2026-11-11-female-player-refinement.md).
Đây là cho phép dựng bản thử thực, chưa là nghiệm thu ngoại hình hoặc tích hợp.

Bản thử player đã dựng ở `output/research/female-player-refinement/`:
cổ sơ mi gọn hơn, vai/tay liền hơn, nếp váy nhẹ hơn, huy hiệu bạc dưới tóc và
khóa cài/viền tiết chế. Giữ nguyên chân dung, chiều dài áo/váy và bốt.
`FEMALE_REFINEMENT_PASS`, dựng lại cùng hash, năm public VRM giữ nguyên;
đã xem tư thế đi/chạy/nhảy, clip 19,9 giây và 18 biểu cảm. Có ảnh trước–sau
và README cạnh model. Đây vẫn là preview chờ chủ sở hữu xem, chưa sửa An/Minh,
chưa chứng nhận va chạm vải toàn diện hoặc hiệu năng điện thoại thật.

## Ngoại hình Khoa được chấp nhận; đánh giá model nữ trước khi triển khai — 2026-11-11

Chủ sở hữu nhận xét bản áo choàng dài không mũ “khá đẹp” và xác nhận model nam
“vậy là được rồi”. Ngoại hình Khoa được chấp nhận ở bản
`output/research/khoa-long-robe/khoa-long-robe.vrm`, SHA-256
`7c31fcb29f8bb9bba28ecb644eeb3d343cbd8a6b02dc48baca7f8b42151b2bc3`.
Đây là chấp nhận mỹ thuật; giới hạn chạy/xuyên chân và trạng thái chưa tích hợp
ở các mục dưới vẫn còn. Không tự diễn giải thành yêu cầu commit/deploy.

Chủ sở hữu hỏi đánh giá việc cải thiện model nữ. Đã xem các render player/An/Minh
và đối chiếu hash asset hiện tại với báo cáo fitting. Đề xuất chỉnh nhẹ cổ–vai–tay
áo, phân lớp trang phục và huy hiệu cùng hệ học viện, giữ mặt/tóc/tỷ lệ hiện có.
Tóc dài che lưng trên nên vị trí huy hiệu cần thử riêng. Đây là đánh giá, chưa
phải yêu cầu thực thi hoặc thiết kế nữ đã được duyệt.

## Đã duyệt dựng áo choàng có chi tiết, chưa cần mũ — 2026-11-11

Chủ sở hữu đồng ý triển khai hướng áo choàng dài với huy hiệu thêu riêng phía
sau, viền nhẹ và khóa cài phía trước. **Bỏ phần mũ trong vòng này** theo yêu cầu
mới nhất; mọi mô tả mũ ở các mục trước chỉ là lịch sử. Giữ chân dung đã duyệt,
chất anime, lớp len cổ V/sơ mi/cà vạt và quần âu. Huy hiệu thử dùng khiên sách
mở–ngôi sao màu đồng nhạt; đây là bản dựng để xem thật, chưa là nghiệm thu asset.

[Kế hoạch dựng thử và kiểm tra](../plans/2026-11-11-khoa-long-robe.md).

Bản thử thật hiện nằm ở `output/research/khoa-long-robe/`: áo choàng đến bắp chân,
huy hiệu lưng/ngực cùng hệ hình, viền cổ tay/gấu và khóa cài. Giữ chân dung;
không có mũ. Đã kiểm cử chỉ NPC, xoay người, biểu cảm và ổn định spring.
Thử thêm clip chạy phát hiện xuyên chân ở tư thế gập mạnh: chưa nghiệm thu
trang phục cho chạy/nhảy, chưa tích hợp public model. Xem README cạnh artifact.

## Phản hồi trang phục v2 và hướng Hogwarts anime — 2026-11-11, mới nhất

Chủ sở hữu đã bác bỏ bộ đồ `khoa-clothing-v2`: chưa giống Harry Potter và cần
chững chạc/nam tính hơn. Hướng được chọn là **nam sinh Hogwarts chững chạc**,
theo chất anime hiện có: áo choàng đen dài có mũ, áo len cổ V xám, sơ mi trắng
ngà, cà vạt đỏ trầm, quần âu thẳng. Giữ nguyên chân dung Harry-inspired đã duyệt.

[Nghiên cứu và brief trang phục](../../research/2026-11-11-khoa-hogwarts-anime-direction.md)
phân biệt nguồn chính thức với diễn giải thiết kế. Tỷ lệ chibi của minh họa
Nhật không thay tỷ lệ nhân vật game. Hướng tổng thể đã được chọn; lượt tiếp nối
chỉ hoàn tất research, chưa dựng hoặc duyệt model mới. Các kiểm tra v2 dưới
đây là bằng chứng kỹ thuật lịch sử, không phải nghiệm thu mỹ thuật.

## Bản thử hoàn thiện trang phục Khoa — 2026-11-11

Chủ sở hữu đã yêu cầu thực thi nghiên cứu trang phục. Bản thử riêng ở
`output/research/khoa-clothing-v2/` giữ nguyên chân dung đã duyệt, chỉnh cấu trúc
vai/tay, cổ/ve áo, gile, cửa tay, đường may và cà vạt sọc; thêm độ rủ nhẹ ở tà và
cà vạt trên loader hiện có. Ảnh trước/sau và clip là render của model thật.

Trạng thái: bản thử đã có kiểm mesh/skin/preservation, 30/60 Hz, stall/reset,
reduced motion và 18 biểu cảm; sau đó bị bác bỏ mỹ thuật theo mục mới nhất. Chưa thay public model
hoặc manifest, chưa coi trang phục mới được duyệt. [Plan và kết quả](../plans/2026-11-11-khoa-clothing-refinement.md)
ghi kiểm tra và các giới hạn; chưa nghiệm thu chạy/nhảy hay hiệu năng mobile thật.

## Chốt chân dung Khoa; nghiên cứu trang phục — 2026-11-11

Chủ sở hữu nhận xét bản Harry-inspired “rất thích, đẹp hơn rồi” và đồng ý giữ
chân dung này làm chuẩn. Bản được thích là `output/research/khoa-harry/khoa-portrait-draft.vrm`,
SHA-256 `db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312`.
Trạng thái: ngoại hình chân dung được chấp nhận; chưa tích hợp vào game.

Yêu cầu tiếp theo: research trang phục chi tiết hơn và mượt khi tương tác.
[Kết quả nghiên cứu, nguồn và thứ tự sửa](../../research/2026-11-11-khoa-clothing.md)
phân biệt lỗi quan sát được với giải pháp đề xuất. Giữ mặt/tóc/kính đã duyệt;
ưu tiên phom, lớp áo và deformation trước trang trí/chuyển động phụ. Đây chưa
phải nghiệm thu trang phục mới hoặc sự cho phép dựng lại phong cách nhân vật.


## Tham chiếu Harry Potter anime — 2026-11-11

Chủ sở hữu thấy bản `output/research/khoa-portrait/` đẹp hơn và yêu cầu tiếp tục
tinh chỉnh với Harry Potter anime làm chuẩn. Giữ bản này để đối chiếu; chưa coi
là đã duyệt tích hợp. Vòng tiếp theo vẫn là chân dung VRM riêng, cùng loader,
camera và ánh sáng, không dựng lại nền nhân vật.

Nguồn đã đọc: [bộ minh họa chính thức phát hành cho sản phẩm tại Nhật, 17/3/2016](https://www.harrypotter.com/news/harry-potter-characters-kawaii-designs).
Đây là kawaii/chibi: kính tròn, các lọn mái lệch và biểu cảm rõ; không lấy tỷ lệ
đầu/thân chibi làm tỷ lệ game. Ảnh chủ sở hữu `owner-4.png` là tham chiếu gần
phong cách game hơn: tóc đen, mắt xanh, kính và mặt anime mềm. Các quyết định
thực thi: tóc đen than với highlight lạnh tiết chế, mái tách lớp lệch nhẹ, kính
tròn mảnh, iris xanh và mày rõ hơn; giữ hình mặt bản vừa được phản hồi tích cực.
Không thêm sẹo/logo/huy hiệu Harry Potter vào Khoa trong vòng chân dung này.


## Điều chỉnh của chủ sở hữu — 2026-11-11: giữ phong cách hiện tại

Chủ sở hữu bác bỏ hướng dựng lại Khoa trong Blender ở các chat tiếp nối. Chuẩn
thị giác là **player đã duyệt và các model hiện có trong game**: anime/toon,
nét mặt mềm, mảng màu và đường viền như hiện tại. Chỉ cải thiện nhẹ độ chỉn chu;
không tự thay nền nhân vật hay toàn bộ phong cách để làm lại từ đầu.
VRM vẫn là định dạng kỹ thuật hiện có; yêu cầu này nói về phong cách tạo hình,
không phải yêu cầu chuyển game sang 2D.

Áp dụng trên `academy-scholar-v1` và `academy-{an,khoa,minh}-v1`. Bản thử ngoài
repo `D:/Dev/Tools/VROIDStudio/projects/khoa-academy-v2` không phải hướng tiếp tục,
không tích hợp vào game. Các tham chiếu trước chỉ hỗ trợ tinh chỉnh bộ hiện có.
Mọi đề xuất phía dưới về dựng nền/chân dung mới được thay bằng phạm vi này.

**Phản hồi tiếp theo cùng ngày:** chủ sở hữu bác bỏ cả diện mạo Khoa hiện tại,
đặc biệt mặt/thần thái không giống anime và kém bộ nhân vật nữ. “Giữ phong cách”
không có nghĩa là giữ nguyên gương mặt/tóc Khoa đã bị bác bỏ. Player và bộ nữ là
chuẩn chất lượng; Khoa không phải mẫu chuẩn hay bản đã duyệt.

Lượt sửa cổ/ve áo trong chat này đã dừng và hoàn nguyên riêng thay đổi của lượt
đó. Bản Khoa cũ còn trong game chỉ là trạng thái trước thử nghiệm, không được
coi là chủ sở hữu chấp nhận. Không tiếp tục vá áo để thay cho giải quyết mặt/tóc.
Vấn đề đã xác định: Khoa co chiều cao mắt, nới hàm và thay tóc gốc bằng các mảng
hình học đơn giản; An/Minh giữ mặt/texture nguồn và phần lớn cấu trúc tóc nguồn.
Ưu tiên lượt tiếp theo là chân dung nam cùng ngôn ngữ anime/toon của player,
dùng ảnh cận mặt và góc 3/4 để nhận xét trước khi tiếp tục trang phục. Đây là hướng
khắc phục đề xuất, chưa có chân dung mới được chủ sở hữu duyệt.

Chủ sở hữu đã yêu cầu thực thi hướng sửa chân dung để xem (2026-11-11). Vòng này
làm bản VRM thử riêng, ưu tiên giữ mắt/texture/tóc nguồn đã tạo nét anime của player;
bỏ biến dạng hàm rộng/mắt hẹp quá mức. Chỉ điều chỉnh nhẹ để ra chân dung nam,
tóc ngắn có lớp và kính mảnh; giữ trang phục, rig, chuyển động và các nhân vật khác.
Ảnh phải là render model thật ở cùng ánh sáng với mẫu gốc. Không coi bản thử được
duyệt chỉ vì đã xuất file, chạy test hoặc hoàn thành kỹ thuật.

Ngày 2026-11-10. **Phong cách được chủ sở hữu chọn; chi tiết từng nhân vật dưới đây là đề xuất mỹ thuật, chưa phải model đã nghiệm thu.**

Chủ sở hữu làm rõ: **fantasy anime → học thuật → học viện phép thuật lấy cảm hứng
từ Harry Potter**. Đây là tham chiếu thẩm mỹ chủ đạo khi chọn hoặc dựng model:
đồng phục dưới áo choàng phù thủy, sách phép, đũa phép và cảm giác học viện cổ kính.
Khuôn mặt, tóc, tỷ lệ và cách dựng vật liệu vẫn theo anime. “Trưởng thành” chỉ cách
xử lý tỷ lệ, nét mặt và mức tiết chế. Các đề xuất trang phục đại học đời thường
và blazer fantasy đơn thuần trước đó được thay bằng hướng học viện phù thủy này.

## Mục tiêu và thứ tự

### NPC fitting — chủ sở hữu yêu cầu tiếp sau khi duyệt player

Chủ sở hữu nhận xét player “rất đẹp” và yêu cầu cả NPC có phong cách tương tự.
Tiếp tục cùng cách dựng VRM dẫn xuất, không thay player đã duyệt. Vòng này làm
trang phục nhận diện riêng cho cả ba: An áo xanh rêu có lớp vai ngắn và váy dài
hơn; Khoa áo navy có cổ đứng, lót đỏ rượu, thắt lưng/túi sổ và quần dài; Minh áo
nâu ấm có dải cổ học giả, kính mảnh, quần dài và tay áo gọn cho sách hiện tại.
Các lựa chọn chi tiết là quyết định thực thi theo brief, không phải yêu cầu mới
của chủ sở hữu. Giữ mặt/rig; có thể rút gọn tóc sample để cổ/vai và kính rõ hơn.
Đây vẫn là fitting cho anh duyệt dần, không tuyên bố ba chân dung cuối đã hoàn tất.
Giữ nguyên vai trò, hội thoại, cử chỉ, sách, camera và môi trường.

Tái sử dụng generator đã có giúp cùng chất vật liệu và sửa nhanh theo phản hồi.
Ba bản chỉ đổi màu không đáp ứng khác biệt phom; mua/download bộ model mới
không cần thiết cho yêu cầu trang phục hiện tại và thêm phụ thuộc giấy phép.

### Hình tham khảo và vòng dựng thử được chủ sở hữu cho phép

Chủ sở hữu yêu cầu thực thi rồi chỉnh dần và cung cấp ba ảnh trang phục. Các ảnh
là chuẩn thị giác ưu tiên cho vòng player đầu tiên, thay đề xuất quần dài/navy:

- Ảnh 1: áo choàng đen, lót xanh rêu, mở trước, tay loe; gile ôm eo, viền bạc,
  cà vạt sọc, váy xếp ly, phụ kiện da nhỏ. Dùng làm chuẩn hình dáng và phân lớp.
- Ảnh 2: sơ mi/cà vạt/gile/váy tách riêng khỏi áo choàng, cùng bốt; dùng để kiểm
  mỗi lớp có hình khối thật và vẫn đọc được khi mặc chồng lên nhau.
- Ảnh 3: phối đồng phục với blazer, tất tối và khăn; tham khảo tỷ lệ và biến thể,
  chưa cần mặc thêm blazer/khăn/găng trong bộ đầu vì đã có áo choàng.

Ảnh được giữ tại `output/research/academy-character/owner-reference-01..03.png`
(ignored). Chỉ dùng để tham khảo; không lấy ảnh, logo hay hình thêu rắn làm texture.
Huy hiệu và chi tiết trang trí mới dùng sách/ngôi sao/đường nét riêng của dự án.

Vòng thực thi đầu: **player fitting v1**, áo choàng đen than–xanh rêu, viền bạc,
sơ mi ngà, cà vạt sọc, gile, váy xếp ly, tất tối và giày/bốt thấp. Giữ mặt/tóc/rig
của sample làm nền fitting; chưa coi đây là chân dung cuối hoặc bốn NPC hoàn chỉnh.
Tạo một VRM dẫn xuất có mesh trang phục mới, tái tạo bằng script local, giữ mẫu
gốc nguyên vẹn và toàn bộ điều kiện giấy phép. Không cần API tạo ảnh hoặc cài
công cụ 3D mới cho vòng fitting này. Nghiệm thu bằng ảnh render và chơi thật.

Phục vụ thiếu niên và người lớn luyện tiếng Anh/IELTS trong học viện trên núi.
Ưu tiên hiện tại là player và NPC có diện mạo chỉn chu, dễ nhận ra và phù hợp cảnh.
Chuyển động đã được chủ sở hữu nghiệm thu, lưu tại checkpoint `2e07a39`.
Giữ bầu trời, quảng trường, camera và cảm giác điều khiển đã duyệt.

Làm player trước để xác lập chất lượng khuôn mặt, tóc, trang phục và tỷ lệ trong
camera thật; sau đó áp dụng cùng chất lượng cho An, Khoa, Minh. Không triển khai
nhiệm vụ học tập trong mốc này. Cơ chế học được trình bày riêng trong
[đề xuất nhiệm vụ](2026-11-10-english-reading-quest-proposal.md).

## Hướng tạo hình

- Học viện phù thủy cổ kính, ấm áp, có cảm giác khám phá bí mật qua việc học.
  Nét mặt anime mềm và trưởng thành vừa phải, tỷ lệ tự nhiên cách điệu, mái tóc
  có thiết kế rõ. Dùng Harry Potter làm tham chiếu về không khí trường phép thuật.
- Đồng phục gồm sơ mi ngà, cà vạt, gile hoặc áo len mỏng bên trong áo choàng học
  viện mở phía trước. Áo choàng là hình dáng nhận diện chính của học viên; có lớp
  lót màu riêng, khóa cổ nhỏ và huy hiệu học viện. Gấu áo cách mắt cá đủ xa, tà mở
  để thấy chân khi đi/chạy. Học giả có biến thể áo choàng phù hợp vai trò.
- Vải có độ dày, nếp gấp tiết chế; phối khóa đồng nhỏ, da và bìa sách. Than/navy,
  ngà và da nâu là nền chung; xanh rêu, đỏ rượu hoặc xanh mực dùng cho lớp lót và
  phụ kiện. Vàng đồng mờ `#B59A63` làm điểm nhấn nhỏ ở khóa hoặc huy hiệu.
  Tránh áo trắng mất chi tiết trong nắng; không cần thêm hiệu ứng phát sáng.
- Chất phép thuật học thuật hiện qua sách phép bìa da, dấu trang, túi đựng bút
  và đũa phép gọn ở thắt lưng. Đũa phép là đề xuất phụ kiện, chưa thêm thao tác
  thi triển phép, chiến đấu hay hệ phép thuật. Giữ tay player tự do cho chuyển
  động hiện có; tránh trang sức dày đặc làm mất hình dáng áo choàng.
- Cùng thế giới vật liệu nhưng khác hình dáng tóc, mặt, đường viền trang phục và
  mảng sáng/tối. Đổi màu cùng một model không đủ để nghiệm thu bốn nhân vật.
- Tóc chia lọn rõ, mái không che mắt, chuyển động phụ nhẹ. Tay áo gọn để động tác
  chào/giải thích dễ đọc. Kiểm khoảng trống ở vai, nách, hông, gối và tóc sau lưng.
- Màu dưới đây là màu vật liệu 3D đề xuất, không thêm hoặc thay token giao diện.
  Kiểm lại dưới ánh sáng sáng/trưa/tối của quảng trường, không duyệt chỉ qua hex.

## Bộ nhân vật đề xuất

| Nhân vật | Dáng và trang phục | Tóc, mặt, điểm nhận diện | Bảng màu vật liệu |
| --- | --- | --- | --- |
| Player — học viên phép thuật | Fitting theo ảnh chủ sở hữu: áo choàng than mở trước, lót xanh rêu, viền bạc; sơ mi ngà, gile, cà vạt sọc, váy xếp ly, tất tối và bốt thấp. | Fitting giữ mặt/tóc sample để duyệt trang phục; chưa chốt chân dung mặc định cuối cùng. | Than `#232A2D`, xanh `#284C3F`, ngà `#DDDCD2`, bạc trầm `#9CA7A1`. |
| Học giả An — dẫn đường | Áo choàng học giả xanh rêu với lớp vai ngắn, khóa cổ hình sách và tay áo đủ gọn để chào/giải thích. | Tóc ngang vai vén một bên, nụ cười nhẹ, đường nét mặt mềm; nhận diện bằng lớp vai và đường vải rủ. | Xanh rêu `#526B5D`, kem `#E8DFCF`, nâu tóc `#594538`. |
| Quản sự Khoa — phụ trách cổng | Áo khoác phù thủy có cấu trúc, cổ đứng, tà mở, hàng khuy và thắt lưng mảnh; túi sổ nhỏ, huy hiệu học viện, bốt thấp. | Tóc ngắn rẽ ngôi, chân mày rõ; đường viền áo thẳng, phong thái chỉn chu. | Navy `#354659`, đỏ rượu trầm `#754851`, da nâu `#795C46`; khuy đồng mờ. |
| Thủ thư Minh — cố vấn đọc | Áo choàng học giả nâu trầm trên sơ mi/gile, cổ áo mềm, tay gọn; sách phép bìa da giữ tay trái, dấu trang bằng dải vải. | Tóc ngắn có lớp, kính gọng mảnh, nét mặt điềm tĩnh; kiểm mắt còn thấy rõ qua kính. | Nâu ấm `#806955`, ngà `#E2D8C8`, than `#4D504F`, bìa sách xanh trầm. |

Đây là mô tả tạo hình, không tự đặt thêm tuổi, giới tính, tiểu sử hay đổi vai trò,
tên và nội dung hội thoại. Khác biệt chính phải thấy được ở camera chơi bình thường,
kể cả khi ẩn nhãn tên; chi tiết nhỏ chỉ bổ sung khi camera tiến gần.
Huy hiệu dùng mô-típ sách mở và ngôi sao do dự án tự thiết kế, giúp cả nhóm thuộc
cùng một học viện. Giữ tên/nhân vật hiện có và phát triển trang phục riêng; không
cần tái tạo nguyên bộ đồng phục, huy hiệu hay chân dung nhân vật Harry Potter.
Màu lót hiện chỉ để phân biệt nhân vật, không tự thêm hệ chia nhà hoặc thi đua.
Hình dáng chính khác nhau: áo choàng học viên mở của player, lớp vai của An,
cổ đứng/tà thẳng của Khoa và áo học giả cổ mềm của Minh. Các lựa chọn cụ thể vẫn
là đề xuất, cần xem trên model trước khi nghiệm thu.

## Cách sản xuất và giới hạn hiện tại

Vòng player fitting đã được dựng bằng `scripts/create-academy-character.mjs`,
thêm mesh trang phục có skin trên nền sample được phép chỉnh sửa. Asset
`academy-scholar-v1.vrm` đã được chọn làm player để duyệt trực tiếp trong `/world`.
Tài liệu [nguồn và xác minh](../../academy-character-assets.md) ghi thông số,
giấy phép, cách tái tạo, ảnh kiểm tra và giới hạn. Không có ảnh concept AI;
ảnh gửi chủ sở hữu là render của chính model. Chưa có mô phỏng vải hay khuôn mặt
và chân dung mới. Vòng NPC tiếp theo đã có ba VRM trang phục riêng, giữ mặt/rig
sample và rút gọn tóc; xem phần NPC fitting trong tài liệu nguồn/xác minh.

Các hướng cho bản nhân vật hoàn thiện sau fitting:

1. **Dựng nền bằng VRoid Studio, chỉnh mesh khi cần:** phù hợp để tạo một bộ
   nhân vật đồng nhất với tóc/trang phục khác nhau. Áo choàng dài, lớp vai, cổ áo và phụ
   kiện riêng có thể cần chỉnh bằng công cụ 3D ngoài VRoid; chưa mặc định preset
   có sẵn đáp ứng được thiết kế. Đây là một phương án cho bản hoàn thiện;
   cần người hoặc công cụ thực sự xuất được model, file nguồn và quyền sử dụng rõ.
2. **Chỉnh bộ VRM có sẵn, giấy phép phù hợp:** có thể nhanh hơn nhưng phải chọn theo
   phong cách và kiểm từng giấy phép. Chưa tìm được một bộ bốn model đủ điều kiện.
3. **Chỉ nhuộm màu model hiện tại:** có thể phân biệt tạm thời, nhưng vẫn giữ cùng
   mặt/tóc/trang phục; không đáp ứng đích mỹ thuật nên không coi là bước hoàn thiện.

Repo giữ cả `scholar-vrm1.vrm` (pixiv, VRM1_Constraint_Twist_Sample) và asset
fitting dẫn xuất. Không gọi API tạo ảnh/model; chủ sở hữu không muốn dùng API key.
Ảnh concept, nếu có sau này, chỉ giúp duyệt ngoại hình và không thay file 3D có rig.

Đã kiểm nguồn ngày 2026-11-10:

- [Danh sách mẫu chính thức VRM](https://github.com/vrm-c/vrm-specification/tree/master/samples):
  có model mẫu hiện dùng, Seed-san và các mẫu kiểm tính năng; chưa chọn model mới.
- [Danh sách điều kiện mẫu VRoid](https://vroid.pixiv.help/hc/en-us/articles/4402614652569)
  và [điều kiện AvatarSample A/B/C](https://vroid.pixiv.help/hc/en-us/articles/4402394424089):
  truy cập trả HTTP 403. Chưa xác minh được nội dung hiện hành, không suy quyền dùng
  từ bản sao README của bên thứ ba và không đưa model từ mirror vào sản phẩm.

Không chờ công cụ tạo ảnh để dựng thử. Script hiện tại đủ cho vòng trang phục;
thiết kế chân dung riêng và vải hoàn thiện vẫn là công việc tiếp theo,
không được coi là đã hoàn tất chỉ vì fitting chạy được.

## Các bước tiếp theo và điều kiện nghiệm thu

- [x] Có bản player fitting VRM 1.0 với texture đóng gói, script nguồn chỉnh sửa, tác giả
  và bằng chứng quyền sửa/phân phối qua web. Quy cách: [bàn giao asset](../../character-asset-handoff.md).
- [ ] Duyệt player trước/bên/sau và tại camera thực tế. Kiểm khuôn mặt, tỷ lệ cơ thể,
  tóc, vải, giày, biểu cảm và chất học viện phù thủy fantasy anime. Chỉ khi thấy hình
  mới chốt chân dung mặc định.
- [x] Đăng ký asset fitting tại `src/lib/world/character-assets.ts` và
  `public/models/characters/manifest.json`; file ở `public/models/characters/`.
  Giữ sample để đối chiếu và không thay license metadata để vượt kiểm tra.
- [ ] Kiểm thực trên rig mới: đứng/đi/chạy/nhảy/tiếp đất, cử chỉ NPC, camera sát,
  giảm chuyển động, tải lỗi. Căn đế giày và tay cầm sách theo model nếu cần;
  kiểm áo choàng/tà áo không xuyên vai, tay, hông, đầu gối hay sách, không quét
  đất hoặc che kín bước chân. Kiểm riêng tà áo khi chạy/nhảy và bao đũa phép nếu
  có. Không thay physics hoặc làm chậm động tác để che lỗi trang phục/tỷ lệ.
- [x] Dựng fitting An, Khoa, Minh theo cùng quy trình; đổi ID tại
  `NPC_CHARACTER_ASSET_IDS`. Không thêm hệ character creator hoặc cơ chế hội thoại.
- [ ] Chạy test manifest/rig liên quan và `pnpm verify` khi tích hợp. Kiểm desktop,
  khung điện thoại và thiết bị thật trước khi cam kết hiệu năng mobile. Tự review
  riêng theo AGENTS.md. Commit tiếp chỉ khi có yêu cầu của chủ sở hữu.

Không đặt ngân sách polygon bằng cách nhân thông số model mẫu. Đo dung lượng,
texture, draw calls và thời gian khung hình của bộ asset thực tế rồi mới tối ưu.
