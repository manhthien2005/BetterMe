# Dựng và nghiệm thu đảo tiếp theo

## 1. Quy trình sản xuất

1. **Chốt brief:** tên/path nguồn thật, theme và chức năng, phần cần nâng cấp, phần cần giữ, kích thước tương đối, camera đánh giá. Dùng [ASSET-BRIEF.md](ASSET-BRIEF.md). Chưa có nguồn thì kiểm kê trước; không đặt giả danh sách đảo.
2. **Giữ bản chuẩn:** kiểm hash snapshot v18; làm trong thư mục candidate riêng. Không chạy generator trên snapshot hoặc dùng Vườn Gió như file nháp.
3. **Dựng khối và palette:** main silhouette, mép, đất/đá, khối tán, đường đi và mặt nước. Chụp cùng rig với v18. Khi nền tổng thể đúng mới thêm hoa/rêu/hoa văn.
4. **Dựng vật liệu và cây cỏ:** tận dụng các generator/kit phù hợp; đặt gốc bằng terrain/BVH. Mảng cỏ thấp–cao và loài cây theo brief, không tăng density đều để che nền.
5. **Tiểu tiết có mục đích:** dấu tích cũ, dây leo/cây bám, rêu loang, bụi quả, đèn/đom đóm nếu phù hợp. Nhịp màu nhỏ, không biến cả đảo thành chùm đồ trang trí.
6. **Tích hợp runtime:** giữ metadata, normals, UV gió, cùng clock; source/export đã đúng mới đánh giá shader. Kiểm shadow/water/effects khi chuyển root, ngày/đêm và pause.
7. **Nghiệm thu:** các mục kỹ thuật và visual dưới đây. Lưu cả ảnh tổng thể/cận cùng thông số rig, file đã đo, kết quả lệnh và giới hạn chưa kiểm.
8. **Bàn giao để owner duyệt:** brief hoàn thành, nguồn sửa được, GLB/kit, manifest, QA, ảnh, hash; chỉ đổi nhãn `candidate` thành `approved` sau khi được duyệt. Nâng cấp asset trong app/tới đảo tiếp theo theo phạm vi user giao, không tự nối chuỗi rollout.

## 2. Snapshot và kiểm tra dấu vân tay

Từ repo root, PowerShell:

```powershell
python -X utf8 docs/art/floating-islands/verify-reference.py
python -X utf8 docs/art/floating-islands/verify-reference.py --working
```

Lệnh đầu kiểm gói `approved/v18/` và liên kết tài liệu. `--working` kiểm thêm các file art nguồn/export/runtime hiện tại còn khớp bản duyệt. Sau này working thay có chủ đích thì snapshot vẫn phải pass, còn working mismatch là tín hiệu có revision mới, không phải lý do tự cập nhật hash chuẩn cũ. Mã hash xác nhận nội dung file, không thay QA hình ảnh.

Snapshot là bản sao cục bộ; `reference-v18.json` nằm trong docs để có thể đưa vào Git khi owner yêu cầu, nhưng lượt này không commit. Chưa có xác nhận backup từ xa. Không chạy `serve.py` ngay ở `approved/v18/`: đường tìm node_modules phụ thuộc độ sâu. Muốn mở bản snapshot, copy nội dung `art/` sang một thư mục candidate `output/<tên>/`, giữ snapshot nguyên và dùng port riêng. Generator vẫn cần reference Mạch Nguồn đúng hash/đường dẫn theo [hợp đồng kỹ thuật](TECHNICAL-CONTRACT.md).

## 3. Lệnh cho bản làm việc hiện tại

Các lệnh dưới đây trỏ vào **working Vườn Gió**, để tái hiện pipeline; không chạy build chỉ để đọc tài liệu. Build ghi đè GLB/Blend/manifest của working. Với đảo mới, đổi đường dẫn và output ID trong candidate trước.

```powershell
& 'D:/Dev/Tools/Blender/blender.cmd' --background --python-exit-code 1 --python 'D:/Dev/Projects/BetterMe/output/tiny-glade-island-v1/build.py'
& 'D:/Dev/Tools/Blender/blender.cmd' --background --python-exit-code 1 --python 'D:/Dev/Projects/BetterMe/output/tiny-glade-island-v1/verify_source.py'
& 'D:/Dev/Tools/Blender/blender.cmd' --background --python-exit-code 1 --python 'D:/Dev/Projects/BetterMe/output/tiny-glade-island-v1/verify-water.py'
& 'D:/Dev/Tools/Blender/blender.cmd' --background --python-exit-code 1 --python 'D:/Dev/Projects/BetterMe/output/tiny-glade-island-v1/verify-landscape.py'
& 'D:/Dev/Tools/Blender/blender.cmd' --background --python-exit-code 1 --python 'D:/Dev/Projects/BetterMe/output/tiny-glade-island-v1/verify-foliage.py'
```

Nếu preview cổng 8772 chưa chạy, mở terminal riêng ở repo root:

```powershell
python -X utf8 output/tiny-glade-island-v1/serve.py --port 8772
```

QA dùng session `betterme-qa` của repo qua `pnpm browser`; kiểm tra session này đang rảnh trước khi dùng. Không gắn browser cá nhân hay đóng session của công việc khác:

```powershell
pnpm browser open http://127.0.0.1:8772/
pnpm browser run-code --filename output/tiny-glade-island-v1/verify-viewer.js
pnpm browser run-code --filename output/tiny-glade-island-v1/renders/landscape-v18/verify-runtime.js
pnpm browser run-code --filename output/tiny-glade-island-v1/renders/landscape-v18/verify-additions.js
pnpm browser run-code --filename output/tiny-glade-island-v1/renders/landscape-v18/verify-fall.js
pnpm browser run-code --filename output/tiny-glade-island-v1/renders/landscape-v18/verify-water-gpu.js
pnpm browser run-code --filename output/tiny-glade-island-v1/renders/landscape-v7/verify-water-contact.js
pnpm browser close
```

Đọc mục **Result** trong log, không chỉ exit code: CLI có thể in `### Error` dù quy trình bao ngoài vẫn exit 0. Script hiện có tên mesh/count/port/paths của Vườn Gió; **không chạy nguyên xi rồi suy ra mọi đảo đã đạt**. Với candidate, khai báo trước điều cố định/điều được thay, đổi fixture/path/count theo brief, giữ loại kiểm tra; không hạ kiểm tra để che lỗi. Historical preservation script v18 còn phụ thuộc baseline v17 trong working checkout, không nằm trong gói snapshot tối thiểu.

## 4. Checklist nghiệm thu

| Cổng | Điều cần chứng minh | Bằng chứng tối thiểu |
|---|---|---|
| Nguồn/export | Hữu hạn, winding, solids/seams; GLB tự chứa; texture/UV/normal; hash reference nguyên | Lệnh Blender và output PASS; hash file xuất |
| Bám nền | Gốc cây/cỏ, chân đèn/tàn tích, bụi quả/fern tiếp xúc đúng; props không nằm trong mặt nước | Raycast/BVH hoặc phép đo contact + ảnh cận |
| Cỏ/lá/hoa | Gốc gió ghim, mặt trước/sau sáng đúng, matte, loài đọc được, thấp–cao theo mảng | Source check + GPU/view hai mặt và góc thấp |
| Đảo/đá | Mép mềm liền; vân đúng scale; đá bay kín, không xuyên đảo; satellite khác hình | Mặt trước/sau/mép/đáy và contact/manifold khi đổi shape |
| Nước | Hồ thấy đáy, phản xạ có cảnh thật; cửa thác nối; flow/fade/giọt đúng | GPU reflection/transmission/motion/contact; kiểm restore renderer khi lỗi |
| Đèn/hiệu ứng | Kính cam, ánh vàng dịu; insects đúng ngày/đêm; root isolation | Ảnh ngày/đêm + pause/reduced-motion + compare/kit + disposal |
| Giao diện xem | Load/retry, keyboard, zoom/orbit, phone không overflow, không cắt cảnh | Desktop và 390 px, console sạch |
| Giữ phạm vi | Những phần hứa giữ không thay qua RNG/shared material | So mesh/transform/color/hash theo ngoại lệ đã khai báo |
| Ngân sách | GLB bytes/triangles/objects, texture/GPU memory, render passes | Manifest và log; thêm đo thiết bị thật khi chuẩn bị production |

Không phải đảo nào cũng có thác/đèn; đánh dấu `không áp dụng` có lý do từ brief, không tạo props không cần chỉ để chạy đủ test. App changes dùng các gate AGENTS.md; art-only không tuyên bố đã kiểm auth/sync/build app.

## 5. Bộ ảnh cần lưu

- Tổng thể trước/sau cùng camera, zoom, ánh sáng và cùng thời điểm clock; thêm mặt sau.
- Cỏ thấp–cao, tán/thân, hoa/quả, đá/tàn tích, mép/đáy, satellite/fragment.
- Hồ/cửa thác/cuối thác nếu có, ở trạng thái tĩnh và một thời điểm chuyển động cố định.
- Đèn và overview ban đêm; một bụi có đom đóm nếu có.
- Desktop và 390 px; screenshot gốc lưu tại candidate, bản review JPG tối đa 1000 px. Mỗi lần đưa vào context tối đa 2 ảnh.

Ghi rõ camera rig, ánh sáng, clock, viewport/DPR; so ảnh cùng điều kiện. Cận cảnh hỗ trợ quyết định, không thay ảnh tổng thể.

## 6. Đầu ra bàn giao và tổ chức thực thi

Mỗi candidate cần: brief và decision log ngắn, source generator + Blend, GLB/kit + textures nguồn, manifest, runtime/config cần thiết, QA.md + log kết quả, ảnh review, nội dung chưa kiểm, hash bản được duyệt và context bàn giao.

Mặc định một implementer theo AGENTS.md. Nếu owner yêu cầu chia agent ở công việc tiếp theo, dùng context nhỏ theo [mẫu bàn giao](HANDOFF-CONTEXT.md), phân quyền ghi không chồng nhau. Ví dụ: geometry/terrain; botany; props. Parent giữ assembly/build/viewer/material dùng chung và quyết định tích hợp. Worker không chạy build chung hoặc ghi vào `assets/`/`source/` cùng lúc; chờ parent tích hợp để xuất một lượt. Đây là cách tổ chức khi được yêu cầu, không phải yêu cầu spawn ngay.
