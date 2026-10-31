// @vitest-environment node
import type { CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";

const authMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: authMocks.createClient }));

describe("session refresh proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    authMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    authMocks.createClient.mockReturnValue({ auth: { getUser: authMocks.getUser } });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"])(
    "passes through without constructing a client when %s is missing",
    async (key) => {
      vi.stubEnv(key, "");

      const response = await proxy(new NextRequest("http://localhost/dashboard"));

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(authMocks.createClient).not.toHaveBeenCalled();
    }
  );

  it("forwards refreshed cookies to the request and browser with their options", async () => {
    const request = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: "existing=original" }
    });
    authMocks.createClient.mockImplementation(
      (_url: string, _key: string, { cookies }: { cookies: CookieMethodsServer }) => ({
        auth: {
          getUser: async () => {
            expect(await cookies.getAll()).toEqual([{ name: "existing", value: "original" }]);
            await cookies.setAll?.([
              {
                name: "refreshed-session",
                value: "new-session",
                options: { httpOnly: true, sameSite: "lax", path: "/", secure: true }
              }
            ]);
          }
        }
      })
    );

    const response = await proxy(request);

    expect(request.cookies.get("refreshed-session")?.value).toBe("new-session");
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "refreshed-session=new-session"
    );
    expect(response.cookies.get("refreshed-session")).toMatchObject({
      value: "new-session", httpOnly: true, sameSite: "lax", path: "/", secure: true
    });
  });

  it("leaves guest authorization to the page-level auth gate", async () => {
    const response = await proxy(new NextRequest("http://localhost/friends"));

    expect(authMocks.getUser).toHaveBeenCalledTimes(1);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.has("location")).toBe(false);
  });

  it("does not crash the page when Supabase is unreachable", async () => {
    authMocks.getUser.mockRejectedValue(new Error("offline"));

    const response = await proxy(new NextRequest("http://localhost/dashboard"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
