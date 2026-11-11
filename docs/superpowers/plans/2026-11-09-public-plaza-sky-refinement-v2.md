# Kế hoạch Public Plaza Sky Refinement V2

> Argon 4 thực thi tuần tự, single agent theo AGENTS.md. Sol đã chuẩn bị asset và hướng thiết kế. Thực hiện mốc A ban ngày trước, bàn giao để Sol review và owner duyệt, sau đó tiếp tục mốc B ban đêm theo phản hồi.

**Mục tiêu** — Mây đa dạng và hòa vào khoảng xa, nắng khớp bóng, đêm có trăng rõ bề mặt, sao thưa và cực quang nhẹ.

**Kiến trúc** — Dùng sky rig hiện có, các sprite mây có điều tiết sắc độ/độ mềm, hướng nắng hiệu lực từ snapshot, một texture bề mặt trăng và batch sao/ribbon đêm.

**Stack** — Three.js 0.187.0, R3F 9.8.2, TypeScript, Vitest và Playwright qua pnpm.

**Spec** — [Hướng thiết kế đã chốt](../specs/2026-11-09-public-plaza-sky-refinement-v2-design.md).

**Asset** — [ASSETS.md](../../../output/world-plaza-summit-2026-11-09/sky-refinement-v2/ASSETS.md), [kiểm tra metadata/alpha](../../../output/world-plaza-summit-2026-11-09/sky-refinement-v2/asset-qa.json), [preview trên xanh/chàm](../../../output/world-plaza-summit-2026-11-09/sky-refinement-v2/asset-preview.png).

## Ràng buộc và chỗ cần kiểm kỹ

- Đúng worktree `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1` và nhánh `feat/reading-quest-environment-v1`. Dùng hiện trạng Day Sky Lookdev làm baseline, lưu mốc file thực tế trước sửa vì thư mục source hiện còn untracked.
- Dùng camera và vùng chơi đã duyệt trong `src/lib/world/map-config.ts`. Đọc đúng min/max distance của Plaza là 4,8/20,5. Báo cáo Day Sky Lookdev đã ghi 5,4/16,5, cần ghi lại giá trị thực.
- Giữ auth và nhánh Personal World theo các spec đang có. Mọi đổi profile cần giới hạn đúng space. Có một nguồn weather/time snapshot.
- Commit/push theo ủy quyền owner, bốn gate trước commit, dừng đúng dev process của checkout trước build. Cập nhật report nêu chính xác file sửa và lệnh chạy.
- Năm ca bắt buộc gồm ảnh mây rất nhỏ bị lộ viền mip, đổi giờ làm đĩa và bóng lệch nhau, lỗi tải từng asset, đổi space lặp ba lần, bật reduced motion trong lúc cảnh đã chạy. Kiểm bằng browser và kiểm projection ở tầng thực sự dùng để render.

## Mốc A — Hoàn thiện mây và nắng ban ngày

### A1. Chuẩn bị texture và baseline

**Files** — Source tại `output/world-plaza-summit-2026-11-09/sky-refinement-v2/assets/`. Bản runtime tại `public/world/plaza/sky/v2/`. Bằng chứng tại `output/world-plaza-summit-2026-11-09/sky-refinement-v2/day-in-game/`.

- [x] Lưu bản chụp file liên quan và bộ ảnh trước sửa, dùng 2026-11-09, 07:30 Ít mây 42%, 12:15 Trời quang 12%, 15:30 Ít mây 42%. Camera reset, desktop 1440 × 1000, DPR 1, HUD thật và preview đóng. Ghi GPU/browser, góc nhìn lên và tuyến dùng lại.
- [x] Cắt mỗi atlas 1254 × 1254 thành bốn ô 627 × 627 đúng tọa độ ASSETS.md. Tạo 12 sprite runtime riêng, giữ đệm trong suốt, chuẩn hóa mỗi ô thành 512 × 512 và sinh mipmap độc lập. Alpha ngoài ô hiện tối đa 1/255, có thể làm sạch alpha ≤2/255 ở nền. Giữ rìa bán trong suốt của mây.
- [x] Tạo `sun-aureole-v2.png` runtime 512 × 512. Ghi kích thước/byte thực và lập mapping tên sprite về ô nguồn. Dùng source bản gốc giữ tại output để kiểm màu và biên sau mã hóa.

### A2. Tích hợp mây có độ xa

**Files** — `src/components/world/world-sky-environment.tsx` tại `PublicPlazaSkyEnvironment`. Có thể tách phần mới thành `src/components/world/public-plaza-sky-clouds.tsx` để giữ ownership texture, material, geometry, cleanup và reduced motion gọn trong một component. Snapshot tiếp tục đi từ `src/lib/world/environment-model.ts`.

- [x] Dùng 12 hình mới để bố trí ổn định quanh map. Mỗi silhouette lớn xuất hiện tối đa một lần trong một hướng nhìn. Bố trí bất đối xứng cả về khoảng trống và tỷ lệ. Chọn lớp nổi bật/giữa/xa theo spec, dùng màu trời tại vị trí cụm để hòa sắc, và mipmap để giảm chi tiết ở xa.
- [x] Điều tiết ánh sáng bằng hướng nắng trong không gian của sprite. Viền nhận sáng có chọn lọc, bụng mây dịu và chuyển lớp mềm. Tự so ở 12:15 và 15:30 khi nhìn cùng hướng, tránh chỉ nhìn ảnh source đã làm mờ.
- [x] Độ che tăng theo weather snapshot. Trời quang để nhiều khoảng xanh. Mây cao giữ khoảng xa khi player đi ngang, và ổn định hướng khi camera xoay. Kiểm núi che đúng mây bằng depth và thứ tự blend.
- [x] Asset tải chậm/lỗi có fallback, giải phóng tài nguyên đúng owner. Bật reduced motion trong phiên đang chạy để xác nhận trôi mây dừng, snapshot vẫn cập nhật.

### A3. Khớp mặt trời và bóng

**Files** — `world-sky-environment.tsx` tại `computeDomeFramedSolarDirection`, `computeCelestialPosition`, `computeShadowLightPosition`. Test tại `src/lib/world/solar-position.test.ts`, hoặc tách một phép chiếu pure nhỏ vào `src/lib/world/solar-position.ts` nếu cần để test đường gọi thực.

- [x] Trước sửa, tái hiện phép nén góc cao. Ngày 2026-11-09, source solar cho 07:30 ≈23°, 12:15 ≈61°, 15:30 ≈26,2°, còn đĩa hiện bị đưa xuống khoảng 6,5°/9,9°/6,9°.
- [x] Thêm regression kiểm vector cuối cùng từ camera đến vị trí đĩa sau transform cha khớp hướng solar trong ngày. Dùng các thời điểm trên, kiểm vector hữu hạn và sai lệch góc <0,1° với pose tính toán. Đảm bảo test gọi phép chiếu thực mà component dùng. Kiểm độ cao đèn ban ngày khớp nguồn hướng đó và việc ẩn đĩa khi nắng dưới chân trời.
- [x] Dùng hướng nắng thực cho đĩa/quầng và tán sáng trên vòm. Trong parent rig theo camera, tính đúng offset theo camera và transform cha. Lõi nhỏ, mềm, với aureole mới theo spec. Đĩa nằm ngoài khung camera hợp lệ lúc trưa là một kết quả chấp nhận được.
- [x] Chụp bằng chứng hướng Đông lúc 07:30, hướng Tây lúc 15:30, có vật và bóng. Khi đĩa ngoài khung, báo số đo vector/world position, giữ camera hiện hành để kiểm. Mây che ngang làm dịu cả lõi và quầng.

### A4. Tự review và bàn giao

- [x] So trước/sau tại spawn và góc trời, ba giờ ngày, Nhiều mây và Có mưa. Kiểm xoay đủ vòng, đi ngang, hai đầu zoom 4,8/20,5 và mobile 390 × 844. Mây xa đọc mềm và nhẹ hơn mây nổi bật, tránh cạnh vuông, silhouette lặp nổi bật hoặc màu tối cứng trong lớp chồng.
- [x] Chạy `pnpm vitest run src/lib/world/solar-position.test.ts src/lib/world/environment-v1.test.ts src/lib/world/world.test.ts src/components/world/world-client-shell.test.tsx`, `pnpm typecheck`, `pnpm lint`. Ghi output và test bổ sung nếu có.
- [x] Đo cặp trước/sau ba lượt cùng tuyến đã ghi. Ghi p95/p99, khung >50 ms, draw calls, tải asset và thời gian vào map riêng. So với đề xuất ngân sách trong spec. Ước lượng texture v2 theo kích thước GPU đã chuẩn hóa, điểm khởi đầu khoảng 24 MiB cho toàn bộ bộ texture, có mipmap. Trình bày rõ số đo và phần ước lượng.
- [x] Kiểm ngày → dusk → night → ngày và Personal World → Plaza ba vòng. Nêu mọi thay đổi ngoài pha ban ngày để review trước mốc B.
- [x] Lưu ảnh, clip ngắn và `report.md` ở day-in-game. Dừng mốc A để Sol review và owner duyệt trước mốc B.

## Mốc B — Trăng, sao và cực quang

**Điều kiện bắt đầu** — Owner đã duyệt mốc A. File runtime và kết quả mốc A là baseline cho B.

**Files** — Nhánh Plaza trong `world-sky-environment.tsx`. Có thể tách phần mới thành `src/components/world/public-plaza-night-sky.tsx` với cùng snapshot. Asset runtime tiếp tục ở `public/world/plaza/sky/v2/`. Bằng chứng ở `output/world-plaza-summit-2026-11-09/sky-refinement-v2/night-in-game/`.

- [ ] Chuẩn hóa bản đồ `moon-lroc-color-2k.jpg` xuống runtime `moon-lroc-color-1k.jpg` 1024 × 512 và giữ credit NASA theo ASSETS.md. Quấn cầu đúng UV để mặt gần đọc được, kiểm các mảng tối lớn và vùng sáng, với quầng bạc mỏng. Trăng gần tròn là lựa chọn khởi đầu của Sol cho góc mẫu.
- [ ] Chuẩn hóa `star-point-v1.png` xuống texture 128 × 128, kiểm lõi sao ở kích cỡ thực để vẫn còn sáng vừa đủ. Rải ổn định 96 điểm trên bán cầu, dùng chung texture và batch. Chỉ 15–20% sao lấp lánh nhẹ, lệch pha 6–12 giây. Duyệt số điểm thực thấy trong khung với owner.
- [ ] Chuẩn hóa `aurora-ribbon-v1.png` về 768 × 512, giữ tỷ lệ 3:2 và rìa trong suốt. Bố trí một vệt mỏng phía Bắc theo spec, tối đa một vệt phụ mờ. Bắt đầu với cường độ tương đương alpha preview. Trôi hoặc uốn rất chậm. Chừa bầu trời trống và kiểm mây che đúng lớp.
- [ ] Dùng độ đêm và weather snapshot chung để sao/cực quang dịu theo độ phủ. Kiểm đêm quang, ít mây, nhiều mây và mưa. Kiểm bật reduced motion trong phiên để sao và cực quang dừng trang trí. Chuyển 17:30 → 20:30 → 07:30, thoát preview, kiểm ngày được duyệt ở A.
- [ ] Kiểm fallback từng asset và vòng chuyển Personal World → Plaza ba lần. Chạy focused tests, typecheck, lint, đo cặp trước/sau mốc B cùng cấu hình và tuyến.
- [ ] Bàn giao ảnh spawn, một góc ngắm trăng, một góc ngắm cực quang, clip sao/cực quang ít nhất 15 giây, số đo và báo cáo trong night-in-game. Sol review kỹ thuật, owner duyệt hình ảnh.
