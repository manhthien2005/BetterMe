# Spec — Đại tu UI/UX "Nếp's Garden" (2026-07-26)

> **Trạng thái:** đã duyệt từng phần cùng owner qua mockup (visual companion, 5 màn hình).
> **Mockup đã duyệt:** `docs/superpowers/specs/2026-07-26-uiux-overhaul-mockups/` (mở file HTML trực tiếp; nội dung là fragment nên thiếu CSS khung nhưng đủ để đối chiếu).
> **Spec nền tảng vẫn hiệu lực:** `2026-07-07-pet-companion-spec.md`, `2026-07-08-social-garden-spec.md`. Spec này CHỈ thay lớp trình bày + mở rộng mô hình habit; nơi nào mâu thuẫn với 2 spec trên về *hành vi server/sync*, spec cũ thắng và phải ghi amendment rõ ràng (xem §9.4).

---

## 1. Mục tiêu & quyết định khung (đã chốt với owner)

UI hiện tại không giữ chân người dùng. Đại tu toàn diện lớp giao diện với các quyết định:

| Câu hỏi | Quyết định |
|---|---|
| Thiết kế cho ai | **Thân mật trước, mở rộng sau** — nhóm bạn thân là chính, cấu trúc sẵn sàng đón người mới (empty states, onboarding chỉn chu) |
| Thiết bị | **Mobile và desktop ngang nhau** — hai layout hạng nhất |
| Móc câu quay lại | **Thói quen & streak là lõi**; pet là gia vị, social là lớp khám phá |
| Nhận diện | **Làm mới hoàn toàn** — bỏ palette rice/matcha/sakura + Baloo 2/Nunito |
| Năng lượng | **"Duolingo vừa phải"** — có lửa, có thưởng, nhưng chững chạc; đã tinh chỉnh 3 vòng với owner (v1 quá đà → v2 quá khô → v3 cân) |
| Cấu trúc | **Tách 4 không gian** thay cho 1 trang dài |

**2 invariant tuyệt đối giữ nguyên, test-enforce:** no-guilt (không câu chữ trách móc/so sánh xuống) và no-decay (growth/bond pet chỉ tăng). Untick habit luôn là hành động hợp lệ và sync được.

---

## 2. Ngôn ngữ thị giác

### 2.1 Bảng màu — "màu là vai trò, không phải trang trí"

| Token | Giá trị gốc | Vai trò — LUẬT CỨNG |
|---|---|---|
| `--surface-page` | `#FEFBF3` | Nền trang (kem giấy ấm) |
| `--surface-card` | `#FFFDF9` | Nền thẻ; viền `#EFE7D8`; bóng nâu ấm rất nhẹ |
| `--action` | `#B45309` (đất nung) | **Duy nhất** cho hành động chính + streak/🔥 + link. Tối đa 1 nút primary mỗi khu vực |
| `--success` | `#16A34A` | **Chỉ** sự hoàn thành, tiến độ, thế giới của Nếp |
| `--alert` | `#E11D48` | **Duy nhất** badge tin mới. Không dùng chỗ khác |
| Trung tính | thang đá ấm (stone) | Chữ `#1C1917`, phụ `#78716C`, viền `#E7E0D2`… |
| Điểm ấm | mật ong nhạt `#FFF9EC→#FFE9C2` | Hero, thẻ nổi bật theo ngữ cảnh (streak card, thẻ Hội chợ) — mỗi danh sách tối đa 1 điểm ấm |

Avatar bạn bè: tông đất dịu (cát `#EAE2D0`, rêu `#DDE7D3`…), kèm pet nhỏ ở góc — không dùng màu candy.

### 2.2 Typography

- **Display:** Bricolage Grotesque (700/800) — tiêu đề, con số lớn. Có subset `vietnamese`.
- **Body:** Be Vietnam Pro (400–700) — toàn bộ còn lại. Font Việt-first.
- Nạp qua `next/font/google` (self-host, không FOUC). Số streak lớn là "ngôi sao" của hero.

### 2.3 Nút — 3 cấp, nhìn là biết ưu tiên

1. **Primary:** nền đất nung, chữ trắng, bóng nhẹ — tối đa 1/khu vực.
2. **Secondary:** nền kem/trắng + viền be, chữ trung tính đậm.
3. **Ghost:** chữ đất nung + icon chevron, không viền.

### 2.4 Icon — 2 lớp tách bạch

- **Emoji = vật phẩm của thế giới:** 🐌 (pet), 🌾 (hạt), 🍃 (lá chắn/ngày nghỉ), 🔥 (streak), 🎡 (hội chợ) + icon riêng của từng habit (user chọn, emoji picker).
- **Line-icon (Lucide, nét 2px) = mọi hành động UI:** nav, thăm vườn, cổ vũ, mời bạn, sửa, đóng…
- Không rải emoji trang trí. Mỗi thẻ tối đa 1 icon chủ đề.

### 2.5 Motion

- Tick: nảy nhẹ 150–200ms; +1 🌾 bay về phía thẻ/chip Nếp.
- Hoàn thành 100% ngày: confetti ~1.5s, không chặn thao tác.
- `prefers-reduced-motion`: bỏ transform/confetti, thay bằng đổi màu/text (pattern guard `matchMedia` sẵn có trong `pet.tsx` — JSDOM không có API này).

---

## 3. Cấu trúc — 4 không gian

Shell điều hướng chung: **desktop** = rail trái cố định (logo, 4 mục, ProfileMenu dưới cùng); **mobile** = bottom tab bar 4 mục, ProfileMenu trong header. Badge đỏ số tin social mới trên mục Bạn vườn (nguồn: mailbox-seen `betterme.mailboxseen.v1` sẵn có).

| Route | Tên | Nội dung |
|---|---|---|
| `/dashboard` | 🏠 Hôm nay | Hero bầu trời → tab Ngày/Tuần → habit list → dải chip thời tiết + nhạc. Desktop thêm cột phải "sân sau" |
| `/calendar` | 📅 Lịch & nhịp | Lịch tháng (giữ conic-fill) + toàn bộ analytics + Thư tuần của Nếp + insight Giờ vàng |
| `/nep` | 🐌 Nhà của Nếp | Pet toàn cảnh: cho ăn/vuốt ve, bond, đổi pet, Album, ví 🌾 + đổi Lá chắn |
| `/friends` | 🏡 Bạn vườn | Friends, thăm vườn, cheers, Nhịp Chung, Hội chợ — chức năng giữ nguyên, áo mới |

Social chỉ hiện khi sync bật (spec social §3.3) — như hiện tại; logged-out/dev-bypass: mục Bạn vườn hiện empty-state mời bật sync (không giấu mục nav để cấu trúc ổn định).

Login/signup: khoác ngôn ngữ thị giác mới; copy + anti-enumeration giữ nguyên hành vi.

---

## 4. Màn "Hôm nay"

### 4.1 Hero "bầu trời"

- Gradient nền đổi theo buổi: sáng (vàng mật) / chiều (cam đào) / tối (tím than + sao). Trang trí tối đa 2 chi tiết mờ (mây/sao).
- Dòng ngày + thời tiết gộp: "Thứ Hai, 27 tháng 7 · ⛅ 31° mưa chiều nhẹ" (dữ liệu weather live sẵn có).
- Lời chào theo buổi + câu nói của Nếp (voice pack, mỗi ngày 1 câu, qua guard no-guilt).
- Bên phải: 🔥 số chuỗi lớn + "kỷ lục N ✦" + **7 chấm T2→CN** (xanh=giữ nhịp, cam=hôm nay, mờ=chưa tới, 🍃=nghỉ chủ đích) + **vòng tiến độ hôm nay** (2/4).
- Mobile: hero co lại — chào + chip 🔥 + vòng tiến độ; 7 chấm chuyển xuống dưới tab.

### 4.2 Hai chế độ xem (tab)

**Hôm nay (mặc định):** habit nhóm theo buổi (☀️ Sáng / 🌤 Chiều / 🌙 Tối / Cả ngày). Mỗi hàng: icon habit trong ô màu nhạt (màu thẻ user chọn) + tên + dòng phụ (tiến độ đếm / bước con / 🔥 riêng / giờ dự kiến) + điều khiển hoàn thành bên phải:
- Kiểu đánh dấu: checkbox to (28px+), tick nảy.
- Kiểu đếm: nút "+1 [đơn vị]" + vòng % thay checkbox; đạt mục tiêu → chuyển tick xanh.
- Kiểu thời lượng: như đếm, đơn vị phút (nhập nhanh, không cần timer chạy — YAGNI).
- Kiểu checklist: vòng n/m; bấm mở rộng inline các bước con.
- Hàng hoàn thành: nền `#F2FBF3` viền xanh nhạt, tên gạch + nhạt, "+1 🌾".

**Tuần này:** lưới hàng=habit (icon+tên), cột=T2→CN. Ô: ✓ đủ / ◕◑ mức đạt (đếm, thời lượng) / trống / 🍃 nghỉ chủ đích / mờ chấm = chưa tới; cột hôm nay viền cam. Cuối hàng: 🔥 streak riêng. Dòng tổng kết: "Tuần này 11/13 lượt — hơn tuần trước +3" (so sánh với **chính mình** — không bao giờ so với người khác). Mobile: lưới cuộn ngang trong thẻ, không tạo overflow trang.

### 4.3 Widget

Thời tiết + Spotify thành 2 chip nhỏ 1 dòng dưới habit list (desktop + mobile). Bấm mở popover chi tiết (giữ đủ trạng thái loading/error/disconnected hiện có). Không còn chiếm cột riêng.

### 4.4 Sân sau (desktop only, cột phải sticky)

- Thẻ Nếp thu gọn: mặt pet + mood + bond bar + 2 nút (Cho ăn primary, Vuốt ve secondary) → link sang `/nep`.
- Thẻ Vườn bạn bè: 3 dòng tin mới nhất + ghost "Ghé thăm ▸" → `/friends`. (Cách social tự lộ diện thay vì nằm cuối trang.)

---

## 5. Mô hình habit — "tạo 10 giây, tinh chỉnh sâu khi muốn"

### 5.1 Trường dữ liệu

**Tạo nhanh (hiện mặc định):** tên · icon (emoji picker, gợi ý theo tên gõ) · kiểu theo dõi (`check` | `count` | `duration` | `checklist`) · mục tiêu theo kiểu (đếm: số+đơn vị; thời lượng: phút; checklist: 2–7 bước) · hàng template 1 chạm (💧 nước, 📖 đọc, 🏃 thể dục, 🧘 thiền, 😴 ngủ sớm).

**Tinh chỉnh thêm (mở rộng):** thứ lặp T2→CN (mặc định cả 7) · buổi (Sáng/Chiều/Tối/Cả ngày) · giờ dự kiến (tùy chọn — chỉ hiển thị + nuôi Giờ vàng) · màu thẻ (6 màu định sẵn) · ghi chú động lực ("vì sao mình làm việc này") · Tạm dừng · Lưu trữ.

- **Tạm dừng:** habit rời khỏi ngày, streak riêng đóng băng, quay lại nối tiếp.
- **Lưu trữ:** giữ toàn bộ lịch sử, rời mọi view; xóa vĩnh viễn chỉ nằm trong màn Lưu trữ + confirm (destructive isolation).
- Sửa habit bất kỳ lúc nào. Đổi kiểu theo dõi: lịch sử cũ giữ nguyên, các ngày trước thời điểm đổi hiển thị đơn giản ✓/✗ theo "đã hoàn thành hay chưa" — không diễn giải lại giá trị cũ theo mục tiêu mới.
- Kéo-thả sắp xếp trong buổi. Không giới hạn số habit; >7 việc/ngày Nếp nhắc nhẹ giọng quan tâm (qua guard).

### 5.2 Luật hoàn thành & chuỗi (pure functions, test-first)

Định nghĩa "ngày giữ nhịp" cho **chuỗi chung** (giữ tinh thần hiện tại: ≥1 việc):
1. Ngày có ≥1 habit scheduled hoàn thành → giữ nhịp, chuỗi +1.
2. Ngày không có habit nào scheduled (toàn 🍃) → trung tính: chuỗi giữ nguyên, không +1.
3. Ngày scheduled mà 0 hoàn thành: nếu còn 🍃 lá chắn → tự dùng 1 lá, chuỗi giữ nguyên (không +1); hết lá → chuỗi bắt đầu lại (copy no-guilt: "bắt đầu nhịp mới", không bao giờ "mất/thua").
4. Lá chắn che **cả ngày**: chuỗi chung + mọi chuỗi riêng đều được giữ.

**Chuỗi riêng từng habit:** ngày scheduled hoàn thành → +1; ngày không scheduled/tạm dừng → giữ nguyên; ngày scheduled bỏ lỡ (không lá chắn) → bắt đầu lại.

**Hoàn thành theo kiểu:** count/duration đạt mục tiêu = hoàn thành (partial hiển thị tiến độ, không phạt); checklist đủ bước = hoàn thành. Kinh tế 🌾: "hoàn thành" theo định nghĩa mới thay thế "tick" trong công thức earn hiện có của `dashboard-data.ts` — ngoài ra **không đổi bất kỳ tham số nào** (earn rate, `FOOD_CAP=21`, luật prune/derive giữ nguyên).

`bestStreakFloor` (=26) và seed fiction: tôn trọng tuyệt đối; records `date <= seedCutoverDate` không bao giờ rời máy (như spec pet §).

---

## 6. Nếp & 4 tính năng mới

1. **🍃 Lá chắn của Nếp** — mua 7 🌾/lá tại `/nep`, giữ tối đa 2. Tự dùng khi cả ngày trống (không cần bấm). Sáng hôm sau: thẻ thông báo "Hôm qua em che cho anh một hôm 🍃 … Chuỗi 🔥N vẫn nguyên". Mua = spend ledger loại mới (§9.4).
2. **📔 Cuốn album** — trang trong `/nep`; mốc tự động thành thẻ trang: habit đầu tiên, chuỗi chung 7/30/100, tuần trọn vẹn đầu tiên, mỗi lần bond lên cấp, nhận pet mới. Trang kế tiếp hiện mờ "còn N ngày nữa…" tạo mong chờ. Tính từ lịch sử local, không cần server.
3. **✨ Giờ vàng** — ghi thêm giờ hoàn thành vào ô log (trước chỉ có ngày). Đủ ~14 ngày dữ liệu → insight ở `/calendar` + gợi ý trong form habit ("Giờ vàng của anh: 21:00–22:00, tỉ lệ xong 92%"). Tính hoàn toàn local.
4. **📊 Thư tuần của Nếp** — xuất hiện ở `/calendar` từ tối CN (lần mở đầu sau 18:00 CN, giữ đến hết T2): tổng lượt vs tuần trước (so với chính mình), ngày sung sức nhất, habit đang lên nhịp, **đúng 1 gợi ý** cho tuần sau. Nội dung từ pure function + voice pack mới, toàn bộ qua guard `pet-voice.test.ts`.

Vòng lặp hằng ngày của Nếp: tick → +1 🌾 bay về thẻ/chip Nếp, thỉnh thoảng 1 câu voice; 100% ngày → celebration; `/nep` là nơi "chơi" (cho ăn, vuốt ve, album, lá chắn) — pet không chiếm hero nữa.

---

## 7. Bạn vườn (reskin, không đổi chức năng)

- Hàng bạn: avatar tông đất + pet nhỏ ở góc + 🔥 streak của bạn; dòng trạng thái gần nhất; **đúng 1 nút/hàng**, cấp nút theo ngữ cảnh (có tin đáng phản hồi → primary "Cổ vũ"; bình thường → secondary "Thăm vườn").
- Thẻ Hội chợ + Nhịp Chung: nền mật ong (điểm ấm duy nhất của danh sách).
- Mời bạn bằng mã vườn: ghost button đầu trang.
- Overlay thăm vườn + gift giữ luồng hiện có, restyle theo token mới.
- RPC/contract server không đổi.

---

## 8. Trang Lịch & nhịp

- Lịch tháng: giữ logic conic-fill/status hiện có, restyle token mới; chọn ngày → chi tiết ngày (danh sách habit ngày đó, trạng thái, 🍃/lá chắn nếu có).
- Analytics chuyển từ dashboard về đây: summary metrics + trend 7D/30D/90D + habit bền nhất/cần chú ý (không câu chữ trách móc — "cần chú ý" đổi thành giọng gợi ý). Chart restyle theo token (line đất nung/xanh, grid đá ấm).
- Thư tuần của Nếp (§6.4) + insight Giờ vàng (§6.3) đặt ở đây.

---

## 9. Kỹ thuật

### 9.1 Token & component nền

- CSS variables ngữ nghĩa trong `globals.css`; `tailwind.config.ts` map token (xóa dần rice/matcha/sakura sau khi không còn nơi dùng).
- `src/components/ui/`: Button (3 cấp), Chip, Card, Icon wrapper (lucide-react — thêm dependency), TabSwitch, ProgressRing, BottomTabBar/NavRail.
- Font qua `next/font/google` (Bricolage Grotesque + Be Vietnam Pro, subset `vietnamese`).

### 9.2 Tái cấu trúc component

- Layout `(app)` chứa shell nav + **StateProvider** (context) — chuyển toàn bộ state/effects từ `dashboard-client.tsx` (1.180 dòng) lên provider; 4 page consume qua hooks. Pure functions ở `dashboard-data.ts` (+ test) giữ nguyên vị trí.
- Sync engine, auth actions, social actions: **không đổi API**; chỉ đổi nơi mount.
- Component mới/đổi tên chính: `HeroSky`, `HabitDayList`, `HabitWeekGrid`, `HabitEditorSheet`, `HabitDetail`, `NepHome`, `NepAlbum`, `WeeklyLetter`, `FriendsPage`, `WidgetChips`.

### 9.3 Dữ liệu local (v2 → v3)

- Key mới `betterme.dashboard.v3`; migration tự động từ v2 (pattern v1→v2 sẵn có), v2 giữ đọc-only. Habit cũ map: `trackingType:"check"`, icon suy từ category, lặp cả 7 thứ, buổi "Cả ngày".
- Ô log: từ boolean → `{ value, completedAt? }` (value: 1 | số đếm | phút | bitmask bước con). Ô cũ map `value:1`.
- Thêm: ví lá chắn `{ count, usedDates[] }`, cache album, watermark thư tuần.

### 9.4 Sync & server — amendment nhỏ (cần soát kỹ ở bước lập plan)

- Log cells + habit definitions sync qua LWW per-field hiện có; field mới đi cùng cơ chế đó. Bước plan phải soát `merge.ts`/`importer.ts` từng field (đặc biệt: đổi kiểu theo dõi trên 2 thiết bị — LWW theo `updatedAt` của definition, chấp nhận như spec LWW hiện tại).
- Ledger: thêm loại spend `shield` (7 🌾). KHÔNG đổi công thức earn/FOOD_CAP/derive. Nếu server enum chặn loại mới → migration SQL nhỏ, idempotent, thêm banner vào `schema.sql`. `CompanionState.food` vẫn là derived cache — mọi chỗ đụng ledger gọi lại `deriveFoodBalance`.
- Giờ hoàn thành (`completedAt`) sync như phần của ô log; seed records vẫn không bao giờ rời máy.
- Amendment này sẽ ghi vào cuối `2026-07-08-social-garden-spec.md` khi triển khai U1 (một đoạn "Amendment 2026-07-26").

### 9.5 Testing & gates

- 4 gates xanh trước mọi commit: `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`. pnpm only.
- Test-first cho pure functions mới: streak (chuỗi chung/riêng, 🍃, lá chắn, các case ranh giới đổi ngày), migration v2→v3, hoàn thành theo kiểu, Giờ vàng, chọn nội dung thư tuần, album milestones.
- Voice pack mới (lá chắn, thư tuần, nhắc >7 việc) vào guard no-guilt hiện có.
- Component test theo pattern hiện có cho: editor, week grid, hero, shield banner. Test cũ của UI đổi cấu trúc được cập nhật tương ứng — hành vi pure functions cũ không được đổi ngoài phần spec này nêu.
- A11y: contrast AA cho mọi cặp token chữ/nền; touch target ≥44px; tick bằng bàn phím; focus ring token hóa; celebration + motion tôn trọng reduced-motion.

---

## 10. Lộ trình — 5 bước, mỗi bước gates xanh + commit riêng + owner duyệt

| Bước | Nội dung | Ghi chú |
|---|---|---|
| **U0** | Token system + font + bộ `ui/` + shell 4 route (nav rail/bottom tab) | App chạy y nguyên hành vi, các trang mới tạm là chỗ ở mới của component cũ |
| **U1** | Habit model v3 + migration + editor + day view mới | Lõi giá trị; owner backup localStorage (export JSON) trước khi thử data thật; kèm amendment ledger nếu làm lá chắn sớm — mặc định lá chắn để U3 |
| **U2** | Hero bầu trời + week grid + trang Lịch & nhịp (chuyển analytics) | |
| **U3** | Nhà của Nếp + album + lá chắn (kèm amendment sync) + celebration | |
| **U4** | Thư tuần + Giờ vàng + Bạn vườn áo mới + polish tổng (a11y, motion, empty states, login reskin) | |

Rủi ro chính & giảm nhẹ: migration v3 (backup + v2 đọc-only), merge field mới trên 2 thiết bị (soát merge.ts ở plan, test merge 2 replica), font tải chậm (next/font self-host), phạm vi rộng (mỗi bước là 1 commit độc lập có thể dừng/đảo).

---

## 11. Ngoài phạm vi (ghi nhận, không làm đợt này)

- Trang hồ sơ/cài đặt thật (ProfileMenu vẫn toast "đang ươm mầm").
- Test DB-level spec social §12, soak sync 1 tuần (HANDOFF §4 B/C) — vẫn là việc riêng.
- Timer chạy thật cho kiểu thời lượng; nhắc notification/push; Google Calendar; theme thứ hai.
