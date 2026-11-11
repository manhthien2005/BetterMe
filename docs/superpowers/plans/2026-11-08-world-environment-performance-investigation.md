# Prompt bàn giao Argon 4 / Antigravity — Điều tra Environment V1

Ngày: 2026-11-08. Người nhận: Argon 4 chạy trong Antigravity.
Vai trò: Argon điều tra và đề xuất; Sol review kỹ thuật, cùng owner chốt thiết kế/kế hoạch; owner nghiệm thu cuối cùng.

**Mục tiêu:** Tái hiện giật khi di chuyển, tìm nút thắt có bằng chứng, đánh giá bầu trời/cảnh nền/camera hiện tại và đề xuất kế hoạch sửa có thể nghiệm thu.

**Phạm vi lượt này:** Đọc source, kiểm tra trên trình duyệt, đo hiệu năng, thu bằng chứng và viết báo cáo. Chưa triển khai bản sửa sản phẩm hay redesign. Thực hiện điều tra đã được giao; không dừng ở việc gửi lại một kế hoạch điều tra để xin phép lần nữa.

## 1. Bắt đầu đúng checkout và giữ nguyên công việc hiện có

Checkout cần dùng rõ ràng trong mọi tool/shell call:
`D:\Dev\Projects\BetterMe\.worktrees\reading-quest-environment-v1`

Nhánh dự kiến: `feat/reading-quest-environment-v1`.
HEAD Sol vừa kiểm tra: `e0a9108012323a1abcab2a2333f0d60dcc8ebb29`.
Trạng thái trước bản prompt này: 3 tracked modifications và 33 untracked files. Prompt này là một file tài liệu mới thêm vào trạng thái đó.

- [ ] Chạy `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, `git status --short --untracked-files=all`. Ghi trạng thái thực tế; không giả định số lượng vẫn giữ nguyên.
- [ ] Đọc AGENTS.md tại checkout, spec và plan bên dưới. Handoff cũ là dữ kiện cần kiểm chứng; yêu cầu owner hiện tại và AGENTS.md hiện tại có ưu tiên.
- [ ] Inspect cả file untracked. `git diff` với HEAD không chứa phần lớn triển khai world hiện tại.
- [ ] Không switch/reset/stash/clean/revert, commit/push/merge/deploy, chạy SQL, cài dependency hay đổi thiết lập máy/agent. Một agent thực hiện; không tự gọi reviewer/subagent.
- [ ] Không đọc/in/sao chép `.env`, `.env.local` hay `.env.*`. Giữ auth/RLS, no-guilt/no-decay và dữ liệu tài khoản nguyên vẹn.

Root `D:\Dev\Projects\BetterMe` là baseline graybox cũ. Worktree `reading-quest-v0.3b` là animation baseline. Không chẩn đoán root như bản Environment V1. Không giả định một checkout mới từ HEAD sẽ chứa các file untracked này.

## 2. Những quyết định owner đã chốt

Owner phản hồi: game rất lag, dễ drop FPS khi di chuyển; bầu trời/cảnh quan bằng khối trông giả; zoom xa làm lộ toàn sân và phần cảnh chưa hoàn thiện. UI ngày giờ/nhiệt độ/độ ẩm hiện đủ dùng, sẽ cải thiện UI sau.

Owner đồng ý hướng:

- Phong cảnh cozy cách điệu mềm, có chiều sâu, hợp nhân vật anime hiện tại.
- Hướng ưu tiên để đánh giá: vòm trời đổi màu theo thời gian + ít lớp mây mềm + cảnh nền xa ít chi tiết. Chưa khóa kỹ thuật shader/texture hoặc thông số cụ thể.
- Cảnh nền cần có chiều sâu bằng tán cây/đồi/kiến trúc xa và chuyển sắc theo khoảng cách; tiết chế chi phí render.
- Camera cho phép khám phá/ngắm cảnh thoải mái, vừa đủ bao quát; không thành camera quan sát toàn bản đồ. Owner không muốn góc nhìn quá gần hoặc quá bao quát.
- Phối hợp giới hạn khoảng cách/góc camera, vành cảnh quan ngoài vùng chơi và xử lý vật cản/biên cảnh.
- Đo nút thắt trước khi quyết định tối ưu. Không mặc định mây, VRM hoặc FPS HUD là thủ phạm.

Giữ baseline nhân vật đã được owner hài lòng: model, cảm giác di chuyển, animation, tóc/quần áo. Không đổi model hoặc giảm chất lượng nhân vật để đạt số FPS trước khi chứng minh cần thiết.

Giữ contract môi trường: thời gian thực TP.HCM, mùa mỹ thuật độc lập thời tiết, live/preview tách biệt, một effective snapshot cho HUD và scene, freshness/offline rõ ràng, preview dùng được trong production. V1 chưa có rain particles, sấm/chớp, audio thời tiết hay gió tác động tóc/quần áo. Không mở rộng sang cây, inventory, study rewards, persistence, social/multiplayer hoặc bộ đo lưu lượng mạng.

## 3. Đọc và lập bản đồ đường chạy

Đọc hoàn chỉnh:

- `docs/superpowers/specs/2026-11-07-world-environment-v1-spec.md`
- `docs/superpowers/plans/2026-11-07-world-environment-v1-plan.md`

Source cần lần theo, lấy line numbers hiện tại khi viện dẫn:

| Nhóm | File |
|---|---|
| Auth, shell, Canvas | `src/app/world/page.tsx`, `src/components/world/world-client-shell.tsx`, `world-canvas.tsx` |
| Clock, weather, preview | `src/components/world/use-world-environment.ts`, `src/lib/world/environment-time.ts`, `environment-weather.ts`, `environment-model.ts` |
| Scene, sky, metrics | `src/components/world/world-scene.tsx`, `world-sky-environment.tsx`, `world-performance-hud.tsx` |
| Camera, input, movement | `src/lib/world/map-config.ts`, `camera.ts`, `physics.ts`, `src/components/world/use-keyboard-controls.ts` |
| Avatar update, telemetry, cleanup | `src/components/world/character-avatar.tsx`, `src/lib/world/vrm-loader.ts`, `animation-state-machine.ts` |
| HUD và kiểm thử | `src/components/world/world-hud.tsx`, `world-environment-hud.tsx`, `world-client-shell.test.tsx`, `src/lib/world/environment-v1.test.ts`, các test world/character/animation và route |

- [ ] Vẽ/summarize đường chạy clock/weather → snapshot → HUD/scene và input → kinematics → pose → VRM → render.
- [ ] Phân biệt việc chạy mỗi frame, mỗi lần React render, mỗi lần đổi không gian, theo timer và theo request. Kiểm tra allocation, matrix updates, listener/timer/RAF cleanup và remount/resource lifetime.
- [ ] Đối chiếu spec/source/test. Nêu rõ điểm lệch và ảnh hưởng; không tự chọn sửa spec hay code để xóa khác biệt.

Các dấu hiệu Sol thấy cần kiểm chứng, không phải nguyên nhân lag đã xác nhận:

- Canvas `dpr={[1, 2]}` và shadows; nhiều props/VRM cast shadow.
- Debug snapshot được tạo mỗi frame; bone snapshot định kỳ; HUD có RAF fallback riêng và poll 400 ms.
- FPS khởi tạo 60, bỏ qua delta >= 250 ms, rolling-min hiện không có cửa sổ thời gian rõ ràng.
- Mây và nhiều sao ở cao độ thấp, celestial body tại các tọa độ cố định theo phase; cần đánh giá vị trí đối với camera/đường chân trời.
- Camera source đang có min/max distance 6.5/26, pitch 0.16/1.32 rad; Public Plaza bounds khoảng 32 × 30. Owner thấy zoom như không giới hạn; cần tái hiện cảm giác đó và kiểm tra clamp thực tế.

## 4. Dùng khả năng thực có trong Antigravity

- [ ] Kiểm tra tool trình duyệt, DevTools/profiler, screenshot/recording, console và tracing nào thực sự dùng được. Tận dụng các khả năng có sẵn; không khẳng định đã dùng công cụ không có.
- [ ] Nếu thiếu profiler, thực hiện phần source/browser được hỗ trợ và cung cấp cách capture thủ công ngắn gọn. Đánh dấu phần chưa đo, không thay bằng số suy đoán.
- [ ] Xác định đúng dev server/URL/port/process tree của checkout. Không tắt hay restart phiên owner đang dùng. Không chạy `pnpm build` cùng lúc dev của checkout đó chạy vì dùng chung `.next/`.
- [ ] Ghi rõ đang đo dev hay production. Có thể điều tra trên phiên dev có sẵn; không suy rộng thành FPS production. Nếu chưa có production session phù hợp, đưa production benchmark vào bước xác minh tiếp theo thay vì tự dừng dev/build.
- [ ] Chỉ tương tác `/world` và preview cục bộ phục vụ đo. Không sửa auth, bypass production, tài khoản hoặc dữ liệu tiến độ.

Được tạo report và script đo tự chứa trong `output/world-environment-audit-2026-11-08/`; script phải có hướng dẫn chạy và dọn listener/RAF khi xong. Ưu tiên instrumentation tạm trong bộ nhớ trình duyệt. Không sửa app source, thêm package hay dựng framework benchmark trong lượt này. Nếu một thí nghiệm cần diagnostic patch vào app, trình bày patch tối thiểu trong báo cáo và đánh dấu chưa chạy.

## 5. Đo baseline gọn, lặp lại được

- [ ] Ghi browser/version, CPU/GPU nếu lấy được, viewport CSS, drawing-buffer size/DPR, refresh rate nếu biết, chế độ nguồn/throttling, dev/production và trạng thái tab. Không suy GPU/refresh rate từ FPS HUD.
- [ ] Làm nóng scene/VRM khoảng 15 giây; tách tải/compile ban đầu khỏi steady-state. Giữ tab visible, cửa sổ/mức zoom trình duyệt và cấu hình máy nhất quán.
- [ ] Public Plaza: 20 giây đứng yên + 40 giây di chuyển theo một lộ trình có landmark rõ ràng. Lặp 3 lần cùng trạng thái môi trường. Ghi cách input, đường đi, thao tác orbit và đoạn có giật để Sol tái hiện.
- [ ] Personal World: chạy một lượt cùng cấu trúc; chỉ đo thêm nếu thấy hành vi khác đáng kể.
- [ ] Capture một trace đại diện có đoạn idle → move → drop; lưu số liệu từng lượt. Ghi overhead của recording/profiling và đối chiếu ít nhất một lượt không record nếu công cụ hỗ trợ.

Chỉ số cần lấy khi công cụ hỗ trợ:

| Chỉ số | Diễn giải đúng |
|---|---|
| Frame intervals p50/p95/p99, số frame >50 ms và >100 ms | Ghi nguồn đo, thời lượng, số mẫu; giữ các stall trong mẫu khi tab visible |
| FPS trung bình | Tính từ số frame/thời gian của nguồn đo, không lấy trung bình các số FPS tức thời |
| CPU/main-thread trace | Tên hàm/call stack và thời gian; phân biệt scripting, GC, React và render submission |
| GPU evidence nếu có | Chỉ báo theo công cụ thực sự đo; thời gian gọi JS render không phải GPU execution time |
| Draw calls, triangles, geometry/texture counts | Ghi semantics/cách sample; counts không phải GPU memory hoặc lưu lượng mạng |
| JS heap nếu có | Đây là JS heap, không phải tổng RAM/VRAM; không được hỗ trợ thì ghi unavailable |

RAF interval là nhịp callback trình duyệt, chưa chứng minh số frame 3D đã render/present. Ghi rõ proxy nếu dùng RAF. Không dùng chính FPS HUD đang bị nghi ngờ như nguồn sự thật duy nhất. Không bỏ những sample chậm để tạo biểu đồ đẹp.

## 6. Thí nghiệm phân biệt nguyên nhân

Sau baseline, chọn tối đa ba giả thuyết mạnh nhất từ trace/source. Với mỗi giả thuyết, ghi: bằng chứng → biến duy nhất cần đổi → kỳ vọng → kết quả → còn thiếu gì.

Các biến có thể kiểm tra nếu runtime/tools cho phép: DPR, shadow pass, sky/cloud layer, debug/HUD sampling. Cố định mọi yếu tố còn lại; so cùng đoạn di chuyển và cùng chế độ profiling. Nếu có tín hiệu cải thiện rõ, lặp lại để tránh kết luận từ một lần may mắn. Không thay đồng thời nhiều yếu tố.

- [ ] Phân biệt HUD panel đóng với telemetry thực sự tắt: đóng popover không đảm bảo dừng RAF/poll/debug producer.
- [ ] Phân biệt chi phí môi trường với baseline nhân vật. Không quy lỗi cho VRM chỉ vì chiếm nhiều source hoặc asset lớn.
- [ ] Có thể đọc/so hash với animation worktree; chỉ so FPS nếu browser/build/cảnh/thiết lập thực sự tương đương. Không dùng benchmark hai scene khác nhau như bằng chứng A/B sạch.
- [ ] Kiểm tra chuyển không gian vài lần có tăng resource counts/heap dai dẳng hay không. Cần phân biệt cache/GC trì hoãn với leak; không kết luận leak từ một ảnh heap.

Không đo được một biến thì ghi `chưa đo` và đề xuất thao tác/diagnostic patch cụ thể. Báo cáo không bắt buộc chứng minh một root cause nếu tool thiếu; bắt buộc trung thực về giới hạn và bước xác minh tiếp theo.

## 7. Đánh giá cảnh và camera bằng hình ảnh hiện tại

- [ ] Capture mới desktop và một viewport hẹp bằng công cụ có sẵn. Ghi viewport và URL/mode. Mobile emulation chỉ chứng minh layout, không đại diện hiệu năng GPU điện thoại.
- [ ] Dùng preview hiện có xem sáng, trưa, hoàng hôn, đêm và mưa; kiểm tra night legibility. Chụp một bộ đại diện, tránh nhân toàn bộ ma trận thời tiết × góc nhìn × benchmark.
- [ ] Kiểm tra camera tại giữa sân và gần biên, min/max zoom, min/max pitch, các hướng quay quanh nhân vật và gần vật cản lớn. Lặp điểm quan trọng trong Personal World.
- [ ] Ghi mỗi lỗi có thể tái hiện: vị trí/landmark, camera/action, actual/expected, screenshot và file/line liên quan. Nêu rõ thấy mép nền, mặt sau, xuyên vật cản, mây/sao như vật gần, hay tỷ lệ nhân vật quá nhỏ.
- [ ] Đánh giá vành cảnh quan nào cần thêm chỉ để tạo chiều sâu/che biên; không mặc định phải mở rộng vùng chơi hoặc tăng số lượng vật thể toàn cảnh.

Phân tích ít nhất hai phương án bầu trời khả thi với stack hiện có; đề xuất một phương án dựa trên chất lượng, chi phí draw/fill, texture/download và độ khó chuyển ngày–đêm/thời tiết. So sánh có thể gồm texture trên vòm và vòm màu động kèm cloud layers. Không coi volumetric clouds hay asset HDR lớn là mặc định; không coi ảnh/texture bất kỳ là chắc chắn nhẹ nếu chưa tính độ phân giải, alpha overdraw và số lớp.

Đề xuất camera có lý do theo kích thước cảnh và view frustum; thông số mới chỉ là ứng viên cần thử. Không khóa camera cứng làm mất trải nghiệm khám phá owner đã yêu cầu. Fog hỗ trợ chiều sâu, không thay thế xử lý biên cảnh/camera.

## 8. Báo cáo bắt buộc

Tạo `output/world-environment-audit-2026-11-08/report.md`, cùng screenshots/traces/số liệu thô có liên quan. Artifacts giữ cục bộ; chỉ thu nội dung cần cho world, không ghi cookie/token/header auth hoặc thông tin tài khoản vào report. Chỉ rõ artifact nào có thể chứa thông tin riêng trước khi chia sẻ ra ngoài.

Báo cáo phải gồm:

1. Executive summary tiếng Việt: hiện tượng đã tái hiện, nút thắt có bằng chứng, phần chưa xác định và hướng ưu tiên.
2. Checkout/branch/HEAD, trạng thái đầu/cuối và mọi file tạo mới. Tool thực dùng, URL/port, dev/production, máy và phương pháp đo.
3. Bảng baseline theo lượt và bảng thí nghiệm; link trace/số liệu gốc. Không điền số liệu vào ô chưa đo.
4. Findings xếp theo ảnh hưởng. Mỗi finding ghi `đã đo`, `xác nhận từ source`, hoặc `giả thuyết`; file:line, điều kiện tái hiện, tác động, bằng chứng và mức tin cậy.
5. Đánh giá bầu trời/cảnh nền/camera bằng ảnh mới; so sánh phương án và đề xuất một hướng phù hợp quyết định owner.
6. Kế hoạch sửa đề xuất, chia task nhỏ có thứ tự phụ thuộc: file dự kiến chạm, thay đổi hành vi, lợi ích kỳ vọng, rủi ro và cách nghiệm thu. Đánh dấu thay đổi spec cần owner chốt; chưa viết implementation.
7. Giới hạn kiểm chứng và tối đa ba câu hỏi owner thực sự cần trả lời, chỉ khi source/tools không giải đáp được và câu trả lời thay đổi phương án.

Tiêu chí nghiệm thu đề xuất phải gồm: cùng một lộ trình di chuyển đo trước/sau; frame-time tail và stall bên cạnh FPS; camera không lộ biên ở miền góc nhìn được phép; cảnh ngày–đêm/mưa vẫn nhất quán; nhân vật không regress; clock/weather/preview không thay đổi contract. Mục tiêu FPS cụ thể cần gắn thiết bị/mode đo, chưa có lời hứa 60 FPS trên mọi máy.

## 9. Kiểm chứng và kết thúc lượt

Sol đã chạy ở checkout này trước đó: typecheck/lint exit 0, Vitest 637 tests / 65 files pass. Đây là bằng chứng của lượt trước, không phải kết quả Argon vừa chạy và không chứng minh FPS, browser rendering hoặc production build.

- [ ] Không rerun cả suite nhiều lần chỉ để đọc source/capture trace. Nếu chạy check, báo lệnh thật, exit code và kết quả thật; dùng pnpm/PowerShell theo AGENTS.md.
- [ ] Không chạy build khi dev còn chạy. Ghi rõ nếu chưa thể xác minh production trong lượt này.
- [ ] Self-review riêng: bằng chứng có đủ hỗ trợ kết luận không, A/B có lẫn biến không, có sửa source/đụng phiên owner ngoài phạm vi không, kế hoạch có giữ baseline nhân vật và quyết định camera không.
- [ ] Kiểm tra Git status cuối; liệt kê đúng artifacts đã tạo. Dọn instrumentation trong browser và chỉ dừng process/instance do chính lượt điều tra tạo ra, nếu có; không làm gián đoạn phiên owner.
- [ ] Trả owner đường dẫn report và tóm tắt ngắn để chuyển Sol review. Dừng sau báo cáo; chưa thực thi kế hoạch sửa.
