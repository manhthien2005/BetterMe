# Kế hoạch Triển khai: World Environment V1 — Thời gian & Thời tiết TP.HCM

**Ngày:** 2026-11-07\
**Spec tham chiếu:** `docs/superpowers/specs/2026-11-07-world-environment-v1-spec.md`\
**Nhánh / Worktree:** `feat/reading-quest-environment-v1` (`.worktrees/reading-quest-environment-v1`)

---

## 1. Danh sách File Tạo mới & Chỉnh sửa

### Tạo mới
1. `docs/superpowers/specs/2026-11-07-world-environment-v1-spec.md` — Spec hành vi chi tiết.
2. `docs/superpowers/plans/2026-11-07-world-environment-v1-plan.md` — Kế hoạch triển khai & kiểm chứng.
3. `src/lib/world/environment-time.ts` — Hàm thuần tính toán thời gian `Asia/Ho_Chi_Minh` từ UTC epoch, mùa theo tháng (Xuân/Hạ/Thu/Đông), giải quyết `sunrise`/`sunset` (live hoặc fallback `06:00`/`18:00`), và phân loại 5 buổi (`morning`, `noon`, `afternoon`, `dusk`, `night`).
4. `src/lib/world/environment-weather.ts` — URL builder Open-Meteo cho TP.HCM (`10.7769, 106.7009`), bộ parse & validate dữ liệu số (`number | null`), phân loại mã WMO & lượng mưa hiện tại, quản lý cache/deduplicate cấp module, đánh giá độ tươi (`fresh` / `stale` >30m / `expired` >2h / `unavailable`), timeout, abort và backoff giới hạn.
5. `src/lib/world/environment-model.ts` — Hợp nhất thời gian + thời tiết (`live` hoặc `previewOverride`) thành một `EffectiveEnvironmentSnapshot` duy nhất cho cả HUD và 3D renderer, tính toán bảng màu bầu trời, fog, cường độ/màu ánh sáng (bảo đảm độ sáng ban đêm), vị trí mặt trời/trăng, độ phủ mây và sao.
6. `src/lib/world/environment-v1.test.ts` — Bộ unit test hồi quy đầy đủ (fixtures, không gọi mạng thật).
7. `src/components/world/use-world-environment.ts` — React hook quản lý đồng hồ thực 1:1 (tự đọc lại `Date.now()` khi quay lại tab), chu kỳ refresh thời tiết 15 phút, và state `previewOverride`.
8. `src/components/world/world-sky-environment.tsx` — Component 3D R3F render nền trời, fog, ánh sáng mềm, đĩa mặt trời, trăng/sao nhẹ ban đêm và các cụm mây low-poly (tôn trọng `prefers-reduced-motion`).
9. `src/components/world/world-environment-hud.tsx` — Khối HUD hiển thị thời gian/mùa/buổi/thời tiết TP.HCM, trạng thái cập nhật, attribution Open-Meteo và Popover **“Xem thử môi trường”** (kèm nhãn **“Đang xem thử”** & nút **“Trở về thực tế”**).

### Chỉnh sửa (trên baseline V0.3-B)
1. `src/components/world/world-client-shell.tsx` — Gọi `useWorldEnvironment`, gắn `data-day-phase`, `data-season`, `data-weather-kind`, `data-environment-mode` lên `<main>` và truyền cùng một `environmentSnapshot` xuống `DynamicWorldCanvas` và `WorldHud`.
2. `src/components/world/world-canvas.tsx` — Nhận `environmentSnapshot` và chuyển xuống `WorldScene`.
3. `src/components/world/world-scene.tsx` — Thay thế cụm `<color>`, `<fog>` và 3 đèn cố định bằng `<WorldSkyEnvironment environment={environmentSnapshot} isPersonalSpace={config.isPersonalSpace} />` (vẫn giữ nguyên nhân vật VRM, camera, collision, portals, props, NPCs).
4. `src/components/world/world-hud.tsx` — Tích hợp `<WorldEnvironmentHud />` gọn gàng vào header, giữ nguyên mọi nút điều hướng và tương tác hiện có.
5. `src/components/world/world-client-shell.test.tsx` — Bổ sung kiểm thử tích hợp cho HUD thời gian/thời tiết, đồng bộ snapshot giữa UI và Canvas, mở/chỉnh/thoát chế độ **“Xem thử môi trường”**.

---

## 2. Các bước Thực hiện & Tiêu chí Nghiệm thu

1. **Bước 1 (TDD Domain)**: Viết `src/lib/world/environment-v1.test.ts` và cài đặt `environment-time.ts`, `environment-weather.ts`, `environment-model.ts`.
   - Kiểm tra: `pnpm vitest run src/lib/world/environment-v1.test.ts` xanh 100%.
2. **Bước 2 (3D Renderer & Hook)**: Cài đặt `use-world-environment.ts` và `world-sky-environment.tsx`, nối vào `world-scene.tsx` và `world-canvas.tsx`.
3. **Bước 3 (HUD & Preview UI)**: Cài đặt `world-environment-hud.tsx`, nối vào `world-hud.tsx` và `world-client-shell.tsx`, mở rộng `world-client-shell.test.tsx`.
4. **Bước 4 (4 Gates)**: Chạy `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`.
5. **Bước 5 (Browser QA)**: Kiểm chứng trên trình duyệt thật (desktop & mobile) với `pnpm browser`: các buổi, 4 mùa, quang/mây/mưa qua preview, ban đêm dễ chơi, offline/stale, production preview, bàn phím/reduced-motion, đổi không gian/NPC và 1 lần gọi API thật Open-Meteo.
