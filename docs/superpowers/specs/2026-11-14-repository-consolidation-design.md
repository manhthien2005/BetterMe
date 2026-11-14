# Hợp nhất BetterMe và thu gọn nguồn làm việc

Ngày: 14/11/2026. Trạng thái: **đề xuất để owner review; chưa thực hiện**.

## Mục tiêu và phạm vi đã chốt

Gom các phần đã hoàn thiện thành một bản game, bảo toàn nguồn đã duyệt, giảm
dung lượng dư và có checkpoint GitHub có thể tải về để tiếp tục làm việc.
Owner chọn: **code + asset chạy game lên GitHub; nguồn Blender giữ gọn trên máy**.

Checkout cuối: `D:/Dev/Projects/BetterMe`. Không tạo thêm worktree phát triển
thường trực. Thực hiện bằng một agent, tự review riêng. Round hiện tại chỉ tạo
thiết kế/kế hoạch; việc ghép, di chuyển, xóa, commit và push thuộc round thực hiện.

Không thay thiết lập GPU, thiết kế lại nhân vật, làm lại UI prototype, đổi schema,
deploy ứng dụng hay triển khai thêm hệ thống streaming trong lần hợp nhất này.
Giữ các bất biến no-guilt/no-decay và quyền truy cập hiện có.

## Hiện trạng có bằng chứng

Nguồn số liệu: `output/repository-audit-2026-11-14/REPORT.md`, `inventory.json`,
`assets.json`, `git-metadata.json`; kiểm tra thêm source ngày 14/11/2026.

- 5 worktree đăng ký: root, Plaza, environment, animation v0.3b, motion baseline.
  Thêm 2 thư mục mồ côi: `deploy-main`, `t001-toolchain`.
- GitHub public `manhthien2005/BetterMe` chỉ có `main` tại `e0a9108`; chưa có game
  hiện tại. Ba commit local là `e00fabb`, `2e07a39`, `e3f606e`.
- Plaza tại `e3f606e` và environment tại `2e07a39` tách từ `e0a9108`. Không thể
  xem Plaza là bản đã bao gồm environment. Hai nhánh đổi chung 91 đường dẫn,
  trong đó 51 thuộc `src/`; đây chưa phải số conflict được đo bằng merge thử.
- Plaza: 41 file tracked thay đổi, 483 untracked. Environment: 10 tracked thay
  đổi, 49 untracked; toàn bộ `output/` bị ignore nên còn nguồn riêng ngoài số này.
- Tổng 7 thư mục: 16,06 GiB logic. Dependency/build cache 7,38 GiB; phần ngoài
  root 4,94 GiB. `.git` 2,30 GiB, chủ yếu snapshot local của Codex.
- Lần kiểm tra thêm: D còn khoảng 7,16 GiB trống, C khoảng 29,72 GiB. Phải đo lại
  trước thực hiện; không nhân bản cả 16 GiB lên D để làm backup.

Các số dung lượng là tổng chiều dài file, không phải cam kết dung lượng đĩa
thu hồi; pnpm hardlink, compression và recovery archive ảnh hưởng kết quả.

## Cách hợp nhất đề xuất

**Dùng nội dung Plaza hiện tại làm nền, nhập có chọn lọc phần đã duyệt từ
environment và root.** Tạo nhánh `codex/consolidated-checkpoint-2026-11-14` ngay
trong checkout Plaza hiện có, kế thừa `e3f606e`. Giữ các nhánh cũ để phục hồi.

Merge nguyên các nhánh sẽ đưa cả sky/rain/scene đời cũ vào phạm vi hòa giải và
không tự xử lý các file untracked/ignored. Dựng repository mới sẽ bỏ quan hệ
lịch sử không cần thiết. Cách chọn theo nhóm chức năng giữ lịch sử Plaza và cho
phép kiểm soát từng phần nhập; manifest phải ghi cả nguồn commit và hash của
working file chưa commit, vì tên branch không mô tả đủ trạng thái hiện tại.

| Nguồn | Đưa vào bản hợp nhất | Bảo toàn riêng / không nhập đè |
|---|---|---|
| Plaza hiện tại | Terrain, bậc thang/cầu, camera, núi/đảo, LOD, nước, sky/weather và test tương ứng | Không để source môi trường cũ ghi đè các phần này |
| Environment hiện tại | Player nữ, An/Khoa/Minh, NPC actor/personality, locomotion/actions, pose, foot contact, lifecycle và test real VRM | Sky relight/rain/landscape cũ; prototype gameplay chưa nghiệm thu |
| Root | Chuẩn art, skill `game-ui-workflow`, spec/handoff liên quan, nguồn UI đã review | Không nhập lại graybox/controller/HUD cũ chỉ vì root là thư mục chính |
| Animation v0.3b | Chỉ chênh lệch còn hữu ích sau đối chiếu từng file | Animation state machine/test đã trùng Plaza; không nhập cả scene/physics |
| Motion baseline | Giữ mốc `e00fabb` trong lịch sử/recovery | Checkout chỉ khác `next-env.d.ts` sinh tự động |
| Hai orphan | Nguồn/doc/tooling thực sự độc nhất, nếu còn cần | Dependency/cache, bản trùng đã xác minh |

UI túi đồ/settings/portal/HUD và gameplay prototype được giữ như nguồn thiết
kế, không tự nâng thành tính năng đang chạy. Nguồn túi đồ v5 nằm ở
`output/backpack-v3/`, settings v2 ở `output/settings-v1/`.

## Các điểm ghép cần kiểm tra riêng

1. **Hội thoại:** environment truyền `activeDialogueLineIndex` từ shell qua
   canvas/scene đến `NpcActor`; Plaza chỉ truyền `activeDialogueNpcId`. Phải
   khôi phục dòng hội thoại để giữ greet/explain/attentive/farewell.
2. **Địa hình:** `PLAZA_STUDY_MAP_CONFIG` hiện kế thừa `npcs` từ map gốc, chưa có
   phép dời NPC theo terrain trong file này. Giữ vị trí đã có, kiểm cao độ và
   khả năng tiếp cận trong cả `/world` lẫn `/world?plaza=study`; chỉ sửa vị trí
   khi có lỗi cụ thể, không thiết kế lại bố cục.
3. **Hướng nhìn NPC:** code environment dùng `-atan2(playerY, distance)`.
   Khi actor ở cao độ khác 0, phải dùng độ chênh giữa player và NPC.
4. **Chân nhân vật:** `vrm-foot-contact.ts` ghi rõ flat-floor, tính mặt sàn từ
   `target.y - rootPosition.y`. Không bê giả định y=0 lên các tầng -2/0/4/7.
   Truyền cao độ mặt đỡ vào bước pose/IK, không để animation sửa physics.
   Không mở rộng thành hệ IK theo từng bậc/chân hoặc cloth simulation.
5. **Thứ tự frame:** giữ PlayerRig -2, overview camera -1, water/effects 0 và
   render tự động một lần. Avatar chỉ được step bởi một owner; việc thêm NPC
   không được làm render capture đọc camera/pose cũ.
6. **Bộ nạp:** giữ xử lý tải clip song song, fallback, cancel/unmount, đổi asset
   URL, reset khi teleport/ẩn tab của environment; ghép với camera fade mới.

Việc nhập thêm VRM có chi phí thật: 4 model và clip thêm khoảng 55,23 MiB.
Không kết luận dọn folder sẽ làm FPS tăng. Đo lại bản kết hợp so với Plaza
trong cùng điều kiện; camera chứa NPC sẽ có chi phí render khác.

## Nội dung checkpoint GitHub

Bao gồm source/test/config/lockfile, tài liệu cần để tiếp tục, runtime manifest,
license/provenance và toàn bộ asset phục vụ game:

- `public/world/`: Plaza, nature, sky, 10 núi, 7 đảo chi tiết và 7 đảo LOD cùng
  texture phụ thuộc. Giữ cả bản chi tiết theo yêu cầu trước của owner.
- `public/models/`: model mẫu/fallback đang được sử dụng, 4 nhân vật academy,
  animation JSON và license. Giữ các contract/hash tương ứng.
- Các script sản xuất nhỏ, có ích; sửa import qua package được khai báo thay
  vì đường dẫn nội bộ `node_modules/.pnpm/...`.
- Ngoại lệ cần cho test hiện hữu: `scripts/assets/khoa-portrait-source.vrm`
  khoảng 15,23 MiB và crest SVG/README. Đây là fixture nguồn mà test bảo toàn
  mặt/tóc/morph của Khoa đang đọc; giữ nó trong Git giúp clone sạch chạy đủ test,
  không phải đưa thư viện Blender lên GitHub.

Public hợp nhất dự kiến khoảng 404,27 MiB từ bản hiện tại; đây là kích thước
file, không phải dung lượng Git pack hoặc payload tải lúc mở game. File runtime
lớn nhất hiện khoảng 72,58 MiB. Chưa cần chuyển toàn bộ asset sang Git LFS;
kiểm mọi blob sắp push để không có file >=100 MiB, kể cả lịch sử branch.

Không đưa Blender/backup `.blend1/.blend2`, raw research, browser session,
ảnh/video QA hàng loạt, cache, `node_modules`, `.next` hay hidden Codex refs
vào checkpoint. Không dùng `git add .`, `push --all` hoặc `push --mirror`.

Push đúng một branch checkpoint; root cuối checkout branch đó. Chưa tự đổi
`main`. Việc merge vào `main` và deploy là quyết định tiếp theo: chưa xác định
cấu hình auto-deploy phía dịch vụ; local không có `.github/`, `vercel.json`
hoặc `.vercel/` ở root/Plaza để chứng minh hành vi đó. Không suy ra push vô hại
đối với deployment chỉ từ việc thiếu các file này.

## Thư viện nguồn local

Đề xuất `D:/Dev/ArtSources/BetterMe/`, tách khỏi Git checkout. Giữ cấu trúc
tương đối của các generator để tránh viết lại pipeline:

```text
BetterMe/
  README.md                  # mở/sửa/export bằng công cụ và phiên bản nào
  manifest.json              # đường dẫn cũ/mới, SHA-256, phụ thuộc, bản duyệt
  output/
    tiny-glade-island-v1/approved/v18/   # giữ immutable
    floating-islands-v2/                # generator, Blend hiện hành, manifest
    rock-mountains-v1/                  # chỉ closure cần dùng
    rock-mountains-v2/
    rock-mountains-v4/
    rock-mountains-v5/
    rock-mountains-v6/
    mountain-v6-silhouette/             # nguồn Cổng Mây đã sửa
  prototypes/                          # nguồn UI/gameplay được phân loại
  evidence/                            # ảnh duyệt và báo cáo cuối gọn
```

Chuỗi phụ thuộc: đảo v2 → kit v18; núi v6 → v5 → v2/v4, helper v1/v2 và kit
v18. Không xóa folder v1/v2/v4/v5 chỉ dựa vào tên phiên bản. Lưu closure cả
script, `.blend`, texture, input GLB/manifest và file mà verify đọc.

`floating-islands-v2` còn đọc bản v1 tại
`D:/Dev/Tools/Blender/assets/floating-island-collection-v1` (GLB/hash và
`landSpan` trong manifest). Ghi nguồn này là phụ thuộc ngoài, giữ nguyên; không
tính nó vào dung lượng dọn hay tuyên bố thư viện mới đã tự đủ mọi input.
Đổi riêng các đường dẫn absolute đến root cũ trong generator Cổng Mây và các
script verify còn được giữ; không sửa tạo hình. Kiểm nguồn mới trước khi bỏ cũ.

7/7 GLB đảo chi tiết và 9/10 GLB núi khớp bản nguồn. Riêng Cổng Mây runtime là
derivative đã sửa, phải giữ nguồn riêng và hash riêng. Không đồng bộ nó ngược
về bản v6 gốc. Bản v6 gốc vẫn là input của generator sửa silhouette.

## Dọn gì và khi nào

| Nhóm | Dung lượng logic đã đo | Điều kiện cho phép bỏ |
|---|---:|---|
| Dependency + `.next` ở checkout ngoài root | 4,94 GiB | Dừng đúng process; đã kiểm dependency cài lại được; không có file nguồn nằm lẫn |
| 29 backup Blender | Tối đa 0,90 GiB | Mỗi file có `.blend` hiện hành/bản duyệt thay thế, mở/verify được; giữ backup độc nhất |
| Tiny Glade renders/baselines | Tối đa 1,64 GiB | Giữ bản duyệt/contact sheet/evidence cần đối chiếu; phần còn lại không phải input |
| Plaza source download cache | 0,137 GiB | Runtime và provenance đủ; xác minh nguồn/hash để tải lại hoặc giữ nguồn không thể tải lại |
| Các output/test/QA dư khác | Chưa chốt | Có quyết định ở cấp file trong manifest; không suy ra từ `git status` |
| `.git` snapshot refs | 2,30 GiB tổng `.git` | Tách round xử lý retention được hỗ trợ; không xóa object/ref thủ công |

Ba nhóm asset ứng viên trên là tối đa khoảng 2,68 GiB ngoài nhóm cache; phải
trừ phần giữ lại và đối chiếu path để không đếm trùng. Không cộng toàn bộ dung
lượng worktree thêm một lần vào 4,94 GiB cache đã tính.

Trước thao tác phá hủy: recovery có hash cho nguồn/dirty/untracked/ignored
cần giữ, bundle chỉ các ref công việc cần thiết, thử đọc/khôi phục mẫu. Recovery
không chứa cache lớn; có thể đặt tại `C:/Users/MrThien/BetterMe-recovery/2026-11-14/`
nếu dung lượng hiện tại cho phép. Đây là khả năng phục hồi local, chưa chứng
minh backup trên ổ vật lý khác. Giữ recovery qua lần owner review đầu tiên.

Không đọc/hash/in nội dung `.env*`. Giữ cấu hình root tại chỗ. Nếu checkout phụ
có cấu hình local riêng, phải giữ nguyên file bằng di chuyển cùng volume vào
kho private ngoài checkout trước khi gỡ; không ghi đè cấu hình root hoặc đưa
vào archive public. Không xóa thư mục có cấu hình chưa được bảo toàn.

## Điều kiện kết thúc round thực hiện

- Một checkout đăng ký tại root; các orphan không còn sau khi phần riêng đã
  được giữ. Nhánh cũ được giữ tới hết review, vì branch gần như không tốn dung lượng.
- App và các test chạy từ nguồn Git, không phụ thuộc worktree/ignored output.
- Cả 4 gate xanh trên bản kết hợp; kiểm visual và đo frame time thực tế.
- Checkpoint remote có đúng SHA; bản lấy lại từ remote có đủ runtime/hash và
  chạy được sau `pnpm install --frozen-lockfile`.
- Nguồn Blender hiện hành và dependency được kiểm tại chỗ mới; tài liệu chỉ
  đúng nơi làm việc tiếp, không còn nhầm output tạm với nguồn duy nhất.
- Có sổ di chuyển/xóa và dung lượng trước/sau. Giữ recovery khi còn mục chưa rõ.

Giới hạn phải ghi trong handoff: 7 LOD hiện vẫn tải khi vào Plaza; culling water
capture không phải loading theo tầm nhìn hay chuyển LOD tự động theo khoảng
cách. Không đánh dấu phần streaming này hoàn thành nhờ hợp nhất repository.
