# Quy chuẩn mỹ thuật đảo bay

Mẫu chính: **Vườn Gió v18 đã duyệt**. Đây là phong cách của bộ asset BetterMe, học nguyên tắc thị giác từ Tiny Glade và hình khối/vân đá của Mạch Nguồn. Không khẳng định dùng thuật toán nội bộ hay asset của Tiny Glade.

## 1. Ngôn ngữ chung và quyền biến thể

Cảm giác cần giữ: một khu vườn có sức sống trên khối đảo già cỗi; xanh đủ đậm, chất liệu lì, ánh sáng có chiều sâu, cây cỏ mọc có nơi có chốn. Chi tiết phục vụ hình khối lớn và bố cục, không phủ đều mọi bề mặt.

| Giữ xuyên suốt bộ đảo | Được thay theo brief từng đảo |
|---|---|
| Ba cấp hình khối: đảo/tán chính → mảng cây/đá → lá/vết mòn | Silhouette, số bậc địa hình, độ lệch và độ sâu thân đảo |
| Chuyển tiếp mềm ở mép cỏ–đá, chất khoáng cùng họ | Diện tích cỏ, vùng ẩm/khô, dạng đất/đá theo môi trường |
| Cỏ cong có gốc/ngọn, cụm thấp–vừa–cao, khoảng trống | Hình dạng vùng cỏ; mật độ theo diện tích và khoảng nhìn |
| Lá/hoa matte, màu có tổ chức và cây có cấu trúc | Loài/cỡ cây, cấu trúc tán, màu hoa và quả nhấn |
| Props bám nền; tàn tích có thiết kế kiến trúc rồi mới hư hỏng | Loại công trình, trạng thái sụp đổ, hệ hoa văn riêng |
| Nước thấy độ sâu, phản xạ dịu; đèn ấm, đêm đọc được cảnh | Có/không hồ, suối, thác, đèn, đom đóm; vị trí phù hợp đảo |
| Màu và vật liệu tương thích với camera/renderer chung | Sắc độ phụ để phân biệt đảo; không đổi ánh sáng nhằm che khác biệt chất lượng |

Không cần sao chép đầy đủ hồ, cột, đèn và ba bụi quả lên mọi đảo. Đồng bộ nằm ở cách dựng và chất liệu, không ở việc lặp lại bố cục Vườn Gió.

## 2. Màu sắc và độ sáng

Mã màu dưới đây là **màu đầu vào sRGB**, được chuyển sang linear trong generator, còn chịu vertex shading/texture/ánh sáng. Không lấy screenshot làm albedo hoặc áp một mã hex lên mọi vật liệu.

| Vai trò | Mốc Vườn Gió |
|---|---|
| Lá tối / giữa / sáng | `#295137` / `#558e3c` / `#8eb757` |
| Bạch dương tối / sáng | `#386047` / `#97bb65` |
| Cỏ gốc / giữa / ngọn / xanh mát | `#365f30` / `#5a923f` / `#8cba55` / `#42774f` |
| Nền xanh / đất | `#578a3d` / `#b7a284`, có phối màu và giảm sáng theo vùng mọc |
| Vỏ cây | `#736457`, bạch dương xám ấm, không trắng trơn |
| Màu hoa điểm nhấn | kem `#fff4ce`, vàng `#e9bd4b`, hồng `#d890bd`, tím `#9986be`; từng loài có palette riêng |
| Đèn chiếu / kính ban ngày / phát sáng | `#ffcc75` / `#e3a34b` / `#ff9c32` |

Thân đảo dùng texture khoáng Mạch Nguồn và phối xám ấm–nâu đất trong `landform_assets.py`; không tương đương một ô màu phẳng. Đá rời/tàn tích dùng bước trung hòa nhẹ rồi nhân linear `.94` ở `pebble_tone`; bản `.80` đã bị đánh giá quá tối. Đường đá v16 được giữ màu nguyên bản, không qua bước này.

Xanh phải có sức sống và phân biệt được lá/cỏ với mặt đất. Tránh ngọn bạc, nền cỏ nhạt hòa thành một khối, sắc neon, hoặc đá tối đến mức mất chi tiết. Đánh giá cùng ánh sáng ngày/chiều và đêm.

## 3. Thân đảo, mép và đá bay

- Đảo chính có một thân đá liên tục, gồ ghề ở quy mô vừa, mặt gãy lệch và lớp khoáng đọc được; không gắn các cục đá đều nhau lên một cục đất trơn.
- Vai đảo cong liền từ mặt cỏ xuống vách. Màu chuyển dần, normal nối phù hợp; không vòng viền cắt phẳng, bậc be hay hình răng cưa lỗi.
- Mức vân và normal phải giữ cùng tỉ lệ thế giới giữa đảo lớn, đảo nhỏ và chi tiết. UV phải có hướng hợp lý; không kéo cả texture thành vài sọc khổng lồ.
- Đá bay là khối/phiến/góc vỡ bất quy tắc có mặt lớn, cạnh mòn vừa phải; tránh đá quý đối xứng, viên gạch hoặc đường cắt thẳng chia đôi khối.
- Đảo nhỏ khác nhau thật về độ dài/rộng/sâu, bất đối xứng và cách trồng cây. Không chỉ scale lại cùng một đảo.

**Riêng Vườn Gió:** giữ hình dáng/đáy và mép v15, đảo nhỏ/đá bay v16; chủ sở hữu nhiều lần yêu cầu không đổi đáy. Quyết định này không bắt mọi đảo mới có cùng đáy; đảo mới phải được duyệt silhouette riêng.

## 4. Cỏ, cây, hoa và quả

**Cỏ:** lá mảnh cong, ngọn thuôn, chân tối hơn; cao thấp theo các mảng rộng và bụi nhỏ bên trong mảng. Có vùng thấp cạnh lối đi, vùng cao được chọn; vẫn đọc được mặt đất, hoa và đường đi. Mẫu Vườn Gió có ba vùng cao và đã tỉa khoảng 25% so với mật độ cũ; không tiếp tục giảm thêm 25% mỗi lần sao sang đảo khác. Số lá 28.575 và p10/p90 chiều cao `.105/.663` chỉ là mốc mẫu ở đơn vị hiện tại.

**Tán:** khối tán phân nhánh, bất đối xứng, có khe nhìn xuyên và lá phá silhouette; màu theo cấu trúc khối, không ngẫu nhiên từng lá. Thân có gốc loe, rãnh vỏ, mắt và cành nối; bạch dương không được thành các cọc trắng lạc tông. Cây phải mọc trên mặt đất thực.

**Dẫn xuất cho núi hậu cảnh (owner, 13/11/2026):** lấy cây đảo bay làm gốc và giảm dung lượng vừa phải, nhưng vẫn phải giống cây có lá bình thường: lá riêng lẻ, khe tán, dáng thân cong/nghiêng. Owner đã bác tán gom thành khối đặc/đa diện và tán quá thưa. Bản núi V3 giữ nguyên hình lá 9 đỉnh/8 mặt của kit; tối ưu bằng giảm số lá có tổ chức theo cụm nhánh, bỏ cành li ti và dùng chung mesh. Mức xa giảm hơn nhưng giữ chất lá. Không bê nguyên geometry cây cận cảnh lên mỗi núi. Giữ mật độ hợp quy mô và gốc bám đá; kit đảo bay nguyên bản phục vụ đảo cận cảnh.

**Bố trí cây núi (owner sửa tiếp 13/11/2026):** ít cây chính hơn nhưng cây lớn, thân cong/nghiêng đa dạng, tán đủ dày; không giảm lá thành tán nhìn xuyên quá mạnh. Cây thân gỗ chỉ ở đỉnh/thềm có mặt bám rễ. Vách đứng dùng asset phù hợp như dây leo/cây bám ôm sát đá, không cắm cây gỗ lớn vào thân núi. Rêu chỉ loang nhẹ từ đỉnh xuống vách; xám khoáng thêm nhẹ để vẫn giữ bảng màu dịu.

**Chất cây núi (phản hồi V3):** owner vẫn thấy lá và dây leo giả, thân chưa đủ uốn. Tránh phóng lá lớn thành phiến để bù số lá đã bỏ. Giữ tán đầy bằng cụm nhánh có chiều sâu; uốn cả thân/cành nhiều đoạn và biến đổi normal theo. Dây leo phải có nhánh con nối từ nhánh mẹ, cuống/nếp lá, góc/cỡ/nhịp dày–thưa thay đổi; không xếp lá đều như dây trang trí. V4 là candidate thử hướng này, chưa phải mẫu mỹ thuật đã được owner duyệt.

**Đa dạng núi (owner, lượt V5 13/11/2026):** chất cây V4 được đánh giá tốt hơn; mỗi núi cần hệ cây riêng, có thể xen bụi, mảng rêu/xám hoặc công trình nhỏ. Biến thiên cả dáng tán/thân, số lượng, cỡ và vị trí; không chỉ xoay một cây cho mọi núi. **Làm rõ cuối cùng: giữ trụ đá gồ ghề, mặt đỉnh cao thấp có mặt gãy, chỉ mòn/bo nhẹ ở mép.** Owner đã bác cả chóp quá nhọn lẫn đầu tròn vo dạng vòm; không diễn giải “bo” thành làm tròn toàn bộ đầu trụ. Chừa thềm đủ rộng cho cây/công trình, giữ vách đứng cho ivy/cây bám. Công trình là điểm nhấn chọn lọc, không bắt buộc có trên mọi mẫu.

**Hoa:** lấy độ rõ cấu trúc của cúc làm mức tham chiếu: cánh tách, nhụy vừa, có cuống/lá, khác dáng giữa các loài. Không tạo cánh trắng thành đĩa với nhụy to như trứng chiên. Không phản quang bóng nhựa. Hoa mọc thành vùng có khoảng nghỉ, không rải cầu vồng đồng đều.

**Quả dại:** cụm dâu tằm kết hạt, quả xanh, chùm nho nằm trong bụi thấp, cành lá đan xen; quả hé ra thành điểm màu. Không dựng từng cây cherry riêng với quả rải trên đầu cọc. Vị trí và loài có thể đổi, mật độ nhấn nên ít hơn khối lá.

## 5. Dây leo, cây bám và rêu

**Núi V6 (owner, 13/11/2026):** dáng V5 đã được duyệt. Tăng nhẹ độ rõ vệt rêu; bổ sung dương xỉ ở khe/gờ, rễ từ gốc cây ôm mép đá, địa y xám xanh khi nhìn gần. Chừa khoảng đá trống, không phủ trang trí đều. Ít đá rời theo cụm, đa dạng phiến dẹt/tảng bè/mảnh gãy có mặt rộng và mép mòn; tránh spam đá vụn. Núi gần chỉ cảnh quan tự nhiên; công trình nhỏ/tàn tích đặt ở núi trung. V6 có thêm Khe Rêu/Bàn Thạch (gần), Cổng Mây/Dốc Vân (trung), đang chờ duyệt mỹ thuật; không coi candidate này là đã được owner chấp nhận.

- Dây leo có thân gỗ lớn xen nhánh nhỏ, taper, nhánh con nối nhánh mẹ, nhiều độ dài. Lá có cuống và nếp; độ dày giảm về đầu dây. Đường dây theo bề mặt đá thực.
- Cây bám là các cụm dương xỉ nhỏ mọc từ hốc, gốc tiếp xúc vách; không mọc lơ lửng hoặc xuyên mặt đá khi hướng lên.
- **Rêu đã duyệt là mảng xanh lá nhẹ, loang trực tiếp trên vách**, theo vùng ẩm/hốc, để vẫn thấy vân đá. Không hạt rêu nổi như hòn sỏi xanh, không phủ xanh toàn bộ đáy hoặc cắt đường ranh rõ.

## 6. Tàn tích và đường đi

Tàn tích cần đọc được thiết kế ban đầu: đế, thân, đầu cột/vòm, tỷ lệ các bộ phận; sau đó mới thêm sụp đổ, mặt gãy, mảnh rơi, mòn và cây mọc. Bụi/hoa văn không thay được cấu trúc cũ.

Ngôn ngữ fantasy đã duyệt ở cột: thân có mặt/rãnh, đai đan, phù điêu lá và cuống cong; đầu cột loe có lá acanthus, cuốn xoắn và mũ; đế thấp và mảnh rơi đi cùng. Các phần cùng một họ kiến trúc, có vẻ được tạc trong đá. Nếu làm cột đổ, thân phải nằm sát nền và mảnh rơi có hướng hợp lý; không chỉ đứng thẳng rồi cắt ngọn.

**Vườn Gió giữ đúng 24 phiến đá đường đi v16.** Cả gạch rời lẫn hai hàng gạch phẳng thử ở v17 đã bị bác. Các đảo mới ưu tiên lối đi đất với đá mòn chìm nhẹ, theo cùng chất liệu. Nếu brief thực sự cần đường gạch/đường đô thị, làm thử và duyệt riêng; không coi gạch v17 là mẫu.

## 7. Nước và thác

Lòng hồ có hình học độ sâu, bờ chuyển mềm và đá chìm; nước nông đọc được đáy, vùng sâu đậm hơn. Suối gắn với hồ và mép thác, không hở khe. Phản xạ/gợn mềm, không tấm kính phủ màu hoặc sọc glitter đều.

Thác gồm: cửa đổ chuyển từ ngang sang dọc → lớp nước trong với nhịp nhanh dần → vùng trộn khí/tách tia → giọt dài, giọt nhỏ và sương loãng tan. Các lớp phải cùng hướng chuyển động, có biến thiên và nhạt dần, không kết thúc đột ngột. Thác rơi vào trời không có vòng sóng va chạm; nếu đảo khác có hồ hứng thật, hiệu ứng va chạm phải theo brief và địa hình đó.

Ở góc gần thấy cấu trúc dòng; góc xa vẫn thấy thác chảy. Đêm giảm sáng mặt nước và bụi nước cùng môi trường. Các con số particle v18 là mẫu, không phải yêu cầu nhân nguyên số cho mọi thác.

## 8. Đèn, đêm và chuyển động

Đèn fantasy thấp, lồng lớn tám cạnh, đế/trụ đủ chắc, mái phân tầng, gân/đai/giằng có cấu trúc. Vườn Gió đặt đèn ở phía đối diện lối đi, gần khu trung tâm. Ánh vàng tỏa rộng nhẹ, kính vàng cam khi phát sáng; không trắng cháy hoặc hotspot gắt dưới chân.

Đêm có ánh trăng mát để đọc cây/đá, một vùng ấm dẫn mắt. Đom đóm ít, chớp chậm, bay gần đèn và bụi rậm; chỉ hiện ban đêm. Gió/cỏ/hoa, dòng nước, giọt/sương và đom đóm dùng nhịp nhẹ, có dừng chuyển động; tôn trọng reduced motion. Không tự thêm nhấp nháy hoặc quay đảo liên tục.

## 9. Những hướng đã loại và kiểm tra bắt buộc

Không quay lại: cỏ nhạt/mờ hoặc quá đều; lá/hoa bóng; tán nấm; thân cây trắng/trơn; rêu dạng hạt; bụi quả thành cây riêng; đá tối nặng; đá bay như gạch/đá quý; thân đảo cục đất trơn; mép cắt cứng; cột gãy vẫn đứng; đường gạch v17; đèn cao/nhỏ hoặc chói trắng; thác như màn sọc có ít chấm nước.

Đọc cùng [checklist nghiệm thu](BUILD-AND-QA.md). Một ảnh tổng thể đẹp chưa đủ: kiểm cận, mặt sau, mép, đáy, nước, ngày/đêm, cùng camera và trạng thái chuyển động.

## Nguồn tham khảo và giới hạn nhận định

- [Pounce Light — Tiny Glade](https://pouncelight.games/tiny-glade/) và [ảnh nền chính thức](https://pouncelight.games/tiny-glade/background.png): tham khảo nhịp khối, chất lá/hoa, ánh sáng.
- [Steam](https://store.steampowered.com/app/2198150/Tiny_Glade/): công trình thích ứng, gạch/đá/ván, cây leo và chuyển động môi trường.
- [Thông tin kỹ thuật của nhà phát triển](https://pouncelight.games/tiny-glade/info): nguồn nền tảng; không suy ra đã tái tạo renderer của họ. Video liên kết ở đó chưa được phân tích trong nghiên cứu này.
- Mạch Nguồn là nguồn của chủ sở hữu cho relief và map khoáng; giữ nguyên file gốc, hash trong [reference-v18.json](reference-v18.json). Không có mesh/texture lấy từ Tiny Glade trong asset xuất.
