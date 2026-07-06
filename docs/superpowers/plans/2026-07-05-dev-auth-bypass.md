# Dev Auth Bypass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-development auth bypass so the dashboard can be viewed without Supabase magic links.

**Architecture:** Add one pure helper for deciding whether bypass is enabled. Server routes use the helper to keep production closed, and the login form receives an explicit prop so client UI does not inspect server env directly.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Testing Library.

## Global Constraints

- Bypass must be active only when `BETTERME_DEV_AUTH_BYPASS=true` and `NODE_ENV !== "production"`.
- Dashboard must skip `ensureUserBootstrap()` in bypass mode.
- Existing Supabase login behavior must remain unchanged when bypass is disabled.
- Production must ignore the bypass flag.

---

### Task 1: Test Dev Bypass Gate

**Files:**
- Create: `src/lib/dev-auth.ts`
- Create: `src/lib/dev-auth.test.ts`

**Interfaces:**
- Produces: `isDevAuthBypassEnabled(env?: NodeJS.ProcessEnv): boolean`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";

import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

describe("isDevAuthBypassEnabled", () => {
  it("enables bypass only outside production when flag is true", () => {
    expect(
      isDevAuthBypassEnabled({
        BETTERME_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "development"
      } as NodeJS.ProcessEnv)
    ).toBe(true);
  });

  it("stays disabled without the flag", () => {
    expect(
      isDevAuthBypassEnabled({
        NODE_ENV: "development"
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });

  it("stays disabled in production even when flag is true", () => {
    expect(
      isDevAuthBypassEnabled({
        BETTERME_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "production"
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run red test**

Run: `pnpm run test -- src/lib/dev-auth.test.ts`

Expected: FAIL because `src/lib/dev-auth.ts` does not exist.

- [ ] **Step 3: Implement helper**

```ts
export function isDevAuthBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" && env.BETTERME_DEV_AUTH_BYPASS === "true";
}
```

- [ ] **Step 4: Run green test**

Run: `pnpm run test -- src/lib/dev-auth.test.ts`

Expected: PASS.

### Task 2: Wire Login And Dashboard Routes

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/app/login/page.test.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/page.test.tsx`
- Modify: `.env.local`

**Interfaces:**
- Consumes: `isDevAuthBypassEnabled()`
- Produces: dev action on login and dev dashboard rendering when enabled.

- [ ] **Step 1: Add failing route tests**

Login test:

```ts
const envMocks = vi.hoisted(() => ({
  devBypass: vi.fn()
}));

vi.mock("@/lib/dev-auth", () => ({
  isDevAuthBypassEnabled: envMocks.devBypass
}));
```

Set `envMocks.devBypass.mockReturnValue(false)` in `beforeEach`.

Add:

```ts
it("shows the dev bypass action when enabled", async () => {
  envMocks.devBypass.mockReturnValue(true);
  authMocks.getUser.mockResolvedValue({
    data: { user: null },
    error: null
  });

  render(await LoginPage());

  expect(screen.getByRole("link", { name: "Continue as dev" }).getAttribute("href")).toBe(
    "/dashboard"
  );
});
```

Dashboard test:

```ts
const envMocks = vi.hoisted(() => ({
  devBypass: vi.fn()
}));

vi.mock("@/lib/dev-auth", () => ({
  isDevAuthBypassEnabled: envMocks.devBypass
}));
```

Set `envMocks.devBypass.mockReturnValue(false)` in `beforeEach`.

Add:

```ts
it("renders the dashboard for a dev bypass guest", async () => {
  envMocks.devBypass.mockReturnValue(true);
  authMocks.getUser.mockResolvedValue({
    data: { user: null },
    error: null
  });

  render(await DashboardPage());

  expect(redirect).not.toHaveBeenCalled();
  expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
  expect(screen.getByText("dev@betterme.local")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Bangkok weather" })).toBeTruthy();
});
```

- [ ] **Step 2: Run route tests red**

Run: `pnpm run test -- src/app/login/page.test.tsx src/app/dashboard/page.test.tsx`

Expected: FAIL because routes do not use `isDevAuthBypassEnabled()` yet.

- [ ] **Step 3: Implement route and form changes**

`src/app/login/page.tsx`:

```tsx
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const devAuthBypassEnabled = isDevAuthBypassEnabled();
...
<LoginForm devAuthBypassEnabled={devAuthBypassEnabled} />
```

`src/components/auth/login-form.tsx`:

```tsx
import Link from "next/link";

export function LoginForm({ devAuthBypassEnabled = false }: { devAuthBypassEnabled?: boolean }) {
...
{devAuthBypassEnabled ? (
  <Button asChild className="w-full" type="button" variant="outline">
    <Link href="/dashboard">Continue as dev</Link>
  </Button>
) : null}
```

`src/app/dashboard/page.tsx`:

```tsx
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const devAuthBypassEnabled = isDevAuthBypassEnabled();
...
if (error || !user) {
  if (devAuthBypassEnabled) {
    return <DashboardClient userEmail="dev@betterme.local" />;
  }

  redirect("/login");
  return null;
}
```

- [ ] **Step 4: Enable local bypass**

Add to `.env.local`:

```env
BETTERME_DEV_AUTH_BYPASS=true
```

- [ ] **Step 5: Run route tests green**

Run: `pnpm run test -- src/app/login/page.test.tsx src/app/dashboard/page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `pnpm run typecheck`

Expected: PASS.

- [ ] **Step 7: Restart dev server**

Stop any existing Next dev process on port `3001`, then start `pnpm exec next dev -p 3001`.

Expected: `/login` shows `Continue as dev`; clicking it opens `/dashboard`.
