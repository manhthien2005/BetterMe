import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/dashboard/site-footer";

describe("SiteFooter", () => {
  it("renders the BetterMe copyright credit line", () => {
    render(<SiteFooter />);

    expect(screen.getByText("BetterMe")).toBeTruthy();
    expect(screen.getByText("© 2026")).toBeTruthy();
    expect(screen.getByText(/Được làm với/)).toBeTruthy();
  });

  it("embeds a GitHub link to manhthien2005 that opens safely in a new tab", () => {
    render(<SiteFooter />);

    const link = screen.getByRole("link", { name: /manhthien2005/i });

    expect(link.getAttribute("href")).toBe("https://github.com/manhthien2005");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });
});
