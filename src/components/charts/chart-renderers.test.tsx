import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ChartData } from "@/types";
import { HabitChart } from "./habit-chart";
import { ProgressChart } from "./progress-chart";

const line: ChartData = { id: "thirty-day-progress", title: "Progress", description: "Recent completion", kind: "line", xAxisLabel: "Date", yAxisLabel: "Rate", series: [{ id: "completion", label: "Completion", colorToken: "chart-series-1", points: [{ key: "2026-01-01", label: "01/01", value: 0.75 }] }] };
const bars: ChartData = { ...line, id: "selected-week-habits", title: "Habits", kind: "bar", series: [{ ...line.series[0], points: [{ key: "study", label: "Study", value: 0.5 }] }] };

describe("chart renderers", () => {
  it("provides accessible values alongside the progress chart", () => {
    render(<ProgressChart data={line} />);
    expect(screen.getByRole("img", { name: /Progress/ })).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
  });

  it("provides accessible values alongside the habit chart", () => {
    render(<HabitChart data={bars} />);
    expect(screen.getByRole("img", { name: /Habits/ })).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });
});
