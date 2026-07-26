import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import {
  buildDashboardViewModel,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";

function viewModel() {
  const today = getDashboardToday();

  return buildDashboardViewModel(createInitialDashboardState(today), today);
}

describe("AnalyticsPanel", () => {
  it("keeps the Analytics heading, a ring gauge, and supporting counts", () => {
    render(<AnalyticsPanel viewModel={viewModel()} />);

    expect(screen.getByRole("heading", { name: "Phân tích" })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /Hoàn thành trung bình \d+ phần trăm/ })
    ).toBeTruthy();
    expect(screen.getByText("Ngày tốt")).toBeTruthy();
    expect(screen.getByText("Lượt hoàn thành")).toBeTruthy();
    expect(screen.getByText("Từng thói quen")).toBeTruthy();
    expect(screen.getByText("Xu hướng hoàn thành")).toBeTruthy();
  });

  it("frames insights gently and exposes every trend value non-visually", () => {
    const model = viewModel();
    const { container } = render(<AnalyticsPanel viewModel={model} />);

    expect(screen.getByText("Đều tay nhất")).toBeTruthy();
    expect(screen.getByText("Cần thêm chút yêu thương")).toBeTruthy();

    const rows = container.querySelectorAll("ul.sr-only li");
    expect(rows.length).toBe(model.analytics.trend.length);

    // No-guilt / no downward comparison anywhere in the panel copy.
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of ["thua", "kém", "xếp cuối"]) {
      expect(text).not.toContain(banned);
    }
  });

  it("draws the average with a self-drawing gauge arc", () => {
    const { container } = render(<AnalyticsPanel viewModel={viewModel()} />);

    const arc = container.querySelector(".gauge-draw");
    expect(arc).toBeTruthy();
    expect(arc?.getAttribute("style") ?? "").toContain("--gauge-circumference");
  });
});
