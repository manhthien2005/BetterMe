# U1a — Habit model v3 + migration v2→v3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa mô hình habit v3 (4 kiểu theo dõi, lịch lặp, buổi, tạm dừng/lưu trữ) và ô log giàu thông tin `{ value, completedAt? }` vào `betterme.dashboard.v3`, cùng migration tự động từ v2 — **giao diện và hành vi người dùng không đổi một chút nào**.

**Architecture:** `entries` (ô log giàu) là **nguồn chân lý**; `completions: Record<string, boolean>` ở lại nguyên vị trí như một **cache dẫn xuất** — đúng khuôn mẫu `CompanionState.food` vs ledger đã có trong repo. Nhờ vậy mọi thứ đọc `completions` (scoreDate, chuỗi, analytics, lịch, `merge.ts`, `importer.ts`) chạy y nguyên không sửa, và toàn bộ 304 test hiện có trở thành lưới an toàn cho bước migration. Logic thuần nằm trong 2 module mới, nhỏ và tách bạch; `dashboard-data.ts` chỉ nhận thêm field và một mutation mới.

**Tech Stack:** TypeScript 5.9 strict · Vitest (jsdom) · không thêm dependency nào.

## Global Constraints

- **pnpm only.** 4 gates xanh trước mọi commit: `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`.
- **KHÔNG chạy `pnpm build` khi `pnpm dev` đang chạy** (chung `.next/`).
- **2 invariant thiêng liêng:** no-guilt (không câu chữ trách móc/so sánh xuống) · no-decay (growth/bond chỉ tăng). Untick vẫn là hành động hợp lệ và phải sync được.
- **U1a không đổi hành vi người dùng.** Không sửa component nào. Không sửa `src/lib/sync/**`, `src/lib/server/**`, `supabase/schema.sql`.
- **Domain purity** (`AGENTS.md`): module logic không import React/Next/browser/persistence.
- **Kinh tế 🌾 giữ nguyên tham số**: earn rate, `FOOD_CAP = 21`, luật prune/derive không đổi. Chỉ định nghĩa "hoàn thành" thay cho "tick" (spec §5.2).
- **`bestStreakFloor = 26` và seed fiction**: tôn trọng tuyệt đối; record `date <= seedCutoverDate` không bao giờ rời máy.
- **Khoá lưu trữ:** mới `betterme.dashboard.v3`; `betterme.dashboard.v2` chuyển **chỉ-đọc** (đọc để migrate, không bao giờ ghi lại); `betterme.dashboard.v1` vẫn là fallback cuối như hiện tại.
- **Giá trị enum copy nguyên văn spec §5.1:** `trackingType` ∈ `check | count | duration | checklist`; buổi ∈ Sáng / Chiều / Tối / Cả ngày; checklist 2–7 bước; lặp mặc định cả 7 thứ.
- Test colocated `*.test.{ts,tsx}`; file kebab-case, type/component PascalCase, field camelCase.

---

## Quyết định trong lúc lập plan (owner lật lại được bằng 1 câu)

1. **`entries` là nguồn chân lý, `completions` là cache dẫn xuất — không xoá.** Spec §9.3 viết "Ô log: từ boolean → `{ value, completedAt? }`", đọc thẳng là thay thế. Em giữ thêm boolean dẫn xuất vì: (a) `merge.ts`/`importer.ts`/server contract đang nói chuyện bằng `done: boolean` và U1c mới mở rộng, (b) mọi hàm tính điểm/chuỗi/analytics/lịch đọc `completions` — giữ lại thì 304 test hiện có thành lưới an toàn thật cho migration thay vì phải viết lại cùng lúc với việc đổi shape, (c) repo đã có sẵn đúng khuôn mẫu này (`CompanionState.food` là cache của ledger). Luật đi kèm: **chỉ `setHabitEntry` được ghi cả hai**, và có test invariant chặn drift.
2. **`completedAt` lưu `"HH:mm"` giờ địa phương**, không phải ISO timestamp đầy đủ. Giờ vàng (§6.3) chỉ cần giờ trong ngày; ngày đã nằm ở khoá record. Tránh luôn bẫy múi giờ khi U1c đẩy field này lên server.
3. **`repeatDays` dùng số ISO 1–7 (1 = Thứ Hai)**, khớp cột T2→CN của lịch và `mondayOf()` sẵn có.

## Ngoài phạm vi U1a (ghi nhận, có plan riêng)

- **U1b**: emoji picker, form tạo nhanh + tinh chỉnh sâu, day view nhóm theo buổi, điều khiển theo từng kiểu, kéo-thả sắp xếp, màn Lưu trữ + xoá vĩnh viễn.
- **U1c**: đẩy `value`/`completedAt` và các field định nghĩa v3 qua sync — cần cột mới trong `supabase/schema.sql`, soát `merge.ts`/`importer.ts` từng field, và ghi "Amendment 2026-07-26" vào cuối `2026-07-08-social-garden-spec.md`.
- 🍃 lá chắn + luật chuỗi chung mới (§5.2 mục 2–4) → **U3** theo lộ trình spec.
- Giờ vàng insight, Thư tuần, Album → U3/U4.

---

## File Structure

**Tạo mới**

| File | Trách nhiệm |
|---|---|
| `src/components/dashboard/habit-model.ts` | Type v3 + hằng số (kiểu theo dõi, buổi, màu, template) + vị từ thuần: hoàn thành, tiến độ, có nằm trong lịch ngày đó không |
| `src/components/dashboard/habit-model.test.ts` | Test cho toàn bộ vị từ, đủ 4 kiểu + biên |
| `src/components/dashboard/habit-migration.ts` | v2 → v3: định nghĩa habit, ô log, và cả `records` |
| `src/components/dashboard/habit-migration.test.ts` | Test migration, gồm cả dữ liệu rác và dữ liệu v3 sẵn có (idempotent) |

**Sửa**

| File | Việc |
|---|---|
| `src/components/dashboard/dashboard-data.ts` | `DashboardHabit` nhận field v3; `DashboardDayRecord` nhận `entries`; `createInitialDashboardState` sinh v3; `migrateDashboardState` gọi migration mới; thêm `setHabitEntry`; `addHabitToState` sinh habit v3; `calculateHabitStreak` tôn trọng lịch lặp |
| `src/components/dashboard/dashboard-data.test.ts` | Thêm test invariant `completions` ⇄ `entries` và test streak theo lịch |
| `src/components/app/state-provider.tsx` | Khoá lưu trữ v3 + v2 chỉ-đọc; `toggleHabit` gọi `setHabitEntry` |
| `AGENTS.md`, `HANDOFF.md` | Ghi mô hình v3 + luật cache dẫn xuất |

---

## Task 1: `habit-model.ts` — type v3 và vị từ thuần

**Files:**
- Create: `src/components/dashboard/habit-model.ts`
- Test: `src/components/dashboard/habit-model.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type TrackingType = "check" | "count" | "duration" | "checklist"`
  - `type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime"`
  - `type HabitColor = "clay" | "moss" | "sky" | "dusk" | "sand" | "rose"`
  - `type LogEntry = { value: number; completedAt?: string }`
  - `type HabitTracking = { trackingType: TrackingType; target: number; steps?: string[]; repeatDays: number[]; pausedAt?: string | null; archivedAt?: string | null }`
  - `const TRACKING_TYPES: readonly TrackingType[]`
  - `const TIME_OF_DAY_ORDER: readonly TimeOfDay[]`
  - `const TIME_OF_DAY_LABELS: Record<TimeOfDay, string>`
  - `const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string | null>`
  - `const HABIT_COLORS: readonly HabitColor[]`
  - `const ALL_WEEKDAYS: readonly number[]` (`[1,2,3,4,5,6,7]`)
  - `const CHECKLIST_MIN_STEPS = 2`, `const CHECKLIST_MAX_STEPS = 7`
  - `function weekdayIso(date: string): number` — 1 = Thứ Hai … 7 = Chủ Nhật
  - `function countSteps(value: number): number` — số bit 1 trong bitmask
  - `function toggleStep(value: number, index: number): number`
  - `function isEntryComplete(habit: HabitTracking, entry: LogEntry | undefined): boolean`
  - `function entryProgress(habit: HabitTracking, entry: LogEntry | undefined): { done: number; target: number; ratio: number }`
  - `function isScheduledOn(habit: HabitTracking, date: string): boolean`

- [ ] **Step 1: Viết test (đang fail)**

Tạo `src/components/dashboard/habit-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  ALL_WEEKDAYS,
  CHECKLIST_MAX_STEPS,
  CHECKLIST_MIN_STEPS,
  countSteps,
  entryProgress,
  HABIT_COLORS,
  isEntryComplete,
  isScheduledOn,
  TIME_OF_DAY_ORDER,
  toggleStep,
  TRACKING_TYPES,
  weekdayIso,
  type HabitTracking
} from "@/components/dashboard/habit-model";

/** A `check` habit scheduled every day — the shape every v2 habit migrates to. */
function checkHabit(overrides: Partial<HabitTracking> = {}): HabitTracking {
  return { trackingType: "check", target: 1, repeatDays: [...ALL_WEEKDAYS], ...overrides };
}

describe("habit model constants", () => {
  it("lists the four tracking types from the spec", () => {
    expect(TRACKING_TYPES).toEqual(["check", "count", "duration", "checklist"]);
  });

  it("orders the day's parts morning → afternoon → evening → anytime", () => {
    expect(TIME_OF_DAY_ORDER).toEqual(["morning", "afternoon", "evening", "anytime"]);
  });

  it("offers exactly six card colours (spec §5.1)", () => {
    expect(HABIT_COLORS).toHaveLength(6);
    expect(new Set(HABIT_COLORS).size).toBe(6);
  });

  it("bounds a checklist at 2–7 steps", () => {
    expect(CHECKLIST_MIN_STEPS).toBe(2);
    expect(CHECKLIST_MAX_STEPS).toBe(7);
  });
});

describe("weekdayIso", () => {
  it("numbers Monday 1 through Sunday 7", () => {
    // 2026-07-27 is a Monday.
    expect(weekdayIso("2026-07-27")).toBe(1);
    expect(weekdayIso("2026-07-28")).toBe(2);
    expect(weekdayIso("2026-08-01")).toBe(6);
    expect(weekdayIso("2026-08-02")).toBe(7);
  });
});

describe("checklist bitmask", () => {
  it("counts the set bits", () => {
    expect(countSteps(0)).toBe(0);
    expect(countSteps(0b1)).toBe(1);
    expect(countSteps(0b1011)).toBe(3);
    expect(countSteps(0b1111111)).toBe(7);
  });

  it("flips one step without touching the others", () => {
    expect(toggleStep(0, 0)).toBe(0b1);
    expect(toggleStep(0b1, 2)).toBe(0b101);
    expect(toggleStep(0b101, 0)).toBe(0b100);
  });
});

describe("isEntryComplete", () => {
  it("treats a missing entry as not done, for every type", () => {
    expect(isEntryComplete(checkHabit(), undefined)).toBe(false);
    expect(
      isEntryComplete(checkHabit({ trackingType: "count", target: 8 }), undefined)
    ).toBe(false);
  });

  it("check: any value from 1 up is done", () => {
    expect(isEntryComplete(checkHabit(), { value: 0 })).toBe(false);
    expect(isEntryComplete(checkHabit(), { value: 1 })).toBe(true);
  });

  it("count: done only once the target is reached — partial never punishes", () => {
    const habit = checkHabit({ trackingType: "count", target: 8 });

    expect(isEntryComplete(habit, { value: 0 })).toBe(false);
    expect(isEntryComplete(habit, { value: 7 })).toBe(false);
    expect(isEntryComplete(habit, { value: 8 })).toBe(true);
    expect(isEntryComplete(habit, { value: 12 })).toBe(true);
  });

  it("duration: minutes behave exactly like a count", () => {
    const habit = checkHabit({ trackingType: "duration", target: 20 });

    expect(isEntryComplete(habit, { value: 19 })).toBe(false);
    expect(isEntryComplete(habit, { value: 20 })).toBe(true);
  });

  it("checklist: every step must be ticked", () => {
    const habit = checkHabit({
      trackingType: "checklist",
      target: 3,
      steps: ["Trải chiếu", "Ngồi 5 phút", "Ghi một dòng"]
    });

    expect(isEntryComplete(habit, { value: 0b011 })).toBe(false);
    expect(isEntryComplete(habit, { value: 0b111 })).toBe(true);
  });

  it("falls back to 'any progress counts' when a target is missing or absurd", () => {
    expect(isEntryComplete(checkHabit({ trackingType: "count", target: 0 }), { value: 1 })).toBe(
      true
    );
    expect(isEntryComplete(checkHabit({ trackingType: "checklist", target: 3 }), { value: 1 })).toBe(
      true
    );
  });
});

describe("entryProgress", () => {
  it("reports a count's progress as a clamped ratio", () => {
    const habit = checkHabit({ trackingType: "count", target: 8 });

    expect(entryProgress(habit, { value: 2 })).toEqual({ done: 2, target: 8, ratio: 0.25 });
    expect(entryProgress(habit, { value: 99 }).ratio).toBe(1);
    expect(entryProgress(habit, undefined)).toEqual({ done: 0, target: 8, ratio: 0 });
  });

  it("reports a checklist's progress in steps, not bitmask value", () => {
    const habit = checkHabit({
      trackingType: "checklist",
      target: 4,
      steps: ["a", "b", "c", "d"]
    });

    expect(entryProgress(habit, { value: 0b1011 })).toEqual({ done: 3, target: 4, ratio: 0.75 });
  });

  it("reports a check as 0/1 or 1/1", () => {
    expect(entryProgress(checkHabit(), { value: 1 })).toEqual({ done: 1, target: 1, ratio: 1 });
    expect(entryProgress(checkHabit(), undefined)).toEqual({ done: 0, target: 1, ratio: 0 });
  });
});

describe("isScheduledOn", () => {
  it("follows the repeat days (2026-07-27 is a Monday)", () => {
    const weekdaysOnly = checkHabit({ repeatDays: [1, 2, 3, 4, 5] });

    expect(isScheduledOn(weekdaysOnly, "2026-07-27")).toBe(true);
    expect(isScheduledOn(weekdaysOnly, "2026-08-01")).toBe(false);
  });

  it("drops out of the day from the pause date onward, and returns on resume", () => {
    const paused = checkHabit({ pausedAt: "2026-07-27" });

    expect(isScheduledOn(paused, "2026-07-26")).toBe(true);
    expect(isScheduledOn(paused, "2026-07-27")).toBe(false);
    expect(isScheduledOn(paused, "2026-07-28")).toBe(false);
    expect(isScheduledOn(checkHabit({ pausedAt: null }), "2026-07-28")).toBe(true);
  });

  it("leaves every view from the archive date onward, history untouched", () => {
    const archived = checkHabit({ archivedAt: "2026-07-27" });

    expect(isScheduledOn(archived, "2026-07-26")).toBe(true);
    expect(isScheduledOn(archived, "2026-07-27")).toBe(false);
  });

  it("treats an empty repeat list as 'never scheduled', not 'always'", () => {
    expect(isScheduledOn(checkHabit({ repeatDays: [] }), "2026-07-27")).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run habit-model
```

Kỳ vọng: FAIL — không resolve được `@/components/dashboard/habit-model`.

- [ ] **Step 3: Viết `habit-model.ts`**

```ts
/**
 * Habit model v3 (spec §5): four ways to track a habit, a repeat schedule, a
 * part of the day, and a pause/archive lifecycle. Everything here is pure —
 * no React, no storage, no dates beyond the ISO strings handed in.
 */

import { parseIsoDate } from "@/lib/date";

export type TrackingType = "check" | "count" | "duration" | "checklist";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type HabitColor = "clay" | "moss" | "sky" | "dusk" | "sand" | "rose";

/**
 * One habit on one day.
 *
 * `value` reads differently per tracking type:
 *   check     → 0 or 1
 *   count     → units done (e.g. 6 glasses)
 *   duration  → minutes done
 *   checklist → bitmask of finished steps (bit i = steps[i])
 *
 * `completedAt` is a LOCAL "HH:mm" — the day already lives in the record key,
 * and keeping it clock-only sidesteps timezone drift when it later syncs.
 */
export type LogEntry = {
  value: number;
  completedAt?: string;
};

/** The subset of a habit these predicates need — keeps them trivially testable. */
export type HabitTracking = {
  trackingType: TrackingType;
  target: number;
  steps?: string[];
  repeatDays: number[];
  pausedAt?: string | null;
  archivedAt?: string | null;
};

export const TRACKING_TYPES: readonly TrackingType[] = [
  "check",
  "count",
  "duration",
  "checklist"
];

export const TIME_OF_DAY_ORDER: readonly TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "anytime"
];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Sáng",
  afternoon: "Chiều",
  evening: "Tối",
  anytime: "Cả ngày"
};

/** Emoji are objects of the world (spec §2.4). "Cả ngày" deliberately has none. */
export const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string | null> = {
  morning: "☀️",
  afternoon: "🌤",
  evening: "🌙",
  anytime: null
};

export const HABIT_COLORS: readonly HabitColor[] = [
  "clay",
  "moss",
  "sky",
  "dusk",
  "sand",
  "rose"
];

/** ISO weekday numbers: 1 = Monday … 7 = Sunday (matches the T2→CN grid). */
export const ALL_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

export const CHECKLIST_MIN_STEPS = 2;
export const CHECKLIST_MAX_STEPS = 7;

export function weekdayIso(date: string): number {
  const day = parseIsoDate(date).getDay();

  return day === 0 ? 7 : day;
}

export function countSteps(value: number): number {
  let bits = Math.max(0, Math.trunc(value));
  let total = 0;

  while (bits > 0) {
    total += bits & 1;
    bits >>>= 1;
  }

  return total;
}

export function toggleStep(value: number, index: number): number {
  return Math.max(0, Math.trunc(value)) ^ (1 << index);
}

/** How many units of the target this entry has reached, in the type's own unit. */
function doneUnits(habit: HabitTracking, entry: LogEntry | undefined): number {
  if (!entry) return 0;

  const value = Math.max(0, entry.value);

  return habit.trackingType === "checklist" ? countSteps(value) : value;
}

/** The target in the same unit as `doneUnits`. Checklists trust their steps. */
function targetUnits(habit: HabitTracking): number {
  if (habit.trackingType === "check") return 1;

  if (habit.trackingType === "checklist") {
    return habit.steps?.length ?? Math.max(1, habit.target);
  }

  return Math.max(1, habit.target);
}

/**
 * Completion per spec §5.2: count/duration hit their target, a checklist needs
 * every step. Partial progress is shown, never punished.
 */
export function isEntryComplete(habit: HabitTracking, entry: LogEntry | undefined): boolean {
  if (!entry) return false;

  return doneUnits(habit, entry) >= targetUnits(habit);
}

export function entryProgress(
  habit: HabitTracking,
  entry: LogEntry | undefined
): { done: number; target: number; ratio: number } {
  const target = targetUnits(habit);
  const done = doneUnits(habit, entry);

  return { done, target, ratio: Math.min(1, target > 0 ? done / target : 0) };
}

/**
 * Is this habit part of that day at all? Paused and archived habits leave the
 * day from their stamp onward — history before it stays exactly as it was
 * (spec §5.1).
 */
export function isScheduledOn(habit: HabitTracking, date: string): boolean {
  if (habit.archivedAt && date >= habit.archivedAt) return false;
  if (habit.pausedAt && date >= habit.pausedAt) return false;

  return habit.repeatDays.includes(weekdayIso(date));
}
```

- [ ] **Step 4: Chạy test — phải pass**

```bash
pnpm vitest run habit-model
```

Kỳ vọng: PASS 20/20.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/habit-model.ts src/components/dashboard/habit-model.test.ts
git commit -m "feat(u1a): habit model v3 types and completion predicates"
```

---

## Task 2: `habit-migration.ts` — v2 → v3

**Files:**
- Create: `src/components/dashboard/habit-migration.ts`
- Test: `src/components/dashboard/habit-migration.test.ts`

**Interfaces:**
- Consumes: `LogEntry`, `HabitTracking`, `ALL_WEEKDAYS`, `isEntryComplete` (Task 1); `habitEmoji` từ `@/components/dashboard/habit-style`
- Produces:
  - `type HabitV3Fields = { icon: string; trackingType: TrackingType; target: number; unit: string | null; steps: string[] | null; repeatDays: number[]; timeOfDay: TimeOfDay; scheduledAt: string | null; color: HabitColor; motivation: string; pausedAt: string | null; archivedAt: string | null; updatedAt: string | null }`
  - `function defaultHabitV3Fields(key: string, category: string): HabitV3Fields`
  - `function migrateHabitFields<T extends { key?: string; category?: string }>(habit: T): T & HabitV3Fields` — idempotent, giữ nguyên field v3 đã có
  - `function migrateEntries(record: { completions?: unknown; entries?: unknown }): Record<string, LogEntry>`
  - `function deriveCompletions(entries: Record<string, LogEntry>, trackingByKey: Map<string, HabitTracking>): Record<string, boolean>`

- [ ] **Step 1: Viết test (đang fail)**

Tạo `src/components/dashboard/habit-migration.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  defaultHabitV3Fields,
  deriveCompletions,
  migrateEntries,
  migrateHabitFields
} from "@/components/dashboard/habit-migration";
import { ALL_WEEKDAYS, type HabitTracking } from "@/components/dashboard/habit-model";

describe("defaultHabitV3Fields", () => {
  it("maps a v2 habit onto a plain daily checkbox", () => {
    const fields = defaultHabitV3Fields("wake_up", "Discipline");

    expect(fields.trackingType).toBe("check");
    expect(fields.target).toBe(1);
    expect(fields.repeatDays).toEqual([...ALL_WEEKDAYS]);
    expect(fields.timeOfDay).toBe("anytime");
    expect(fields.pausedAt).toBeNull();
    expect(fields.archivedAt).toBeNull();
  });

  it("borrows the icon the UI already showed for that habit", () => {
    expect(defaultHabitV3Fields("wake_up", "Discipline").icon).toBe("⏰");
    expect(defaultHabitV3Fields("unknown_key", "Health").icon).toBe("💚");
    expect(defaultHabitV3Fields("unknown_key", "Nothing").icon).toBe("⭐");
  });
});

describe("migrateHabitFields", () => {
  it("fills a v2 habit in without touching what it already had", () => {
    const migrated = migrateHabitFields({
      id: "wake_up",
      key: "wake_up",
      name: "Dậy đúng giờ",
      category: "Discipline",
      maxScore: 1,
      description: "",
      iconName: "AlarmClock"
    });

    expect(migrated.name).toBe("Dậy đúng giờ");
    expect(migrated.iconName).toBe("AlarmClock");
    expect(migrated.trackingType).toBe("check");
    expect(migrated.icon).toBe("⏰");
  });

  it("is idempotent — a v3 habit passes through unchanged", () => {
    const v3 = migrateHabitFields({
      key: "water",
      category: "Health",
      trackingType: "count" as const,
      target: 8,
      unit: "ly",
      icon: "💧",
      repeatDays: [1, 3, 5],
      timeOfDay: "morning" as const,
      pausedAt: "2026-07-01"
    });

    expect(migrateHabitFields(v3)).toEqual(v3);
    expect(v3.trackingType).toBe("count");
    expect(v3.repeatDays).toEqual([1, 3, 5]);
    expect(v3.pausedAt).toBe("2026-07-01");
  });

  it("repairs a corrupt repeat list rather than leaving a habit unreachable", () => {
    const migrated = migrateHabitFields({
      key: "x",
      category: "Work",
      repeatDays: ["monday", 9, 3] as unknown as number[]
    });

    expect(migrated.repeatDays).toEqual([3]);
  });
});

describe("migrateEntries", () => {
  it("turns v2 booleans into entries, keeping the explicit false", () => {
    expect(migrateEntries({ completions: { wake_up: true, clean: false } })).toEqual({
      wake_up: { value: 1 },
      clean: { value: 0 }
    });
  });

  it("keeps v3 entries as they are (idempotent)", () => {
    const entries = { water: { value: 6, completedAt: "21:30" } };

    expect(migrateEntries({ entries })).toEqual(entries);
  });

  it("prefers existing entries over the derived boolean cache", () => {
    expect(
      migrateEntries({ entries: { water: { value: 6 } }, completions: { water: true } })
    ).toEqual({ water: { value: 6 } });
  });

  it("survives junk", () => {
    expect(migrateEntries({})).toEqual({});
    expect(migrateEntries({ completions: null })).toEqual({});
    expect(migrateEntries({ entries: { a: { value: "x" } } as unknown })).toEqual({});
    expect(migrateEntries({ completions: { a: "yes" } as unknown })).toEqual({});
  });
});

describe("deriveCompletions", () => {
  const tracking = new Map<string, HabitTracking>([
    ["water", { trackingType: "count", target: 8, repeatDays: [...ALL_WEEKDAYS] }],
    ["wake_up", { trackingType: "check", target: 1, repeatDays: [...ALL_WEEKDAYS] }]
  ]);

  it("marks a cell done only when the entry meets its target", () => {
    expect(
      deriveCompletions({ water: { value: 6 }, wake_up: { value: 1 } }, tracking)
    ).toEqual({ water: false, wake_up: true });
    expect(deriveCompletions({ water: { value: 8 } }, tracking)).toEqual({ water: true });
  });

  it("drops cells whose habit no longer exists", () => {
    expect(deriveCompletions({ ghost: { value: 1 } }, tracking)).toEqual({});
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run habit-migration
```

Kỳ vọng: FAIL — không resolve được module.

- [ ] **Step 3: Viết `habit-migration.ts`**

```ts
/**
 * v2 → v3 migration for habits and log cells (spec §9.3). Every function here
 * is idempotent: running it on already-migrated data must be a no-op, because
 * it runs on every load, not once.
 */

import { habitEmoji } from "@/components/dashboard/habit-style";
import {
  ALL_WEEKDAYS,
  isEntryComplete,
  type HabitColor,
  type HabitTracking,
  type LogEntry,
  type TimeOfDay,
  type TrackingType
} from "@/components/dashboard/habit-model";

export type HabitV3Fields = {
  /** Emoji chosen by the user — an object of the world (spec §2.4). */
  icon: string;
  trackingType: TrackingType;
  target: number;
  unit: string | null;
  steps: string[] | null;
  repeatDays: number[];
  timeOfDay: TimeOfDay;
  /** Optional "HH:mm" — display only, and it feeds Giờ vàng later (spec §5.1). */
  scheduledAt: string | null;
  color: HabitColor;
  motivation: string;
  pausedAt: string | null;
  archivedAt: string | null;
  /** Per-definition LWW stamp; null = epoch, always loses to a server value. */
  updatedAt: string | null;
};

/** What a habit carried over from v2 becomes: a plain daily checkbox. */
export function defaultHabitV3Fields(key: string, category: string): HabitV3Fields {
  return {
    icon: habitEmoji(key, category),
    trackingType: "check",
    target: 1,
    unit: null,
    steps: null,
    repeatDays: [...ALL_WEEKDAYS],
    timeOfDay: "anytime",
    scheduledAt: null,
    color: "clay",
    motivation: "",
    pausedAt: null,
    archivedAt: null,
    updatedAt: null
  };
}

function isTrackingType(value: unknown): value is TrackingType {
  return value === "check" || value === "count" || value === "duration" || value === "checklist";
}

function isTimeOfDay(value: unknown): value is TimeOfDay {
  return value === "morning" || value === "afternoon" || value === "evening" || value === "anytime";
}

function isHabitColor(value: unknown): value is HabitColor {
  return (
    value === "clay" ||
    value === "moss" ||
    value === "sky" ||
    value === "dusk" ||
    value === "sand" ||
    value === "rose"
  );
}

/** Keeps only real ISO weekday numbers; a fully corrupt list falls back to daily. */
function normalizeRepeatDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...ALL_WEEKDAYS];

  const days = value.filter(
    (day): day is number => typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7
  );

  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : [...ALL_WEEKDAYS];
}

function normalizeSteps(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const steps = value.filter((step): step is string => typeof step === "string");

  return steps.length > 0 ? steps : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Adds every v3 field a habit is missing, leaving the ones it already has
 * untouched. Safe to run on v2 habits, v3 habits, and half-written ones.
 */
export function migrateHabitFields<T extends { key?: string; category?: string }>(
  habit: T
): T & HabitV3Fields {
  const candidate = habit as T & Partial<HabitV3Fields>;
  const defaults = defaultHabitV3Fields(habit.key ?? "", habit.category ?? "");

  return {
    ...habit,
    icon: typeof candidate.icon === "string" && candidate.icon ? candidate.icon : defaults.icon,
    trackingType: isTrackingType(candidate.trackingType)
      ? candidate.trackingType
      : defaults.trackingType,
    target:
      typeof candidate.target === "number" && candidate.target > 0
        ? candidate.target
        : defaults.target,
    unit: optionalString(candidate.unit),
    steps: normalizeSteps(candidate.steps),
    repeatDays: normalizeRepeatDays(candidate.repeatDays),
    timeOfDay: isTimeOfDay(candidate.timeOfDay) ? candidate.timeOfDay : defaults.timeOfDay,
    scheduledAt: optionalString(candidate.scheduledAt),
    color: isHabitColor(candidate.color) ? candidate.color : defaults.color,
    motivation: typeof candidate.motivation === "string" ? candidate.motivation : "",
    pausedAt: optionalString(candidate.pausedAt),
    archivedAt: optionalString(candidate.archivedAt),
    updatedAt: optionalString(candidate.updatedAt)
  };
}

function isLogEntry(value: unknown): value is LogEntry {
  if (value === null || typeof value !== "object") return false;

  const candidate = value as Partial<LogEntry>;

  return typeof candidate.value === "number" && Number.isFinite(candidate.value);
}

/**
 * The log cells of one day. `entries` wins when present — a v3 state reloaded
 * must not be rebuilt from its own derived boolean cache.
 */
export function migrateEntries(record: {
  completions?: unknown;
  entries?: unknown;
}): Record<string, LogEntry> {
  const entries: Record<string, LogEntry> = {};
  const source = record.entries;

  if (source !== null && typeof source === "object" && !Array.isArray(source)) {
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (isLogEntry(value)) entries[key] = value;
    }

    if (Object.keys(entries).length > 0) return entries;
  }

  const completions = record.completions;

  if (completions === null || typeof completions !== "object" || Array.isArray(completions)) {
    return entries;
  }

  for (const [key, value] of Object.entries(completions as Record<string, unknown>)) {
    if (typeof value === "boolean") entries[key] = { value: value ? 1 : 0 };
  }

  return entries;
}

/**
 * Rebuilds the derived boolean cache from the entries. Cells whose habit no
 * longer exists are dropped — orphans must never survive to be merged back.
 */
export function deriveCompletions(
  entries: Record<string, LogEntry>,
  trackingByKey: Map<string, HabitTracking>
): Record<string, boolean> {
  const completions: Record<string, boolean> = {};

  for (const [key, entry] of Object.entries(entries)) {
    const tracking = trackingByKey.get(key);

    if (!tracking) continue;

    completions[key] = isEntryComplete(tracking, entry);
  }

  return completions;
}
```

- [ ] **Step 4: Chạy test — phải pass**

```bash
pnpm vitest run habit-migration
```

Kỳ vọng: PASS 11/11.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/habit-migration.ts src/components/dashboard/habit-migration.test.ts
git commit -m "feat(u1a): idempotent v2 to v3 habit and log-cell migration"
```

---

## Task 3: Đưa v3 vào `DashboardState`

Sau task này state trong bộ nhớ đã là v3, nhưng **mọi hàm cũ vẫn đọc `completions`** nên hành vi không đổi — 304 test hiện có là lưới an toàn.

**Files:**
- Modify: `src/components/dashboard/dashboard-data.ts` — `DashboardHabit`, `DashboardDayRecord`, `createInitialDashboardState`, `migrateDashboardState`, `addHabitToState`, `removeHabitFromState`, `rekeyHabit`
- Modify: `src/components/dashboard/dashboard-data.test.ts` — thêm test invariant

**Interfaces:**
- Consumes: `migrateHabitFields`, `migrateEntries`, `deriveCompletions`, `HabitV3Fields` (Task 2); `isEntryComplete`, `HabitTracking` (Task 1)
- Produces:
  - `type DashboardHabit = { id, key, name, category, maxScore, description, iconName } & HabitV3Fields`
  - `type DashboardDayRecord = { date: string; entries: Record<string, LogEntry>; completions: Record<string, boolean> }`
  - `function habitTracking(habit: DashboardHabit): HabitTracking`
  - `function trackingIndex(habits: DashboardHabit[]): Map<string, HabitTracking>`

- [ ] **Step 1: Viết test invariant (đang fail)**

Thêm vào cuối `src/components/dashboard/dashboard-data.test.ts` (giữ nguyên mọi test đang có):

```ts
describe("habit model v3", () => {
  it("gives every seeded habit a full v3 definition", () => {
    const state = createInitialDashboardState("2026-07-27");

    for (const habit of state.habits) {
      expect(habit.trackingType).toBe("check");
      expect(habit.target).toBe(1);
      expect(habit.repeatDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(habit.timeOfDay).toBe("anytime");
      expect(habit.icon.length).toBeGreaterThan(0);
    }
  });

  it("keeps the derived completions cache in step with the entries", () => {
    const state = createInitialDashboardState("2026-07-27");
    const tracking = trackingIndex(state.habits);

    for (const record of Object.values(state.records)) {
      for (const habit of state.habits) {
        const entry = record.entries[habit.id];
        const cached = record.completions[habit.id] === true;

        expect(cached, `${record.date}/${habit.id}`).toBe(
          isEntryComplete(tracking.get(habit.id)!, entry)
        );
      }
    }
  });

  it("migrates a v2 state — booleans become entries, habits gain v3 fields", () => {
    const migrated = migrateDashboardState(
      {
        habits: [
          {
            id: "wake_up",
            key: "wake_up",
            name: "Dậy đúng giờ",
            category: "Discipline",
            maxScore: 1,
            description: "",
            iconName: "AlarmClock"
          }
        ],
        records: {
          "2026-07-26": { date: "2026-07-26", completions: { wake_up: true } },
          "2026-07-25": { date: "2026-07-25", completions: { wake_up: false } }
        }
      },
      "2026-07-27"
    );

    expect(migrated).not.toBeNull();
    expect(migrated!.habits[0].trackingType).toBe("check");
    expect(migrated!.habits[0].icon).toBe("⏰");
    expect(migrated!.records["2026-07-26"].entries.wake_up).toEqual({ value: 1 });
    expect(migrated!.records["2026-07-26"].completions.wake_up).toBe(true);
    expect(migrated!.records["2026-07-25"].completions.wake_up).toBe(false);
  });

  it("migrating an already-v3 state changes nothing", () => {
    const once = migrateDashboardState(createInitialDashboardState("2026-07-27"), "2026-07-27");
    const twice = migrateDashboardState(once, "2026-07-27");

    expect(twice).toEqual(once);
  });

  it("drops entries whose habit was deleted", () => {
    const state = createInitialDashboardState("2026-07-27");
    const pruned = removeHabitFromState(state, "wake_up", "2026-07-27T08:00:00.000Z");

    for (const record of Object.values(pruned.records)) {
      expect(record.entries.wake_up).toBeUndefined();
      expect(record.completions.wake_up).toBeUndefined();
    }
  });
});
```

Thêm vào khối import sẵn có của file test: `trackingIndex`, `removeHabitFromState`, `migrateDashboardState` (nếu chưa import) từ `@/components/dashboard/dashboard-data`, và `isEntryComplete` từ `@/components/dashboard/habit-model`.

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run dashboard-data
```

Kỳ vọng: FAIL — `trackingIndex` chưa tồn tại, `record.entries` undefined.

- [ ] **Step 3: Mở rộng type trong `dashboard-data.ts`**

```ts
import {
  isEntryComplete,
  type HabitTracking,
  type LogEntry
} from "@/components/dashboard/habit-model";
import {
  deriveCompletions,
  migrateEntries,
  migrateHabitFields,
  type HabitV3Fields
} from "@/components/dashboard/habit-migration";
```

Đổi 2 type:

```ts
export type DashboardHabit = {
  id: string;
  key: string;
  name: string;
  category: string;
  maxScore: number;
  description: string;
  iconName: string;
} & HabitV3Fields;

export type DashboardDayRecord = {
  date: string;
  /** Source of truth for one day (spec §9.3). */
  entries: Record<string, LogEntry>;
  /**
   * Derived cache of `isEntryComplete` per habit — the same pattern as
   * `CompanionState.food` over the ledger. ONLY `setHabitEntry` and the
   * migration write it; never hand-edit it, and never merge it as truth.
   */
  completions: Record<string, boolean>;
};
```

Thêm 2 helper (đặt ngay dưới `categoryLabel`):

```ts
/** The tracking subset the pure predicates need. */
export function habitTracking(habit: DashboardHabit): HabitTracking {
  return {
    trackingType: habit.trackingType,
    target: habit.target,
    steps: habit.steps ?? undefined,
    repeatDays: habit.repeatDays,
    pausedAt: habit.pausedAt,
    archivedAt: habit.archivedAt
  };
}

export function trackingIndex(habits: DashboardHabit[]): Map<string, HabitTracking> {
  return new Map(habits.map((habit) => [habit.id, habitTracking(habit)]));
}
```

- [ ] **Step 4: Sinh v3 trong `createInitialDashboardState`**

Trong `createInitialDashboardState`, đổi phần dựng `habits` và vòng lặp `records`:

```ts
  const habits: DashboardHabit[] = DEFAULT_HABITS.map((item) =>
    migrateHabitFields({
      id: item.key,
      key: item.key,
      name: item.name,
      category: item.category,
      maxScore: item.maxScore,
      description: item.description,
      iconName: habitIcon(item.key, item.category)
    })
  );
  const tracking = trackingIndex(habits);
  const records: Record<string, DashboardDayRecord> = {};

  for (let offset = HISTORY_DAYS; offset >= 0; offset -= 1) {
    const date = addDaysIso(today, -offset);
    const entries: Record<string, LogEntry> = {};

    habits.forEach((habit, index) => {
      entries[habit.id] = {
        value: isSeedHabitComplete(habit.key, index, offset) ? 1 : 0
      };
    });

    records[date] = { date, entries, completions: deriveCompletions(entries, tracking) };
  }
```

- [ ] **Step 5: Migrate trong `migrateDashboardState`**

Thay thân hàm `migrateDashboardState` (giữ nguyên các guard đầu hàm và `normalizeCompanion`):

```ts
  const companion = normalizeCompanion(candidate.companion);
  const habits = (candidate.habits as DashboardHabit[]).map((habit) =>
    migrateHabitFields(habit)
  );
  const tracking = trackingIndex(habits);
  const records: Record<string, DashboardDayRecord> = {};

  for (const [date, raw] of Object.entries(candidate.records ?? {})) {
    const entries = migrateEntries(raw as { completions?: unknown; entries?: unknown });

    records[date] = { date, entries, completions: deriveCompletions(entries, tracking) };
  }

  return {
    habits,
    records,
    events: normalizeEvents(candidate.events),
    bestStreakFloor:
      typeof candidate.bestStreakFloor === "number"
        ? candidate.bestStreakFloor
        : BEST_STREAK_FLOOR,
    seedCutoverDate:
      typeof candidate.seedCutoverDate === "string"
        ? candidate.seedCutoverDate
        : backfillSeedCutoverDate(companion, today),
    deletedHabits: Array.isArray(candidate.deletedHabits) ? candidate.deletedHabits : [],
    companion
  };
```

- [ ] **Step 6: Cập nhật 3 hàm đụng tới record**

`addHabitToState` — habit mới cũng phải là v3:

```ts
  const habit: DashboardHabit = migrateHabitFields({
    id,
    key: id,
    name,
    category: input.category,
    maxScore: 1,
    description: "",
    iconName: habitIcon(id, input.category)
  });
```

`removeHabitFromState` — xoá cả `entries` lẫn `completions` (thay thân vòng lặp `Object.keys(state.records).forEach`):

```ts
  Object.keys(state.records).forEach((date) => {
    const record = state.records[date];

    if (!(habitId in record.entries) && !(habitId in record.completions)) {
      records[date] = record;
      return;
    }

    const entries = { ...record.entries };
    const completions = { ...record.completions };

    delete entries[habitId];
    delete completions[habitId];
    records[date] = { ...record, entries, completions };
  });
```

`rekeyHabit` — đổi khoá ở cả hai (thay thân vòng lặp tương ứng):

```ts
  Object.keys(state.records).forEach((date) => {
    const record = state.records[date];

    if (!(oldKey in record.entries) && !(oldKey in record.completions)) {
      records[date] = record;
      return;
    }

    const entries = { ...record.entries };
    const completions = { ...record.completions };

    if (oldKey in entries) {
      entries[newKey] = entries[oldKey];
      delete entries[oldKey];
    }

    if (oldKey in completions) {
      completions[newKey] = completions[oldKey];
      delete completions[oldKey];
    }

    records[date] = { ...record, entries, completions };
  });
```

- [ ] **Step 7: Vá `merge.ts` để không đánh rơi `entries`**

`mergeServerIntoLocal` dựng lại record từ server log. Ô log server hiện chỉ có `done: boolean`, nên đây là chỗ duy nhất `completions` được ghi mà không qua `setHabitEntry` — phải ghi kèm `entries` cho khớp. Trong `src/lib/sync/merge.ts`, thay khối `server.logs.forEach` (phần dựng `nextRecords[log.date]`):

```ts
    const record = nextRecords[log.date] ?? { date: log.date, entries: {}, completions: {} };
    // The server still speaks boolean (U1c widens the contract). A remote tick
    // lands as a plain value:1 cell; a remote untick clears the cell to 0 —
    // never inventing a count the user did not enter.
    const previous = record.entries[log.habitKey];

    nextRecords[log.date] = {
      date: log.date,
      entries: {
        ...record.entries,
        [log.habitKey]: log.done ? (previous ?? { value: 1 }) : { value: 0 }
      },
      completions: { ...record.completions, [log.habitKey]: log.done }
    };
```

Và trong `pruneRecordKeys` (cùng file), xoá khoá ở cả hai map:

```ts
    const entries = { ...record.entries };
    const completions = { ...record.completions };

    for (const key of keys) {
      delete entries[key];
      delete completions[key];
    }

    next[date] = { ...record, entries, completions };
```

> Lưu ý: `previous ?? { value: 1 }` giữ lại giá trị đếm địa phương khi server chỉ xác nhận "đã xong" — không ghi đè 8 ly nước thành 1.

- [ ] **Step 8: Chạy toàn bộ test**

```bash
pnpm vitest run
```

Kỳ vọng: tất cả xanh. Test nào của `merge.test.ts` dựng record thủ công bằng `{ date, completions }` sẽ đỏ — sửa chúng thành `{ date, entries, completions }` với `entries` khớp (ví dụ `completions: { wake_up: true }` → thêm `entries: { wake_up: { value: 1 } }`). **Không nới lỏng assertion nào**; chỉ bổ sung field mới.

- [ ] **Step 9: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/dashboard-data.ts src/components/dashboard/dashboard-data.test.ts src/lib/sync/merge.ts src/lib/sync/merge.test.ts
git commit -m "feat(u1a): v3 habit definitions and rich log entries in dashboard state"
```

---

## Task 4: `setHabitEntry` — mutation duy nhất được ghi ô log

**Files:**
- Modify: `src/components/dashboard/dashboard-data.ts` — thêm `setHabitEntry`, giữ `toggleHabitForDate` như lớp bọc
- Modify: `src/components/dashboard/dashboard-data.test.ts`

**Interfaces:**
- Consumes: `habitTracking`, `trackingIndex` (Task 3); `isEntryComplete`, `toggleStep` (Task 1)
- Produces:
  - `function setHabitEntry(state: DashboardState, date: string, habitId: string, value: number, completedAtHHmm?: string): DashboardState`
  - `function toggleHabitForDate(state, date, habitId, completedAtHHmm?): DashboardState` — chữ ký cũ vẫn dùng được, nay chuyển tiếp sang `setHabitEntry`
  - `function countCompletedOn(state: DashboardState, date: string): number`

- [ ] **Step 1: Viết test (đang fail)**

Thêm vào `src/components/dashboard/dashboard-data.test.ts`:

```ts
describe("setHabitEntry", () => {
  function stateWithCountHabit() {
    const base = createInitialDashboardState("2026-07-27");

    return {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up"
          ? { ...habit, trackingType: "count" as const, target: 8, unit: "ly" }
          : habit
      )
    };
  }

  it("writes the entry and the derived cache together", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 6);
    const record = next.records["2026-07-27"];

    expect(record.entries.wake_up.value).toBe(6);
    expect(record.completions.wake_up).toBe(false);
  });

  it("flips the cache the moment the target is met", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8);

    expect(next.records["2026-07-27"].completions.wake_up).toBe(true);
  });

  it("stamps the completion clock only when the cell becomes complete", () => {
    const partial = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 6, "20:15");
    const complete = setHabitEntry(partial, "2026-07-27", "wake_up", 8, "21:30");

    expect(partial.records["2026-07-27"].entries.wake_up.completedAt).toBeUndefined();
    expect(complete.records["2026-07-27"].entries.wake_up.completedAt).toBe("21:30");
  });

  it("keeps the first completion clock when a done cell grows further", () => {
    const done = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8, "21:30");
    const more = setHabitEntry(done, "2026-07-27", "wake_up", 10, "22:45");

    expect(more.records["2026-07-27"].entries.wake_up.completedAt).toBe("21:30");
  });

  it("clears the clock when the cell drops back below its target", () => {
    const done = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", 8, "21:30");
    const undone = setHabitEntry(done, "2026-07-27", "wake_up", 3, "22:00");

    expect(undone.records["2026-07-27"].entries.wake_up.completedAt).toBeUndefined();
    expect(undone.records["2026-07-27"].completions.wake_up).toBe(false);
  });

  it("never stores a negative value", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-07-27", "wake_up", -5);

    expect(next.records["2026-07-27"].entries.wake_up.value).toBe(0);
  });

  it("returns the same state for an unknown habit", () => {
    const state = stateWithCountHabit();

    expect(setHabitEntry(state, "2026-07-27", "ghost", 1)).toBe(state);
  });

  it("creates the day when it does not exist yet", () => {
    const next = setHabitEntry(stateWithCountHabit(), "2026-08-09", "wake_up", 8);

    expect(next.records["2026-08-09"].completions.wake_up).toBe(true);
  });
});

describe("toggleHabitForDate on v3", () => {
  it("still flips a check habit both ways", () => {
    const state = createInitialDashboardState("2026-07-27");
    const on = setHabitEntry(state, "2026-07-27", "clean", 1);
    const off = toggleHabitForDate(on, "2026-07-27", "clean");

    expect(on.records["2026-07-27"].completions.clean).toBe(true);
    expect(off.records["2026-07-27"].completions.clean).toBe(false);
    expect(off.records["2026-07-27"].entries.clean.value).toBe(0);
  });

  it("untick empties a count habit rather than stepping it down by one", () => {
    const base = createInitialDashboardState("2026-07-27");
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, trackingType: "count" as const, target: 8 } : habit
      )
    };
    const done = setHabitEntry(state, "2026-07-27", "wake_up", 8);
    const off = toggleHabitForDate(done, "2026-07-27", "wake_up");

    expect(off.records["2026-07-27"].entries.wake_up.value).toBe(0);
  });
});

describe("countCompletedOn", () => {
  it("counts the cells that meet their own target", () => {
    const base = createInitialDashboardState("2026-07-27");
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, trackingType: "count" as const, target: 8 } : habit
      )
    };
    const partial = setHabitEntry(state, "2026-07-27", "wake_up", 6);
    const full = setHabitEntry(state, "2026-07-27", "wake_up", 8);

    expect(countCompletedOn(full, "2026-07-27") - countCompletedOn(partial, "2026-07-27")).toBe(1);
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run dashboard-data
```

Kỳ vọng: FAIL — `setHabitEntry` / `countCompletedOn` chưa tồn tại.

- [ ] **Step 3: Viết `setHabitEntry` và bạn của nó**

Thay `toggleHabitForDate` hiện tại bằng:

```ts
/**
 * The ONLY writer of a log cell. Writes the entry (truth) and the derived
 * `completions` cache in one step so the two can never drift.
 *
 * `completedAtHHmm` is a local "HH:mm". It is stamped on the transition into
 * completeness and kept from then on — growing a finished cell further must
 * not move its Giờ vàng (spec §6.3) — and cleared if the cell drops back.
 */
export function setHabitEntry(
  state: DashboardState,
  date: string,
  habitId: string,
  value: number,
  completedAtHHmm?: string
): DashboardState {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) return state;

  const tracking = habitTracking(habit);
  const record = state.records[date] ?? { date, entries: {}, completions: {} };
  const previous = record.entries[habitId];
  const nextValue = Math.max(0, Math.trunc(value));
  const candidate: LogEntry = { value: nextValue };
  const nowComplete = isEntryComplete(tracking, candidate);

  if (nowComplete) {
    const stamp = previous && isEntryComplete(tracking, previous)
      ? previous.completedAt
      : completedAtHHmm;

    if (stamp) candidate.completedAt = stamp;
  }

  return {
    ...state,
    records: {
      ...state.records,
      [date]: {
        date,
        entries: { ...record.entries, [habitId]: candidate },
        completions: { ...record.completions, [habitId]: nowComplete }
      }
    }
  };
}

/**
 * Flip a habit for a day. Ticking a non-check habit fills it to its target;
 * unticking empties it — an untick is a valid action and must be unambiguous
 * (invariant 2), never an off-by-one step down.
 */
export function toggleHabitForDate(
  state: DashboardState,
  date: string,
  habitId: string,
  completedAtHHmm?: string
): DashboardState {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) return state;

  const done = state.records[date]?.completions[habitId] === true;
  const target =
    habit.trackingType === "checklist"
      ? (1 << (habit.steps?.length ?? Math.max(1, habit.target))) - 1
      : Math.max(1, habit.trackingType === "check" ? 1 : habit.target);

  return setHabitEntry(state, date, habitId, done ? 0 : target, completedAtHHmm);
}

/** How many of the day's habits meet their own target. */
export function countCompletedOn(state: DashboardState, date: string): number {
  const record = state.records[date];

  if (!record) return 0;

  return state.habits.filter((habit) => record.completions[habit.id] === true).length;
}
```

- [ ] **Step 4: Chạy test — phải pass**

```bash
pnpm vitest run dashboard-data
```

Kỳ vọng: PASS toàn bộ, gồm 11 test mới.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/dashboard-data.ts src/components/dashboard/dashboard-data.test.ts
git commit -m "feat(u1a): setHabitEntry writes entry and derived cache as one"
```

---

## Task 5: Chuỗi riêng tôn trọng lịch lặp

**Files:**
- Modify: `src/components/dashboard/dashboard-data.ts` — `calculateHabitStreak`, `isHabitDone`
- Modify: `src/components/dashboard/dashboard-data.test.ts`

**Interfaces:**
- Consumes: `habitTracking` (Task 3), `isScheduledOn` (Task 1)
- Produces: `calculateHabitStreak(state, habitId, today)` — chữ ký không đổi, luật đổi theo spec §5.2: ngày không nằm trong lịch/đang tạm dừng được **bỏ qua** (không cộng, không làm đứt); ngày trong lịch đã qua mà bỏ lỡ thì bắt đầu lại.

- [ ] **Step 1: Viết test (đang fail)**

```ts
describe("calculateHabitStreak with a repeat schedule", () => {
  /** A state where `wake_up` runs only on the given ISO weekdays. */
  function scheduled(repeatDays: number[], doneDates: string[], today: string) {
    const base = createInitialDashboardState(today);
    const habits = base.habits.map((habit) =>
      habit.id === "wake_up" ? { ...habit, repeatDays } : habit
    );
    const records: typeof base.records = {};

    // Wipe the seed history for this habit so the test drives every cell.
    for (const [date, record] of Object.entries(base.records)) {
      records[date] = {
        date,
        entries: { ...record.entries, wake_up: { value: doneDates.includes(date) ? 1 : 0 } },
        completions: { ...record.completions, wake_up: doneDates.includes(date) }
      };
    }

    return { ...base, habits, records };
  }

  it("skips the days the habit is not scheduled for", () => {
    // 2026-07-27 Mon … 2026-08-02 Sun. Habit runs Mon/Wed/Fri only.
    const state = scheduled(
      [1, 3, 5],
      ["2026-07-27", "2026-07-29", "2026-07-31"],
      "2026-07-31"
    );

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(3);
  });

  it("a missed scheduled day starts a new rhythm", () => {
    const state = scheduled([1, 3, 5], ["2026-07-27", "2026-07-31"], "2026-07-31");

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(1);
  });

  it("today still counts as an open chance, never a break", () => {
    const state = scheduled([1, 3, 5], ["2026-07-27", "2026-07-29"], "2026-07-31");

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(2);
  });

  it("a paused habit freezes its streak instead of losing it", () => {
    const base = scheduled(
      [1, 2, 3, 4, 5, 6, 7],
      ["2026-07-25", "2026-07-26", "2026-07-27"],
      "2026-07-31"
    );
    const state = {
      ...base,
      habits: base.habits.map((habit) =>
        habit.id === "wake_up" ? { ...habit, pausedAt: "2026-07-28" } : habit
      )
    };

    expect(calculateHabitStreak(state, "wake_up", "2026-07-31")).toBe(3);
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run dashboard-data
```

Kỳ vọng: FAIL — hàm hiện tại đếm thẳng từng ngày lịch, không biết lịch lặp.

- [ ] **Step 3: Viết lại `calculateHabitStreak`**

```ts
/**
 * Chuỗi riêng của một thói quen (spec §5.2): ngày trong lịch mà hoàn thành thì
 * +1; ngày KHÔNG trong lịch (hoặc đang tạm dừng) được bỏ qua — không cộng, không
 * làm đứt; ngày trong lịch ĐÃ QUA mà bỏ lỡ thì bắt đầu nhịp mới. Hôm nay chưa
 * làm không bao giờ làm đứt chuỗi (invariant 1: không dọa mất chuỗi giữa ngày).
 */
export function calculateHabitStreak(
  state: DashboardState,
  habitId: string,
  today = getDashboardToday()
): number {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) return 0;

  const tracking = habitTracking(habit);
  const earliest = minIsoDate(...Object.keys(state.records), today);
  let streak = 0;
  let date = today;

  // Today is still an open chance: if it is scheduled but not done yet, start
  // counting from yesterday instead of breaking here.
  if (isScheduledOn(tracking, today) && !isHabitDone(state, today, habitId)) {
    date = addDaysIso(today, -1);
  }

  while (date >= earliest) {
    if (!isScheduledOn(tracking, date)) {
      date = addDaysIso(date, -1);
      continue;
    }

    if (!isHabitDone(state, date, habitId)) break;

    streak += 1;
    date = addDaysIso(date, -1);
  }

  return streak;
}
```

Thêm `isScheduledOn` vào import từ `@/components/dashboard/habit-model` nếu chưa có. `minIsoDate` đã được import sẵn ở đầu file.

> `earliest` là chốt chặn: không có nó, một habit chỉ chạy Thứ Hai sẽ khiến vòng lặp lùi vô hạn qua khoảng trống lịch sử.

- [ ] **Step 4: Chạy test — phải pass**

```bash
pnpm vitest run dashboard-data
```

Kỳ vọng: PASS toàn bộ. Các test streak cũ (habit lặp cả 7 thứ) vẫn cho đúng số cũ.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/dashboard/dashboard-data.ts src/components/dashboard/dashboard-data.test.ts
git commit -m "feat(u1a): per-habit streak follows the repeat schedule and pauses"
```

---

## Task 6: StateProvider dùng khoá v3

**Files:**
- Modify: `src/components/app/state-provider.tsx`
- Modify: `src/components/app/state-provider.test.tsx`

**Interfaces:**
- Consumes: `setHabitEntry`, `countCompletedOn` (Task 4)
- Produces: `AppState` có thêm `setHabitEntry: (habitId: string, value: number) => void`. `toggleHabit` giữ nguyên chữ ký.

- [ ] **Step 1: Viết test (đang fail)**

Thêm vào `src/components/app/state-provider.test.tsx`:

```ts
it("persists under the v3 key and leaves the v2 snapshot untouched", () => {
  const v2 = JSON.stringify({
    habits: [
      {
        id: "wake_up",
        key: "wake_up",
        name: "Dậy đúng giờ",
        category: "Discipline",
        maxScore: 1,
        description: "",
        iconName: "AlarmClock"
      }
    ],
    records: { "2026-07-26": { date: "2026-07-26", completions: { wake_up: true } } }
  });

  window.localStorage.setItem("betterme.dashboard.v2", v2);

  renderProbe();

  fireEvent.click(screen.getByRole("button", { name: "add" }));

  expect(window.localStorage.getItem("betterme.dashboard.v2")).toBe(v2);

  const saved = JSON.parse(window.localStorage.getItem("betterme.dashboard.v3")!);

  expect(saved.habits[0].trackingType).toBe("check");
  expect(saved.records["2026-07-26"].entries.wake_up).toEqual({ value: 1 });
});

it("prefers an existing v3 snapshot over the v2 one", () => {
  window.localStorage.setItem(
    "betterme.dashboard.v2",
    JSON.stringify({ habits: [], records: {} })
  );
  window.localStorage.setItem(
    "betterme.dashboard.v3",
    JSON.stringify({
      habits: [
        {
          id: "solo",
          key: "solo",
          name: "Chỉ một việc",
          category: "Health",
          maxScore: 1,
          description: "",
          iconName: "Star",
          trackingType: "check",
          target: 1,
          repeatDays: [1, 2, 3, 4, 5, 6, 7],
          timeOfDay: "anytime"
        }
      ],
      records: {}
    })
  );

  renderProbe();

  expect(screen.getByTestId("progress").textContent).toBe("0/1");
});
```

Trong `Probe`, thêm nút gọi `app.setHabitEntry(first.id, 3)` và hiển thị giá trị ô log để test được mutation mới:

```tsx
      <button onClick={() => app.setHabitEntry(first.id, 1)} type="button">
        set
      </button>
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run state-provider
```

Kỳ vọng: FAIL — provider vẫn ghi vào `betterme.dashboard.v2`.

- [ ] **Step 3: Đổi khoá lưu trữ**

Trong `src/components/app/state-provider.tsx`:

```ts
const STORAGE_KEY = "betterme.dashboard.v3";
/** Read-only from U1a on: migrated once into v3, then left exactly as it was
 *  so the owner keeps a working rollback snapshot on disk. */
const LEGACY_STORAGE_KEYS = ["betterme.dashboard.v2", "betterme.dashboard.v1"] as const;
```

Và trong effect hydrate, thay dòng đọc:

```ts
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(
        (value) => value !== null
      ) ??
      null;
```

- [ ] **Step 4: Expose `setHabitEntry`**

Thêm vào `type AppState`:

```ts
  setHabitEntry: (habitId: string, value: number) => void;
```

Thêm handler (đặt ngay dưới `toggleHabit`):

```ts
  /**
   * Direct write for count / duration / checklist controls (spec §4.2).
   * Reaching a target IS completing the habit, so this must feed the companion
   * economy on exactly the same terms as a tick (spec §5.2) — otherwise a
   * count habit would silently earn nothing.
   */
  function setEntry(habitId: string, value: number) {
    const before = countCompletedOn(state, today);
    let next = setHabitEntryInState(state, today, habitId, value, clockHHmm());
    const after = countCompletedOn(next, today);
    const total = viewModel.today.totalHabits;
    const justCompleted = after > before;
    const completesTheDay = justCompleted && total > 0 && after >= total;

    if (completesTheDay) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1300);
    }

    if (justCompleted && state.companion.activeSpecies) {
      next = grantFoodForHabitCompletion(next, today, after, total);
      next = recordGrowthDay(next, today);

      if (completesTheDay) next = grantAllDoneBonus(next, today);

      speakAfter(next, state, completesTheDay ? "allDone" : "habitDone");
    }

    commitState(next);

    if (after !== before) {
      markSyncDirty({
        kind: "setHabitLog",
        habitKey: habitId,
        date: today,
        done: justCompleted,
        clientTs: new Date().toISOString()
      });
    }

    if (justCompleted && state.companion.activeSpecies) {
      markCompanionDirty();
      maybeBumpSharedRhythms();
    }
  }
```

> Vì sao đối xứng với `toggleHabit` từng dòng: `grantFoodForHabitCompletion` đã tự chặn trần theo ngày (`dailyCap`), nên gọi nó ở cả hai đường không thể trả thưởng hai lần cho cùng một việc.

Import `setHabitEntry as setHabitEntryInState` và `countCompletedOn` từ `dashboard-data`, và thêm helper cạnh `hasSupabaseSession`:

```ts
/** Local wall clock as "HH:mm" — the stamp a completed cell carries (spec §6.3). */
function clockHHmm(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
```

Cuối cùng thêm `setHabitEntry: setEntry` vào object context value.

- [ ] **Step 5: Truyền `clockHHmm()` cho `toggleHabit`**

Trong `toggleHabit`, đổi đúng một dòng:

```ts
    let next = toggleHabitForDate(state, today, habitId, clockHHmm());
```

- [ ] **Step 6: Chạy test — phải pass**

```bash
pnpm vitest run state-provider app-shell social-badge
```

Kỳ vọng: PASS toàn bộ.

- [ ] **Step 7: 4 gates + xem bằng mắt**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

Dừng build, chạy `pnpm dev` với `BETTERME_DEV_AUTH_BYPASS=true`, mở `/dashboard`:
- Giao diện **y hệt** trước U1a.
- DevTools → Application → Local Storage: có khoá `betterme.dashboard.v3`, mỗi record có `entries`; khoá `betterme.dashboard.v2` (nếu trước đó có) **không đổi một byte**.
- Tick / untick 1 habit → `entries` đổi `value` 1↔0, `completions` đổi theo, và ô đã xong có `completedAt` dạng `"HH:mm"`.

- [ ] **Step 8: Commit**

```bash
git add src/components/app/state-provider.tsx src/components/app/state-provider.test.tsx
git commit -m "feat(u1a): persist under betterme.dashboard.v3, v2 becomes read-only"
```

---

## Task 7: Cập nhật tài liệu

**Files:**
- Modify: `AGENTS.md` (mục Conventions, dòng Current state)
- Modify: `HANDOFF.md` (§2 bảng commit, §4-A tiến độ, §5 bản đồ file)

- [ ] **Step 1: Thêm quy ước mô hình v3 vào `AGENTS.md`**

Chèn vào phần "Conventions", ngay dưới gạch đầu dòng **Pet economy**:

```markdown
- **Habit model v3** (`habit-model.ts` + `habit-migration.ts`): a log cell is
  `{ value, completedAt? }` where `value` means check 0|1 · count units · duration minutes ·
  checklist bitmask. `DashboardDayRecord.entries` is the SOURCE OF TRUTH; `completions` is a
  DERIVED boolean cache (same pattern as `CompanionState.food` over the ledger) — only
  `setHabitEntry` and the migration may write it, and it is never merged as truth. Migration
  functions run on every load, so they must stay idempotent. `repeatDays` uses ISO weekday
  numbers (1 = Monday). `completedAt` is a local `"HH:mm"`, never a full timestamp.
```

- [ ] **Step 2: Cập nhật "Current state" trong `AGENTS.md`**

Thay bằng con số test thật đọc từ output `pnpm vitest run` (không đoán), ví dụ:

```markdown
Current state: <N> tests green. Social Garden Phases 0–3 committed; auth is live
email+password with a signup OTP (see `docs/auth-email-config.md`). UI overhaul: **U0** (tokens,
fonts, `ui/` primitives, four-space shell) and **U1a** (habit model v3 + v2→v3 migration) are
done — see `docs/superpowers/specs/2026-07-26-uiux-overhaul-design.md` §10 for what is left.
```

- [ ] **Step 3: Cập nhật `HANDOFF.md`**

- Dòng đầu: đổi ngày, số test, tên nhánh.
- §2: thêm một dòng bảng cho U1a.
- §4-A: thêm mục **U1a — XONG** với 3 quyết định ở đầu plan này, và ghi rõ bước kế tiếp là **U1b** (editor + day view) rồi **U1c** (sync + schema).
- §5: thêm `src/components/dashboard/{habit-model,habit-migration}.ts` vào bản đồ file.
- Ghi cảnh báo cho owner: **v2 vẫn nằm nguyên trong localStorage làm ảnh chụp rollback** — muốn quay lại chỉ cần xoá khoá `betterme.dashboard.v3`.

- [ ] **Step 4: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add AGENTS.md HANDOFF.md
git commit -m "docs: U1a shipped — habit model v3 and the v2 to v3 migration"
```

---

## Kiểm tra cuối U1a (làm trước khi báo owner duyệt)

- [ ] 4 gates — dán output thật làm bằng chứng, không nói suông.
- [ ] Số test = 304 + 53 mới (T1 20 · T2 11 · T3 5 · T4 11 · T5 4 · T6 2) = **357**. Test cũ của `merge.test.ts` chỉ được **bổ sung field**, không đếm thêm. Lệch thì tìm nguyên nhân, đừng chỉnh con số.
- [ ] **Không test cũ nào bị xoá hay nới lỏng.** `merge.test.ts` chỉ được thêm `entries` vào các record dựng tay.
- [ ] Dev server, dev-bypass: giao diện không đổi một chút nào so với U0; `betterme.dashboard.v3` xuất hiện; `betterme.dashboard.v2` còn nguyên.
- [ ] `grep -rn "completions\[" src` — mọi chỗ ghi (không phải đọc) đều nằm trong `setHabitEntry`, `migrateDashboardState`, `createInitialDashboardState`, `removeHabitFromState`, `rekeyHabit`, hoặc `merge.ts`.
- [ ] Không có copy mới nào (U1a không đụng UI) — nên guard no-guilt không cần chạm.
