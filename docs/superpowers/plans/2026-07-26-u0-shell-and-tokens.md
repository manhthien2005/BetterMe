# U0 — Token system, font, bộ `ui/` và shell 4 không gian — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền thị giác mới (design token + 2 font mới + bộ primitive `ui/`) và tách app thành 4 không gian có route riêng (`/dashboard`, `/calendar`, `/nep`, `/friends`) với toàn bộ state được nâng lên `StateProvider` — **không đổi một hành vi nghiệp vụ nào**.

**Architecture:** Token là CSS variable ngữ nghĩa trong `globals.css`, map sang Tailwind bằng `var(--token)`; palette cũ (rice/matcha/sakura) **giữ nguyên** và chỉ bị gỡ dần ở U1–U4 khi từng bề mặt được thay áo. Toàn bộ state/effects trong `dashboard-client.tsx` (1.180 dòng) chuyển lên `StateProvider` (React context) mount trong layout của route group `(app)`; 4 page là client component mỏng đọc context qua `useAppState()`. Pure functions trong `dashboard-data.ts` **không đổi một dòng nào**.

**Tech Stack:** Next.js 15.5 App Router · React 19 · TypeScript 5.9 strict · Tailwind 3.4 + `class-variance-authority` · lucide-react 0.562 (đã có sẵn trong `package.json` — **không cần thêm dependency**) · `next/font/google` · Vitest + Testing Library (jsdom).

---

## Global Constraints

Mọi task đều ngầm mang các ràng buộc dưới đây.

- **pnpm only** — không bao giờ `npm`/`yarn`.
- **4 gates xanh trước mọi commit:** `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build`. Không commit khi còn 1 gate đỏ.
- **KHÔNG chạy `pnpm build` khi `pnpm dev` đang chạy** (chung `.next/`, build production làm hỏng cache dev).
- **2 invariant thiêng liêng:** no-guilt (không câu chữ trách móc / so sánh xuống) và no-decay (growth/bond chỉ tăng). U0 không thêm copy mới nào ngoài empty-state ở §Task 9 — copy đó phải qua mắt no-guilt.
- **U0 không đổi hành vi:** không sửa `dashboard-data.ts` (trừ 1 export hằng số ở Task 8), không sửa `src/lib/sync/**`, không sửa `src/lib/server/**`, không đụng `supabase/schema.sql`.
- **Palette cũ giữ nguyên:** không xoá `rice`/`mochi`/`plum`/`mauve`/`wafer`/`matcha`/`sakura`/`butter`/`dawn` khỏi `tailwind.config.ts` trong U0.
- **Naming:** file kebab-case · component/type PascalCase · function/field camelCase · alias `@/*` → `src/*`.
- **Test colocated** `*.test.{ts,tsx}`; pure logic = unit test, component = interaction + a11y test.
- **Giá trị token chính xác (spec §2.1)** — copy nguyên văn, không tự ý làm tròn:
  `--surface-page: #FEFBF3` · `--surface-card: #FFFDF9` · `--action: #B45309` · `--success: #16A34A` · `--alert: #E11D48` · `--ink: #1C1917` · `--ink-soft: #78716C` · `--line: #EFE7D8` · `--line-strong: #E7E0D2` · honey `#FFF9EC → #FFE9C2`.
- **Font:** Display = Bricolage Grotesque, Body = Be Vietnam Pro, cả hai subset `["latin", "vietnamese"]` (đã kiểm chứng trong `font-data.json` của next 15.5 — cả 2 font đều có subset `vietnamese`).
- **A11y:** mọi cặp chữ/nền ≥ 4.5:1; viền của control ≥ 3:1; touch target ≥ 44px; focus ring token hoá.

---

## Quyết định trong lúc lập plan (owner có thể lật lại bằng 1 câu)

Ba chỗ spec/mockup chưa khớp hoặc chưa đủ, đã chốt như sau và ghi rõ ở đây để anh soát:

1. **Icon trên nav = line-icon (Lucide), không phải emoji.** Mockup `desktop-layout-v3.html` vẽ 🏠📅🐌🏡, nhưng spec §2.4 nói thẳng "Line-icon = mọi hành động UI: **nav**, thăm vườn, cổ vũ…". Spec là văn bản chốt sau nên spec thắng. Wordmark vẫn giữ "🌾 Nếp's Garden" (🌾 là vật phẩm thế giới, hợp luật §2.4).
2. **Tách `--success` (nền/hình) và `--success-ink` (chữ).** `#16A34A` trên thẻ chỉ đạt **3.24:1** — đủ cho một hình khối tô đặc (WCAG 1.4.11) nhưng **trượt AA cho chữ**. Chữ xanh dùng `--success-ink: #15803D` (4.75:1 trên nền `#F2FBF3`). Tương tự spec không có token "chữ mờ": `#A8A29E` chỉ đạt 2.48:1 nên **không** được đưa vào bộ token chữ; metadata phụ dùng `--ink-soft` (4.72:1).
3. **`TabSwitch` và `ProgressRing` hoãn sang U2.** Spec §9.1 liệt kê chúng trong bộ `ui/`, nhưng U0 không có màn nào dùng (tab Ngày/Tuần và vòng tiến độ đều thuộc U2). Dựng sớm = code chết không được validate bởi chỗ dùng thật. Ghi vào "ngoài phạm vi U0" bên dưới.

## Ngoài phạm vi U0 (ghi nhận, làm ở bước sau)

- `TabSwitch`, `ProgressRing` → U2 (dựng cùng hero + week grid).
- Thay áo nội dung từng thẻ (habit row mới, hero bầu trời, chip widget, Bạn vườn áo mới) → U1–U4. U0 **chỉ** dời chỗ ở, giữ nguyên giao diện bên trong từng thẻ.
- Reskin `/login` → U4.
- Gỡ palette cũ khỏi `tailwind.config.ts` → U4 (khi không còn nơi dùng).

---

## File Structure

**Tạo mới**

| File | Trách nhiệm |
|---|---|
| `src/app/design-tokens.test.ts` | Gate a11y: đọc `globals.css`, kiểm tra token tồn tại + tỉ lệ tương phản + đã map vào Tailwind |
| `src/components/ui/card.tsx` + test | Bề mặt thẻ duy nhất, 3 tone (plain / warm / done) |
| `src/components/ui/chip.tsx` + test | Chip nhỏ 1 dòng, 4 tone |
| `src/components/ui/icon.tsx` + test | Wrapper Lucide: cỡ + `aria-hidden` mặc định |
| `src/components/ui/nav-rail.tsx` + test | Rail trái desktop (200px), slot `footer` cho ProfileMenu |
| `src/components/ui/bottom-tab-bar.tsx` + test | Tab bar dưới mobile, target ≥ 44px |
| `src/components/app/nav-items.ts` + test | Dữ liệu thuần: 4 mục nav + `activeNavKey(pathname)` |
| `src/lib/social/mailbox-seen.ts` + test | Tách khỏi `dashboard-client.tsx`: đọc/ghi/prune map visit đã chào + đếm visit chưa chào |
| `src/components/app/state-provider.tsx` + test | Toàn bộ state/effects/handler của app + `useAppState()` |
| `src/components/app/app-shell.tsx` + test | Khung nav (rail/header/tab bar) + mount mọi overlay toàn cục |
| `src/components/app/sync-status-dot.tsx` | Chấm trạng thái sync (tách khỏi `dashboard-client.tsx`) |
| `src/components/app/today-page.tsx` | Không gian 🏠 Hôm nay |
| `src/components/app/calendar-page.tsx` | Không gian 📅 Lịch & nhịp |
| `src/components/app/nep-page.tsx` | Không gian 🐌 Nhà của Nếp |
| `src/components/app/friends-page.tsx` | Không gian 🏡 Bạn vườn (kèm empty-state khi sync tắt) |
| `src/components/dashboard/todays-habits.tsx` | Tách `TodaysHabits` + `HabitRow` + `StatusBadge` khỏi `dashboard-client.tsx` |
| `src/components/dashboard/calendar-panel.tsx` | Tách `CalendarPanel` + hàm tô ô khỏi `dashboard-client.tsx` |
| `src/app/(app)/layout.tsx` + `layout.test.tsx` | Server layout: auth + bootstrap → StateProvider + AppShell |
| `src/app/(app)/dashboard/page.tsx`, `loading.tsx` | Route `/dashboard` |
| `src/app/(app)/calendar/page.tsx` | Route `/calendar` |
| `src/app/(app)/nep/page.tsx` | Route `/nep` |
| `src/app/(app)/friends/page.tsx` | Route `/friends` |

**Sửa**

| File | Việc |
|---|---|
| `src/app/globals.css` | Thêm khối token U0; đổi `body`/`h1-h3` sang font + surface mới; xoá utility `.meadow` |
| `tailwind.config.ts` | Map token U0 (colors / borderRadius / boxShadow); `honey` phẳng → object có `DEFAULT` |
| `src/app/layout.tsx` | Đổi 2 font, bỏ class `meadow`, đổi `themeColor` |
| `src/app/typography.test.ts` | Đổi assertion sang font mới |
| `src/components/ui/button.tsx` | Viết lại 3 cấp theo token |
| `src/components/dashboard/{events-card,garden-visit-overlay}.tsx`, `src/components/auth/login-form.tsx` | `variant="outline"` → `variant="secondary"` |
| `src/components/dashboard/hero-banner.tsx` | Bỏ `CompanionPanel` (pet dọn sang `/nep`) |
| `src/components/dashboard/dashboard-data.ts` | Thêm đúng 1 export: `HABIT_CATEGORIES` |
| `AGENTS.md`, `HANDOFF.md` | Cập nhật project map + tiến độ |

**Xoá**

- `src/app/dashboard/` (cả thư mục: `page.tsx`, `loading.tsx`, `page.test.tsx`) — chuyển vào `(app)/`.
- `src/components/dashboard/dashboard-client.tsx` — nội dung tán vào provider + 4 page.

---

## Task 1: Design token + map Tailwind

**Files:**
- Modify: `src/app/globals.css:5-26` (khối `:root`)
- Modify: `tailwind.config.ts:11-72`
- Test: `src/app/design-tokens.test.ts` (tạo mới)

**Interfaces:**
- Consumes: —
- Produces: CSS variable `--surface-page` `--surface-card` `--surface-success` `--surface-warm` `--honey-from` `--honey-to` `--line` `--line-strong` `--line-success` `--line-honey` `--control-line` `--ink` `--ink-mid` `--ink-soft` `--action` `--action-hover` `--action-ink` `--success` `--success-ink` `--alert` `--alert-ink` `--radius-card` `--radius-control` `--radius-pill` `--shadow-card` `--shadow-action`; và các class Tailwind tương ứng: `bg-surface-page` `bg-surface-card` `bg-surface-success` `bg-surface-warm` `border-line` `border-line-strong` `border-line-success` `border-line-honey` `border-line-control` `text-ink` `text-ink-mid` `text-ink-soft` `bg-action` `text-action` `bg-action-hover` `text-action-ink` `bg-success` `text-success-ink` `bg-alert` `text-alert-ink` `from-honey-from` `to-honey-to` `rounded-card` `rounded-control` `rounded-pill` `shadow-card` `shadow-action`.

- [ ] **Step 1: Viết test gate a11y (đang fail)**

Tạo `src/app/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const tailwind = readFileSync("tailwind.config.ts", "utf8");

/** Every `--token: value;` declared in the first `:root` block (no nested braces there). */
function readTokens(source: string): Record<string, string> {
  const start = source.indexOf(":root");
  const block = source.slice(start, source.indexOf("}", start));
  const tokens: Record<string, string> = {};

  for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }

  return tokens;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const linear = [0, 2, 4]
    .map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const [hi, lo] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a
  );

  return (hi + 0.05) / (lo + 0.05);
}

/** Text/background pairs the design actually ships (spec §2.1 + §9.5). */
const TEXT_PAIRS: Array<[string, string]> = [
  ["ink", "surface-page"],
  ["ink", "surface-card"],
  ["ink-mid", "surface-card"],
  ["ink-soft", "surface-page"],
  ["ink-soft", "surface-card"],
  ["ink-soft", "honey-from"],
  ["action", "surface-page"],
  ["action", "surface-card"],
  ["action-ink", "action"],
  ["action-hover", "honey-from"],
  ["action-hover", "surface-warm"],
  ["success-ink", "surface-success"],
  ["alert-ink", "alert"]
];

/** Non-text boundaries that must still be perceivable (WCAG 1.4.11 — 3:1). */
const CONTROL_PAIRS: Array<[string, string]> = [
  ["control-line", "surface-card"],
  ["control-line", "surface-page"],
  ["success", "surface-card"]
];

describe("design tokens", () => {
  const tokens = readTokens(css);

  it("declares every U0 token", () => {
    const required = [
      "surface-page",
      "surface-card",
      "surface-success",
      "surface-warm",
      "honey-from",
      "honey-to",
      "line",
      "line-strong",
      "line-success",
      "line-honey",
      "control-line",
      "ink",
      "ink-mid",
      "ink-soft",
      "action",
      "action-hover",
      "action-ink",
      "success",
      "success-ink",
      "alert",
      "alert-ink",
      "radius-card",
      "radius-control",
      "radius-pill",
      "shadow-card",
      "shadow-action"
    ];

    for (const name of required) {
      expect(tokens[name], `globals.css must declare --${name}`).toBeTruthy();
    }
  });

  it("keeps the spec's exact palette values", () => {
    expect(tokens["surface-page"]).toBe("#FEFBF3");
    expect(tokens["surface-card"]).toBe("#FFFDF9");
    expect(tokens.action).toBe("#B45309");
    expect(tokens.success).toBe("#16A34A");
    expect(tokens.alert).toBe("#E11D48");
    expect(tokens.ink).toBe("#1C1917");
    expect(tokens["ink-soft"]).toBe("#78716C");
    expect(tokens.line).toBe("#EFE7D8");
    expect(tokens["line-strong"]).toBe("#E7E0D2");
    expect(tokens["honey-from"]).toBe("#FFF9EC");
    expect(tokens["honey-to"]).toBe("#FFE9C2");
  });

  it("passes AA for every text pair the design ships", () => {
    for (const [foreground, background] of TEXT_PAIRS) {
      const ratio = contrastRatio(tokens[foreground], tokens[background]);

      expect(ratio, `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps control boundaries perceivable (3:1)", () => {
    for (const [foreground, background] of CONTROL_PAIRS) {
      const ratio = contrastRatio(tokens[foreground], tokens[background]);

      expect(ratio, `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    }
  });

  it("exposes every colour token through tailwind", () => {
    const colourTokens = Object.keys(tokens).filter((name) =>
      /^(surface|line|ink|action|success|alert|honey|control)/.test(name)
    );

    for (const name of colourTokens) {
      expect(tailwind, `tailwind.config.ts must expose --${name}`).toContain(`var(--${name})`);
    }
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/app/design-tokens.test.ts
```

Kỳ vọng: FAIL ở `declares every U0 token` ("globals.css must declare --surface-page").

- [ ] **Step 3: Thêm khối token vào `globals.css`**

Trong `src/app/globals.css`, **giữ nguyên** toàn bộ khối token cũ (`--background` … `--radius`) và chèn ngay bên dưới `--radius: 1.5rem;`, vẫn trong `:root`:

```css
    /* ——— U0 tokens (spec §2.1). Colour is a ROLE, never decoration. ———
       Everything above this line is the v2 palette; U1–U4 retire it surface
       by surface. Contrast is gated by src/app/design-tokens.test.ts. */

    /* Surfaces */
    --surface-page: #FEFBF3;
    --surface-card: #FFFDF9;
    --surface-success: #F2FBF3;
    --surface-warm: #FEF0D3;
    --honey-from: #FFF9EC;
    --honey-to: #FFE9C2;

    /* Lines. Hairlines are decorative; --control-line is the only one a
       control's boundary may use (WCAG 1.4.11 wants 3:1 there). */
    --line: #EFE7D8;
    --line-strong: #E7E0D2;
    --line-success: #CDEDD2;
    --line-honey: #F8D793;
    --control-line: #948877;

    /* Ink. Every value here is AA on --surface-page AND --surface-card, so
       there is deliberately NO faint-text token: #A8A29E is only 2.5:1. */
    --ink: #1C1917;
    --ink-mid: #57534E;
    --ink-soft: #78716C;

    /* Action — the ONLY primary / streak / link colour. */
    --action: #B45309;
    --action-hover: #92400E;
    --action-ink: #FFFFFF;

    /* Success — fill and ink are different on purpose: #16A34A is 3.2:1,
       fine for a filled shape, not for text. */
    --success: #16A34A;
    --success-ink: #15803D;

    /* Alert — the new-mail badge, and nothing else. */
    --alert: #E11D48;
    --alert-ink: #FFFFFF;

    /* Shape + depth */
    --radius-card: 16px;
    --radius-control: 12px;
    --radius-pill: 999px;
    --shadow-card: 0 1px 2px rgb(120 89 51 / 0.04), 0 8px 24px rgb(120 89 51 / 0.06);
    --shadow-action: 0 2px 6px rgb(180 83 9 / 0.28);
```

- [ ] **Step 4: Map token vào `tailwind.config.ts`**

Trong `theme.extend.colors`, chèn khối mới **lên đầu** (trước `border: "hsl(var(--border))"`):

```ts
      colors: {
        // ——— U0 tokens (src/app/globals.css). Colour is a role. ———
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          success: "var(--surface-success)",
          warm: "var(--surface-warm)"
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
          success: "var(--line-success)",
          honey: "var(--line-honey)",
          control: "var(--control-line)"
        },
        ink: {
          DEFAULT: "var(--ink)",
          mid: "var(--ink-mid)",
          soft: "var(--ink-soft)"
        },
        action: {
          DEFAULT: "var(--action)",
          hover: "var(--action-hover)",
          ink: "var(--action-ink)"
        },
        success: {
          DEFAULT: "var(--success)",
          ink: "var(--success-ink)"
        },
        alert: {
          DEFAULT: "var(--alert)",
          ink: "var(--alert-ink)"
        },
        // ——— v2 palette below — retired surface by surface across U1–U4. ———
        border: "hsl(var(--border))",
        // …giữ nguyên phần còn lại…
```

Rồi đổi `honey` từ chuỗi phẳng thành object (giữ `DEFAULT` để `text-honey` ở `hero-banner.tsx` không gãy):

```ts
        butter: "#FFD98E",
        honey: {
          DEFAULT: "#F2B04C",
          from: "var(--honey-from)",
          to: "var(--honey-to)"
        },
```

Và bổ sung vào `borderRadius` / `boxShadow`:

```ts
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 12px)",
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        action: "var(--shadow-action)",
        mochi: "0 2px 6px rgb(74 61 70 / 0.05), 0 10px 30px rgb(74 61 70 / 0.06)",
        // …giữ nguyên mochi-lift / soft / note…
      }
```

- [ ] **Step 5: Chạy test — phải pass**

```bash
pnpm vitest run src/app/design-tokens.test.ts
```

Kỳ vọng: PASS 5/5.

- [ ] **Step 6: 4 gates**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

Kỳ vọng: tất cả xanh; số test = baseline + 5.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/design-tokens.test.ts tailwind.config.ts
git commit -m "feat(u0): semantic design tokens with an AA contrast gate"
```

---

## Task 2: Typography Bricolage + Be Vietnam Pro, và nền trang mới

**Files:**
- Modify: `src/app/layout.tsx:1-30`
- Modify: `src/app/globals.css:38-68` (`body`, `h1-h3`, `::selection`, xoá `.meadow`)
- Modify: `src/app/typography.test.ts`

**Interfaces:**
- Consumes: `--surface-page`, `--ink` (Task 1)
- Produces: biến font `--font-display` (Bricolage Grotesque) và `--font-body` (Be Vietnam Pro); `body` nền `--surface-page`, chữ `--ink`.

- [ ] **Step 1: Sửa test typography (đang fail)**

Thay toàn bộ nội dung `src/app/typography.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("app typography", () => {
  it("uses Be Vietnam Pro for body and Bricolage Grotesque for display", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain('font-family: var(--font-body), "Be Vietnam Pro", sans-serif;');
    expect(css).toContain(
      'font-family: var(--font-display), "Bricolage Grotesque", sans-serif;'
    );
    expect(css).not.toContain('"Inter"');
    expect(css).not.toContain('"Nunito"');
    expect(css).not.toContain('"Baloo 2"');
  });

  it("loads both faces with the vietnamese subset through next/font", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(layout).toContain("Bricolage_Grotesque");
    expect(layout).toContain("Be_Vietnam_Pro");
    expect(layout.match(/subsets: \["latin", "vietnamese"\]/g)?.length).toBe(2);
  });

  it("drops the retired rice-paper meadow background", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(css).not.toContain(".meadow");
    expect(layout).not.toContain("meadow");
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/app/typography.test.ts
```

Kỳ vọng: FAIL ở assertion `Be Vietnam Pro`.

- [ ] **Step 3: Đổi font trong `layout.tsx`**

Thay 3 khối đầu của `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/query-provider";

// Variable font — the wght axis alone is what the design uses.
const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display"
});

// Static font — the weights must be listed explicitly.
const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});
```

Và trong cùng file, đổi `viewport.themeColor` + bỏ class `meadow`:

```tsx
export const viewport: Viewport = {
  themeColor: "#FEFBF3",
  width: "device-width",
  initialScale: 1
};
```

```tsx
      <body className="min-h-screen">
```

- [ ] **Step 4: Đổi `body` / `h1-h3` / `::selection` và xoá `.meadow` trong `globals.css`**

Thay khối `body` + `h1,h2,h3` + `::selection` hiện tại bằng:

```css
  body {
    @apply bg-surface-page text-ink antialiased;
    max-width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    font-family: var(--font-body), "Be Vietnam Pro", sans-serif;
    letter-spacing: 0;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display), "Bricolage Grotesque", sans-serif;
  }

  ::selection {
    background: rgb(180 83 9 / 0.18);
  }
```

Xoá trọn utility `.meadow` (khối `@layer utilities` bắt đầu bằng comment `/* Rice-paper meadow: … */`, gồm cả selector `.meadow { … }`). **Giữ nguyên** `.soft-panel`, `.card-lift`, `.squishy`, `.scrollbar-soft` và toàn bộ keyframes phía dưới.

- [ ] **Step 5: Chạy test — phải pass**

```bash
pnpm vitest run src/app/typography.test.ts
```

Kỳ vọng: PASS 3/3.

- [ ] **Step 6: 4 gates + xem bằng mắt**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

Sau khi build xong (build và dev **không** chạy cùng lúc), mở `pnpm dev` với `BETTERME_DEV_AUTH_BYPASS=true` và xác nhận: chữ Việt có dấu hiển thị đúng ở cả tiêu đề lẫn body (không rơi về font hệ thống), nền trang là kem `#FEFBF3` phẳng, không còn vệt hồng/xanh của `.meadow`.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/typography.test.ts
git commit -m "feat(u0): Bricolage Grotesque + Be Vietnam Pro on the new page surface"
```

---

## Task 3: Button 3 cấp

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/dashboard/events-card.tsx`, `src/components/dashboard/garden-visit-overlay.tsx`, `src/components/auth/login-form.tsx`, `src/components/dashboard/dashboard-client.tsx` (`variant="outline"` → `variant="secondary"`)
- Test: `src/components/ui/button.test.tsx` (tạo mới)

**Interfaces:**
- Consumes: token màu Task 1
- Produces: `<Button variant="primary" | "secondary" | "ghost" | "link" | "destructive" size="default" | "sm" | "lg" | "icon">`; mặc định `variant="primary"`. `buttonVariants` vẫn export (hiện chưa có nơi nào dùng ngoài `button.tsx`).

- [ ] **Step 1: Viết test (đang fail)**

Tạo `src/components/ui/button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("defaults to the primary tier — terracotta fill, white ink", () => {
    render(<Button>Lưu</Button>);

    const button = screen.getByRole("button", { name: "Lưu" });

    expect(button.className).toContain("bg-action");
    expect(button.className).toContain("text-action-ink");
  });

  it("renders the secondary tier as cream with a warm hairline", () => {
    render(<Button variant="secondary">Để sau</Button>);

    const button = screen.getByRole("button", { name: "Để sau" });

    expect(button.className).toContain("bg-surface-card");
    expect(button.className).toContain("border-line-strong");
    expect(button.className).not.toContain("bg-action ");
  });

  it("renders the ghost tier as bare action-coloured text", () => {
    render(<Button variant="ghost">Ghé thăm</Button>);

    const button = screen.getByRole("button", { name: "Ghé thăm" });

    expect(button.className).toContain("text-action");
    expect(button.className).not.toContain("border");
  });

  it("keeps every tier at a 44px-tall touch target", () => {
    render(
      <>
        <Button>A</Button>
        <Button variant="secondary">B</Button>
        <Button variant="ghost">C</Button>
      </>
    );

    for (const name of ["A", "B", "C"]) {
      expect(screen.getByRole("button", { name }).className).toContain("h-11");
    }
  });

  it("token-ises the focus ring", () => {
    render(<Button>Focus</Button>);

    expect(screen.getByRole("button", { name: "Focus" }).className).toContain(
      "focus-visible:ring-action"
    );
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/components/ui/button.test.tsx
```

Kỳ vọng: FAIL — class hiện tại là `bg-matcha-deep`.

- [ ] **Step 3: Viết lại `buttonVariants`**

Thay khối `cva(...)` trong `src/components/ui/button.tsx` (giữ nguyên phần `ButtonProps` + `forwardRef` bên dưới):

```tsx
const buttonVariants = cva(
  "squishy inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-pill px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Tier 1 — at most ONE per region (spec §2.3).
        primary: "bg-action text-action-ink shadow-action hover:bg-action-hover",
        // Tier 2 — cream card surface with a warm hairline.
        secondary:
          "border border-line-strong bg-surface-card text-ink shadow-card hover:bg-surface-warm",
        // Tier 3 — no chrome at all.
        ghost: "text-action hover:bg-surface-warm",
        link: "h-auto px-0 text-action underline-offset-4 hover:underline",
        // Destructive lives only behind a confirm (spec §5.1).
        destructive: "bg-alert text-alert-ink hover:brightness-95"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-12 px-5",
        icon: "h-11 w-11 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);
```

> Lưu ý kỹ thuật: **không** dùng modifier độ mờ (`bg-action/10`) trên token — token là `var(--x)` chứa hex nên Tailwind không sinh được alpha. Mọi trạng thái hover đều dùng một token màu riêng.

- [ ] **Step 4: Đổi 4 call site `outline` → `secondary`**

Trong `src/components/dashboard/events-card.tsx`, `src/components/dashboard/garden-visit-overlay.tsx`, `src/components/auth/login-form.tsx`, `src/components/dashboard/dashboard-client.tsx`: đổi mỗi chỗ `variant="outline"` thành `variant="secondary"` (mỗi file đúng 1 chỗ). `variant="ghost"` (5 chỗ) và `variant="destructive"` (1 chỗ) giữ nguyên tên.

- [ ] **Step 5: Chạy test — phải pass**

```bash
pnpm vitest run src/components/ui/button.test.tsx
```

Kỳ vọng: PASS 5/5.

- [ ] **Step 6: 4 gates**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

`typecheck` là lưới an toàn ở đây: bất kỳ `variant="outline"` nào còn sót sẽ thành lỗi type.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/button.test.tsx src/components/dashboard/events-card.tsx src/components/dashboard/garden-visit-overlay.tsx src/components/auth/login-form.tsx src/components/dashboard/dashboard-client.tsx
git commit -m "feat(u0): three-tier button on the action token"
```

---

## Task 4: Primitive Card, Chip, Icon

**Files:**
- Create: `src/components/ui/card.tsx`, `src/components/ui/chip.tsx`, `src/components/ui/icon.tsx`
- Test: `src/components/ui/card.test.tsx`, `src/components/ui/chip.test.tsx`, `src/components/ui/icon.test.tsx`

**Interfaces:**
- Consumes: token Task 1
- Produces:
  - `<Card tone?: "plain" | "warm" | "done" {...divProps}>` — mặc định `plain`
  - `<Chip tone?: "plain" | "warm" | "success" | "action" {...spanProps}>` — mặc định `plain`
  - `<Icon as={LucideIcon} label?: string size?: "sm" | "md" className?: string />` — không có `label` thì `aria-hidden`

- [ ] **Step 1: Viết 3 test file (đang fail)**

`src/components/ui/card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("is a cream surface with a warm hairline by default", () => {
    render(<Card data-testid="card">nội dung</Card>);

    const card = screen.getByTestId("card");

    expect(card.className).toContain("bg-surface-card");
    expect(card.className).toContain("border-line");
    expect(card.className).toContain("rounded-card");
  });

  it("wears the honey gradient in the warm tone", () => {
    render(
      <Card data-testid="card" tone="warm">
        chuỗi
      </Card>
    );

    const card = screen.getByTestId("card");

    expect(card.className).toContain("from-honey-from");
    expect(card.className).toContain("to-honey-to");
  });

  it("wears the green wash in the done tone", () => {
    render(
      <Card data-testid="card" tone="done">
        xong
      </Card>
    );

    expect(screen.getByTestId("card").className).toContain("bg-surface-success");
  });

  it("keeps caller classes", () => {
    render(
      <Card className="mt-4" data-testid="card">
        x
      </Card>
    );

    expect(screen.getByTestId("card").className).toContain("mt-4");
  });
});
```

`src/components/ui/chip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "@/components/ui/chip";

describe("Chip", () => {
  it("is a neutral pill by default", () => {
    render(<Chip data-testid="chip">⛅ 31°</Chip>);

    const chip = screen.getByTestId("chip");

    expect(chip.className).toContain("rounded-pill");
    expect(chip.className).toContain("text-ink-soft");
  });

  it("uses success INK, never the success fill, for text", () => {
    render(
      <Chip data-testid="chip" tone="success">
        +1 🌾
      </Chip>
    );

    const chip = screen.getByTestId("chip");

    expect(chip.className).toContain("text-success-ink");
    expect(chip.className).not.toContain("text-success ");
  });

  it("renders the streak tone on honey", () => {
    render(
      <Chip data-testid="chip" tone="warm">
        🔥 26
      </Chip>
    );

    expect(screen.getByTestId("chip").className).toContain("bg-surface-warm");
  });

  it("renders the action tone", () => {
    render(
      <Chip data-testid="chip" tone="action">
        Mới
      </Chip>
    );

    expect(screen.getByTestId("chip").className).toContain("text-action");
  });
});
```

`src/components/ui/icon.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { Pencil } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Icon } from "@/components/ui/icon";

describe("Icon", () => {
  it("hides decorative icons from assistive tech", () => {
    const { container } = render(<Icon as={Pencil} />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("aria-label")).toBeNull();
  });

  it("exposes a labelled icon as an image", () => {
    const { container } = render(<Icon as={Pencil} label="Sửa thói quen" />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("aria-label")).toBe("Sửa thói quen");
    expect(svg?.getAttribute("aria-hidden")).toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
  });

  it("defaults to the medium size and accepts overrides", () => {
    const { container } = render(<Icon as={Pencil} className="text-action" />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("class")).toContain("h-[18px]");
    expect(svg?.getAttribute("class")).toContain("text-action");
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/components/ui/card.test.tsx src/components/ui/chip.test.tsx src/components/ui/icon.test.tsx
```

Kỳ vọng: FAIL — không resolve được 3 module.

- [ ] **Step 3: Viết `card.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export type CardTone = "plain" | "warm" | "done";

/**
 * The one card surface (spec §2.1). `warm` is the honey accent — at most ONE
 * per list; `done` is the completed-row wash.
 */
export function Card({
  className,
  tone = "plain",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  return (
    <div
      className={cn(
        "rounded-card border p-4 sm:p-5",
        tone === "plain" && "border-line bg-surface-card shadow-card",
        tone === "warm" && "border-line-honey bg-gradient-to-br from-honey-from to-honey-to",
        tone === "done" && "border-line-success bg-surface-success",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Viết `chip.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export type ChipTone = "plain" | "warm" | "success" | "action";

/** A one-line pill: weather, streak, "+1 🌾", section metadata. */
export function Chip({
  className,
  tone = "plain",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold",
        tone === "plain" && "border border-line bg-surface-card text-ink-soft",
        tone === "warm" && "bg-surface-warm text-action-hover",
        // Text is --success-ink; --success is a fill colour and fails AA as text.
        tone === "success" && "bg-surface-success text-success-ink",
        tone === "action" && "bg-surface-warm text-action",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Viết `icon.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Line-icons are the UI layer (spec §2.4): nav, actions, controls. Emoji stay
 * reserved for objects of the world (🐌 🌾 🍃 🔥). Unlabelled icons are
 * decorative and hidden from assistive tech.
 */
export function Icon({
  as: Glyph,
  className,
  label,
  size = "md"
}: {
  as: LucideIcon;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <Glyph
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]", className)}
      role={label ? "img" : undefined}
      strokeWidth={2}
    />
  );
}
```

- [ ] **Step 6: Chạy test — phải pass**

```bash
pnpm vitest run src/components/ui/card.test.tsx src/components/ui/chip.test.tsx src/components/ui/icon.test.tsx
```

Kỳ vọng: PASS 11/11.

- [ ] **Step 7: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/ui/card.tsx src/components/ui/card.test.tsx src/components/ui/chip.tsx src/components/ui/chip.test.tsx src/components/ui/icon.tsx src/components/ui/icon.test.tsx
git commit -m "feat(u0): Card, Chip and Icon primitives on the token set"
```

---

## Task 5: Mô hình nav (dữ liệu thuần)

**Files:**
- Create: `src/components/app/nav-items.ts`
- Test: `src/components/app/nav-items.test.ts`

**Interfaces:**
- Consumes: `lucide-react`
- Produces:
  - `type NavItemKey = "today" | "calendar" | "nep" | "friends"`
  - `type NavItem = { key: NavItemKey; href: string; label: string; icon: LucideIcon; badge?: boolean }`
  - `const NAV_ITEMS: readonly NavItem[]` (đúng 4 mục, theo thứ tự Hôm nay → Lịch & nhịp → Nhà của Nếp → Bạn vườn)
  - `function activeNavKey(pathname: string): NavItemKey | null`

- [ ] **Step 1: Viết test (đang fail)**

```ts
import { describe, expect, it } from "vitest";

import { activeNavKey, NAV_ITEMS } from "@/components/app/nav-items";

describe("nav model", () => {
  it("has exactly the four spaces, in reading order", () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      "today",
      "calendar",
      "nep",
      "friends"
    ]);
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/dashboard",
      "/calendar",
      "/nep",
      "/friends"
    ]);
  });

  it("labels every space in Vietnamese", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Hôm nay",
      "Lịch & nhịp",
      "Nhà của Nếp",
      "Bạn vườn"
    ]);
  });

  it("gives the alert badge to Bạn vườn and nobody else (spec §2.1)", () => {
    expect(NAV_ITEMS.filter((item) => item.badge).map((item) => item.key)).toEqual([
      "friends"
    ]);
  });

  it("uses line-icons, never emoji, for navigation (spec §2.4)", () => {
    for (const item of NAV_ITEMS) {
      expect(typeof item.icon).not.toBe("string");
      expect(item.label).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("resolves the active space from the pathname", () => {
    expect(activeNavKey("/dashboard")).toBe("today");
    expect(activeNavKey("/calendar")).toBe("calendar");
    expect(activeNavKey("/nep")).toBe("nep");
    expect(activeNavKey("/friends")).toBe("friends");
  });

  it("matches nested paths but not unrelated ones", () => {
    expect(activeNavKey("/nep/album")).toBe("nep");
    expect(activeNavKey("/login")).toBeNull();
    expect(activeNavKey("/nepal")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/components/app/nav-items.test.ts
```

Kỳ vọng: FAIL — không resolve được module.

- [ ] **Step 3: Viết `nav-items.ts`**

```ts
import { CalendarDays, Home, Snail, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemKey = "today" | "calendar" | "nep" | "friends";

export type NavItem = {
  key: NavItemKey;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only this item may wear the red badge — --alert is unique (spec §2.1). */
  badge?: boolean;
};

/** The four spaces (spec §3). Order is the same on the rail and the tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "today", href: "/dashboard", label: "Hôm nay", icon: Home },
  { key: "calendar", href: "/calendar", label: "Lịch & nhịp", icon: CalendarDays },
  { key: "nep", href: "/nep", label: "Nhà của Nếp", icon: Snail },
  { key: "friends", href: "/friends", label: "Bạn vườn", icon: Users, badge: true }
];

/** Which space owns a pathname. `/nep/album` is still Nếp; `/nepal` is not. */
export function activeNavKey(pathname: string): NavItemKey | null {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return match?.key ?? null;
}
```

- [ ] **Step 4: Chạy test — phải pass**

```bash
pnpm vitest run src/components/app/nav-items.test.ts
```

Kỳ vọng: PASS 6/6.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/app/nav-items.ts src/components/app/nav-items.test.ts
git commit -m "feat(u0): the four-space nav model"
```

---

## Task 6: NavRail (desktop) + BottomTabBar (mobile)

**Files:**
- Create: `src/components/ui/nav-rail.tsx`, `src/components/ui/bottom-tab-bar.tsx`
- Test: `src/components/ui/nav-rail.test.tsx`, `src/components/ui/bottom-tab-bar.test.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `NavItemKey` (Task 5); `Icon` (Task 4)
- Produces:
  - `<NavRail activeKey={NavItemKey | null} badgeCount={number} footer?: React.ReactNode />`
  - `<BottomTabBar activeKey={NavItemKey | null} badgeCount={number} />`
  - Cả hai render `<Link>` của `next/link`, gắn `aria-current="page"` cho mục đang mở, badge chỉ hiện khi `badgeCount > 0`.

- [ ] **Step 1: Viết test NavRail (đang fail)**

`src/components/ui/nav-rail.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavRail } from "@/components/ui/nav-rail";

describe("NavRail", () => {
  it("links to all four spaces", () => {
    render(<NavRail activeKey="today" badgeCount={0} />);

    expect(screen.getByRole("link", { name: /Hôm nay/ }).getAttribute("href")).toBe(
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: /Lịch & nhịp/ }).getAttribute("href")).toBe(
      "/calendar"
    );
    expect(screen.getByRole("link", { name: /Nhà của Nếp/ }).getAttribute("href")).toBe(
      "/nep"
    );
    expect(screen.getByRole("link", { name: /Bạn vườn/ }).getAttribute("href")).toBe(
      "/friends"
    );
  });

  it("marks the open space with aria-current", () => {
    render(<NavRail activeKey="nep" badgeCount={0} />);

    expect(screen.getByRole("link", { name: /Nhà của Nếp/ }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(screen.getByRole("link", { name: /Hôm nay/ }).getAttribute("aria-current")).toBeNull();
  });

  it("hides the badge at zero and announces it when there is mail", () => {
    const { rerender } = render(<NavRail activeKey="today" badgeCount={0} />);

    expect(screen.queryByLabelText(/tin mới/)).toBeNull();

    rerender(<NavRail activeKey="today" badgeCount={2} />);

    const badge = screen.getByLabelText("2 tin mới từ bạn vườn");

    expect(badge.textContent).toBe("2");
  });

  it("renders the footer slot (the account menu lives there)", () => {
    render(<NavRail activeKey="today" badgeCount={0} footer={<button>Tài khoản</button>} />);

    expect(screen.getByRole("button", { name: "Tài khoản" })).toBeTruthy();
  });

  it("is desktop-only", () => {
    const { container } = render(<NavRail activeKey="today" badgeCount={0} />);

    expect(container.firstElementChild?.className).toContain("hidden");
    expect(container.firstElementChild?.className).toContain("lg:flex");
  });
});
```

- [ ] **Step 2: Viết test BottomTabBar (đang fail)**

`src/components/ui/bottom-tab-bar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BottomTabBar } from "@/components/ui/bottom-tab-bar";

describe("BottomTabBar", () => {
  it("shows all four spaces", () => {
    render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("marks the open space with aria-current", () => {
    render(<BottomTabBar activeKey="friends" badgeCount={0} />);

    expect(screen.getByRole("link", { name: /Bạn vườn/ }).getAttribute("aria-current")).toBe(
      "page"
    );
  });

  it("keeps every tab at a 44px touch target", () => {
    render(<BottomTabBar activeKey="today" badgeCount={0} />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("min-h-[44px]");
    }
  });

  it("shows the badge only when there is mail", () => {
    const { rerender } = render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(screen.queryByLabelText(/tin mới/)).toBeNull();

    rerender(<BottomTabBar activeKey="today" badgeCount={5} />);

    expect(screen.getByLabelText("5 tin mới từ bạn vườn").textContent).toBe("5");
  });

  it("is mobile-only", () => {
    const { container } = render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(container.firstElementChild?.className).toContain("lg:hidden");
  });
});
```

- [ ] **Step 3: Chạy 2 test — phải fail**

```bash
pnpm vitest run src/components/ui/nav-rail.test.tsx src/components/ui/bottom-tab-bar.test.tsx
```

Kỳ vọng: FAIL — không resolve được 2 module.

- [ ] **Step 4: Viết `nav-rail.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_ITEMS, type NavItemKey } from "@/components/app/nav-items";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * The desktop rail (spec §3): wordmark, the four spaces, then whatever the
 * shell puts in `footer` — today the account menu. Mobile gets BottomTabBar.
 */
export function NavRail({
  activeKey,
  badgeCount,
  footer
}: {
  activeKey: NavItemKey | null;
  badgeCount: number;
  footer?: ReactNode;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden w-[200px] shrink-0 flex-col gap-0.5 border-r border-line px-3.5 py-5 lg:flex"
    >
      <span className="mx-3 mb-4 font-display text-base font-extrabold text-ink">
        🌾 Nếp&apos;s Garden
      </span>

      {NAV_ITEMS.map((item) => {
        const active = item.key === activeKey;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-2.5 rounded-control px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
              active
                ? "bg-surface-warm text-action-hover"
                : "text-ink-soft hover:bg-surface-warm hover:text-action-hover"
            )}
            href={item.href}
            key={item.key}
          >
            <Icon as={item.icon} />
            {item.label}
            {item.badge && badgeCount > 0 ? (
              <span
                aria-label={`${badgeCount} tin mới từ bạn vườn`}
                className="ml-auto rounded-pill bg-alert px-1.5 py-0.5 text-[10px] font-bold leading-none text-alert-ink"
                role="status"
              >
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}

      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </nav>
  );
}
```

- [ ] **Step 5: Viết `bottom-tab-bar.tsx`**

```tsx
import Link from "next/link";

import { NAV_ITEMS, type NavItemKey } from "@/components/app/nav-items";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** The mobile tab bar (spec §3). Fixed; the shell pads content to clear it. */
export function BottomTabBar({
  activeKey,
  badgeCount
}: {
  activeKey: NavItemKey | null;
  badgeCount: number;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.key === activeKey;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action",
              active ? "text-action" : "text-ink-soft"
            )}
            href={item.href}
            key={item.key}
          >
            <Icon as={item.icon} />
            {item.label}
            {item.badge && badgeCount > 0 ? (
              <span
                aria-label={`${badgeCount} tin mới từ bạn vườn`}
                className="absolute right-[22%] top-1 rounded-pill bg-alert px-1.5 py-0.5 text-[10px] font-bold leading-none text-alert-ink"
                role="status"
              >
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 6: Chạy 2 test — phải pass**

```bash
pnpm vitest run src/components/ui/nav-rail.test.tsx src/components/ui/bottom-tab-bar.test.tsx
```

Kỳ vọng: PASS 10/10.

- [ ] **Step 7: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/ui/nav-rail.tsx src/components/ui/nav-rail.test.tsx src/components/ui/bottom-tab-bar.tsx src/components/ui/bottom-tab-bar.test.tsx
git commit -m "feat(u0): nav rail and bottom tab bar for the four spaces"
```

---

## Task 7: Tách module `mailbox-seen`

Ba helper mailbox hiện nằm chôn trong `dashboard-client.tsx` và **chưa có test nào**. Tách ra trước khi dời state, để Task 8 chỉ còn là việc di chuyển.

**Files:**
- Create: `src/lib/social/mailbox-seen.ts`
- Test: `src/lib/social/mailbox-seen.test.ts`
- Modify: `src/components/dashboard/dashboard-client.tsx:110-158` (xoá phần đã tách, import từ module mới)

**Interfaces:**
- Consumes: —
- Produces:
  - `const MAILBOX_SEEN_KEY = "betterme.mailboxseen.v1"`
  - `type MailboxSeen = Record<string, string>` (visitId → visitDate ISO)
  - `function loadMailboxSeen(today: string): MailboxSeen`
  - `function saveMailboxSeen(seen: MailboxSeen): void`
  - `function countUnseen(visits: ReadonlyArray<{ visitId: string }>, seen: MailboxSeen): number`

- [ ] **Step 1: Viết test (đang fail)**

`src/lib/social/mailbox-seen.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import {
  countUnseen,
  loadMailboxSeen,
  MAILBOX_SEEN_KEY,
  saveMailboxSeen
} from "@/lib/social/mailbox-seen";

describe("mailbox seen ledger", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a map of celebrated visits", () => {
    saveMailboxSeen({ "visit-1": "2026-07-20" });

    expect(loadMailboxSeen("2026-07-26")).toEqual({ "visit-1": "2026-07-20" });
  });

  it("prunes entries older than the 30-day window", () => {
    window.localStorage.setItem(
      MAILBOX_SEEN_KEY,
      JSON.stringify({ old: "2026-06-01", fresh: "2026-07-20" })
    );

    expect(loadMailboxSeen("2026-07-26")).toEqual({ fresh: "2026-07-20" });
  });

  it("keeps an entry sitting exactly on the cutoff", () => {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify({ edge: "2026-06-26" }));

    expect(loadMailboxSeen("2026-07-26")).toEqual({ edge: "2026-06-26" });
  });

  it("survives junk in storage", () => {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, "not json");
    expect(loadMailboxSeen("2026-07-26")).toEqual({});

    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify(["a"]));
    expect(loadMailboxSeen("2026-07-26")).toEqual({});

    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify({ a: 7 }));
    expect(loadMailboxSeen("2026-07-26")).toEqual({});
  });

  it("returns an empty map when nothing was ever saved", () => {
    expect(loadMailboxSeen("2026-07-26")).toEqual({});
  });

  it("counts only visits that were never celebrated", () => {
    const seen = { "visit-1": "2026-07-20" };

    expect(
      countUnseen([{ visitId: "visit-1" }, { visitId: "visit-2" }, { visitId: "visit-3" }], seen)
    ).toBe(2);
    expect(countUnseen([], seen)).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/lib/social/mailbox-seen.test.ts
```

Kỳ vọng: FAIL — không resolve được module.

- [ ] **Step 3: Viết `src/lib/social/mailbox-seen.ts`**

Chuyển nguyên văn phần logic đang nằm ở `dashboard-client.tsx:110-158`, cộng thêm `countUnseen`:

```ts
/**
 * Mailbox celebration dedupe (social spec §4.2.1): which garden-visit ids have
 * already been celebrated, so a stuck/unacked visit never re-fires the toast +
 * bubble on the next mount. Map visitId -> visitDate, pruned to a 30-day window
 * to match the other ledger horizons.
 */
export const MAILBOX_SEEN_KEY = "betterme.mailboxseen.v1";

const RETENTION_DAYS = 30;

export type MailboxSeen = Record<string, string>;

/** today − days as an ISO YYYY-MM-DD (UTC arithmetic; lexicographically ordered). */
function isoDaysBefore(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}

/** Load the celebrated-visit map, dropping entries older than the window. */
export function loadMailboxSeen(today: string): MailboxSeen {
  try {
    const raw = window.localStorage.getItem(MAILBOX_SEEN_KEY);

    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cutoff = isoDaysBefore(today, RETENTION_DAYS);
    const seen: MailboxSeen = {};

    for (const [visitId, visitDate] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof visitDate === "string" && visitDate >= cutoff) seen[visitId] = visitDate;
    }

    return seen;
  } catch {
    return {};
  }
}

export function saveMailboxSeen(seen: MailboxSeen): void {
  try {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Best-effort: a full/blocked store just means we might re-celebrate later.
  }
}

/** How many of these visits have never been celebrated yet. */
export function countUnseen(
  visits: ReadonlyArray<{ visitId: string }>,
  seen: MailboxSeen
): number {
  return visits.filter((visit) => seen[visit.visitId] === undefined).length;
}
```

- [ ] **Step 4: Xoá bản cũ khỏi `dashboard-client.tsx` và import bản mới**

Xoá từ comment `// Mailbox celebration dedupe (spec §4.2.1)…` tới hết `saveMailboxSeen` (dòng 110–158), rồi thêm import:

```tsx
import { loadMailboxSeen, saveMailboxSeen, type MailboxSeen } from "@/lib/social/mailbox-seen";
```

Phần thân `deliverGardenMailbox` giữ nguyên không đổi một dòng.

- [ ] **Step 5: Chạy test — phải pass**

```bash
pnpm vitest run src/lib/social/mailbox-seen.test.ts
```

Kỳ vọng: PASS 6/6.

- [ ] **Step 6: 4 gates**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

`src/app/dashboard/page.test.tsx` phải vẫn xanh nguyên vẹn — đây là lưới an toàn của bước tách.

- [ ] **Step 7: Commit**

```bash
git add src/lib/social/mailbox-seen.ts src/lib/social/mailbox-seen.test.ts src/components/dashboard/dashboard-client.tsx
git commit -m "refactor(u0): extract the mailbox-seen ledger with tests"
```

---

## Task 8: StateProvider — nâng toàn bộ state ra khỏi `dashboard-client.tsx`

Sau task này app **chạy y hệt**, cùng route `/dashboard`, cùng giao diện; chỉ khác chỗ ở của state.

**Files:**
- Create: `src/components/app/state-provider.tsx`
- Test: `src/components/app/state-provider.test.tsx`
- Modify: `src/components/dashboard/dashboard-client.tsx` (rút gọn thành `<StateProvider><DashboardBody /></StateProvider>`)
- Modify: `src/components/dashboard/dashboard-data.ts` (thêm export `HABIT_CATEGORIES`)

**Interfaces:**
- Consumes: `loadMailboxSeen`, `saveMailboxSeen` (Task 7); mọi hàm sẵn có của `dashboard-data.ts`, `@/lib/sync/*`, `@/lib/server/*`
- Produces: `StateProvider` (client component nhận `{ userEmail: string; children: React.ReactNode }`), `useAppState()` (ném lỗi nếu gọi ngoài provider), và type `AppState`:

```ts
export type AppState = {
  today: string;
  userEmail: string;
  hydrated: boolean;
  viewModel: DashboardViewModel;
  habitDetail: HabitDetail | null;
  syncStatus: SyncStatus;
  showSyncOnboarding: boolean;
  visitingFriendId: string | null;
  bubble: string | null;
  celebrate: boolean;
  eating: boolean;
  toggleHabit: (habitId: string) => void;
  addHabit: (name: string, category: string) => void;
  removeHabit: (habitId: string) => void;
  saveHabitEdit: (habitId: string, name: string, category: string) => void;
  openHabitDetail: (habitId: string) => void;
  closeHabitDetail: () => void;
  addEvent: (input: { title: string; at: string; category: DashboardEvent["category"] }) => void;
  removeEvent: (eventId: string) => void;
  feedPet: () => void;
  petThePet: () => void;
  adoptPet: (species: PetSpecies, name: string) => void;
  switchPet: (species: PetSpecies) => void;
  openGift: () => void;
  visitFriend: (friendUserId: string) => void;
  closeFriendVisit: () => void;
  onGiftSent: () => void;
  speakFairLantern: () => void;
  chooseSync: (mode: InitialUploadMode) => void;
  dismissSync: () => void;
  signOut: () => Promise<void>;
  openProfile: () => void;
  openSettings: () => void;
};
```

- Và `export const HABIT_CATEGORIES: readonly string[]` từ `@/components/dashboard/dashboard-data`.

- [ ] **Step 1: Viết test provider (đang fail)**

`src/components/app/state-provider.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider, useAppState } from "@/components/app/state-provider";

function Probe() {
  const app = useAppState();
  // Seed history already marks most of today done — always grab an OPEN habit,
  // or "tick" would untick and the progress assertions would run backwards.
  const first =
    app.viewModel.habits.find((habit) => !habit.completed) ?? app.viewModel.habits[0];

  return (
    <div>
      <span data-testid="progress">
        {app.viewModel.today.completedHabits}/{app.viewModel.today.totalHabits}
      </span>
      <span data-testid="email">{app.userEmail}</span>
      <span data-testid="sync">{app.syncStatus}</span>
      <button onClick={() => app.toggleHabit(first.id)} type="button">
        tick
      </button>
      <button onClick={() => app.addHabit("Thiền 5 phút", "Reflection")} type="button">
        add
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <StateProvider userEmail="dev@betterme.local">
      <Probe />
    </StateProvider>
  );
}

describe("StateProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("throws when a consumer sits outside the provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/StateProvider/);

    quiet.mockRestore();
  });

  it("exposes the account email and starts with sync disabled", () => {
    renderProbe();

    expect(screen.getByTestId("email").textContent).toBe("dev@betterme.local");
    expect(screen.getByTestId("sync").textContent).toBe("disabled");
  });

  it("ticks a habit and advances the day's progress", () => {
    renderProbe();

    const [done, total] = screen.getByTestId("progress").textContent!.split("/").map(Number);

    fireEvent.click(screen.getByRole("button", { name: "tick" }));

    expect(screen.getByTestId("progress").textContent).toBe(`${done + 1}/${total}`);
  });

  it("unticking is a valid action and goes straight back down", () => {
    renderProbe();

    const before = screen.getByTestId("progress").textContent;

    fireEvent.click(screen.getByRole("button", { name: "tick" }));
    fireEvent.click(screen.getByRole("button", { name: "tick" }));

    expect(screen.getByTestId("progress").textContent).toBe(before);
  });

  it("persists every mutation under the v2 storage key", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    const saved = JSON.parse(window.localStorage.getItem("betterme.dashboard.v2")!);

    expect(saved.habits.some((habit: { name: string }) => habit.name === "Thiền 5 phút")).toBe(
      true
    );
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/components/app/state-provider.test.tsx
```

Kỳ vọng: FAIL — không resolve được `@/components/app/state-provider`.

- [ ] **Step 3: Thêm `HABIT_CATEGORIES` vào `dashboard-data.ts`**

Ngay dưới `categoryLabel` (khoảng dòng 160), thêm:

```ts
/** The categories a habit can be filed under — used by the editor form. */
export const HABIT_CATEGORIES: readonly string[] = [
  "Discipline",
  "Learning",
  "Work",
  "Health",
  "Reflection"
];
```

- [ ] **Step 4: Viết `state-provider.tsx`**

Tạo `src/components/app/state-provider.tsx` bằng cách **chuyển nguyên văn** mọi thứ trong thân `DashboardClient` từ `useState`/`useRef`/`useMemo` đầu tiên cho tới hết `handleOpenSettings` — tức đúng danh sách này, giữ y nguyên thân hàm và comment:

`today` · `state` · `hydrated` · `celebrate` · `eating` · `bubble` · `syncStatus` · `showSyncOnboarding` · `visitingFriendId` · `detailHabitId` · `stateRef` · `engineRef` · `mailboxDeliveredRef` · `bumpedDateRef` · `viewModel` · `activePet` · `habitDetail` · 4 `useEffect` (đồng bộ `stateRef`, hydrate localStorage, persist localStorage, bootstrap sync) · `commitState` · `startSyncEngine` · `markSyncDirty` · `markCompanionDirty` · `deliverGardenMailbox` · `maybeBumpSharedRhythms` · `handleSyncChoice` · `handleSyncDismiss` · `speakAfter` · `toggleHabit` · `feedPet` · `petThePet` · `handleAdopt` · `handleSwitchPet` · `handleOpenGift` · `addHabit` · `removeHabit` · `saveHabitEdit` · `handleSignOut` · `addEvent` · `removeEvent` · `handleOpenProfile` · `handleOpenSettings`.

Hằng `STORAGE_KEY`, `LEGACY_STORAGE_KEY` và hàm `hasSupabaseSession` cũng chuyển sang (nguyên văn). Khung file:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  addEventToState,
  addHabitToState,
  adoptPet as adoptPetInState,
  applyGiftToState,
  buildDashboardViewModel,
  buildHabitDetail,
  checkComebackGift,
  createInitialDashboardState,
  feedActivePet,
  getBondTier,
  getDashboardToday,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift as openGiftInState,
  petActivePet,
  recordGrowthDay,
  removeEventFromState,
  removeHabitFromState,
  switchActivePet,
  toggleHabitForDate,
  updateHabitInState,
  type DashboardEvent,
  type DashboardState,
  type DashboardViewModel,
  type HabitDetail,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";
import { getPetLine, type PetEvent } from "@/components/dashboard/pet-voice";
import {
  loadSyncOptIn,
  saveSyncOptIn,
  shouldAskSyncOptIn,
  snoozeSyncAsk
} from "@/components/dashboard/sync-onboarding";
import {
  ackGardenVisits,
  bumpSharedRhythms,
  getPendingGardenVisits,
  refreshMySummary
} from "@/lib/server/social-actions";
import { fetchSyncSnapshot, pushMutations } from "@/lib/server/sync-actions";
import { loadMailboxSeen, saveMailboxSeen, type MailboxSeen } from "@/lib/social/mailbox-seen";
import { createClient } from "@/lib/supabase/client";
import { createSyncEngine, type SyncEngine } from "@/lib/sync/engine";
import { runSyncOnboarding, type InitialUploadMode } from "@/lib/sync/importer";
import type { SyncStatus } from "@/lib/sync/types";

const STORAGE_KEY = "betterme.dashboard.v2";
const LEGACY_STORAGE_KEY = "betterme.dashboard.v1";

/**
 * True only when a real Supabase browser session exists. Under the dev auth
 * bypass, in tests (no env vars — createClient throws), or when signed out
 * this resolves false and the sync layer stays fully disabled.
 */
async function hasSupabaseSession(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    return data.session !== null;
  } catch {
    return false;
  }
}

export type AppState = { /* …như khối Interfaces ở trên… */ };

const AppStateContext = createContext<AppState | null>(null);

/** Every consumer must sit under the provider — a null context is a bug. */
export function useAppState(): AppState {
  const value = useContext(AppStateContext);

  if (!value) throw new Error("useAppState must be used inside a StateProvider");

  return value;
}

/**
 * Owns all app state: the local-first dashboard state, the sync engine, the
 * companion's voice, and every overlay's open/closed flag. Lifted out of
 * dashboard-client.tsx so the four spaces (spec §3) can each read what they
 * need without owning any of it.
 */
export function StateProvider({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  // …toàn bộ state / refs / effects / handlers chuyển nguyên văn…

  // A fresh object every render — exactly the render behaviour the single
  // dashboard-client component had. Memoising it would risk handing out stale
  // closures over `state`, and buys nothing at this size.
  const value: AppState = {
    today,
    userEmail,
    hydrated,
    viewModel,
    habitDetail,
    syncStatus,
    showSyncOnboarding,
    visitingFriendId,
    bubble,
    celebrate,
    eating,
    toggleHabit,
    addHabit,
    removeHabit,
    saveHabitEdit,
    openHabitDetail: setDetailHabitId,
    closeHabitDetail: () => setDetailHabitId(null),
    addEvent,
    removeEvent,
    feedPet,
    petThePet,
    adoptPet: handleAdopt,
    switchPet: handleSwitchPet,
    openGift: handleOpenGift,
    visitFriend: setVisitingFriendId,
    closeFriendVisit: () => setVisitingFriendId(null),
    onGiftSent: () => void engineRef.current?.hydrate(),
    speakFairLantern,
    chooseSync: handleSyncChoice,
    dismissSync: handleSyncDismiss,
    signOut: handleSignOut,
    openProfile: handleOpenProfile,
    openSettings: handleOpenSettings
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
```

Ba điểm phải bám sát khi chuyển:

1. `adoptPet` và `openGift` của `dashboard-data` bị trùng tên với field context → import dưới alias `adoptPetInState` / `openGiftInState`, và sửa 2 chỗ gọi bên trong `handleAdopt` / `handleOpenGift` cho khớp.
2. `speakFairLantern` là hàm mới, gói lại đúng callback inline đang truyền cho `GardenFairCard.onOwnLantern` trong JSX của `DashboardClient`:

```tsx
  function speakFairLantern() {
    const species = stateRef.current.companion.activeSpecies;
    const pet = species ? stateRef.current.companion.pets[species] : undefined;

    if (species && pet) {
      setBubble(getPetLine(species, getBondTier(pet.bond), "fairLantern"));
    }
  }
```

3. Provider **không** render overlay nào — chỉ `{children}`. Overlay sẽ do AppShell dựng ở Task 9.

- [ ] **Step 5: Rút gọn `dashboard-client.tsx`**

`DashboardClient` chỉ còn bọc provider; toàn bộ JSX cũ chuyển vào `DashboardBody` (cùng file, tạm thời — Task 9 sẽ xoá cả file):

```tsx
export function DashboardClient({ userEmail }: { userEmail: string }) {
  return (
    <StateProvider userEmail={userEmail}>
      <DashboardBody />
    </StateProvider>
  );
}

function DashboardBody() {
  const app = useAppState();
  const { viewModel } = app;

  return (
    // …JSX cũ y nguyên, mỗi handler đọc từ `app`:
    //   onToggle={app.toggleHabit}   onAdd={app.addHabit}   onRemove={app.removeHabit}
    //   onOpenDetail={app.openHabitDetail}   onAdopt={app.adoptPet}   onFeed={app.feedPet}
    //   onPet={app.petThePet}   onSwitch={app.switchPet}   onOpenGift={app.openGift}
    //   onVisitFriend={app.visitFriend}   onOwnLantern={app.speakFairLantern}
    //   bubble={app.bubble}   celebrate={app.celebrate}   eating={app.eating}
    //   syncStatus={app.syncStatus}   userEmail={app.userEmail}   today={app.today}
    // …kể cả 4 overlay ở cuối (SyncOnboarding / HabitDetailOverlay / GardenVisitOverlay
    //   / SyncStatusDot) — vẫn ở đây cho tới Task 9.
  );
}
```

`HABIT_CATEGORIES` giờ import từ `dashboard-data`; xoá bản khai báo `const HABIT_CATEGORIES = [...]` cục bộ ở đầu `dashboard-client.tsx`.

- [ ] **Step 6: Chạy test provider — phải pass**

```bash
pnpm vitest run src/components/app/state-provider.test.tsx
```

Kỳ vọng: PASS 5/5.

- [ ] **Step 7: Chạy test route cũ — phải pass KHÔNG SỬA GÌ**

```bash
pnpm vitest run src/app/dashboard/page.test.tsx
```

Kỳ vọng: PASS 7/7. Đây là bằng chứng "không đổi hành vi". Nếu phải sửa file test này thì việc chuyển đã làm sai đâu đó — dừng lại, tìm nguyên nhân gốc, đừng sửa test cho vừa.

- [ ] **Step 8: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/app/state-provider.tsx src/components/app/state-provider.test.tsx src/components/dashboard/dashboard-client.tsx src/components/dashboard/dashboard-data.ts
git commit -m "refactor(u0): lift all app state into StateProvider"
```

---

## Task 9: AppShell + route group `(app)` + 4 không gian

Task lớn nhất của U0. Kết quả: 4 route thật, nav hoạt động, mỗi panel cũ có nhà mới, `dashboard-client.tsx` biến mất.

**Files:**
- Create: `src/components/dashboard/todays-habits.tsx`, `src/components/dashboard/calendar-panel.tsx`, `src/components/app/sync-status-dot.tsx`, `src/components/app/app-shell.tsx`, `src/components/app/today-page.tsx`, `src/components/app/calendar-page.tsx`, `src/components/app/nep-page.tsx`, `src/components/app/friends-page.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/dashboard/loading.tsx`, `src/app/(app)/calendar/page.tsx`, `src/app/(app)/nep/page.tsx`, `src/app/(app)/friends/page.tsx`
- Create: `src/app/(app)/layout.test.tsx`, `src/components/app/app-shell.test.tsx`
- Modify: `src/components/dashboard/hero-banner.tsx` (bỏ `CompanionPanel`)
- Delete: `src/app/dashboard/` (cả thư mục), `src/components/dashboard/dashboard-client.tsx`

**Interfaces:**
- Consumes: `useAppState` (Task 8), `NavRail`/`BottomTabBar` (Task 6), `activeNavKey` (Task 5)
- Produces:
  - `<AppShell>{children}</AppShell>` — client; dựng rail + header + tab bar + **mọi overlay toàn cục**
  - `<TodayPage />`, `<CalendarPage />`, `<NepPage />`, `<FriendsPage />` — client, không nhận prop
  - `<SyncStatusDot status={SyncStatus} />`
  - `<TodaysHabits habits onAdd onOpenDetail onRemove onToggle viewModel />`
  - `<CalendarPanel days viewModel />`
  - `<HeroBanner celebrate viewModel />` — **đổi chữ ký**: bỏ hết prop companion (`bubble`, `eating`, `onAdopt`, `onFeed`, `onOpenGift`, `onPet`, `onSwitch`)

**Bản đồ "nhà mới" của từng component cũ**

| Component | Nhà mới |
|---|---|
| `HeroBanner` (đã bỏ pet) | `/dashboard` |
| `TodaysHabits` | `/dashboard` |
| `WeatherCard`, `SpotifyCard` | `/dashboard` (cột phải như cũ) |
| `CalendarPanel`, `EventsCard`, `AnalyticsPanel` | `/calendar` |
| `CompanionPanel` | `/nep` |
| `FriendsCard`, `GardenFairCard` | `/friends` |
| `SyncOnboarding`, `HabitDetailOverlay`, `GardenVisitOverlay`, `SyncStatusDot` | `AppShell` (toàn cục) |
| `ProfileMenu` | `AppShell` — chân rail ở desktop, header ở mobile |
| `SiteFooter` | `AppShell` |

- [ ] **Step 1: Viết test layout (đang fail)**

`src/app/(app)/layout.test.tsx` — chuyển 2 case auth từ `src/app/dashboard/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppLayout from "@/app/(app)/layout";
import HomePage from "@/app/page";

const authMocks = vi.hoisted(() => ({
  ensureUserBootstrap: vi.fn(),
  getUser: vi.fn()
}));
const envMocks = vi.hoisted(() => ({ devBypass: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/dashboard"
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: authMocks.getUser } }))
}));

vi.mock("@/lib/server/actions", () => ({
  ensureUserBootstrap: authMocks.ensureUserBootstrap
}));

vi.mock("@/lib/dev-auth", () => ({ isDevAuthBypassEnabled: envMocks.devBypass }));

describe("(app) layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    envMocks.devBypass.mockReturnValue(false);
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects guests to login", async () => {
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await AppLayout({ children: <p>nội dung</p> });

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(result).toBeNull();
    expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
  });

  it("lets a dev-bypass guest in without bootstrapping the account", async () => {
    envMocks.devBypass.mockReturnValue(true);
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    render(await AppLayout({ children: <p>nội dung</p> }));

    expect(redirect).not.toHaveBeenCalled();
    expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
    // The account menu is rendered twice — rail footer (desktop) and header
    // (mobile). JSDOM applies no media query, so both are in the tree.
    expect(screen.getAllByText("dev@betterme.local").length).toBe(2);
    expect(screen.getByText("nội dung")).toBeTruthy();
  });

  it("bootstraps the account for a real session", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "thien@example.com" } },
      error: null
    });

    render(await AppLayout({ children: <p>nội dung</p> }));

    expect(authMocks.ensureUserBootstrap).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("thien@example.com").length).toBe(2);
  });

  it("wraps every space in the four-item navigation", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "thien@example.com" } },
      error: null
    });

    render(await AppLayout({ children: <p>nội dung</p> }));

    for (const label of ["Hôm nay", "Lịch & nhịp", "Nhà của Nếp", "Bạn vườn"]) {
      expect(screen.getAllByRole("link", { name: new RegExp(label) }).length).toBe(2);
    }
  });

  it("uses the dashboard as the default landing route", () => {
    HomePage();

    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/dashboard");
  });
});
```

> `length` là **2** vì mỗi mục xuất hiện ở cả rail lẫn tab bar — JSDOM không áp dụng media query nên cả hai cùng render.

- [ ] **Step 2: Viết test shell + 4 không gian (đang fail)**

`src/components/app/app-shell.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/app-shell";
import { CalendarPage } from "@/components/app/calendar-page";
import { FriendsPage } from "@/components/app/friends-page";
import { NepPage } from "@/components/app/nep-page";
import { StateProvider } from "@/components/app/state-provider";
import { TodayPage } from "@/components/app/today-page";
import {
  adoptPet,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";

const routeMock = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => routeMock.pathname,
  redirect: vi.fn()
}));

function renderSpace(pathname: string, page: React.ReactNode) {
  routeMock.pathname = pathname;

  return render(
    <StateProvider userEmail="thien@example.com">
      <AppShell>{page}</AppShell>
    </StateProvider>
  );
}

describe("the four spaces", () => {
  beforeEach(() => {
    window.localStorage.clear();
    routeMock.pathname = "/dashboard";
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("Hôm nay keeps the greeting, the habit list and both widgets", () => {
    renderSpace("/dashboard", <TodayPage />);

    expect(screen.getByRole("heading", { name: /chào buổi .*sếp ơi/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Thói quen hôm nay" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nhạc tập trung" })).toBeTruthy();
    // The pet moved out of the hero and into its own space (spec §3).
    expect(screen.queryByLabelText("Chọn trứng Cún con")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Lịch tháng" })).toBeNull();
  });

  it("marks Hôm nay as the current space", () => {
    renderSpace("/dashboard", <TodayPage />);

    for (const link of screen.getAllByRole("link", { name: /Hôm nay/ })) {
      expect(link.getAttribute("aria-current")).toBe("page");
    }
  });

  it("Lịch & nhịp holds the month, the events and the analytics", () => {
    renderSpace("/calendar", <CalendarPage />);

    expect(screen.getByRole("heading", { name: "Lịch tháng" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sự kiện sắp tới" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phân tích" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Thói quen hôm nay" })).toBeNull();
  });

  it("Nhà của Nếp offers the adoption eggs on a first run", () => {
    renderSpace("/nep", <NepPage />);

    expect(screen.getByLabelText("Chọn trứng Cún con")).toBeTruthy();
    expect(screen.getByLabelText("Chọn trứng Mèo con")).toBeTruthy();
  });

  it("Nhà của Nếp restores an adopted pet and feeds it", () => {
    const today = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v2",
      JSON.stringify(adoptPet(createInitialDashboardState(today), "cat", "Mochi", today))
    );

    renderSpace("/nep", <NepPage />);

    expect(screen.getByLabelText(/Bé mèo Mochi, giai đoạn sơ sinh/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cho ăn" })).toBeTruthy();
  });

  it("Bạn vườn invites the signed-out visitor to turn sync on", () => {
    renderSpace("/friends", <FriendsPage />);

    expect(screen.getByRole("heading", { name: "Vườn của bạn bè" })).toBeTruthy();
    // Exact match: a regex would also hit the wrapping <p> and blow up on
    // "found multiple elements".
    expect(screen.getByText("bật đồng bộ").tagName).toBe("STRONG");
  });

  it("opens a habit's detail overlay from the shell, then closes it", () => {
    renderSpace("/dashboard", <TodayPage />);

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết thói quen Dậy đúng giờ" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Dậy đúng giờ" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Đóng chi tiết thói quen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ticking on Hôm nay pays the pet visible on Nhà của Nếp", () => {
    const today = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v2",
      JSON.stringify(adoptPet(createInitialDashboardState(today), "cat", "Mochi", today))
    );

    const { unmount } = renderSpace("/dashboard", <TodayPage />);
    const unchecked = screen
      .getAllByRole("button", { pressed: false })
      .find((button) => button.className.includes("min-h-16"));

    expect(unchecked).toBeTruthy();
    fireEvent.click(unchecked!);
    unmount();

    renderSpace("/nep", <NepPage />);
    expect(screen.getByLabelText("2 món ăn trong tủ")).toBeTruthy();
  });

  it("keeps the account menu and the footer on every space", () => {
    renderSpace("/calendar", <CalendarPage />);

    expect(
      screen.getAllByRole("button", { name: /thien@example\.com/i })[0].getAttribute("aria-haspopup")
    ).toBe("menu");
    expect(screen.getByRole("link", { name: /manhthien2005/i })).toBeTruthy();
  });
});
```

> Case cuối cùng ("ticking … pays the pet") là bằng chứng state thật sự dùng chung giữa các không gian: tick ở `/dashboard` → 1 món + 1 thưởng ngày trọn vẹn (seed đứng ở 6/7) đọc được ở `/nep`.

- [ ] **Step 3: Chạy 2 test — phải fail**

```bash
pnpm vitest run layout.test app-shell.test
```

Kỳ vọng: FAIL — chưa có module nào.

- [ ] **Step 4: Tách `TodaysHabits` sang file riêng**

Tạo `src/components/dashboard/todays-habits.tsx` với `"use client";` ở đầu, chuyển **nguyên văn** 4 hàm `TodaysHabits`, `findEasyWin`, `HabitRow`, `StatusBadge` từ `dashboard-client.tsx`. Export duy nhất `TodaysHabits`. Import cần: `useState` từ react; `CirclePlus, Check, Pencil, X, BarChart3` từ lucide-react; `Button`; `cn, formatPercent`; `habitEmoji, habitIconBubbleClass`; và từ `dashboard-data`: `categoryLabel`, `HABIT_CATEGORIES`, `STATUS_LABELS`, `type DashboardHabitView`, `type DashboardStatus`, `type DashboardViewModel`.

- [ ] **Step 5: Tách `CalendarPanel` sang file riêng**

Tạo `src/components/dashboard/calendar-panel.tsx` với `"use client";`, chuyển nguyên văn 3 hàm `CalendarPanel`, `calendarCellStyle`, `getCalendarFill`. Export duy nhất `CalendarPanel`. Import cần: `cn`, `formatPercent`; và từ `dashboard-data`: `STATUS_LABELS`, `type DashboardCalendarDay`, `type DashboardStatus`, `type DashboardViewModel`.

- [ ] **Step 6: Tách `SyncStatusDot` sang file riêng**

Tạo `src/components/app/sync-status-dot.tsx`, chuyển nguyên văn hằng `SYNC_DOT` và component `SyncStatusDot`. Import cần: `cn` và `type SyncStatus` từ `@/lib/sync/types`.

- [ ] **Step 7: Bỏ pet khỏi `HeroBanner`**

Trong `src/components/dashboard/hero-banner.tsx`: xoá import `CompanionPanel`/`CompanionHandlers`, đổi chữ ký thành

```tsx
export function HeroBanner({
  celebrate,
  viewModel
}: {
  celebrate: boolean;
  viewModel: DashboardViewModel;
}) {
```

và xoá nguyên khối `<div className="flex justify-center lg:pr-2"> … </div>` chứa `<CompanionPanel … />`. Giữ nguyên `<CelebrationOverlay show={celebrate} />` và mọi thứ khác; đổi `lg:flex-row lg:items-center lg:justify-between` của khối bọc thành `lg:items-center` nếu layout hụt — hero giờ chỉ còn 1 cột.

> Hệ quả có chủ đích: bong bóng thoại của Nếp sống trong `CompanionPanel` nên từ U0 nó chỉ hiện ở `/nep`. U2 dựng lại hero bầu trời (có câu nói của Nếp) và U4.4 thêm thẻ Nếp thu gọn ở cột phải desktop — lúc đó tiếng nói quay lại `/dashboard`.

- [ ] **Step 8: Viết 4 page component**

`src/components/app/today-page.tsx`:

```tsx
"use client";

import { useAppState } from "@/components/app/state-provider";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { SpotifyCard } from "@/components/dashboard/spotify-card";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { WeatherCard } from "@/components/dashboard/weather-card";

/** 🏠 Hôm nay — the check-in space (spec §4). */
export function TodayPage() {
  const app = useAppState();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
      <div className="grid grid-cols-1 gap-5">
        <HeroBanner celebrate={app.celebrate} viewModel={app.viewModel} />
        <TodaysHabits
          habits={app.viewModel.habits}
          onAdd={app.addHabit}
          onOpenDetail={app.openHabitDetail}
          onRemove={app.removeHabit}
          onToggle={app.toggleHabit}
          viewModel={app.viewModel}
        />
      </div>
      <aside aria-label="Thời tiết và nhạc tập trung" className="grid gap-5 xl:sticky xl:top-5">
        <WeatherCard />
        <SpotifyCard />
      </aside>
    </div>
  );
}
```

`src/components/app/calendar-page.tsx`:

```tsx
"use client";

import { useAppState } from "@/components/app/state-provider";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { CalendarPanel } from "@/components/dashboard/calendar-panel";
import { EventsCard } from "@/components/dashboard/events-card";

/** 📅 Lịch & nhịp — the month, what's coming, and the numbers (spec §8). */
export function CalendarPage() {
  const app = useAppState();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
      <CalendarPanel days={app.viewModel.calendar.days} viewModel={app.viewModel} />
      <EventsCard
        events={app.viewModel.events}
        onAdd={app.addEvent}
        onRemove={app.removeEvent}
        today={app.today}
      />
      <div className="xl:col-span-2">
        <AnalyticsPanel viewModel={app.viewModel} />
      </div>
    </div>
  );
}
```

`src/components/app/nep-page.tsx`:

```tsx
"use client";

import { useAppState } from "@/components/app/state-provider";
import { CompanionPanel } from "@/components/dashboard/companion-panel";

/** 🐌 Nhà của Nếp — the companion's own space (spec §3, §6). */
export function NepPage() {
  const app = useAppState();

  return (
    <div className="flex justify-center">
      <CompanionPanel
        bubble={app.bubble}
        celebrate={app.celebrate}
        eating={app.eating}
        onAdopt={app.adoptPet}
        onFeed={app.feedPet}
        onOpenGift={app.openGift}
        onPet={app.petThePet}
        onSwitch={app.switchPet}
        viewModel={app.viewModel}
      />
    </div>
  );
}
```

`src/components/app/friends-page.tsx`:

```tsx
"use client";

import { useAppState } from "@/components/app/state-provider";
import { FriendsCard } from "@/components/dashboard/friends-card";
import { GardenFairCard } from "@/components/dashboard/garden-fair";
import { Card } from "@/components/ui/card";

/**
 * 🏡 Bạn vườn — the social layer rides on sync (social spec §3.3), so signed
 * out or under the dev bypass the space stays in the nav and explains itself
 * instead of disappearing (spec §3).
 */
export function FriendsPage() {
  const app = useAppState();

  if (app.syncStatus === "disabled") {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-lg font-bold text-ink">Vườn của bạn bè</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink-soft">
          Khu vườn của bạn đang được giữ ngay trên máy này. Khi bạn đăng nhập và{" "}
          <strong className="font-semibold text-ink">bật đồng bộ</strong>, Nếp sẽ mở lối sang
          vườn của bạn bè — để cùng ghé thăm, cổ vũ và giữ nhịp chung.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <FriendsCard onVisitFriend={app.visitFriend} />
      <GardenFairCard onOwnLantern={app.speakFairLantern} />
    </div>
  );
}
```

- [ ] **Step 9: Viết `app-shell.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { activeNavKey } from "@/components/app/nav-items";
import { useAppState } from "@/components/app/state-provider";
import { SyncStatusDot } from "@/components/app/sync-status-dot";
import { GardenVisitOverlay } from "@/components/dashboard/garden-visit-overlay";
import { HabitDetailOverlay } from "@/components/dashboard/habit-detail-overlay";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { SyncOnboarding } from "@/components/dashboard/sync-onboarding";
import { HABIT_CATEGORIES } from "@/components/dashboard/dashboard-data";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { NavRail } from "@/components/ui/nav-rail";

/**
 * The frame every space lives in (spec §3): a fixed rail on desktop, a bottom
 * tab bar on mobile, and every global overlay. Spaces themselves render only
 * their own content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const app = useAppState();
  const activeKey = activeNavKey(usePathname() ?? "");

  const accountMenu = (
    <ProfileMenu
      email={app.userEmail}
      onOpenProfile={app.openProfile}
      onOpenSettings={app.openSettings}
      onSignOut={app.signOut}
    />
  );

  return (
    <div className="flex min-h-screen">
      <NavRail activeKey={activeKey} badgeCount={0} footer={accountMenu} />

      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface-page/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <span className="font-display text-base font-extrabold text-ink">
            🌾 Nếp&apos;s Garden
          </span>
          {accountMenu}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>

        <div className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-0">
          <SiteFooter />
        </div>
      </div>

      <BottomTabBar activeKey={activeKey} badgeCount={0} />

      <SyncStatusDot status={app.syncStatus} />

      {app.showSyncOnboarding ? (
        <SyncOnboarding onChoose={app.chooseSync} onDismiss={app.dismissSync} />
      ) : null}

      {app.habitDetail ? (
        <HabitDetailOverlay
          categories={[...HABIT_CATEGORIES]}
          detail={app.habitDetail}
          onClose={app.closeHabitDetail}
          onRemove={(habitId) => {
            app.removeHabit(habitId);
            app.closeHabitDetail();
          }}
          onSave={app.saveHabitEdit}
        />
      ) : null}

      {app.visitingFriendId ? (
        <GardenVisitOverlay
          hostUserId={app.visitingFriendId}
          myFood={app.viewModel.companion.food}
          onClose={app.closeFriendVisit}
          onGiftSent={app.onGiftSent}
        />
      ) : null}
    </div>
  );
}
```

> `badgeCount={0}` là tạm — Task 10 nối vào số tin thật ngay sau đây.

- [ ] **Step 10: Viết route group `(app)`**

`src/app/(app)/layout.tsx` — chuyển logic auth nguyên văn từ `src/app/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { StateProvider } from "@/components/app/state-provider";
import { ensureUserBootstrap } from "@/lib/server/actions";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

/** Auth gate + the frame for all four spaces (spec §3). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const devAuthBypassEnabled = isDevAuthBypassEnabled();
  const supabase = await createClient();
  let user = null;
  let error = null;

  // Supabase unreachable must degrade to "no session", never a crashed page —
  // the app itself runs from localStorage.
  try {
    ({
      data: { user },
      error
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

  if (error || !user) {
    if (devAuthBypassEnabled) {
      return (
        <StateProvider userEmail="dev@betterme.local">
          <AppShell>{children}</AppShell>
        </StateProvider>
      );
    }

    redirect("/login");
    return null;
  }

  await ensureUserBootstrap();

  return (
    <StateProvider userEmail={user.email ?? "BetterMe"}>
      <AppShell>{children}</AppShell>
    </StateProvider>
  );
}
```

`src/app/(app)/dashboard/page.tsx`:

```tsx
import { TodayPage } from "@/components/app/today-page";

export default function DashboardRoute() {
  return <TodayPage />;
}
```

`src/app/(app)/calendar/page.tsx`:

```tsx
import { CalendarPage } from "@/components/app/calendar-page";

export default function CalendarRoute() {
  return <CalendarPage />;
}
```

`src/app/(app)/nep/page.tsx`:

```tsx
import { NepPage } from "@/components/app/nep-page";

export default function NepRoute() {
  return <NepPage />;
}
```

`src/app/(app)/friends/page.tsx`:

```tsx
import { FriendsPage } from "@/components/app/friends-page";

export default function FriendsRoute() {
  return <FriendsPage />;
}
```

`src/app/(app)/dashboard/loading.tsx` — chuyển nguyên văn từ `src/app/dashboard/loading.tsx`:

```tsx
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
```

- [ ] **Step 11: Xoá route và client cũ**

```bash
git rm -r src/app/dashboard src/components/dashboard/dashboard-client.tsx
```

- [ ] **Step 12: Chạy 2 test mới — phải pass**

```bash
pnpm vitest run layout.test app-shell.test
```

Kỳ vọng: PASS 5/5 + 9/9.

- [ ] **Step 13: 4 gates**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

Ở bước build, kiểm cả output route list: phải thấy `/dashboard`, `/calendar`, `/nep`, `/friends`, `/login`.

- [ ] **Step 14: Xem bằng mắt trên dev server**

Dừng build, chạy `pnpm dev` với `BETTERME_DEV_AUTH_BYPASS=true`, kiểm:
- Desktop ≥1024px: rail trái 4 mục, mục đang mở nhuộm mật ong, ProfileMenu ở chân rail.
- Thu cửa sổ <1024px: rail biến mất, header có wordmark + ProfileMenu, tab bar dưới 4 mục, nội dung không bị tab bar che.
- Bấm qua đủ 4 route; tick 1 habit ở Hôm nay rồi sang Nhà của Nếp — số món ăn đã tăng.
- Không có thanh cuộn ngang ở bất kỳ bề rộng nào.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat(u0): four spaces behind a nav shell — /dashboard, /calendar, /nep, /friends"
```

---

## Task 10: Badge tin mới từ Bạn vườn

**Files:**
- Modify: `src/components/app/state-provider.tsx` (thêm `newSocialCount` + `clearSocialBadge`)
- Modify: `src/components/app/app-shell.tsx` (`badgeCount={0}` → `badgeCount={app.newSocialCount}`)
- Modify: `src/components/app/friends-page.tsx` (xoá badge khi ghé thăm)
- Test: `src/components/app/social-badge.test.tsx` (tạo mới)

**Interfaces:**
- Consumes: `countUnseen` (Task 7), `getPendingGardenVisits`
- Produces: `AppState` có thêm `newSocialCount: number` và `clearSocialBadge: () => void`. Nguồn số: số garden-visit **chưa từng được chào** tìm thấy trong lượt giao hộp thư của phiên này; về 0 khi người dùng mở `/friends`.

- [ ] **Step 1: Viết test (đang fail)**

`src/components/app/social-badge.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/app-shell";
import { FriendsPage } from "@/components/app/friends-page";
import { StateProvider } from "@/components/app/state-provider";
import { TodayPage } from "@/components/app/today-page";

const routeMock = vi.hoisted(() => ({ pathname: "/dashboard" }));
const socialMocks = vi.hoisted(() => ({
  getPendingGardenVisits: vi.fn(),
  ackGardenVisits: vi.fn(async () => ({ ok: true as const })),
  bumpSharedRhythms: vi.fn(async () => ({ ok: true as const, advanced: 0 })),
  refreshMySummary: vi.fn(async () => ({ ok: true as const }))
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routeMock.pathname,
  redirect: vi.fn()
}));

vi.mock("@/lib/server/social-actions", () => socialMocks);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "u1" } } } }),
      signOut: async () => ({})
    }
  })
}));

vi.mock("@/lib/sync/engine", () => ({
  createSyncEngine: () => ({
    hydrate: async () => {},
    markDirty: () => {},
    getStatus: () => "idle",
    dispose: () => {}
  })
}));

// With sync alive, Bạn vườn renders the two social cards — and they call server
// actions this file deliberately does not mock. Stub them: what's under test is
// the badge, not their content (they have their own tests).
vi.mock("@/components/dashboard/friends-card", () => ({
  FriendsCard: () => <div data-testid="friends-card" />
}));

vi.mock("@/components/dashboard/garden-fair", () => ({
  GardenFairCard: () => <div data-testid="garden-fair" />
}));

/** A full VisitEntry (src/lib/server/social-actions.ts) — no gift, so the
    mailbox pass changes no state and only the badge is under test. */
function visit(visitId: string) {
  return {
    visitId,
    visitorUserId: `visitor-${visitId}`,
    visitorPetName: null,
    visitorPetSpecies: null,
    visitDate: "2026-07-26",
    giftedFood: 0,
    cheeredMilestoneId: null,
    appliedAt: null
  };
}

describe("new-mail badge", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // A prior opt-in is what lets the engine (and the mailbox) come alive.
    window.localStorage.setItem("betterme.syncoptin.v1", "fresh");
    routeMock.pathname = "/dashboard";
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    socialMocks.getPendingGardenVisits.mockResolvedValue({
      ok: true,
      visits: [visit("v1"), visit("v2")]
    });
  });

  it("counts visits that were never celebrated", async () => {
    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <TodayPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByLabelText("2 tin mới từ bạn vườn").length).toBeGreaterThan(0);
    });
  });

  it("stays silent when every visit was already celebrated", async () => {
    window.localStorage.setItem(
      "betterme.mailboxseen.v1",
      JSON.stringify({ v1: "2026-07-26", v2: "2026-07-26" })
    );

    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <TodayPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(socialMocks.getPendingGardenVisits).toHaveBeenCalled();
    });
    expect(screen.queryByLabelText(/tin mới/)).toBeNull();
  });

  it("never shows the badge while Bạn vườn is the open space", async () => {
    // The mailbox lands after mount — the badge must not flash into existence
    // on the very page that counts as reading it.
    routeMock.pathname = "/friends";

    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <FriendsPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(socialMocks.getPendingGardenVisits).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByLabelText(/tin mới/)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Chạy test — phải fail**

```bash
pnpm vitest run src/components/app/social-badge.test.tsx
```

Kỳ vọng: FAIL ở case 1 — badge chưa bao giờ xuất hiện vì `badgeCount` đang hardcode 0.

- [ ] **Step 3: Thêm số đếm vào provider**

Trong `state-provider.tsx`: thêm state, đặt số trong `deliverGardenMailbox`, và expose 2 field mới.

```tsx
  const [newSocialCount, setNewSocialCount] = useState(0);
```

Trong `deliverGardenMailbox`, ngay sau dòng tính `unseen` hiện có:

```tsx
    const seen = loadMailboxSeen(today);
    const unseen = result.visits.filter((visit) => seen[visit.visitId] === undefined);

    // The nav badge counts exactly what the collective toast greets (spec §3).
    setNewSocialCount(unseen.length);
```

Khai báo hàm xoá badge với identity ổn định — `friends-page.tsx` dùng nó làm dependency của một `useEffect`:

```tsx
  // Stable identity: the Bạn vườn effect depends on it.
  const clearSocialBadge = useCallback(() => setNewSocialCount(0), []);
```

Và trong object context value, thêm 2 field:

```tsx
    newSocialCount,
    clearSocialBadge,
```

Bổ sung 2 field vào `type AppState`:

```ts
  /** Unseen garden visits found in this session's mailbox pass. */
  newSocialCount: number;
  clearSocialBadge: () => void;
```

- [ ] **Step 4: Nối badge vào shell**

Trong `app-shell.tsx`, đổi cả 2 chỗ:

```tsx
      <NavRail activeKey={activeKey} badgeCount={app.newSocialCount} footer={accountMenu} />
```

```tsx
      <BottomTabBar activeKey={activeKey} badgeCount={app.newSocialCount} />
```

- [ ] **Step 5: Xoá badge khi mở Bạn vườn**

Trong `friends-page.tsx`, thêm import `useEffect` và, ngay sau `const app = useAppState();`:

```tsx
  const { clearSocialBadge, newSocialCount } = app;

  // Having this space open IS reading the mail (spec §3). It watches the count
  // rather than firing once on mount, because the mailbox pass resolves
  // asynchronously and may land AFTER this page mounted.
  useEffect(() => {
    if (newSocialCount > 0) clearSocialBadge();
  }, [clearSocialBadge, newSocialCount]);
```

> Effect này phải đứng **trên** nhánh `if (app.syncStatus === "disabled") return …` — hook không được gọi có điều kiện. Vòng lặp không xảy ra: `setNewSocialCount(0)` khi giá trị đã là 0 thì React bỏ qua render.

- [ ] **Step 6: Chạy test — phải pass**

```bash
pnpm vitest run src/components/app/social-badge.test.tsx
```

Kỳ vọng: PASS 3/3.

- [ ] **Step 7: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add src/components/app/state-provider.tsx src/components/app/app-shell.tsx src/components/app/friends-page.tsx src/components/app/social-badge.test.tsx
git commit -m "feat(u0): new-mail badge on the Bạn vườn nav item"
```

---

## Task 11: Cập nhật tài liệu agent + handoff

**Files:**
- Modify: `AGENTS.md` (mục "Project map", dòng "Current state")
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: kết quả Task 1–10
- Produces: —

- [ ] **Step 1: Sửa "Project map" trong `AGENTS.md`**

Thay 2 gạch đầu dòng đầu bằng:

```markdown
- `src/app/**` — App Router routes. The four spaces live in the `(app)` route group
  (`/dashboard`, `/calendar`, `/nep`, `/friends`) behind one auth gate in `(app)/layout.tsx`;
  plus `/login` and `/auth/callback`. Server Components by default.
- `src/components/app/**` — the shell: `state-provider.tsx` (ALL app state + the sync engine),
  `app-shell.tsx` (nav rail / tab bar / global overlays), `nav-items.ts`, and one file per space.
- `src/components/ui/**` — design-token primitives: `button.tsx` (3 tiers), `card.tsx`, `chip.tsx`,
  `icon.tsx`, `nav-rail.tsx`, `bottom-tab-bar.tsx`.
- `src/components/dashboard/**` — panels: `dashboard-data.ts` (pure state + pet economy),
  `todays-habits.tsx`, `calendar-panel.tsx`, `pet.tsx` / `pet-voice.ts`, `friends-card.tsx`,
  `garden-visit-overlay.tsx`, `sync-onboarding.tsx`.
```

- [ ] **Step 2: Thêm mục quy ước design token vào `AGENTS.md`**

Chèn vào cuối phần "Conventions":

```markdown
- **Design tokens** live in `src/app/globals.css` `:root` and are mapped in `tailwind.config.ts`
  as `var(--token)`. Colour is a role: `--action` is the ONLY primary/streak/link colour (max one
  primary button per region), `--success` is completion, `--alert` is the new-mail badge and
  nothing else. `--success` is a FILL — text uses `--success-ink`. Never use a Tailwind opacity
  modifier on a token colour (`bg-action/10` does not work with `var()`); add a token instead.
  `src/app/design-tokens.test.ts` gates presence + AA contrast. The v2 palette
  (rice/matcha/sakura) is still in the config and retires surface by surface across U1–U4.
```

- [ ] **Step 3: Cập nhật dòng "Current state" trong `AGENTS.md`**

Thay bằng con số test thật sau khi chạy `pnpm vitest run` (đọc từ output, không đoán), ví dụ:

```markdown
Current state: branch `main`, <N> tests green. Social Garden Phases 0–3 committed; auth is live.
UI overhaul step U0 (tokens, fonts, `ui/` primitives, four-space shell) is done — see
`docs/superpowers/specs/2026-07-26-uiux-overhaul-design.md` §10 for U1–U4.
```

- [ ] **Step 4: Cập nhật `HANDOFF.md`**

Thêm mục U0 vào phần tiến độ: 4 route mới + bảng "nhà mới" của từng component ở Task 9, 3 quyết định trong mục "Quyết định trong lúc lập plan" của plan này, và các khoản đã hoãn (`TabSwitch`/`ProgressRing` → U2). Ghi rõ bước kế tiếp là U1 (habit model v3 + migration + editor + day view mới) và nhắc owner **export JSON localStorage trước khi thử data thật ở U1**.

- [ ] **Step 5: 4 gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

```bash
git add AGENTS.md HANDOFF.md
git commit -m "docs: U0 shipped — four spaces, token system, agent map refresh"
```

---

## Kiểm tra cuối U0 (làm trước khi báo owner duyệt)

- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm vitest run` · `pnpm build` — dán output thật làm bằng chứng, không nói suông.
- [ ] Số test khớp phép tính: baseline 243 − 8 test bị thay (1 của `typography.test.ts`, 7 của `dashboard/page.test.tsx`) + 68 test mới (T1 5 · T2 3 · T3 5 · T4 11 · T5 6 · T6 10 · T7 6 · T8 5 · T9 14 · T10 3) = **303**. Lệch thì tìm nguyên nhân, đừng chỉnh con số. **Không test cũ nào bị xoá hay nới lỏng** ngoài 8 test đã thay ở trên.
- [ ] `grep` toàn repo: không còn `dashboard-client`, không còn `variant="outline"`, không còn `meadow`.
- [ ] Dev server, dev-bypass: 4 route mở được, tick habit ở `/dashboard` cộng món ăn thấy được ở `/nep`, không có cuộn ngang ở 360px / 768px / 1440px.
- [ ] Bàn phím: Tab đi hết rail → nội dung → tab bar; focus ring nhìn thấy rõ trên mọi nền.
- [ ] Không có copy mới nào vi phạm no-guilt (chỉ có 1 đoạn mới: empty-state Bạn vườn).
