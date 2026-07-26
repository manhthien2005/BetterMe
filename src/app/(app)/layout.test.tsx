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
