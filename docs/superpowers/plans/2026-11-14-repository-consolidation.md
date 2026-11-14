# Hợp nhất worktree và dọn nguồn BetterMe — Implementation Plan

> **For agentic workers:** dùng `superpowers:executing-plans`, thực hiện tuần tự
> bằng một agent theo yêu cầu owner. Không dispatch subagent. Các bước chưa
> đánh dấu là công việc dự kiến, không phải thay đổi đã thực hiện.

**Goal:** một checkout sạch có Plaza mới và nhân vật đã duyệt, checkpoint GitHub
tái lập được, thư viện Blender local gọn và không mất nguồn.

**Architecture:** dùng working tree Plaza làm nền trong chính checkout đó,
nhập nhóm character/motion của environment có chọn lọc, lưu nguồn authoring
ngoài repo; chỉ chuyển về root và gỡ checkout cũ sau khi kiểm chứng checkpoint.

**Tech Stack:** Windows/PowerShell, Git, pnpm 11.7, Next 16.4.3, React 19.2.7,
Three 0.187, R3F 9.8.2, three-vrm 3.5.5, Vitest, Blender hiện có.

**Spec:** `docs/superpowers/specs/2026-11-14-repository-consolidation-design.md`.

## Ràng buộc chung

- Plan-only ở round hiện tại. Chưa merge, move, delete, stage, commit hoặc push.
- Khi thực hiện, giữ no-guilt/no-decay, auth/RLS; không sửa schema/deploy/GPU.
- Không đọc/in/hash/commit `.env*`; không force/reset-hard/git-clean/recursive wipe.
- Không commit trước khi typecheck, lint, toàn bộ Vitest, build đều xanh.
- Không build khi dev server của cùng checkout còn chạy; không kill Node hàng loạt.
- Giữ bản đảo chi tiết và LOD; giữ đúng Cổng Mây đã sửa và nguồn dựng nó.
- Commit/push chỉ thuộc round owner yêu cầu thực hiện, không do việc viết plan.
- File chưa rõ lý do tồn tại được giữ và báo lại; tên `old`, `v1`, `output` không
  phải tiêu chí tự động cho phép xóa.

## Trọng tâm tự review

1. File ignored/untracked duy nhất bị bỏ sót → inventory + recovery + hash ở T1/T4/T7.
2. NPC/IK dùng y=0 trên terrain cao/thấp → test tầng -2/0/4/7, gait/jump ở T3.
3. Clone sạch thiếu fixture/package/texture → inventory runtime + cài sạch ở T4/T6.
4. Hình cũ đè bản đã duyệt → pin hash runtime và source-map ở T1/T4/T5.
5. Xóa worktree vẫn còn process/cấu hình riêng → kiểm process/path/config ở T1/T7.

## Quy ước đường dẫn và file sở hữu

- `ROOT = D:/Dev/Projects/BetterMe`.
- `PLAZA = ROOT/.worktrees/plaza-landscape-v1` — nơi ghép và kiểm đầu tiên.
- `ENV = ROOT/.worktrees/reading-quest-environment-v1` — nguồn đọc, chưa sửa.
- `ART = D:/Dev/ArtSources/BetterMe` — thư viện nguồn local dự kiến.
- `RECOVERY = C:/Users/MrThien/BetterMe-recovery/2026-11-14` — recovery chọn lọc.
- `EVIDENCE = PLAZA/output/consolidation-2026-11-14` — log/manifest local, không
  stage raw browser state. Báo cáo nhỏ đã lọc đưa vào `docs/maintenance/`.
- Các đường dẫn tương đối dưới đây tính từ checkout đang thực hiện; file nguồn
  import luôn ghi rõ ROOT/ENV. Không sao chép toàn cây hoặc overwrite mù.

## T1 — Đóng băng danh sách và tạo khả năng phục hồi

**Đọc:** cả 5 worktree và 2 orphan; audit cũ chỉ là baseline.
**Tạo sau khi được thực hiện:** `EVIDENCE/file-decisions.json`,
`RECOVERY/manifest.json`, bundle ref công việc và archive nguồn chọn lọc.

- [ ] Chạy lại worktree/status/HEAD/remote, đo disk, liệt kê tracked,
  untracked **và ignored** theo allowlist. Không đọc `.env*`, không đi theo
  junction/symlink. Ghi reparse point thành mục cần xử lý riêng.
- [ ] Manifest mỗi file có: checkout, path, size, SHA-256 (trừ secret), trạng
  thái Git, keep/import/archive/delete/hold, đích đến, lý do, dependency và
  bằng chứng bản thay thế. Ghi số file và bytes mỗi nhóm.
- [ ] Chốt hash các model/texture/manifests runtime và các file code đang dirty.
  Ghi riêng Cổng Mây; sao accepted motion/asset approval từ HANDOFF environment.
- [ ] Ghi process PID + command line/cwd của các server liên quan, không dừng
  ở bước kiểm kê. Nếu nguồn thay đổi sau inventory, cập nhật trước khi copy.
- [ ] Tạo bundle chỉ ref `main`, graybox, animation, environment, Plaza và mốc
  baseline còn cần; không `--all` vì sẽ kéo hidden Codex snapshots/Blender vào.
  Bundle giữ lịch sử; archive riêng giữ working file/patch và nguồn ignored.
- [ ] Không nhân bản cache. Hash archive + giải nén thử vài file độc nhất
  (nhân vật, generator Cổng Mây, UI source, một Blend); `git bundle verify`
  phải thành công. Thử phục hồi file thành công rồi mới cho phép cleanup.

**Đạt:** mọi file độc nhất có quyết định và recovery; không mục `delete` thiếu
bằng chứng. Dung lượng đủ cho candidate và cài sạch tuần tự.

## T2 — Chuẩn bị candidate trong Plaza hiện có

**Sửa/tạo:** branch `codex/consolidated-checkpoint-2026-11-14`,
`.gitignore`, `HANDOFF.md`, `docs/maintenance/consolidation-2026-11-14.md`;
import `.agents/skills/game-ui-workflow/SKILL.md` và docs thích hợp từ ROOT/ENV.

- [ ] Từ HEAD Plaza `e3f606e`, tạo branch trên chính working tree đang dirty;
  xác minh không đổi working files, không tạo thêm worktree phát triển.
- [ ] Trước khi nhập source, ghi baseline visual/performance của Plaza theo
  viewport, camera và protocol T5. Lưu ảnh, metrics và hash source đi cùng để
  sau này không phải dựng lại môi trường cũ chỉ để đo đối chứng.
- [ ] Giữ package/lockfile Plaza làm cơ sở. Gộp docs theo nội dung và thời gian
  nghiệm thu, không chép đè HANDOFF. Bảo toàn AGENTS.md của owner.
- [ ] Chuyển nguồn authoring/evidence cần giữ theo T4, rồi đưa output sinh lại
  vào ignore rõ ràng. Không blanket-ignore output để che nguồn chưa phân loại.
  README authoring, asset contracts và bằng chứng nghiệm thu gọn phải ở docs.
- [ ] Ghi từng chênh lệch v0.3b/root/orphan là đã nhập, bản cũ được thay thế hay
  chỉ archive. Đặc biệt 15 common-path delta v0.3b không được bỏ vì HEAD cùng main.

**Đạt:** candidate có danh sách nguồn vào/nguồn giữ riêng; không có merge toàn
bộ environment hoặc thay camera/terrain bằng bản flat-world.

## T3 — Ghép nhân vật, NPC và motion với terrain mới

**Import từ ENV, giữ các test đi cùng:**

- `src/components/world/npc-actor.tsx`.
- `src/lib/world/character-{locomotion,action-motion,pose-details}.ts`,
  `npc-{motion,pose}.ts`, `vrm-foot-contact.ts`.
- Test academy-character-asset, academy-khoa-male, academy-npc-refinement,
  authored-locomotion-vrm, character-action-motion, character-action-vrm,
  character-locomotion, character-pose-details, education-motion,
  locomotion-posture-vrm, npc-character-assets, npc-motion, vrm-foot-contact,
  vrm-lifecycle; `tests/helpers/load-world-vrm.ts`.
- `public/models/characters/academy-{scholar,an,khoa,minh}-v1.vrm`,
  `public/models/animations/{locomotion.json,actions.json,LICENSE-CC0.txt}`.
- Script `create-academy-character.mjs`, `refine-academy-player.mjs`,
  `refine-khoa-robe.mjs`, `academy-menswear.mjs`, `academy-npc-embroidery.mjs`,
  `convert-locomotion.mjs`, và `scripts/assets/{README.md,academy-crest.svg,khoa-portrait-source.vrm}`.

**Hòa giải có chọn lọc:** `character-avatar.tsx`, `vrm-loader.ts`,
`animation-state-machine.ts` + test, `character-assets.ts`, character manifest,
`world-client-shell.tsx` + test, `world-canvas.tsx`, `world-scene.tsx`,
`map-config.ts`, `types.ts` và world/character regression tests.

**Giữ Plaza:** route `/world` và query study, physics/terrain, camera,
`plaza-study-*`, sky/weather/landscape, `island-v2/*`, water/loading/LOD tests.
Không import `world-rain.tsx`, `rain-model.ts`, sky v3 relight hay environment
landscape files chỉ vì chúng hiện diện riêng ở ENV.

**Giao diện tích hợp dự kiến:**

- Truyền `activeDialogueLineIndex?: number | null` shell → canvas → scene;
  đúng NPC nhận `lineIndex`, NPC khác nhận `null`.
- `HumanoidPose` thêm `footGroundY?: number` (mặt đỡ theo tọa độ world, mặc định
  0 để tương thích); PlayerRig gắn `config.groundHeight?.(p.x,p.z) ?? 0` vào pose,
  NPC gắn cao độ vị trí của nó. IK chỉ sửa pose, không sửa root/physics.
- Helper `npcLookPitch(player: Vec3Tuple, npc: Vec3Tuple): number` trong
  `npc-motion.ts`, dùng chênh y và khoảng cách XZ có chặn tối thiểu 0,5 m.
- `CharacterAvatar` giữ `authoredLocomotion`, camera fade, book của Minh,
  onRegisterStepController và cleanup/cancel của ENV; player bật authored,
  NPC dùng motion của role. Một owner step mỗi actor.

- [ ] RED: mở rộng shell test để dòng 0 → 1 → đóng có index đúng; NPC không
  được chọn vẫn null. Mở/đóng/đi ra xa không giữ gesture cũ.
- [ ] RED: `npc-motion.test.ts` kiểm player/NPC cùng y=4 cho pitch 0, cùng
  delta y ở -2/0/4/7 cho kết quả giống nhau; giá trị hữu hạn khi trùng XZ.
- [ ] RED: foot-contact/real-rig test đặt actor ở -2/0/4/7, walk/stop/jump/land
  tại 30/60/120 Hz; độ hở chân tính tương đối mặt đỡ phải như baseline y=0,
  không đổi root, không giữ anchor tầng trước. Không nới ngưỡng correction 8 cm.
- [ ] Nhập phần đã duyệt và sửa nhỏ để GREEN. Khi mặt đỡ thay đổi, bỏ anchor
  cũ bị sai cao độ; không xây mới hệ IK từng chân. Giữ căn cứ terrain/collision
  từ Plaza và thứ tự -2/-1/0, không render takeover.
- [ ] Kiểm fixture/hash/permission các VRM, missing clip/model fallback,
  tải muộn sau unmount, remount URL, teleport/ẩn tab; giữ mọi case real-rig có sẵn.
- [ ] Chạy `pnpm vitest run src/lib/world src/components/world src/app/world
  --maxWorkers=2` (một lệnh trên một dòng khi thực hiện). Ghi số pass thật;
  số 827 của Plaza trước đây không phải kết quả bản kết hợp.

**Đạt:** nhóm test GREEN, không mất terrain/camera/water contracts. Nếu integration
cần thay đổi vượt ngoài các adapter trên, ghi phạm vi cụ thể trước khi mở rộng.

## T4 — Chốt runtime và compact nguồn authoring

**Sửa:** script prepare/optimize asset, package/lockfile, docs asset provenance.
**Tạo:** ART/manifest, README; EVIDENCE/runtime-files.json và source dependency map.

- [ ] Pin `meshoptimizer@1.1.1` và `sharp@0.35.5` là dev dependency trực tiếp vì
  script sử dụng chúng; hiện đã có transitive trong lockfile. Dùng exports
  package hợp lệ thay hai dạng đường dẫn hardcode `.pnpm`; không đổi runtime
  decoder `three/addons/libs/meshopt_decoder.module.js` hay nâng phiên bản khác.
- [ ] Dựng manifest runtime theo asset resolver + JSON/glTF/GLB URI + script/test
  reference, không chỉ tìm chuỗi URL. Giữ explicit detailed collection dù route
  thường dùng LOD. Mọi external texture và model.bin phải có trong checkpoint.
- [ ] Nhóm bộ test cần fixture riêng được giữ đủ, đặc biệt Khoa portrait source;
  không skip test/giảm assertion chỉ để checkout nhỏ hơn.
- [ ] Sao có kiểm hash nguồn theo closure trong spec sang ART. Giữ cấu trúc
  `output/<family>` cho các đường dẫn tương đối; ghi dependency v1 tại D:/Dev/Tools
  và kiểm tồn tại/hash, không dọn thư viện ngoài phạm vi.
- [ ] Đổi đường dẫn root cũ ở `mountain-v6-silhouette/build-shape.py`,
  `verify-export.py`, và script kiểm nguồn còn giữ sang vị trí ART tương đối.
  Giữ nguồn v6 gốc làm input; giữ bản Cổng Mây sửa làm output hiện hành.
- [ ] Mở/verify từng Blend hiện hành, resolve texture/external library; kiểm cả
  generator lẫn verifier đọc đủ input từ nơi mới. Xuất thử vào staging riêng
  một đảo và Cổng Mây, không đè approved/runtime. So hash khi deterministic;
  nếu metadata Blender biến đổi, ghi khác biệt và so geometry/material/visual.
- [ ] Chạy script LOD ra output tạm bằng dependency khai báo; đối chiếu manifest,
  decoder và các invariant texture/material/shape trước khi coi cache tái tạo được.
- [ ] Lưu nguồn UI đúng folder (backpack-v3/settings-v1) và prototype chưa duyệt
  riêng; giữ bản duyệt cuối, contact sheets và báo cáo. Chưa tích hợp UI/gameplay.

**Đạt:** runtime tự đủ khi không còn output/worktree khác; ART kiểm được tại
đường dẫn mới và ghi rõ dependency ngoài. Danh sách xóa là file-level đã review.

## T5 — Kiểm bản kết hợp và tự review

**Evidence:** `EVIDENCE/QA.md`, gate logs, ảnh chọn lọc, before/after metrics.

- [ ] So candidate với baseline Plaza đã ghi ở T2 trong cùng viewport
  1440×1000/DPR1, camera/giờ/thời tiết/cache. Không chạy build/test đồng thời lúc đo. Mỗi view
  lấy 3 mẫu 30 giây sau warm-up; báo p50/p95/p99 frame time, frame >50 ms,
  calls/triangles/textures/geometries, thời gian asset ready và số request.
- [ ] QA `/world`, study walking/overview và personal space: player nữ, đúng
  An/Khoa/Minh, sách, đối thoại; đi/chạy/dừng/nhảy, cầu thang/cầu cao, vùng -2/4/7,
  orbit/camera fade, map swap 3 lần, missing model/clip fallback.
- [ ] Chụp overview và 8 hướng xung quanh Plaza, cận Cổng Mây, ngày/đêm; kiểm
  silhouette, cây, thác/nước và đường chân trời. Viewport 390×844 + reduced
  motion kiểm bố cục; không gọi đây là benchmark điện thoại thật.
- [ ] Đối chiếu water: 1 main render/frame; góc không có nước không capture;
  quay lại capture phục hồi; memory counters không tăng qua các lần đổi map.
- [ ] Ngưỡng kiểm hồi quy: ở view không thấy NPC, p95 không tăng >10% sau 3
  cặp mẫu cùng điều kiện; nếu vượt, điều tra trước dọn. View có NPC phải báo
  chi phí tăng của VRM, không giả vờ cùng workload. Ngưỡng này là chặn hồi quy
  đề xuất, không phải lời hứa 60 FPS hay kết quả đo sẵn.
- [ ] Dừng đúng dev parent/Next child, đóng QA; chạy `pnpm typecheck`,
  `pnpm lint`, `pnpm vitest run --maxWorkers=2`, `pnpm build`. Tất cả exit 0,
  toàn suite không skip/giảm assertions; `git diff --check` không lỗi whitespace.
- [ ] Tự review riêng actual diff, asset manifests, route/auth, license,
  ignored files, tests và nguồn đã duyệt. Ghi vấn đề đã sửa và giới hạn còn lại.

**Đạt:** 4 gate + visual đạt; có số đo và ảnh thực. Nếu lỗi chưa xử lý, giữ
checkout gốc, không chuyển sang gỡ worktree.

## T6 — Checkpoint có thể lấy lại từ GitHub

**Sửa:** chỉ tập file approved trên candidate; tài liệu clean install/asset map.

- [ ] Trước commit: explicit staging allowlist, xem staged diff/path/size;
  không stage `.env*`, output/source Blend/cache/browser state. Kiểm cả blob
  lịch sử branch sẽ push dưới 100 MiB. Không đổi ignore để che thiếu tài sản.
- [ ] Khi owner đã yêu cầu checkpoint ở round thực hiện và 4 gate GREEN,
  commit snapshot hợp nhất; không commit tùy từng task khi gate chưa đủ.
- [ ] Trước push kiểm tích hợp deploy từ GitHub/service nếu được kết nối. Nếu
  chưa chứng minh branch không kích hoạt deployment, giữ commit local và nêu
  chính xác điểm cần xử lý; push không thay thế quyền deploy/schema.
- [ ] Push đúng `codex/consolidated-checkpoint-2026-11-14` lên origin.
  `git ls-remote` phải trả đúng full SHA commit; không push nhánh/snapshot khác.
- [ ] Lấy chính SHA từ remote vào checkout xác minh tạm, không local shared
  objects, không copy node_modules/output/env. `pnpm install --frozen-lockfile`,
  kiểm runtime hash và đủ 4 gate. Cấp dev bypass bằng biến process `true` để
  smoke `/world` trên loopback, không đọc/copy `.env*` hoặc đụng database.
- [ ] Nếu build/preview thiếu env, dùng đúng cơ chế cấu hình không-secret được
  repo hỗ trợ; báo giới hạn thay vì tự đọc secret hoặc tuyên bố pass.
  Ghi kết quả và xóa checkout xác minh sau khi nguồn đã được bảo toàn.

**Đạt:** SHA remote + hash runtime + kết quả clean install/QA chứng minh
checkpoint tự đủ. `main` giữ nguyên, chưa deploy.

## T7 — Chuyển về root, rồi mới gỡ worktree và asset dư

**Sửa:** checkout tại ROOT, đăng ký worktree; file trong deletion manifest.

- [ ] Đối chiếu lại hash ROOT/ENV/Plaza với T1; mọi thay đổi phát sinh phải
  được xử lý trước. Xác nhận nguồn ART + recovery + remote đạt, không chỉ HEAD.
- [ ] Candidate clean thì detach checkout Plaza tại SHA checkpoint để giải
  phóng tên branch. Không detach/restore khi còn thay đổi chưa được lưu.
- [ ] Root: giữ `.git`, `.worktrees`, cấu hình local; bảo toàn dirty HANDOFF,
  docs/art và mọi untracked có giá trị. Chuyển các untracked cản checkout vào
  recovery theo từng path. Chỉ restore các tracked path đã nhập/lưu và xác minh
  rõ ràng về HEAD cũ, rồi `git switch` branch checkpoint. Không reset-hard/clean.
- [ ] Root cài theo lockfile, chạy 4 gate khi không có dev dùng `.next`;
  smoke camera/terrain/nhân vật, đối chiếu runtime hash. Ghi working directory
  và URL preview chuẩn trong HANDOFF.
- [ ] Gỡ theo thứ tự: baseline → animation đã hòa giải → orphan đã bảo toàn →
  environment → Plaza phụ cuối cùng. Với worktree hợp lệ chỉ `git worktree
  remove` không force khi đã sạch; nếu bị từ chối, kiểm file còn lại, không ép.
- [ ] Với source/cache/ignored file cần xóa, kiểm resolved absolute path nằm
  đúng allowlist; kiểm file hash/mtime chưa đổi, không theo reparse point.
  Dùng PowerShell native, path literal, xóa file được liệt kê rồi thư mục rỗng;
  không ghép lệnh xóa qua shell khác hoặc recursive wipe.
- [ ] Trước gỡ, chỉ kiểm tên và sự tồn tại của cấu hình local từng checkout;
  bản riêng giữ nguyên nội dung bằng move cùng volume tới kho private ngoài
  repo, không trộn vào root hay checkpoint. Có file chưa bảo toàn thì giữ checkout.
- [ ] Backup Blender/renders/cache chỉ xóa các dòng đã đạt điều kiện T4/T5.
  Không xóa toàn v1/v2/v4/v5, không xóa approved v18, không `.git` object/ref cleanup.
- [ ] Giữ tên các branch lịch sử tới hết review; chúng không tạo thêm checkout
  và xóa chúng không giải phóng các cache đã nêu. Không tạo tag/branch rác mới.

**Đạt:** `git worktree list` còn ROOT, 2 orphan đã xử lý; source sạch trừ output
QA được ignore, app root chạy được. Nếu phải giữ file/checkouts chưa rõ, báo số
còn lại và lý do, không đánh dấu hoàn tất giả.

## T8 — Handoff và số liệu sau dọn

- [ ] Ghi branch + full SHA + link GitHub, URL preview, lệnh cài/chạy/check,
  nơi sửa/export art, dependency ngoài, vị trí recovery và thời điểm kiểm tra.
- [ ] Đo dung lượng logic theo cùng phương pháp audit, đo free space thực trước/
  sau; tách dung lượng chuyển D→C, retained recovery, cache mới do verify và
  disk thực thu hồi. Không cộng hai lần worktree và cache con của nó.
- [ ] Ghi trạng thái streaming chưa làm, chi phí thêm NPC, vấn đề visual đã có
  trước; không mở round fix GPU. Giữ archive phục hồi qua lần review đầu của owner.

## Tự review của round lập kế hoạch

Đã kiểm kế hoạch với audit và source: sửa giả định NPC đã được dời theo terrain;
chỉ ra y=0 trong gaze/foot contact; giữ fixture Khoa để clean-clone không mất
test; ghi dependency Blender ngoài repo và đường dẫn package transitive;
giữ Cổng Mây derivative; tránh đếm trùng dung lượng; tách remote checkpoint khỏi
deployment; đặt bước lấy lại từ remote và root verification trước gỡ source cũ.
Chưa chạy merge thử, test/build, benchmark, export Blender hoặc cleanup ở round này.
