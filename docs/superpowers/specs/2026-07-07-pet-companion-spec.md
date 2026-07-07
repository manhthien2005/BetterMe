# Pet Companion — Implementation Spec (mức 2, max sinh động)

> Triển khai từ research `2026-07-07-pet-companion-research.md`. Chó + mèo nuôi từ bé, food từ habit, bond 5 tier, voice sync theo loài, mức-2 interactions (eye-follow, time-of-day, petting, wander). Nếp ở lại làm người dẫn chuyện ở login.

## 0. Nguyên tắc bất biến

1. **Không guilt**: không câu thoại/cơ chế nào trách user. Vắng mặt → pet tặng quà để dành.
2. **Không decay**: growth/bond không bao giờ giảm.
3. **Không asset ngoài**: SVG-in-code như Nếp. Zero dependency mới.
4. **prefers-reduced-motion**: mọi animation mới đều bị tắt/tĩnh hóa trong media query.
5. **Backward compatible**: dữ liệu v1 của user migrate sạch sang v2, không mất records.
6. **Copy tiếng Việt** cho thoại pet (giữ UI labels tiếng Anh như hiện tại).

## 1. Data model — `betterme.dashboard.v2`

```ts
// dashboard-data.ts additions
export type PetSpecies = "dog" | "cat";
export type CompanionPetState = {
  species: PetSpecies;
  name: string;            // user đặt tên lúc nhận nuôi
  adoptedOn: string;       // ISO date
  growthDays: number;      // số ngày có ≥1 habit khi pet active
  bond: number;            // 0..840, không giảm
  lastGrowthDate: string | null;  // chống cộng 2 lần/ngày
  petsToday: number;       // số lần vuốt ve hôm nay (cap 3)
  petsTodayDate: string | null;
};
export type CompanionState = {
  pets: Partial<Record<PetSpecies, CompanionPetState>>; // nuôi con nào mới có entry
  activeSpecies: PetSpecies | null;  // null = chưa nhận nuôi → hatch picker
  food: number;              // kho chung, cap 21
  lastFoodDate: string | null;   // ngày cuối cùng grant food (per-habit dedupe theo ngày)
  fedFoodDates: Record<string, number>; // date -> số food đã grant trong ngày (cap = habits/day + 1)
  lastSeenDate: string | null;   // để tính comeback gift
  pendingGift: boolean;          // quà chờ mở
};
export type DashboardState = { ...cũ..., companion: CompanionState };
```

- `STORAGE_KEY = "betterme.dashboard.v2"`. Hydrate: đọc v2 → nếu không có, đọc v1, `migrateV1ToV2()` (thêm `companion` default, giữ nguyên phần còn lại), ghi v2, **không xóa v1** (an toàn rollback).
- `createInitialCompanionState()`: `{ pets: {}, activeSpecies: null, food: 0, ... }`.

### Pure functions (đều return state mới, test được)

| Hàm | Logic |
|---|---|
| `adoptPet(state, species, name, today)` | tạo pet, set active. Tên trim, ≤20 ký tự, fallback "Mochi"/"Xoài". |
| `switchActivePet(state, species)` | chỉ khi pet đó đã adopt. |
| `grantFoodForHabitCompletion(state, today, completedCountAfter, totalCount)` | +1 food (cap 21) mỗi lần *tick lên* trong ngày, dedupe qua `fedFoodDates[today] < totalCount`; nếu `completedCountAfter === totalCount` +1 food bonus. Un-tick không trừ (gentle) nhưng cũng không grant lại (đã đếm trong fedFoodDates). |
| `feedActivePet(state, today)` | cần food ≥1 và có active pet: food −1, bond +2, `recordGrowthDay`. |
| `petActivePet(state, today)` | vuốt ve: nếu `petsToday < 3` (reset theo ngày) → bond +1. |
| `recordGrowthDay(state, today)` | nếu `lastGrowthDate !== today` → growthDays +1 (gọi từ feed + từ toggle habit đầu tiên trong ngày). |
| `grantAllDoneBonus(state, today)` | ngày 7/7: bond +5 (1 lần/ngày — dùng flag trong fedFoodDates sentinel hoặc so completedCount). |
| `checkComebackGift(state, today)` | `lastSeenDate` cách ≥2 ngày → `pendingGift = true`. Cập nhật lastSeenDate = today. |
| `openGift(state)` | pendingGift → false, food +3 (cap 21), bond +3. |

### Derived (view-model)

```ts
export type PetStage = "baby" | "kid" | "junior" | "teen" | "adult";
// growthDays: 0-4 baby, 5-14 kid, 15-29 junior, 30-49 teen, 50+ adult
export type BondTier = 1 | 2 | 3 | 4 | 5;
// bond: 0-59 T1 Lạ lẫm, 60-179 T2 Quen mặt, 180-419 T3 Bạn thân, 420-839 T4 Tri kỷ, 840+ T5 Gia đình
export type PetMood = "asleep" | "neutral" | "happy" | "delighted" | "party";
// mood map từ completion hôm nay — GIỮ NGUYÊN logic getNepStage (0 → asleep, ≤34% neutral, ≤67% happy, <100% delighted, 100% party)
```

`buildDashboardViewModel` thêm `companion: { pet: {...} | null, stage, bondTier, bondProgress (0..1 trong tier), nextStageIn, food, pendingGift, line }`.

## 2. Voice packs — `src/components/dashboard/pet-voice.ts`

```ts
type PetEvent = "morning" | "habitDone" | "allDone" | "feeding" | "petting" | "comeback" | "night" | "evolve";
getPetLine(species, tier, event, rng?): string
```

- Bảng `VOICE[species][tierGroup][event] = string[]` với tierGroup = `low` (T1-2) | `mid` (T3) | `high` (T4-5) → 2 loài × 3 nhóm × 8 event × 2-3 câu ≈ **120 câu**.
- Chống lặp: module-level shuffle-bag per (species,tierGroup,event) — rotate hết mảng mới lặp.
- Giọng chó (xưng **em**, gọi **Sếp**, nhiệt tình, "gâu!"): low "Sếp là ai nhỉ? Mà thôi, em quý Sếp rồi đó, gâu!" → high "Cả thế giới của em là Sếp với mấy cái habit này, gâu!!".
- Giọng mèo (xưng **tôi**, gọi **cậu**, tsundere, "meo~"/"…"): low "Đừng hiểu lầm. Tôi ở đây vì cái nệm thôi. Meo." → high "…Hôm nay cậu về sớm nhé. Tôi… đợi đó. Meo~".
- Interpolation `{name}` (tên user "Thiên") khi cần; giữ mỗi câu ≤ ~70 ký tự.

## 3. Pet SVG — `src/components/dashboard/pet.tsx`

### Kiến trúc
- `<Pet species stage mood bondTier celebrate eating petting onPet />` — skeleton chung tái cấu trúc từ Nếp: shadow, body blob, blush, mắt, miệng. Per-species layer: **chó** = tai cụp hình giọt + đuôi vẫy + mõm oval + lưỡi khi delighted; **mèo** = tai tam giác + ria 3 sợi mỗi bên + đuôi cong chữ S + mắt hạnh khi nheo.
- Stage scale + chi tiết: baby (0.72, body tròn hơn, mắt to hơn tỉ lệ), kid 0.82, junior 0.9, teen 0.96, adult 1.0 + phụ kiện bond (T3: nơ cổ sakura; T4: khăn matcha; T5: vương miện hoa butter). Scale qua `transform` group giữa, viewBox cố định 160×130.
- Mood (mắt/miệng/tư thế) giữ đúng 5 mức như Nếp. `aria-label` = "{tên pet} the {dog|cat}, {mô tả stage + mood}".

### Mức-2 interactions (điểm "max sinh động")
1. **Eye-follow cursor**: `useEffect` gắn `pointermove` trên window (throttle rAF), tính vector từ tâm mắt → cursor, dịch pupil `≤2.5px` qua `ref.setAttribute("transform")` trực tiếp (không setState — không re-render). Tắt khi reduced-motion hoặc `pointer: coarse` không có hover (mobile: pupil đứng giữa).
2. **Time-of-day**: 5–9h vươn vai (một lần khi mount, class `pet-stretch`), 21h+ mood bị "buồn ngủ hóa" (mắt lim dim overlay nếu mood ≤ happy) + thoại `night`.
3. **Petting**: click/tap vào pet → `nep-squash` tái dùng + tim `pet-heart` bay lên + đuôi vẫy nhanh (chó `pet-tail-wag-fast`) / tai giật (mèo `pet-ear-twitch`) + gọi `onPet` (bond +1 nếu chưa cap). Cap 3/ngày → sau đó vẫn có animation, chỉ không cộng điểm (thoại "hết quota nựng hôm nay rồi~" — không, đơn giản: vẫn thoại petting, không cộng).
4. **Idle wander/fidget**: mỗi 6–9s một fidget ngẫu nhiên (nghiêng đầu / vẫy đuôi / chớp mắt kép) qua CSS animation với `animation-delay` random hóa lúc mount — pet không bao giờ đứng im như tượng.
5. **Eating**: prop `eating` → món ăn (SVG cá cho mèo/xương cho chó) bay vòng cung parabola vào miệng, miệng mở, má phồng 2 nhịp, tim +2 nảy.
6. **Evolve**: khi stage đổi (so sánh prev ref) → `pet-evolve-glow` (vòng sáng butter phóng to + pet nhún 2 nhịp) + confetti tái dùng + thoại `evolve`.
7. **Gift box**: `pendingGift` → hộp quà sakura nhún cạnh pet, click mở → nắp bật, +3 food bay vào khay, thoại `comeback`.

### Hatch picker — `PetAdoption`
- Khi `activeSpecies === null`: hero hiển thị 2 quả trứng (đốm matcha / đốm sakura) lắc lư; click → nứt → lộ baby dog/cat; input đặt tên + nút "Nhận nuôi 💕".

## 4. Tích hợp UI (dashboard-client.tsx)

- **Hero**: thay `<Nep/>` bằng khối companion: Pet + bubble thoại (line từ voice pack theo event gần nhất, fallback theo mood/time) + **bond meter** (5 tim, tim hiện tại là progress ring nhỏ + label tier VN) + **growth meter** ("Ngày chăm: 23 · còn 7 ngày nữa lớn") + **khay food**: badge 🍖×N với nút "Cho ăn" (disabled khi food=0, animation khi bấm) + **switcher** 2 avatar tròn chó/mèo (con chưa adopt = trứng mờ, click mở adoption; con không active có tooltip "đang ở nhà nghỉ ngơi").
- **toggleHabit**: sau toggle-lên → `grantFoodForHabitCompletion` + `recordGrowthDay` + toast giọng pet (`habitDone`); ngày full → `grantAllDoneBonus` + celebrate (giữ cơ chế cũ).
- **Mount**: `checkComebackGift`. Toast dùng giọng pet thay copy generic.
- **Nếp**: gỡ khỏi hero, import vào `login-form`/login page làm mascot chào (đứng cạnh heading, stage "waking") — brand giữ nguyên. `nep.tsx` không xóa.
- **motivation** cũ trong data (`buildMotivation`) giữ cho fallback khi chưa adopt pet.

## 5. CSS mới (globals.css)

`pet-tail-wag`, `pet-tail-wag-fast`, `pet-ear-twitch`, `pet-heart` (bay + fade), `pet-food-arc` (cubic-bezier parabola), `pet-chew` (má), `pet-evolve-glow`, `pet-stretch`, `pet-fidget-tilt`, `egg-wobble`, `egg-crack`, `gift-bounce`, `gift-open`. Tất cả thêm vào block `prefers-reduced-motion` (animation: none; heart/confetti display:none; pupil transform none).

## 6. Files

| File | Hành động |
|---|---|
| `src/components/dashboard/dashboard-data.ts` | + CompanionState, migration, 9 pure functions, view-model companion |
| `src/components/dashboard/pet-voice.ts` | MỚI — voice packs + shuffle-bag |
| `src/components/dashboard/pet.tsx` | MỚI — Pet, PetAdoption, GiftBox, FoodTray helpers |
| `src/components/dashboard/dashboard-client.tsx` | hero companion block, wiring food/bond/switch, toast voice |
| `src/components/dashboard/nep.tsx` | giữ nguyên (dùng ở login) |
| `src/components/auth/login-form.tsx` | + Nếp cameo |
| `src/app/globals.css` | + ~13 animation mới + reduced-motion |
| `dashboard-data.test.ts` | + tests: migration v1→v2, food grant dedupe/cap, growth 1/ngày, bond caps, stage/tier thresholds, comeback gift, switch không mất bond |
| `pet-voice.test.ts` | MỚI — coverage mọi (species,tierGroup,event) non-empty, shuffle-bag không lặp liền kề |
| `page.test.tsx` | update: adoption flow hiện khi chưa có pet; sau adopt (seed localStorage v2) pet hiện, khay food, bond meter |

## 7. Verification

1. `pnpm typecheck` / `lint` / `test` / `build` xanh.
2. Dev server + screenshots: (a) hatch picker, (b) dog baby + feed animation, (c) cat + thoại tsundere, (d) gift flow (giả lập lastSeenDate cũ), (e) mobile.
3. Adversarial review inline (correctness + a11y + design-qa) — workflow agents đang bị 402 nên review tự thân theo checklist: migration không mất data, không NaN khi food/bond undefined, JSDOM không hỗ trợ pointermove→rAF (guard test env), timezone ngày (dùng todayIso local sẵn có), switch-abuse math.
4. Quét staged set không file nhạy cảm → commit → push.
