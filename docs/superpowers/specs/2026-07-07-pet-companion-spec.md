# Pet Companion — Spec (AS-BUILT, khớp code đã ship)

> **Trạng thái: ĐÃ SHIP** — commit `839d2f2` (2026-07-07). Research nền tảng: `2026-07-07-pet-companion-research.md`.
> Tài liệu này mô tả đúng những gì đang chạy trong code, để chỉnh sửa/mở rộng về sau.
> Gates lúc ship: typecheck ✓ · lint ✓ · 37/37 tests ✓ · build ✓ · 8 screenshots duyệt tay.

## 0. Nguyên tắc bất biến (đã enforce bằng test)

1. **Không guilt**: không câu thoại nào trách user — `pet-voice.test.ts` chặn cứng các cụm "thất vọng / tại cậu / bỏ rơi / đói lắm"…
2. **Không decay**: growth/bond chỉ tăng, không bao giờ giảm. Vắng ≥2 ngày → pet **tặng quà để dành**.
3. **Không asset ngoài**: 100% SVG-in-code, zero dependency mới (dashboard bundle 22 kB).
4. **prefers-reduced-motion**: mọi animation pet đều `animation: none`; heart/confetti/food-arc/evolve-ring còn `display: none`.
5. **Backward compatible**: dữ liệu v1 migrate sạch sang v2, key v1 **không bị xóa** (giữ đường lui).

## 1. Bản đồ file (as-built)

| File | Vai trò |
|---|---|
| `src/components/dashboard/dashboard-data.ts` | CompanionState + 11 pure functions + view model. **Mọi con số kinh tế là constants ở đầu file.** |
| `src/components/dashboard/pet-voice.ts` | Voice packs (~160 câu VN) + shuffle-bag. Exports: `getPetLine`, `getVoicePool`, `resetVoiceBags`, type `PetEvent`. |
| `src/components/dashboard/pet.tsx` | Exports: `Pet`, `getPetMood`, `GiftBox`, `PetAdoption`. SVG + mức-2 interactions. |
| `src/components/dashboard/dashboard-client.tsx` | Wiring: hydrate/migrate, handlers, `CompanionCorner` (bubble + Pet + BondMeter + FoodTray + PetSwitcher). |
| `src/components/dashboard/nep.tsx` | Giữ nguyên — Nếp giờ là **người giữ vườn ở trang login** (`src/app/login/page.tsx`). |
| `src/app/globals.css` | 14 animation classes mới (xem §6). |
| Tests | `dashboard-data.test.ts` (19), `pet-voice.test.ts` (5), `page.test.tsx` (6, gồm adoption + feeding flow). |

## 2. Data model — localStorage `betterme.dashboard.v2`

```ts
type PetSpecies = "dog" | "cat";
type PetStage = "baby" | "kid" | "junior" | "teen" | "adult";
type BondTier = 1 | 2 | 3 | 4 | 5;

type CompanionPetState = {
  species: PetSpecies;
  name: string;              // user đặt, trim ≤20 ký tự; fallback: dog "Xoài", cat "Mochi"
  adoptedOn: string;         // ISO
  growthDays: number;        // ngày có chăm (≥1 habit hoặc 1 lần cho ăn) khi pet đang active
  bond: number;              // chỉ tăng
  lastGrowthDate: string | null;   // chống cộng 2 growth day/ngày
  petsToday: number;         // đếm vuốt ve hôm nay
  petsTodayDate: string | null;
};

type CompanionState = {
  pets: Partial<Record<PetSpecies, CompanionPetState>>;  // adopt con nào mới có entry
  activeSpecies: PetSpecies | null;   // null = chưa nuôi → hero hiện egg picker
  food: number;                        // kho CHUNG 2 con, cap 21
  foodGrantedByDate: Record<string, number>;  // ledger/ngày — chống farm bằng untick-retick
  allDoneBonusDates: Record<string, boolean>; // bonus 7/7 chỉ 1 lần/ngày
  lastSeenDate: string | null;         // tính quà comeback
  pendingGift: boolean;
};
// DashboardState có thêm field: companion: CompanionState
```

**Migration**: `migrateDashboardState(raw)` — nhận payload v1 (không có `companion`) hoặc v2, trả về state chuẩn v2 (habits/records/events đi qua nguyên vẹn), trả `null` nếu payload rác. Client đọc `betterme.dashboard.v2` ?? `betterme.dashboard.v1`, luôn ghi ra v2.

## 3. Kinh tế — constants ở đầu `dashboard-data.ts` (chỉnh số ở đây)

| Constant | Giá trị | Ý nghĩa |
|---|---|---|
| `FOOD_CAP` | 21 | trần kho food (chống binge) |
| `BOND_PER_FEED` | 2 | bond mỗi lần cho ăn |
| `BOND_PER_PETTING` | 1 | bond mỗi lần vuốt ve |
| `PETTING_CAP_PER_DAY` | 3 | vuốt quá vẫn có animation, không cộng điểm |
| `ALL_DONE_BOND_BONUS` | 5 | bonus bond ngày 7/7 (1 lần/ngày) |
| `GIFT_FOOD` / `GIFT_BOND` | 3 / 3 | phần thưởng mở quà comeback |
| `GIFT_ABSENCE_DAYS` | 2 | vắng ≥2 ngày mới có quà (nghỉ 1 ngày = bình thường) |
| `FOOD_LEDGER_RETENTION_DAYS` | 30 | ledger tự prune, localStorage không phình |
| `PET_STAGE_THRESHOLDS` | 0/5/15/30/50 growth days | baby→kid→junior→teen→adult |
| `BOND_TIER_THRESHOLDS` | 0/60/180/420/840 | Lạ lẫm→Quen mặt→Bạn thân→Tri kỷ→Gia đình |

**Luật food** (`grantFoodForHabitCompletion`): tick 1 habit = +1 food; ngày đạt 100% = +1 bonus (wanted=2 ở cú tick cuối). Ledger `foodGrantedByDate[today]` cap `totalCount + 1` → untick rồi tick lại **không** farm thêm được. Untick không bị trừ (gentle).

**Luật growth**: `recordGrowthDay` (gọi khi tick habit đầu ngày) và `feedActivePet` đều cộng, nhưng `lastGrowthDate` đảm bảo **tối đa 1 growth day/ngày/pet**, chỉ pet active nhận.

**Multi-pet**: bond + growth **riêng từng con**; kho food **chung**; chỉ pet active nhận điểm trong ngày → không lách bằng switch. Con thứ 2 nuôi từ trứng.

### Pure functions (đều nhận + trả `DashboardState`, không mutate)
`createInitialCompanionState` · `migrateDashboardState` · `adoptPet(state, species, name, today)` · `switchActivePet` · `grantFoodForHabitCompletion(state, today, completedAfter, total)` · `feedActivePet` · `petActivePet` · `recordGrowthDay` · `grantAllDoneBonus` · `checkComebackGift` (đồng thời cập nhật `lastSeenDate`) · `openGift` · `getPetStage(growthDays)` · `getBondTier(bond)`.

View model: `viewModel.companion: CompanionViewModel` = `{ activePet: CompanionPetView | null, pets, adoptedSpecies, food, foodCap, pendingGift }`; mỗi `CompanionPetView` có sẵn `stage, bondTier, bondTierLabel (VN), bondProgress (0..1 trong tier), daysToNextStage, canPetToday`.

## 4. Voice system — `pet-voice.ts`

```ts
type PetEvent = "morning" | "habitDone" | "allDone" | "feeding" | "petting"
              | "comeback" | "night" | "evolve" | "idle";   // 9 events (thêm "idle" so với plan gốc)
getPetLine(species, tier, event, random?) => string
```

- Bảng `VOICE[species][tierGroup][event] = string[3]`; tierGroup: `low` (T1–2) / `mid` (T3) / `high` (T4–5) → 2 loài × 3 nhóm × 9 event × 3 câu = **162 câu**.
- **Shuffle-bag** per-pool (Map module-level): nghe hết pool mới lặp lại. `resetVoiceBags()` cho test.
- Giọng chó: xưng **em**, gọi **Sếp**, chấm than, chốt "gâu". Giọng mèo: tsundere, xưng **tôi**, gọi **cậu**, "meo~"/"…". Tier càng cao thoại càng thân (mèo T5 mới thừa nhận "tôi đợi thật đấy").
- Test enforce: mọi pool ≥2 câu, ≤80 ký tự; chó không nói "meo", mèo không nói "gâu"; không cụm từ guilt.

## 5. SVG & mức-2 interactions — `pet.tsx`

**`<Pet species name stage bondTier completedCount totalCount celebrate? eating? onPet? />`**

- **Skeleton chung** (viewBox 160×130, chân đứng cố định y=114): thân blob + má hồng + mắt + bóng đất. Scale theo stage: baby 0.74 / kid 0.84 / junior 0.91 / teen 0.96 / adult 1.0 — bóng đất scale theo, mắt baby to hơn (r 5.6 vs 4.8).
- **Lớp loài**: chó = tai cụp butter + đuôi vẫy (`pet-tail-wag`, vẫy tít `-fast` khi được nựng) + mõm + mũi + lưỡi khi delighted + **đốm mắt butter từ junior**; mèo = tai nhọn lót sakura + ria 3 sợi/bên + đuôi chữ S đầu sakura (`pet-tail-sway`) + miệng ω + **sọc trán honey từ teen**.
- **Mood** (`getPetMood(completed, total)` — cùng ngưỡng Nếp cũ): asleep (0) / neutral (≤34%) / happy (≤67%) / delighted (<100%) / party (100%, mắt cười + confetti từ prop `celebrate`).
- **Phụ kiện theo bond** (`BondAccessory`): T3 chó khăn matcha, mèo nơ sakura; T4 chó khăn honey, mèo nơ matcha; T5 cả hai đội **vương miện hoa**.
- **Mức-2 liveliness** (tất cả trong component, không cần wiring thêm):
  - Đồng tử **dõi theo chuột**: `pointermove` + rAF, ghi `transform` trực tiếp vào DOM ref (không re-render), clamp 2.6px. Guard: `matchMedia` thiếu (JSDOM) / reduced-motion / thiết bị không hover.
  - **Chớp mắt** (`pet-blink` — mí cùng màu thân, chu kỳ 4.6s), **tai giật** (`pet-ear-twitch` 7s), **fidget** nghiêng đầu (`pet-fidget` 9s) — pet không bao giờ đứng im.
  - **Time-of-day** (tính sau mount, tránh SSR mismatch): 5–9h vươn vai 1 lần (`pet-stretch`, state `stretching` 950ms); 21h–5h mắt lim dim khi mood neutral/happy.
  - **Squash** khi `completedCount` đổi (ref-compare, tái dùng `.nep-squash`).
  - **Evolve**: prev-stage ref → vòng sáng butter (`pet-evolve-ring`) 1.1s khi stage nhảy.
  - **Petting**: click/tap pet (nút `aria-label="Pet {name}"`) → squash + 3 tim bay (`pet-heart`) + đuôi vẫy tít 1s + gọi `onPet`.
  - **Eating**: prop `eating` → xương (chó)/cá (mèo) bay vòng cung vào miệng (`pet-food-arc` 620ms) + miệng mở + má phồng nhai (`pet-chew` ×2).

**`<PetAdoption initialSpecies? onAdopt onCancel? />`** — 2 trứng lắc lư (`egg-wobble`, đốm butter=cún / sakura=mèo) → chọn → preview baby + input tên (≤20) + "Nhận nuôi 💕". `initialSpecies` để nhận nuôi con thứ 2 từ switcher (kèm nút "Để sau nhé" khi có `onCancel`).

**`<GiftBox label onOpen />`** — hộp quà sakura nhún (`gift-bounce`), absolute góc phải-dưới pet.

## 6. Wiring UI — `dashboard-client.tsx`

- `STORAGE_KEY = "betterme.dashboard.v2"`, `LEGACY_STORAGE_KEY = "betterme.dashboard.v1"` (chỉ đọc).
- **Hydrate**: parse → `migrateDashboardState` → `checkComebackGift(loaded, today)` → bubble mở màn theo giờ (<12h `morning`, ≥21h `night`, còn lại `idle`).
- **Handlers** (đều eager-compute rồi `setState`, so stage trước/sau qua `speakAfter` để bắt thoại `evolve`):
  - `toggleHabit`: tick lên + có pet → `grantFoodForHabitCompletion` → `recordGrowthDay` → nếu 7/7 `grantAllDoneBonus` + celebrate 1300ms; thoại `habitDone`/`allDone`.
  - `feedPet`: `eating` 1300ms + `feedActivePet`; thoại `feeding`.
  - `petThePet`: `petActivePet` (quá cap 3 → vẫn thoại, không cộng).
  - `handleAdopt` (toast chào mừng) · `handleSwitchPet` (thoại `idle` của con mới) · `handleOpenGift` (toast "+3 món ăn 🎁").
- **`CompanionCorner`** (bên phải hero): chưa nuôi → `PetAdoption`; có pet → `SpeechBubble` (key=text để re-animate) + `Pet` + `GiftBox` (khi `pendingGift`) + `BondMeter` (5 tim 💗 + label tier + progress bar sakura) + `FoodTray` (🦴/🐟 ×N + nút "Cho ăn", disabled khi hết food/đang ăn) + `PetSwitcher` (🐶/🐱 đã nuôi, 🥚 chưa nuôi → mở adoption) + dòng "Ngày chăm: N · còn M ngày nữa lớn 🌱".

CSS classes mới trong `globals.css`: `pet-tail-wag`, `pet-tail-wag-fast`, `pet-tail-sway`, `pet-ear-twitch`, `pet-blink`, `pet-fidget`, `pet-stretch`, `pet-food-arc`, `pet-chew`, `pet-heart`, `pet-evolve-ring`, `egg-wobble`, `egg-crack`, `gift-bounce` (+ block reduced-motion).

## 7. Lệch so với plan gốc (deliberate, ghi lại để khỏi ngạc nhiên)

| Plan gốc | As-built | Lý do |
|---|---|---|
| Trứng nứt animation (`egg-crack`) | Chọn trứng → sang thẳng màn đặt tên. **Keyframes `egg-crack` đã có sẵn trong CSS, chưa gắn** | Giữ flow ngắn; muốn thêm chỉ cần toggle class trước khi setPicked |
| Idle wander (pet đi lại trong card) | Fidget nghiêng đầu (`pet-fidget`) | Wander dễ gây khó chịu ở hero; fidget đủ "không đứng im" |
| Drag-to-pet (kéo gãi bụng) | Tap/click to pet | Đơn giản + mobile-friendly; muốn thêm: gắn `pointerdown/move` trên nút Pet |
| Event thoại: 8 | 9 (thêm `idle`) | Cần line cho lúc mở app giữa ngày + switch pet |
| `buildMotivation` (giọng Nếp cũ) | **Vestigial** — vẫn tính trong view model nhưng hero không render nữa | Giữ làm fallback; có thể xóa hoặc dùng cho empty-state |

## 8. Hướng dẫn mở rộng (cheat-sheet cho lần chỉnh sau)

1. **Chỉnh pacing/kinh tế** → sửa constants §3, xong chạy `pnpm vitest run` (tests assert ngưỡng cụ thể — nhớ sửa test theo).
2. **Thêm loài thứ 3** (vd thỏ 🐰): mở union `PetSpecies` + `DEFAULT_PET_NAMES` (dashboard-data.ts) → thêm voice pack `VOICE.rabbit` (pet-voice.ts) → thêm `RabbitLayerBack/Front` + `RabbitMouth` + entry `EGG_SPECIES`/`DEFAULT_NAME_PLACEHOLDER` (pet.tsx) → entry `SWITCHER_PETS` + emoji food trong `FoodTray` (dashboard-client.tsx). Hết — không đụng data layer.
3. **Thêm event thoại** → mở union `PetEvent` + 6 pool (2 loài × 3 tier) + gọi `getPetLine` chỗ cần.
4. **Thêm phụ kiện/tier thưởng** → `BondAccessory` trong pet.tsx.
5. **Đổi thoại** → sửa thẳng mảng trong `VOICE`; test tự bảo vệ voice-crossing + guilt.
6. **Wire Supabase (việc lớn còn lại)**: `companion` nằm trong `DashboardState` nên đi cùng đường sync với habits; cần bảng `companion_pets` + `companion_state` hoặc 1 cột JSONB, và đổi persist layer trong dashboard-client. Chưa làm — dashboard vẫn localStorage-first.

## 9. Gotchas đã gặp (đừng dẫm lại)

- `BETTERME_DEV_AUTH_BYPASS` phải là chuỗi `"true"` — truyền `1` là bypass tắt, dashboard redirect về login.
- JSDOM không có `window.matchMedia` → mọi chỗ dùng phải guard `typeof window.matchMedia === "function"` (đã guard trong eye-follow).
- Playwright import trong script rời: `./node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs` (root import fail với pnpm).
- Tick habit **cuối cùng** của ngày cấp **2 food** (1 thường + 1 bonus) — test nào đếm food phải nhớ.
- Time-of-day phải tính trong `useEffect` sau mount (SSR/client mismatch nếu tính lúc render).
- `key={bubble}` trên SpeechBubble là thứ làm bubble re-animate — đừng bỏ.
