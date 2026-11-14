# Character motion — xác minh ngày 2026-11-10

## Bổ sung sau trải nghiệm của owner: authored walk/run

Owner phát hiện idle sau walk vẫn kẹt chân dù round trước đã qua kiểm tra kỹ
thuật. Tái hiện cho thấy state đã là idle nhưng IK còn giữ điểm tựa của bước
cuối. Bản sửa bỏ anchor khi hết gait và đưa chân về trong 0,2 giây, tránh giật
khi thả. Regression kiểm raw skeleton ở nhiều pha dừng, 30/60/120 Hz.

Owner cho phép clip miễn phí. Sau research Three/VRM và preview KayKit/UAL, bản
mới dùng Walk_Loop + Jog_Fwd_Loop từ UAL Standard CC0 2025-06-10, retarget sang
VRM cũ; idle/NPC/sky/camera/physics giữ nguyên. Nguồn, license, hashes và script
tái tạo: `docs/locomotion-assets.md`. Dữ liệu runtime chỉ 104.161 byte, không thêm
mesh, texture hoặc dependency. Chỉnh chân bị giới hạn 8 cm và giữ hướng bàn chân
gốc; không thay toàn bộ quỹ đạo swing bằng IK.

### Kiểm tra hành vi và hình ảnh mới

- Rig thật: dừng walk/run sau 0,35 / 0,7 / 1,1 / 4 giây ở 30/60/120 Hz; chân về
  dưới thân, root không bị animation di chuyển, drift mid-stance ≤5 cm. Có kiểm
  tốc độ chân để phát hiện giật, loop seam, xoay bàn chân khi swing và chuỗi đổi
  walk/run/turn/jump/land liên tục. Pose rotation đo tương đối với actor để không
  nhầm tốc độ quay 180° của controller với lỗi clip.
- Browser `/world`, 1440×1000: authored được tải thật; walk/run/jump và dừng về
  idle. Đi vào fountain dừng ở z=2,2, state idle, mắt cá y≈0,101 m. Đổi hướng và
  Shift liên tục không giữ stance cũ. NPC vẫn ready/idle.
- 390×844 + reduced motion: vẫn walk khi di chuyển và trở về idle; không phát
  hiện tràn ngang mới. HUD mobile cao và hướng dẫn điều khiển cũ vẫn còn.
- Chặn riêng `/models/animations/locomotion.json`: model vẫn ready, đi được với
  procedural fallback. Bỏ chặn/reload: authored trở lại. Clip load độc lập model
  load, có timeout 5 giây và guard không gắn clip vào rig đã unmount/dispose.
- Preview so nguồn/VRM ở trước và bên sử dụng chính adapter runtime; đã kiểm
  ảnh `compare-front.png`, `compare-side.png`, `compare-stop.png`, ảnh gameplay
  walk/run và mobile. Video `compare-source-vrm.webm`, `target-gameplay.webm`.
  Các ô so sánh có thể khác pha; không dùng ảnh tĩnh để tuyên bố mượt mọi thời điểm.
- Browser bình thường sau phục hồi: **0 console errors**, 2 warnings Three có
  sẵn. Impeccable mechanical detector trên hai TSX thay đổi trả `[]`.

Evidence/script/log của lượt này nằm trong ignored
`output/research/character-locomotion/`. Chưa nghiệm thu cảm giác cuối bởi owner.

### Hiệu năng lượt chuyển động

Mẫu dev 10.005,1 ms tại plaza trời quang, 1440×1000, DPR 1, chạy qua lại và đổi
hướng bằng Shift: 917 khoảng frame, p95 19,8 ms, p99 39,9 ms, 1 frame >50 ms.
Render: 163 calls / 581.140 triangles / 84 textures / 73 geometries. Không thêm
chi phí hình học từ clip. Mẫu này có chuyển động và đổi hướng; **không so trực
tiếp với mẫu idle 10,3 ms bên dưới**, không bảo đảm 60 FPS ổn định hoặc hiệu năng
điện thoại thật. Không đo auth/sync/production trong vòng locomotion.

### Self-review

Tự review riêng: một đường ghi pose, chuyển đổi rest space đúng chuỗi xương,
quaternion dữ liệu hợp lệ, không có root X/Z translation, phase theo tốc độ thực,
giữ idle/fallback, private playback, xử lý tải muộn/unmount/reset, pin/license
nguồn và phạm vi diff. Không subagent, commit/push/deploy hoặc sửa primary checkout.

### Bốn gate cuối

`pnpm verify` **exit 0**: `tsc --noEmit`, `eslint .`, **799 tests / 81 files
passed**, Next build compile thành công và tạo 11/11 static-page entries.
Log: `output/research/character-locomotion/verify-final.log`.

Lượt toàn bộ đầu tiên có 762/763 test pass; một test gộp sáu tình huống dừng ở
120 Hz vượt timeout mặc định 5 giây khi tranh CPU cùng cả suite. Đã tách matrix
dừng thành từng test, không giảm số frame, tình huống hoặc thay các ngưỡng đo.
Tổng test tăng vì tách ca. Lượt cuối tất cả qua. Server dev và Next children của
chính worktree đã dừng trước build; browser QA session và motion-lab 3022 đã đóng.

## Báo cáo round trước (giữ làm lịch sử, không thay kết quả mới)

Worktree `reading-quest-environment-v1`, nền `e00fabb`. Thiết kế và kế hoạch:
`docs/superpowers/specs/2026-11-10-character-motion-asset-later-design.md` và
`docs/superpowers/plans/2026-11-10-character-motion-asset-later.md`.
Round này dùng asset hiện có; chưa nghiệm thu tạo hình cuối.

## Kiểm tra đã chạy

- `pnpm vitest run src/lib/world src/components/world/world-client-shell.test.tsx`:
  **108 test / 17 file pass**. Bao gồm rig thật ở 30/60/120 Hz, bám chân ≤5 cm,
  nối swing/stance, reset sau teleport/stall, pose ngón, sự kiện hội thoại,
  reduced motion, tài nguyên actor độc lập và fallback khi rig không hợp lệ.
- Lint ban đầu phát hiện 2 lỗi và 2 cảnh báo trong các script chẩn đoán tạm của
  chat trước dưới `output/playwright/character-motion/`. Đã giữ nội dung dưới đuôi
  `.txt` để không đưa chúng vào nguồn lint. Không thay cấu hình lint.
- `pnpm verify` kết thúc **exit 0**: `tsc --noEmit`, `eslint .`, **748 test / 79
  file pass**, `next build` compile thành công và tạo 11/11 static-page entries.
  Log đầy đủ: `output/playwright/character-motion/verify.log`. Đã dừng đúng cây
  process dev của candidate và baseline trước build. `next-env.d.ts` được Next
  tự trả về đường dẫn types production; không chỉnh tay file sinh tự động.

## So sánh hiệu năng có kiểm soát

Cùng phiên browser QA của repo, localhost dev, viewport 1440×1000, DPR render 1,
Public Plaza tại `[0,0,5.8]`, camera spawn, preview Hạ / 12:15 / trời quang.
Chờ model ready và thêm 2,5 giây trước khi lấy 10 giây `requestAnimationFrame`.
Một mẫu mỗi bản; không chạy test/build trong lúc đo.

| Số đo | Baseline `e00fabb` | Candidate |
| --- | ---: | ---: |
| Khoảng đo | 10.005,1 ms | 10.005,3 ms |
| Số khoảng frame | 1.000 | 998 |
| p95 | 10,2 ms | 10,2 ms |
| p99 | 10,2 ms | 10,3 ms |
| Frame >50 ms | 0 | 0 |
| Tải player VRM, theo loader | 1.317 ms | 944 ms |
| Renderer draw calls | 107 | 163 |
| Renderer triangles | 304.580 | 581.140 |
| Renderer textures | 32 | 84 |
| Renderer geometries | 63 | 75 |

Candidate có player và hai NPC VRM tại plaza; baseline chỉ player VRM và NPC
hình khối. Counters render gồm các lượt vẽ, không phải tổng tam giác duy nhất của
file. Cache/timing nạp chưa được chuẩn hóa nên không kết luận candidate tải nhanh
hơn. Không có sự khựng đáng kể trong mẫu idle này; chi phí hình học/tài nguyên
tăng rõ. Đây không phải benchmark production, cold network, workload chuyển động
hay điện thoại thật, và không bảo đảm 60 FPS trên mọi máy.

Script đo lưu ở `output/playwright/character-motion/qa-performance.txt` (ignored).

## Browser QA và giới hạn

Session trước đã giữ ảnh/video đi/chạy/nhảy, An chào/giải thích/chờ đọc, Minh cầm
sách và hội thoại mobile tại `output/playwright/character-motion/`. Lượt tiếp tục
đã xem lại ảnh run, sách và mobile; chân/sách có hiển thị, không thấy rig bị vỡ.
Kiểm tra mới qua `pnpm browser run-code`:

- `qa-resume.txt`: đi → chạy, An greet → attentive → explain; đóng/mở rồi đi xa
  kết thúc hội thoại và trả NPC về idle. Nhảy đo được y=1,102 m rồi trở về y=0;
  giảm chuyển động vẫn giữ walk. Qua hai khu bằng HUD, model ở cả hai khu ready.
- Đi thẳng vào fountain dừng ở z=2,2 và animation trở về idle. Qua Khoa mở và đổi
  dòng được, có ảnh `resume-khoa.png`; dùng E tại cổng tới Personal World.
- `qa-minh.txt`: tới z=-10,53, Minh ready/attentive, sách gắn tay hiển thị;
  ảnh `resume-minh.png`. Ở 390×844 với reduced motion, đổi dòng và Escape hoạt
  động, hộp thoại nằm trong viewport; ảnh `resume-mobile-dialogue.png`.
- `qa-fallback.txt`: chặn request model → player và hai NPC fallback; vẫn đi và
  mở hội thoại, An greet. Bỏ chặn/reload → tất cả ready. Ảnh `resume-fallback.png`.
- Đã xem trực tiếp các ảnh mới `resume-greeting.png`, `resume-mobile-reduced.png`,
  `resume-minh.png`, `resume-mobile-dialogue.png`. Không tràn ngang ở 390×844.
  Console sau lượt chạy bình thường: 0 errors, 2 deprecation warnings.

Các script ban đầu đi theo thời gian đã có lần dừng ngay ngoài bán kính tương
tác; điều chỉnh QA sang chờ vị trí thực. Một lần `keyboard.press('Space')` quá
ngắn giữa hai frame không tạo nhảy; giữ phím 180 ms xác minh được nhảy. Không
sửa runtime để làm các kịch bản QA đó pass. Lỗi network trong test fallback là
lỗi được cố ý tạo. Video `movement.webm` do session trước ghi, không được xem như
bằng chứng owner đã nghiệm thu.

Viewport mobile 390×844 chỉ xác minh bố cục, không mô phỏng GPU hoặc hệ điều khiển
cảm ứng. HUD cũ chiếm nhiều chiều cao trên điện thoại; round nhân vật không thay
bố cục HUD/camera đã duyệt. Console cũ có favicon 404, deprecation `THREE.Clock`
và `PCFSoftShadowMap`; không dùng các cảnh báo này làm bằng chứng lỗi animation.

## Tự review riêng

Theo AGENTS.md, review trong cùng agent. Đã đọc đường shell → canvas → scene →
actor → loader, các điểm reset/cleanup và diff so với `e00fabb`.
Hội thoại giữ nguyên ID/nội dung/quyền; physics, camera, sky và asset không đổi.
Một chủ sở hữu áp pose cho mỗi actor; pose trước IK được lưu riêng để tránh đưa
kết quả IK vào smoothing ở frame kế tiếp. Rig lỗi được dispose, thiếu xương hay
biểu cảm được bỏ qua an toàn; URL mới remount owner cũ.

Kết quả tự review: không phát hiện lỗi critical/important bổ sung. Diff và danh
sách file đã được kiểm lại; không stage, commit, push, merge hoặc deploy. Giữ
worktree để owner xem và tiếp tục. Những quyết định thực thi: dùng tuning cadence
và hạ hông ở pose để giữ bước trong tầm chân của sample, không đổi physics; giữ
ledger/script QA ở local để có thể nối tiếp; không dùng subagent theo yêu cầu.

Giới hạn giữ lại: hướng mỹ thuật/model mới chờ chủ sở hữu; spring tuning theo tên
xương sample cần hiệu chỉnh khi thay; bám chân chỉ sàn phẳng; chuyển động đẹp hay
không còn cần owner xem video/chơi thử. Chưa kiểm live auth, Supabase, deployment
hoặc thiết bị mobile thật vì các phần đó ngoài round này.

## Hands / jump continuation — 2026-11-10

Owner has accepted walk/run/idle. This round finishes the separate hands/jump
supplement from the interrupted chat; visual acceptance of this refinement is
still pending. Scope/spec: `superpowers/specs/2026-11-10-hands-jump-design.md`.

- Fresh initial focused run: 41/41 in three files. Found a recovery bug during
  self-review: releasing movement midway through landing changed duration and
  rewound the crouch. New test failed with hips -0.327m (expected >= -0.112m).
  Fix captures recovery duration on contact; the five-file regression run passed
  72/72. Added a real-rig greeting/relaxed-hand check: action VRM file 8/8 pass.
- Existing rig tests cover stationary/running jumps at 30/60/120 Hz, floor
  clearance, hip absorption, unchanged root, and return to idle. Every accepted
  body bone matches the version without the hand supplement during idle/walk/run.
  The accepted locomotion asset's SHA-256 is unchanged.
- Browser 1440×1000: stationary and two running jumps all observed
  `jump → fall → land → idle`, root apex 1.410–1.413m, then y=0. Release during
  landing recovers normally. Immediate re-jump reached y=1.139m in the next jump.
- Source/runtime front and side phase captures inspected at launch, apex,
  descent, absorption and recovery. Hand close-ups inspected relaxed fingers and
  thumb clearance; source's full fist is softened for the sample VRM. The source
  lab shows the corresponding clip frame; runtime descent additionally blends
  toward landing. Screenshots do not establish equal playback timing.
- 390×844 with reduced motion: jump remains legible and controls work. Existing
  tall HUD can obscure the upper body; no HUD/camera changes in this refinement.
  This is desktop browser resizing, not a physical phone performance/touch test.
- Blocking only `actions.json` retains authored walk/run and procedural jump;
  removing the block and reloading restores authored actions. Player greeting
  and An's greeting observed; changing worlds remounts the player's supplement.
  The first QA path tried to walk through An's collider and timed out; corrected
  the approach to stop within interaction range, without changing the app.
- Impeccable mechanical detector on `character-avatar.tsx`: `[]`. Normal browser
  console: 0 runtime errors, two existing Three deprecations. Deliberate network
  errors during the fallback check are expected. Initial favicon 404 is existing.
- Separate self-review under AGENTS.md: checked parser bounds/quaternions,
  clamped one-shots, source license/hash, physics-owned height, airborne IK
  release, greeting mask, per-rig state, reset and late-load cancellation guards.
  No further critical/important finding after the recovery fix. No independent
  reviewer, commit, push, deploy or SQL changes.

Evidence (ignored): `output/research/hands-jump/`: `hands-front.png`,
`hands-side.png`, `{launch,apex,fall,land,recover}-{front,side}.png`,
`gameplay-recovered.png`, `mobile-reduced-jump.png`, `supplement-fallback.png`,
`greeting.png`, `source-runtime.webm`, and the reusable QA scripts.
Fresh full four-gate verification: **`pnpm verify` exit 0** — typecheck, lint,
**816 tests / 83 files**, production compile and static generation 11/11 pass.
Log: `output/research/hands-jump/verify.log`. Stopped the verified checkout's
Next dev tree (PIDs 38132, 38076, 19476) before building. QA browser and motion
lab were closed; local-only preview is restarted after the build. No staging.

## Education movement refinement — 2026-11-10

Owner approved tuning for an education game. Spec/plan:
`superpowers/specs/2026-11-10-education-motion-design.md` and
`superpowers/plans/2026-11-10-education-motion.md`. This round intentionally
supersedes the earlier unchanged-jump-height constraint: impulse 7.4 → 4.8 m/s,
same gravity and horizontal speed. Source-settled regional blending makes the
hop compact and landing shallow. Accepted walk/run/idle remain unchanged after
front/side review; no new source, dependency or performance claim.

- TDD RED recorded the original configured apex 1.40–1.49 m and knee flexion
  about 2.14 rad exceeding the intended limits. GREEN: **67/67 in six files** via
  `pnpm vitest run src/lib/world/education-motion.test.ts src/lib/world/character-action-motion.test.ts src/lib/world/character-action-vrm.test.ts src/lib/world/authored-locomotion-vrm.test.ts src/lib/world/animation-v03b.test.ts src/lib/world/world.test.ts`.
  New controls tests and actual-physics rig simulations run at 30/60/120 Hz:
  immediate launch, 0.5–0.7 m arc, no mid-air retrigger, unchanged horizontal
  travel, root ownership, visible knee bend, closer hands, floor clearance and
  recovery to idle. Existing exact idle/walk/run bone comparisons still pass.
- Browser 1440×1000: stationary and two moving jumps each observed
  `jump → fall → land → idle`; apex **0.605 / 0.604 / 0.603 m**. Releasing movement
  during recovery remained smooth; immediate re-jump reached y=0.598 m.
- Inspected front/side before/after captures through flight and absorption,
  run comparison, and actual plaza idle/hop/land/recovered screenshots. The A/B
  uses the same elapsed time, not the same flight phase. Sampled landing ankle
  heights were about 0.099–0.126 m (rest 0.101 m), minimum hip about 0.756 m;
  no significant hovering or floor penetration observed for this model/floor.
- At 390×844 with reduced motion, jump feedback remains. Existing tall mobile
  HUD still obscures the upper body; desktop viewport emulation does not verify
  physical-device performance or touch controls. HUD/camera are outside scope.
- Blocking only `actions.json` preserves authored locomotion and procedural
  jumping; unblocking and reloading restores the supplement. Player interaction
  and An's greeting observed. World switching remounts player actions; this
  round's immediate switch snapshots still show NPC loading and do not prove
  completed NPC loads after switching. No NPC loading behavior was changed.
- Normal browser run showed no runtime errors; existing Three deprecations
  remain. Network failures during the supplement fallback test were deliberate.
- Separate self-review, same agent per AGENTS.md: checked the current delta
  against captured pre-refinement modules, fixed recovery duration, immediate
  interruption, source resampling before attenuation, per-rig reference/buffers,
  root ownership, airborne IK release and unchanged asset hashes. No further
  critical/important finding. No staging, commit, push, deployment or SQL.

Evidence (ignored): `output/research/education-motion/`: `red.log`,
`gameplay.log`, `interruptions.log`, front/side phase comparisons,
`plaza-{idle,hop,land,recover}.png`, `mobile-reduced-jump.png`,
`supplement-fallback.png`, `greeting.png` and reusable QA scripts.
Fresh full four-gate verification: **`pnpm verify` exit 0** — typecheck, lint,
**819 tests / 84 files**, production compile and static generation 11/11 pass.
Log: `output/research/education-motion/verify.log`. The verified checkout dev tree
(40352, 36192, 13668) was stopped before build; ports 3020 and 3022 were clear.
QA browser and comparison lab are closed. Local preview restarted after the gates:
HTTP 200, title `Reading Quest 3D · BetterMe`, bound to `127.0.0.1:3020` only.
Technical checks do not replace the owner's visual playtest.

## Balanced-hop correction — 2026-11-10

Owner accepted the lower jump but rejected its pose. The previous attenuation
retained the source's split-leg stance and hip twist. The correction mirrors and
averages paired limbs (fully stationary, 80% while moving), reduces lateral leg
rotation, and gives the arms a small velocity-synchronized forward swing.
Height, horizontal controls, accepted walk/run/idle and source assets are unchanged.

- The interrupted turn recorded RED in `output/research/hop-pose/red.log`:
  stationary feet differed by about 0.113 m vertically, failing the 0.04 m bound.
  The real-rig regression also bounds depth split, stance/knee width and forward
  hand position at the apex, alongside articulation/clearance/recovery at
  30/60/120 Hz. Its focused run passed 67/67; this continuation's full run includes
  those checks and passes **819/819 tests in 84 files**.
- Fresh same-height/time A/B captures at 1440×1000 cover standing and moving
  launches, apex, descent, contact and recovery, front and side. Inspected the
  resulting images and actual plaza hop/landing. The corrected stationary hop
  has paired feet and forward knee flexion instead of one raised/outward leg.
- Fresh plaza runs traversed `jump → fall → land → idle`, with measured peaks
  0.609 / 0.607 / 0.606 m. Immediate re-jump reached 0.607 m; stopping during
  recovery and An's greeting remained usable. Supplement failure retained
  authored locomotion/procedural jump; reload restored authored actions.
- At 390×844, reduced-motion jump feedback remains. This is desktop viewport
  emulation; the existing HUD partly covers the avatar. Physical phone/touch
  behavior remains untested. World-switch snapshots verify player actions
  remount, not completion of NPC loading. No NPC loading change was made.
- Final normal browser view: zero console errors, two existing Three warnings.
  The deliberate blocked asset produced expected errors only during fallback QA.
- Separate self-review per AGENTS.md: checked the delta against the saved low-hop
  sampler, mirrored quaternion signs, fresh sampling before adjustments, per-rig
  scratch state, fade/interruption, fixed recovery duration, single root writer
  and airborne floor-contact release. No critical/important finding. Mechanical
  Impeccable detector returned `[]`; rendered motion and tests are the evidence
  for this skeletal change. Both JSON SHA-256 hashes still match provenance.

Fresh **`pnpm verify` exit 0**: typecheck, lint, 819 tests / 84 files, production
build and static generation 11/11. Log: `output/research/hop-pose/verify.log`.
Stopped verified Next dev PID 6104 (its server child 40868 exited) and motion-lab
PID 38024; checked ports 3020/3022 clear before build. QA browser is closed.
Other evidence: `continuation-{phases,gameplay,interruptions,visual}.log`,
`{standing,moving}-{front,side}-*.png`, `plaza-*.png`, and
`mobile-reduced-jump.png`, all in the same ignored folder.
No staging/commit/push/deployment. Final visual acceptance remains with the owner.
Preview restarted after the gates: HTTP 200 with the Reading Quest title,
bound to 127.0.0.1:3020 only (listener PID 41484). Final diff check clean; index empty.

## Upright walk/jog refinement — 2026-11-10

Owner approved the proposed head/back adjustment. Spec/plan:
`superpowers/specs/2026-11-10-locomotion-posture-design.md` and
`superpowers/plans/2026-11-10-locomotion-posture.md`. Production delta is nine
lines in the existing locomotion sampler: small distributed pitch adjustments,
blended with runWeight after fresh source sampling. The rig writer is unchanged.

- RED: six shipped-rig cases at 30/60/120 Hz showed head downward pitch of
  approximately 13.47–16.82 degrees walking and 20.71–20.80 jogging; jog trunk
  lean reached 19 degrees. GREEN: four focused files passed 49/49, then the
  posture file passed 9/9 including walk/run/stop/restart head continuity.
- The real-rig tests bound head pitch, excessive backward/forward trunk lean,
  retain positive jog lean, and verify stop/transition behavior. Sampler tests
  preserve gait/arm local tracks and hip displacement, immutable source data,
  and non-accumulating corrections during frozen-phase fade/reset.
- Same-model/time front/side A/B at six phases for each gait: walking head
  approximately 3–6 degrees down, jog 7.5–7.7; captured jog trunk lean 11–15.
  Inspected the final captures and plaza views. Upper back opens and gaze lifts
  without a rigid straight jog or upward chin. No additional tuning was needed.
- Browser 1440×1000: walk/run switching and stop, jump/land/immediate re-jump
  (0.600 m on the repeated launch), An's greeting and player world remount pass.
  Final movement into the landscape obstacle correctly becomes idle. Immediate
  world-switch snapshots still show NPC loading; no completed NPC-load claim.
- At 390×844 with reduced motion, walk and run remain responsive. Initial QA
  incorrectly expected movement after the desktop sequence had reached a rock
  at z=14.55; rerunning from the clear spawn passed. The following helper also
  needed its desktop viewport restored. These were harness issues; no production
  collision/viewport workaround was added. Physical phone/touch remain untested;
  the existing tall HUD remains outside scope.
- Blocking only locomotion.json retains procedural walk/run and authored jump
  actions. Removing the block and reloading restores authored locomotion. Normal
  final view has zero console errors and two pre-existing Three deprecations;
  initial favicon 404 and deliberate asset-block errors were recorded separately.
- Separate self-review against the saved baseline: correct quaternion sign/order,
  fresh per-frame sampling, interpolated walk/run offsets, existing fade ownership,
  no per-frame object allocation, source immutability, unchanged hips/limbs/root,
  and action overlay/recovery. No critical/important finding. Impeccable mechanical
  scan returned []; skeletal behavior is established by rendered/rig checks.
- Both animation SHA-256 hashes match the provenance document. No new source,
  dependency, camera, HUD, NPC or physics change. No staging/commit/push/deploy/SQL.

Evidence (ignored): `output/research/locomotion-posture/`: `red.log`, `focused.log`,
`posture-green.log`, `compare.log`, `gameplay.log`, `interruptions.log`,
`{walk,run}-{front,side}-*.png`, `plaza-*.png`, `mobile-*.png`, `fallback.png`.
Fresh **pnpm verify exit 0**: typecheck/lint, **830 tests / 85 files**, production
build/static generation 11/11. Log: `output/research/locomotion-posture/verify.log`.
Stopped verified dev PID36044 (child41484 exited) and lab40348, verified both ports
clear before build. QA/lab closed; loopback preview restored, /world HTTP200 with
Reading Quest title. Final diff check clean and index empty; owner playtest next.
