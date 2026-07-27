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
