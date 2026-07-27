# U2b — tab Ngày/Tuần + lưới tuần T2→CN

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Màn "Hôm nay" có hai chế độ xem — **Ngày** (đang có) và **Tuần này** (mới): lưới hàng=habit, cột=T2→CN, kèm dòng tổng kết so với chính mình tuần trước.

**Architecture:** Toàn bộ phép tính tuần nằm trong một file thuần TypeScript (`week-grid-data.ts`) — không React, không Date global, nhận `today` làm tham số. Component `WeekGrid` chỉ vẽ. `TabSwitch` (đã có từ U2a) bọc hai panel trong `today-page.tsx`. Không đụng `dashboard-data.ts` trừ việc export lại thứ đã có.

**Tech Stack:** Next.js 15.5 App Router · React 19 · TypeScript 5.9 strict · Tailwind 3.4 (token `var(--*)`) · Vitest + Testing Library (jsdom).

## Global Constraints

- **No-guilt tuyệt đối** (spec §0, test-enforce): dòng tổng kết so sánh **chỉ với chính mình tuần trước**, không bao giờ so với người khác. Tuần kém hơn tuần trước → giọng trung tính/gợi ý, KHÔNG có "thua", "kém hơn", "xếp cuối", "tệ", "thất bại".
- **No-decay KHÔNG áp cho completions**: untick là hành động hợp lệ. Lưới tuần là bề mặt **chỉ đọc** ở U2b — không sửa dữ liệu quá khứ.
- **Màu là vai trò**: `--action` là màu primary/streak/link DUY NHẤT · `--success` là hoàn thành (là FILL, chữ dùng `--success-ink`) · `--alert` chỉ dành cho badge tin mới. Cột hôm nay viền `--action`.
- **Không dùng opacity modifier trên token màu** (`bg-action/10` không hoạt động với `var()`) — thêm token nếu cần.
- **Class Tailwind phải xuất hiện nguyên văn trong source** — không ghép template string.
- `repeatDays` dùng số ISO 1–7 (1 = Thứ Hai). `entries` là nguồn chân lý, `completions` là cache dẫn xuất — **chỉ đọc**, không tự suy diễn lại.
- Vùng chạm tối thiểu 44px. Chữ AA 4.5:1, ranh giới control 3:1.
- 4 cổng phải xanh trước mỗi commit: `npx tsc --noEmit` · `npx eslint . --max-warnings=0` · `npx vitest run` · `npx next build`.
- Ngày hôm nay lấy từ tham số truyền vào, KHÔNG gọi `new Date()` trong hàm thuần.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/components/dashboard/week-grid-data.ts` | **Mới.** Toàn bộ phép tính: 7 ngày của tuần, trạng thái từng ô, tổng kết tuần này vs tuần trước. Thuần, không React. |
| `src/components/dashboard/week-grid-data.test.ts` | **Mới.** Test cho file trên — nơi đặt phần lớn test của U2b. |
| `src/components/dashboard/week-grid.tsx` | **Mới.** Chỉ vẽ lưới. Nhận dữ liệu đã tính, không tự tính gì. |
| `src/components/dashboard/week-grid.test.tsx` | **Mới.** Test render + a11y + no-guilt. |
| `src/components/app/today-page.tsx` | **Sửa.** Thêm `TabSwitch` + hai panel. |
| `src/components/app/state-provider.tsx` | **Sửa.** Thêm `weekHabits` + `records` vào context (lưới cần dữ liệu cả tuần, không chỉ hôm nay). |
| `src/components/ui/tab-switch.tsx` | **Sửa nhỏ.** Thêm `aria-controls` + `id` để đúng chuẩn ARIA tabs. |
| `AGENTS.md`, `HANDOFF.md` | **Sửa.** Tài liệu. |

---

### Task 1: `tab-switch.tsx` — nối tab với panel cho đúng chuẩn ARIA

`TabSwitch` từ U2a có `role="tablist"`, `role="tab"`, `aria-selected`, mũi tên và tabIndex đúng — nhưng **thiếu `aria-controls` và `id`**, nên trình đọc màn hình không biết tab nào điều khiển panel nào. U2b là consumer đầu tiên nên phải sửa cho đủ trước khi dùng.

**Files:**
- Modify: `src/components/ui/tab-switch.tsx`
- Test: `src/components/ui/tab-switch.test.tsx`

**Interfaces:**
- Produces: `TabSwitch<T extends string>({ className?, label, onChange, options, value, idPrefix })` — thêm **một** prop `idPrefix: string`. Tab thứ i có `id={`${idPrefix}-tab-${option.value}`}` và `aria-controls={`${idPrefix}-panel-${option.value}`}`. Consumer đặt `id={`${idPrefix}-panel-${value}`}` + `role="tabpanel"` + `aria-labelledby` lên panel của mình.

- [ ] **Step 1: Viết test đỏ**

Thêm vào cuối `src/components/ui/tab-switch.test.tsx`:

```tsx
describe("TabSwitch — nối tab với panel (ARIA tabs)", () => {
  it("mỗi tab trỏ tới panel nó điều khiển", () => {
    render(
      <TabSwitch
        idPrefix="view"
        label="Chế độ xem"
        onChange={() => {}}
        options={[
          { value: "day", label: "Hôm nay" },
          { value: "week", label: "Tuần này" }
        ]}
        value="day"
      />
    );

    const dayTab = screen.getByRole("tab", { name: "Hôm nay" });
    const weekTab = screen.getByRole("tab", { name: "Tuần này" });

    // Không có aria-controls thì screen reader đọc được tên tab nhưng
    // không biết nó mở ra cái gì — mất hẳn quan hệ tab ↔ panel.
    expect(dayTab.getAttribute("aria-controls")).toBe("view-panel-day");
    expect(weekTab.getAttribute("aria-controls")).toBe("view-panel-week");
    // id để panel trỏ ngược lại bằng aria-labelledby.
    expect(dayTab.getAttribute("id")).toBe("view-tab-day");
  });
});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx vitest run src/components/ui/tab-switch.test.tsx`
Expected: FAIL — `expected null to be "view-panel-day"`.

- [ ] **Step 3: Sửa component**

Thêm `idPrefix` vào destructure và vào type props:

```tsx
  className,
  idPrefix,
  label,
  onChange,
  options,
  value
}: {
  className?: string;
  /** Tiền tố dùng chung cho id của tab và panel — cùng một giá trị ở cả hai nơi. */
  idPrefix: string;
  label: string;
```

Rồi trên `<button>`, thêm hai thuộc tính (đặt ngay trước `className`):

```tsx
            aria-controls={`${idPrefix}-panel-${option.value}`}
            aria-selected={selected}
            className={cn(
```

và ngay trước `key`:

```tsx
            id={`${idPrefix}-tab-${option.value}`}
            key={option.value}
```

- [ ] **Step 4: Sửa mọi call site cũ trong test**

`idPrefix` là prop bắt buộc nên các `render(<TabSwitch ... />)` cũ trong `tab-switch.test.tsx` sẽ đỏ ở `tsc`. Thêm `idPrefix="test"` vào từng cái.

Run: `npx tsc --noEmit` — Expected: 0 lỗi.

- [ ] **Step 5: Xanh + commit**

```bash
npx vitest run src/components/ui/tab-switch.test.tsx
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run && npx next build
git add src/components/ui/tab-switch.tsx src/components/ui/tab-switch.test.tsx
git commit -m "feat(u2b): a tab now says which panel it opens"
```

---

### Task 2: `week-grid-data.ts` — mọi phép tính của tuần, thuần và test được

Đây là task nặng nhất và là nơi mọi quyết định về hành vi được chốt. Component ở Task 3 sẽ không tính gì cả.

**Files:**
- Create: `src/components/dashboard/week-grid-data.ts`
- Test: `src/components/dashboard/week-grid-data.test.ts`

**Interfaces:**
- Consumes: từ `@/lib/date`: `addDaysIso(value: string, days: number): string`, `getWeekStartIso(value: string): string`. Từ `@/components/dashboard/habit-model`: `entryProgress(habit: HabitTracking, entry: LogEntry | undefined): { done: number; target: number; ratio: number }`, `isEntryComplete(habit, entry): boolean`, `isScheduledOn(habit: HabitTracking, date: string): boolean`, `weekdayIso(date: string): number`, type `LogEntry`, type `HabitTracking`. Từ `@/components/dashboard/dashboard-data`: `habitTracking(habit: DashboardHabit): HabitTracking`, type `DashboardDayRecord`, type `DashboardHabit`.
- Produces:
  - `export type WeekCellState = "done" | "partial" | "empty" | "unscheduled" | "future"`
  - `export type WeekCell = { date: string; state: WeekCellState; ratio: number; isToday: boolean }`
  - `export type WeekRow = { habit: DashboardHabit; cells: WeekCell[]; streak: number }`
  - `export type WeekSummary = { done: number; total: number; previousDone: number; delta: number; message: string }`
  - `export type WeekGridData = { days: Array<{ date: string; label: string; dayNumber: string; isToday: boolean }>; rows: WeekRow[]; summary: WeekSummary }`
  - `export const WEEKDAY_LABELS: readonly string[]` — `["T2","T3","T4","T5","T6","T7","CN"]`
  - `export function weekDates(today: string): string[]` — 7 ngày, T2→CN
  - `export function weekCell(habit, record, date, today): WeekCell`
  - `export function weekSummaryMessage(done: number, total: number, delta: number): string`
  - `export function buildWeekGrid(input: { habits: DashboardHabit[]; records: Record<string, DashboardDayRecord>; streaks: Record<string, number>; today: string }): WeekGridData`

- [ ] **Step 1: Viết test đỏ**

Tạo `src/components/dashboard/week-grid-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { DashboardDayRecord, DashboardHabit } from "@/components/dashboard/dashboard-data";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";

import {
  buildWeekGrid,
  weekCell,
  weekDates,
  weekSummaryMessage,
  WEEKDAY_LABELS
} from "./week-grid-data";

// 2026-07-27 là Thứ Hai; 2026-07-26 là Chủ Nhật trước đó.
const MONDAY = "2026-07-27";
const WEDNESDAY = "2026-07-29";
const SUNDAY = "2026-08-02";

function habit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "water",
    key: "water",
    name: "Uống nước",
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Droplets",
    trackingType: "count",
    target: 8,
    unit: "ly",
    ...overrides
  }) as DashboardHabit;
}

function record(date: string, entries: Record<string, { value: number }>): DashboardDayRecord {
  return { date, entries, completions: {} };
}

describe("weekDates", () => {
  it("luôn bắt đầu từ Thứ Hai và dài đúng 7 ngày", () => {
    const days = weekDates(WEDNESDAY);

    expect(days).toHaveLength(7);
    expect(days[0]).toBe(MONDAY);
    expect(days[6]).toBe(SUNDAY);
  });

  it("Chủ Nhật thuộc tuần nó KẾT THÚC, không phải tuần sau", () => {
    // Bẫy kinh điển của getDay(): Chủ Nhật là 0 nên rất dễ bị đẩy sang tuần
    // sau, làm cả lưới lệch một cột đúng vào ngày người ta xem lại tuần.
    expect(weekDates("2026-07-26")[0]).toBe("2026-07-20");
  });

  it("nhãn cột là T2 → CN", () => {
    expect(WEEKDAY_LABELS).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
  });
});

describe("weekCell — trạng thái một ô", () => {
  it("đủ mục tiêu là done", () => {
    const cell = weekCell(habit(), record(MONDAY, { water: { value: 8 } }), MONDAY, SUNDAY);

    expect(cell.state).toBe("done");
    expect(cell.ratio).toBe(1);
  });

  it("có tiến độ nhưng chưa đủ là partial, và giữ đúng tỉ lệ", () => {
    const cell = weekCell(habit(), record(MONDAY, { water: { value: 4 } }), MONDAY, SUNDAY);

    expect(cell.state).toBe("partial");
    expect(cell.ratio).toBe(0.5);
  });

  it("không có gì là empty, không phải partial 0%", () => {
    // Phân biệt rõ "chưa làm" với "làm dở" — hai chuyện khác nhau khi nhìn lại tuần.
    const cell = weekCell(habit(), record(MONDAY, {}), MONDAY, SUNDAY);

    expect(cell.state).toBe("empty");
    expect(cell.ratio).toBe(0);
  });

  it("ngày habit không lặp là unscheduled, KHÔNG phải empty", () => {
    // Đây là điểm nhân văn của lưới: thói quen chỉ tập Thứ Ba thì 6 ngày kia
    // không phải là 6 ngày thất bại.
    const tuesdayOnly = habit({ repeatDays: [2] });
    const cell = weekCell(tuesdayOnly, record(MONDAY, {}), MONDAY, SUNDAY);

    expect(cell.state).toBe("unscheduled");
  });

  it("ngày sau hôm nay là future, kể cả khi habit có lặp hôm đó", () => {
    const cell = weekCell(habit(), undefined, SUNDAY, WEDNESDAY);

    expect(cell.state).toBe("future");
  });

  it("hôm nay được đánh dấu isToday", () => {
    expect(weekCell(habit(), undefined, WEDNESDAY, WEDNESDAY).isToday).toBe(true);
    expect(weekCell(habit(), undefined, MONDAY, WEDNESDAY).isToday).toBe(false);
  });

  it("habit tạm dừng từ giữa tuần: ngày trước khi dừng vẫn giữ nguyên lịch sử", () => {
    // Tạm dừng không được xoá quá khứ (spec §5.1) — Thứ Hai đã xong thì
    // vẫn xong, dù Thứ Tư mới bấm tạm dừng.
    const paused = habit({ pausedAt: WEDNESDAY });

    expect(weekCell(paused, record(MONDAY, { water: { value: 8 } }), MONDAY, SUNDAY).state).toBe(
      "done"
    );
    expect(weekCell(paused, record(WEDNESDAY, {}), WEDNESDAY, SUNDAY).state).toBe("unscheduled");
  });

  it("ô đánh dấu (check) chỉ có done hoặc empty, không có partial", () => {
    const check = habit({ trackingType: "check", target: 1 });

    expect(weekCell(check, record(MONDAY, { water: { value: 1 } }), MONDAY, SUNDAY).state).toBe(
      "done"
    );
    expect(weekCell(check, record(MONDAY, { water: { value: 0 } }), MONDAY, SUNDAY).state).toBe(
      "empty"
    );
  });
});

describe("weekSummaryMessage — so với CHÍNH MÌNH, không bao giờ với người khác", () => {
  it("hơn tuần trước thì nói rõ hơn bao nhiêu", () => {
    expect(weekSummaryMessage(11, 13, 3)).toBe("Tuần này 11/13 lượt — hơn tuần trước 3 lượt");
  });

  it("bằng tuần trước thì gọi là giữ nhịp", () => {
    expect(weekSummaryMessage(9, 13, 0)).toBe("Tuần này 9/13 lượt — giữ đúng nhịp tuần trước");
  });

  it("ít hơn tuần trước: KHÔNG một chữ nào trách móc", () => {
    const message = weekSummaryMessage(6, 13, -4);

    expect(message).toBe("Tuần này 6/13 lượt — tuần trước 10 lượt, còn 7 ngày để tưới thêm");
    // Guard no-guilt: những chữ này không bao giờ được xuất hiện.
    ["thua", "kém", "tệ", "thất bại", "xếp cuối", "chưa bằng ai"].forEach((word) => {
      expect(message.toLowerCase()).not.toContain(word);
    });
  });

  it("tuần đầu tiên không có gì để so thì không so", () => {
    expect(weekSummaryMessage(4, 13, 4)).toBe("Tuần này 4/13 lượt — hơn tuần trước 4 lượt");
    expect(weekSummaryMessage(0, 0, 0)).toBe("Tuần này chưa có lượt nào — bắt đầu từ hôm nay nhé");
  });
});

describe("buildWeekGrid", () => {
  it("dựng đủ 7 cột và một hàng mỗi habit", () => {
    const grid = buildWeekGrid({
      habits: [habit(), habit({ id: "read", key: "read", name: "Đọc sách" })],
      records: { [MONDAY]: record(MONDAY, { water: { value: 8 } }) },
      streaks: { water: 5, read: 0 },
      today: WEDNESDAY
    });

    expect(grid.days).toHaveLength(7);
    expect(grid.days[0].label).toBe("T2");
    expect(grid.rows).toHaveLength(2);
    expect(grid.rows[0].cells).toHaveLength(7);
    expect(grid.rows[0].streak).toBe(5);
  });

  it("tổng kết chỉ đếm lượt ĐÃ XONG, và total chỉ đếm ngày có lịch tới hôm nay", () => {
    // total không được tính ngày tương lai — nếu tính, Thứ Hai nào cũng hiện
    // "1/7" và cảm giác như đang nợ 6 ngày chưa tới.
    const grid = buildWeekGrid({
      habits: [habit({ trackingType: "check", target: 1 })],
      records: {
        [MONDAY]: record(MONDAY, { water: { value: 1 } }),
        "2026-07-28": record("2026-07-28", { water: { value: 1 } })
      },
      streaks: { water: 2 },
      today: WEDNESDAY
    });

    expect(grid.summary.done).toBe(2);
    expect(grid.summary.total).toBe(3); // T2, T3, T4 — chưa tính T5→CN
  });

  it("so sánh với tuần trước dùng ĐÚNG 7 ngày của tuần trước", () => {
    const grid = buildWeekGrid({
      habits: [habit({ trackingType: "check", target: 1 })],
      records: {
        "2026-07-20": record("2026-07-20", { water: { value: 1 } }),
        "2026-07-21": record("2026-07-21", { water: { value: 1 } }),
        [MONDAY]: record(MONDAY, { water: { value: 1 } })
      },
      streaks: { water: 1 },
      today: WEDNESDAY
    });

    expect(grid.summary.previousDone).toBe(2);
    expect(grid.summary.delta).toBe(-1);
  });
});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx vitest run src/components/dashboard/week-grid-data.test.ts`
Expected: FAIL — `Failed to resolve import "./week-grid-data"`.

- [ ] **Step 3: Viết file**

Tạo `src/components/dashboard/week-grid-data.ts`:

```ts
/**
 * Mọi phép tính của lưới tuần (spec §4.2), thuần TypeScript — không React,
 * không đọc đồng hồ. `today` luôn là tham số, nên mọi trường hợp biên
 * (Chủ Nhật, giao tháng, giao năm) test được không cần giả lập thời gian.
 */

import {
  habitTracking,
  type DashboardDayRecord,
  type DashboardHabit
} from "@/components/dashboard/dashboard-data";
import {
  entryProgress,
  isEntryComplete,
  isScheduledOn
} from "@/components/dashboard/habit-model";
import { addDaysIso, getWeekStartIso, parseIsoDate } from "@/lib/date";

export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

/**
 * `unscheduled` khác `empty` một cách có chủ đích: ngày habit không lặp KHÔNG
 * phải là ngày thất bại. Gộp hai cái làm một là cách nhanh nhất để một lưới
 * thành bảng điểm trách móc.
 */
export type WeekCellState = "done" | "partial" | "empty" | "unscheduled" | "future";

export type WeekCell = {
  date: string;
  state: WeekCellState;
  /** 0→1, dùng cho ô ◕ mức đạt. Luôn 0 khi chưa có gì. */
  ratio: number;
  isToday: boolean;
};

export type WeekRow = {
  habit: DashboardHabit;
  cells: WeekCell[];
  streak: number;
};

export type WeekSummary = {
  done: number;
  total: number;
  previousDone: number;
  /** done tuần này − done tuần trước. Dương là hơn. */
  delta: number;
  message: string;
};

export type WeekGridData = {
  days: Array<{ date: string; label: string; dayNumber: string; isToday: boolean }>;
  rows: WeekRow[];
  summary: WeekSummary;
};

/** 7 ngày của tuần chứa `today`, T2 → CN. */
export function weekDates(today: string): string[] {
  const start = getWeekStartIso(today);

  return Array.from({ length: 7 }, (_, index) => addDaysIso(start, index));
}

export function weekCell(
  habit: DashboardHabit,
  record: DashboardDayRecord | undefined,
  date: string,
  today: string
): WeekCell {
  const isToday = date === today;

  // Tương lai được kiểm TRƯỚC lịch lặp: ngày chưa tới thì không có gì để nói
  // về nó, kể cả khi habit có lặp hôm đó.
  if (date > today) return { date, state: "future", ratio: 0, isToday };

  const tracking = habitTracking(habit);

  if (!isScheduledOn(tracking, date)) {
    return { date, state: "unscheduled", ratio: 0, isToday };
  }

  const entry = record?.entries[habit.id];

  if (isEntryComplete(tracking, entry)) {
    return { date, state: "done", ratio: 1, isToday };
  }

  const progress = entryProgress(tracking, entry);

  return {
    date,
    state: progress.done > 0 ? "partial" : "empty",
    ratio: progress.ratio,
    isToday
  };
}

/**
 * Giọng của dòng tổng kết. So sánh chỉ với CHÍNH MÌNH tuần trước (spec §4.2)
 * — và một tuần ít hơn tuần trước vẫn được nói bằng giọng còn-thời-gian, chưa
 * bao giờ bằng giọng thua kém (invariant no-guilt).
 */
export function weekSummaryMessage(done: number, total: number, delta: number): string {
  if (total === 0 && done === 0) {
    return "Tuần này chưa có lượt nào — bắt đầu từ hôm nay nhé";
  }

  if (delta > 0) {
    return `Tuần này ${done}/${total} lượt — hơn tuần trước ${delta} lượt`;
  }

  if (delta === 0) {
    return `Tuần này ${done}/${total} lượt — giữ đúng nhịp tuần trước`;
  }

  return `Tuần này ${done}/${total} lượt — tuần trước ${done - delta} lượt, còn 7 ngày để tưới thêm`;
}

/** Số lượt đã xong của một dải ngày — dùng cho cả tuần này và tuần trước. */
function countDone(
  habits: DashboardHabit[],
  records: Record<string, DashboardDayRecord>,
  dates: string[],
  today: string
): number {
  let done = 0;

  dates.forEach((date) => {
    if (date > today) return;

    habits.forEach((habit) => {
      const tracking = habitTracking(habit);

      if (!isScheduledOn(tracking, date)) return;
      if (isEntryComplete(tracking, records[date]?.entries[habit.id])) done += 1;
    });
  });

  return done;
}

export function buildWeekGrid({
  habits,
  records,
  streaks,
  today
}: {
  habits: DashboardHabit[];
  records: Record<string, DashboardDayRecord>;
  streaks: Record<string, number>;
  today: string;
}): WeekGridData {
  const dates = weekDates(today);
  const days = dates.map((date, index) => ({
    date,
    label: WEEKDAY_LABELS[index],
    dayNumber: String(parseIsoDate(date).getDate()),
    isToday: date === today
  }));

  const rows: WeekRow[] = habits.map((habit) => ({
    habit,
    cells: dates.map((date) => weekCell(habit, records[date], date, today)),
    streak: streaks[habit.id] ?? 0
  }));

  // `total` chỉ đếm ô CÓ LỊCH và ĐÃ TỚI. Đếm cả tương lai thì mỗi Thứ Hai
  // đều mở ra một khoản nợ 6 ngày chưa xảy ra.
  const total = rows.reduce(
    (sum, row) =>
      sum + row.cells.filter((cell) => cell.state !== "unscheduled" && cell.state !== "future").length,
    0
  );
  const done = rows.reduce(
    (sum, row) => sum + row.cells.filter((cell) => cell.state === "done").length,
    0
  );

  const previousWeek = weekDates(addDaysIso(dates[0], -7));
  const previousDone = countDone(habits, records, previousWeek, today);

  return {
    days,
    rows,
    summary: {
      done,
      total,
      previousDone,
      delta: done - previousDone,
      message: weekSummaryMessage(done, total, done - previousDone)
    }
  };
}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `npx vitest run src/components/dashboard/week-grid-data.test.ts`
Expected: PASS, mọi test.

Nếu `migrateHabitFields` trong test báo lỗi type, đọc `src/components/dashboard/habit-migration.ts` để lấy đúng chữ ký — **đừng** cast bừa để tsc im.

- [ ] **Step 5: Bốn cổng + commit**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run && npx next build
git add src/components/dashboard/week-grid-data.ts src/components/dashboard/week-grid-data.test.ts
git commit -m "feat(u2b): a week has seven columns, and an unscheduled day is not a failure"
```

---

### Task 3: `week-grid.tsx` — vẽ lưới

**Files:**
- Create: `src/components/dashboard/week-grid.tsx`
- Test: `src/components/dashboard/week-grid.test.tsx`

**Interfaces:**
- Consumes: `buildWeekGrid`, các type `WeekCell`/`WeekCellState`/`WeekGridData`, `WEEKDAY_LABELS` từ `./week-grid-data`. `HABIT_COLOR_STYLES` từ `./habit-model`. `Card` từ `@/components/ui/card`.
- Produces: `WeekGrid({ data }: { data: WeekGridData })`.

- [ ] **Step 1: Viết test đỏ**

Tạo `src/components/dashboard/week-grid.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DashboardHabit } from "@/components/dashboard/dashboard-data";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";

import { buildWeekGrid } from "./week-grid-data";
import { WeekGrid } from "./week-grid";

const WEDNESDAY = "2026-07-29";

function habit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "water",
    key: "water",
    name: "Uống nước",
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Droplets",
    trackingType: "check",
    target: 1,
    ...overrides
  }) as DashboardHabit;
}

function data(today = WEDNESDAY) {
  return buildWeekGrid({
    habits: [habit()],
    records: {
      "2026-07-27": { date: "2026-07-27", entries: { water: { value: 1 } }, completions: {} }
    },
    streaks: { water: 3 },
    today
  });
}

describe("WeekGrid", () => {
  it("là một bảng thật, có tiêu đề cột và tiêu đề hàng", () => {
    render(<WeekGrid data={data()} />);

    // Bảng thật để screen reader đọc được "Uống nước, T2, đã xong" — một
    // rừng div thì không đọc được quan hệ hàng/cột.
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /T2/ })).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: /Uống nước/ })).toBeTruthy();
  });

  it("mỗi ô nói bằng chữ nó là trạng thái gì", () => {
    render(<WeekGrid data={data()} />);

    expect(screen.getByLabelText("Uống nước, T2: đã xong")).toBeTruthy();
    expect(screen.getByLabelText("Uống nước, T5: chưa tới")).toBeTruthy();
  });

  it("hiện chuỗi riêng của từng habit", () => {
    render(<WeekGrid data={data()} />);

    expect(screen.getByLabelText("Chuỗi Uống nước: 3 ngày")).toBeTruthy();
  });

  it("hiện dòng tổng kết so với chính mình", () => {
    render(<WeekGrid data={data()} />);

    expect(screen.getByText(/Tuần này 1\/3 lượt/)).toBeTruthy();
  });

  it("không có habit nào thì nói một câu tử tế, không phải bảng rỗng", () => {
    const empty = buildWeekGrid({ habits: [], records: {}, streaks: {}, today: WEDNESDAY });

    render(<WeekGrid data={empty} />);

    expect(screen.getByText("Chưa có thói quen nào để xem theo tuần")).toBeTruthy();
  });

  it("dùng token mới, không còn palette v2", () => {
    const { container } = render(<WeekGrid data={data()} />);

    expect(container.innerHTML).not.toMatch(/matcha|sakura|plum|wafer|mauve|butter/);
  });
});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx vitest run src/components/dashboard/week-grid.test.tsx`
Expected: FAIL — `Failed to resolve import "./week-grid"`.

- [ ] **Step 3: Viết component**

Tạo `src/components/dashboard/week-grid.tsx`:

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { WeekCell, WeekCellState, WeekGridData } from "./week-grid-data";

const STATE_LABELS: Record<WeekCellState, string> = {
  done: "đã xong",
  partial: "đang làm dở",
  empty: "chưa làm",
  unscheduled: "ngày nghỉ",
  future: "chưa tới"
};

/**
 * Tuần này (spec §4.2): hàng = habit, cột = T2→CN. Chỉ đọc — sửa dữ liệu quá
 * khứ không thuộc U2b. Mọi phép tính đã xong trong week-grid-data.ts; ở đây
 * chỉ có vẽ.
 *
 * Là `<table>` thật chứ không phải lưới div: quan hệ hàng/cột là NỘI DUNG ở
 * đây, và chỉ bảng thật mới cho trình đọc màn hình đọc được "Uống nước, T2".
 */
export function WeekGrid({ data }: { data: WeekGridData }) {
  if (data.rows.length === 0) {
    return (
      <Card className="p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-ink">Tuần này</h2>
        <p className="mt-2 text-sm text-ink-mid">Chưa có thói quen nào để xem theo tuần</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold text-ink">Tuần này</h2>

      {/* Cuộn ngang nằm TRONG thẻ — mobile không được đẩy cả trang lệch. */}
      <div className="mt-4 -mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[520px] border-separate border-spacing-y-1">
          <caption className="sr-only">
            Thói quen theo ngày trong tuần, từ Thứ Hai đến Chủ Nhật
          </caption>
          <thead>
            <tr>
              <th className="w-[38%] text-left text-xs font-semibold text-ink-soft" scope="col">
                Thói quen
              </th>
              {data.days.map((day) => (
                <th
                  className={cn(
                    "px-1 text-center text-xs font-semibold",
                    day.isToday ? "text-action" : "text-ink-soft"
                  )}
                  key={day.date}
                  scope="col"
                >
                  <span className="block">{day.label}</span>
                  <span className="block text-[11px] font-normal">{day.dayNumber}</span>
                </th>
              ))}
              <th className="px-1 text-center text-xs font-semibold text-ink-soft" scope="col">
                Chuỗi
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.habit.id}>
                <th
                  className="max-w-0 truncate pr-2 text-left text-sm font-semibold text-ink"
                  scope="row"
                >
                  <span aria-hidden="true" className="mr-1">
                    {row.habit.icon}
                  </span>
                  {row.habit.name}
                </th>
                {row.cells.map((cell) => (
                  <td className="px-1 text-center align-middle" key={cell.date}>
                    <WeekDot cell={cell} habitName={row.habit.name} label={dayLabel(data, cell)} />
                  </td>
                ))}
                <td className="px-1 text-center align-middle">
                  <span
                    aria-label={`Chuỗi ${row.habit.name}: ${row.streak} ngày`}
                    className="text-xs font-bold text-action"
                  >
                    🔥 {row.streak}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink-mid">{data.summary.message}</p>
    </Card>
  );
}

function dayLabel(data: WeekGridData, cell: WeekCell): string {
  return data.days.find((day) => day.date === cell.date)?.label ?? cell.date;
}

/**
 * Một ô. Ba lớp thông tin, không chỉ màu: hình dạng (đầy / một phần / rỗng),
 * viền cam cho hôm nay, và một `aria-label` nói thẳng trạng thái — người mù
 * màu và người dùng screen reader đều đọc được mà không cần phân biệt màu.
 */
function WeekDot({
  cell,
  habitName,
  label
}: {
  cell: WeekCell;
  habitName: string;
  label: string;
}) {
  const base =
    "mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold";

  return (
    <span
      aria-label={`${habitName}, ${label}: ${STATE_LABELS[cell.state]}`}
      className={cn(
        base,
        cell.state === "done" && "border-line-success bg-success text-action-ink",
        cell.state === "partial" && "border-line-honey bg-surface-warm text-ink",
        cell.state === "empty" && "border-line-strong bg-surface-card text-ink-soft",
        cell.state === "unscheduled" && "border-line bg-surface-page text-ink-soft",
        cell.state === "future" && "border-line bg-surface-page text-ink-soft",
        cell.isToday && "ring-2 ring-action ring-offset-1 ring-offset-surface-card"
      )}
      role="img"
    >
      {cell.state === "done" ? "✓" : null}
      {cell.state === "partial" ? Math.round(cell.ratio * 100) : null}
      {cell.state === "unscheduled" ? "·" : null}
    </span>
  );
}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `npx vitest run src/components/dashboard/week-grid.test.tsx`
Expected: PASS.

Nếu test "1/3 lượt" đỏ, đọc lại con số thật `buildWeekGrid` trả về (`data().summary`) rồi sửa **test** cho khớp thực tế — nhưng chỉ sau khi tự kiểm bằng tay rằng con số đó đúng theo luật ở Task 2.

- [ ] **Step 5: Bốn cổng + commit**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run && npx next build
git add src/components/dashboard/week-grid.tsx src/components/dashboard/week-grid.test.tsx
git commit -m "feat(u2b): the week reads as a table, not a wall of colour"
```

---

### Task 4: Nối vào màn Hôm nay

**Files:**
- Modify: `src/components/app/state-provider.tsx`
- Modify: `src/components/app/today-page.tsx`
- Test: `src/components/app/state-provider.test.tsx`

**Interfaces:**
- Consumes: `buildWeekGrid` từ `@/components/dashboard/week-grid-data`, `WeekGrid` từ `@/components/dashboard/week-grid`, `TabSwitch` (có `idPrefix` từ Task 1).
- Produces: `AppState` thêm `weekGrid: WeekGridData`. Lưới cần dữ liệu **cả tuần** nên phép tính đặt ở provider (nơi có `state.records`), không ở page.

- [ ] **Step 1: Viết test đỏ**

Thêm vào `src/components/app/state-provider.test.tsx` — trong `Probe`, thêm một chỗ đọc:

```tsx
      <span data-testid="week-total">{app.weekGrid.summary.total}</span>
      <span data-testid="week-days">{app.weekGrid.days.length}</span>
```

và một test mới:

```tsx
  it("dựng sẵn lưới tuần cho màn Hôm nay", () => {
    render(
      <StateProvider userEmail="dev@betterme.local">
        <Probe />
      </StateProvider>
    );

    // 7 cột luôn luôn, kể cả trước khi người dùng ghi gì.
    expect(screen.getByTestId("week-days").textContent).toBe("7");
    expect(Number(screen.getByTestId("week-total").textContent)).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx vitest run src/components/app/state-provider.test.tsx`
Expected: FAIL — `app.weekGrid` là `undefined`.

- [ ] **Step 3: Thêm vào provider**

Import:

```tsx
import { buildWeekGrid, type WeekGridData } from "@/components/dashboard/week-grid-data";
```

Thêm vào type `AppState`, ngay sau `habitStreaks`:

```tsx
  /** Lưới T2→CN đã tính sẵn cho tab "Tuần này" (spec §4.2). */
  weekGrid: WeekGridData;
```

Tính ngay cạnh chỗ `habitStreaks` được tính (tìm `habitStreaks` trong file để đặt đúng chỗ), dùng `useMemo` cùng kiểu với các dẫn xuất khác quanh đó:

```tsx
  const weekGrid = useMemo(
    () => buildWeekGrid({ habits: state.habits, records: state.records, streaks: habitStreaks, today }),
    [habitStreaks, state.habits, state.records, today]
  );
```

Rồi thêm `weekGrid` vào object `value: AppState`.

**Lưu ý:** truyền `state.habits` (mọi habit) chứ không phải `todaysHabits` — lưới tuần phải hiện cả habit chỉ lặp Thứ Ba, nếu chỉ lấy habit của hôm nay thì Thứ Ba đó biến mất khỏi lưới.

- [ ] **Step 4: Nối tab vào page**

Sửa `src/components/app/today-page.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useAppState } from "@/components/app/state-provider";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { HabitDayList } from "@/components/dashboard/habit-day-list";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { WeekGrid } from "@/components/dashboard/week-grid";
import { TabSwitch } from "@/components/ui/tab-switch";

type View = "day" | "week";

const VIEW_OPTIONS: Array<{ value: View; label: string }> = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" }
];

/** 🏠 Hôm nay — the check-in space (spec §4). */
export function TodayPage() {
  const app = useAppState();
  const [view, setView] = useState<View>("day");

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
      <div className="grid grid-cols-1 gap-5">
        <HeroBanner
          bubble={app.bubble}
          celebrate={app.celebrate}
          viewModel={app.viewModel}
          weather={app.weather}
        />

        <TabSwitch
          idPrefix="view"
          label="Chế độ xem"
          onChange={setView}
          options={VIEW_OPTIONS}
          value={view}
        />

        {/* Chỉ panel đang chọn được render — panel ẩn vẫn ở trong DOM sẽ để
            trình đọc màn hình đi lạc vào nội dung không nhìn thấy. */}
        <div
          aria-labelledby={`view-tab-${view}`}
          id={`view-panel-${view}`}
          role="tabpanel"
          tabIndex={0}
        >
          {view === "day" ? (
            <HabitDayList
              habits={app.todaysHabits}
              onAdjustEntry={app.adjustHabitEntry}
              onCreate={() => app.openHabitEditor("")}
              onMove={app.moveHabit}
              onOpenDetail={app.openHabitDetail}
              onOpenEditor={app.openHabitEditor}
              onSetEntry={app.setHabitEntry}
              record={app.todayRecord}
              streaks={app.habitStreaks}
            />
          ) : (
            <WeekGrid data={app.weekGrid} />
          )}
        </div>
      </div>
      <aside aria-label="Thời tiết và nhạc tập trung" className="grid gap-5 xl:sticky xl:top-5">
        <WeatherCard />
        <SpotifyCard />
      </aside>
    </div>
  );
}
```

- [ ] **Step 5: Bốn cổng + commit**

```bash
npx vitest run src/components/app/state-provider.test.tsx
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run && npx next build
git add src/components/app/state-provider.tsx src/components/app/today-page.tsx src/components/app/state-provider.test.tsx
git commit -m "feat(u2b): Hôm nay and Tuần này, one switch between them"
```

---

### Task 5: Tài liệu

**Files:**
- Modify: `AGENTS.md`, `HANDOFF.md`

- [ ] **Step 1: `AGENTS.md`** — thêm vào khối quy ước:

```markdown
- **Lưới tuần: `unscheduled` KHÁC `empty`.** Ngày một habit không lặp không phải ngày thất bại;
  gộp hai trạng thái là cách nhanh nhất biến lưới thành bảng điểm trách móc. `total` của dòng
  tổng kết chỉ đếm ô **có lịch và đã tới** — đếm cả tương lai thì mỗi Thứ Hai mở ra một khoản
  nợ 6 ngày chưa xảy ra.
- **Mọi phép tính tuần nằm trong `week-grid-data.ts`**, thuần và nhận `today` làm tham số;
  `week-grid.tsx` chỉ vẽ. Chủ Nhật là bẫy (`getDay()` trả 0) — `getWeekStartIso` đã xử lý và
  `src/lib/date.test.ts` canh nó.
- **Ô lưới mang ba lớp thông tin, không chỉ màu**: hình dạng, viền cam cho hôm nay, và
  `aria-label` nói thẳng trạng thái. Người mù màu phải đọc được lưới.
```

Cập nhật dòng `Current state: N tests green` theo số thật.

- [ ] **Step 2: `HANDOFF.md`** — thêm dòng U2b vào bảng đã ship, cập nhật nhánh + số test, và ghi rõ phần còn lại: **U2c** (widget thành chip §4.3 + sân sau §4.4).

- [ ] **Step 3: Bốn cổng lần cuối + commit**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run && npx next build
git add AGENTS.md HANDOFF.md
git commit -m "docs: U2b shipped — the week grid and the view switch"
```

- [ ] **Step 4: Hoàn tất nhánh**

**REQUIRED SUB-SKILL:** `superpowers:finishing-a-development-branch`.

---

## Self-Review

**1. Spec coverage (§4.2 "Tuần này").** Lưới hàng=habit cột=T2→CN → Task 2 (`weekDates`, `buildWeekGrid`) + Task 3. Ô ✓ đủ → `state: "done"`. Ô ◕ mức đạt → `state: "partial"` + `ratio`. Ô trống → `"empty"`. Mờ chấm chưa tới → `"future"`. Cột hôm nay viền cam → `cell.isToday` + `ring-action`. 🔥 streak riêng cuối hàng → `WeekRow.streak`. Dòng tổng kết so với chính mình → `weekSummaryMessage`. Mobile cuộn ngang trong thẻ không overflow trang → Task 3 (`overflow-x-auto` trong `Card`, `min-w-[520px]`). Tab Ngày/Tuần → Task 4.

**Gap có chủ đích, phải nói trong PR:**
1. **🍃 nghỉ chủ đích chưa có** — spec §4.2 liệt kê 🍃 trong các trạng thái ô, nhưng 🍃 lá chắn là tính năng của **U3**. U2b có `unscheduled` (ngày không lặp) chứ không có "nghỉ chủ đích đã dùng lá chắn". Khi U3 làm lá chắn, `WeekCellState` cần thêm một nhánh.
2. **Lưới chỉ đọc** — spec không đòi sửa từ lưới, nhưng người dùng rất dễ thử bấm vào ô. U2b không mở đường sửa quá khứ; nếu owner muốn, đó là việc riêng.
3. **7 chấm ở hero vẫn là 7 ngày gần nhất**, chưa phải T2→CN — nợ từ U2a. U2b làm lưới tuần nhưng **không** sửa hero, vì hero là "nhịp 7 ngày gần nhất" còn lưới là "tuần dương lịch"; đổi hero là quyết định riêng của owner. Phải nêu rõ trong PR để không ai tưởng đã đồng bộ.

**2. Placeholder scan.** Không có TBD/TODO. Mọi bước code đều có block code đầy đủ. Task 4 Step 3 nói "tìm `habitStreaks` trong file để đặt đúng chỗ" — đây là chỉ dẫn định vị trong một file 1000+ dòng, không phải placeholder; nội dung cần viết đã cho đủ.

**3. Type consistency.** `WeekCellState` (Task 2) dùng trong `STATE_LABELS` (Task 3) — đủ 5 nhánh, khớp tên. `WeekGridData` trả từ `buildWeekGrid` (Task 2) là prop `data` của `WeekGrid` (Task 3) và là `app.weekGrid` (Task 4) — một type xuyên suốt. `idPrefix` (Task 1) khớp `idPrefix="view"` + `id={`view-panel-${view}`}` (Task 4). `weekCell(habit, record, date, today)` — thứ tự tham số giống nhau ở test và ở call site trong `buildWeekGrid`.

**4. Rủi ro.** `parseIsoDate(date).getDate()` trong `buildWeekGrid` là lần duy nhất file thuần chạm `Date`; nó chỉ để lấy số ngày hiển thị, không tham gia phép tính biên — nhưng nếu `parseIsoDate` không có trong `@/lib/date` thì phải đọc file để lấy đúng tên. `min-w-[520px]` là con số cần kiểm bằng mắt trên mobile thật, không test nào bắt được.
