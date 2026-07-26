import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DASHBOARD_WEATHER, WeatherCard } from "@/components/dashboard/weather-card";

describe("WeatherCard", () => {
  it("shows a compact location heading and the temperature as real text", () => {
    render(<WeatherCard />);

    expect(screen.getByRole("heading", { name: "Bangkok" })).toBeTruthy();
    expect(screen.getByText("31°C")).toBeTruthy();
    expect(screen.getByText("Feels like 34°C")).toBeTruthy();
    expect(screen.getByText(DASHBOARD_WEATHER.planningNote)).toBeTruthy();
  });

  it("renders the four planning metrics as label + value text", () => {
    render(<WeatherCard />);

    for (const [label, value] of [
      ["Humidity", DASHBOARD_WEATHER.humidity],
      ["Wind", DASHBOARD_WEATHER.wind],
      ["Rain", DASHBOARD_WEATHER.rainChance],
      ["UV", DASHBOARD_WEATHER.uvIndex]
    ] as const) {
      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getByText(value)).toBeTruthy();
    }
  });

  it("gives the condition emoji an accessible label and marks metric icons animated + decorative", () => {
    const { container } = render(<WeatherCard />);

    const emoji = screen.getByRole("img", { name: DASHBOARD_WEATHER.emojiLabel });
    expect(emoji.className).toContain("wx-float");

    // Each metric glyph animates and is aria-hidden (value text carries meaning).
    for (const motion of ["wx-humidity", "wx-wind", "wx-rain", "wx-uv"]) {
      const icon = container.querySelector(`.${motion}`);
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
