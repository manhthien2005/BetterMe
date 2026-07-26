# U1b — Habit editor + day view mới — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho người dùng **tạo và tinh chỉnh** habit theo mô hình v3 (4 kiểu theo dõi, lịch lặp, nhiều buổi, màu thẻ, ghi chú động lực, tạm dừng, lưu trữ) và **ghi nhận** chúng trong một day view mới nhóm theo buổi với điều khiển riêng cho từng kiểu.

**Architecture:** U1a đã đặt sẵn model + `setHabitEntry`; U1b chỉ là lớp trình bày trên đó. Một sheet duy nhất (`HabitEditorSheet`) dùng chung cho cả tạo mới lẫn sửa — khác nhau ở giá trị khởi tạo, không phải ở code. Day view (`HabitDayList`) nhóm theo buổi và uỷ quyền mỗi hàng cho một điều khiển theo kiểu; mọi thao tác ghi đều đi qua đúng một cửa: `setHabitEntry` của provider.

**Tech Stack:** React 19 · TypeScript 5.9 strict · Tailwind 3.4 + token U0 · lucide-react · Vitest + Testing Library. Không thêm dependency.

## Global Constraints

- **pnpm only.** 4 gates xanh trước mọi commit: `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`. Không chạy `build` khi `dev` đang chạy.
- **2 invariant:** no-guilt · no-decay. Untick luôn hợp lệ. Copy mới phải qua mắt no-guilt — không "mất chuỗi", không "thua", không so sánh xuống.
- **Token discipline (U0):** màu là vai trò. `--action` là màu hành động chính duy nhất; `--success` là **nền/hình**, chữ xanh dùng `--success-ink`. Không dùng modifier độ mờ trên token (`bg-action/10` không chạy với `var()`) — thêm token mới thay vì thế.
- **A11y:** touch target ≥ 44px · focus ring token hoá · thao tác tick làm được bằng bàn phím · kéo-thả phải có đường bàn phím tương đương · `prefers-reduced-motion` tôn trọng.
- **Model v3 là nguồn chân lý:** chỉ `setHabitEntry` (+ migration) được ghi ô log. Migration phải **idempotent**.
- **Giá trị copy nguyên văn spec §5.1:** checklist 2–7 bước · 6 màu thẻ · lặp mặc định cả 7 thứ · 5 mẫu có sẵn (💧 nước, 📖 đọc, 🏃 thể dục, 🧘 thiền, 😴 ngủ sớm).

---

## Quyết định trong lúc lập plan

1. **Một habit thuộc NHIỀU buổi** — owner chốt hôm nay (2026-07-27), khác cách đọc số ít của spec §5.1 nhưng đúng mockup `habit-editor.html`. `timeOfDay: TimeOfDay` (U1a) đổi thành `timesOfDay: TimeOfDay[]`. Không cần bump khoá lưu trữ: `migrateHabitFields` vốn idempotent, chỉ cần đọc thêm giá trị số ít cũ nếu gặp.
2. **"Cả ngày" loại trừ các buổi khác.** Chọn "Cả ngày" thì bỏ chọn Sáng/Chiều/Tối và ngược lại — một habit vừa "cả ngày" vừa "sáng" là vô nghĩa.
3. **Habit ở 2 buổi hiện ở cả 2 nhóm, nhưng là MỘT ô log.** Tick ở nhóm nào cũng cập nhật cả hai. Hàng lặp lại mang nhãn phụ (ví dụ "cũng ở 🌙 Tối") để không đọc nhầm thành hai việc khác nhau.
4. **Kéo-thả có đường bàn phím tương đương.** Kéo bằng chuột dùng HTML5 drag; bàn phím dùng 2 nút ▲▼ hiện trong chế độ sắp xếp. Không dùng thư viện ngoài.
5. **Màu thẻ vào hệ token, không hardcode hex.** 6 cặp `--habit-<name>-soft` / `--habit-<name>-strong` trong `globals.css`, map sang Tailwind. Nền ô icon dùng bản `soft`, swatch trong picker dùng bản `strong`. Emoji không cần tương phản chữ nên `soft` không phải qua cổng AA.
6. **Editor KHÔNG có ô "nhóm" (category).** Mockup không vẽ nó, và v3 đã có icon + màu + buổi làm nhiệm vụ phân loại. `category` vẫn tồn tại trong dữ liệu (analytics và icon fallback đang dùng): tạo mới thì mặc định `"Discipline"`, sửa thì giữ nguyên giá trị cũ.

### ⚠️ Lỗi thiết kế phát hiện lúc soát plan — phải sửa trong Task 3

`migrateDashboardState` chạy `deriveCompletions` **mỗi lần load**, dùng luật của habit **hiện tại**. Chừng nào mục tiêu chưa sửa được thì vô hại — nhưng U1b làm nó sửa được. Kịch bản hỏng: habit đếm mục tiêu 8, hôm qua ghi `value: 8` (đã xong). Hôm nay owner đổi mục tiêu thành 10. Lần load kế tiếp, ngày hôm qua bị **diễn giải lại** thành chưa xong — chuỗi tụt, lịch đổi màu, và người dùng bị lấy mất một ngày họ đã làm thật.

Điều này vi phạm thẳng spec §5.1: *"lịch sử cũ giữ nguyên… không diễn giải lại giá trị cũ theo mục tiêu mới"*.

**Cách sửa:** migration **giữ nguyên** `completions[key]` đã lưu, chỉ `deriveCompletions` cho ô nào chưa có boolean. Nói cách khác cache mang nghĩa "đã xong theo luật lúc ghi", không phải "đã xong theo luật bây giờ" — đúng tinh thần một ledger. Ô mới vẫn được `setHabitEntry` tính theo luật hiện hành.

## Độ sâu của plan này (nói thẳng)

Task 1–4 có test viết sẵn nguyên văn theo chuẩn writing-plans. **Task 5–7 chỉ có danh sách case bắt buộc, không có code test literal** — đây là chỗ plan này dưới chuẩn skill ("mỗi step phải có code thật"). Lý do: ba component đó lớn, và người thực thi là chính phiên này chứ không phải một kỹ sư mới không có ngữ cảnh. Nếu bàn giao cho người khác, phải viết đủ code test cho 3 task đó trước.

## Ngoài phạm vi U1b

- **U1c**: đẩy field v3 + `value`/`completedAt` qua sync; `supabase/schema.sql`; amendment spec social.
- Hero bầu trời, tab Ngày/Tuần, week grid → **U2**. Day view của U1b sống trong khung `/dashboard` hiện tại.
- 🍃 lá chắn, Giờ vàng insight, Album, Thư tuần → U3/U4. Gợi ý "Giờ vàng của anh" trong form (mockup ②) **chưa có dữ liệu** nên chưa hiện — sẽ bật ở U4.

---

## File Structure

**Tạo mới**

| File | Trách nhiệm |
|---|---|
| `src/components/dashboard/habit-templates.ts` + test | 5 mẫu có sẵn · `suggestIcons(name)` gợi ý emoji theo tên · bảng đơn vị cho kiểu đếm |
| `src/components/dashboard/habit-editor-sheet.tsx` + test | Sheet dùng chung cho tạo mới và sửa: tạo nhanh + tinh chỉnh thêm |
| `src/components/dashboard/habit-entry-control.tsx` + test | 4 điều khiển ghi nhận theo kiểu (check / count / duration / checklist) |
| `src/components/dashboard/habit-day-list.tsx` + test | Day view: nhóm theo buổi, hàng habit, sắp xếp, nhắc nhẹ khi >7 việc |
| `src/components/app/archive-page.tsx` + test | Màn Lưu trữ: khôi phục · xoá vĩnh viễn có confirm |
| `src/app/(app)/nep/archive/page.tsx` | Route `/nep/archive` |

**Sửa**

| File | Việc |
|---|---|
| `habit-model.ts` | `timesOfDay: TimeOfDay[]`; `HABIT_COLOR_STYLES`; `isScheduledOn` không đổi |
| `habit-migration.ts` | `timesOfDay` (đọc cả `timeOfDay` số ít cũ); `normalizeTimesOfDay` |
| `dashboard-data.ts` | `createHabitInState` (đủ field v3) · `updateHabitFieldsInState` · `setHabitPaused` · `setHabitArchived` · `moveHabitInState` · `deleteHabitPermanently` |
| `state-provider.tsx` | Expose 6 handler trên + `editingHabitId` cho sheet |
| `app-shell.tsx` | Mount `HabitEditorSheet` |
| `today-page.tsx` | Dùng `HabitDayList` thay `TodaysHabits` |
| `globals.css`, `tailwind.config.ts` | 12 token màu thẻ |
| `AGENTS.md`, `HANDOFF.md` | Ghi nhận |

**Xoá:** `src/components/dashboard/todays-habits.tsx` (thay bởi `habit-day-list.tsx`).

---

## Task 1: Buổi thành nhiều giá trị + token màu thẻ

**Files:**
- Modify: `src/components/dashboard/habit-model.ts`, `src/components/dashboard/habit-migration.ts`, `src/app/globals.css`, `tailwind.config.ts`
- Modify: `src/components/dashboard/habit-model.test.ts`, `src/components/dashboard/habit-migration.test.ts`, `src/app/design-tokens.test.ts`

**Interfaces:**
- Produces:
  - `HabitV3Fields.timesOfDay: TimeOfDay[]` (thay `timeOfDay`), mặc định `["anytime"]`
  - `function normalizeTimesOfDay(value: unknown, legacy?: unknown): TimeOfDay[]` — bỏ trùng, giữ thứ tự `TIME_OF_DAY_ORDER`, "anytime" loại trừ phần còn lại, rỗng → `["anytime"]`
  - `const HABIT_COLOR_STYLES: Record<HabitColor, { soft: string; strong: string }>` — tên class Tailwind, ví dụ `{ soft: "bg-habit-clay-soft", strong: "bg-habit-clay-strong" }`
  - CSS var `--habit-{clay,moss,sky,dusk,rose,sand}-{soft,strong}`

- [ ] **Step 1: Viết test (đang fail)**

Thêm vào `src/components/dashboard/habit-model.test.ts`:

```ts
describe("normalizeTimesOfDay", () => {
  it("defaults to the whole day", () => {
    expect(normalizeTimesOfDay(undefined)).toEqual(["anytime"]);
    expect(normalizeTimesOfDay([])).toEqual(["anytime"]);
    expect(normalizeTimesOfDay(["nonsense"])).toEqual(["anytime"]);
  });

  it("keeps several parts of the day in reading order", () => {
    expect(normalizeTimesOfDay(["evening", "morning"])).toEqual(["morning", "evening"]);
  });

  it("drops duplicates", () => {
    expect(normalizeTimesOfDay(["morning", "morning"])).toEqual(["morning"]);
  });

  it("'anytime' is exclusive — it wins over any other pick", () => {
    expect(normalizeTimesOfDay(["morning", "anytime"])).toEqual(["anytime"]);
  });

  it("reads the retired singular field when the array is absent", () => {
    expect(normalizeTimesOfDay(undefined, "evening")).toEqual(["evening"]);
    expect(normalizeTimesOfDay(["morning"], "evening")).toEqual(["morning"]);
  });
});

describe("HABIT_COLOR_STYLES", () => {
  it("covers every colour with a soft fill and a strong swatch", () => {
    for (const color of HABIT_COLORS) {
      expect(HABIT_COLOR_STYLES[color].soft).toContain(color);
      expect(HABIT_COLOR_STYLES[color].strong).toContain(color);
    }
  });
});
```

Thêm vào `src/components/dashboard/habit-migration.test.ts`:

```ts
describe("timesOfDay migration", () => {
  it("a v2 habit lands on 'the whole day'", () => {
    expect(migrateHabitFields({ key: "x", category: "Work" }).timesOfDay).toEqual(["anytime"]);
  });

  it("upgrades a U1a habit that still carries the singular field", () => {
    const migrated = migrateHabitFields({
      key: "x",
      category: "Work",
      timeOfDay: "evening"
    } as unknown as { key: string; category: string });

    expect(migrated.timesOfDay).toEqual(["evening"]);
  });

  it("leaves an already-multi habit alone", () => {
    const habit = migrateHabitFields({
      key: "x",
      category: "Work",
      timesOfDay: ["morning", "evening"] as const
    });

    expect(migrateHabitFields(habit).timesOfDay).toEqual(["morning", "evening"]);
  });
});
```

Trong `src/app/design-tokens.test.ts`, thêm vào mảng `required`: 12 tên `habit-clay-soft`, `habit-clay-strong`, … `habit-sand-strong`. Regex `colourTokens` sẵn có (`^(surface|line|ink|action|success|alert|honey|control)`) **không** bắt tiền tố `habit`, nên thêm `|habit` vào regex để chúng cũng bị buộc phải map sang Tailwind.

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run habit-model habit-migration design-tokens
```

Kỳ vọng: FAIL — `normalizeTimesOfDay` và các token chưa tồn tại.

- [ ] **Step 3: Thêm token màu vào `globals.css`**

Chèn vào cuối khối `:root` (ngay trước `--radius-card`):

```css
    /* Habit card colours (spec §5.1) — `soft` tints the icon bubble, `strong`
       is the swatch in the picker. The bubble only ever holds an emoji, so
       `soft` carries no text-contrast duty. */
    --habit-clay-soft: #FDEBD3;
    --habit-clay-strong: #D97706;
    --habit-moss-soft: #DCF5E0;
    --habit-moss-strong: #16A34A;
    --habit-sky-soft: #DBEAFE;
    --habit-sky-strong: #3B82F6;
    --habit-dusk-soft: #EDE9FE;
    --habit-dusk-strong: #7C3AED;
    --habit-rose-soft: #FCE7F3;
    --habit-rose-strong: #DB2777;
    --habit-sand-soft: #EFEAE1;
    --habit-sand-strong: #57534E;
```

Và trong `tailwind.config.ts`, thêm vào `colors`:

```ts
        habit: {
          "clay-soft": "var(--habit-clay-soft)",
          "clay-strong": "var(--habit-clay-strong)",
          "moss-soft": "var(--habit-moss-soft)",
          "moss-strong": "var(--habit-moss-strong)",
          "sky-soft": "var(--habit-sky-soft)",
          "sky-strong": "var(--habit-sky-strong)",
          "dusk-soft": "var(--habit-dusk-soft)",
          "dusk-strong": "var(--habit-dusk-strong)",
          "rose-soft": "var(--habit-rose-soft)",
          "rose-strong": "var(--habit-rose-strong)",
          "sand-soft": "var(--habit-sand-soft)",
          "sand-strong": "var(--habit-sand-strong)"
        },
```

- [ ] **Step 4: `normalizeTimesOfDay` + `HABIT_COLOR_STYLES` trong `habit-model.ts`**

```ts
function isTimeOfDayValue(value: unknown): value is TimeOfDay {
  return TIME_OF_DAY_ORDER.includes(value as TimeOfDay);
}

/**
 * A habit can sit in several parts of the day (owner's call 2026-07-27) — but
 * "Cả ngày" is exclusive: a habit that is both all-day and morning is
 * meaningless. `legacy` reads the retired singular `timeOfDay` field.
 */
export function normalizeTimesOfDay(value: unknown, legacy?: unknown): TimeOfDay[] {
  const raw = Array.isArray(value) ? value : isTimeOfDayValue(legacy) ? [legacy] : [];
  const picked = raw.filter(isTimeOfDayValue);

  if (picked.length === 0 || picked.includes("anytime")) return ["anytime"];

  return TIME_OF_DAY_ORDER.filter((slot) => picked.includes(slot));
}

/** Tailwind class names per card colour — never hardcode the hex at a call site. */
export const HABIT_COLOR_STYLES: Record<HabitColor, { soft: string; strong: string }> = {
  clay: { soft: "bg-habit-clay-soft", strong: "bg-habit-clay-strong" },
  moss: { soft: "bg-habit-moss-soft", strong: "bg-habit-moss-strong" },
  sky: { soft: "bg-habit-sky-soft", strong: "bg-habit-sky-strong" },
  dusk: { soft: "bg-habit-dusk-soft", strong: "bg-habit-dusk-strong" },
  rose: { soft: "bg-habit-rose-soft", strong: "bg-habit-rose-strong" },
  sand: { soft: "bg-habit-sand-soft", strong: "bg-habit-sand-strong" }
};
```

- [ ] **Step 5: Đổi field trong `habit-migration.ts`**

Trong `HabitV3Fields`, thay `timeOfDay: TimeOfDay;` bằng `timesOfDay: TimeOfDay[];`. Trong `defaultHabitV3Fields`, thay `timeOfDay: "anytime"` bằng `timesOfDay: ["anytime"]`. Trong `migrateHabitFields`, thay dòng `timeOfDay:` bằng:

```ts
    timesOfDay: normalizeTimesOfDay(
      (candidate as { timesOfDay?: unknown }).timesOfDay,
      (candidate as { timeOfDay?: unknown }).timeOfDay
    ),
```

Xoá `isTimeOfDay` (không còn dùng) và thêm `normalizeTimesOfDay` vào import từ `habit-model`.

- [ ] **Step 6: Sửa các nơi còn đọc `timeOfDay`**

`pnpm typecheck` sẽ chỉ ra hết. Dự kiến 2 chỗ: assertion `timeOfDay` trong `dashboard-data.test.ts` (đổi thành `expect(habit.timesOfDay).toEqual(["anytime"])`) và trong `state-provider.test.tsx` (payload v3 dựng tay — đổi `timeOfDay: "anytime"` thành `timesOfDay: ["anytime"]`).

- [ ] **Step 7: Chạy test — phải pass, rồi 4 gates + commit**

```bash
pnpm vitest run habit-model habit-migration design-tokens dashboard-data state-provider
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add -A
git commit -m "feat(u1b): a habit can sit in several parts of the day, plus card-colour tokens"
```

---

## Task 2: Mẫu có sẵn + gợi ý emoji

**Files:**
- Create: `src/components/dashboard/habit-templates.ts` + `habit-templates.test.ts`

**Interfaces:**
- Produces:
  - `type HabitTemplate = { key: string; label: string; icon: string; name: string; trackingType: TrackingType; target: number; unit: string | null; timesOfDay: TimeOfDay[] }`
  - `const HABIT_TEMPLATES: readonly HabitTemplate[]` — đúng 5 mẫu của mockup
  - `const COUNT_UNITS: readonly string[]` — đơn vị gợi ý cho kiểu đếm
  - `function suggestIcons(name: string): string[]` — tối đa 3 emoji gợi ý theo tên gõ, luôn trả về ít nhất 1

- [ ] **Step 1: Viết test (đang fail)**

```ts
import { describe, expect, it } from "vitest";

import {
  COUNT_UNITS,
  HABIT_TEMPLATES,
  suggestIcons
} from "@/components/dashboard/habit-templates";

describe("HABIT_TEMPLATES", () => {
  it("offers the five starters from the spec", () => {
    expect(HABIT_TEMPLATES.map((template) => template.label)).toEqual([
      "Uống nước",
      "Đọc sách",
      "Thể dục",
      "Thiền",
      "Ngủ sớm"
    ]);
  });

  it("gives the water template a real daily count", () => {
    const water = HABIT_TEMPLATES[0];

    expect(water.icon).toBe("💧");
    expect(water.trackingType).toBe("count");
    expect(water.target).toBe(8);
    expect(water.unit).toBe("ly");
  });

  it("keeps every template's tracking type coherent with its target", () => {
    for (const template of HABIT_TEMPLATES) {
      if (template.trackingType === "check") expect(template.target).toBe(1);
      else expect(template.target).toBeGreaterThan(1);
      if (template.trackingType !== "count") expect(template.unit).toBeNull();
    }
  });
});

describe("suggestIcons", () => {
  it("reads Vietnamese habit names, with or without diacritics", () => {
    expect(suggestIcons("Uống đủ nước")[0]).toBe("💧");
    expect(suggestIcons("uong du nuoc")[0]).toBe("💧");
    expect(suggestIcons("Đọc sách trước khi ngủ")[0]).toBe("📖");
    expect(suggestIcons("Chạy bộ buổi sáng")[0]).toBe("🏃");
  });

  it("always offers something, never an empty picker", () => {
    expect(suggestIcons("").length).toBeGreaterThan(0);
    expect(suggestIcons("zzzz").length).toBeGreaterThan(0);
  });

  it("offers at most three, without duplicates", () => {
    const icons = suggestIcons("Uống nước");

    expect(icons.length).toBeLessThanOrEqual(3);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe("COUNT_UNITS", () => {
  it("starts with the unit a Vietnamese user reaches for first", () => {
    expect(COUNT_UNITS[0]).toBe("ly");
    expect(COUNT_UNITS).toContain("trang");
    expect(COUNT_UNITS).toContain("lần");
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run habit-templates
```

- [ ] **Step 3: Viết `habit-templates.ts`**

```ts
import type { TimeOfDay, TrackingType } from "@/components/dashboard/habit-model";

export type HabitTemplate = {
  key: string;
  /** Chip label in the editor. */
  label: string;
  icon: string;
  /** What the habit is actually called once created. */
  name: string;
  trackingType: TrackingType;
  target: number;
  unit: string | null;
  timesOfDay: TimeOfDay[];
};

/** One-tap starters (spec §5.1). */
export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  {
    key: "water",
    label: "Uống nước",
    icon: "💧",
    name: "Uống đủ nước",
    trackingType: "count",
    target: 8,
    unit: "ly",
    timesOfDay: ["anytime"]
  },
  {
    key: "read",
    label: "Đọc sách",
    icon: "📖",
    name: "Đọc sách",
    trackingType: "duration",
    target: 20,
    unit: null,
    timesOfDay: ["evening"]
  },
  {
    key: "exercise",
    label: "Thể dục",
    icon: "🏃",
    name: "Vận động",
    trackingType: "duration",
    target: 30,
    unit: null,
    timesOfDay: ["morning"]
  },
  {
    key: "meditate",
    label: "Thiền",
    icon: "🧘",
    name: "Thiền",
    trackingType: "duration",
    target: 10,
    unit: null,
    timesOfDay: ["morning"]
  },
  {
    key: "sleep",
    label: "Ngủ sớm",
    icon: "😴",
    name: "Ngủ sớm",
    trackingType: "check",
    target: 1,
    unit: null,
    timesOfDay: ["evening"]
  }
];

export const COUNT_UNITS: readonly string[] = ["ly", "trang", "lần", "phần", "km", "bài"];

/** Vietnamese keyword → emoji. Keys are diacritic-free so both spellings hit. */
const ICON_HINTS: ReadonlyArray<{ match: string[]; icons: string[] }> = [
  { match: ["nuoc", "uong"], icons: ["💧", "🚰", "🥤"] },
  { match: ["doc", "sach"], icons: ["📖", "📚", "🔖"] },
  { match: ["chay", "the duc", "van dong", "gym", "tap"], icons: ["🏃", "💪", "🏋️"] },
  { match: ["thien", "hit tho"], icons: ["🧘", "🌸", "☁️"] },
  { match: ["ngu", "day"], icons: ["😴", "🛌", "⏰"] },
  { match: ["hoc", "tieng anh"], icons: ["🗣️", "📝", "🎧"] },
  { match: ["code", "du an", "lam viec"], icons: ["💻", "🚀", "🛠️"] },
  { match: ["nhat ky", "viet", "ghi"], icons: ["✍️", "📓", "🖊️"] },
  { match: ["don", "dep"], icons: ["🧹", "✨", "🧺"] },
  { match: ["an", "com"], icons: ["🍚", "🥗", "🍎"] }
];

const FALLBACK_ICONS = ["⭐", "🌱", "🎯"];

/** Strips Vietnamese diacritics so "Uống" and "uong" both match a hint. */
function plain(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

/** Up to three emoji suggested from the name being typed. Never empty. */
export function suggestIcons(name: string): string[] {
  const needle = plain(name);
  const hit = ICON_HINTS.find((hint) => hint.match.some((word) => needle.includes(word)));

  return [...new Set(hit ? hit.icons : FALLBACK_ICONS)].slice(0, 3);
}
```

- [ ] **Step 4: Chạy test — phải pass, rồi 4 gates + commit**

```bash
pnpm vitest run habit-templates
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/habit-templates.ts src/components/dashboard/habit-templates.test.ts
git commit -m "feat(u1b): habit templates and Vietnamese-aware icon suggestions"
```

---

## Task 3: Mutation cho vòng đời habit

**Files:**
- Modify: `src/components/dashboard/dashboard-data.ts`, `src/components/dashboard/dashboard-data.test.ts`

**Interfaces:**
- Produces:
  - `type HabitDraft = { name: string; icon: string; trackingType: TrackingType; target: number; unit: string | null; steps: string[] | null; repeatDays: number[]; timesOfDay: TimeOfDay[]; scheduledAt: string | null; color: HabitColor; motivation: string; category: string }`
  - `function createHabitInState(state, draft: HabitDraft, nowIso?: string): DashboardState`
  - `function updateHabitFieldsInState(state, habitId: string, draft: HabitDraft, nowIso?: string): DashboardState`
  - `function setHabitPaused(state, habitId: string, pausedFrom: string | null): DashboardState`
  - `function setHabitArchived(state, habitId: string, archivedFrom: string | null): DashboardState`
  - `function moveHabitInState(state, habitId: string, direction: -1 | 1): DashboardState`
  - `function deleteHabitPermanently(state, habitId: string, nowIso?: string): DashboardState`
  - `function activeHabits(state, date: string): DashboardHabit[]` — habit nằm trong lịch ngày đó
  - `function archivedHabits(state): DashboardHabit[]`

- [ ] **Step 1: Viết test (đang fail)**

```ts
describe("habit lifecycle", () => {
  const draft = {
    name: "Uống đủ nước",
    icon: "💧",
    trackingType: "count" as const,
    target: 8,
    unit: "ly",
    steps: null,
    repeatDays: [1, 2, 3, 4, 5],
    timesOfDay: ["morning" as const, "evening" as const],
    scheduledAt: "21:00",
    color: "sky" as const,
    motivation: "Da đẹp, đầu óc tỉnh táo",
    category: "Health"
  };

  it("creates a habit carrying every v3 field", () => {
    const next = createHabitInState(createInitialDashboardState("2026-07-27"), draft);
    const created = next.habits[next.habits.length - 1];

    expect(created.name).toBe("Uống đủ nước");
    expect(created.icon).toBe("💧");
    expect(created.trackingType).toBe("count");
    expect(created.target).toBe(8);
    expect(created.unit).toBe("ly");
    expect(created.repeatDays).toEqual([1, 2, 3, 4, 5]);
    expect(created.timesOfDay).toEqual(["morning", "evening"]);
    expect(created.scheduledAt).toBe("21:00");
    expect(created.color).toBe("sky");
    expect(created.motivation).toBe("Da đẹp, đầu óc tỉnh táo");
    expect(created.updatedAt).not.toBeNull();
  });

  it("refuses a blank name and keeps ids unique", () => {
    const state = createInitialDashboardState("2026-07-27");

    expect(createHabitInState(state, { ...draft, name: "   " })).toBe(state);

    const once = createHabitInState(state, draft);
    const twice = createHabitInState(once, draft);
    const ids = twice.habits.map((habit) => habit.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("editing keeps the id, the history, and stamps updatedAt", () => {
    const base = createHabitInState(createInitialDashboardState("2026-07-27"), draft);
    const id = base.habits[base.habits.length - 1].id;
    const logged = setHabitEntry(base, "2026-07-27", id, 8);
    const edited = updateHabitFieldsInState(logged, id, { ...draft, target: 10, name: "Nước" });
    const habit = edited.habits.find((item) => item.id === id)!;

    expect(habit.name).toBe("Nước");
    expect(habit.target).toBe(10);
    // History survives a tracking-target change untouched (spec §5.1).
    expect(edited.records["2026-07-27"].entries[id].value).toBe(8);
  });

  it("pausing takes the habit out of the day and resuming brings it back", () => {
    const base = createHabitInState(createInitialDashboardState("2026-07-27"), {
      ...draft,
      repeatDays: [1, 2, 3, 4, 5, 6, 7]
    });
    const id = base.habits[base.habits.length - 1].id;
    const paused = setHabitPaused(base, id, "2026-07-27");

    expect(activeHabits(paused, "2026-07-27").some((habit) => habit.id === id)).toBe(false);
    expect(activeHabits(setHabitPaused(paused, id, null), "2026-07-27").some((h) => h.id === id)).toBe(
      true
    );
  });

  it("archiving hides the habit from the day but keeps its history", () => {
    const base = createHabitInState(createInitialDashboardState("2026-07-27"), draft);
    const id = base.habits[base.habits.length - 1].id;
    const logged = setHabitEntry(base, "2026-07-27", id, 8);
    const archived = setHabitArchived(logged, id, "2026-07-27");

    expect(activeHabits(archived, "2026-07-27").some((habit) => habit.id === id)).toBe(false);
    expect(archivedHabits(archived).map((habit) => habit.id)).toContain(id);
    expect(archived.records["2026-07-27"].entries[id].value).toBe(8);
  });

  it("permanent delete removes the habit and every trace of its log", () => {
    const base = createHabitInState(createInitialDashboardState("2026-07-27"), draft);
    const id = base.habits[base.habits.length - 1].id;
    const logged = setHabitEntry(base, "2026-07-27", id, 8);
    const gone = deleteHabitPermanently(logged, id, "2026-07-27T09:00:00.000Z");

    expect(gone.habits.some((habit) => habit.id === id)).toBe(false);
    expect(gone.records["2026-07-27"].entries[id]).toBeUndefined();
    // A tombstone must survive so the delete beats a stale remote copy.
    expect(gone.deletedHabits.some((tombstone) => tombstone.key === id)).toBe(true);
  });

  it("moving a habit swaps it with its neighbour and stops at the ends", () => {
    const state = createInitialDashboardState("2026-07-27");
    const first = state.habits[0].id;
    const second = state.habits[1].id;
    const moved = moveHabitInState(state, second, -1);

    expect(moved.habits[0].id).toBe(second);
    expect(moved.habits[1].id).toBe(first);
    expect(moveHabitInState(state, first, -1)).toBe(state);
    expect(moveHabitInState(state, state.habits[state.habits.length - 1].id, 1)).toBe(state);
  });

  it("activeHabits respects the repeat schedule", () => {
    const base = createHabitInState(createInitialDashboardState("2026-07-27"), {
      ...draft,
      repeatDays: [1]
    });
    const id = base.habits[base.habits.length - 1].id;

    // 2026-07-27 is a Monday, 2026-07-28 a Tuesday.
    expect(activeHabits(base, "2026-07-27").some((habit) => habit.id === id)).toBe(true);
    expect(activeHabits(base, "2026-07-28").some((habit) => habit.id === id)).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run dashboard-data
```

- [ ] **Step 3: Viết các mutation**

Đặt ngay sau `addHabitToState` trong `dashboard-data.ts`. `slugify` tách ra từ thân `addHabitToState` hiện có để dùng chung (giữ nguyên thuật toán, không đổi một ký tự — id cũ phải sinh y hệt).

```ts
export type HabitDraft = {
  name: string;
  icon: string;
  trackingType: TrackingType;
  target: number;
  unit: string | null;
  steps: string[] | null;
  repeatDays: number[];
  timesOfDay: TimeOfDay[];
  scheduledAt: string | null;
  color: HabitColor;
  motivation: string;
  category: string;
};

/** Slug id, unique within the state. Same algorithm addHabitToState always used. */
function uniqueHabitId(state: DashboardState, name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const taken = new Set(state.habits.map((habit) => habit.id));
  let id = `custom_${slug || "habit"}`;
  let suffix = 2;

  while (taken.has(id)) {
    id = `custom_${slug || "habit"}_${suffix}`;
    suffix += 1;
  }

  return id;
}

/** The v3 fields a draft carries, shared by create and edit. */
function draftFields(draft: HabitDraft, nowIso: string) {
  return {
    icon: draft.icon,
    trackingType: draft.trackingType,
    target: Math.max(1, Math.trunc(draft.target)),
    unit: draft.trackingType === "count" ? draft.unit : null,
    steps: draft.trackingType === "checklist" ? draft.steps : null,
    repeatDays: normalizeRepeatDaysForDraft(draft.repeatDays),
    timesOfDay: normalizeTimesOfDay(draft.timesOfDay),
    scheduledAt: draft.scheduledAt,
    color: draft.color,
    motivation: draft.motivation.trim().slice(0, 140),
    updatedAt: nowIso
  };
}

function normalizeRepeatDaysForDraft(days: number[]): number[] {
  const kept = [...new Set(days.filter((day) => day >= 1 && day <= 7))].sort((a, b) => a - b);

  return kept.length > 0 ? kept : [1, 2, 3, 4, 5, 6, 7];
}

export function createHabitInState(
  state: DashboardState,
  draft: HabitDraft,
  nowIso = new Date().toISOString()
): DashboardState {
  const name = draft.name.trim().slice(0, 60);

  if (!name) return state;

  const id = uniqueHabitId(state, name);
  const habit: DashboardHabit = migrateHabitFields({
    id,
    key: id,
    name,
    category: draft.category,
    maxScore: 1,
    description: "",
    iconName: habitIcon(id, draft.category),
    ...draftFields(draft, nowIso)
  });

  return { ...state, habits: [...state.habits, habit] };
}

/**
 * Editing never touches the id, the key, or the history — changing how a habit
 * is tracked leaves old days exactly as they were (spec §5.1).
 */
export function updateHabitFieldsInState(
  state: DashboardState,
  habitId: string,
  draft: HabitDraft,
  nowIso = new Date().toISOString()
): DashboardState {
  const name = draft.name.trim().slice(0, 60);

  if (!name || !state.habits.some((habit) => habit.id === habitId)) return state;

  return {
    ...state,
    habits: state.habits.map((habit) =>
      habit.id === habitId
        ? { ...habit, name, category: draft.category, ...draftFields(draft, nowIso) }
        : habit
    )
  };
}

function stampHabit(
  state: DashboardState,
  habitId: string,
  patch: Partial<DashboardHabit>,
  nowIso: string
): DashboardState {
  if (!state.habits.some((habit) => habit.id === habitId)) return state;

  return {
    ...state,
    habits: state.habits.map((habit) =>
      habit.id === habitId ? { ...habit, ...patch, updatedAt: nowIso } : habit
    )
  };
}

/** Pause from a date on; `null` resumes. The streak freezes, never resets. */
export function setHabitPaused(
  state: DashboardState,
  habitId: string,
  pausedFrom: string | null,
  nowIso = new Date().toISOString()
): DashboardState {
  return stampHabit(state, habitId, { pausedAt: pausedFrom }, nowIso);
}

/** Archive from a date on; `null` restores. History is kept in full. */
export function setHabitArchived(
  state: DashboardState,
  habitId: string,
  archivedFrom: string | null,
  nowIso = new Date().toISOString()
): DashboardState {
  return stampHabit(state, habitId, { archivedAt: archivedFrom }, nowIso);
}

/** Reorder by one slot. Out-of-range moves return the same state. */
export function moveHabitInState(
  state: DashboardState,
  habitId: string,
  direction: -1 | 1
): DashboardState {
  const index = state.habits.findIndex((habit) => habit.id === habitId);
  const target = index + direction;

  if (index < 0 || target < 0 || target >= state.habits.length) return state;

  const habits = [...state.habits];

  [habits[index], habits[target]] = [habits[target], habits[index]];

  return { ...state, habits };
}

/** Destructive, and only reachable from the archive screen behind a confirm. */
export function deleteHabitPermanently(
  state: DashboardState,
  habitId: string,
  nowIso = new Date().toISOString()
): DashboardState {
  return removeHabitFromState(state, habitId, nowIso);
}

/** Habits that belong to that day — schedule, pauses and archives applied. */
export function activeHabits(state: DashboardState, date: string): DashboardHabit[] {
  return state.habits.filter((habit) => isScheduledOn(habitTracking(habit), date));
}

export function archivedHabits(state: DashboardState): DashboardHabit[] {
  return state.habits.filter((habit) => habit.archivedAt !== null);
}
```

`addHabitToState` giữ nguyên (chưa xoá — `HabitDetailOverlay` còn dùng); nó chỉ được viết lại để gọi `uniqueHabitId` thay vì lặp lại thuật toán slug.

Thêm import: `normalizeTimesOfDay`, `type HabitColor`, `type TimeOfDay`, `type TrackingType` từ `habit-model`.

- [ ] **Step 4: Sửa lỗi diễn giải lại lịch sử (xem cảnh báo đầu plan)**

Test trước:

```ts
it("changing a target never re-reads yesterday as unfinished", () => {
  const base = createHabitInState(createInitialDashboardState("2026-07-27"), draft);
  const id = base.habits[base.habits.length - 1].id;
  const logged = setHabitEntry(base, "2026-07-26", id, 8);

  expect(logged.records["2026-07-26"].completions[id]).toBe(true);

  const raised = updateHabitFieldsInState(logged, id, { ...draft, target: 10 });
  const reloaded = migrateDashboardState(JSON.parse(JSON.stringify(raised)), "2026-07-27")!;

  // The day was finished under the rule in force when it was recorded.
  expect(reloaded.records["2026-07-26"].completions[id]).toBe(true);
  expect(reloaded.records["2026-07-26"].entries[id].value).toBe(8);
});
```

Rồi trong `habit-migration.ts`, đổi `deriveCompletions` thành giữ boolean đã lưu:

```ts
/**
 * Rebuilds the derived boolean cache. A boolean ALREADY stored for a cell is
 * kept as-is: it records "done under the rule in force when it was written".
 * Re-deriving it would let a later target change silently take away a day the
 * user really did finish (spec §5.1 — history is never re-interpreted).
 * Cells whose habit no longer exists are dropped.
 */
export function deriveCompletions(
  entries: Record<string, LogEntry>,
  trackingByKey: Map<string, HabitTracking>,
  stored?: Record<string, boolean>
): Record<string, boolean> {
  const completions: Record<string, boolean> = {};

  for (const [key, entry] of Object.entries(entries)) {
    const tracking = trackingByKey.get(key);

    if (!tracking) continue;

    completions[key] =
      typeof stored?.[key] === "boolean" ? stored[key] : isEntryComplete(tracking, entry);
  }

  return completions;
}
```

Và trong `migrateDashboardState`, truyền boolean cũ vào:

```ts
    const rawRecord = raw as { completions?: unknown; entries?: unknown };
    const entries = migrateEntries(rawRecord);
    const stored =
      rawRecord.completions !== null &&
      typeof rawRecord.completions === "object" &&
      !Array.isArray(rawRecord.completions)
        ? (rawRecord.completions as Record<string, boolean>)
        : undefined;

    records[date] = { date, entries, completions: deriveCompletions(entries, tracking, stored) };
```

- [ ] **Step 5: Chạy test — phải pass, rồi 4 gates + commit**

```bash
pnpm vitest run dashboard-data habit-migration
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/dashboard-data.ts src/components/dashboard/dashboard-data.test.ts src/components/dashboard/habit-migration.ts src/components/dashboard/habit-migration.test.ts
git commit -m "feat(u1b): create, edit, pause, archive, reorder and delete habits"
```

---

## Task 4: `HabitEntryControl` — 4 điều khiển ghi nhận

**Files:**
- Create: `src/components/dashboard/habit-entry-control.tsx` + `habit-entry-control.test.tsx`

**Interfaces:**
- Consumes: `entryProgress`, `isEntryComplete`, `toggleStep`, `countSteps` (habit-model)
- Produces: `<HabitEntryControl habit={DashboardHabit} entry={LogEntry | undefined} onSet={(value: number) => void} />`

Hành vi theo spec §4.2:
- `check` — ô vuông bo tròn ≥28px, bấm là bật/tắt.
- `count` — nút `+1 {unit}` và vòng %; đạt mục tiêu → tick xanh; bấm lúc đã xong thì **không** cộng tiếp.
- `duration` — như count, đơn vị "phút", bước +5 phút.
- `checklist` — vòng n/m, bấm mở rộng danh sách bước inline, mỗi bước là một checkbox.

- [ ] **Step 1: Viết test (đang fail)**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HabitEntryControl } from "@/components/dashboard/habit-entry-control";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";
import type { DashboardHabit } from "@/components/dashboard/dashboard-data";

function habit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "h",
    key: "h",
    name: "Uống đủ nước",
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Star",
    ...overrides
  }) as DashboardHabit;
}

describe("HabitEntryControl — check", () => {
  it("ticks and unticks", () => {
    const onSet = vi.fn();
    const { rerender } = render(
      <HabitEntryControl entry={undefined} habit={habit()} onSet={onSet} />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Uống đủ nước/ }));
    expect(onSet).toHaveBeenCalledWith(1);

    rerender(<HabitEntryControl entry={{ value: 1 }} habit={habit()} onSet={onSet} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Uống đủ nước/ }));
    expect(onSet).toHaveBeenLastCalledWith(0);
  });

  it("keeps a 44px touch target", () => {
    render(<HabitEntryControl entry={undefined} habit={habit()} onSet={vi.fn()} />);

    expect(screen.getByRole("checkbox").className).toContain("min-h-[44px]");
  });
});

describe("HabitEntryControl — count", () => {
  const counter = habit({ trackingType: "count", target: 8, unit: "ly" });

  it("adds one unit per press and names the unit", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 5 }} habit={counter} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: "+1 ly" }));
    expect(onSet).toHaveBeenCalledWith(6);
  });

  it("shows progress without punishing a partial day", () => {
    render(<HabitEntryControl entry={{ value: 5 }} habit={counter} onSet={vi.fn()} />);

    expect(screen.getByText("5/8")).toBeTruthy();
  });

  it("turns into a done state at the target and stops adding", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 8 }} habit={counter} onSet={onSet} />);

    const done = screen.getByRole("button", { name: /Bỏ đánh dấu/ });

    fireEvent.click(done);
    expect(onSet).toHaveBeenCalledWith(0);
  });
});

describe("HabitEntryControl — duration", () => {
  it("counts in minutes, five at a time", () => {
    const onSet = vi.fn();
    const timed = habit({ trackingType: "duration", target: 20 });

    render(<HabitEntryControl entry={{ value: 10 }} habit={timed} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: "+5 phút" }));
    expect(onSet).toHaveBeenCalledWith(15);
    expect(screen.getByText("10/20")).toBeTruthy();
  });
});

describe("HabitEntryControl — checklist", () => {
  const list = habit({
    trackingType: "checklist",
    target: 3,
    steps: ["Trải chiếu", "Ngồi 5 phút", "Ghi một dòng"]
  });

  it("expands the steps and flips one without touching the others", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 0b001 }} habit={list} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: /Mở các bước/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Ngồi 5 phút" }));

    expect(onSet).toHaveBeenCalledWith(0b011);
  });

  it("reports progress in steps", () => {
    render(<HabitEntryControl entry={{ value: 0b011 }} habit={list} onSet={vi.fn()} />);

    expect(screen.getByText("2/3")).toBeTruthy();
  });
});
```

- [ ] **Step 2–4:** chạy đỏ → viết component → chạy xanh.

Điểm phải bám khi viết:
- Mỗi điều khiển bọc trong một phần tử có `min-h-[44px]`.
- Vòng tiến độ vẽ bằng `conic-gradient` inline (đã có tiền lệ ở `calendar-panel.tsx`), không thêm SVG lib.
- Trạng thái xong dùng `bg-success` cho ô tô đặc và `text-success-ink` cho mọi chữ xanh — `--success` trượt AA khi làm chữ.
- Nút `+1` khi đã xong đổi thành nút "Bỏ đánh dấu" gọi `onSet(0)`.
- Checklist mở rộng bằng state cục bộ, `aria-expanded` trên nút mở.

- [ ] **Step 5: 4 gates + commit**

```bash
git add src/components/dashboard/habit-entry-control.tsx src/components/dashboard/habit-entry-control.test.tsx
git commit -m "feat(u1b): one recording control per tracking type"
```

---

## Task 5: `HabitEditorSheet`

**Files:**
- Create: `src/components/dashboard/habit-editor-sheet.tsx` + `habit-editor-sheet.test.tsx`

**Interfaces:**
- Consumes: `HABIT_TEMPLATES`, `COUNT_UNITS`, `suggestIcons` (Task 2); `HabitDraft` (Task 3); `HABIT_COLORS`, `HABIT_COLOR_STYLES`, `TIME_OF_DAY_ORDER/LABELS/EMOJI`, `CHECKLIST_MIN_STEPS/MAX_STEPS` (Task 1)
- Produces: `<HabitEditorSheet habit={DashboardHabit | null} onClose={() => void} onSubmit={(draft: HabitDraft) => void} onPause / onArchive?: (habitId: string) => void />`
  - `habit === null` → chế độ tạo mới (tiêu đề "Thói quen mới 🌱", có hàng mẫu).
  - `habit !== null` → chế độ sửa (tiêu đề tên habit, không có hàng mẫu, có Tạm dừng / Lưu trữ).

Bố cục bám mockup `habit-editor.html`: hàng mẫu → icon + tên (kèm gợi ý emoji theo tên) → chip kiểu theo dõi → mục tiêu theo kiểu → nút "Trồng thói quen 🌱" + ghost "⚙ Tinh chỉnh thêm ▸" → phần mở rộng (lặp vào thứ / buổi / giờ dự kiến / màu thẻ / vì sao).

- [ ] **Step 1: Viết test (đang fail)** — các case bắt buộc:

```
- mở ở chế độ tạo mới thì thấy hàng mẫu, chế độ sửa thì không
- bấm mẫu "Uống nước" đổ đầy tên/icon/kiểu/mục tiêu/đơn vị
- gõ tên "Chạy bộ" thì gợi ý icon đầu tiên là 🏃
- đổi kiểu sang "Đếm số lượng" thì hiện ô mục tiêu + đơn vị; sang "Đánh dấu" thì ẩn
- checklist chặn dưới 2 bước và trên 7 bước
- "Tinh chỉnh thêm" ẩn mặc định, bấm mới hiện (aria-expanded)
- bỏ chọn hết thứ thì quay về cả 7 thứ, không để habit không bao giờ tới
- chọn "Cả ngày" thì bỏ chọn Sáng/Chiều/Tối
- submit gọi onSubmit đúng một lần với draft đầy đủ field
- tên rỗng thì nút submit disabled
- chế độ sửa hiện Tạm dừng / Lưu trữ; chế độ tạo mới thì không
- Escape gọi onClose; sheet có role="dialog" + aria-modal
```

- [ ] **Step 2–4:** đỏ → viết → xanh.

- [ ] **Step 5: 4 gates + commit**

```bash
git add src/components/dashboard/habit-editor-sheet.tsx src/components/dashboard/habit-editor-sheet.test.tsx
git commit -m "feat(u1b): one sheet for creating and refining a habit"
```

---

## Task 6: `HabitDayList` — day view nhóm theo buổi

**Files:**
- Create: `src/components/dashboard/habit-day-list.tsx` + `habit-day-list.test.tsx`
- Delete: `src/components/dashboard/todays-habits.tsx`

**Interfaces:**
- Consumes: `HabitEntryControl` (Task 4), `activeHabits` (Task 3), `TIME_OF_DAY_ORDER/LABELS/EMOJI`, `HABIT_COLOR_STYLES`
- Produces: `<HabitDayList habits={DashboardHabit[]} record={DashboardDayRecord | undefined} viewModel onSetEntry={(habitId, value) => void} onOpenEditor={(habitId) => void} onCreate={() => void} onMove={(habitId, direction) => void} />`

Bám spec §4.2:
- Nhóm theo `TIME_OF_DAY_ORDER`; nhóm rỗng không hiện. Tiêu đề nhóm: emoji + nhãn.
- Habit thuộc nhiều buổi hiện ở mỗi nhóm nó thuộc về; bản lặp mang nhãn phụ "cũng ở {buổi}" để không đọc nhầm thành hai việc.
- Mỗi hàng: ô icon nền `HABIT_COLOR_STYLES[color].soft` + tên + dòng phụ (tiến độ / bước / 🔥 riêng / giờ dự kiến) + `HabitEntryControl` bên phải.
- Hàng đã xong: `tone="done"` (nền `--surface-success`, viền `--line-success`), tên gạch ngang + nhạt, chip `+1 🌾` dùng `text-success-ink`.
- Chế độ sắp xếp: nút "Sắp xếp" hiện ▲▼ cho từng hàng (đường bàn phím), đồng thời bật `draggable`.
- Hơn 7 việc trong ngày → một dòng nhắc nhẹ giọng quan tâm, **không trách móc**: `"Hôm nay {n} việc — nhiều đấy. Làm được bao nhiêu hay bấy nhiêu nhé."`

- [ ] **Step 1: Viết test (đang fail)** — các case bắt buộc:

```
- nhóm theo buổi, đúng thứ tự Sáng → Chiều → Tối → Cả ngày
- nhóm rỗng không render
- habit ở 2 buổi hiện 2 lần, và tick ở bản nào cũng gọi onSetEntry cùng habitId
- hàng đã xong mang nền done và chip +1 🌾
- ô icon dùng đúng class màu của habit
- >7 việc hiện dòng nhắc, và câu chữ không chứa từ trách móc
- nút Sắp xếp hiện ▲▼, bấm gọi onMove đúng hướng
- bấm tên habit gọi onOpenEditor
```

- [ ] **Step 2–4:** đỏ → viết → xanh. Xoá `todays-habits.tsx` và cập nhật `today-page.tsx`.

- [ ] **Step 5: 4 gates + commit**

```bash
git add -A
git commit -m "feat(u1b): day view grouped by part of the day, one control per type"
```

---

## Task 7: Nối vào provider + shell + màn Lưu trữ

**Files:**
- Modify: `src/components/app/state-provider.tsx`, `src/components/app/app-shell.tsx`, `src/components/app/today-page.tsx`
- Create: `src/components/app/archive-page.tsx` + test, `src/app/(app)/nep/archive/page.tsx`

**Interfaces:**
- Produces trên `AppState`: `editingHabitId: string | null` · `openHabitEditor(habitId: string | null)` · `closeHabitEditor()` · `submitHabitDraft(draft: HabitDraft)` · `pauseHabit(habitId, paused: boolean)` · `archiveHabit(habitId, archived: boolean)` · `moveHabit(habitId, direction)` · `deleteHabitForever(habitId)`

Điểm phải bám:
- `submitHabitDraft` phân nhánh theo `editingHabitId`: null → `createHabitInState`, khác null → `updateHabitFieldsInState`. Cả hai đều `markSyncDirty` kiểu `upsertHabit` (contract server chưa mang field v3 — U1c mở rộng), tạo mới thì kèm `expectCreate: true`.
- `deleteHabitForever` gọi `deleteHabitPermanently` **và** `markSyncDirty({ kind: "deleteHabit", ... })` — tombstone phải đi lên server.
- Màn Lưu trữ ở `/nep/archive`: danh sách habit đã lưu trữ, mỗi hàng có "Khôi phục" (secondary) và "Xoá vĩnh viễn" (destructive, sau một bước confirm trong chính hàng đó — destructive isolation, không phải `window.confirm`).
- Copy màn Lưu trữ phải qua mắt no-guilt.

- [ ] Test bắt buộc: submit ở chế độ tạo tạo đúng 1 habit · submit ở chế độ sửa không sinh habit mới · xoá vĩnh viễn cần 2 lần bấm · khôi phục đưa habit trở lại `/dashboard`.

- [ ] 4 gates + commit:

```bash
git add -A
git commit -m "feat(u1b): wire the editor, the archive screen and habit lifecycle into the shell"
```

---

## Task 8: Tài liệu

- [ ] `AGENTS.md`: cập nhật quy ước model v3 (`timesOfDay` là mảng, "anytime" loại trừ) + dòng Current state.
- [ ] `HANDOFF.md`: mục U1b XONG với 5 quyết định ở đầu plan này; bước kế tiếp U1c (sync + schema); nhắc `/nep/archive` là nơi duy nhất xoá vĩnh viễn được.
- [ ] 4 gates + commit `docs: U1b shipped — habit editor and the new day view`.

---

## Kiểm tra cuối U1b

- [ ] 4 gates — dán output thật.
- [ ] Không test cũ nào bị xoá hay nới lỏng ngoài các đổi tên field `timeOfDay` → `timesOfDay`.
- [ ] Dev server, dev-bypass: tạo được habit đếm (💧 8 ly) → hiện ở nhóm đúng buổi → bấm `+1 ly` 8 lần thì hàng chuyển xanh và Nếp được cho ăn · sửa habit không mất lịch sử · tạm dừng thì habit rời ngày mà chuỗi không tụt · lưu trữ rồi khôi phục được · xoá vĩnh viễn cần 2 bước.
- [ ] Bàn phím: tạo — sửa — tick — sắp xếp (▲▼) làm được hết không cần chuột.
- [ ] Không cuộn ngang ở 375px / 768px / 1440px.
- [ ] Mọi copy mới qua mắt no-guilt.
