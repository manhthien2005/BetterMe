# Nghiên cứu asset cầu thang học viện — 2026-11-11

## Trạng thái và phạm vi

Chủ dự án yêu cầu nghiên cứu thêm asset trước khi hoàn thiện cầu thang.
Đây là kết quả khảo sát và hướng thiết kế đề xuất, **chưa phải thiết kế đã được
chủ dự án duyệt hoặc asset đã triển khai**. Nguồn sự thật về bố cục vẫn là
`docs/superpowers/specs/2026-11-11-plaza-academy-study.md`; giữ các sửa nền trong
`docs/superpowers/specs/2026-11-11-plaza-ground-refinement.md`.

Đọc trang sản phẩm, định dạng và xem hình trình diễn trực tiếp trong browser.
Không mua, tải model, import vào game hoặc thay đổi scene trong lượt nghiên cứu.
Ảnh chụp nguồn và bảng tham khảo nằm ở `output/playwright/plaza-stair-research/`
(local/ignored). Không đưa ảnh tham khảo thương mại thành texture của sản phẩm.

## Những gì đang có

- `academy-stair`: từ (-25,21), Y0 đến (-25,9), Y4; rộng 7 m, dài 12 m.
- Hai vế thang, mỗi vế tăng 2 m trên chiều dài 5 m; chiếu nghỉ 2 m ở Y2.
- 20 lần tăng cao 0.2 m, bước chạy 0.5 m theo sampler hiện tại. Đây là tỉ lệ
  của cảnh game đã duyệt, không phải khuyến nghị tiêu chuẩn xây dựng thực tế.
- Nền đã khép kín và khớp sampler; cần giữ mặt tiếp xúc và lối lên/xuống.
- Ảnh `plaza-ground/stair-side.jpg` cho thấy tay vịn gãy khúc ở chiếu nghỉ,
  trụ hộp trơn, mép đá sắc và vật liệu chưa phân biệt rõ mặt bậc với tường hông.
- Code xác nhận: tay vịn nối từng khoảng 0.5 m dựa trên độ cao bậc; trụ xuất hiện
  mỗi 4 khoảng, chưa neo nhịp cột vào hai đầu chiếu nghỉ. Đây là cơ sở để đề xuất
  nhịp lan can theo từng vế thang, thay vì tiếp tục thêm khối trang trí rời.

## Nguồn đã kiểm tra

Thông số dưới đây do trang nguồn công bố; nhận xét phù hợp là đánh giá thiết kế
của agent. Chưa kiểm chứng topology, UV, collider, số polygon hoặc hiệu năng
của bất kỳ model tải về nào. Giá thay đổi theo tier/thuế nên không dùng làm
cam kết mua hàng.

| Nguồn | Điều xác nhận trên trang | Điều học được / mức phù hợp |
|---|---|---|
| [SM1DO — Stylized Japanese Mountain Temple](https://www.fab.com/listings/374b46d0-2de6-4801-9528-2ea4e2d392e5) | Kit 100 assets; Unreal, Blender, FBX; có hàng rào, đường, đèn và cảnh mẫu. Trang hiển thị Standard License. | Ảnh gallery số 2 cho thấy thang đá, lan can thoáng, đèn và cây tạo tuyến lên cao bên thác. Gần ý tưởng plaza nhất về tổng thể; không có bảng số polygon từng module trong phần đã đọc. Blender/FBX là ứng viên chuyển đổi, chưa phải GLB đã kiểm chứng. |
| [Vampawn — Stone Main Stair](https://www.fab.com/listings/8ad2472b-4058-4dd0-b1e7-285e880709a7) | Nhà bán mô tả modular, các bộ phận tách riêng, PBR 4096²; FBX và GLB/glTF chuyển đổi. | Hình rõ nhất để học khối thang liền, gờ hông và mũ tường. Dáng cong mở chân khác footprint đã duyệt; không thay nguyên bộ vào cảnh. Mô tả ghi “Free” nhưng UI mua/tier không xác nhận giá ổn định — không ghi là miễn phí đã xác minh. |
| [AleksandrIvanov — Stylized Japanese Temple](https://www.fab.com/listings/56ca1dbd-0d40-4c70-abdb-5974215ea0c0) | Gói môi trường stylized, định dạng được liệt kê là Unreal Engine; Standard License. | Học cách phân cấp chân cột–thân cột–đầu cột, mảng gỗ rõ và mái gọn. Màu đỏ/cam mạnh hơn palette plaza; tham khảo cách tạo hình, không bê nguyên bảng màu. |
| [Hivemind — Mountain Temple](https://www.fab.com/listings/b50950cd-12c9-4a31-b083-dc7e1f4174c8) | Có stone steps/pathways, layered materials, vertex painting; Unreal; khuyến nghị Nanite/Lumen/tessellation/displacement. | Ảnh thang cho thấy mòn mép và cây bám ở rìa. Mức phong hóa và cách render thiên hiện thực, không phù hợp nhập thẳng vào web stylized. Chỉ học cách đặt dấu vết sử dụng có chọn lọc. |
| [Pingo — Stairs Stone](https://www.fab.com/listings/4d4bffa9-5c76-419a-be79-bd71a8da672b) | UI hiển thị Free, Standard License; Blender, GLB/glTF chuyển đổi; zip 1.91 MB; tác giả mô tả texture 1024 và có thể giảm 512. | Ứng viên nhẹ để thử import sau này. Chỉ có bậc đá đơn giản; không giải quyết bộ lan can, trụ và chiếu nghỉ mong muốn. 1.91 MB là kích thước zip trên listing, không phải VRAM hoặc payload runtime. Ảnh lớn viewer không tải, chỉ thumbnail và mô tả được xem. |
| [Quixel — Castle Stairs](https://www.fab.com/listings/bb6f516f-48b5-4343-8884-1c300330ff95) | 1.14 × 1.31 × 0.64 m; **open mesh**; FBX, glTF và GLB chuyển đổi. | Thấy rõ mép mòn, rêu ở khe và thay đổi bề mặt. Không dùng khối này làm nền kín thay cho foundation vừa sửa. Thang mục nát/photoreal không hợp học viện được chăm sóc. |
| [Kenney — Castle Kit](https://kenney.nl/assets/castle-kit) | 75 files; Creative Commons CC0. | Cách chia bộ lắp ghép rõ, có thể dùng cho blockout. Hình khối đơn giản và ngôn ngữ lâu đài châu Âu không nâng chất lượng cầu thang hiện tại lên đúng mục tiêu. |
| [Taiyuin, Nikko — Japan-guide](https://www.japan-guide.com/e/e3802.html) | Bài giới thiệu quần thể với nhiều cổng và sân nối nhau; ảnh Nitenmon và kiến trúc quanh sân. | Tham khảo trình tự tiếp cận và tương phản khối đá nặng–cấu kiện gỗ thanh. Đây là ảnh công trình để nghiên cứu, không phải asset được cấp phép cho game. |

[Fab Standard License](https://www.fab.com/eula) có tóm tắt cho phép dùng thương mại,
chỉnh sửa và dùng với công cụ tương thích ngoài Unreal; Personal/Professional
có cùng phạm vi quyền. Điều đó **không** biến shader/Blueprint Unreal thành
shader Three.js, và không cấp quyền phát lại model như một bộ asset độc lập.
Nếu chọn nhập model, kiểm tra license/tier của đúng listing và lưu provenance
tại thời điểm lấy asset. Không lấy lời quảng cáo của nhà bán thay EULA.

Giới hạn tìm kiếm: Google/DuckDuckGo/Brave gặp challenge; Bing trả kết quả lạc
đề nên không dùng. Đã chuyển sang tìm trực tiếp trên Fab và đọc nguồn cụ thể.
Trang Inazuma trên Fandom bị challenge; đường wiki.gg thử trả 404. Không coi
hai trang đó là nguồn đã xem. Inazuma vẫn là hướng tham khảo do chủ dự án đã
chọn trong brief, không phải kết quả mới được xác minh ở lượt này.

## Ba cách thực hiện

1. **Nhập cả kit môi trường:** nhiều chi tiết sẵn, nhưng phải đổi vật liệu,
   tối ưu và sửa tỉ lệ để khớp thang. Phạm vi lớn hơn một hạng mục.
2. **Nhập một cầu thang có sẵn:** có thể thử nhanh, nhưng các mẫu khảo sát thiếu
   lan can phù hợp hoặc sai footprint/chiếu nghỉ. Dễ phải dựng lại phần chính.
3. **Dựng bộ module riêng theo kích thước đã chốt — đề xuất:** dùng kiến thức
   từ các nguồn trên để hoàn thiện bậc, gờ, trụ và lan can thành một bộ thống
   nhất. Tốn công tạo mesh nhưng kiểm soát được diện mạo, mối nối và tiếp xúc.

Hướng đề xuất là **đá kem ấm + gỗ nâu + nắp kim loại xanh xám mờ**, gợi học
viện trên núi, có trọng lượng ở chân thang và độ thoáng ở tầm mắt. Chi tiết
nên tập trung vào silhouette, mép bắt sáng và mối nối; các vết xước rất nhỏ
không bù được một tay vịn gãy khúc hoặc chân cột không có điểm tựa.

## Bộ chi tiết dự kiến

| Bộ phận | Đề xuất tạo hình |
|---|---|
| Bậc đá | Mép vát nhẹ 1–2 cm; mạch ghép thưa, lệch nhau giữa các hàng. Giữ độ cao mặt đi; tránh phủ thêm tấm làm tăng bậc cuối. |
| Tường hông và gờ đá | Chân đế, thân xây và mũ tường đọc thành ba lớp; gờ dốc liền theo mỗi vế, ngang ở chiếu nghỉ. Tường hông tối hơn mặt bậc vừa đủ. |
| Trụ đầu/cuối | Chân đá có vai vát, thân gỗ chắc, nắp chụp xanh xám thấp; trụ đầu lớn hơn trụ lặp. Có thể dùng một dải kim loại ấm rất nhỏ tại mối nối. |
| Trụ lặp | Nhịp theo chiều dài 0, 2.5, 5, 7, 9.5, 12 m; 6 trụ mỗi bên, đặt đúng đầu/cuối chiếu nghỉ. Kích thước cụ thể kiểm tra với cây/bồn và hành lang đi. |
| Lan can dốc | Tay vịn liền từng vế, thanh dưới và thanh đứng thưa; tiết diện có cạnh vát. Tính đường dốc liên tục riêng, chân trụ mới lấy cao độ bậc. |
| Lan can chiếu nghỉ | Đoạn ngang 2 m; mối nối dốc–ngang khép tại trụ, không tạo chỗ võng. Cao tay vịn đề xuất khoảng 1 m, kiểm tra từ mắt avatar. |
| Chiếu nghỉ | Viền đá đồng bộ, thay nhịp lát để người chơi cảm thấy đã tới một điểm dừng. Giữ lối giữa thoáng, không thêm vật chắn vào đây. |
| Ánh sáng và dấu vết sử dụng | Cặp đèn ở chân hoặc đầu thang như điểm nhấn; hoàn thiện sau phần thang. Bẩn/rêu nhẹ ở chân tường và góc khuất, không phủ đều mặt đi. |

Không phải mọi chi tiết đều cần một file/model riêng. Có thể dùng chung mesh
và ghép batch; các mục trên là nhóm tạo hình cần hoàn thiện, không yêu cầu xây
một hệ thống kitbash tổng quát. Các con số mới là đề xuất của agent.

## Điều kiện cho lượt dựng tiếp theo

- Làm hoàn chỉnh **academy-stair** trước; chưa nhân bộ chi tiết ra cả plaza.
- Giữ 7 × 12 m, Y0→4, chiếu nghỉ Y2, nền kín, các lối nối và cây/bồn hiện có.
- Rà chân trụ/gờ ngoài footprint với nền đỡ; trang trí không lấn ba làn đi
  đang được test. Chiếu nghỉ và bậc cuối không bị chồng mặt/z-fighting.
- Ưu tiên mesh có cạnh vát, normal đúng và màu vật liệu có phân cấp. Pipeline
  study hiện xóa UV để merge; một asset FBX/GLB có texture không thể ghép vào
  đường code đó mà mặc nhiên giữ đúng diện mạo. Không thêm loader/framework
  chỉ để xử lý một thang nếu mesh hiện tại đáp ứng được.
- Mục tiêu ban đầu: tăng ròng không quá khoảng 4,000 triangles, giữ tổng
  study dưới cap 65,000 và ưu tiên 7 material batches hiện có (baseline
  58,846). Đây là ngân sách đề xuất cần đo, không phải kết quả đạt được.
- Xem front, side, top landing và góc chơi; ngày/chiều/đêm, desktop/mobile.
  Lan can không che view; mép sáng không lấp lánh ở xa; ban đêm vẫn đọc được
  bậc. Đi cả hai chiều/ba làn, camera sát lan can, portal lifecycle.
- Viết spec/plan ngắn cho hạng mục sau khi chốt hướng; kiểm tra geometry và
  các gate của repo khi triển khai. Không commit/push khi chưa được yêu cầu.

## Kiểm tra lượt nghiên cứu

Tự rà nguồn/ảnh và đối chiếu tỉ lệ với `plaza-study-terrain.ts`, nhịp lan can
với `plaza-study-geometry.ts`. Không sửa runtime; không chạy lại bốn gate và
không dùng kết quả 774 tests của lượt trước làm bằng chứng cho một asset mới.
