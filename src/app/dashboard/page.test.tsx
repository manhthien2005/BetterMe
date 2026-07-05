import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import HomePage from "@/app/page";

const authMocks = vi.hoisted(() => ({
  ensureUserBootstrap: vi.fn(),
  getUser: vi.fn()
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

vi.mock("@/lib/server/actions", () => ({
  ensureUserBootstrap: authMocks.ensureUserBootstrap
}));

describe("dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests to login", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    const result = await DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(result).toBeNull();
    expect(authMocks.ensureUserBootstrap).not.toHaveBeenCalled();
  });

  it("renders the habit dashboard for authenticated users", async () => {
    authMocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "thien@example.com"
        }
      },
      error: null
    });

    const { container } = render(await DashboardPage());

    expect(authMocks.ensureUserBootstrap).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /good .*thiên/i })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Today's Habits" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Personal Widgets" })).toBeNull();
    expect(screen.queryByLabelText("Add widget")).toBeNull();
    expect(screen.queryByText("Deep work")).toBeNull();
    expect(screen.getByRole("heading", { name: "Bangkok weather" })).toBeTruthy();
    expect(screen.getByText("31 C")).toBeTruthy();
    expect(screen.getByText("Feels like 34 C")).toBeTruthy();
    expect(screen.getByText("Humidity")).toBeTruthy();
    expect(screen.getByText("Wind")).toBeTruthy();
    expect(screen.getByText("Rain")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Focus session" })).toBeTruthy();
    const spotifyFrame = screen.getByTitle("Spotify Deep Focus playlist");
    expect(spotifyFrame.getAttribute("src")).toContain(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ"
    );
    expect(
      screen.getByRole("link", { name: "Open in Spotify" }).getAttribute("href")
    ).toBe(
      "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ"
    );
    expect(screen.getByRole("heading", { name: "Upcoming Events" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeTruthy();
    expect(screen.getByLabelText("Exercise / sports emoji icon").textContent).toBe("💪");
    expect(container.innerHTML).not.toContain("font-black");

    const calendarDay = screen
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-label")?.includes("habits"));
    expect(calendarDay?.className).toContain("rounded-full");
    expect(calendarDay?.getAttribute("style")).toContain("82%");
  });

  it("uses the dashboard as the default landing route", () => {
    HomePage();

    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/dashboard");
  });
});
