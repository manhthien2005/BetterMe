import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavRail } from "@/components/ui/nav-rail";

describe("NavRail", () => {
  it("links to all four spaces", () => {
    render(<NavRail activeKey="today" badgeCount={0} />);

    expect(screen.getByRole("link", { name: /Hôm nay/ }).getAttribute("href")).toBe(
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: /Lịch & nhịp/ }).getAttribute("href")).toBe(
      "/calendar"
    );
    expect(screen.getByRole("link", { name: /Nhà của Nếp/ }).getAttribute("href")).toBe(
      "/nep"
    );
    expect(screen.getByRole("link", { name: /Bạn vườn/ }).getAttribute("href")).toBe(
      "/friends"
    );
  });

  it("marks the open space with aria-current", () => {
    render(<NavRail activeKey="nep" badgeCount={0} />);

    expect(
      screen.getByRole("link", { name: /Nhà của Nếp/ }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: /Hôm nay/ }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("hides the badge at zero and announces it when there is mail", () => {
    const { rerender } = render(<NavRail activeKey="today" badgeCount={0} />);

    expect(screen.queryByLabelText(/tin mới/)).toBeNull();

    rerender(<NavRail activeKey="today" badgeCount={2} />);

    const badge = screen.getByLabelText("2 tin mới từ bạn vườn");

    expect(badge.textContent).toBe("2");
  });

  it("renders the footer slot (the account menu lives there)", () => {
    render(<NavRail activeKey="today" badgeCount={0} footer={<button>Tài khoản</button>} />);

    expect(screen.getByRole("button", { name: "Tài khoản" })).toBeTruthy();
  });

  it("is desktop-only", () => {
    const { container } = render(<NavRail activeKey="today" badgeCount={0} />);

    expect(container.firstElementChild?.className).toContain("hidden");
    expect(container.firstElementChild?.className).toContain("lg:flex");
  });
});
