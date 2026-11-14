# Current checkpoint — consolidation 2026-11-14

Active branch: `codex/consolidated-checkpoint-2026-11-14`.
The combined checkout keeps Plaza terrain/islands/LOD/water optimizations and
imports the approved female player, An/Khoa/Minh and authored movement.
Read `docs/maintenance/consolidation-2026-11-14.md` for source ownership,
verification, source-art location and recovery. Older sections below are history;
they do not override this checkpoint or the owner's current AGENTS.md.

Source art: `D:/Dev/ArtSources/BetterMe`. Runtime and necessary test fixtures
are tracked in Git. The only working checkout is now
`D:/Dev/Projects/BetterMe` (four linked worktrees and two orphans removed).
Code checkpoint: `5e159ea`; remote and root both passed 967 tests/109 files
and typecheck/lint/build. D free space measured 13.52 GiB after cleanup. View-dependent asset streaming remains future work.

---

# HANDOFF — Nếp's Garden / Vườn Có Bạn

## Bỏ capture nước ngoài tầm nhìn — 2026-11-14

Owner đã tự ép RTX và yêu cầu bỏ qua sửa card. Tiếp tục phần Plaza: mỗi hệ nước
chỉ chụp phản chiếu/khúc xạ khi ít nhất một pool/stream/fall giao với frustum của
camera hiện tại, còn visible và đúng layer. Lượt ngoài tầm nhìn được bỏ trống;
giữ lịch round-robin 100ms, độ phân giải 512px, vật liệu/GLB/placement. PlayerRig
chạy priority -2, overview -1, nước/effects 0, R3F tự render một lần cuối frame.

[Spec](docs/superpowers/specs/2026-11-14-plaza-water-visibility-design.md),
[plan](docs/superpowers/plans/2026-11-14-plaza-water-visibility.md),
[QA](output/plaza-water-visibility/QA.md). Hai test RED trước sửa; focused 25/7 qua.
Typecheck/lint/build exit0 (lint28warnings cũ, build11/11). Full test lần đầu có
5 timeout5000ms khi chạy đồng thời browser/server; đóng QA và server rồi chạy
`pnpm vitest run --maxWorkers=2`: **827/94 qua**, không nới timeout/sửa test.

Desktop1440×1000/DPR1: overview ngắn135→141FPS, capture18→14lượt/giây;
ẩn đảo18→0. Đi bộ/xoay/quay về132–165FPS trong mẫu hiện tại. Không dùng con số
20FPS lịch sử để quy công cho sửa này vì cấu hình máy đã đổi. Kiểm tra ngày/đêm/
mobile/đi bộ và `/world`,0lỗi page/shader;3vòng map ổn định (personal92/29,
Plaza253/86 geometries/textures). Giới hạn: frustum không biết vật bị che; nước
hiện lại chờ lượt cũ khoảng1giây; vẫn tải7LOD lúc vào map. Asset streaming và
distance LOD chưa triển khai. Các mép sương ban đêm và cây che camera ở sân đã
có trong bản trước, chưa thuộc bước này. Không sửa GPU, commit, push hay deploy.

Preview khởi động lại tại http://127.0.0.1:3004/world?plaza=study để owner review.

## Đưa bộ đảo nhẹ vào Plaza để review — 2026-11-13

Owner đã yêu cầu gắn bộ tối ưu vào Plaza. Cả `/world` và `/world?plaza=study`
dùng cố định bảy GLB trong `public/world/floating-islands/lod/`, giải nén bằng
Meshopt decoder có sẵn của Three. Giữ vị trí, vật liệu, hiệu ứng, giới hạn hai
lượt tải đồng thời và cơ chế thu hồi hiện có. Bảy GLB chi tiết/manifest gốc vẫn
nguyên hash; chưa bật tải theo tầm nhìn, tự đổi LOD hoặc tối ưu capture nước.

Preview: http://127.0.0.1:3004/world?plaza=study — Toàn cảnh / Đi bộ.
[Plan](docs/superpowers/plans/2026-11-13-plaza-lod-integration.md),
[QA tích hợp](output/plaza-lod-integration/QA.md). Các số đo trong phần asset
bên dưới là lịch sử; xem QA tích hợp để biết kết quả tải thật và giới hạn hiện tại.
Bốn gate đã qua: typecheck/lint/build exit 0; 824 tests / 94 files; lint có 28
cảnh báo QA cũ. Browser xác nhận bảy LOD, không gọi GLB chi tiết, texture 200;
ba vòng chuyển map thu hồi ổn định. Lần đo tích hợp thực tế median 52.5ms/P95
93.5ms, chưa đạt 60FPS và không phải benchmark trước/sau có kiểm soát. Preview
đã khởi động lại (session 16773), smoke lần cuối đủ 7 đảo/10 núi, không lỗi
shader/page; QA browser đã đóng. Chưa commit/push/deploy.

## Tối ưu bộ đảo xa, giữ bộ chi tiết — 2026-11-13

Owner phản ánh lag, muốn LOD+tải theo tầm nhìn, sau đó chỉ định làm ASSET TRƯỚC.
Đã tạo riêng `public/world/floating-islands/lod/`:7GLB nén Meshopt và texture dùng
chung,35.794.311bytes/1.661.757triangles; giảm87.9%dung lượng,83.5%hình học.
Cả7GLB chi tiết cũ và manifest gốc giữ nguyên. Ở bước asset này app còn dùng bộ
chi tiết; bước tích hợp mới phía trên đã chuyển cả hai route sang bộ nhẹ.

Nguồn tạo: `scripts/optimize-plaza-islands.mjs`.30water primitives, mọi node/anchor/
material và pixel texture nguyên; giữ biên địa hình, tăng lại tán lá sau đối chiếu.
5.475buffer views qua decoder thực tế; viewer tải đủ7file nén, đổi chi tiết/nhẹ đạt.
Preview riêng: http://127.0.0.1:8786/compare.html và `/viewer.html`.
Trong QA thay hình học cùng camera:median110.7→25.7ms, còn spike56.4ms từ nước;
không cam kết60FPS hay thời gian mạng thật (QA dùng decoded twins).
[Spec](docs/superpowers/specs/2026-11-13-plaza-performance-design.md),
[plan](docs/superpowers/plans/2026-11-13-plaza-performance.md),
[QA](output/plaza-performance/QA.md). Bốn gate exit0:824tests/94files, lint0errors/
28warnings QA cũ, build11/11. QA browser đã đóng; normal preview loopback3004 bật
lại, gallery8786(session64037) độc lập. Không commit/push/deploy.

## Sửa dáng Cổng Mây và chụp tám hướng — 2026-11-13

Owner chỉ ra hai thân đá trông như hình trụ sau sân giảng. Đã sửa phần đá trên
Cổng Mây: thân thu dần, đỉnh nghiêng lệch, giữ vai và bậc đá rộng. Nâng chân từ
-60 lên -50, scale5/yaw offset+.1; bearing176°/radius420m giữ nguyên. Cây, phế
tích và bệ dưới giữ nguyên geometry/transform; dây leo và đá vụn trên đỉnh đi
theo mặt đá. Chín model khác và toàn bộ nguồn V6 giữ nguyên hash.

Cổng Mây vẫn41.880 triangles; tổng532.602 triangles/16vị trí, GLB10.741.224bytes.
Đã xem ảnh trước/sau cùng camera, tám hướng tầm mắt + tám hướng toàn cảnh,
ngày/hoàng hôn/đêm và viewport390×844. [Gallery](http://127.0.0.1:8785/overview.html),
[so sánh](http://127.0.0.1:8785/compare.html), [QA](output/mountain-v6-silhouette/QA.md).
Tự rà riêng; không agent phụ. Focused15/15; typecheck/lint/build exit0,
823tests/94files. Lint còn28warnings QA cũ sau bỏ3biến thừa trong script mới.
Preview loopback3004 đã bật lại (dev session26076); smoke đủ10mẫu/16vị trí,
đúng hash Cổng Mây, không shader lỗi. QA browser đã đóng. Gallery loopback8785
(session38727). Không commit/push/deploy; chưa đo lại FPS hay điện thoại thật.

## Núi V6 đã thay bộ cũ trong Plaza — 2026-11-13

Owner yêu cầu thay và bố trí bao quanh để preview. Cả `/world` và `/world?plaza=study`
dùng 10 GLB V6 (ban đầu byte-identical, Cổng Mây được sửa theo mục trên),
16 vị trí (4 gần/4 trung/8 xa), 532.602
triangles đặt; tỉ lệ đều, có khe trời, giữ đảo/kiến trúc/camera. Thạch Linh đã dời
để hộp bao cách Song Đỉnh và mọi đảo ít nhất 12m. Tuyết chỉ trên ba núi đá xa;
lá giữ normal V6. Gỡ nhánh/asset runtime Vân Sơn 05 cũ, giữ nguồn lịch sử.

Bốn gate đạt: typecheck, lint (28 warnings QA cũ), toàn suite 822/822 trong94 file,
build11/11. Focused23/23.
Kiểm visual ngày/chiều/đêm/mưa/mobile, bốn góc đi bộ/cận núi; ba vòng chuyển cảnh
không tăng dần GPU resources; lỗi một model giữ chín mẫu khác, reload khôi phục đủ.
Toàn cảnh vẫn ~115ms/frame do cảnh đảo chi tiết hiện có; chưa đạt 60FPS, chưa đo
điện thoại thật. [QA](output/mountain-v6-integration/QA.md),
[spec](docs/superpowers/specs/2026-11-13-plaza-mountains-v6-design.md),
[plan](docs/superpowers/plans/2026-11-13-plaza-mountains-v6.md).
Preview tại thời điểm tích hợp bằng bypass trên127.0.0.1:3004, smoke đạt
10mẫu/16vị trí, không shader lỗi; QA browser đã đóng. Không commit/push/deploy.

## Thử Vân Sơn 05 trong Plaza — lịch sử, đã được V6 thay thế

Owner yêu cầu đặt thử mẫu núi 05 với kích thước/xa gần khác nhau. Study `/world?plaza=study` nay hiển thị 5 núi/3 lớp (~185–210 / 410–430 / 690m), giữ `/world` thường để đối chiếu bộ cũ. Ba GLB LOD riêng dưới `public/world/mountain-study/`, tổng 4,03MB / 183.555 triangles đặt, source 05 nguyên hash. Dùng chung loader/instancing/haze và ownership cũ; không thêm tuyết. Góc toàn cảnh mới rộng hơn; sửa sky-center khi quay lại từ đi bộ/map swap để không far-clip dome. [QA](output/van-son-plaza-trial/QA.md), [plan](docs/superpowers/plans/2026-11-12-van-son-plaza-trial.md). Chưa duyệt bố cục chính thức, không commit/push/deploy.

## Bộ đảo bay mới đã thay trong Plaza — 2026-11-12

Owner đã duyệt sáu V2 và yêu cầu thay/gỡ asset đảo cũ. Vườn Gió v18 thay Mạch Nguồn;
sáu ID còn lại giữ nguyên, GLB runtime được thay bằng đúng bản đã duyệt. Gỡ GLB
Mạch Nguồn cũ và runtime nước cũ. Adapter typed mới bảo toàn cỏ/lá, nước từng tầng,
đèn/đom đóm/spray theo clock app. Giữ nguyên các sửa Plaza study đang có.

Preview local: http://127.0.0.1:3004/world?plaza=study (ngày, toàn cảnh),
http://127.0.0.1:3004/world (đi bộ). `BETTERME_DEV_AUTH_BYPASS=true` chỉ local.
Nguồn mới: `D:/Dev/Projects/BetterMe/output/floating-islands-v2/`; snapshot/source
lịch sử giữ làm dependency chỉ đọc. [QA và kết quả](output/island-v2-integration/QA.md),
[spec](docs/superpowers/specs/2026-11-12-island-v2-integration-design.md),
[plan](docs/superpowers/plans/2026-11-12-island-v2-integration.md).
Không commit/push/deploy; chưa benchmark điện thoại thật hoặc tạo LOD.

## Hoàn thiện lần lượt: mục 5 — hai hành lang quanh đình — 2026-11-12

Chủ dự án cho tiếp tục sau lượt đại đình. Hoàn thiện riêng west/north-cloister:
mái dài có sống ngang, shell kín16 cm, góc vút nhẹ, đường ngói/diềm; rui,
giằng, đấu và khung đỡ mái; chân đá3 lớp, đai đồng, viền lát phẳng. Giữ tâm,
sànY4,6 cột/dãy, ghế và tuyến đi. Dãy bắc cao4.8 m (tăng0.7 m) để mái giật
ở góc tây-bắc; dãy tây4.1 m. Chân tây nam sát lối cong giữ0.6 m; còn lại0.74 m.

- Mới: `src/components/world/plaza-study-cloister.ts` +10tests;
  `src/lib/world/plaza-study-cloister.ts` dùng chung vị trí/size/collider.
  Tích hợp west/north-only trong study architecture/config; chỉ đổi chiều
  cao north ở layout. Hall/pergola/gate/observatory/terrain giữ nguyên.
- Focused51/51 trong7file. Red trên bản thô; tự rà riêng bắt thêm dầm/gối
  xuyên mái, có ray và vertex-envelope red→green trước sửa. Vỏ mái và
  diềm đúng hướng;20 mẫu góc nối cách>280 mm, shell160 mm. Camera/đầu/ngưỡng
  và tuyến cũ được kiểm. Không subagent/reviewer.
- Tổng92,217 triangles/7batches;2hành lang<=16k, cap96k ghi rõ trong spec.
  Không texture/dependency mới. Đi thật từ lối dốc vườn qua hành lang tây,
  dãy bắc ra cầu, cửa bên từ đình, cột chặn, nhảy/đápY4. Xem mái/góc nối/
  dưới mái/chân cột, ngày/chiều/đêm,1440×900 và390×844. Không overflow/
  shader lỗi;3vòng lifecycle ổn định, cảnh gốc/live/near=.2 khôi phục.
- Bốn gate exit0: typecheck; lint0errors/28warnings QA cũ; Vitest806tests/
  90files với `--maxWorkers=4`; build11/11. Dừng đúng dev tree19776/35532/
  44632/23448/19616, xác nhận port3004 đóng trước build. Preview đã bật lại
  loopback3004, dev session45512. Smoke vào hành lang tâyY4 đạt;3vòng sau
  restart giữ study179geometry/122texture, personal93/29, cảnh gốc/live/
  near=.2 khôi phục, page exceptions0. QA đã đóng. Không commit/push/deploy;
  next-env unstaged.

Spec/plan: `docs/superpowers/{specs,plans}/2026-11-12-plaza-cloister-refinement.md`.
Evidence: `output/playwright/plaza-cloisters/` (`cloister-hero.jpg`, `cloister-west.jpg`,
`gates.log`, `focused-final.log`, `navigation.log`, `visual-final.log`). Lưu ý:
second before capture bị HMR, đã đổi thành iteration1-*; baseline so sánh hợp
lệ lấy pavilion-hero.jpg của lượt trước, cùng camera academy-court.jpg hiện tại.
Preview http://127.0.0.1:3004/world?plaza=study. Chưa benchmark điện thoại thật,
touch walking và lighting cuối. Hạng mục gợi ý tiếp: đài thiên văn, từng cái một.

## Hoàn thiện lần lượt: mục 4 — đại đình đọc sách — 2026-11-12

Chủ dự án thích cầu cong và cho phép tiếp tục từng hạng mục. Lượt này chỉ
hoàn thiện grand-pavilion trên sân Y4: mái hai tầng cong/góc vút nhẹ, vỏ mái
kín dày18 cm, đường ngói/sống mái, diềm đồng mảnh, rui gỗ, khung đỡ mái,
đấu/công-xôn chồng lớp, giằng chéo, chân đá nhiều lớp và đai cột. Giữ tâm,
footprint, bốn vị trí cột, đường đi, ghế/bàn, các công trình còn lại.

- Mới: `src/components/world/plaza-study-pavilion.ts` và test; module
  `src/lib/world/plaza-study-pavilion.ts` chia sẻ cột/chân/collider. Tích hợp
  grand-only trong study geometry/config, lake/cloister builder không đổi.
- Ban đầu4 test thất bại trên blockout; tự rà riêng bắt thêm diềm mái ngược
  mặt và thiếu gối đỡ nối khung lên mái, có red→green riêng.8 test pavilion;
  focused41/41 trong6 file. Không subagent/reviewer.
- Tổng80,257 triangles/7 batches, asset<=14k; cap study82k ghi rõ trong spec.
  Đã giảm3,072 triangles bằng rui hộp nhỏ trước khi thêm đủ khung đỡ. Không
  thêm texture/dependency, không sửa terrain, cây, nước hoặc ánh sáng.
- Browser đi cả4 cửa, từ cầu thang xuyên đình ra cầu, chân cột chặn, nhảy/đáp
  Y4. Tuyến QA cửa tây đầu tiên va ghế cũ; đổi tuyến qua trục z=-2, giữ ghế.
  Xem roof/underside/foot, ngày/chiều/đêm, desktop1440×900/mobile390×844.
  Shader lỗi0, không overflow; ba vòng chuyển cảnh ổn định, cảnh gốc/live/
  near=.2 khôi phục, page exceptions0.
- Bốn gate exit0: `pnpm typecheck`; `pnpm lint`0errors/28warnings QA cũ;
  `pnpm vitest run --maxWorkers=4`796tests/89files; `pnpm build`11/11.
  Dừng đúng cây dev pnpm37148/cmd12284/Next46308/server33372/worker27852
  trước build; port3004 đóng. Bật lại preview local-only; dev session67336.
  Smoke sau build đi từ sân lên đình, đạtY4. Ba vòng lifecycle mới sau restart
  giữ study179geometry/122texture, personal93/29; page exceptions0, cảnh gốc
  khôi phục. Console cuối0errors/4warnings Three trong lượt chuyển cảnh. QA browser đã đóng.

Spec/plan: `docs/superpowers/{specs,plans}/2026-11-12-plaza-pavilion-refinement.md`.
Evidence: `output/playwright/plaza-pavilion/` (`before-after.jpg`, `pavilion-hero.jpg`,
`gates.log`, `navigation-final.log`, `visual-final.log`, `restart-smoke.log`).
Preview http://127.0.0.1:3004/world?plaza=study. Chưa benchmark điện thoại thật,
touch walking/lighting cuối chưa làm. Không commit/push/deploy; giữ mọi thay
đổi trước và next-env.d.ts unstaged. Gợi ý hạng mục sau: hai hành lang nối đình,
rồi đài thiên văn; tiếp tục từng cái một theo phản hồi chủ dự án.

## Sửa dáng cầu — vồng nhẹ, 2026-11-11

Chủ dự án thấy mặt cầu thẳng/dốc đều quá cứng, duyệt đề xuất vồng nhẹ rồi
yêu cầu sửa. Đã đổi riêng sky-bridge sang profile cong chung trong
`studyConnectorHeight`: easing hai đầu + vồng850 mm giữa nhịp, midpointY6.35,
hai đầuY4/7 tiếp tuyến ngang, đỉnh nhẹ<7.06. Giữ nhịp13×4 m, vật liệu/hoa văn,
vị trí và toàn bộ hạng mục khác. Không dời thêm cây hoặc sửa sân.

- Mesh ván, lõi kín52 đoạn, tay vịn/dầm hông26 đoạn, trụ, sườn đỡ, physics,
  camera và colliders đều theo cùng cao độ. Tay vịn dùng mesh liền kín để
  không hở ở chỗ cong. Chân đá sâu thêm100 mm, dầm hông thu400 mm dưới chân
  đá440 mm; ray bắt2 mặt chồng trước sửa →1 mặt sau sửa, hết sọc nhấp nháy.
- Focused33/33;9 test bridge. Tự rà riêng, không subagent/reviewer. Tổng
 67,645 triangles/7 batches (+2,808 so bản thẳng), cap study68k được ghi trong
  spec sửa dáng để chứa hình học cong; không thêm texture/dependency.
- Đi thật3 làn hai chiều, nhảy/đáp mặt cong, rail chặn. Ba vòng lifecycle
  giữ study179 geometry/122 texture, personal93/29; cảnh gốc/live/near=.2
  khôi phục, page exceptions0. Đã xem cùng góc trước/sau, hai đầu, chi tiết,
  ngày/chiều/đêm và mobile390×844; shader lỗi0, không overflow.
- Bốn gate exit0: `pnpm typecheck`; `pnpm lint`0 errors/28 warnings QA cũ;
  `pnpm vitest run --maxWorkers=4`788 tests/88 files; `pnpm build`11/11.
  Dừng đúng pnpm30384/cmd16856/Next20584/server47552/worker39044 trước build.
  Preview loopback3004 đã bật lại, dev session52393 còn chạy.
- Smoke sau build: lênY7/xuốngY4, nhảyY7.383 và đáp, rail chặn đạt. Ảnh mới
  đã kiểm tra; QA browser đóng. Console cuối0 errors/2 Three.js warnings cũ;
  lần mở đầu vẫn có favicon404. Chưa benchmark điện thoại thật/touch walking.

Spec: amendment đầu `docs/superpowers/specs/2026-11-11-plaza-bridge-refinement.md`.
Plan: `docs/superpowers/plans/2026-11-11-plaza-bridge-curve-fix.md`.
Evidence: `output/playwright/plaza-bridge-curve/` (`before-after.jpg`,
`bridge-hero.jpg`, `bridge-side.jpg`, `gates.log`, `restart-smoke.log`). Preview
http://127.0.0.1:3004/world?plaza=study. Không commit/push/deploy, giữ worktree
và mọi thay đổi trước. Các kết quả bên dưới là lịch sử bản cầu thẳng.

## Hoàn thiện lần lượt: mục 3 — cầu lên đài ngắm cảnh — 2026-11-11

Chủ dự án thích cầu thang, cho phép tiếp tục từng hạng mục cùng cách làm.
Lượt này hoàn thiện riêng sky-bridge:26 ván mép vát,10 trụ chân đá/chóp xanh
xám, tay vịn liền và hoa văn hình thoi thoáng; hai sườn gỗ cong, giằng ngang,
thanh đỡ đứng và gối đá ăn vào bờ. Giữ nhịp13 m, mặt đi4 m, Y4→7 và hai đầu.

- Mới: `src/lib/world/plaza-study-bridge.ts` (frame/collider),
  `src/components/world/plaza-study-bridge.ts` (mesh), test cùng tên,
  `plaza-study-joinery.ts` tách nguyên hai helper của thang để dùng chung.
  Tích hợp vào study geometry/config; cầu thang và `/world` gốc giữ nguyên.
- Hai sửa khoảng hở cục bộ: cây khối1(-16.2,-11)→(-15.2,-8.8) để thân/tán
  không xuyên rail; bỏ góc sân trời(-12,-17) vốn đè lên mép cầu tới0.798 m.
  Không dời đích đến hay thay cao độ. Mạch lát đầu trên kế thừa cao22.6 mm
  trong20 mm cuối, cho tolerance25 mm; phần deck còn lại<=2 cm.
- Sáu test bridge dùng scene raycast/physics/camera; ray bắt lỗi cây/góc
  sân, kiểm tra endpoint bắt collider thiếu phần chân trụ nhô240 mm trước
  khi sửa. Focused30/30. Tự rà riêng, không giao reviewer/subagent.
  Tổng64,837 triangles/7 batches (+2,895 so cầu thang).
- Browser đã đi thật3 làn lên/xuống, nhảy/đáp trên cầu, dừng ở rail; kiểm
  tra front/side/top/underside/detail, ngày/chiều/đêm, mobile390×844. Shader
  lỗi0, không overflow. Ba vòng scene ổn định study179 geometry/122 texture,
  personal93/29; `/world` gốc/live/near=.2 khôi phục; page exceptions0.
- Bốn gate mới exit0: typecheck; lint0 errors/28 warnings trong QA cũ
  (gồm restart-smoke của cầu thang); Vitest785 tests/88 files với4workers;
  build11/11. `output/playwright/plaza-bridge/gates.log`. Dừng đúng dev tree
  pnpm25016/cmd45704/Next25052/server31820/worker35292, xác nhận port đóng
  trước build. Đã bật lại loopback3004; dev session3026 đang phục vụ preview.
- Smoke sau build đi lại3 làn hai chiều đạt; nhảyY6.44 và đáp, rail chặn.
  Ảnh mới đã kiểm tra; QA browser đóng. Console lần mở đầu có favicon404;
  lần cuối có2 lỗi từ Open-Meteo CORS/network, không phải geometry/shader.
  Ánh sáng preview cố định và các kiểm tra cầu vẫn hoạt động. Không sửa
  dịch vụ thời tiết ngoài phạm vi. Chưa đo điện thoại thật/touch walking.

Spec/plan: `docs/superpowers/{specs,plans}/2026-11-11-plaza-bridge-refinement.md`.
Evidence: `output/playwright/plaza-bridge/`; ảnh chính `bridge-hero.jpg`,
`bridge-front.jpg`, `bridge-detail.jpg`; `restart-navigation.log`,
`restart-console.log`, `final-browser.log`, `visual.log`. Preview vẫn là
http://127.0.0.1:3004/world?plaza=study. Không commit/push/deploy; giữ mọi thay
đổi trước, `next-env.d.ts` unstaged. Công trình/nước/cây/ambience khác vẫn thô.

## Hoàn thiện lần lượt: mục 2 — cầu thang học viện — 2026-11-11

Chủ dự án duyệt hướng nghiên cứu và yêu cầu thực hiện để xem. Đã dựng riêng
academy-stair: mép bậc vát18mm, mạch ghép thưa, tường hông/gờ đá liền,12 trụ
có chân đế/nắp xanh xám, tay vịn gỗ và thanh đứng thoáng. Lan can nối đúng
hai đầu chiếu nghỉ. Giữ7×12m/Y0→4 và các tuyến nối/cao độ đã chốt.

- Files mới: `src/lib/world/plaza-study-stair.ts` (vị trí/va chạm),
  `src/components/world/plaza-study-stair.ts` (mesh), test cùng tên.
  Tích hợp vào study geometry/config; không đổi cảnh `/world` gốc.
- Đường lát cũ cắt ngang lan can mới: thêm một control point(-22,23) để
  vào miệng thang, giữ hai đầu và chiều rộng; thêm apron lát7×1.3m. Không
  dời công trình/cây/địa hình. Tự rà riêng; sửa mặt gờ/tường chồng nhau bằng
  regression raycast RED→GREEN. Focused24/24. Tổng61942 triangles/7 batches
  (tăng3096 so baseline nền58846, gồm apron2 triangles).
- Browser: front/side/detail/top, ngày/chiều/đêm/mobile390×844; shader lỗi0,
  không overflow. Đi thật3 làn cả2 chiều; dừng ở railx=-21.95, nhảy/đáp
  chiếu nghỉY2. Ba vòng public/personal ổn định179 geometry/122 texture và
  93/29; cảnh gốc/live/near=.2 khôi phục, page exceptions0.
- Bốn gate pass trong chuỗi mới exit0: typecheck, lint0 errors/27 warning
  scriptQA (26 cũ+1 scriptresearch), Vitest779 tests/87 files với4workers,
  build11/11. `output/playwright/plaza-stair/gates.log`; lỗi type ở test
  trong lượt gate đầu đã sửa bằng `collectMapColliders`, log đầu giữ riêng.
- Đã dừng đúng dev tree26332/12068/33008 cùng worker trước build; khởi động
  lại loopback3004 với bypass local. Không commit/push/deploy, giữ các thay
  đổi chưa commit từ các lượt trước; `next-env.d.ts` vẫn để unstaged.
- Smoke sau build đi thật lênY2→4 và xuốngY0 đạt (`restart-smoke.log`). Dev
  session2272 còn chạy cho chủ dự án xem; xác minh PID mới trước khi dừng.

Spec/plan: `docs/superpowers/{specs,plans}/2026-11-11-plaza-stair-refinement.md`.
Evidence: `output/playwright/plaza-stair/`. Mới hoàn thiện chiếc thang chính;
lan can khu khác, đèn, cây/hoa, nước và ambience giữ trạng thái trước. Chưa
đo hiệu năng trên điện thoại thật; điều khiển đi bộ cảm ứng chưa triển khai.

## Nghiên cứu asset cầu thang — 2026-11-11

Chủ dự án yêu cầu research thêm trước khi hoàn thiện cầu thang. Đã khảo sát
trang và hình của các bộ temple/stair trên Fab, Kenney và kiến trúc Nikko;
ghi nguồn, định dạng, giới hạn và đề xuất trong
`docs/research/2026-11-11-plaza-stair-assets.md`. Bảng tham khảo local:
`output/playwright/plaza-stair-research/board.html`.

Đề xuất dựng riêng bộ thang đá kem–gỗ nâu–nắp kim loại xanh xám, ưu tiên
mép vát, chân/đầu trụ và lan can nối đúng chiếu nghỉ. Giữ 7×12 m, Y0→4,
chiếu nghỉ Y2; chỉ hoàn thiện academy-stair trước. **Đây là đề xuất chưa
được duyệt, chưa triển khai**, không phải asset đã hoàn thành. Không mua,
tải model hoặc sửa scene; không commit/push. Gate 774 tests bên dưới thuộc
lượt nền trước, không phải bằng chứng cho thiết kế thang mới.

## Hoàn thiện lần lượt: mục 1 — địa hình và nền sân — 2026-11-11

Sau khi chốt bản thô03, chủ dự án yêu cầu thực hiện từng hạng mục một.
Lượt này tập trung nền/foundation; giữ quần thể và bốn cao độ, chưa làm asset
kiến trúc/cây/nước. Vẫn dùng worktree `plaza-landscape-v1` và preview
**http://127.0.0.1:3004/world?plaza=study**. Không commit/push/deploy.

- Khối nền dốc/cầu thang liền kín, top đúng sampler; cầu chéo vẫn là nhịp cầu.
  Khép mép đá với sàn thấp và mặt dưới đảo. Tường đỡ xuống đúng tầng dưới,
  phần cửa nối không còn nắp dày lấn bậc cuối. Đường lát cắt theo cùng cao độ,
  không kéo dải xuống vách hoặc nổi lên trên dốc.
- Mặt lát đá, mạch xây và lớp đá nền dùng shader riêng cho study với vertex
  mask; kiến trúc/đá của cảnh cũ giữ vật liệu. **58,846 triangles / 7 batches**.
- Hai sửa nhỏ để thông lối: góc tây sân đọc sách x=-36→-38.1 ở z9, đủ
  bề ngang dốc4.2m (vá7.35m²); cây khối1 x=-17→-16.2,z=-11 để tránh lấn
  lối phải cầu. Không đổi điểm đầu/cuối đường nối hay vị trí công trình.
- Test raycast bắt các lỗi trước khi sửa; focused **19/19**. Bộ di chuyển
  kiểm tra cả5 đường nối,2 chiều,3 làn. Đã đi thật toàn vòng và xuống dốc
  theo mép x=-37.4; nhảy,portal round-trip đạt. Xem gần nền/dốc/bậc/chân đài,
  overview/ngày/chiều/đêm/mobile390×844: không overflow, shader lỗi0.
- Ba vòng public/personal GPU ổn định179 geometry/122 texture và93/29;
  cảnh cũ/live/near=.2 khôi phục, page exception0. Tự rà riêng các mặt nối,
  móng và mask vật liệu. Các chi tiết còn thô khác thuộc lượt sau.
- **Bốn gate đạt**, chuỗi exit0: `pnpm typecheck`, `pnpm lint` (0 lỗi/26
  warning QA cũ), `pnpm vitest run --maxWorkers=4` (**774 tests/86 files**),
  `pnpm build` (**11/11**). Đã dừng đúng dev tree pnpm46484/Next47608/
  server25524 và xác nhận port đóng trước build; dev đã bật lại loopback3004.
- Evidence local/ignored `output/playwright/plaza-ground/`: `gates.log`,
  `focused-green.log`, các log RED→GREEN, `navigation.log`, `visual.log`,
  `final-browser.log`; ảnh `stair-side.jpg`, `ramp-side.jpg`, `paving.jpg`,
  `overview-day.jpg`. Spec/plan: `2026-11-11-plaza-ground-refinement.md` dưới
  `docs/superpowers/specs/` và `docs/superpowers/plans/`.
- Smoke sau build: đi lên/xuống mép dốc x=-37.457, đạt4 m rồi về0 m,
  trở lại overview. `restart-smoke.log`; QA đã đóng, preview vẫn chạy.
- Mục tiếp theo có thể là tường/lan can/cầu thang về chi tiết kiến trúc,
  rồi hoàn thiện từng công trình; chưa tự triển khai các mục này trong lượt1.

---

## Plaza quần thể sân vườn 03 — 2026-11-11, hiện hành

**Đã được chủ dự án chốt làm bản thô ngày 2026-11-11.** Phản hồi: tổng quan
khá đẹp; còn nhiều lỗi nhưng chấp nhận ở giai đoạn thô. Giữ bố cục, bốn cao độ,
hệ đường nối và các khu chức năng của bản 03 làm cơ sở hoàn thiện tiếp.
Đây là duyệt hướng thiết kế/bố cục, không phải xác nhận hết lỗi hay sẵn sàng
production. Chủ dự án chưa chỉ rõ từng lỗi; cần rà và ghi nhận khi bắt đầu
giai đoạn hoàn thiện, không tự coi các lỗi đó là đã sửa. Chưa có yêu cầu làm
asset/fix mới hoặc commit/push trong lượt chốt này; chỉ cập nhật tài liệu.

Chủ dự án muốn kiến trúc và các khu vực đẹp, phức tạp, đẳng cấp hơn. Tiếp tục
bản polygon trong cùng worktree `.worktrees/plaza-landscape-v1`, không đổi
checkpoint **`e3f606e`**, không commit/push/merge/deploy. Preview vẫn là
**http://127.0.0.1:3004/world?plaza=study**; `/world` giữ cảnh đã duyệt.

- Thêm hai cánh hành lang quanh đại đình đọc sách, đài thiên văn bát giác mở
  trên tầng +7 với mô hình thiên cầu treo, giảng đường vườn ba hàng ghế cung,
  hồ tĩnh trước cầu thang, bồn cây giật cấp hai bên, thác nước ba bậc ven hồ,
  giàn cây/hành lang gỗ và cổng đón. Tinh chỉnh vì kèo, diềm mái, chân tường.
- Giữ bốn cao độ và năm đường nối; không đổi terrain/physics lượt này.
  Lối lên cầu đi qua giữa hành lang bắc; thêm nhánh vào giảng đường và hồ tĩnh.
  Di chuyển giảng đường từ (-23,44) tới **(-23,42)** vì mép sân chéo cắt qua
  móng ghế ngoài. Test foundation giữ tất cả ghế/cột trên đúng cao độ.
- Tệp mới `src/lib/world/plaza-study-architecture.ts` chia sẻ vị trí vật thể
  với colliders; `src/components/world/plaza-study-architecture.ts` dựng khối
  vào cùng material batches. Không thêm dependency hay framework dựng cảnh.
- Đã đi thật bằng phím qua các khu mới, cầu hai chiều, dốc, nhảy/hạ xuống,
  cổng personal rồi về. Sau đó chỉ tinh chỉnh mái/ghế và dịch giảng đường.
  Đã xem overview/ngang mắt, ngày/chiều/đêm, desktop1440×900/mobile390×844.
  **60,611 triangles / 7 batches**, shader lỗi0, không overflow.
- Ba vòng public/personal + cùng camera sweep: study179 geometry/122 texture,
  personal93/29 ổn định. Cảnh cũ/live/near=.2 khôi phục đúng, page exceptions0.
  Tự rà riêng collider/geometry, nền móng, headroom, dispose, scope.
- Bằng chứng local/ignored: `output/playwright/plaza-academy/`, gồm ảnh
  `before-overview.jpg`, `overview-day.jpg`, `lecture.jpg`, `cloister.jpg`,
  `pergola.jpg`, logs `navigation.log`, `visual.log`, `final-browser.log`.
  Spec `docs/superpowers/specs/2026-11-11-plaza-academy-study.md`.
- Bố cục polygon đã chốt; chi tiết và chất lượng runtime còn cần hoàn thiện.
  Ghế chưa có ngồi, thác nước tĩnh;
  chưa làm asset final, âm thanh/chim/bướm/touch walking. Không benchmark
  điện thoại thật hay xác minh auth/sync bằng bypass. Không stage `next-env.d.ts`.
- Kiểm tra: typecheck đạt; lint0 lỗi/26 warning QA cũ; `pnpm vitest run
  --maxWorkers=4` **767 tests / 85 files đạt**; `pnpm build` exit0, **11/11**.
  Hai lượt `pnpm verify` worker mặc định gặp timeout5s ở các bài UI; không
  được ghi là verify exit0. Không nới timeout/đổi runner config. Bài route
  đã bỏ phép tính lại cao độ cho từng collider, giữ đầy đủ coverage.
  Logs `verify-timeout.log`, `verify-default-workers.log`, `full-tests.log`,
  `build.log`. Đã dừng đúng dev tree pnpm47916/Next4484/server26380 trước build.
- Dev đã bật lại loopback3004. Browser smoke mới đi qua cổng, vào giảng đường
  sau chỉnh cuối, va chạm hồ tĩnh dừng đúng z31.15, trở lại overview đạt.
  `restart-smoke.log`; session QA đã đóng. Xác minh PID hiện tại trước khi dừng.

---

## Plaza giật cấp 02, tham khảo Inazuma — 2026-11-11, lịch sử

Chủ dự án đã đồng ý hướng sân cao thấp và yêu cầu nâng cấp bản polygon,
tham khảo “view of inazuma genshin impact city” ở quy mô plaza giáo dục.
Đã xem ảnh city view HoYoLAB qua Bing: lấy cách chia sân, cầu thang/chiếu nghỉ,
mái chòi nhiều lớp và các góc nhìn; không nhập asset của game.

- Tiếp tục worktree `.worktrees/plaza-landscape-v1`, branch
  `codex/plaza-landscape-v1`; checkpoint cảnh đã duyệt **`e3f606e`** còn nguyên.
  Preview **http://127.0.0.1:3004/world?plaza=study**, `/world` là cảnh đã chốt.
- Bốn cao độ: vườn hồ −2 m, sân chung 0 m, đại đình đọc sách +4 m,
  đài ngắm cảnh +7 m. Cầu thang 20 bậc có chiếu nghỉ, đường dốc vườn,
  cầu chéo lên đài và hai đường xuống hồ. Chân núi polygon bất quy tắc,
  lan can thấp, 3 bàn đọc ngoài trời. Hồ hiện 15 × 22 m.
- `plaza-study-terrain.ts` là nguồn chung cho sàn, vật thể, di chuyển và
  camera. Physics/camera nhận sampler tùy chọn; map phẳng giữ hành vi cũ.
  Chỉ một mặt sàn mỗi XZ; chưa hỗ trợ đi dưới cầu/tầng chồng nhau.
- Đã đi thật bằng phím: lối vào → chiếu nghỉ +2 → đình +4 → nhảy/hạ xuống
  → cầu lên +7 và trở về → dốc vườn 0 → hồ −2 → vòng đông → dốc bắc 0
  → cổng personal rồi quay lại. Sửa khe tam giác ở đầu cầu chéo bằng cách
  nối mép đài đúng toàn bộ bề ngang cầu; có regression RED→GREEN.
- Đã xem 1440×900 overview và ngang mắt, ngày/chiều/đêm, 390×844 không tràn.
  **46,819 triangles / 7 batches**, shader lỗi 0. Ba vòng public/personal:
  GPU study **179 geometry / 122 texture**, personal **93/29**, ổn định.
  Cảnh đã chốt khôi phục landscape cũ/live/near=.2; không page exception.
  Hai warning Three.js Clock/shadow-map cũ vẫn còn.
- **`pnpm verify` exit 0** sau khi dừng đúng cây dev và xác nhận port đóng:
  typecheck đạt, lint **0 lỗi / 26 warning QA cũ**, **765 tests / 85 files**,
  build **11/11**. Geometry/terrain focused **10/10** sau sửa đầu cầu.
  Tự rà riêng diff, scope, đường đi, camera, geometry và resource lifecycle.
  Detector đã chạy một lần trong lượt, `[]`; không chạy lại chỉ vì chỉnh nhỏ.
- Bằng chứng local/ignored: `output/playwright/plaza-terraces/` gồm
  `navigation.log`, `visual.log`, `final-browser.log`, `verify.log`,
  `bridge-seam-{red,green}.log`, `overview-day.jpg`, `lake.jpg`.
  Spec: `docs/superpowers/specs/2026-11-11-plaza-terraced-study.md`.
- Vẫn là bản bố cục để chủ dự án đánh giá. Cây/hoa/kiến trúc/nước final,
  âm thanh, chim/bướm, ngồi ghế và touch walking làm sau. Chưa benchmark
  điện thoại thật; bypass local không xác minh auth/sync. Không commit/push/
  merge/deploy lượt này. `next-env.d.ts` do dev tự đổi, không stage.
- Dev đã khởi động lại trên loopback3004 sau build; browser smoke mới tải
  avatar ready, di chuyển từ [0,0,40] tới [0,0,38.205], đổi về overview đạt.
  Log `restart-smoke.log`; console chỉ favicon404 cũ và hai warning Three.js.
  Session QA đã đóng. Kiểm tra ownership process hiện tại trước khi dừng dev.

---

## Bản thử bố cục Plaza phẳng — 2026-11-11, lịch sử (đã thay bằng bản 02)

Sau checkpoint **`e3f606e`**, chủ dự án yêu cầu dựng thử plaza rộng trên núi:
vườn/đường dạo, chòi hùng vĩ, hồ/đài nước, ghế và view đẹp. Cho phép polygon;
asset chi tiết, tiếng môi trường và chim/bướm làm sau. Đây là bản thử phục vụ
thảo luận, **chưa phải thiết kế được duyệt hay kế hoạch chính thức**.

- Worktree `.worktrees/plaza-landscape-v1`, branch `codex/plaza-landscape-v1`.
  Preview **http://127.0.0.1:3004/world?plaza=study**; `/world` giữ cảnh đã chốt.
  Dev chỉ loopback, bypass local không authentication. Xác minh process trên
  port 3004 thuộc checkout này trước khi dừng; không dùng PID lịch sử bên dưới.
- Bố cục khoảng 80 × 80 m: sân tròn 25 m, đại đình tây, chòi nhỏ/hồ 18 × 26 m
  phía đông, vườn tây nam, lối vào nam, view núi phía bắc; 13 ghế, 21 cây khối.
  Có Toàn cảnh/Đi bộ, chọn ánh sáng. Sàn Y=0; vách núi/tường bậc nằm dưới sàn.
- Tệp chính: `plaza-study-layout.ts`, `plaza-study-config.ts`,
  `plaza-study-geometry.ts`, `public-plaza-study.tsx`. Query chỉ chọn study cho
  public; personal giữ config cũ. Núi/đảo/sky đã duyệt giữ vị trí/vật liệu.
- Browser đã đi thật qua sân, vào đại đình, cổng personal rồi về; va chạm hồ
  và đài nước đúng. Test lấy đường cong render kiểm tra với radius nhân vật.
  Đã xem desktop 1440 × 900, overview 390 × 844, ngày/hoàng hôn/đêm.
- `pnpm verify` exit 0: typecheck đạt, lint 0 lỗi / 26 warning QA cũ,
  **758 tests / 84 files**, build 11/11. Focused 15/15; detector `[]`.
  Tự rà scope/navigation/geometry/resource/default-world. Bằng chứng
  `output/playwright/plaza-study/`; mới 26,590 triangles / 7 batches.
- Sau build, ba vòng public/personal + sweep camera giữ GPU ổn định:
  study 180 geometry / 122 texture, personal 93 / 29. Link cảnh đã chốt trả về
  landscape cũ, môi trường live, near=.2; không còn study. Không page exception;
  console chỉ favicon404 cũ. Chi tiết `final-browser.log`. Dev đã chạy lại.
- Spec tạm: `docs/superpowers/specs/2026-11-11-plaza-layout-study.md`.
  Chưa làm âm thanh, sinh vật, cây/hoa/kiến trúc final, ngồi ghế hay slope
  physics. Chưa benchmark điện thoại thật/touch walking. Chờ phản hồi bố cục.
- Không commit/push/merge/deploy bản thử. `next-env.d.ts` do dev tự đổi path;
  không đưa thay đổi incidental này vào commit sau.

---

## Checkpoint cảnh đã duyệt; tiếp theo bàn ý tưởng Plaza — 2026-11-11

Chủ dự án đã xem bản sửa núi/sương/đảo phụ, đánh giá **8.5/10** và yêu cầu
commit checkpoint Git trước khi làm phần sân Plaza. Checkpoint bao gồm toàn bộ
runtime `/world`, nhân vật/camera, bầu trời, landscape, asset đảo/núi/thảm thực vật,
tests và tài liệu đang dùng trên nhánh `codex/plaza-landscape-v1`.
Ảnh/log/source-cache trong `output/` không thuộc checkpoint; các asset runtime
đã nằm trong `public/`. Không push/merge/deploy trong bước này.

**Yêu cầu tiếp theo của chủ dự án:** cùng brainstorm ý tưởng Plaza trước, rồi
mới lập kế hoạch thực thi. Chưa duyệt thiết kế mới, chưa bắt đầu dựng asset hay
thay đổi sân. Spec cũ là bối cảnh để trao đổi, không thay thế lần chốt ý tưởng này.
Kiểm tra trước checkpoint: `pnpm verify` **exit 0**, typecheck đạt, lint
**0 lỗi / 26 cảnh báo QA cũ**, **753 tests / 83 files**, build **11/11 trang**.
Đã dừng đúng cây dev wrapper28124 và xác nhận port3004 đóng trước build.
`git diff --cached --check` đạt; đã rà 186 staged files, đủ 78 runtime assets,
không thiếu buffer/texture GLTF, không có output/cache/secrets trong index.
Log: `output/plaza-atmosphere-fix/checkpoint-final-verify.log` (local, ignored).
Commit message: `chore(world): checkpoint approved mountain and island landscape`.

---

## Sửa lỗi núi, sương dày và đảo phụ — 2026-11-11, hiện hành

Tiếp tục yêu cầu cuối của chat `01a1c8f5-0c9d-7243-9276-920ed706899e`
(chat đó bị 413 trước khi xử lý ảnh phản hồi). Làm trong worktree
`.worktrees/plaza-landscape-v1`, không delegation/commit/push/deploy.

- Nguyên nhân mảng vuông trên núi: loader ép cả đá và lá alpha-mask thành
  transparent + depthWrite rồi nhân alpha theo độ cao. Probe cùng góc nhìn
  xác nhận. Đã dùng opaque depth pass, giữ alphaTest lá, haze pha bằng màu.
- Haze pha **sau tone mapping / trước colorspace**, vì sky không tone-map;
  sửa thêm viền chân núi lệch màu. Chân núi xuống thêm 22 đơn vị, tăng scale Y
  tương ứng để đỉnh giữ nguyên cao độ; tan ở -48..-18, lộ thêm sườn đá.
- Sương ban ngày bốn lớp còn **.52/.28/.22/.20**; giữ vị trí gần vách và
  độ dốc thung lũng. Núi xa lấy sắc xanh từ sky-mid, vẫn có relief/texture.
- 12 đảo phụ dùng gờ đá/cỏ bất quy tắc, cụm tán cây, material nhận ánh sáng
  và haze theo khoảng cách; vẫn một batch, không thêm texture/GLB. Bảy đảo
  chính/nguồn asset/tọa độ giữ nguyên; 31 núi vẫn 466,984 triangles/30 batch.
- Test vật liệu có RED→GREEN; focused **13/13**. `pnpm verify` **exit 0**:
  typecheck đạt; lint **0 lỗi / 26 warning script QA cũ**; **753 tests / 83 files**;
  build **11/11 trang**. Đã dừng đúng cây dev wrapper37044 trước build.
- Đã xem spawn/eye/rim/west/rear, trưa/chiều/đêm/mưa, 390×844. Shader lỗi=0;
  reduced-motion đạt. Ba vòng public/personal: **249 geometry/155 texture** và
  **93/29** ổn định sau cùng sweep. Một GLB lỗi còn 5 mẫu; tải muộn không
  thêm tài nguyên vào personal; quay lại đủ 6 mẫu. Không JS exception.
- Tự rà riêng diff/ownership/geometry/shader/hình ảnh; detector `[]`.
  Bằng chứng ở `output/plaza-atmosphere-fix/`: `before-after.jpg`, `after-*`,
  `material-red.log`, `focused.log`, `lifecycle.log`, `final-check.log`,
  `verify.log`. Plan: `docs/superpowers/plans/2026-11-11-plaza-atmosphere-fix.md`.
- Preview khởi động lại **http://127.0.0.1:3004/world**, loopback với dev-auth
  bypass (không authentication), PID trong `output/plaza-atmosphere-fix/dev.pid`.
  Wrapper PID **28124**. Sau restart: `HORIZON_RESTART_PASS` và
  `ATMOSPHERE_FINAL_PASS` (thời tiết thực có mưa, opacity .60/.36/.30/.28),
  đủ 6/7/12, shader lỗi=0, reduced-motion đạt. Đã đóng browser QA,
  `git diff --check` đạt, index trống. Chưa benchmark điện thoại thật.

---

## Núi thật và chỏm tuyết đã ghép vào Plaza — 2026-11-11, bản trước

Chủ dự án đã cho phép ghép thật, xem và chỉnh visual tổng thể. Đã thay 31 cụm
núi procedural bằng sáu mẫu núi đã duyệt, vẫn **5/9/17 lớp gần/giữa/xa**.
Giữ nguyên bảy đảo chính, 12 đảo phụ, vách summit và cả bốn lớp sương.

- `public/world/mountains/`: sáu GLB runtime giảm chi tiết từ nguồn đã duyệt,
  **14,049,944 byte**, tổng **466,984 tam giác đặt / 30 instance batch**.
  Nguồn `.blend`/GLB và gallery 8769 giữ nguyên. Manifest ghi hash và bounds.
- `plaza-mountains.ts` giữ placement, shader tuyết/sương, batching và tải/hủy;
  `public-plaza-mountains.tsx` nối lifecycle/ánh sáng. Xóa hình học/material và
  helper núi procedural không còn dùng khỏi backdrop, không thay mist/đảo.
- **6 cụm có tuyết** ở lớp giữa/xa; mép loang theo độ cao/độ dốc, vách đá lộ ra.
  Haze tăng theo khoảng xa/mưa; màu tuyết nhận ánh sáng cùng cảnh. Giới hạn
  kéo cao để dãy xa không thành tường nhọn. Chân núi fade dưới sương, alpha gần
  0 bị discard. Không thêm shadow/reflection camera; giữ public far 1500.
- Asset buffer/UV/normal/pivot và SHA kiểm tra đạt. Focused **17 test / 5 file**;
  riêng núi **6/6**, có RED→GREEN cho cleanup nguồn lỗi và palette đêm đầu tải.
  `pnpm verify` **exit 0**: typecheck, lint không lỗi, **751 test / 83 file**,
  production build **11/11**. Lint vẫn có 26 cảnh báo ở script QA cũ.
- Visual đã xem spawn/eye/rim/west/rear, trưa/chiều/đêm/mưa, 390×844; probe
  bật/tắt tuyết tại mép tây. `badPrograms: 0`. Ảnh/log ở
  `output/plaza-archipelago-qa/snow-*`, gồm `snow-final-states.jpg`,
  `snow-final-landscape.jpg`, `snow-visual-final.log`, `snow-verify.log`.
- `SNOW_MOUNTAIN_LIFECYCLE_PASS`: ba vòng public/personal sau cùng sweep360
  ổn định **248 geometry / 162 texture** và **104 / 29**. GPU upload lazy theo
  frustum nên không so số đếm ở các hướng chưa được render như nhau.
  Thiếu một GLB còn 5 mẫu; nguồn về muộn không làm tăng GPU ở personal;
  quay lại tải đủ sáu. Không JS error trong run đó.
- Đã dừng đúng cây dev wrapper 5392, xác nhận port3004 đóng trước build;
  preview được khởi động lại loopback/dev-auth bypass, PID trong
  `output/plaza-archipelago-qa/snow-dev.pid`. Không chứng minh auth/sync live.
- Kiểm tra sau restart **SNOW_RESTART_PASS**: đủ 6 mẫu / 31 vị trí / 6 cụm
  tuyết, 4 lớp sương, 7 đảo chính, không shader lỗi; wrapper PID **37044**.
  Đã đóng phiên browser QA, preview **http://127.0.0.1:3004/world** sẵn sàng.
- Tự rà riêng geometry/material/ownership và hình ảnh; không delegation,
  commit, push, SQL hay deploy. Chưa benchmark điện thoại thật.

---

## Bộ asset núi để duyệt riêng — 2026-11-11, mới nhất

Sau khi duyệt bố cục nhiều lớp núi, chủ dự án yêu cầu dựng asset núi để xem.
Đã hoàn thành bộ riêng tại `D:/Dev/Tools/Blender/assets/mountain-collection-v1`:
**Sơn Trụ, Thạch Lĩnh, Vân Sơn, Thiên Mạch, Thanh Sơn, Viễn Phong**. Mỗi mẫu
có GLB Y-up và `.blend` Z-up đóng gói texture; tổng GLB **40.56 MB**. Đá/rêu/cỏ
và cây dùng nguồn Mạch Nguồn đã duyệt, chỉ đọc; hash nguồn và GLB gốc giữ nguyên.

- Gallery **http://127.0.0.1:8769/**, Python PID **43024**, loopback/read-only,
  không authentication. Có chọn 6 mẫu, xoay/zoom, mặt sau/cận cảnh, sáng ngày/
  chiều, sương, so cùng tỷ lệ và tải GLB. Server đọc Three từ worktree này.
- `python -m unittest -v test_terrain test_server`: **6/6 đạt**;
  `python verify.py`: **MOUNTAIN_ASSET_PASS**; Blender `verify_source.py`:
  **MOUNTAIN_SOURCE_PASS**, toàn bộ **112 chân cây** nằm trên bề mặt thật,
  không cạnh hở, mặt trên đảo ngược hay UV bị co về một đường.
- Browser **MOUNTAIN_BROWSER_PASS**: 18 góc mẫu, sương/ánh sáng, keyboard,
  390×844, lỗi tải/thử lại, response trễ, 3 vòng đổi mẫu. Mỗi mẫu **5 geometry /
  9 texture** ổn định; so 6 mẫu **30 geometry / 39 texture**; không lỗi bất ngờ.
  2 lỗi console là request bị hủy chủ động trong phép thử recovery.
- Đã tự rà ảnh thực từ Three: sửa viền đen chân núi (double-sided + UV đáy
  co thành đường) và ô lưới sát viền bị lật (tăng chiều sâu radial của lưới,
  chọn đường chéo theo diện tích có dấu). Đã xác nhận RED → GREEN.
  Lỗi Blender xóa color attribute được tái hiện: RNA reference cũ trỏ sang
  `position`; nay lookup lại từng tên. Không nới test hay bỏ qua lỗi.
- Bằng chứng trong thư mục asset: `verification.json`, `source-verification.json`,
  `renders/browser-qa-final.log`, `renders/source-verification-final.log`,
  `renders/review-{reset,back,detail}.jpg`, `renders/mist-day-review.jpg`.
- Đây là **bộ mẫu để chủ dự án duyệt, chưa tích hợp vào Plaza**. Preview Plaza
  vẫn ở 3004 và gallery đảo vẫn ở 8768. Không thay app source trong bước asset;
  không rerun app build. Chưa chứng minh hiệu năng điện thoại thật hoặc khi
  nhân nhiều núi trong Plaza. Không commit/push/deploy, không delegation.

---

## Nhiều lớp núi đến chân trời và đảo phụ xa — 2026-11-11, mới nhất

Chủ dự án muốn nhiều núi hơn, xa và rất xa, cùng đảo bay rải ngẫu nhiên để
đường chân trời đa dạng. **Mục này thay thế target 8 cụm núi và range 420 ở
các mục lịch sử bên dưới.** Tiếp tục trong `.worktrees/plaza-landscape-v1`.

- **31 cụm núi, ba lớp 5/9/17** ở khoảng 220–300 / 400–540 / 660–850 đơn vị.
  Dáng thấp/rộng, đỉnh cao thấp không đều, lớp xa nhạt hơn. Vertex alpha cho
  chân núi tan vào sương, tránh vệt cắt ngang của mặt phẳng sương.
- **12 đảo phụ** ở 370–690, cao độ 26–100, có thân đá/cỏ/tán cây và mảnh đá nhỏ.
  Scatter ổn định giữa các lần vào; không random lại mỗi frame. Dùng geometry
  nhẹ, cả núi + đảo phụ **19.200 tam giác / 4 batch**, không thêm texture/GLB
  hoặc camera phản chiếu. Bảy GLB/tọa độ đảo chính đã duyệt giữ nguyên.
- `plaza-horizon.ts` giữ layout/hình học đảo phụ và range dùng chung. Public
  far **1500**, sky **11×**, reflection **3000**; cá nhân vẫn **140**.
  Ba lớp sương gần/vách summit giữ nguyên; màn sương xa vươn tới outreach 980.
  Bỏ phụ kiện của cụm núi cũ cùng geometry đã thay, tránh chi tiết treo lơ lửng.
- Focused **13 test / 5 file đạt**, typecheck đạt. Browser
  `HORIZON_COMPOSITION_PASS`: ngày/chiều/đêm/mưa, spawn/eye/rim/rear,
  viewport 390×844, bốn lớp sương, 31 núi + 12 đảo phụ, không lỗi JS.
  `HORIZON_LIFECYCLE_PASS`: ba vòng chuyển bản đồ, public **222 geometry /
  119 texture**, cá nhân **93 / 29**, ổn định trong cùng góc kiểm tra;
  range **1500 → 140 → 1500**. `DEPTH_WALK_PASS` tới mép bắc thật.
- Đã tự rà riêng geometry/alpha/ownership/range và ảnh; Impeccable detector
  `[]`. `pnpm verify` cuối **exit 0**: typecheck đạt, lint **0 lỗi / 26 cảnh báo
  ở script QA tạm**, **745 test / 82 file đạt**, build **11/11 trang**.
  Đã dừng đúng cây dev **524 → 33568 → 20708** và xác nhận port 3004 đóng
  trước build. Bằng chứng ở `output/plaza-archipelago-qa/`:
  `horizon-current.log`, `horizon-lifecycle.log`, `horizon-walk.log`,
  `horizon-final-review.jpg`, `horizon-states-review.jpg`, `horizon-verify.log`.
- Đã sửa nguồn timeout lặp trong hai test pavilion/gate: Vitest 4.1.9 vẫn so
  sánh sâu buffer lớn khi dùng `.not.toBe`. Hai assertion identity nay so
  boolean trước; giữ nguyên kiểm tra mọi phần tử và timeout 5s. Chạy riêng
  **35/35 đạt**, thời gian hai case giảm **1784/1650ms → 108/94ms**.
  Log `horizon-timeout-diagnostic.log` và `horizon-timeout-fixed.log`.
- Chưa commit/push/deploy; không delegation. Chưa thử trên điện thoại thật.
- Đã khởi động lại preview **http://127.0.0.1:3004/world**, wrapper PID 5392,
  chỉ bind loopback với dev-auth bypass; không chứng minh auth/sync live.
  `HORIZON_RESTART_PASS`: đủ 31 núi, 12 đảo phụ, bảy đảo chính, bốn lớp sương;
  đã đóng browser QA. `git diff --check` đạt, index trống. Không còn bước dang dở.

---

## Khôi phục biển sương và núi xa thưa — 2026-11-11, bản trước

Chủ dự án đã đồng ý bố cục đảo gần–giữa–xa, nhưng yêu cầu giữ sương và núi:
**Plaza ở trên đỉnh núi, nhìn xuống biển sương, có các đỉnh núi xa nhấp nhô và
đảo bay rải rác.** Không chỉnh lại tọa độ bảy đảo hoặc GLB đã duyệt.

- Lỗi trước là hạ chung nhóm núi và sương 32 đơn vị. Đã tách hai nhóm trong
  `public-plaza-backdrop.tsx`: sương/vách summit giữ transform Y=0; núi riêng
  ở `[0,-22,0]`, scale `[2.4,3,2.4]`. Đáy che sâu vẫn ở offset Y=-76.
- Giảm 23 cụm núi còn **8 (2/3/3)**, đặt xa và thưa. Gỡ hai vệt thác trang trí
  thuộc cụm núi đã bỏ; giữ hai vệt ở khối núi trung tâm còn lại.
- Ba lớp sương bắt đầu gần chân vách ở Y=-1.38/-2.08/-2.88, hạ dần 26 đơn vị
  vào thung lũng; lớp màn xa ở Y=-26.5. Biển sương vươn 230–270 đơn vị ngoài
  chân vách, giữ mép alpha mềm và không che bậc thấp của Thác Tầng.
- Test hình học mới đã RED→GREEN; bộ tập trung **10 test / 4 file đạt**.
  Browser `SUMMIT_MIST_PASS`: bảy đảo đúng tọa độ, bốn lớp sương có texture/
  opacity, transform núi/vách đúng, không lỗi JS; ngày/chiều/đêm/mưa và viewport
  390×844 đã xem. `DEPTH_WALK_PASS`: đi thật tới mép bắc và xoay về Thác Tầng.
- Tự rà riêng: hình học/UV, dispose, tầm nhìn, phụ kiện của núi còn giữ và ảnh
  thực tế. Không subagent. `pnpm verify` sau lần gỡ thác thừa **exit 0**:
  typecheck đạt, lint **0 lỗi / 25 cảnh báo ở script QA tạm**, **742 test /
  81 file đạt**, build thành công **11/11 trang**. Đã dừng đúng cây tiến trình
  dev và xác nhận port đóng trước build.
- Bằng chứng: `output/plaza-archipelago-qa/mist-current.log`, `mist-walk.log`,
  `mist-final-review.jpg`, `mist-walk-review.jpg`, `mist-verify.log`.
  Các mục hạ chung thung lũng 32 bên dưới là lịch sử, đã bị thay thế.
- Preview đã mở lại ở **http://127.0.0.1:3004/world** sau build, chỉ bind loopback
  với dev-auth bypass. `mist-restart.log`: `ARCHIPELAGO_RESTART_PASS`, bảy đảo
  đúng tọa độ đã lưu; `SUMMIT_MIST_PASS` lại sau restart. Đã xem ảnh mới, đóng
  browser QA và chạy `git diff --check` đạt. Không chứng minh auth/sync/Supabase live.
  Không commit/push/deploy; chưa đo hiệu năng trên điện thoại thật.

---

## Bố cục gần–giữa–xa theo phản hồi chủ dự án — 2026-11-11

Chủ dự án yêu cầu sửa cảm giác "đảo bao quanh sân" thành thế giới có chiều sâu:
**Thác Tầng lớn ở giữa và thấp; Thiên Viên lớn ở xa; Nguyệt Hồ trung ở gần;
Song Đỉnh trung ở xa; hai đảo nhỏ ở gần.** Mạch Nguồn là đảo trung bổ sung bên
trái. Bố cục mới đã lưu ở `plaza-floating-islands.ts`, trong cùng worktree.

- Khoảng cách từ spawn: hai đảo nhỏ **49/53**, trung gần **85**, Thác Tầng
  **113**, hai đảo xa **223/237**. Thác Tầng ở Y=-16, Thiên Viên Y=20; mặt
  tầng cao nhất của Thác Tầng vẫn thấp hơn sân để nhìn xuống được.
- Hạ phông núi/thung lũng 32 và đáy cảnh 76 để không che đảo thấp; giữ vách
  sát sân. Tầm nhìn Plaza 420, cá nhân 140; nền trời 3× và phản chiếu 840.
  Các thay đổi này phục vụ bố cục, không đổi GLB, điều khiển hay gameplay.
- Browser đạt `DEPTH_COMPOSITION_PASS` và `DEPTH_WALK_PASS`; đã xem ngày/
  chiều/đêm/mưa, mobile viewport, đi thật tới mép bắc và xoay về Thác Tầng.
  Map swap giữ đúng tầm nhìn 420 → 140 → 420. 8 test tập trung đã đạt.
- Bằng chứng hiện hành: `output/plaza-archipelago-qa/depth-current.log`,
  `depth-walk.log`, `depth-final-walk-rim.jpg`, `depth-final-terraces.jpg`.
  Tọa độ và kiểm chứng chi tiết ở mục đầu `docs/plaza-assets.md`.
- `pnpm verify` **exit 0**: typecheck đạt, lint **0 lỗi / 24 cảnh báo ở script
  QA tạm**, **740 test / 80 file đạt**, build thành công **11/11 trang**.
  Log: `output/plaza-archipelago-qa/depth-verify.log`. Dev đã dừng trước build,
  mở lại preview ở **http://127.0.0.1:3004/world** sau đó.
- Không commit/push/deploy. Các số đo/bố cục ở mục trước bên dưới là lịch sử.

---

## Bảy đảo quanh Plaza — hoàn tất tích hợp và QA, 2026-11-11

**Trạng thái hiện hành:** sáu đảo đã duyệt cùng một Mạch Nguồn đã được đặt vào
Plaza tại worktree `D:/Dev/Projects/BetterMe/.worktrees/plaza-landscape-v1`, nhánh
`codex/plaza-landscape-v1`. Các mục "chưa tích hợp" bên dưới là lịch sử.
Không dựng lại asset hoặc làm lại phần tích hợp khi tiếp nối.

- Đã chốt bố cục gần–xa/cao–thấp; Thiên Viên `[-10,12,-87]`, Thác Tầng
  `[36,7,-64]`. Bảy model dùng đúng một lần; SHA-256 khớp bản duyệt, toàn bộ
  bounds ngoài Plaza và không giao nhau. Không đổi shader nước/camera/gameplay.
- Browser đạt: bảy đảo, nước/chế độ giảm chuyển động, phản chiếu tối đa một đảo
  mỗi frame và không lặp khi idle; ngày/chiều/đêm/mưa; NPC/nhảy/cổng/đi sát rìa;
  ba vòng chuyển bản đồ; tải lỗi một/tất cả đảo, tải trễ sau unmount và phục hồi.
  Đã xem ảnh desktop, orbit và viewport 390x844; không tràn ngang.
- `pnpm verify` **exit 0**: typecheck đạt; lint **0 lỗi / 18 cảnh báo** ở script
  QA tạm trong `output/`; **739 test / 80 file đạt**; build thành công, **11/11**
  trang. Đã dừng đúng cây tiến trình dev của worktree trước khi build.
- Đã tự rà riêng mã và ảnh; không gọi subagent/reviewer. Diff không lỗi khoảng
  trắng, không stage/commit/push/SQL/deploy. Các thay đổi có sẵn được giữ nguyên.
- Bằng chứng và giới hạn đầy đủ: `docs/plaza-assets.md` mục đầu;
  `output/plaza-archipelago-qa/progress.md`, `verify-current.log`,
  `integration-diagnostic.log`, `states-current.log`, `lifecycle-current.log`.
  Ảnh bàn giao: `output/plaza-archipelago-qa/final-preview.jpg`.
- Preview local: **http://127.0.0.1:3004/world**; dùng dev-auth bypass, chỉ bind
  loopback, không có xác thực thật. Không chứng minh auth/sync/Supabase live.
- Giới hạn: bảy GLB **95,895,292 byte / 1,743,420 tam giác**. Chưa có LOD hoặc
  kiểm tra điện thoại thật; viewport hẹp chưa chứng minh điều khiển cảm ứng.
  FPS desktop dev đã đo 105–111, trung bình 109.3; không phải benchmark mobile.

**Tránh lặp lỗi tiếp nối:** các chat liên kết dừng với HTTP **413 Payload Too
Large** từ dịch vụ nhận yêu cầu AI. Đọc mục này và plan/spec
`2026-11-11-plaza-archipelago` để tiếp tục; chỉ lấy thông tin cần từ lịch sử,
không nạp lại nguyên chuỗi output lồng nhau. Xem ảnh JPEG thu nhỏ thay vì gửi
nhiều PNG gốc vào cùng ngữ cảnh. Đây là giảm kích thước yêu cầu, không phải thay
đổi giới hạn upstream. Không sửa cấu hình agent trên máy. Phần tích hợp đã xong;
việc tiếp theo là nhận đánh giá bố cục của chủ dự án, không tự mở scope mới.

---

## Sáu đảo — sửa theo chuẩn Mạch Nguồn, 2026-11-11

**ĐÃ DUYỆT / HOÀN TẤT:** Chủ dự án xác nhận “Tốt rồi, rất đẹp” và yêu cầu lưu
asset ngày 2026-11-11. Bản chốt riêng:
`D:/Dev/Tools/Blender/assets/approved/six-floating-islands-2026-11-11/`.
Đã đối chiếu SHA-256 cho 143 file; đủ 6 GLB + 6 Blender đóng gói, generator,
shader/viewer, ảnh/clip và nguồn Mạch Nguồn. Index ở `README.md`, hash ở
`SHA256SUMS.json` trong bản chốt. Không ghi đè bản chốt khi thử nghiệm tiếp.

- Anh yêu cầu sửa thác ngược, đáy đá, tăng dây leo trung/lớn, bớt tàn tích/đá
  lặp, và lấy Mạch Nguồn làm chuẩn viền cỏ/cây/tiểu tiết. Đã chỉnh cả sáu mẫu
  tại `D:/Dev/Tools/Blender/assets/floating-island-collection-v1`.
- Lỗi thác có thật: Blender UV `(u,t)` bị glTF đảo V; đổi thành `(u,1-t)` để
  khớp shader đã có. Chín thác mới và hai thác chuẩn qua kiểm tra GPU: dịch
  xuống 15 pixel trong 0,22 giây. Không sửa shader hoặc bản Mạch Nguồn.
- Đáy đá theo lớp/khe phong hóa, viền cỏ nông bám đá, cỏ thấp/cao/mép và hoa
  nguồn gốc từ mẫu chuẩn; dây leo thành cụm rõ hơn, tàn tích ghép đá có mạch
  nối/cạnh mòn/rêu, đá vụn theo nhóm và 5–9 mảnh đá lơ lửng mỗi đảo.
- Check mới: asset, UV, grounding (96.187 chân cây/cỏ), reference details,
  6/6 HTTP test, browser và GPU flow đều PASS. Đã xem ảnh trước/sau/cận cảnh,
  ảnh ghép, mobile; review là tự rà riêng, không có subagent.
- Báo cáo hiện hành: `REFERENCE-POLISH-VERIFICATION.md` trong thư mục asset;
  plan: `docs/superpowers/plans/2026-11-11-islands-reference-polish.md`.
  Ảnh: `renders/six-islands-front.jpg`, `renders/*-before-after.jpg`.
  Clip: `renders/waterfall-downward.mp4`. Bản trước ở
  `revisions/before-reference-polish/`; không dựng lại từ snapshot đó.
- Bộ xem vẫn ở **http://127.0.0.1:8768/**; refresh tab để nhận bản mới.
  Sáu GLB 81,16 MB / 1.437.246 tam giác; vẫn chưa tối ưu LOD/đo điện thoại thật.
  Hai GLB lớn 20,12/20,37 MB: trần kiểm tra tăng lên 21 MB để giữ chi tiết.
- Không thay đổi mã app, không đưa sáu đảo vào Plaza, không commit/push/deploy.
  Anh đã duyệt bản sửa; không còn việc dang dở trong task tạo asset này.
  Các số đo 60 MB trong lịch sử bên dưới thuộc bản cũ.

---

## Sáu mẫu đảo bay bổ sung — 2026-11-11

Anh đánh giá bản tích hợp đẹp, xác định **Mạch Nguồn là đảo trung** và yêu cầu
tạo thêm **2 đảo lớn, 2 trung, 2 nhỏ**. Bộ mới đã tạo tại:
`D:/Dev/Tools/Blender/assets/floating-island-collection-v1`.

- Lớn: **Thiên Viên**, **Thác Tầng**. Trung: **Nguyệt Hồ**, **Song Đỉnh**.
  Nhỏ: **Tán Mây**, **Phong Đăng**. Mỗi mẫu có GLB và nguồn Blender đóng gói riêng.
- Xem mẫu: **http://127.0.0.1:8768/**. Có xem từng đảo, mặt sau/cận cảnh,
  ngày/chiều, dừng nước, download và so cả bộ với mẫu cũ ở cùng tỉ lệ trực giao.
  Server đọc allowlist, chỉ bind loopback, không có xác thực.
- Kế hoạch: `docs/superpowers/plans/2026-11-11-six-floating-islands.md`.
  Bằng chứng, số đo, nguồn và cách chạy lại nằm ở `README.md` và `VERIFICATION.md`
  trong thư mục bộ mẫu. Ảnh ghép: `renders/six-islands-front.jpg`.
- Kiểm chứng: `SIX_ISLANDS_ASSET_PASS`, `SIX_ISLANDS_GROUNDING_PASS`, 6/6 kiểm tra
  HTTP, `SIX_ISLANDS_BROWSER_PASS`, 0 lỗi runtime trong kịch bản bình thường.
  Ba vòng chuyển qua 7 mẫu giữ số geometry/texture ổn định. Đã kiểm tra reduced
  motion, bàn phím, mobile 390x844, lỗi tải/retry và tải trễ. Đã tự rà riêng code
  và ảnh. Không dùng reviewer hoặc subagent.
- Tổng sáu GLB 60.07 MB, 755,874 tam giác sau đặt đối tượng. Chưa có LOD/collider,
  chưa đo điện thoại thật. Nước cần shader trong viewer/runtime; GLB riêng tĩnh.
- Mẫu Mạch Nguồn và bản Plaza ở cổng 3004 giữ nguyên. **Chưa đặt sáu mẫu mới vào
  Plaza**: lượt này tạo bộ mẫu để anh xem/chọn bố cục. Không commit/push/deploy.
  Repo chỉ bổ sung tài liệu; không thay đổi mã app, không cần chạy lại bốn app gate.
- Việc tiếp theo: nhận xét của anh về từng mẫu hoặc yêu cầu đặt chúng quanh Plaza.
  Không dựng lại bộ mẫu từ đầu khi tiếp tục chat. Server PID/log tại
  `renders/server.pid` / `renders/server.log` trong thư mục bộ mẫu.
- **Đã tiếp nối và bàn giao ngày 2026-11-11:** chat
  `01a1c6b0-fa31-7db2-8cc8-0bacc10e0b82` lỗi API sau khi tạo xong bộ mẫu.
  Lượt tiếp nối chạy lại asset/source/HTTP/browser đều đạt, chụp lại và xem
  ảnh của cả sáu mẫu; log mới có hậu tố `-resume.log` trong `renders/`.
  Đã đóng browser QA và mở gallery 8768 trong Codex. Không dựng lại model,
  không sửa mã app hoặc viewer. Phần tạo sáu mẫu và bàn giao đã hoàn tất;
  đang chờ anh đánh giá hình dáng, không còn bước kiểm chứng dở dang.

---

## Bàn giao Plaza / đảo nổi — 2026-11-11

Phần này là bản compact của chuỗi chat Plaza, mới hơn các mốc lịch sử bên dưới.
Làm tiếp tại **`D:/Dev/Projects/BetterMe/.worktrees/plaza-landscape-v1`**, nhánh
`codex/plaza-landscape-v1`; không nhầm với checkout gốc hoặc nhánh sky/character.
Nguồn quyết định: chat `01a1c67a-f6e9-7cf3-ba3f-ace4ccc61101`; hai chat tiếp nối
`01a1c6a2-d903-7f80-89a9-e6cde742bd67` và `01a1c6ab-f659-7db2-a712-1cf072a4b70a`
bị lỗi phiên trước khi bàn giao xong.

- **Anh đã chốt:** giữ mức gồ ghề hiện tại của viền đảo; tích hợp hai đảo nổi
  xung quanh Plaza, một gần và một xa để trải nghiệm góc nhìn. Đảo là cảnh quan.
- **Đã có:** GLB nguyên bản đã duyệt, hai vị trí, batching/chia sẻ tài nguyên,
  nước và thác chuyển động, giảm chuyển động, cleanup và lỗi tải cục bộ.
  Tọa độ, hash, phạm vi, số đo và tự rà soát nằm trong
  [docs/plaza-assets.md](docs/plaza-assets.md); kế hoạch nằm trong
  [plan đảo nổi](docs/superpowers/plans/2026-11-11-plaza-floating-islands.md).
- **Gate mới ngày 2026-11-11:** `pnpm verify` exit 0; typecheck, lint, Vitest và
  build đều đạt. **736 test / 79 file**; lint có **0 lỗi / 11 cảnh báo** ở script
  QA trong `output/`. Log: `output/floating-islands-qa/verify-handoff.log`.
- **Đã kiểm tra qua trình duyệt:** nước/reduced motion, không capture cubemap
  mỗi frame, ba vòng Plaza ↔ Cá nhân, ngày/hoàng hôn/đêm/mưa, NPC, nhảy, cổng,
  lỗi tải GLB và phục hồi. Đã xem ảnh desktop, mobile và mép bắc. Đây là tự rà
  soát riêng của tác giả, không phải review độc lập.
  Lượt chạy lại sau restart đạt `ISLAND_INTEGRATION_PASS`, 0 lỗi trong kịch bản,
  98–101 FPS trên máy này; log `output/floating-islands-qa/integration-handoff.log`.
- **Bản local:** `http://127.0.0.1:3004/world`, chỉ bind `127.0.0.1`, bypass local
  với `BETTERME_DEV_AUTH_BYPASS=true`. Dev log/PID ở
  `output/floating-islands-qa/dev-handoff.*`. Nếu server đã dừng, chạy tại đúng
  worktree: đặt biến môi trường trên thành chuỗi `true`, rồi
  `pnpm dev --hostname 127.0.0.1 --port 3004`.
- **Cách xem:** chọn “Xem thử môi trường” → “Trưa (12:15)” → “Trời quang”; đóng
  bảng bằng Escape. Chuột phải + kéo lên nhẹ để hạ góc nhìn, nhìn hai phía cổng.
  WASD di chuyển, Shift chạy, Space nhảy, con lăn zoom, R đặt lại camera.
- **Việc tiếp theo:** anh trải nghiệm và nhận xét khoảng cách/độ cao của hai đảo.
  Chưa có quyết định mới để tự thay đổi mẫu đảo hoặc mở rộng gameplay. Asset
  hiện giữ nguyên chi tiết: thêm 14.73 MB và khoảng 612K tam giác cho hai bản;
  cần tối ưu LOD/mesh/texture và đo điện thoại thật trước mục tiêu phát hành.
  HUD mobile còn chiếm nhiều màn hình; chưa xác nhận điều khiển cảm ứng.
- **Trạng thái Git:** nhiều thay đổi có sẵn, chưa commit/push/merge/deploy.
  Lượt bàn giao này bổ sung tài liệu và chạy kiểm chứng; giữ nguyên mã tích hợp
  (`next-env.d.ts` được Next tự cập nhật khi khởi động dev). Việc ghép sky/backdrop
  và trạng thái Supabase thuộc phạm vi riêng.

---

> **Framework update 2026-10-31:** Upgraded directly to stable Next.js **16.4.3**
> with matching eslint-config-next, native flat ESLint config and default Turbopack.
> Session refresh is now `src/proxy.ts`; authorization still lives in the app
> layout/server actions. React stays on the compatible 19.2.7 version.
> All four gates pass: **600 tests / 59 files**, including five new proxy regressions.
> Local production guest redirects and dev-mode habit persistence, partial progress,
> four-space navigation, widgets and mobile/desktop rendering were verified.
> See `docs/superpowers/plans/2026-10-31-next16-upgrade.md` for exact evidence and
> limits. No backup or extra worktree was created; no subagents were used.

> **Agent setup 2026-10-31:** `.agents/skills/` now carries Ponytail (instructions
> only), pinned Web Interface Guidelines, and Playwright adapted to Windows/pnpm.
> Supabase, Vercel, Superpowers and full Impeccable remain host-managed; see
> `docs/agent-skills.md` for setup, provenance and limitations. Use `pnpm browser`,
> `pnpm test:sync` and `pnpm verify` for the documented repeatable checks.
> The owner requires single-agent execution unless they explicitly request
> delegation. The subsequent framework upgrade is recorded above.

> **Cập nhật 2026-10-31:** U2c đã merge vào `main` qua PR #7 (squash `9a3583d`).
> Phần bàn giao bên dưới là ảnh chụp ngày 2026-07-27: mô tả U2c chưa merge, tên nhánh
> và kết quả kiểm thử là thông tin lịch sử. Ưu tiên hiện nay là sử dụng cá nhân trước;
> khả năng mở rộng cho cộng đồng được xem xét sau. Việc áp dụng schema U1c lên Supabase
> vẫn chưa được xác nhận.
> **Cập nhật tiếp:** Chủ sở hữu đã xóa `.agents/`, `.claude/` và `.kiro/` để cài lại skill.
> `.git` cũ đã mất; kho Git đã được khởi tạo lại và kết nối với `main` trên GitHub.
> Hai worktree cũ còn trên đĩa nhưng chưa được kết nối lại với kho Git mới.

> **Ngày cập nhật:** 2026-07-27 · **Trạng thái tree:** sạch, 4 gates xanh (**595/595 test, 58 file**)
> **Nhánh:** `u2c-widget-chips-and-backyard`, dựng trên `main` (U0 + U1a + U1b + U1c + U2a + U2b đã merge vào `main` — U2b là PR #6, squash `ffd7eae`) · File này là điểm vào duy nhất cho người nhận bàn giao.
> ⚠️ **U1c cần owner apply `supabase/schema.sql` lên Supabase TRƯỚC khi deploy app** — xem §2. Việc này CHƯA làm.
> Quy ước cho agent: đọc `AGENTS.md`. Spec hành vi: `docs/superpowers/specs/`.

---

## 1. Tóm tắt 30 giây

App: **Nếp's Garden** — habit tracker tiếng Việt, cozy, có pet nuôi được (Next.js 15 + React 19 + TS strict + Supabase, localStorage-first) cùng **social layer kiểu Duolingo** (kết bạn, thăm vườn, Nhịp Chung, Hội chợ vườn).

- **Social Garden Phase 0 → 3: ĐÃ SHIP HẾT** (commit, review, gates xanh — xem §2).
- **Auth thật đã chạy**: email + password, signup có OTP 6 số qua email (Gmail SMTP). Config GoTrue nằm NGOÀI Postgres — nguồn chân lý: `docs/auth-email-config.md`.
- **Schema đã apply lên project Supabase thật** (ref trong `docs/auth-email-config.md`). Bằng chứng: các fix theo Supabase advisor 0011/0028/0029 và lỗi `extensions.gen_random_bytes` chỉ lộ ra khi chạy trên DB thật. LƯU Ý: bộ test DB-level theo spec §12 (RLS matrix, race tests) **vẫn chưa chạy** — xem §4.
- **Việc tiếp theo #1 (chỉ đạo owner 2026-07-26): đại tu giao diện** — UI hiện tại chưa giữ chân người dùng; phân tích retention + redesign toàn diện, làm CÙNG owner từng bước (xem §4-A).

**2 invariant tuyệt đối, test-enforce, không thương lượng:**
1. **No-guilt**: không câu chữ/UI nào trách móc user hay so sánh họ *xuống dưới* ai (`pet-voice.test.ts` chặn cứng: "thua", "kém hơn", "xếp cuối"…).
2. **No-decay**: growth/bond của pet chỉ tăng (trigger Postgres enforce; đường giảm duy nhất là RPC `reset_companion`). KHÔNG áp cho completions — untick là hành động hợp lệ và phải sync được.

---

## 2. Đã ship (commit trên `main`, mới → cũ)

| Commit | Nội dung |
|---|---|
| `u2c-widget-chips-and-backyard` (4 commit, chưa merge) | **U2c chip widget + sân sau**: `ui/popover.tsx` (Radix — popover duy nhất của app; `forceMount` phải chuyền tới cả `Portal` lẫn `Content`) · thời tiết + Spotify co thành **2 chip 1 dòng** dưới danh sách habit, mỗi chip mở popover chứa thẻ chi tiết cũ (§4.3) · popover nhạc **force-mount** nên đóng chip không tắt nhạc · `WeatherCard`/`SpotifyCard` dọn hết palette v2 sang token · `NepMiniCard` nhận props (không đọc provider) trong `<aside aria-label="Sân sau">` sticky, **chỉ desktop** (§4.4) |
| `ffd7eae` (PR #6) | **U2b tab Ngày/Tuần + lưới tuần**: `week-model.ts` thuần (ô phân biệt `off`/`future`/`empty`/`missed`, `total.scheduled` chỉ đếm ngày có lịch và đã tới) · `WeekGridCard` là `<table>` thật, nghĩa nằm trong `aria-label` từng ô, cột hôm nay `aria-current="date"` · `TabSwitch` thêm `idPrefix` để nối tab ↔ panel · `habitStreaks` đổi khoá sang mọi habit · 7 chấm hero thành tuần dương lịch T2→CN · nhãn thứ gom về `@/lib/date` |
| `b67f321` (PR #5) | **U2a hero bầu trời**: token 3 buổi (`--sky-{morning,afternoon,evening}-*`) với ink riêng từng buổi vì tối là nền tối · `sky.ts` chọn buổi theo giờ · hero mới: chào theo buổi, dòng ngày gộp thời tiết, 🔥 chuỗi + kỷ lục, 7 chấm, vòng tiến độ · `ProgressRing` + `TabSwitch` (nợ từ U0) · thời tiết chuyển về `StateProvider` — một fetch cho cả app |
| `36d2ac0` (PR #4) | **U1c sync nói được v3**: `habit_logs` thêm `value`/`completed_at`, `habits` thêm 12 cột định nghĩa v3; `apply_habit_log` + `upsert_habit` nới chữ ký (kèm `drop function` chữ ký cũ + grant lại); merge/parse/importer/provider đi trọn hai chiều. **Vá 2 lỗ mất dữ liệu**: tiến độ dở dang không bao giờ được đẩy lên, và tạm dừng/lưu trữ/đổi thứ tự không sync gì cả. ⚠️ **Owner phải apply `supabase/schema.sql` trước khi deploy** (idempotent, chạy lại an toàn) |
| `6c474a0` (PR #3) | **U1b editor + day view**: sheet tạo/sửa habit (5 mẫu 1 chạm, gợi ý emoji theo tên, 4 kiểu theo dõi, lặp theo thứ, nhiều buổi, giờ dự kiến, 6 màu thẻ, ghi chú động lực) · day view nhóm theo buổi với điều khiển riêng từng kiểu · tạm dừng/lưu trữ/sắp xếp · màn `/nep/archive` xoá vĩnh viễn 2 bước |
| `d287f42` (PR #2) | **U1a habit model v3**: 4 kiểu theo dõi (check/count/duration/checklist), lịch lặp theo thứ, buổi, tạm dừng/lưu trữ; ô log thành `{ value, completedAt? }` với `completions` còn lại làm cache dẫn xuất; migration v2→v3 idempotent; khoá `betterme.dashboard.v3` (v2 chỉ-đọc, là ảnh chụp rollback); chuỗi riêng tôn trọng lịch lặp. Giao diện **không đổi một chút nào** |
| `07cea7b` (PR #1) | **U0 đại tu UI**: design token + gate tương phản AA, font Bricolage/Be Vietnam Pro, bộ `ui/` (Button 3 cấp, Card, Chip, Icon, NavRail, BottomTabBar), `StateProvider`, 4 route trong group `(app)`, badge tin mới. Kèm `fix`: `.font-display` trước nay vô hiệu vì fallback `Baloo 2` không phải ident CSS hợp lệ — mọi tiêu đề đang rơi về font body |
| `b3a372e` | **Spec đại tu UI/UX**: 4 không gian, habit model v3, luật streak + 🍃 lá chắn, Nếp & 4 tính năng mới, lộ trình U0→U4 + 5 mockup đã duyệt |
| `bc2ea68` | **Agent instruction layer**: `AGENTS.md` + `.kiro/` (steering, skills: verification / schema conventions / sync-engine / pet-voice / ui-styling / ui-ux-pro-max). `.gitignore` chặn `__pycache__`, giữ `.kiro/settings/mcp.json` (token) ngoài git |
| `3987a31` | **Refactor dashboard**: tách `dashboard-client.tsx` (~600 dòng gọn lại) thành `HeroBanner`/`CompanionPanel`/`CelebrationOverlay`/`WeatherCard`/`AnalyticsPanel`/`ProfileMenu`/`SiteFooter`, mỗi cái có test riêng (167 → 221 test); email tài khoản chuyển vào ProfileMenu dropdown (trang hồ sơ/cài đặt còn là toast placeholder) |
| `0e631f6` | **Auth email+password + OTP signup**: `auth-actions.ts` (4 server action, không throw), login form 3 mode (login/signup/verify) với copy VN cozy + anti-enumeration; `docs/auth-email-config.md` ghi config GoTrue tái lập được (template OTP-only `{{ .Token }}`, invariant `mailer_otp_length=6` ≤ độ dài input, custom SMTP). Root cause đã fix: OTP 8 số bị form cắt còn 6 → mọi verify fail `otp_expired` |
| `cd3c238` | **Schema hardening** theo Supabase advisor: pin `search_path` cho helper/trigger functions, revoke REST-execute trigger-only functions, `extensions.gen_random_bytes` |
| `aeba2da` | **Phase 3 — Nhịp Chung & Hội chợ vườn** (shared rhythm + garden fair) |
| `72686c5` | **Phase 2 — Thăm vườn & cheers** (23 defect từ adversarial review đã vá cả SQL lẫn TS trước khi commit) |
| `c919634` | **Phase 1 — Danh tính & kết bạn** (invite code 64-bit, RPC rate-limited, card "Bạn vườn 🏡") |
| `85b537f` | **Voice packs social** (66 câu VN, guest voices, guard no-comparison) |
| `854744e` | **Phase 0 — Supabase sync** (ledger economy, LWW merge, no-decay trigger, sync engine `src/lib/sync/`) |
| `dd1e812` | Spec social-garden v2 (qua 23-finding adversarial review) + amendment product-spec |

Chi tiết kỹ thuật từng phase (contract RPC, luật merge, quyết định §11 đã chốt): xem spec + git log message của từng commit.

---

## 3. Môi trường & lệnh

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm vitest run  # 595 tests / 58 files
pnpm build       # next build
pnpm dev         # next dev
```

- **4 gates trên phải xanh trước MỌI commit.** pnpm only, không npm/yarn.
- **Dev bypass đăng nhập**: env `BETTERME_DEV_AUTH_BYPASS` phải là chuỗi `"true"` (số `1` không ăn). Khi bypass: sync/social tắt hoàn toàn, dashboard chạy localStorage thuần — hành vi đúng, không phải bug.
- **Client cần env**: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.local`, không bao giờ commit).
- **Config auth (GoTrue)** không nằm trong `schema.sql` — môi trường mới phải re-apply theo `docs/auth-email-config.md`.
- **localStorage keys**: state `betterme.dashboard.v3` (v2/v1 chỉ đọc, migration tự chạy) · queue `betterme.syncqueue.v1` · shadow `betterme.syncmeta.v1` · watermark `betterme.synclast.v1` · opt-in `betterme.syncoptin.v1` · hoãn hỏi `betterme.syncask.v1` · mailbox seen `betterme.mailboxseen.v1`.
- JSDOM không có `window.matchMedia` — guard trước khi dùng (pattern có sẵn trong `pet.tsx`).

---

## 4. Việc tiếp theo (theo thứ tự ưu tiên)

### A. Đại tu giao diện (ĐANG LÀM — chỉ đạo owner 2026-07-26)

**Spec đã duyệt:** `docs/superpowers/specs/2026-07-26-uiux-overhaul-design.md` (11 mục, 5 mockup kèm theo trong `2026-07-26-uiux-overhaul-mockups/`). Lộ trình 5 bước U0→U4 ở §10.

**U0 — XONG** (nhánh `u0-shell-and-tokens`, 8 commit, 304 test xanh). Plan: `docs/superpowers/plans/2026-07-26-u0-shell-and-tokens.md`. Nội dung:

- **Design token ngữ nghĩa** trong `globals.css` `:root`, map sang Tailwind bằng `var(--token)`; `src/app/design-tokens.test.ts` gác cả sự hiện diện lẫn tương phản AA. Palette v2 (rice/matcha/sakura) vẫn còn nguyên trong config, gỡ dần ở U1–U4.
- **Font mới**: Bricolage Grotesque (display) + Be Vietnam Pro (body), subset `vietnamese`, nạp qua `next/font/google`.
- **Bộ `ui/`**: Button 3 cấp (primary/secondary/ghost), Card, Chip, Icon, NavRail, BottomTabBar.
- **4 không gian**: `/dashboard` (Hôm nay) · `/calendar` (Lịch & nhịp) · `/nep` (Nhà của Nếp) · `/friends` (Bạn vườn), nằm trong route group `(app)` với một cổng auth duy nhất ở `(app)/layout.tsx`.
- **StateProvider**: toàn bộ state/effects/sync engine rời `dashboard-client.tsx` (đã xoá) lên `src/components/app/state-provider.tsx`; 4 page đọc qua `useAppState()`.
- **Nhà mới của từng panel cũ**: hero + habit list + weather/spotify → `/dashboard`; lịch tháng + sự kiện + analytics → `/calendar`; CompanionPanel → `/nep`; FriendsCard + Hội chợ → `/friends`; mọi overlay + ProfileMenu + footer → `AppShell`.

**3 quyết định trong lúc lập plan (owner lật lại được bằng 1 câu):**
1. Icon nav dùng **line-icon Lucide**, không phải emoji như mockup — theo spec §2.4 ("line-icon = mọi hành động UI: nav…"). Wordmark vẫn giữ 🌾.
2. Tách `--success` (nền/hình, 3.2:1) khỏi `--success-ink` (chữ, 4.75:1) vì `#16A34A` làm chữ trượt AA. Không có token "chữ mờ": `#A8A29E` chỉ 2.5:1.
3. `TabSwitch` + `ProgressRing` **hoãn sang U2** — U0 không có màn nào dùng.

**Hệ quả có chủ đích:** bong bóng thoại của Nếp hiện chỉ xuất hiện ở `/nep` (nó sống trong `CompanionPanel`). U2a dựng hero bầu trời có câu nói của Nếp; **U2c đã thêm thẻ Nếp thu gọn ở cột phải desktop** (spec §4.4).

**U1 được tách làm 3 plan** (Scope Check: 3 hệ con độc lập, mỗi cái tự chạy và test được):

- **U1a — XONG** (nhánh `u1a-habit-model-v3`, 4 commit, 360 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u1a-habit-model-v3.md`. Model v3 + migration, **giao diện không đổi**. Ba quyết định:
  1. `entries` là nguồn chân lý, `completions` ở lại làm **cache dẫn xuất** (spec §9.3 đọc thẳng là thay thế hẳn). Lý do: server contract còn nói `done: boolean` tới tận U1c; và giữ lại thì 304 test cũ thành lưới an toàn thật cho migration. Luật: chỉ `setHabitEntry` được ghi cả hai, có test invariant chặn drift.
  2. `completedAt` lưu `"HH:mm"` giờ địa phương, không phải ISO đầy đủ — Giờ vàng chỉ cần giờ trong ngày, và tránh bẫy múi giờ khi U1c đẩy lên server.
  3. `repeatDays` dùng số ISO 1–7 (1 = Thứ Hai), khớp cột T2→CN.
- **U1b — XONG** (nhánh `u1b-editor-and-day-view`, 7 commit, 432 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u1b-editor-and-day-view.md`. Quyết định: một habit thuộc **nhiều buổi** (owner chốt 2026-07-27, khác cách đọc số ít của spec §5.1) · "Cả ngày" loại trừ các buổi khác · habit ở 2 buổi hiện ở cả 2 nhóm nhưng là MỘT ô log, bản lặp có nhãn "cũng ở …" · bỏ chọn thứ cuối cùng bị **từ chối** thay vì âm thầm reset về cả 7 · editor không có ô "nhóm" (category mặc định `Discipline`).
- **U1c — XONG** (nhánh `u1c-sync-v3`, 7 commit, 467 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u1c-sync-v3.md`. Amendment đầy đủ ở cuối `docs/superpowers/specs/2026-07-08-social-garden-spec.md`. Bốn điều đáng nhớ:
  1. **`done` giữ nguyên nghĩa** — client tính bằng `isEntryComplete`, server không suy diễn từ `value` (server không biết mục tiêu). Nhờ vậy `refresh_my_summary` và vòng `shared_rhythms` không phải sửa dòng nào.
  2. **Bẫy overload**: `create or replace function` với danh sách tham số khác tạo **overload** chứ không thay thế → PostgREST gọi bằng named argument sẽ chết `42725`. Cả hai hàm đều có `drop function if exists <chữ ký cũ>` đứng trước, và grant phải nêu chữ ký MỚI (drop xoá luôn grant cũ, mà hàm Postgres mặc định `EXECUTE` cho `PUBLIC`). `tests/schema-contract.test.ts` canh chỗ này vì CI không có DB.
  3. **Hai lỗ mất dữ liệu được vá**: `setEntry` chỉ enqueue khi *số habit xong trong ngày* đổi, nên 3→4 ly của mục tiêu 8 không bao giờ rời máy; và `pauseHabit`/`archiveHabit`/`moveHabit` không enqueue gì cả. Không vá thì các cột mới ở điểm 1 sẽ mãi rỗng.
  4. **Thứ tự triển khai**: apply SQL trước, deploy app sau. Ngược lại vẫn **không mất dữ liệu** (client xếp `PGRST202` là retry nên hàng đợi tự đẩy lại), nhưng sync đứng im tới khi SQL được apply.
- **U2a — XONG, đã merge** (PR #5 → `b67f321` trên `main`; 7 commit, 505 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u2a-sky-hero.md`. U2 bị chia làm ba vì §4.1 (hero) và §4.2 (tab + lưới tuần) là hai deliverable duyệt được riêng. Bốn điều đáng nhớ:
  1. **Bầu trời là ba BỘ token, không phải ba class.** Buổi tối là nền tối nên chữ phải lật sang sáng → ink thuộc về từng buổi (`--sky-evening-ink`), không dùng chung `--ink`. `design-tokens.test.ts` kiểm ink trên **cả hai** đầu gradient; kiểm một đầu là tự lừa mình vì chữ nằm trên toàn dải.
  2. **Thời tiết dọn về `StateProvider`** — trước đây chỉ `WeatherCard` fetch. Hero cần cùng dữ liệu đó, mà thêm fetch thứ hai thì hai chỗ hiện hai con số khác nhau vào lúc mạng chậm.
  3. **Class Tailwind phải xuất hiện nguyên văn trong source** — `SKY_STYLES` viết đủ chuỗi thay vì ghép template; class Tailwind không "nhìn thấy" được là class nó không sinh ra. Cũng đã kiểm khoá `sky` không đụng palette `sky` mặc định của Tailwind (`rg "sky-[0-9]"` → sạch).
  4. **`ProgressRing` giờ là nơi duy nhất có vòng tiến độ** — `habit-entry-control.tsx` trước đó tự viết conic-gradient riêng, nay dùng chung.

  **Khoảng trống của U2a, đã đóng ở U2b:** 7 chấm hero từng là "7 ngày gần nhất"; nay là tuần dương lịch T2→CN.
- **U2b — XONG, đã merge** (PR #6 → `ffd7eae` trên `main`; 11 commit, 574 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u2b-day-week-tabs.md`. Nội dung: tab **Hôm nay / Tuần này** ở `today-page`, lưới tuần T2→CN, và 7 chấm hero đổi sang cùng tuần đó. Năm điều đáng nhớ:
  1. **Một ô "chưa xong" có bốn nghĩa khác nhau** (`week-model.ts`): `off` (không có trên lịch hôm đó, hoặc đã tạm dừng/lưu trữ) · `future` (chưa tới) · `empty` (**hôm nay**, còn nguyên cơ hội) · `missed` (ngày đã qua hẳn mà trống). Gộp bất kỳ cặp nào là biến lưới thành bảng điểm trách móc — hôm nay chưa hết thì chưa thể là ngày thất bại. `total.scheduled` chỉ đếm ô **có lịch VÀ đã tới**; đếm cả tương lai thì mỗi Thứ Hai mở ra 11 thất bại chưa xảy ra.
  2. **Lưới là `<table>` thật, và nghĩa nằm trong tên truy cập** — `aria-label` mỗi ô ghi đủ "Uống nước, T2 20 tháng 7: 4/8 ly", cột hôm nay có `aria-current="date"` chứ không chỉ đổi màu. Màu không bao giờ là tín hiệu duy nhất (WCAG 1.4.1), nên test đọc *tên* chứ không đọc class.
  3. **Nhãn thứ gom về `@/lib/date`** (`VI_WEEKDAY_LABELS` + `viWeekdayLabel`). Hero và lưới phải gọi cùng một tuần bằng cùng một tên; `dashboard-data.ts` **không thể** import `week-model.ts` (vòng tròn) nên nhãn không thể sống ở một trong hai.
  4. **`habitStreaks` đổi khoá sang MỌI habit**, không chỉ habit của hôm nay — lưới hiện hàng cho habit chỉ lặp Thứ Ba, và hàng đó cần 🔥 của nó vào một ngày Thứ Hai. Trước đó nó âm thầm đọc ra 0. Day view tra theo id nên thêm khoá không tốn gì.
  5. **`TabSwitch` giờ đòi `idPrefix`** để nối `aria-controls` ↔ `id` panel. Chỉ panel đang chọn được mount: một panel ẩn bằng CSS vẫn nằm trong cây accessibility cho screen reader đi lạc vào.

  **Chưa làm, có chủ đích:** trạng thái 🍃 **nghỉ chủ đích** chưa có — 🍃 lá chắn là tính năng của **U3**; U2b chỉ có `off` (không có trên lịch). Khi U3 làm lá chắn, `WeekCellState` cần thêm một nhánh. Lưới là bề mặt **chỉ đọc**: U2b không mở đường sửa dữ liệu quá khứ.
- **U2c — XONG** (nhánh `u2c-widget-chips-and-backyard`, 4 commit, 595 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u2c-widget-chips-and-backyard.md`. Nội dung: thời tiết + Spotify co thành **2 chip 1 dòng** dưới danh sách habit (§4.3), và **sân sau** sticky cột phải desktop chứa thẻ Nếp thu gọn (§4.4). Năm điều đáng nhớ:
  1. **Popover đi mượn Radix, không tự viết** — `src/components/ui/popover.tsx` là popover DUY NHẤT của app (cùng hình dáng với `tooltip.tsx`). Bốn thứ một popover tự viết luôn làm sai: bẫy focus, Escape, click ra ngoài, và định vị theo viewport — mà cả bốn đều vô hình cho tới khi có người dùng bàn phím.
  2. **`forceMount` phải chuyền tới CẢ `Portal` lẫn `Content`.** Portal unmount cả cây con của nó, nên một `Content` force-mount nằm trong Portal mặc định vẫn biến mất — đúng cái điều duy nhất mà caller xin `forceMount` để tránh. Đây là lý do popover nhạc **giữ `<iframe>` trong DOM khi đóng** (owner chốt 2026-07-27): đóng chip thì nhạc vẫn chạy.
  3. **Radix chỉ cho panel force-mount cái `data-state`** — ẩn nó (`hidden` + `aria-hidden`) là việc của caller, nên popover nhạc phải là **controlled** (`useState`) để caller biết nó đang đóng. Test bám **cùng một node iframe** (`panel.contains(frame)` + `frame.isConnected`), không chỉ "có một iframe": một embed remount là playlist chạy lại từ đầu.
  4. **Radix portal ra `document.body`** → test phải truy vấn qua `screen`, không bao giờ qua `container` của RTL. `container.querySelector` trả `null` và trông y như một bug thật.
  5. **Thẻ Nếp sân sau nhận props, không đọc `useAppState()`** — nhờ vậy test được mọi trạng thái pet (kể cả `pet: null`) mà không phải lái provider tới đó. Nó hiện thân thiết bằng **thanh (bar), không phải ring**: ring duy nhất của app thuộc về tiến độ ngày, thêm ring thứ hai cạnh nó là hai điểm số cạnh tranh nhau. Khay hết đồ ăn chỉ **làm mờ** nút — một câu giải thích "Sếp chưa có đồ ăn" là guilt, mà invariant 1 cấm.

  **Chưa làm, có chủ đích (3 khoảng trống của U2c):**
  - **Thẻ "Vườn bạn bè" trong sân sau bị HOÃN.** Spec §4.4 muốn nó, nhưng provider chỉ có `newSocialCount` (một con số cho badge tin mới) — không có feed hoạt động của bạn để hiện. Dựng thẻ bằng con số đó là dựng một thẻ rỗng. Cần một nguồn feed thật trước; khi có thì `--alert` (hiện chưa dùng ở sân sau) là màu của badge đó.
  - **`companion-panel.tsx` vẫn còn palette v2** — nó thuộc đợt `/nep`, không phải U2c. U2c chỉ dọn `weather-card.tsx` + `spotify-card.tsx`.
  - **Xanh Spotify `#1db954` + nền tối là màu THƯƠNG HIỆU**, ngoại lệ có chủ đích của luật "màu là một vai" (shadow/radius vẫn dùng token repo). Đừng "sửa" thành `--action`.

⚠️ **Rollback U1a rất rẻ:** v2 vẫn nằm nguyên trong localStorage, không bị ghi đè. Muốn quay lại chỉ cần xoá khoá `betterme.dashboard.v3` trong DevTools → Application → Local Storage. Vẫn nên export JSON để backup trước khi dùng dữ liệu thật lâu dài.

### B. Test DB-level theo spec §12 (chưa làm — môi trường dev không có Postgres/supabase CLI)
RLS matrix 3 user (§8), race tests (2 visitor cùng tặng, double-click), rate-limit đếm cả mã sai, invite-code re-roll, trigger no-decay + `reset_companion`, merge 2 thiết bị. Khuyến nghị: `supabase start` (docker) + pgTAP hoặc script SQL tay.

### C. Soak Phase 0 ≥1 tuần (gate cứng spec §1)
Owner dùng sync đa thiết bị 1 tuần, xem log lỗi, RỒI mới mở social cho user thật.

### D. Follow-ups đã ghi nhận, làm sau được
- Trang hồ sơ + cài đặt thật (ProfileMenu đang toast "đang được ươm mầm").
- Multi-tab: 2 tab cùng flush có thể mất mutation trong queue (xác suất thấp, tự-lành) — thêm `storage` event listener nếu cần.
- Lọc ledger companion theo `seedCutoverDate` khi upload (tightening tùy chọn).
- Playwright 2-context integration test (§12 Phase 0).
- Kill-switch metrics Hội chợ (spec §5.3) — đo sau 4 tuần chạy thật.

---

## 5. Bản đồ file quan trọng

| Vùng | File |
|---|---|
| Quy ước agent | `AGENTS.md` (nguồn chân lý) + `.kiro/steering/**`, `.kiro/skills/**` |
| Spec hành vi (NGUỒN CHÂN LÝ) | `docs/superpowers/specs/2026-07-08-social-garden-spec.md` · `2026-07-07-pet-companion-spec.md` |
| Auth config (ngoài Postgres) | `docs/auth-email-config.md` + `src/lib/server/auth-actions.ts` + `src/components/auth/login-form.tsx` |
| Schema + toàn bộ RPC | `supabase/schema.sql` (idempotent; banner: gốc / Phase 0 / 1 / 2 / 3 / hardening) |
| State thuần (pure functions, kinh tế pet) | `src/components/dashboard/dashboard-data.ts` (+ test) |
| Habit model v3 (thuần) | `src/components/dashboard/habit-model.ts` (vị từ hoàn thành/lịch) · `habit-migration.ts` (v2→v3, idempotent) (+ test) |
| Lưới tuần (thuần) | `src/components/dashboard/week-model.ts` (mọi phép tính tuần, `today` là tham số) (+ test) · nhãn thứ T2→CN ở `src/lib/date.ts` (`VI_WEEKDAY_LABELS` / `viWeekdayLabel`) |
| Sync engine | `src/lib/sync/{types,time,storage,queue,shadow,merge,importer,engine}.ts` (+ tests) |
| Server actions | `src/lib/server/{sync-actions,social-actions,auth-actions,actions}.ts` |
| Shell + state toàn app | `src/components/app/{state-provider,app-shell,nav-items,sync-status-dot,today-page,calendar-page,nep-page,friends-page}.tsx` |
| Primitive design system | `src/components/ui/{button,card,chip,icon,nav-rail,bottom-tab-bar,popover,progress-ring,tab-switch}.tsx` + token trong `src/app/globals.css` `:root` |
| Panel UI | `src/components/dashboard/{hero-banner,habit-day-list,habit-entry-control,habit-editor-sheet,week-grid,calendar-panel,companion-panel,celebration-overlay,widget-chips,weather-card,spotify-card,nep-mini-card,analytics-panel,profile-menu,site-footer,friends-card,garden-fair,garden-visit-overlay,sync-onboarding,pet,nep}.tsx` |
| Voice + invariant tests | `src/components/dashboard/pet-voice.ts` + `pet-voice.test.ts` |

---

## 6. Rủi ro / giới hạn đã biết (chấp nhận có chủ đích — đừng "sửa" nhầm)

- **Trust model (spec §0.7)**: data gốc là self-reported + owner-writable (bản chất local-first). Server bảo đảm summary *nhất quán với data gốc*, không chống được user tự tick láo — Hội chợ là trò chơi giữa bạn thật.
- **LWW tin đồng hồ client** cho name/species/log cells — spec chấp nhận; watermark reset đã theo server-time.
- **Ledger imprecision có trần**: 2 replica lệch >30 ngày có thể đếm đôi net của 1 ngày đã prune (clamp bởi FOOD_CAP=21; spend không bao giờ mất).
- **`CompanionState.food` là derived cache** — mọi code đụng ledger phải gọi lại `deriveFoodBalance`; KHÔNG BAO GIỜ merge field này.
- **`bestStreakFloor` (=26) và `events` là seed fiction** — không bao giờ upload; records `date <= seedCutoverDate` không bao giờ rời máy.
- **Thời tiết fetch một lần cho cả app trong `StateProvider`** (từ U2a) — hero, chip và thẻ chi tiết đọc cùng `app.weather`, nên không thể hiện hai con số khác nhau. Trạng thái lỗi degrade thành "Chưa lấy được" trên chip, không phải thông báo lỗi.
- **Sân sau chỉ có desktop** (`hidden xl:grid`) và **chỉ chứa thẻ Nếp** — không phải bug, xem 3 khoảng trống của U2c ở §4-A.
