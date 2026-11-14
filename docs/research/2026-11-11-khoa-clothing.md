# Khoa — nghiên cứu chi tiết và chuyển động trang phục

Ngày 2026-11-11. Chủ sở hữu đã thích và duyệt hướng chân dung Harry-inspired;
yêu cầu tiếp theo là nghiên cứu trang phục chi tiết hơn, mượt khi tương tác.
Đây là kết quả nghiên cứu và đề xuất thực thi, chưa phải trang phục đã sửa.

## Chuẩn giữ lại

- Chân dung `output/research/khoa-harry/khoa-portrait-draft.vrm`, SHA-256
  `db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312`.
  Không thay mắt, tóc, kính, mặt, biểu cảm hoặc tỷ lệ đầu đã được thích.
- Chất anime/toon của player và bộ hiện có; áo navy, lót đỏ rượu, sơ mi ngà,
  gile và quần dài của Khoa. Chỉnh độ hoàn thiện, không đổi thành nhân vật mới.
- Cử chỉ, vai trò, camera và hội thoại hiện có. Chuyển động cơ thể đã được duyệt.
- Ảnh chủ sở hữu `output/research/academy-character/owner-reference-01..03.png`
  là tham chiếu phân lớp: áo ngoài, gile, sơ mi/cà vạt, cửa tay và viền áo.

## Nguồn đã đọc

1. [Warner Bros. Studio Tour — Costumes](https://www.wbstudiotour.co.uk/explore-the-tour/costumes/).
   Nguồn chính thức về trang phục phim: robe Quidditch từng được đổi từ dày sang
   nhẹ hơn phục vụ vận động; bảng màu và phụ kiện hỗ trợ nhận diện nhân vật.
   Chỉ dùng để tham khảo cấu trúc/chức năng trang phục, không coi là hướng render
   anime hoặc bằng chứng cho bộ model cụ thể.
2. [Khronos — glTF Skins](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md).
   Vị trí mesh phụ thuộc joint, weight và inverse bind matrix. Thêm polygon hay
   đổi thời gian animation không tự sửa cách áo gập theo xương.
3. [VRM 1.0 SpringBone](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_springBone-1.0/README.md).
   Hỗ trợ chuyển động phụ tóc/trang phục, inertia, stiffness, drag, gravity và
   collider sphere/capsule. Collider xử lý đầu chuỗi xương; không phải mô phỏng
   tự va chạm toàn bộ tấm vải và không bảo đảm mọi vertex hết xuyên nhau.
4. [VRM 1.0 MToon](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_materials_mtoon-1.0/README.md).
   Có base/shade texture, normal texture, outline và rim. MToon bỏ qua vertex
   colors. Giữ shader này, dùng nếp gấp tiết chế; không thay bằng PBR bóng thực.
5. [three-vrm 3.5.5 — VRMSpringBoneJoint](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm-springbone/src/VRMSpringBoneJoint.ts).
   Đối chiếu đúng phiên bản repo: cập nhật inertia, drag, stiffness, gravity và
   collision đều có sẵn. Không cần cài một engine vải chỉ để thử độ rủ nhẹ.

Bản nguồn đọc được lưu trong `output/research/khoa-clothing/` và
`output/research/khoa-mtoon-source.md`. Kết quả tìm kiếm chưa mở/nguồn shop bị
chuyển hướng không được dùng làm bằng chứng.

## Quan sát trên model thật

Viewer riêng `/cast-review`, loader và cử chỉ hiện có, 1100×1100. Chỉ chặn request
Khoa để nạp chân dung đã duyệt; public assets và manifests không thay đổi.
Đã xem đứng nghỉ, chỉ hướng, mở bàn tay, chỉnh cổ tay, góc bên và sau.

| Vùng | Quan sát / bằng chứng | Hướng xử lý đề xuất |
| --- | --- | --- |
| Cổ và ve áo | Cạnh nhọn, lớp sơ mi–gile–áo ngoài khó đọc, có khoảng hở tại đường cổ/vai | Sửa đường cắt và độ cong; bề dày nhỏ ở cạnh nhìn thấy; khoảng cách lớp nhất quán |
| Vai/nách | Khi chỉnh cổ tay, xuất hiện mảng tối bị cắt gãy gần vai phải của nhân vật | Kiểm giao nhau giữa yoke, thân, tay và ve áo; nối hoặc đặt mép/weight khớp; sửa normal ở mặt cần liền |
| Tay áo | Phom ống khá đều, thiếu nếp nén rõ ở khuỷu và mép cửa tay | Nếp gấp có chủ đích, lưới và weights quanh khuỷu; mép cửa tay khép kín và có độ dày |
| Thân/gấu | Mảng phẳng lớn, ít dấu hiệu vải may, gile và quần dễ nhập màu | Nếp rủ lớn trước; viền may, khuy, túi và phân lớp sau; kiểm ở camera chơi |
| Độ rủ | Các mesh trang phục mới không gán vertex vào spring bone | Chỉ thêm rig phụ cho phần thả tự do sau khi phom và deformation cơ bản đạt |

Đốm tối ở vai là quan sát trực tiếp; nguyên nhân cụ thể giữa giao mesh/culling/
normal cần A/B trong lượt sửa. Không kết luận chỉ từ ảnh rằng mọi đốm đều là xuyên.

`inspect.cjs.txt` đọc file VRM thật, kết quả `skin-report.json`: robe 7.732 tam
giác, lining 7.488, uniform 4.746, role details 5.832; đều `springInfluences: []`.
Trong khi đó loader báo 6 lower-cloth và 4 upper-cloth spring joints vì các chuỗi
của mẫu nguồn còn tồn tại. Số chuỗi tồn tại không chứng minh áo mới đang dùng chúng.

`scripts/academy-menswear.mjs` tạo thân/yoke/tay/ve thành các mặt riêng; sleeve
blend chest→upper arm→lower arm. `part()` trong generator tạo normals riêng,
các UV của vải chỉ tra ramp 256×1 theo tone. Vì vậy họa tiết/đường may vẽ lên
texture sẽ cần UV thật cho phần áo liên quan; tăng độ phân giải ramp không giúp.

`npc-motion.ts` đã blend cử chỉ trong .28 giây. `vrm-loader.ts` có spring substeps
và reset khi stall. Giữ pipeline này; không kéo chậm cử chỉ để che lỗi trang phục.

## Phương án đề xuất

**Kết hợp sửa mesh/weights và chuyển động phụ có chọn lọc.** Đây là lựa chọn kỹ
thuật đề xuất, chưa phải kết quả đã đo trên trang phục mới.

1. Phom trước: collar/lapel mềm, vai và tay liền mạch, gile kết thúc rõ ở eo,
   tay áo có độ nới đủ cho gập tay. Giữ hình dáng và bảng màu hiện tại.
2. Chi tiết theo thứ bậc: silhouette và nếp lớn thấy từ xa; viền may, hàng khuy,
   miệng túi, lót cửa tay thấy khi tiến gần. Dùng atlas/texture cho nét nhỏ, mesh
   cho chi tiết đổi silhouette/bề dày; không tăng lưới đồng loạt.
3. Deformation: weight chuyển tiếp mượt ở vai/nách/khuỷu; ngoài và lót dùng cùng
   logic biến dạng để tránh tách lớp. Khuy/huy hiệu bám theo đúng vùng áo.
4. Thử tối thiểu vài chuỗi spring cho hai tà và đầu cà vạt, có damping/collider
   thân–hông phù hợp; vùng vai/cổ giữ ổn định. Số xương và thông số chốt bằng
   thử nghiệm, không sao chép tuning tóc hay tự nhận đã tối ưu mobile.

Chỉ làm texture không giải quyết deformation. Full cloth solver có thêm chi phí
và xử lý self-collision, chưa có nhu cầu/đo đạc đủ để chọn trong vòng chỉnh nhẹ này.
Có thể bắt đầu bằng mesh/weights, rồi giữ hoặc bỏ thử nghiệm spring theo hình thật.

## Thứ tự thực thi và điều kiện xem bản tiếp

- Làm một mẫu Khoa riêng; giữ nguyên hash chân dung đã duyệt. Không chạy generator
  cũ thẳng vào public vì recipe cũ chưa chứa chân dung được duyệt.
- Vòng A: cổ–vai–tay–gile đạt khi đứng và cử chỉ, trước khi thêm trang trí nhỏ.
- Vòng B: chi tiết vải, khuy, mép may và rig phụ; so sánh cùng camera/ánh sáng.
- Xem clip liên tục: idle→chào→chỉ hướng→mở tay→chỉnh cổ tay→nghỉ, quay người và
  góc gần. Không chỉ chụp pose tĩnh. Giữ tay chạm đúng cửa tay.
- Kiểm giảm chuyển động, 30/60 Hz, stall/tab-resume; không rung vô hạn, bật tà,
  xuyên thân/lộ mặt trong hoặc lớp lót tách áo trong các tình huống đã chọn.
- Kiểm camera chơi, ngày/đêm, desktop/viewport điện thoại. Đo draw calls/frame
  time cùng máy; chưa hứa hiệu năng trên điện thoại thật khi chưa đo.
- Khi tích hợp: bảo toàn mặt/hair/glasses/morph/license và các nhân vật khác;
  cập nhật hai manifests/hash cùng kiểm thử liên quan, chạy bốn gates trước commit.
  Commit/push/deploy vẫn chỉ khi có yêu cầu riêng.

## Bằng chứng và giới hạn lượt nghiên cứu

- `pnpm browser run-code --filename=output/research/khoa-clothing/capture.txt`:
  hoạt động thực trả về `watch-gate`, `point`, `open-palm`, `adjust-cuff`.
  Đã sửa thời điểm chụp cuff từ 8.4 s sang 12.7 s theo phase thực và assert activity.
- `pnpm browser console error`: `Total messages: 0 (Errors: 0, Warnings: 0)`.
- `node -e "eval(require('fs').readFileSync('output/research/khoa-clothing/inspect.cjs.txt','utf8'))"`:
  xuất skin-report từ asset thật; không thay mesh.
- `clothing-audit.png` đánh dấu trên render thật; không phải concept hoặc bản mới.
- Tự review một người theo yêu cầu repo; QA browser đã đóng. Server cũ không bị dừng.
- Chưa sửa trang phục, chưa tích hợp portrait, chưa kiểm va chạm toàn bộ mesh,
  clip liên tục/FPS/điện thoại thật; không chạy full gates cho lượt nghiên cứu này.
