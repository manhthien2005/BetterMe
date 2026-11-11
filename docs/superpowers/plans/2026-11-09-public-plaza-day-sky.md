# Public Plaza — Hoàn thiện bầu trời ban ngày

> Sol phụ trách asset và hướng thiết kế. Argon 4 tích hợp và bàn giao bằng chứng trong game. Làm tuần tự trong worktree `D:/Dev/Projects/BetterMe/.worktrees/reading-quest-environment-v1`, nhánh `feat/reading-quest-environment-v1`. Lấy Mist Refinement Pass làm mốc.

**Mục tiêu** — Bầu trời fantasy sáng và trong ở Public Plaza, với xanh sâu phía cao, cyan nhạt ở chân trời, mây có khối và nắng có quầng tan mềm.

**Phạm vi** — Pha `morning`, `noon` và `afternoon` của Public Plaza. Dùng camera, vùng chơi, địa hình và biển sương hiện hành làm baseline. Hoàng hôn và đêm là ca hồi quy. Hướng thiết kế đêm sẽ dựa trên ảnh tham chiếu owner gửi sau.

## Hướng hình ảnh

- **Trời xanh và thoáng.** Giữ phần lớn khoảng trời thoáng ở preset Ít mây. Chuyển sắc từ azure trên cao xuống cyan nhạt sát chân trời. Ba điểm màu lấy từ ảnh đích là `#176AD9`, `#43AAFB` và `#B4EDFD`. Hiệu chỉnh theo màu thực tế sau khi render. Lúc 07:30, sắc ấm tập trung về phía mặt trời.
- **Mây có khối và độ xa.** Một vài cụm mây tích bất đối xứng, đỉnh trắng ngà, bụng xanh lam dịu và viền mềm. Xen vệt mây mỏng và cụm nhỏ về phía chân trời. Chừa khoảng xanh giữa các cụm để phân biệt mây cao và biển sương. Tránh bố trí đối xứng hoặc lặp cùng silhouette trong một khung.
- **Nắng nhỏ và sáng.** Một lõi sáng nhỏ, quầng tan dần ra nền. Mây có thể che bớt nắng khi độ phủ tăng. Vị trí mặt trời trong ảnh đích minh họa hình ảnh, còn game lấy hướng từ thời gian TP.HCM.
- **Duyệt từ spawn trước.** Camera mặc định hơi chúc xuống, nên người chơi chủ yếu thấy dải trời gần chân trời. Tinh chỉnh màu và vị trí cụm mây trên khung render có HUD. Dùng thêm một góc nhìn lên hợp lệ để xem chi tiết mây và nắng.

## Asset và nơi tích hợp

- [Atlas mây RGBA 1536 × 1024](../../../output/world-plaza-summit-2026-11-09/sky-lookdev/reference/plaza-cloud-atlas-v1.png). 3 cột × 2 hàng, mỗi ô 512 × 512. Hàng trên từ trái sang phải là mây tích cao, mây tích bè, cụm mây tích nhỏ. Hàng dưới là dải mây thấp, mây ti, vệt mây mỏng. Thứ tự tính từ góc trên trái PNG. Alpha ở các đường phân ô tối đa 9/255. Dùng vùng đệm UV và kiểm mép trên nền xanh.
- [Ảnh đích bầu trời ban ngày](../../../output/world-plaza-summit-2026-11-09/sky-lookdev/reference/plaza-day-sky-direction-v1.png). Dùng để đối chiếu bảng màu, khoảng trời trống, mây và quầng nắng.
- File tích hợp chính là [world-sky-environment.tsx](../../../src/components/world/world-sky-environment.tsx) tại `PublicPlazaSkyEnvironment`. Dùng [environment-model.ts](../../../src/lib/world/environment-model.ts) làm nguồn snapshot. Mọi điều chỉnh profile phục vụ hướng màu mới cần giới hạn ở Plaza ban ngày. Vị trí đề xuất cho atlas lúc chạy là `public/world/plaza/sky/`.
- [Spec Summit](../specs/2026-11-09-public-plaza-summit-design.md) · [Báo cáo Mist Refinement](../../../output/world-plaza-summit-2026-11-09/mist-refinement/report.md).

## 1. Lưu mốc và tích hợp

- [ ] Lưu ảnh `/world` trước sửa ở camera reset, 1440 × 1000, DPR 1, HUD hiện bình thường, bảng preview đóng. Dùng ngày 2026-11-09, 07:30 Ít mây 42% và 12:15 Trời quang. Lưu thêm một góc nhìn lên trong giới hạn hiện tại, cùng thao tác để chụp lại đúng khung.
- [ ] Dùng sky dome hiện có. Tinh chỉnh gradient theo dải góc người chơi nhìn thấy ở spawn. Dùng `environment.plazaSun.direction` làm nguồn chung cho mặt trời, quầng và đèn đổ bóng. Kiểm hướng Đông lúc 07:30, hướng Tây lúc 15:30 bằng camera hiện tại. Nếu đĩa nằm ngoài khung spawn, kiểm quầng tại spawn và đĩa từ một góc hợp lệ.
- [ ] Dùng một atlas chung cho mây cao. Chọn sprite và kích thước theo cụm, bố trí ổn định theo hướng bản đồ. Kiểm alpha và depth để núi có thể che mây xa, mây có thể che bớt mặt trời. Dùng `cloudCoverPct` và màu mây từ snapshot. Giữ hành vi reduced motion. [Tài liệu Texture](https://threejs.org/docs/pages/Texture.html) · [Tài liệu Material](https://threejs.org/docs/pages/Material.html).
- [ ] Dùng fallback từ sky hiện tại trong lúc atlas tải hoặc nếu tải lỗi. Kiểm vòng đời tài nguyên khi vào Personal World rồi quay lại. Nếu tối ưu dung lượng atlas, đối chiếu mép trong suốt và sắc độ mây với PNG nguồn.

## 2. Nghiệm thu trong game

- [ ] So ảnh trước/sau tại 07:30 Ít mây và 12:15 Trời quang. Ngay từ spawn phải đọc được trời xanh thoáng và mây cao riêng với biển sương. Ở góc nhìn lên, mây có lớp sáng/tối và viền mềm. Kiểm thêm 15:30, Nhiều mây, Có mưa, xoay đủ vòng, hai đầu zoom, khung 390 × 844 và reduced motion. Tìm viền vuông, silhouette lặp, nhấp nháy hoặc clipping.
- [ ] Kiểm chuyển sang pha đêm hiện hành rồi quay lại và Personal World → Plaza. Chạy `pnpm vitest run src/lib/world/solar-position.test.ts src/lib/world/environment-v1.test.ts src/lib/world/world.test.ts src/components/world/world-client-shell.test.tsx`, `pnpm typecheck` và `pnpm lint`. Theo AGENTS.md khi chạy build hoặc chuẩn bị commit.
- [ ] Đo cùng thiết bị, browser, DPR, preset, tuyến và warm-up ở hai bản. Ghi p95/p99 frame interval, số khung >50 ms, draw calls, byte asset tải thêm và thời gian sẵn sàng vào map riêng. Lưu ảnh cùng khung, clip ngắn xoay trời và báo cáo tại `output/world-plaza-summit-2026-11-09/sky-lookdev/in-game/`. Dừng để Sol review và owner duyệt.

## Nguồn gốc asset

Hai ảnh được tạo mới bằng ImageGen tích hợp. Năm ảnh user gửi dùng làm tham chiếu hướng tạo hình.

**Prompt atlas**

```text
Use case: stylized-concept. Create a BRAND NEW original game texture, a landscape 3:2 RGBA cloud atlas with a genuinely transparent background. Reference images 1 and 2 in the conversation indicate desired cloud softness, dimensionality and irregular hand-painted shape; images 3–5 indicate clean luminous anime open-world daylight, open sky and clear atmospheric color. Create unique silhouettes, do not reproduce existing assets. Exactly six isolated cloud sprites in a regular 3-column by 2-row grid, plenty of fully transparent padding at each cell boundary, no cross-cell pieces. Top row: towering asymmetric cumulus with stacked lobes, broad tiered cumulus, smaller uneven cumulus cluster. Bottom row: low horizontal fluffy cloud bank, delicately broken high cirrus, slender elongated wispy streak. The three main clouds read physically fluffy and sunlit like real distant cumulus but with beautiful hand-painted anime detailing: soft layered cream-white crowns, neutral pale periwinkle undersides, fine feathered edges and large coherent volumes. Use near-neutral diffuse lighting suitable for runtime tinting, gentle overhead highlights and internal shading; no strong baked light from east or west. High detail smoothly painted, no polygon facets, no outlined contours, no all-white blown-out blobs. This is six separate playable PNG texture elements on a completely clear alpha canvas. No background color, no sky gradient, no checkerboard painted in, no ground, no border, no scene, no sun, no stars, no text, no labels, no shadows cast on a backdrop. Make sure every shape is complete and fits well inside its own cell.
```

**Prompt ảnh đích ban ngày**

```text
Use case: stylized-concept. Create an original daytime-only sky art direction image for a fantasy anime game played on a high mountaintop. Wide 16:9 landscape. The image is almost entirely open sky, with extremely low, soft, blue mountain silhouettes across the bottom 7% simply to anchor the horizon. The sky feels exceptionally clean, luminous, and airy. Deep clear azure in the upper third transitions smoothly through bright blue into pale cyan at the low horizon. About two thirds open blue negative space. A small arrangement of beautiful, physically believable hand-painted cumulus at middle-left and lower-right with asymmetric sculpted silhouettes, soft cream-white crowns, subtle cool periwinkle undersides and delicate but well-defined feathered edges; distant smaller puffs and a few delicate wisps softly recede toward the horizon. A single small luminous pearl-white daytime sun, upper right, with a soft locally fading atmospheric halo, barely perceptible golden warmth near the sun. Look at the user's visual references for airy luminance, clear blue and natural stylized clouds, while inventing original cloud shapes. Beautiful anime-game concept art, exceptionally clean transitions, delightful atmosphere, no ring around the sun, no lens flare artifacts, no dense overcast, no giant central cloud, no stars, no moon, no objects, no buildings, no characters, no text or logo. This is a visual target image for integration, not a panorama map.
```
