import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

const authMocks = vi.hoisted(() => ({
  getUser: vi.fn()
}));
const envMocks = vi.hoisted(() => ({
  devBypass: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: authMocks.getUser
    }
  }))
}));

vi.mock("@/lib/dev-auth", () => ({
  isDevAuthBypassEnabled: envMocks.devBypass
}));

describe("login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMocks.devBypass.mockReturnValue(false);
  });

  it("renders the login form for guests", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    render(await LoginPage());

    expect(screen.getByRole("heading", { name: "Vào BetterMe" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects signed-in users to the dashboard", async () => {
    authMocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "thien@example.com"
        }
      },
      error: null
    });

    const result = await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
    expect(result).toBeNull();
  });

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
});
