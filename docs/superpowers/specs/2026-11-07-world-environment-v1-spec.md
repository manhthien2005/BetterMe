# Spec: World Environment V1 — Thời gian & Thời tiết TP.HCM (Reading Quest)

**Ngày:** 2026-11-07\
**Tác giả:** Argon 4 (Implementation Engineer) · Kiến trúc & Review: Sol · Duyệt: Product Owner\
**Nhánh mục tiêu:** `feat/reading-quest-environment-v1`

---

## 1. Mục tiêu & Phạm vi

Xây dựng hệ thống **World Environment V1** cho không gian 3D Reading Quest (`/world`), đồng bộ thời gian thực và thời tiết thực tế tại **TP.HCM (`Asia/Ho_Chi_Minh`)**, cung cấp bầu trời, mây, mặt trời, chi tiết đêm nhẹ, chuyển màu sương mù (fog) và ánh sáng mềm theo 5 buổi trong ngày và 4 mùa mỹ thuật, kèm HUD gọn nhẹ và công cụ **Xem thử môi trường (Preview Mode)** dùng được ngay trên bản production hằng ngày.

### Ngoài phạm vi V1 (Không làm)
- Hạt mưa 3D (particle rain), sấm chớp, âm thanh thời tiết.
- Nối gió thời tiết vào springbone tóc/quần áo của nhân vật VRM.
- Trồng cây, inventory, sinh trưởng, thu hoạch, lịch sử thời tiết cho cây, social hoặc multiplayer.
- Thêm dependency mới, dịch vụ trả phí hoặc sửa đổi Supabase schema.

---

## 2. Quy tắc Thời gian, Mùa & Buổi trong ngày (`Asia/Ho_Chi_Minh`)

### 2.1. Đồng hồ 1:1 & Múi giờ
- Mọi tính toán thời gian dựa trên **UTC epoch milliseconds (`nowMs`)**, sau đó quy đổi sang múi giờ cố định **`Asia/Ho_Chi_Minh` (UTC+7, không có DST)**.
- Hoàn toàn độc lập với múi giờ cài đặt trên máy của người chơi.
- Định dạng hiển thị: ngày tiếng Việt (ví dụ: `Thứ Bảy, 07/11/2026`), giờ 24h (`HH:mm`).
- Khi mở lại game hoặc quay lại tab (`visibilitychange` / `focus`), hệ thống đọc lại `Date.now()` trực tiếp, không dùng bộ đếm cộng dồn giây để chạy bù.

### 2.2. Mùa theo tháng địa phương (Quy ước mỹ thuật)
Dựa trên tháng dương lịch tại `Asia/Ho_Chi_Minh` (`1..12`):
- **Xuân (`spring`)**: Tháng 3, 4, 5 — sắc thái tươi ấm nhẹ.
- **Hạ (`summer`)**: Tháng 6, 7, 8 — sắc thái nắng vàng trong trẻo.
- **Thu (`autumn`)**: Tháng 9, 10, 11 — sắc thái mật ong dịu.
- **Đông (`winter`)**: Tháng 12, 1, 2 — sắc thái se dịu trong trẻo (không tự sinh tuyết, lạnh hay mưa theo mùa).

### 2.3. Năm buổi trong ngày & Quy tắc dự phòng `sunrise`/`sunset`
Năm buổi (`DayPhaseId`):
- `morning` (**Sáng**)
- `noon` (**Trưa**)
- `afternoon` (**Chiều**)
- `dusk` (**Hoàng hôn**)
- `night` (**Đêm**)

**Xác định `sunrise` và `sunset`:**
- Nếu có dữ liệu `sunrise`/`sunset` hợp lệ từ Open-Meteo khớp với ngày địa phương `YYYY-MM-DD` đang xét (hôm nay hoặc ngày kế tiếp), dùng giờ `sunrise` và `sunset` đó (kẹp an toàn trong khoảng `04:30..07:30` cho bình minh và `16:30..19:30` cho hoàng hôn) và đánh dấu `astronomySource = "live"`.
- **Quy tắc dự phòng (`astronomySource = "fallback"`)**: Khi offline, chưa có cache, dữ liệu API thiếu `sunrise`/`sunset`, hoặc khi đang xem thử một ngày bất kỳ ngoài 2 ngày dự báo của API, dùng mốc chuẩn TP.HCM:
  - `sunrise = 06:00` (`360` phút từ `00:00`)
  - `sunset = 18:00` (`1080` phút từ `00:00`)

**Ranh giới các buổi theo `minutesOfDay` (`0..1439.99`):**
- **Sáng (`morning`)**: `[sunriseMinutes, 660)` (từ bình minh đến trước `11:00`).
- **Trưa (`noon`)**: `[660, 840)` (từ `11:00` đến trước `14:00`).
- **Chiều (`afternoon`)**: `[840, sunsetMinutes - 45)` (từ `14:00` đến `45` phút trước hoàng hôn).
- **Hoàng hôn (`dusk`)**: `[sunsetMinutes - 45, sunsetMinutes + 20)` (từ `45` phút trước `sunset` đến `20` phút sau `sunset`).
- **Đêm (`night`)**: `[sunsetMinutes + 20, 1440)` và `[0, sunriseMinutes)`.

> **Bất biến:** Không bao giờ dùng trường `is_day` của snapshot thời tiết cũ để quyết định buổi hay ánh sáng hiện tại.

---

## 3. Dữ liệu Thời tiết TP.HCM (Open-Meteo Free API)

### 3.1. Nguồn dữ liệu & Tọa độ cố định
- Địa điểm cố định: **TP.HCM** (`latitude = 10.7769`, `longitude = 106.7009`, `timezone = Asia/Ho_Chi_Minh`).
- Không yêu cầu quyền `navigator.geolocation`.
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Tham số truy vấn:
  - `latitude=10.7769`
  - `longitude=106.7009`
  - `current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,precipitation`
  - `daily=sunrise,sunset`
  - `forecast_days=2`
  - `timezone=Asia/Ho_Chi_Minh`
- Attribution bắt buộc trên HUD/Popover: `Dữ liệu thời tiết: Open-Meteo.com` (link tới `https://open-meteo.com/`).

### 3.2. Domain Model & Validation
Mọi trường số đều được kiểm tra `typeof === "number" && Number.isFinite(val)` và kiểm tra miền giá trị hợp lệ; nếu thiếu hoặc sai định dạng thì nhận `null` (không điền số giả, không parse ngược từ chuỗi hiển thị của dashboard):
- `temperatureC: number | null` (hợp lệ `[-50, 60]`)
- `relativeHumidityPct: number | null` (hợp lệ `[0, 100]`, làm tròn nguyên hoặc giữ chuẩn số)
- `weatherCode: number | null` (mã nguyên WMO `0..99`)
- `cloudCoverPct: number | null` (hợp lệ `[0, 100]`)
- `precipitationMm: number | null` (hợp lệ `[0, 500]`)
- `precipitationUnit: string` (mặc định `"mm"` từ `current_units.precipitation`)
- `precipitationIntervalSeconds: number | null` (từ `current.interval`, mặc định Open-Meteo là `900` giây = 15 phút)
- `sourceTimeIso: string | null` (từ `current.time`, định dạng `YYYY-MM-DDTHH:mm`)
- `fetchedAtMs: number` (UTC epoch lúc nhận phản hồi)
- `dailyAstronomy: readonly { dateIso: string; sunriseIso: string; sunsetIso: string; sunriseMinutes: number; sunsetMinutes: number }[]` (tối đa 2 ngày: hôm nay và ngày kế tiếp).

### 3.3. Phân loại Thời tiết & Quy tắc Mưa
- Không dùng xác suất mưa cả ngày (`precipitation_probability_max`) để kết luận đang mưa.
- Phân nhóm trạng thái thời tiết (`EnvironmentWeatherKind`):
  - `clear` (**Trời quang**): WMO `0` (hoặc `cloudCoverPct < 25` khi thiếu code).
  - `partly_cloudy` (**Ít mây**): WMO `1, 2`.
  - `overcast` (**Nhiều mây**): WMO `3` hoặc sương mù nhẹ `45, 48`.
  - `rain` (**Có mưa**): WMO mưa phùn/mưa rào/mưa/dông (`51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99`) **hoặc** `precipitationMm !== null && precipitationMm > 0.05`.
  - Mã WMO lạ / chưa biết hoặc dữ liệu hết hạn: rơi về trạng thái trung tính (`partly_cloudy` / mô tả `"Thời tiết trung tính"` khi hết hạn hoặc `"Thời tiết chưa xác định"` khi mã lạ).
- Khi trời mưa (`rain`): HUD hiển thị nhãn mưa (`Mưa phùn` / `Có mưa`) và bầu trời/ánh sáng chuyển sang sắc xám dịu ấm của ngày mưa, nhưng **chưa render hạt mưa 3D**.

---

## 4. Refresh, Cache, Độ tươi dữ liệu & Xử lý lỗi

- **Chu kỳ refresh**: `15 phút` (`900_000` ms) khi tab đang hiển thị (`document.visibilityState === "visible"`).
- **Cache & Deduplication**:
  - Lưu cache và `inFlightPromise` ở cấp module (`environment-weather.ts`).
  - Khi người chơi chuyển qua lại giữa `public_plaza` và `personal_world`, hoặc khi component remount trong vòng 15 phút, dùng lại ngay snapshot trong cache mà không gọi API trùng.
- **Timeout, Abort & Backoff**:
  - Mỗi request có timeout `8_000` ms qua `AbortController` và hủy sạch khi unmount/hủy thủ công.
  - Khi lỗi mạng/timeout/5xx: áp dụng backoff giới hạn (`30s` → `60s` → `120s` → tối đa `300s`).
- **Độ tươi của dữ liệu (`WeatherFreshnessStatus`)**:
  - `fresh`: `ageMs <= 30 phút` (`1_800_000` ms) — hiển thị dữ liệu hiện tại bình thường.
  - `stale`: `30 phút < ageMs <= 2 giờ` (`7_200_000` ms) — vẫn dùng dữ liệu cuối cùng nhưng gắn nhãn rõ **`"Dữ liệu cũ"`** trên HUD.
  - `expired` (`ageMs > 2 giờ`) hoặc `unavailable` (chưa có cache / offline ngay từ đầu):
    - **Tuyệt đối không trình bày giá trị cũ quá 2 giờ như thời tiết hiện tại.**
    - Chuyển cảnh 3D về thời tiết trung tính (`kind = "partly_cloudy"`, `cloudCover = 35%`), còn HUD hiển thị `"Chưa có dữ liệu mới"` (nhiệt độ `–`, độ ẩm `–`) kèm nút thử lại.
- **Offline**: Đồng hồ `Asia/Ho_Chi_Minh`, mùa và chu kỳ ngày–đêm vẫn hoạt động 100% bình thường khi offline.

---

## 5. Bầu trời, Ánh sáng 3D & Bảo đảm khả năng chơi ban đêm

- **Một `EffectiveEnvironmentSnapshot` duy nhất** được tính từ `(liveWeatherState, previewOverride, nowMs, isPersonalSpace)` và truyền xuống cả `WorldHud` lẫn `WorldCanvas` / `WorldScene`.
- **Thành phần bầu trời 3D (`WorldSkyEnvironment`)**:
  - Mái vòm / nền trời (`<color attach="background" />`) và `<fog attach="fog" />` nội suy mượt (`damp`) theo mỗi frame trong `useFrame` mà không re-render React tree.
  - Đĩa mặt trời (`sunDisc`) di chuyển trên vòm trời từ Đông sang Tây theo tiến độ từ `sunrise` đến `sunset`; ban đêm ẩn mặt trời và hiện trăng dịu + cụm sao nhẹ (`starField`) trên cao.
  - Các cụm mây low-poly mềm (`cloudClusters`) thay đổi độ phủ, độ mờ và sắc độ theo `cloudCoverPct` và `weatherKind`. Khi `prefers-reduced-motion: reduce` bật, mây và sao giữ tĩnh hoàn toàn.
- **Bảo đảm độ sáng ban đêm (`night`)**:
  - Ban đêm mang sắc xanh tím đêm ấm áp (`#1B243B` → `#23304C`), nhưng giữ ngưỡng chiếu sáng tối thiểu:
    - `ambientLight.intensity >= 0.48`
    - `hemisphereLight.intensity >= 0.42`
    - `directionalLight.intensity >= 0.46` (ánh trăng dịu, bóng đổ mềm)
    - `fog` bắt đầu xa (`near >= 38`, `far >= 82`)
  - Nhờ đó nhân vật VRM, đường đi lát đá, cổng dịch chuyển và NPC luôn nhìn rõ, dễ điều khiển.

---

## 6. HUD & Chế độ Xem thử môi trường (Preview Mode)

### 6.1. HUD Môi trường (`WorldEnvironmentHud`)
- Đặt gọn trong thanh頂 (top bar) của `WorldHud`, dùng đúng design tokens (`bg-surface-card`, `border-line-strong`, `text-ink`, `text-ink-mid`, `text-ink-soft`, `rounded-card`, `shadow-card`) và primitives (`Button`, `Popover`, `Chip`, `Icon`).
- Không che khuất nhân vật hay lối đi trên cả desktop (`1440×1000`) và mobile (`390×844`).
- Hiển thị rõ bằng chữ (accessible):
  - Địa điểm: **TP.HCM**
  - Ngày & giờ 24h (`Asia/Ho_Chi_Minh`)
  - Mùa (`Xuân` / `Hạ` / `Thu` / `Đông`) & Buổi (`Sáng` / `Trưa` / `Chiều` / `Hoàng hôn` / `Đêm`)
  - Icon + mô tả thời tiết tiếng Việt (`Trời quang`, `Ít mây`, `Nhiều mây`, `Có mưa`...)
  - Nhiệt độ (`°C`) & Độ ẩm không khí (`%`)
  - Trạng thái cập nhật (`Cập nhật HH:mm`, `Dữ liệu cũ`, `Đang cập nhật…`, hoặc `Thời tiết trung tính (Offline)`) + Attribution `Open-Meteo`.
  - Nút **“Xem thử môi trường”** (mở Popover điều khiển).

### 6.2. Chế độ Xem thử môi trường (`Preview Mode`)
- Hoạt động trên cả bản `pnpm build` (production) và `pnpm dev`.
- Cho phép tùy chỉnh:
  - Chọn **Ngày** (`YYYY-MM-DD`) và **Giờ** (`HH:mm`).
  - **Preset 5 buổi**: Sáng (`07:30`), Trưa (`12:15`), Chiều (`15:30`), Hoàng hôn (`17:45`), Đêm (`21:00`).
  - **Preset 4 mùa**: Xuân (`15/04`), Hạ (`15/07`), Thu (`15/10`), Đông (`15/01`).
  - **Chọn thời tiết giả lập**: Trời quang, Ít mây, Nhiều mây, Có mưa.
  - **Thanh trượt / ô nhập**: Độ phủ mây (`0–100%`), Nhiệt độ (`15–40°C`), Độ ẩm (`30–100%`).
  - Nút **“Trở về thực tế”** luôn hiển thị nổi bật khi đang ở chế độ xem thử.
- **Bất biến của Preview Mode**:
  1. Hiển thị huy hiệu **“Đang xem thử”** rõ ràng trên cả HUD ngoài lẫn trong Popover, phân biệt hoàn toàn với dữ liệu thực tế.
  2. `liveWeatherState` và `previewOverride` tách biệt tuyệt đối; không ghi đè `Date` toàn cục, không sửa đồng hồ thiết bị, không ghi đè cache thời tiết live.
  3. Không gọi API Open-Meteo theo ngày giả lập.
  4. Không lưu `previewOverride` vào `localStorage` hay server — reload trang mặc định trở về chế độ thực tế (`live`).
  5. Khi bấm **“Trở về thực tế”**, xóa `previewOverride`, lập tức tính lại snapshot từ `Date.now()` và `liveWeatherState` mới nhất (đồng thời kích hoạt refetch nếu cache đã quá 15 phút hoặc chưa có).
