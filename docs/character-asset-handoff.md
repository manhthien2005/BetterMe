# Bàn giao model nhân vật Reading Quest

Ngày 2026-11-11. Phạm vi chuyển động player theo [thiết kế đã duyệt](superpowers/specs/2026-11-10-character-motion-asset-later-design.md).
Chuyển động player đã được nghiệm thu tại `2e07a39`; NPC được mở rộng theo
[thiết kế hành vi riêng](superpowers/specs/2026-11-10-npc-personality-design.md). Hướng ngoại hình là
[học viện phù thủy fantasy anime](superpowers/specs/2026-11-10-academy-character-art-design.md),
lấy cảm hứng từ không khí trường phép thuật Harry Potter: áo choàng, đồng phục,
sách phép, tỷ lệ và nét mặt anime trưởng thành vừa phải.

## Hiện có

Player dùng `academy-scholar-v1.vrm`, bản nữ tinh chỉnh được chủ sở hữu duyệt
ngày 2026-11-11: cổ gọn, vai/tay liền hơn và huy hiệu bạc dưới tóc. Hash hiện tại
`8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f`;
67.380 tam giác. Hai sampler huy hiệu dùng mipmap để nét không bị đứt khi nhìn
xa; toàn bộ bytes hình học, texture, mặt/tóc/rig và chuyển động giữ nguyên; xem
[nguồn, cách tái tạo và giới hạn fitting](academy-character-assets.md).
Ba NPC dùng `academy-an-v1.vrm`, `academy-khoa-v1.vrm`, `academy-minh-v1.vrm`:
An áo xanh rêu có lớp vai; Khoa dùng chân dung đã duyệt (tóc than, mắt xanh,
kính tròn) và áo choàng dài không mũ, lớp lót đỏ rượu, áo len xám, huy hiệu
sách/ngôi sao; Minh nâu ấm có kính/dải cổ. Rig/quyền nguồn được giữ.
Khoa hiện có hash `ce7e1f46ced9613082cc4f1cd24c1e9f87618062fb14de35b7dc94e3f1b9c483`.
Áo này dùng cho NPC đứng/xoay/cử chỉ; giới hạn xuyên chân khi ép chạy của bản
preview vẫn còn. Sau khi Khoa được duyệt trong game, An/Minh được tinh chỉnh
cổ áo, cổ V, viền tay và huy hiệu sách/ngôi sao cùng hệ rồi tích hợp local.
Giữ mặt/tóc/phụ kiện/rig và chiều dài trang phục; player/Khoa không đổi.
An: `0b02133a385983dc88fbc2d618a0b558f514f981b3980e7f53a76d7d7fb6210d`
(63.612 tam giác); Minh:
`346976316274c1f48be2383864b77f9157e259cacaaa47486f631c97246c8ee0`
(57.636 tam giác). [Kế hoạch và bằng chứng kiểm tra](superpowers/plans/2026-11-11-an-minh-refinement.md).
Sample `scholar-vrm1.vrm` còn nguyên để đối chiếu và làm fallback cho slot lạ.
Player có đi/chạy/nhảy/tiếp đất, tay/ngón tay và chỉnh tiếp xúc chân trên sàn phẳng.
NPC nhận biết người tới gần, chào theo vai trò, diễn đạt khi đổi dòng và tạm biệt
khi đóng. Idle có cử chỉ riêng: An nhìn quanh/vẫy nhẹ, Khoa chỉnh tay áo, Minh chỉnh
kính. Giảm chuyển động bỏ cử chỉ lớn. Minh giữ sách bằng tay trái; chưa lật trang.
Đi/chạy và lớp chuyển động nhảy dùng clip authored CC0 đã chuyển đổi từ Quaternius;
xem [nguồn và điều chỉnh clip](locomotion-assets.md). Chưa có âm thanh hay lip-sync.

Chủ sở hữu đã duyệt player/Khoa và chấp nhận vòng ngoại hình An/Minh hiện tại
qua phản hồi “Ok. Tốt rồi”. Khi đổi mặt/tóc/tỷ lệ hoặc trang phục tiếp tục kiểm tra lại;
ảnh PNG/JPG chỉ là tham chiếu, không thay model 3D.

## Gói asset cần chuẩn bị

- File **VRM 1.0 humanoid**, gồm mesh đã skin, rig/rest pose hợp lệ, vật liệu và
  texture đóng gói trong file. Không phụ thuộc texture ở một URL ngoài.
- Xương bàn tay/ngón tay và toe bones nếu muốn giữ chuyển động chi tiết tương ứng.
  Thiếu xương tùy chọn sẽ giảm khả năng; loader báo danh sách capability thực tế.
- Biểu cảm `blink`, `happy`, `relaxed`; `surprised` cho nhảy nếu phù hợp.
  Loader chỉ áp biểu cảm có thật. Biểu cảm tùy tên cần ánh xạ khi tích hợp.
  Viseme chưa cần ở round này.
- Springbone/constraints cho tóc và trang phục nếu asset cần chuyển động phụ.
  Quy tắc tuning theo tên xương hiện tại dành cho model mẫu; phải kiểm tra lại khi
  thay model, không tự xem đó là chuẩn của mọi nhân vật.
- Tác giả, URL nguồn, giấy phép và bằng chứng quyền dùng/phân phối qua web.
  Không sửa metadata để lách kiểm tra quyền. Kiểm tra runtime không thay cho việc
  đọc điều khoản nguồn và mục đích sử dụng thực tế.
- Chiều cao mong muốn, độ dày/offset đế giày, ảnh trước/bên/sau và file nguồn chỉnh
  sửa nếu có. Những dữ liệu này dùng để căn chiều cao, bàn chân, tay cầm sách và áo.

GLB tĩnh, FBX hoặc ảnh concept không mặc nhiên thay trực tiếp cho VRM; cần đánh giá,
chuyển đổi và kiểm tra rig riêng khi chọn các định dạng đó.

## Những chỗ đổi model

1. Đặt file đã kiểm quyền trong `public/models/characters/`.
2. Thêm entry vào `CHARACTER_ASSET_MANIFEST` tại
   `src/lib/world/character-assets.ts`, gồm nguồn, quyền sử dụng và số đo thực của
   file. Cập nhật `public/models/characters/manifest.json` tương ứng; bài test
   `character-v03.test.ts` kiểm manifest và tính toàn vẹn của model mặc định.
3. Đổi `defaultCharacterId` cho player. Đổi các ID trong `NPC_CHARACTER_ASSET_IDS`
   cho NPC theo bảng dưới. Đây là chỗ cấu hình hiện có, không cần sửa hội thoại
   hoặc thêm đường ghi xương thứ hai.
4. Khi thay sample mặc định, cập nhật fixture/test nếu số đo, rig hoặc quyền của
   sample cũ không còn áp dụng. Không giảm ngưỡng kiểm tra chỉ để test xanh.

| Nhân vật | Slot / cấu hình | Model hiện tại |
| --- | --- | --- |
| Player | `defaultCharacterId` | `academy-scholar-v1` (outfit fitting) |
| Học giả An | `character.npc.guide_an` | `academy-an-v1` |
| Quản sự Khoa | `character.npc.steward_khoa` | `academy-khoa-v1` (nam, kính, menswear) |
| Thủ thư Minh | `character.npc.librarian_minh` | `academy-minh-v1` |

`NpcActor` và player đều dùng `CharacterAvatar` → `loadCharacterVrm` →
`applyPoseToVrm`. Mỗi actor sở hữu rig, lịch sử pose và điểm tựa chân riêng.
Đổi URL tạo lại chủ sở hữu; nạp lỗi hiện avatar dự phòng. Hủy actor giải phóng
tài nguyên của chính instance đó.

## Căn chỉnh khi tích hợp

- Giữ physics/collider và tốc độ điều khiển đã duyệt. Đi/chạy authored dùng nhịp
  từ tốc độ thực, độ dài sải trong clip và tỷ lệ rig tại `character-locomotion.ts`.
  Các giá trị hạ hông/nhịp cố định của nhánh procedural là fallback, không phải
  chuẩn căn model mới. `animation-state-machine.ts` cung cấp trạng thái và intent;
  kiểm lại cả clip và fallback trên tỷ lệ chân mới.
- `vrm-foot-contact.ts` đo chiều dài chân và độ cao mắt cá ở rest pose; đế giày
  hiện dựa trên hình học sample, chưa có slider offset chung cho mọi model.
  Kiểm chân sau cập nhật VRM trên cả mesh/đế giày và raw bones. Bộ chỉnh chỉ hỗ trợ
  mặt phẳng `y=0`, không phải hệ leo bậc hay bám dốc.
- Kiểm tay trái Minh với vị trí/góc sách trong `character-avatar.tsx`; pose riêng
  của từng NPC nằm ở `npc-pose.ts`, thời gian/trạng thái ở `npc-motion.ts`.
  Không thêm lật trang nếu chưa có asset trang.
- Kiểm idle, walk, run, stop, đổi hướng, jump/fall/land; mở/đổi dòng/đóng và rời
  hội thoại; teleport/đổi map/quay lại tab; camera sát; chế độ giảm chuyển động.
- Chạy test rig 30/60/120 Hz và frame stall. Mục tiêu drift ≤5 cm chỉ áp dụng pha
  đặt chân ổn định khi đi/chạy thẳng trên sàn; không diễn giải thành bảo đảm cho
  mọi model, mọi đoạn chuyển trạng thái hoặc mọi địa hình.
- Đo lại tải, p95/p99, khung hình >50 ms và bộ nhớ khi nhiều actor cùng xuất hiện.
  Duyệt trên thiết bị thật trước khi cam kết hiệu năng mobile.

## Nguồn model mẫu và giới hạn

Sample: **VRM1_Constraint_Twist_Sample**, tác giả **pixiv Inc.**, © 2022 pixiv Inc.
[Nguồn](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample),
[VRM Public License 1.0](https://vrm.dev/licenses/1.0/).
Manifest hiện ghi `everyone`, cho phép phân phối lại/chỉnh sửa, sử dụng thương mại
và không bắt buộc ghi công; đây là dữ liệu của sample, không áp cho asset mới.

File 10.776.032 byte; 36.470 tam giác, 13 primitive, 54 humanoid bones và 18 biểu
cảm. Không nên nhân các số này thành ngân sách mặc định cho từng NPC. Số đo
runtime và kiểm tra của round này được ghi ở
[báo cáo xác minh](character-motion-verification.md).
