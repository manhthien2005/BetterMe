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

  it("Hôm nay keeps the greeting, the habit list and both widget chips", () => {
    renderSpace("/dashboard", <TodayPage />);

    expect(screen.getByRole("heading", { name: /chào buổi .*sếp ơi/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Thói quen hôm nay" })).toBeTruthy();
    // Since U2c the two widgets are chips, not cards (spec §4.3), so what the
    // space owes you here is the pair of triggers — the detail lives a click away
    // in each popover, which is `widget-chips.test.tsx`'s business.
    expect(screen.getByRole("button", { name: /^Thời tiết:/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Nhạc tập trung/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Sài Gòn" })).toBeNull();
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
    const open = screen
      .getAllByRole("checkbox")
      .find((box) => box.getAttribute("aria-checked") === "false");

    expect(open).toBeTruthy();
    fireEvent.click(open!);
    unmount();

    renderSpace("/nep", <NepPage />);
    expect(screen.getByLabelText("2 món ăn trong tủ")).toBeTruthy();
  });

  it("keeps the account menu and the footer on every space", () => {
    renderSpace("/calendar", <CalendarPage />);

    expect(
      screen
        .getAllByRole("button", { name: /thien@example\.com/i })[0]
        .getAttribute("aria-haspopup")
    ).toBe("menu");
    expect(screen.getByRole("link", { name: /manhthien2005/i })).toBeTruthy();
  });
});
