import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TabSwitch } from "./tab-switch";

const OPTIONS = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" }
];

describe("TabSwitch", () => {
  it("is a real tablist, so a screen reader announces which view is showing", () => {
    render(<TabSwitch label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="day" />);

    expect(screen.getByRole("tablist", { name: "Chế độ xem" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("reports the value picked", () => {
    const onChange = vi.fn();

    render(<TabSwitch label="Chế độ xem" onChange={onChange} options={OPTIONS} value="day" />);
    fireEvent.click(screen.getByRole("tab", { name: "Tuần này" }));

    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("moves with the arrow keys and wraps around", () => {
    // A tablist that only answers to clicks is unreachable from a keyboard —
    // arrow keys are how the pattern is actually navigated.
    const onChange = vi.fn();

    render(<TabSwitch label="Chế độ xem" onChange={onChange} options={OPTIONS} value="day" />);

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
    render(<TabSwitch label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="week" />);

    expect(screen.getByRole("tab", { name: "Hôm nay" }).getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("tab", { name: "Tuần này" }).getAttribute("tabindex")).toBe("0");
  });

  it("gives every tab a 44px touch target", () => {
    render(<TabSwitch label="Chế độ xem" onChange={vi.fn()} options={OPTIONS} value="day" />);

    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab.className).toContain("min-h-[44px]");
    });
  });
});
