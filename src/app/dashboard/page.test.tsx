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
    // The account email now lives in the header profile-menu trigger.
    expect(screen.getByText("dev@betterme.local")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /dev@betterme\.local/i }).getAttribute("aria-haspopup")
    ).toBe("menu");
    expect(screen.getByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
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
      screen.getByRole("heading", { name: /chào buổi .*sếp ơi/i })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lịch tháng" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Thói quen hôm nay" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Personal Widgets" })).toBeNull();
    expect(screen.queryByLabelText("Add widget")).toBeNull();
    expect(screen.queryByText("Deep work")).toBeNull();
    expect(screen.getByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
    expect(screen.getByText("31°C")).toBeTruthy();
    expect(screen.getByText("Cảm giác như 34°C")).toBeTruthy();
    expect(screen.getByText("Độ ẩm")).toBeTruthy();
    expect(screen.getByText("Gió")).toBeTruthy();
    expect(screen.getByText("Mưa")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nhạc tập trung" })).toBeTruthy();
    const rightRail = screen.getByLabelText("Thời tiết và nhạc tập trung");
    expect(within(rightRail).getByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
    expect(within(rightRail).getByRole("heading", { name: "Nhạc tập trung" })).toBeTruthy();
    const spotifyFrame = screen.getByTitle("Playlist Deep Focus trên Spotify");
    expect(spotifyFrame.getAttribute("src")).toContain(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ"
    );
    expect(
      screen.getByRole("link", { name: "Mở trong Spotify" }).getAttribute("href")
    ).toBe(
      "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ"
    );
    expect(screen.getByRole("heading", { name: "Sự kiện sắp tới" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phân tích" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /manhthien2005/i }).getAttribute("href")
    ).toBe("https://github.com/manhthien2005");
    expect(
      screen.getByLabelText("Biểu tượng thói quen Vận động / thể thao").textContent
    ).toBe("💪");
    expect(container.innerHTML).not.toContain("font-black");

    // First run: the hero invites you to adopt a pet — two wobbling eggs.
    // The old placeholder-page navigation stays gone.
    expect(
      screen.getByRole("heading", { name: "Ai sẽ cùng bạn chăm khu vườn?" })
    ).toBeTruthy();
    expect(screen.getByLabelText("Chọn trứng Cún con")).toBeTruthy();
    expect(screen.getByLabelText("Chọn trứng Mèo con")).toBeTruthy();
    expect(screen.getByText("Nhịp 7 ngày")).toBeTruthy();
    expect(screen.getByRole("button", { name: /thêm thói quen/i })).toBeTruthy();
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
          cell.getAttribute("aria-label")?.includes("thói quen") &&
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
    fireEvent.change(screen.getByLabelText("Tên bé cưng"), {
      target: { value: "Xoài" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Nhận nuôi 💕" }));

    // The pet renders with a baby-stage aria label, plus bond meter + food tray.
    expect(screen.getByLabelText(/Bé cún Xoài, giai đoạn sơ sinh/)).toBeTruthy();
    expect(screen.getByLabelText("Thân thiết cấp 1 trên 5")).toBeTruthy();
    expect(screen.getByText("Lạ lẫm")).toBeTruthy();
    expect(screen.getByLabelText("0 món ăn trong tủ")).toBeTruthy();
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

    expect(screen.getByLabelText(/Bé mèo Mochi, giai đoạn sơ sinh/)).toBeTruthy();

    // Seed data sits at 6/7 — completing the last habit finishes the day,
    // which pays one treat plus the perfect-day bonus treat.
    const unchecked = screen
      .getAllByRole("button", { pressed: false })
      .find((button) => button.className.includes("min-h-16"));

    expect(unchecked).toBeTruthy();
    fireEvent.click(unchecked!);

    expect(screen.getByLabelText("2 món ăn trong tủ")).toBeTruthy();

    // Feeding spends one treat.
    fireEvent.click(screen.getByRole("button", { name: "Cho ăn" }));
    expect(screen.getByLabelText("1 món ăn trong tủ")).toBeTruthy();
  });

  it("uses the dashboard as the default landing route", () => {
    HomePage();

    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/dashboard");
  });
});
