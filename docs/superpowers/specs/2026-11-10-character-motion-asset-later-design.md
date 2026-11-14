# Reading Quest — chuyển động nhân vật trước, asset hoàn chỉnh sau

**Ngày:** 2026-11-10

**Trạng thái:** Chủ sở hữu duyệt ngày 2026-11-10 và cho phép triển khai. Chưa nghiệm thu tạo hình hay chuyển động.

## 1. Ý định và điều đã xác nhận

Reading Quest là game giáo dục cho người học IELTS tuổi vị thành niên và trưởng thành. Chủ sở hữu muốn nâng chất lượng player và NPC: đi, chạy, nhảy, idle, cử chỉ tay và phản ứng tương tác. Công cụ tạo ảnh không hoạt động; chủ sở hữu không dùng API key và muốn để việc tạo asset lại sau.

Round này làm hệ chuyển động chạy được trên model sẵn có, cùng quy cách bàn giao model mới. Không gọi công cụ tạo ảnh, dịch vụ tạo model, API trả phí; không tải thêm bộ asset bên ngoài. Bản checkpoint môi trường `e00fabb` là nền cần giữ.

Hai mốc nghiệm thu tách biệt:

- **Mốc kỹ thuật:** hệ chuyển động và tương tác chạy, được kiểm tra trên model mẫu hiện có; cho phép gắn model khác qua cấu hình.
- **Mốc mỹ thuật:** model do chủ sở hữu cung cấp được tích hợp, căn chỉnh và duyệt trong game. Mốc này chưa thể hoàn tất khi thiếu asset.

Ảnh concept PNG/JPG chỉ là tham chiếu ngoại hình; không thay thế mesh 3D, bộ xương, trọng số da, vật liệu hay biểu cảm.

## 2. Nền hiện tại

- Three.js `0.187.0`, `@pixiv/three-vrm` `3.5.5`, React Three Fiber `9.8.2` đã có trong dự án. Không cần đổi engine để tiếp tục.
- Player dùng `scholar-vrm1.vrm`, model mẫu pixiv được ghi nguồn và metrics trong `character-assets.ts` cùng manifest public. Đây không phải thiết kế riêng đã được duyệt cho Reading Quest.
- `animation-state-machine.ts` đã có idle/walk/run/jump/fall/land/interact, giữ pha bước chân và trộn chuyển trạng thái. Pose đang điều khiển 20 xương, chưa có ngón tay/ngón chân.
- `vrm-loader.ts` nạp model, áp pose lên normalized humanoid, cập nhật biểu cảm và springbone; có fallback, cleanup và xử lý quay lại tab.
- `physics.ts` là nguồn vị trí và va chạm. Animation nhận tốc độ thực sau va chạm; không được tự kéo root nhân vật.
- Ba NPC hiện là hình khối với logic lắc người/vẫy tay riêng trong `world-scene.tsx`. Hội thoại hiện chỉ có NPC và chỉ số dòng, không có âm thanh hay nhận diện người nói.

Tham chiếu hành vi môi trường: `2026-11-07-world-environment-v1-spec.md` và `2026-11-09-public-plaza-summit-design.md`.

## 3. Các cách tiếp tục và lựa chọn kỹ thuật đề xuất

1. **Chỉ chuẩn bị chỗ gắn asset.** Ít thay đổi nhưng chưa cải thiện cảm giác chơi; không đủ cho yêu cầu chuyển động.
2. **Nâng chuyển động trên VRM hiện có, dùng chung đường áp pose cho player/NPC.** Kiểm tra được ngay, không phụ thuộc asset mới. Đổi ngoại hình sau vẫn cần hiệu chỉnh theo tỷ lệ cơ thể. Chủ sở hữu đã duyệt hướng này ngày 2026-11-10.
3. **Chuyển ngay toàn bộ sang clip thu chuyển động/VRMA.** Có thể phù hợp khi đã có bộ clip tốt và quyền sử dụng rõ; hiện chưa có các clip đó, nên việc đổi hệ thống ngay chưa tự đem lại chuyển động tốt hơn. Để sau, không dựng sẵn một framework import đa định dạng.

Triển khai hướng 2 đã duyệt. Tiếp tục dùng pose có tham số và các chuỗi cử chỉ được biên soạn bằng dữ liệu/code. Không gọi các chuyển động này là mocap. Nếu sau này thay bằng clip, phải thay nguồn pose tương ứng, không để mixer và bộ tạo pose cùng ghi một xương.

## 4. Trải nghiệm chuyển động

### Player

- Đi/chạy có nhịp chân theo tốc độ dịch chuyển thực; tay vung và thân đối trọng vừa phải. Pha bước không nhảy lại về đầu khi chuyển walk/run.
- Khởi động, dừng và đổi hướng hòa tư thế liên tục. Giữ nguyên tốc độ, gia tốc trọng trường, độ cao nhảy và điều khiển hiện tại: làm mềm pose không đồng nghĩa thêm quán tính trượt cho physics.
- Nhảy phân biệt rời đất, đi lên, gần đỉnh, rơi và hồi phục tiếp đất. Không thêm thời gian chờ lấy đà trước khi nhận phím nhảy. Chạy tiếp hoặc nhảy tiếp được ưu tiên hơn cử chỉ.
- Idle thở nhẹ, chuyển trọng tâm, chớp mắt và nhìn tự nhiên; tránh vòng lắc đều như con lắc.
- Tay thả lỏng có độ cong ngón, chào có lòng bàn tay và cổ tay rõ; kết thúc hoặc hủy cử chỉ phải trả về pose phù hợp, không kẹt cánh tay.
- Khi mở hội thoại: chào ngắn một lần, sau đó tư thế lắng nghe. Không tự thêm thao tác người chơi hay menu emote trong round này.

### NPC

Giữ nguyên Học giả An, Quản sự Khoa, Thủ thư Minh; ID, vị trí, collider, vai trò, nội dung và cách mở/đóng hội thoại không đổi.

Mỗi NPC tạm dùng một instance độc lập của VRM hiện có để kiểm tra bộ xương và biểu cảm thật. Đây là ngoại hình mẫu, chưa phải ba thiết kế hoàn chỉnh. Không chia sẻ trạng thái xương/biểu cảm giữa các instance; giữ dấu tương tác và thông tin tên/vai trò hiện có.

Chuỗi hành vi:

```text
Đứng chờ → mở hội thoại: hướng về người chơi + chào ngắn
         → cử chỉ giải thích ngắn → đứng chú ý khi người chơi đọc
         → đổi dòng: một cử chỉ phù hợp → trở lại chú ý
         → đóng/rời phạm vi: kết thúc cử chỉ → trở về hướng đứng ban đầu
```

- An: cử chỉ giải thích mở tay, nhịp vừa phải. Khoa: chỉ dẫn ngắn, rõ. Minh: chuyển ánh nhìn nhẹ, cử chỉ nhỏ và điềm tĩnh. Đây là phong thái đề xuất, không phải tính cách owner đã chốt.
- Dùng sự kiện mở hội thoại và đổi `lineIndex`; không đoán cảm xúc từ nội dung bằng AI hoặc bộ nhận diện từ khóa. Không vẫy lại ở mọi frame.
- Khi chờ đọc, không gật liên tục, không mấp máy miệng vô hạn. Chưa có lời nói nên không tuyên bố lip-sync.
- Ánh nhìn và xoay đầu có giới hạn; phần thân xoay theo khi cần, không vặn cổ để nhìn người ở sau lưng. Nhả cố định chân khi xoay thân.
- Nhịp idle/chớp mắt khác nhau theo ID để NPC không đồng loạt chuyển động; dùng dữ liệu xác định được trong test.
- Gắn lại đạo cụ sách đang có vào tay nếu phù hợp pose của Minh. Chỉ dựng tư thế giữ/nhìn sách; lật trang thực cần cấu trúc sách riêng và chưa thuộc mốc kỹ thuật.

### Đúng tinh thần giáo dục

Không thêm phản ứng chế giễu, thất vọng vì người chơi chậm hoặc bỏ học, chiến đấu hay ăn mừng quá lớn. Người học có thể đọc bao lâu tùy ý; animation không tạo đồng hồ áp lực. Chưa thêm nội dung IELTS, chấm điểm hay luyện nói trong round nhân vật này.

`prefers-reduced-motion` giảm/tắt cử chỉ trang trí, idle sway và marker bob/spin; vẫn giữ tư thế di chuyển, nhảy, tiếp đất cần thiết để hiểu điều khiển. Áp dụng cho cả player và NPC.

## 5. Cấu trúc triển khai và ranh giới sở hữu

- Mở rộng bộ pose hiện tại cho ngón tay/ngón chân tùy khả năng rig; không thay toàn bộ state machine. Xương tùy chọn thiếu thì bỏ qua an toàn, báo khả năng thực tế thay vì crash.
- Tách hành vi NPC ra module thuần cho chuyển trạng thái/thời gian và component vẽ tương ứng; dùng lại `CharacterAvatar` và VRM loader. Không để logic NPC tiếp tục ghi xương ở đường khác.
- Truyền tín hiệu dòng hội thoại qua shell → canvas → scene. Chỉ thêm dữ liệu cần cho cử chỉ; UI và quyền tương tác giữ nguyên.
- Thứ tự mỗi frame: physics/root → trạng thái → pose thân/ngón tay + ánh nhìn → chỉnh tiếp xúc chân → cập nhật humanoid/constraints/materials/springbone. Một đường duy nhất áp pose cho mỗi actor, cả khi fallback và khi nạp xong model.
- Cải thiện bám chân bằng bộ chỉnh hai khớp chân trên mặt phẳng hiện tại `y=0`: ghi điểm tựa ở pha đặt chân, đổi sang tọa độ rig để giải, nhả khi bước sang pha vung, nhảy, teleport, quay gắt hoặc vượt tầm chân. Có giới hạn chỉnh, không kéo root hoặc duỗi quá chiều dài chân. Thông số hình học lấy từ rig đã nạp và offset đế giày của asset. Không làm hệ bám địa hình/dốc/bậc thang trong round này.
- Mọi hiệu ứng tiếp xúc chỉ chỉnh pose hiển thị, không thay collider, vị trí logic hoặc đường đi. Kiểm tra kết quả cuối sau cập nhật VRM; không dùng bước smoothing phía sau làm trôi điểm tựa vừa giải.
- Tóc/quần áo tiếp tục dùng springbone đã có. Không thêm cloth simulation hay gió mới; cấu hình riêng của asset mới được xét ở bước tích hợp, không coi cách đoán tên xương của model mẫu là chuẩn cho mọi model.
- Reuse manifest hiện có cho asset ID/URL/nguồn/metrics, bổ sung mapping theo `NpcDefinition.assetSlot` khi cần. Các bản mô tả manifest hiện có phải thống nhất. Không tạo hệ registry tổng quát cho các loại asset chưa có người dùng.
- Nạp lỗi vẫn có fallback và lý do chẩn đoán. Unmount, đổi map, đổi model phải hủy đúng instance; không dispose tài nguyên mà actor khác còn dùng. Không thêm dependency mặc định.

## 6. Quy cách asset anh bổ sung sau

Định dạng ưu tiên là **VRM 1.0 humanoid** vì tương thích nền hiện tại. GLB chỉ có hình, FBX hoặc ảnh không mặc nhiên thay trực tiếp được; phải kiểm tra và chuyển đổi riêng nếu chọn chúng.

Mỗi nhân vật cần:

1. File `.vrm` có mesh được skin vào humanoid rig hợp lệ, bind/rest pose và hướng trục đúng chuẩn; không chỉ mesh tĩnh.
2. Xương bàn tay/ngón tay đầy đủ nếu cần cử chỉ ngón; toe bones cho chuyển động bàn chân chi tiết. Thiếu các xương này vẫn có thể xem model nhưng phần tương ứng bị giới hạn.
3. Biểu cảm chớp mắt, vui nhẹ/thư giãn; hỗ trợ mắt nhìn là lợi thế. Viseme chỉ cần khi làm giọng nói sau này. Tên biểu cảm được kiểm tra và ánh xạ, không giả định model nào cũng có đủ.
4. Vật liệu/texture đi kèm đầy đủ; tóc/quần áo động có springbone/constraints thích hợp. Không phụ thuộc texture ở URL ngoài.
5. Tên tác giả, nguồn, điều khoản và bằng chứng quyền sử dụng/phân phối phù hợp với game trên web. Không tự sửa metadata để vượt kiểm tra quyền.
6. Chiều cao mong muốn, offset đế giày và ảnh tham chiếu mặt trước/bên/sau; file nguồn chỉnh sửa nếu có để sửa xuyên áo hoặc skinning.

Giữ model trong ngân sách tải/render được đo trên cảnh có player và NPC cùng lúc. Model mẫu hiện khoảng 10.8 MB, 36,470 tam giác và 13 primitive; đây là số đo tham chiếu, không phải mục tiêu cần nhân lên cho mọi NPC. Chưa ấn định mức FPS hay ngân sách phần cứng chưa được đo.

Hướng mỹ thuật đã biết: phục vụ thiếu niên và người lớn học IELTS, hợp học viện trên núi. Tỷ lệ cơ thể, giới tính avatar, trang phục và ngoại hình NPC vẫn mở; không coi concept chưa tạo được là đã duyệt.

Nếu anh chỉ tạo ảnh concept, mốc còn lại vẫn gồm dựng/nguồn model 3D, rig, skin, texture và export. Em bàn giao hướng dẫn để anh biết chính xác cần chuẩn bị gì; không hứa chỉ thay một ảnh là xong nhân vật.

## 7. Nghiệm thu và kiểm tra

### Mốc kỹ thuật trên asset mẫu

- TDD cho chuyển trạng thái/pose, ưu tiên hủy cử chỉ và reset. Các chuỗi idle → walk → run → stop, đổi hướng, nhảy đứng/đang chạy, land → run/nhảy, hội thoại → di chuyển không bật pose hoặc kẹt tay.
- Test 30/60/120 Hz và frame stall; không NaN, không ghi xương thiếu, không dùng delta bất thường để đẩy springbone.
- Đo dịch chuyển chân trong pha tiếp xúc ở world space trên rig thật. So cùng kịch bản baseline/candidate; mục tiêu đề xuất ≤ 5 cm drift trong một pha đặt chân khi đi/chạy thẳng ổn định trên sàn, không tính chuyển trạng thái/quay tại chỗ. Ghi rõ giới hạn và sửa nếu không đạt, không chỉ dựa vào test cũ cho phép drift tới 0.85 m. Quan sát cả đế giày, không chỉ tọa độ ankle bone.
- NPC greet chỉ một lần mỗi lần mở; đổi dòng chỉ kích hoạt một lần; chờ đọc trở về chú ý; đóng/rời khoảng cách hủy đúng. Ba actor có trạng thái độc lập.
- Model lỗi/thiếu xương/thiếu biểu cảm → fallback hoặc giảm khả năng an toàn; teleport/đổi map/đổi tab không giật tóc, không để chân khóa ở vị trí cũ.
- Browser QA bằng công cụ Playwright của repo: quay/chụp chuyển động ở camera chơi thực tế và cận cảnh, kiểm tra desktop/mobile, reduced motion, camera fade, va chạm và cổng dịch chuyển. Số liệu test không thay nghiệm thu mắt nhìn của owner.
- Đo baseline/candidate cùng browser, DPR, map, vị trí và thời lượng; ghi tải model, p95/p99 frame time, số lần khựng >50 ms. Nhiều VRM cùng lúc là rủi ro cần đo, không hứa 60 FPS trước kiểm tra.
- Chạy `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`; dừng đúng dev server của checkout trước build. Không commit/push khi chưa có yêu cầu mới của chủ sở hữu.

### Mốc asset cuối — để sau

Kiểm tra lại chiều cao, hướng đứng, bàn chân, tầm nhìn, cử chỉ ngón, tay cầm sách, tóc/quần áo, material và tải/render trên từng model. Chuyển động của model mẫu không chứng minh model mới không xuyên áo hay trượt chân. Chỉ tuyên bố hoàn tất tạo hình sau khi gắn asset và owner duyệt.

## 8. Ngoài phạm vi và quyết định còn mở

Không tạo/tải asset, không API key; không thay cảnh/bầu trời/camera đã duyệt; không thêm speech, mocap, facial capture, character creator, điều hướng NPC, combat, database, schema, deployment hoặc nội dung khóa IELTS.

Quyết định owner đã duyệt ngày 2026-11-10: phạm vi **nâng hệ chuyển động trên VRM mẫu cho player và ba NPC, asset cuối bổ sung sau**, gồm giới hạn và tiêu chí trên. Các con số tuning cử chỉ, góc nhìn và blend duration để người triển khai điều chỉnh bằng test + QA; không cần hỏi owner từng thông số.

## 9. Cơ sở research và tự review

Research ở lượt trước: [VRM Animation](https://vrm.dev/en/vrma/), [Three.js AnimationAction](https://threejs.org/docs/pages/AnimationAction.html), [ví dụ VRMA đúng phiên bản three-vrm 3.5.5](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm-animation/examples/loader-plugin.html). Chúng cho thấy khả năng retarget/blend, không bảo đảm chuyển động đẹp hoặc bám chân trên mọi model. Round này chưa thêm package VRMA hay clip ngoài.

**Tự review riêng theo AGENTS.md, không dùng subagent:** kiểm tra ranh giới code/asset, quyền ghi xương, nguồn sự kiện hội thoại, giữ physics/camera, thiếu rig/biểu cảm, bộ nhớ nhiều actor và tiêu chí nghiệm thu. Thiết kế này đã được duyệt; bằng chứng triển khai và giới hạn nằm ở `docs/character-motion-verification.md`, không suy từ thiết kế thành kết quả runtime.
