# HANDOFF — Nếp's Garden / Vườn Có Bạn

> **Ngày cập nhật:** 2026-07-27 · **Trạng thái tree:** sạch, 4 gates xanh (**574/574 test, 55 file**)
> **Nhánh:** `u2b-day-week-tabs` (U0 + U1a + U1b + U1c đã merge vào `main`; U2a ở `u2-hero-and-week`) · File này là điểm vào duy nhất cho người nhận bàn giao.
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
| `u2b-day-week-tabs` (11 commit, chưa merge) | **U2b tab Ngày/Tuần + lưới tuần**: `week-model.ts` thuần (ô phân biệt `off`/`future`/`empty`/`missed`, `total.scheduled` chỉ đếm ngày có lịch và đã tới) · `WeekGridCard` là `<table>` thật, nghĩa nằm trong `aria-label` từng ô, cột hôm nay `aria-current="date"` · `TabSwitch` thêm `idPrefix` để nối tab ↔ panel · `habitStreaks` đổi khoá sang mọi habit · 7 chấm hero thành tuần dương lịch T2→CN · nhãn thứ gom về `@/lib/date` |
| `u2-hero-and-week` (7 commit, chưa merge) | **U2a hero bầu trời**: token 3 buổi (`--sky-{morning,afternoon,evening}-*`) với ink riêng từng buổi vì tối là nền tối · `sky.ts` chọn buổi theo giờ · hero mới: chào theo buổi, dòng ngày gộp thời tiết, 🔥 chuỗi + kỷ lục, 7 chấm, vòng tiến độ · `ProgressRing` + `TabSwitch` (nợ từ U0) · thời tiết chuyển về `StateProvider` — một fetch cho cả app |
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
pnpm vitest run  # 574 tests / 55 files
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

**Hệ quả có chủ đích:** bong bóng thoại của Nếp hiện chỉ xuất hiện ở `/nep` (nó sống trong `CompanionPanel`). U2 dựng hero bầu trời có câu nói của Nếp, U4.4 thêm thẻ Nếp thu gọn ở cột phải desktop.

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
- **U2a — XONG** (nhánh `u2-hero-and-week`, 7 commit, 505 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u2a-sky-hero.md`. U2 bị chia làm ba vì §4.1 (hero) và §4.2 (tab + lưới tuần) là hai deliverable duyệt được riêng. Bốn điều đáng nhớ:
  1. **Bầu trời là ba BỘ token, không phải ba class.** Buổi tối là nền tối nên chữ phải lật sang sáng → ink thuộc về từng buổi (`--sky-evening-ink`), không dùng chung `--ink`. `design-tokens.test.ts` kiểm ink trên **cả hai** đầu gradient; kiểm một đầu là tự lừa mình vì chữ nằm trên toàn dải.
  2. **Thời tiết dọn về `StateProvider`** — trước đây chỉ `WeatherCard` fetch. Hero cần cùng dữ liệu đó, mà thêm fetch thứ hai thì hai chỗ hiện hai con số khác nhau vào lúc mạng chậm.
  3. **Class Tailwind phải xuất hiện nguyên văn trong source** — `SKY_STYLES` viết đủ chuỗi thay vì ghép template; class Tailwind không "nhìn thấy" được là class nó không sinh ra. Cũng đã kiểm khoá `sky` không đụng palette `sky` mặc định của Tailwind (`rg "sky-[0-9]"` → sạch).
  4. **`ProgressRing` giờ là nơi duy nhất có vòng tiến độ** — `habit-entry-control.tsx` trước đó tự viết conic-gradient riêng, nay dùng chung.

  **Khoảng trống của U2a, đã đóng ở U2b:** 7 chấm hero từng là "7 ngày gần nhất"; nay là tuần dương lịch T2→CN.
- **U2b — XONG** (nhánh `u2b-day-week-tabs`, 11 commit, 574 test xanh). Plan: `docs/superpowers/plans/2026-07-27-u2b-day-week-tabs.md`. Nội dung: tab **Hôm nay / Tuần này** ở `today-page`, lưới tuần T2→CN, và 7 chấm hero đổi sang cùng tuần đó. Năm điều đáng nhớ:
  1. **Một ô "chưa xong" có bốn nghĩa khác nhau** (`week-model.ts`): `off` (không có trên lịch hôm đó, hoặc đã tạm dừng/lưu trữ) · `future` (chưa tới) · `empty` (**hôm nay**, còn nguyên cơ hội) · `missed` (ngày đã qua hẳn mà trống). Gộp bất kỳ cặp nào là biến lưới thành bảng điểm trách móc — hôm nay chưa hết thì chưa thể là ngày thất bại. `total.scheduled` chỉ đếm ô **có lịch VÀ đã tới**; đếm cả tương lai thì mỗi Thứ Hai mở ra 11 thất bại chưa xảy ra.
  2. **Lưới là `<table>` thật, và nghĩa nằm trong tên truy cập** — `aria-label` mỗi ô ghi đủ "Uống nước, T2 20 tháng 7: 4/8 ly", cột hôm nay có `aria-current="date"` chứ không chỉ đổi màu. Màu không bao giờ là tín hiệu duy nhất (WCAG 1.4.1), nên test đọc *tên* chứ không đọc class.
  3. **Nhãn thứ gom về `@/lib/date`** (`VI_WEEKDAY_LABELS` + `viWeekdayLabel`). Hero và lưới phải gọi cùng một tuần bằng cùng một tên; `dashboard-data.ts` **không thể** import `week-model.ts` (vòng tròn) nên nhãn không thể sống ở một trong hai.
  4. **`habitStreaks` đổi khoá sang MỌI habit**, không chỉ habit của hôm nay — lưới hiện hàng cho habit chỉ lặp Thứ Ba, và hàng đó cần 🔥 của nó vào một ngày Thứ Hai. Trước đó nó âm thầm đọc ra 0. Day view tra theo id nên thêm khoá không tốn gì.
  5. **`TabSwitch` giờ đòi `idPrefix`** để nối `aria-controls` ↔ `id` panel. Chỉ panel đang chọn được mount: một panel ẩn bằng CSS vẫn nằm trong cây accessibility cho screen reader đi lạc vào.

  **Chưa làm, có chủ đích:** trạng thái 🍃 **nghỉ chủ đích** chưa có — 🍃 lá chắn là tính năng của **U3**; U2b chỉ có `off` (không có trên lịch). Khi U3 làm lá chắn, `WeekCellState` cần thêm một nhánh. Lưới là bề mặt **chỉ đọc**: U2b không mở đường sửa dữ liệu quá khứ.
- **U2c — sau đó**: thời tiết + Spotify co thành 2 chip 1 dòng (§4.3), sân sau desktop cột phải sticky (§4.4).

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
| Primitive design system | `src/components/ui/{button,card,chip,icon,nav-rail,bottom-tab-bar,progress-ring,tab-switch}.tsx` + token trong `src/app/globals.css` `:root` |
| Panel UI | `src/components/dashboard/{hero-banner,habit-day-list,habit-entry-control,habit-editor-sheet,week-grid,calendar-panel,companion-panel,celebration-overlay,weather-card,analytics-panel,profile-menu,site-footer,friends-card,garden-fair,garden-visit-overlay,sync-onboarding,pet,nep}.tsx` |
| Voice + invariant tests | `src/components/dashboard/pet-voice.ts` + `pet-voice.test.ts` |

---

## 6. Rủi ro / giới hạn đã biết (chấp nhận có chủ đích — đừng "sửa" nhầm)

- **Trust model (spec §0.7)**: data gốc là self-reported + owner-writable (bản chất local-first). Server bảo đảm summary *nhất quán với data gốc*, không chống được user tự tick láo — Hội chợ là trò chơi giữa bạn thật.
- **LWW tin đồng hồ client** cho name/species/log cells — spec chấp nhận; watermark reset đã theo server-time.
- **Ledger imprecision có trần**: 2 replica lệch >30 ngày có thể đếm đôi net của 1 ngày đã prune (clamp bởi FOOD_CAP=21; spend không bao giờ mất).
- **`CompanionState.food` là derived cache** — mọi code đụng ledger phải gọi lại `deriveFoodBalance`; KHÔNG BAO GIỜ merge field này.
- **`bestStreakFloor` (=26) và `events` là seed fiction** — không bao giờ upload; records `date <= seedCutoverDate` không bao giờ rời máy.
- **WeatherCard là dữ liệu tĩnh có chủ đích** (spec 2026-07-05) — chưa có live API; đừng coi là bug, nhưng là ứng viên xem xét trong đợt đại tu UI.
