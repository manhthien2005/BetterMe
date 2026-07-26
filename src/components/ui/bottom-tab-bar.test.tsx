import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BottomTabBar } from "@/components/ui/bottom-tab-bar";

describe("BottomTabBar", () => {
  it("shows all four spaces", () => {
    render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("marks the open space with aria-current", () => {
    render(<BottomTabBar activeKey="friends" badgeCount={0} />);

    expect(
      screen.getByRole("link", { name: /Bạn vườn/ }).getAttribute("aria-current")
    ).toBe("page");
  });

  it("keeps every tab at a 44px touch target", () => {
    render(<BottomTabBar activeKey="today" badgeCount={0} />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("min-h-[44px]");
    }
  });

  it("shows the badge only when there is mail", () => {
    const { rerender } = render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(screen.queryByLabelText(/tin mới/)).toBeNull();

    rerender(<BottomTabBar activeKey="today" badgeCount={5} />);

    expect(screen.getByLabelText("5 tin mới từ bạn vườn").textContent).toBe("5");
  });

  it("is mobile-only", () => {
    const { container } = render(<BottomTabBar activeKey="today" badgeCount={0} />);

    expect(container.firstElementChild?.className).toContain("lg:hidden");
  });
});
