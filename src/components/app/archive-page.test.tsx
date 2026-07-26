import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchivePage } from "@/components/app/archive-page";
import { StateProvider } from "@/components/app/state-provider";
import { TodayPage } from "@/components/app/today-page";
import {
  createInitialDashboardState,
  getDashboardToday,
  setHabitArchived
} from "@/components/dashboard/dashboard-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/nep/archive",
  redirect: vi.fn()
}));

function renderArchive() {
  return render(
    <StateProvider userEmail="thien@example.com">
      <ArchivePage />
    </StateProvider>
  );
}

describe("ArchivePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("says something kind when nothing has been archived", () => {
    renderArchive();

    expect(screen.getByRole("heading", { name: "Lưu trữ" })).toBeTruthy();
    expect(screen.getByText(/Chưa có gì ở đây cả/)).toBeTruthy();
  });

  it("lists an archived habit and can put it back", () => {
    const day = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v3",
      JSON.stringify(setHabitArchived(createInitialDashboardState(day), "wake_up", day))
    );

    renderArchive();

    const row = screen.getByRole("listitem");

    expect(within(row).getByText("Dậy đúng giờ")).toBeTruthy();

    fireEvent.click(within(row).getByRole("button", { name: "Đưa trở lại" }));

    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("needs two deliberate presses to delete for good", () => {
    const day = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v3",
      JSON.stringify(setHabitArchived(createInitialDashboardState(day), "wake_up", day))
    );

    renderArchive();

    // The first press only asks — nothing is gone yet.
    fireEvent.click(screen.getByRole("button", { name: /Xoá vĩnh viễn Dậy đúng giờ/ }));
    expect(screen.getByRole("listitem")).toBeTruthy();
    expect(screen.getByText("Xoá hẳn?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }));
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("backing out of the confirm leaves the habit alone", () => {
    const day = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v3",
      JSON.stringify(setHabitArchived(createInitialDashboardState(day), "wake_up", day))
    );

    renderArchive();

    fireEvent.click(screen.getByRole("button", { name: /Xoá vĩnh viễn Dậy đúng giờ/ }));
    fireEvent.click(screen.getByRole("button", { name: "Thôi" }));

    expect(screen.getByRole("listitem")).toBeTruthy();
  });
});

describe("archiving from the day list", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("an archived habit leaves Hôm nay but keeps its history", () => {
    const day = getDashboardToday();
    const state = setHabitArchived(createInitialDashboardState(day), "wake_up", day);

    window.localStorage.setItem("betterme.dashboard.v3", JSON.stringify(state));

    render(
      <StateProvider userEmail="thien@example.com">
        <TodayPage />
      </StateProvider>
    );

    expect(screen.queryByRole("button", { name: "Sửa Dậy đúng giờ" })).toBeNull();
    expect(state.records[day].entries.wake_up).toBeTruthy();
  });
});
