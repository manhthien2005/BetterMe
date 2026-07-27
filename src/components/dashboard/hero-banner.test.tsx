import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AppWeather } from "@/components/app/state-provider";
import {
  buildDashboardViewModel,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";
import { HeroBanner } from "@/components/dashboard/hero-banner";

function viewModel() {
  const day = getDashboardToday();

  return buildDashboardViewModel(createInitialDashboardState(day), day);
}

const PLACE = { name: "Sài Gòn", latitude: 10.8, longitude: 106.7 };

const NO_WEATHER: AppWeather = { status: "loading", snapshot: null, place: PLACE };

const RAINY: AppWeather = {
  status: "ready",
  place: PLACE,
  snapshot: {
    temperature: "31°C",
    feelsLike: "34°C",
    humidity: "94%",
    wind: "8 km/h",
    rainChance: "100%",
    uvIndex: "Vừa",
    condition: "Mưa lất phất",
    planningNote: "Mang theo áo mưa mỏng nhé",
    emoji: "🌦",
    emojiLabel: "Mưa nhẹ"
  }
};

describe("HeroBanner", () => {
  it("greets by the hour it is handed, not by the machine's clock", () => {
    render(<HeroBanner celebrate={false} hour={8} viewModel={viewModel()} weather={NO_WEATHER} />);

    expect(screen.getByText(/Chào buổi sáng/)).toBeTruthy();
  });

  it("wears the evening sky after dark", () => {
    const { container } = render(
      <HeroBanner celebrate={false} hour={21} viewModel={viewModel()} weather={NO_WEATHER} />
    );

    expect(screen.getByText(/Chào buổi tối/)).toBeTruthy();
    expect(container.querySelector(".from-sky-evening-from")).toBeTruthy();
  });

  it("wears a different sky in the afternoon", () => {
    const { container } = render(
      <HeroBanner celebrate={false} hour={14} viewModel={viewModel()} weather={NO_WEATHER} />
    );

    expect(container.querySelector(".from-sky-afternoon-from")).toBeTruthy();
    expect(container.querySelector(".from-sky-evening-from")).toBeNull();
  });

  it("shows today's progress as a ring a screen reader can read", () => {
    const model = viewModel();

    render(<HeroBanner celebrate={false} hour={8} viewModel={model} weather={NO_WEATHER} />);

    const ring = screen.getByRole("progressbar", { name: /Tiến độ hôm nay/ });

    expect(ring.getAttribute("aria-valuenow")).toBe(String(model.today.completedHabits));
    expect(ring.getAttribute("aria-valuemax")).toBe(String(model.today.totalHabits));
  });

  it("draws the seven-day chain as a list, one labelled item per day", () => {
    render(<HeroBanner celebrate={false} hour={8} viewModel={viewModel()} weather={NO_WEATHER} />);

    // Exactly seven, once. The layout moves this block between mobile and
    // desktop with flexbox rather than rendering two copies — a copy hidden
    // by a media query is still in the accessibility tree.
    const days = screen.getAllByRole("listitem");

    expect(days).toHaveLength(7);
    days.forEach((day) => expect(day.getAttribute("aria-label")).toBeTruthy());
  });

  it("says nothing about the weather until it has some", () => {
    // A hero rendering "· undefined°" while loading looks broken.
    render(<HeroBanner celebrate={false} hour={8} viewModel={viewModel()} weather={NO_WEATHER} />);

    expect(screen.queryByText(/undefined/)).toBeNull();
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.queryByText(/31°C/)).toBeNull();
  });

  it("folds the weather into the date line once it arrives", () => {
    render(<HeroBanner celebrate={false} hour={8} viewModel={viewModel()} weather={RAINY} />);

    const line = screen.getByTestId("hero-date-line");

    expect(line.textContent).toContain("31°C");
    // Lower-cased on purpose: it reads mid-sentence, after the date.
    expect(line.textContent).toContain("mưa lất phất");
  });

  it("shows the streak and the record beside it", () => {
    const model = viewModel();

    render(<HeroBanner celebrate={false} hour={8} viewModel={model} weather={NO_WEATHER} />);

    expect(screen.getByText(String(model.streak.current))).toBeTruthy();
    expect(screen.getByText(new RegExp(`kỷ lục ${model.streak.best}`))).toBeTruthy();
  });

  it("speaks in Nếp's voice when there is a line, and the daily one when there is not", () => {
    const model = viewModel();

    const { rerender } = render(
      <HeroBanner
        bubble="Hôm nay mình đi từ từ nhé 🌿"
        celebrate={false}
        hour={8}
        viewModel={model}
        weather={NO_WEATHER}
      />
    );

    expect(screen.getByText("Hôm nay mình đi từ từ nhé 🌿")).toBeTruthy();

    rerender(
      <HeroBanner celebrate={false} hour={8} viewModel={model} weather={NO_WEATHER} />
    );

    expect(screen.getByText(model.motivation)).toBeTruthy();
  });

  it("has retired the v2 palette entirely", () => {
    // The whole point of U2a: this surface stops speaking matcha/plum/wafer
    // and starts speaking tokens. A leftover class here is a leftover look.
    const { container } = render(
      <HeroBanner celebrate={false} hour={8} viewModel={viewModel()} weather={RAINY} />
    );
    const markup = container.innerHTML;

    ["matcha", "sakura", "plum", "mauve", "wafer", "butter", "soft-panel"].forEach((legacy) => {
      expect(markup, `hero still uses the v2 token "${legacy}"`).not.toContain(legacy);
    });
  });
});
