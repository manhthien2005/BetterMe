import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider } from "@/components/app/state-provider";
import { TodayPage } from "@/components/app/today-page";

function renderPage() {
  return render(
    <StateProvider userEmail="dev@betterme.local">
      <TodayPage />
    </StateProvider>
  );
}

describe("TodayPage — the Ngày/Tuần switch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("opens on the day view, because checking in is what the space is for", () => {
    renderPage();

    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("aria-selected")).toBe(
      "false"
    );
    // The week table is not merely hidden — an unrendered panel cannot be
    // reached by a screen reader wandering outside the visible view.
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("switches to the week table and back", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "T2" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "CN" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Hôm nay" }));

    expect(screen.queryByRole("table")).toBeNull();
  });

  it("names the visible panel after the tab that opened it", () => {
    // Without the id/labelledby pair the panel is an anonymous region and the
    // tab announces nothing about what it reveals.
    renderPage();

    const panel = screen.getByRole("tabpanel");

    expect(panel.getAttribute("id")).toBe("view-panel-day");
    expect(panel.getAttribute("aria-labelledby")).toBe("view-tab-day");
    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("aria-controls")).toBe(
      "view-panel-day"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    expect(screen.getByRole("tabpanel").getAttribute("id")).toBe("view-panel-week");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("view-tab-week");
  });

  it("gives every row of the week its own 🔥, named after that row's habit", () => {
    // The streak map is keyed on every habit for exactly this reason: keyed on
    // today's habits instead, a row the grid shows but the day list omits would
    // fall through to 0.
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    const rows = screen.getAllByRole("row").slice(1); // drop the header row

    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      // Read the name out of the streak's own label rather than out of the row
      // header — the header also carries the habit's icon.
      const streak = within(row).getByLabelText(/^Chuỗi .+: \d+ ngày$/);
      const name = streak.getAttribute("aria-label")!.replace(/^Chuỗi /, "").replace(/: .*$/, "");

      expect(row.querySelector("th")?.textContent).toContain(name);
    });
  });

  it("states the week against the user's own last week, never a shortfall", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    const summary = screen.getByTestId("week-summary").textContent ?? "";

    expect(summary).toMatch(/Tuần này \d+\/\d+ lượt/);
    ["kém", "thua", "tệ", "thất bại", "xếp cuối", "ít hơn"].forEach((word) => {
      expect(summary.toLowerCase()).not.toContain(word);
    });
  });
});

describe("TodayPage — chips and the backyard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("puts the widget chips in the main column, not off in the aside", () => {
    // Spec §4.3: weather and music are a row under the day's work, not a
    // sidebar of their own. Living inside the aside would put them back in the
    // column this task exists to dismantle.
    renderPage();

    const chip = screen.getByRole("button", { name: /^Thời tiết:/ });
    const backyard = screen.getByRole("complementary", { name: "Sân sau" });

    expect(backyard.contains(chip)).toBe(false);
    expect(screen.getByRole("button", { name: /^Nhạc tập trung/ })).toBeTruthy();
  });

  it("gives the backyard to Nếp and nothing else", () => {
    renderPage();

    const backyard = screen.getByRole("complementary", { name: "Sân sau" });

    // The weather detail belongs to the chip's popover now. If a heading for it
    // is sitting in the aside, the old column survived the move.
    expect(within(backyard).queryByRole("heading", { name: "Sài Gòn" })).toBeNull();
    expect(within(backyard).queryByTitle("Playlist Spotify của Sếp")).toBeNull();
    expect(within(backyard).getByRole("link", { name: /Ghé nhà/ }).getAttribute("href")).toBe(
      "/nep"
    );
  });

  it("keeps the backyard to desktop, where there is room beside the day", () => {
    // Spec §4.4 makes this a desktop affordance. On a phone the pet is not
    // gone — /nep is its home; this is the shortcut that has nowhere to sit.
    renderPage();

    const backyard = screen.getByRole("complementary", { name: "Sân sau" });

    expect(backyard.className).toContain("hidden");
    expect(backyard.className).toContain("xl:grid");
    expect(backyard.className).toContain("xl:sticky");
  });
});
