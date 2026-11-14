import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorldPage from "@/app/world/page";

const authMocks = vi.hoisted(() => ({
  ensureUserBootstrap: vi.fn(),
  getUser: vi.fn()
}));
const envMocks = vi.hoisted(() => ({ devBypass: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: authMocks.getUser } }))
}));

vi.mock("@/lib/server/actions", () => ({
  ensureUserBootstrap: authMocks.ensureUserBootstrap
}));

vi.mock("@/lib/dev-auth", () => ({ isDevAuthBypassEnabled: envMocks.devBypass }));

vi.mock("@/components/world/world-canvas", () => ({
  WorldCanvas: () => <div data-testid="mock-world-canvas" />
}));

describe("/world authenticated route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMocks.devBypass.mockReturnValue(false);
  });

  it("only opts into the study through its query and keeps the authentication gate", async () => {
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const query = { searchParams: Promise.resolve({ plaza: "study" }) };
    expect(await WorldPage(query)).toBeNull();
    expect(redirect).toHaveBeenCalledWith("/login");
    envMocks.devBypass.mockReturnValue(true);
    expect((await WorldPage(query))?.props.plazaStudy).toBe(true);
    expect((await WorldPage())?.props.plazaStudy).toBe(false);
    expect((await WorldPage({ searchParams: Promise.resolve({ plaza: "other" }) }))?.props.plazaStudy).toBe(false);
  });

  it("redirects unauthenticated guests to /login", async () => {
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await WorldPage();

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(result).toBeNull();
    expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
  });

  it("allows dev-auth-bypass sessions without calling ensureUserBootstrap and seeds initialNowMs from the server", async () => {
    const serverNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValue(Date.parse("2026-11-08T15:18:59.950Z"));
    envMocks.devBypass.mockReturnValue(true);
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    try {
      const pageElement = await WorldPage();
      expect(pageElement?.props.initialNowMs).toBe(Date.parse("2026-11-08T15:18:59.950Z"));

      render(pageElement);

      expect(redirect).not.toHaveBeenCalled();
      expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
      expect(screen.getByText(/dev@betterme\.local/)).toBeTruthy();
      expect(
        screen.getByRole("main", { name: "Không gian 3D Reading Quest" }).getAttribute("data-owner-id")
      ).toBe("dev-local-owner");
      expect(screen.getByTestId("environment-time-24h").textContent).toBe("22:18");
      expect(screen.getByRole("link", { name: /Về BetterMe/i }).getAttribute("href")).toBe(
        "/dashboard"
      );
    } finally {
      serverNowSpy.mockRestore();
    }
  });

  it("bootstraps and binds server-derived owner identity and post-bootstrap initialNowMs for an authenticated user", async () => {
    const postBootstrapMs = Date.parse("2026-11-08T15:18:59.950Z");
    const serverNowSpy = vi.spyOn(Date, "now").mockReturnValue(postBootstrapMs - 5_000);
    authMocks.ensureUserBootstrap.mockImplementation(async () => {
      serverNowSpy.mockReturnValue(postBootstrapMs);
    });
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "reader@betterme.vn" } },
      error: null
    });

    try {
      const pageElement = await WorldPage();
      expect(pageElement?.props.initialNowMs).toBe(postBootstrapMs);

      render(pageElement);

      expect(authMocks.ensureUserBootstrap).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/reader@betterme\.vn/)).toBeTruthy();
      expect(
        screen.getByRole("main", { name: "Không gian 3D Reading Quest" }).getAttribute("data-owner-id")
      ).toBe("user-1");
      expect(screen.getByTestId("environment-time-24h").textContent).toBe("22:18");
      expect(
        screen.getByRole("heading", { name: "Quảng trường Chung" })
      ).toBeTruthy();
    } finally {
      serverNowSpy.mockRestore();
    }
  });
});
