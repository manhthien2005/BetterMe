# U2c — widget thành chip, và sân sau của desktop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thời tiết + Spotify thôi chiếm một cột riêng — co thành **2 chip một dòng** dưới habit list, bấm mở popover chi tiết (spec §4.3). Cột phải desktop đổi thành **sân sau sticky** với **thẻ Nếp thu gọn** (spec §4.4).

**Architecture:** Một primitive `ui/popover.tsx` bọc Radix. Hai chip là hai component nhỏ trong `widget-chips.tsx`, mỗi cái mở popover chứa **đúng nội dung chi tiết đang có** — `WeatherCard` và `SpotifyCard` không bị viết lại, chỉ bị đổi chỗ. `NepMiniCard` mới đọc `viewModel.companion` và gọi cùng handler mà `/nep` gọi, không có state riêng.

**Tech Stack:** Next.js 15.5 App Router · React 19 · TypeScript 5.9 strict · Tailwind 3.4 (token `var(--*)`) · `@radix-ui/react-popover` 1.1.15 (đã cài) · Vitest + Testing Library (jsdom).

## Global Constraints

- **No-guilt** (invariant 1, test-enforce): thẻ Nếp không bao giờ hối "chưa cho ăn", "bỏ mặc", "quên". Nút mờ đi là đủ, không cần một câu trách.
- **No-decay** (invariant 2): thẻ Nếp là bề mặt **chỉ đọc + hai hành động đã có** (`feedPet`, `petThePet`). Không thêm đường giảm growth/bond nào.
- **Màu là vai trò**: `--action` là màu primary/link DUY NHẤT (tối đa MỘT nút primary mỗi vùng — trong sân sau đó là "Cho ăn", nên "Vuốt ve" phải là secondary) · `--success` là hoàn thành · `--alert` chỉ badge tin mới.
- **Không opacity modifier trên token màu** (`bg-action/10` không chạy với `var()`).
- **Class Tailwind phải xuất hiện nguyên văn trong source** — không ghép template string.
- **Đợt này gỡ palette v2 ở ba bề mặt**: `weather-card.tsx`, `spotify-card.tsx`, `companion-panel.tsx` đang còn `plum`/`mauve`/`wafer`/`matcha-deep`/`rice`/`sakura`/`soft-panel`/`shadow-mochi`. Chip và thẻ mới **chỉ dùng token**; phần chi tiết bên trong popover được chuyển sang token trong cùng task.
- Vùng chạm tối thiểu 44px. Chữ AA 4.5:1, ranh giới control 3:1.
- 4 cổng phải xanh trước mỗi commit: `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`.

## Phạm vi đã chốt với owner (2026-07-27)

1. **Popover dùng `@radix-ui/react-popover`**, không tự viết. Radix lo focus trap, Escape, click-outside và định vị — ba thứ một popover tự viết luôn làm sai.
2. **Sân sau ở U2c chỉ có thẻ Nếp.** Thẻ "Vườn bạn bè 3 dòng tin mới nhất" **hoãn**: provider hiện chỉ có `newSocialCount` (một con số), chưa có danh sách tin, nên làm nó đúng nghĩa là một task dữ liệu riêng (server action trả feed) — không nhét vào đợt UI này.
3. **Popover Spotify giữ `<iframe>` mount, chỉ ẩn khi đóng** (`forceMount` + `hidden`). Đóng chip mà nhạc tắt là mất thứ người dùng đang dùng; đánh đổi là một iframe luôn nằm trong DOM, nên khi đóng phải `aria-hidden` để screen reader không đi lạc vào một vùng không thấy được.

**Đã kiểm trước khi lập plan:** Radix Popover render được trong jsdom của repo (`environment: "jsdom"`, không có setup file) **không cần shim** `ResizeObserver`/`PointerEvent` — đã thử bằng một test tạm rồi xoá. Nên test đỏ ở Task 1 sẽ là đỏ vì code, không vì môi trường.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/components/ui/popover.tsx` | **Mới.** Bọc Radix Popover bằng token của repo. |
| `src/components/ui/popover.test.tsx` | **Mới.** Mở/đóng, Escape, và quan hệ trigger ↔ content. |
| `src/components/dashboard/widget-chips.tsx` | **Mới.** Hai chip một dòng; mỗi chip mở popover chứa nội dung chi tiết đang có. |
| `src/components/dashboard/widget-chips.test.tsx` | **Mới.** Chip hiện gì khi loading/error/ready, popover mở ra đúng nội dung. |
| `src/components/dashboard/nep-mini-card.tsx` | **Mới.** Thẻ Nếp thu gọn cho sân sau. |
| `src/components/dashboard/nep-mini-card.test.tsx` | **Mới.** Render + a11y + no-guilt + hai nút gọi đúng handler. |
| `src/components/dashboard/weather-card.tsx` | **Sửa.** Gỡ palette v2 sang token; bỏ khung `min-h-[280px]` để nằm gọn trong popover. |
| `src/components/dashboard/spotify-card.tsx` | **Sửa.** Gỡ palette v2 sang token (giữ xanh Spotify là màu thương hiệu, không phải token vai trò). |
| `src/components/app/today-page.tsx` | **Sửa.** Chip row dưới panel; cột phải thành sân sau sticky. |
| `AGENTS.md`, `HANDOFF.md` | **Sửa.** Tài liệu. |

---

### Task 1: `ui/popover.tsx` — một primitive, không phải bốn popover tự viết

**Files:**
- Create: `src/components/ui/popover.tsx`
- Test: `src/components/ui/popover.test.tsx`

**Interfaces:**
- Consumes: `@radix-ui/react-popover`, `cn` từ `@/lib/utils`.
- Produces: `Popover`, `PopoverTrigger`, `PopoverContent` — cùng hình dạng với `ui/tooltip.tsx` đang có (re-export Root/Trigger, `forwardRef` cho Content), để hai primitive đọc giống nhau.

- [ ] **Step 1: Viết test đỏ** — `src/components/ui/popover.test.tsx`

Kiểm bốn thứ Radix cho sẵn nhưng ta vẫn phải nối đúng: trigger có `aria-expanded`, content chỉ tồn tại khi mở, Escape đóng, và `PopoverContent` nhận thêm class ngoài.

- [ ] **Step 2: Chạy để thấy đỏ** — `pnpm vitest run src/components/ui/popover.test.tsx` → `Failed to resolve import "./popover"`.

- [ ] **Step 3: Viết primitive** — theo đúng khuôn `tooltip.tsx`: `Popover = PopoverPrimitive.Root`, `PopoverTrigger = PopoverPrimitive.Trigger`, `PopoverContent` là `forwardRef` bọc `PopoverPrimitive.Portal` + `Content` với `sideOffset = 8`, class token: `z-50 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line bg-surface-card p-4 shadow-card`.

- [ ] **Step 4: Xanh + 4 cổng + commit**

```bash
pnpm vitest run src/components/ui/popover.test.tsx
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
git add src/components/ui/popover.tsx src/components/ui/popover.test.tsx package.json pnpm-lock.yaml
git commit -m "feat(u2c): one popover primitive, borrowed from Radix"
```

---

### Task 2: `widget-chips.tsx` — hai chip một dòng

Đây là task nặng nhất. Điểm khó **không** phải cái chip, mà là giữ đủ ba trạng thái (loading / error / ready) trong một dòng chữ ngắn mà vẫn đọc được bằng screen reader.

**Files:**
- Create: `src/components/dashboard/widget-chips.tsx`
- Test: `src/components/dashboard/widget-chips.test.tsx`
- Modify: `src/components/dashboard/weather-card.tsx`, `src/components/dashboard/spotify-card.tsx`

**Interfaces:**
- Consumes: `useAppState()` (cho `weather`), `Popover*` từ Task 1, `WeatherCard`, `SpotifyCard`.
- Produces: `WidgetChips()` — một `<div>` chứa hai chip; không nhận prop nào (đọc provider), giống `WeatherCard` hiện tại.

**Nội dung chip:**

| Trạng thái | Chip thời tiết | Tên truy cập |
|---|---|---|
| `ready` | `⛅ 31°C · Sài Gòn` | `Thời tiết: 31°C, trời quang, Sài Gòn — bấm để xem chi tiết` |
| `loading` | `☁️ Đang ngó trời…` | `Thời tiết: đang tải — bấm để xem chi tiết` |
| `error` | `☁️ Chưa lấy được` | `Thời tiết: chưa lấy được — bấm để xem chi tiết và thử lại` |

Chip Spotify không có trạng thái mạng (nó là `<iframe>` do Spotify tự lo), nên chỉ một dạng: `🎧 Nhạc tập trung`.

**Popover Spotify dùng `forceMount`** (owner chốt 2026-07-27): iframe ở lại DOM để nhạc không tắt khi đóng chip. Radix vẫn đặt `data-state="closed"` lên content, nên phần ẩn phải tự lo hai việc mà `forceMount` bỏ mất: `hidden` để không chiếm chỗ, và `aria-hidden` để screen reader không đọc một playlist đang vô hình. Chip thời tiết KHÔNG cần `forceMount` — nó không có gì đang chạy để giữ.

- [ ] **Step 1: Viết test đỏ**

Sáu test: chip thời tiết hiện nhiệt độ khi ready · hiện "Đang ngó trời…" khi loading · hiện "Chưa lấy được" khi error mà **không** hiện `undefined`/`NaN` · bấm chip mở popover có đúng nội dung `WeatherCard` (tìm `heading` "Sài Gòn") · bấm chip Spotify mở popover có `iframe` title "Playlist Spotify của Sếp" · cả hai chip có `min-h-[44px]` và không còn class palette v2 (`matcha|sakura|plum|wafer|mauve|butter|rice`).

- [ ] **Step 2: Chạy để thấy đỏ** → `Failed to resolve import "./widget-chips"`.

- [ ] **Step 3: Viết component**

Một `<div className="flex flex-wrap items-center gap-2">` chứa hai `Popover`. Mỗi trigger là `<button type="button">` với `className` chip: `squishy inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-line bg-surface-card px-4 text-sm font-semibold text-ink transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page`.

Emoji trong chip là `aria-hidden` — cái nói được nằm trong `aria-label` của button.

- [ ] **Step 4: Gỡ palette v2 trong hai card chi tiết**

`weather-card.tsx`: `soft-panel`→`bg-surface-card`, `dawn-band`/`card-lift` bỏ, `text-plum`→`text-ink`, `text-mauve`→`text-ink-mid`, `border-wafer`→`border-line`, `ring-matcha-deep`→`ring-action`, `bg-matcha-deep`→`bg-action` + `text-action-ink`, `text-dawn-deep`→`text-ink-mid`, 4 tile metric dùng `bg-surface-warm` + `border-line`. **Bỏ `min-h-[280px]`** — trong popover nó tạo khoảng trống. `<section>` ngoài cùng đổi thành `<div>` (popover đã là vùng có nhãn riêng).

`spotify-card.tsx`: giữ nền tối và xanh `#1db954` (màu thương hiệu Spotify, không phải token vai trò — ghi rõ lý do trong comment), nhưng `shadow-mochi`→`shadow-card`, `card-lift` bỏ, `rounded-lg`→`rounded-card`.

Test cũ của `weather-card.test.tsx` phải vẫn xanh: nó tìm theo `heading`/text, không theo class — kiểm lại, nếu có test bám class thì sửa test cho khớp vai trò mới.

- [ ] **Step 5: Xanh + 4 cổng + commit**

```bash
pnpm vitest run src/components/dashboard/widget-chips.test.tsx src/components/dashboard/weather-card.test.tsx
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
git add src/components/dashboard/widget-chips.tsx src/components/dashboard/widget-chips.test.tsx src/components/dashboard/weather-card.tsx src/components/dashboard/spotify-card.tsx
git commit -m "feat(u2c): weather and music shrink to two chips"
```

---

### Task 3: `nep-mini-card.tsx` — thẻ Nếp thu gọn

**Files:**
- Create: `src/components/dashboard/nep-mini-card.tsx`
- Test: `src/components/dashboard/nep-mini-card.test.tsx`

**Interfaces:**
- Consumes: `CompanionPetView` + `DashboardViewModel` từ `dashboard-data`, `Button` từ `ui/button`, `Card` từ `ui/card`, `Link` từ `next/link`.
- Produces: `NepMiniCard({ bubble, food, onFeed, onPet, pet })` — **nhận prop, không đọc provider**. Lý do: nó là bề mặt thứ hai của cùng dữ liệu `/nep` đã có, và prop hoá làm nó test được không cần dựng cả provider.
- Khi chưa nhận nuôi pet (`pet === null`): thẻ mời một câu ("Nếp đang đợi Sếp đặt tên") + link `/nep`, **không** render bond bar rỗng.

**Nội dung** (spec §4.4): mặt pet (emoji theo species+stage) · mood/bond tier label · bond bar · 2 nút — **Cho ăn primary, Vuốt ve secondary** (tối đa một primary mỗi vùng) · link "Ghé nhà Nếp ▸" sang `/nep`.

- [ ] **Step 1: Viết test đỏ**

Sáu test: có `heading` tên pet · bond bar là `role="progressbar"` đọc được cấp thân thiết · "Cho ăn" gọi `onFeed`, "Vuốt ve" gọi `onPet` · hết thức ăn thì "Cho ăn" `disabled` **và không có câu trách nào** (guard no-guilt: `["quên","bỏ mặc","chưa cho ăn","tệ","kém"]` không xuất hiện) · có link tới `/nep` · chưa nhận nuôi thì hiện câu mời, không có progressbar · không còn palette v2.

- [ ] **Step 2: Chạy để thấy đỏ**

- [ ] **Step 3: Viết component** — dùng `Card`, token, `Button` sẵn có. Bond bar là `<div role="progressbar" aria-label={...} aria-valuenow aria-valuemin={0} aria-valuemax={5}>`; **không** hand-roll thanh mới nếu `ProgressRing` phù hợp hơn — nhưng bond là thanh ngang, ring là vòng, nên thanh riêng là đúng chỗ; ghi rõ trong comment vì AGENTS.md có luật "chỉ một progress ring".

- [ ] **Step 4: Xanh + 4 cổng + commit**

```bash
pnpm vitest run src/components/dashboard/nep-mini-card.test.tsx
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
git add src/components/dashboard/nep-mini-card.tsx src/components/dashboard/nep-mini-card.test.tsx
git commit -m "feat(u2c): Nếp gets a corner of the day view"
```

---

### Task 4: `today-page.tsx` — chip xuống dưới, sân sau sang phải

**Files:**
- Modify: `src/components/app/today-page.tsx`
- Test: `src/components/app/today-page.test.tsx` (đã có từ U2b)

- [ ] **Step 1: Viết test đỏ** — thêm vào file test đã có: chip row nằm **trong** cột chính (không phải `aside`) · `aside` sân sau có thẻ Nếp · `aside` KHÔNG còn `WeatherCard` dạng cột riêng · tab Ngày/Tuần vẫn hoạt động như U2b (test cũ phải xanh nguyên).

- [ ] **Step 2: Chạy để thấy đỏ**

- [ ] **Step 3: Sửa page**

Cột chính: hero → TabSwitch → panel → **`<WidgetChips />`**. Cột phải: `<aside aria-label="Sân sau" className="hidden gap-5 xl:sticky xl:top-5 xl:grid">` chứa `NepMiniCard`.

`hidden ... xl:grid` là chủ đích: sân sau là **desktop only** (spec §4.4 nói rõ). Trên mobile thẻ Nếp không biến mất khỏi app — nó vẫn ở `/nep`, là nhà chính của nó.

- [ ] **Step 4: Xanh + 4 cổng + commit**

---

### Task 5: Tài liệu + hoàn tất

- [ ] **Step 1: `AGENTS.md`** — thêm: popover là `ui/popover.tsx` (Radix, đừng tự viết) · widget là chip + popover, không phải cột riêng · sân sau desktop-only và thẻ Nếp nhận prop chứ không đọc provider · xanh Spotify là màu thương hiệu, ngoại lệ có chủ đích của luật "màu là vai trò". Cập nhật số test thật.
- [ ] **Step 2: `HANDOFF.md`** — dòng U2c vào bảng §2, cập nhật §4 (U2 xong hết → còn U3/U4), ghi rõ **thẻ Vườn bạn bè bị hoãn** và vì sao.
- [ ] **Step 3: 4 cổng lần cuối + commit**
- [ ] **Step 4: `superpowers:finishing-a-development-branch`** → PR vào `main`.

---

## Self-Review

**1. Spec coverage (§4.3 + §4.4).** 2 chip 1 dòng dưới habit list, desktop + mobile → Task 2 + Task 4. Popover chi tiết giữ đủ loading/error → Task 2 Step 1 (ba test trạng thái). Không còn chiếm cột riêng → Task 4 (`aside` không còn `WeatherCard`). Thẻ Nếp thu gọn: mặt + mood + bond bar + 2 nút + link `/nep` → Task 3. Cột phải sticky desktop-only → Task 4 (`hidden xl:grid` + `xl:sticky`).

**Gap có chủ đích, phải nói trong PR:**
1. **Thẻ Vườn bạn bè (§4.4 gạch đầu dòng 2) chưa làm** — owner đã chốt hoãn. Cần `newSocialCount` nở thành một feed thật (3 dòng tin mới nhất) trước, và đó là task dữ liệu chứ không phải UI. Không làm nửa vời bằng cách hiện "bạn có 3 tin" — spec đòi *nội dung* tin.
2. **`companion-panel.tsx` vẫn còn palette v2.** U2c gỡ v2 ở `weather-card` + `spotify-card` (hai file nó chạm), nhưng `companion-panel` là bề mặt của `/nep` — gỡ nó thuộc đợt của `/nep`, và đụng vào đây thì task này phình ra một màn hình khác.
3. **`--alert` chưa dùng trong sân sau** vì badge tin mới thuộc thẻ bạn bè đang hoãn.

**2. Placeholder scan.** Không có TBD/TODO. Task 1 và 3 mô tả class/hình dạng cụ thể; Task 2 có bảng trạng thái chip đầy đủ ba nhánh.

**3. Type consistency.** `NepMiniCard` nhận `pet: CompanionPetView | null` — cùng type `CompanionPanel` đang đọc từ `viewModel.companion.activePet`, nên `today-page` truyền thẳng được. `WidgetChips` không nhận prop, đọc `useAppState()` như `WeatherCard` hiện tại → không thêm mặt tiếp xúc mới vào `AppState`.

**4. Rủi ro.**

(a) **Radix trong jsdom: đã kiểm, không cần shim.** Chạy thử một Popover thật (trigger + content + Escape) trong môi trường test của repo trước khi viết plan này — xanh, không cần `ResizeObserver` hay `PointerEvent` giả. Nên nếu Task 1 đỏ thì đỏ vì code, không phải vì môi trường.

(b) **`forceMount` là con dao hai lưỡi** — nó giữ nhạc nhưng cũng giữ nội dung trong cây accessibility. Test phải khẳng định phần đóng có `aria-hidden`, không chỉ khẳng định iframe còn đó; thiếu nửa sau thì screen reader đọc một playlist người dùng không thấy.

(c) `min-h-[44px]` trên chip là con số phải nhìn bằng mắt trên mobile thật — không test nào bắt được vùng chạm hẹp.
