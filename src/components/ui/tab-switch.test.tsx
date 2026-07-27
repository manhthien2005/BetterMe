import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TabSwitch } from "./tab-switch";

const OPTIONS = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" }
];

describe("TabSwitch", () => {
  it("is a real tablist, so a screen reader announces which view is showing", () => {
    render(
      <TabSwitch idPrefix="test" label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="day" />
    );

    expect(screen.getByRole("tablist", { name: "Chế độ xem" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("reports the value picked", () => {
    const onChange = vi.fn();

    render(
      <TabSwitch idPrefix="test" label="Chế độ xem" onChange={onChange} options={OPTIONS} value="day" />
    );
    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("moves with the arrow keys and wraps around", () => {
    // A tablist that only answers to clicks is unreachable from a keyboard —
    // arrow keys are how the pattern is actually navigated.
    const onChange = vi.fn();

    render(
      <TabSwitch idPrefix="test" label="Chế độ xem" onChange={onChange} options={OPTIONS} value="day" />
    );

    const first = screen.getByRole("tab", { name: "Hôm nay" });

    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("week");

    // Left from the first option wraps to the last rather than doing nothing.
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("week");
  });

  it("keeps only the selected tab in the tab order (roving tabindex)", () => {
    // Otherwise Tab walks through every option instead of stepping past the
    // whole group, which is what the ARIA tabs pattern asks for.
    render(
      <TabSwitch idPrefix="test" label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="week" />
    );

    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("tabindex")).toBe("0");
  });

  it("gives every tab a 44px touch target", () => {
    render(
      <TabSwitch idPrefix="test" label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="day" />
    );

    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab.className).toContain("min-h-[44px]");
    });
  });

  it("says which panel each tab opens, and can be pointed back at", () => {
    // A tablist with no aria-controls announces the tab's name and nothing
    // about what it reveals, so the tab ↔ panel relationship is lost — and the
    // panel has no id to name itself after either.
    render(
      <TabSwitch
        idPrefix="view"
        label="Chế độ xem"
        onChange={vi.fn()}
        options={OPTIONS}
        value="day"
      />
    );

    const day = screen.getByRole("tab", { name: "Hôm nay" });

    expect(day.getAttribute("aria-controls")).toBe("view-panel-day");
    expect(day.getAttribute("id")).toBe("view-tab-day");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("aria-controls")).toBe(
      "view-panel-week"
    );
  });

  it("keeps its ids apart when two switches share a page", () => {
    // Duplicate ids would silently point both switches' tabs at one panel.
    const { unmount } = render(
      <TabSwitch idPrefix="view" label="A" onChange={vi.fn()} options={OPTIONS} value="day" />
    );

    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("id")).toBe("view-tab-day");
    unmount();

    render(
      <TabSwitch idPrefix="range" label="B" onChange={vi.fn()} options={OPTIONS} value="day" />
    );

    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("id")).toBe("range-tab-day");
  });
});
