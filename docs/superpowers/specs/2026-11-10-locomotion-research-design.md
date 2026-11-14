# Locomotion: research và hướng sửa sau trải nghiệm thực

Ngày 2026-11-10. Owner thấy idle ban đầu ổn, nhưng sau walk chân đứng kẹt trong
dáng bước; walk/run còn cứng. Yêu cầu ưu tiên học từ triển khai thực tế.

**Trạng thái:** lỗi giữ chân đã tái hiện, sửa và kiểm focused/browser. Owner đã
duyệt phạm vi mới: “Cho phép dùng clip miễn phí phù hợp”. Cho phép này mở giới hạn
asset của round trước riêng cho locomotion, không đổi model hoặc dùng dịch vụ trả
phí. Nghiệm thu cảm giác chuyển động vẫn cần chơi thử sau khi tích hợp.

## 1. Bằng chứng lỗi hiện tại

Sau khi giữ A 1,1 giây rồi thả, telemetry cho biết `animationState=idle`,
`blendProgress=1`, root đứng yên. Sau 3 giây raw feet vẫn lệch trước/sau khoảng
0,6 m tổng cộng. Đây là lỗi pose cuối, không phải state machine không đổi state.

`decorateCharacterPose` báo hai chân contact khi idle. `createVrmFootContact`
giữ `leg.anchor` khi contact còn true, nên điểm tựa bước cuối tồn tại qua idle.
IK ghi đè chuyển động trở về đứng nghỉ; hông lên lại còn kéo mắt cá khỏi mặt đất.

Sửa: chỉ ghim anchor world-space khi có gait; idle/interact không giữ anchor bước
cũ, vẫn chỉnh độ cao sàn và theo pose gốc. Không đổi idle, physics hay tốc độ.
Regression đo raw skeleton sau walk/run ở ba thời điểm dừng, 30/60/120 Hz, trong
hai giây sau khi blend kết thúc; không chỉ assert nhãn `idle`.

Focused: 20 tests / 3 files pass. Browser sau sửa: hai mắt cá y≈0,101 m, trở về
dưới thân; `idle-fixed-after.png`. Trước sửa: y≈0,154–0,182 m và chân còn cách xa;
`idle-stuck-before.png`. Hai ảnh lưu ignored dưới `output/playwright/character-motion/`.

## 2. Các nguồn đã đọc trực tiếp

| Nguồn | Điều học được | Áp dụng / giới hạn |
| --- | --- | --- |
| [Three.js r187 skeletal blending](https://github.com/mrdoob/three.js/blob/r187/examples/webgl_animation_skinning_blending.html) | Dùng clip idle/walk/run qua AnimationMixer, effective weights, crossfade và warping | Học blending/đồng bộ thời gian; không bê thời lượng demo 2,5–5 giây sang điều khiển game. Không suy từ license code thành quyền dùng mọi asset demo. |
| [three-vrm 3.5.5 humanoid animation](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm/examples/humanoidAnimation/main.js) | Ví dụ chính thức tạo mixer, crossfade clip, update mixer trước `vrm.update` | Đúng phiên bản đang dùng. Một đường ghi pose, không để bộ pose hiện tại ghi đè clip sau mixer. |
| [Retarget Mixamo → VRM](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm/examples/humanoidAnimation/loadMixamoAnimation.js) | Rotation cần parent rest world rotation và inverse bone rest rotation; translation scale theo chiều cao hips | Chỉ đổi tên xương là chưa đủ. Với rig khác Mixamo phải kiểm mapping/rest pose/forward axis riêng. Không tự nhận clip đã retarget đẹp. |
| [VRMA loader chính thức](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm-animation/examples/loader-plugin.html) | VRMA → `createVRMAnimationClip` → AnimationMixer; có look-at proxy | VRMA là định dạng trao đổi, không tự tạo chuyển động đẹp. Hiện chưa cài package animation riêng; chưa cần thêm nếu chọn clip glTF được chuyển trước. |
| [Ecctrl state controller](https://github.com/pmndrs/ecctrl/blob/main/src/character/animation/EcctrlAnimationStateController.tsx) | Tách grounded/moving/running/jump state khỏi nguồn animation, chỉ phát thay đổi khi state thay đổi | Học ranh giới controller/animation, không thay controller physics hiện tại hoặc cài cả Ecctrl. Nguồn main không được coi là API phiên bản repo. |

Mẫu số chung là **nguồn chuyển động có chất lượng trước, retarget đúng, blending
đúng sau**. Interpolation chỉ nối pose; nó không sửa được phối hợp tay/chân/thân
thiếu tự nhiên của dữ liệu đầu vào. IK là chỉnh tiếp xúc cuối, không nên thay toàn
bộ quỹ đạo vung chân và cố định bàn chân phẳng ở mọi frame như đường hiện tại.

## 3. Nguồn clip được khảo sát

- **KayKit Adventurers 1.0**: [kho chính thức](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0),
  [LICENSE.txt](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/blob/main/LICENSE.txt).
  README ghi 75 animation; file license ghi CC0, cho dùng cá nhân/giáo dục/thương
  mại. Có glTF/GLB và FBX. Đây là ứng viên có bằng chứng quyền rõ nhất trong lượt
  này, nhưng chưa xem từng walk/run trên rig VRM: chuyển động stylized có thể chưa
  hợp. Chỉ trích clip được chọn; không đưa model/accessory/combat vào sản phẩm.
- **Quaternius Universal Animation Library**: [trang bộ](https://quaternius.com/packs/universalanimationlibrary.html)
  ghi 120+ animation, locomotion tám hướng, jog/sprint và CC0; [trang license chung](https://quaternius.com/license.html)
  hiện ghi QAL v1.0, cấm phân phối lại asset riêng. Hai trang không thống nhất đủ để
  kết luận license của một file chưa nhận. Phải kiểm license trong đúng bản tải
  trước khi dùng hoặc đưa vào repo công khai; chưa nhập file.
- **Mixamo**: bộ retarget chính thức của VRM là tài liệu tốt. Trang FAQ Adobe trả
  HTTP 403 trong lượt này nên không xác minh điều khoản mới; không giả định quyền
  phân phối raw FBX từ những repo/tutorial khác. Không dùng tài khoản cá nhân hay
  tải clip qua tài khoản của owner khi chưa được yêu cầu.

Sau khi được phép nhập clip, đã tìm được bản lưu **UAL Standard 2025-06-10** có
LICENSE CC0 và README ghi rõ ngày phân phối, phù hợp license trên trang bộ của
tác giả. Đã xem nguồn và retarget của `Walk_Loop` / `Jog_Fwd_Loop` rồi chọn hai clip
này. KayKit đã xem nhưng dáng chân ngắn/mang vũ khí không hợp. Pin, hash, bản
license và cách chuyển đổi tại `docs/locomotion-assets.md`; không dùng bản QAL mới.

## 4. Các hướng và đề xuất

1. Tiếp tục tuning các hàm góc tay/chân hiện tại: ít thay đổi nhưng giữ nguồn pose
   đã bị owner đánh giá cứng; dễ lặp vòng chỉnh số mà không có chuẩn để đối chiếu.
2. **Giữ idle đã ổn, thử walk/run authored clip trên VRM hiện tại — đề xuất.**
   Theo pipeline Three/VRM, có nguồn/license và clip gốc làm chuẩn; cần một vòng
   thử chất lượng retarget trước khi thay mặc định. Không cần đổi engine/model.
3. Motion matching/mocap pipeline đầy đủ: cần bộ dữ liệu và ngân sách lớn hơn,
   không giải quyết thiếu source animation bằng việc thêm framework; chưa phù hợp.

Owner đã chọn hướng 2 và cho phép clip miễn phí. Chỉ cần 2 clip walk/run phù hợp
và chuyển về idle tốt, không nhập mọi animation của một pack.

## 5. Thiết kế cho vòng clip nếu được chọn

- Giữ physics/root/collider và idle hiện tại. Dữ liệu tốc độ sau va chạm tiếp tục
  điều khiển locomotion; animation không tự đẩy vị trí nhân vật.
- Xác minh clip gốc trong preview, tên track, rest pose, trục trước, đơn vị, loop
  seam và độ dài bước. Chọn animation đúng nhịp học viện, tránh chạy chiến đấu.
- Retarget rotation qua rest transforms và scale hips đúng tỷ lệ. Chuẩn hóa thành
  in-place: loại root X/Z displacement nhưng giữ chuyển động dọc và xoay thân cần
  thiết. Ghi tác giả, nguồn, license, hash và quá trình chuyển đổi tái tạo được.
- Chỉ một nơi áp pose lên normalized skeleton. Cách lấy mẫu clip và hòa với
  procedural idle/jump/interact được chọn sau phép thử retarget; không vừa chạy
  mixer lên rig thật vừa ghi đè tất cả xương bằng `applyPoseToVrm` như cũ.
- Walk/run giữ pha tương thích khi đổi tốc độ, playback rate theo tốc độ thực.
  Khi dừng, hạ trọng số locomotion, trả chân về idle; không đợi hết một vòng dài
  khiến điều khiển bị trễ. Thử cả dừng giữa swing, giữa stance và đổi hướng nhanh.
- Chỉ dùng chỉnh tiếp xúc có trọng số/giới hạn khi thật cần. Không để IK hiện tại
  tái tạo toàn bộ swing và xóa heel/toe roll, flex gối hay phối hợp thân của clip.
- NPC đứng hội thoại và sách không cần thay ở vòng walk/run. Reduced motion vẫn
  giữ chuyển động di chuyển cần thiết; lỗi tải clip có fallback và chẩn đoán.

## 6. Tiêu chí trước khi đưa lên bản xem thử chính

- So side/front ở cùng tốc độ, camera gần và camera chơi; clip gốc và retarget đều
  phải có video để phân biệt lỗi source với lỗi rig/adapter.
- Sau thả phím, cả nhãn state và raw feet về idle; test nhiều pha dừng và hướng
  quay ở 30/60/120 Hz. Không foot lock tồn dư, bật pose, T-pose hoặc root drift.
- Walk/run loop liên tục, không cứng bàn chân cả pha swing; chuyển walk↔run,
  stop→start, run→jump→land→run không kẹt. Không sửa ngưỡng test để che drift.
- Đánh giá tải/CPU/GPU sau khi gắn clip; clip nhỏ không có nghĩa retarget/mixer
  miễn phí. Test fallback và unmount/reset, chạy bốn gates và self-review.
- Owner nghiệm thu cảm giác bằng chơi thử/video. Tests xanh chỉ chứng minh các
  contract đo được, không thay cho đánh giá chuyển động đẹp.

**Tự review nghiên cứu:** đối chiếu phiên bản Three/VRM, phân biệt code/asset
license, giữ idle/physics, một chủ sở hữu pose, giới hạn IK, source-vs-retarget QA.
Không cài package mới. Clip được chọn sau khi xem nguồn và bản VRM từ trước/bên.
