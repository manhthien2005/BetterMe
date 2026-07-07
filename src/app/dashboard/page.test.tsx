import { fireEvent, render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import HomePage from "@/app/page";
import {
  adoptPet,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";

const authMocks = vi.hoisted(() => ({
  ensureUserBootstrap: vi.fn(),
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

vi.mock("@/lib/server/actions", () => ({
  ensureUserBootstrap: authMocks.ensureUserBootstrap
}));

vi.mock("@/lib/dev-auth", () => ({
  isDevAuthBypassEnabled: envMocks.devBypass
}));

describe("dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    envMocks.devBypass.mockReturnValue(false);
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
    expect(screen.getByText("31°C")).toBeTruthy();
    expect(screen.getByText("Feels like 34°C")).toBeTruthy();
    expect(screen.getByText("Humidity")).toBeTruthy();
    expect(screen.getByText("Wind")).toBeTruthy();
    expect(screen.getByText("Rain")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Focus session" })).toBeTruthy();
    const rightRail = screen.getByLabelText("Weather and Spotify highlights");
    expect(within(rightRail).getByRole("heading", { name: "Bangkok weather" })).toBeTruthy();
    expect(within(rightRail).getByRole("heading", { name: "Focus session" })).toBeTruthy();
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

    // First run: the hero invites you to adopt a pet — two wobbling eggs.
    // The old placeholder-page navigation stays gone.
    expect(
      screen.getByRole("heading", { name: "Ai sẽ cùng bạn chăm khu vườn?" })
    ).toBeTruthy();
    expect(screen.getByLabelText("Chọn trứng Cún con")).toBeTruthy();
    expect(screen.getByLabelText("Chọn trứng Mèo con")).toBeTruthy();
    expect(screen.getByText("7-day rhythm")).toBeTruthy();
    expect(screen.getByRole("button", { name: /add a habit/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tracker" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Habits" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();

    // Partially-filled calendar cells render a radial-gradient "donut" with an
    // 82% hole; fully-complete cells are a solid color. Target a partial cell so
    // the 82% assertion is deterministic. (JSDOM keeps the radial-gradient but
    // drops the sibling conic-gradient it cannot parse.) Cells are read-only
    // role="img" now — the calendar is data, not controls.
    const calendarDay = screen
      .getAllByRole("img")
      .find(
        (cell) =>
          cell.getAttribute("aria-label")?.includes("habits") &&
          cell.getAttribute("style")?.includes("radial-gradient")
      );
    expect(calendarDay).toBeTruthy();
    expect(calendarDay?.className).toContain("rounded-full");
    expect(calendarDay?.getAttribute("style")).toContain("82%");
  });

  it("adopts a pet from the egg picker and shows the companion HUD", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "thien@example.com" } },
      error: null
    });

    render(await DashboardPage());

    fireEvent.click(screen.getByLabelText("Chọn trứng Cún con"));
    fireEvent.change(screen.getByLabelText("Pet name"), {
      target: { value: "Xoài" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Nhận nuôi 💕" }));

    // The pet renders with a baby-stage aria label, plus bond meter + food tray.
    expect(screen.getByLabelText(/Xoài the dog, baby stage/)).toBeTruthy();
    expect(screen.getByLabelText("Bond tier 1 of 5")).toBeTruthy();
    expect(screen.getByText("Lạ lẫm")).toBeTruthy();
    expect(screen.getByLabelText("0 treats in the pantry")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cho ăn" })).toBeTruthy();
    expect(screen.getByText(/Ngày chăm: 0/)).toBeTruthy();
    // The cat egg still waits in the switcher.
    expect(screen.getByLabelText("Nhận nuôi bé mèo")).toBeTruthy();
  });

  it("restores an adopted pet from storage and lets habits feed it", async () => {
    const today = getDashboardToday();
    const state = adoptPet(createInitialDashboardState(today), "cat", "Mochi", today);

    window.localStorage.setItem("betterme.dashboard.v2", JSON.stringify(state));
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "thien@example.com" } },
      error: null
    });

    render(await DashboardPage());

    expect(screen.getByLabelText(/Mochi the cat, baby stage/)).toBeTruthy();

    // Seed data sits at 6/7 — completing the last habit finishes the day,
    // which pays one treat plus the perfect-day bonus treat.
    const unchecked = screen
      .getAllByRole("button", { pressed: false })
      .find((button) => button.className.includes("min-h-16"));

    expect(unchecked).toBeTruthy();
    fireEvent.click(unchecked!);

    expect(screen.getByLabelText("2 treats in the pantry")).toBeTruthy();

    // Feeding spends one treat.
    fireEvent.click(screen.getByRole("button", { name: "Cho ăn" }));
    expect(screen.getByLabelText("1 treats in the pantry")).toBeTruthy();
  });

  it("uses the dashboard as the default landing route", () => {
    HomePage();

    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/dashboard");
  });
});
