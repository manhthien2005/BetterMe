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

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Average completion \d+ percent/ })).toBeTruthy();
    expect(screen.getByText("Good days")).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByText("Habit performance")).toBeTruthy();
    expect(screen.getByText("Completion trend")).toBeTruthy();
  });

  it("frames insights gently and exposes every trend value non-visually", () => {
    const model = viewModel();
    const { container } = render(<AnalyticsPanel viewModel={model} />);

    expect(screen.getByText("Most steady")).toBeTruthy();
    expect(screen.getByText("A little more love")).toBeTruthy();

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
