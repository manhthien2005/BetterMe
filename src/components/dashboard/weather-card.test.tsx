import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider } from "@/components/app/state-provider";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { describeWeatherCode, forecastUrl, parseForecast } from "@/components/dashboard/weather-data";

const FORECAST = {
  current: {
    temperature_2m: 31.4,
    apparent_temperature: 34.2,
    relative_humidity_2m: 68,
    wind_speed_10m: 9.4,
    weather_code: 0,
    is_day: 1
  },
  daily: { uv_index_max: [7.5], precipitation_probability_max: [12] }
};

/**
 * The card reads its snapshot from StateProvider (U2a) — one fetch for the
 * whole app, so the hero and this card can never show two temperatures. That
 * makes the provider part of the unit under test.
 */
function renderCard() {
  return render(
    <StateProvider userEmail="thien@example.com">
      <WeatherCard />
    </StateProvider>
  );
}

function okResponse(payload: unknown) {
  return { ok: true, json: async () => payload };
}

describe("weather-data", () => {
  it("parses an Open-Meteo payload into display text", () => {
    const snapshot = parseForecast(FORECAST)!;

    expect(snapshot.temperature).toBe("31°C");
    expect(snapshot.feelsLike).toBe("34°C");
    expect(snapshot.humidity).toBe("68%");
    expect(snapshot.wind).toBe("9 km/h");
    expect(snapshot.rainChance).toBe("12%");
    expect(snapshot.uvIndex).toBe("Cao");
    expect(snapshot.condition).toBe("Trời quang");
    expect(snapshot.emoji).toBe("☀️");
  });

  it("rejects junk payloads and maps night + unknown codes safely", () => {
    expect(parseForecast(null)).toBeNull();
    expect(parseForecast({})).toBeNull();
    expect(describeWeatherCode(0, false).emoji).toBe("🌙");
    expect(describeWeatherCode(999, true).label).toBe("Nhiều mây");
  });

  it("builds a keyless forecast URL for the place", () => {
    const url = forecastUrl({ name: "Sài Gòn", latitude: 10.7769, longitude: 106.7009 });

    expect(url).toContain("api.open-meteo.com/v1/forecast");
    expect(url).toContain("latitude=10.7769");
    expect(url).not.toContain("key");
  });
});

describe("WeatherCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders live values for the default place", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(FORECAST)));

    renderCard();

    expect(screen.getByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
    expect(await screen.findByText("31°C")).toBeTruthy();
    expect(screen.getByText("Cảm giác như 34°C")).toBeTruthy();
    expect(screen.getByText("Trời quang")).toBeTruthy();
    expect(screen.getByText("Độ ẩm")).toBeTruthy();
    expect(screen.getByText("68%")).toBeTruthy();
    expect(screen.getByText("Gió")).toBeTruthy();
    expect(screen.getByText("Mưa")).toBeTruthy();
    expect(screen.getByText("UV")).toBeTruthy();
  });

  it("keeps the shell with gentle placeholders when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));

    renderCard();

    expect(await screen.findByText("Chưa lấy được thời tiết")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thử lại nhé" })).toBeTruthy();
    // Metric labels stay put; values degrade to a neutral dash.
    expect(screen.getByText("Độ ẩm")).toBeTruthy();
    expect(screen.getAllByText("–").length).toBeGreaterThanOrEqual(4);
  });

  it("searches a new place, persists it, and refetches", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("geocoding-api")) {
        return okResponse({
          results: [{ name: "Hà Nội", latitude: 21.0278, longitude: 105.8342 }]
        });
      }

      return okResponse(FORECAST);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Đổi nơi xem thời tiết" }));
    fireEvent.change(screen.getByLabelText("Tên thành phố"), {
      target: { value: "Hà Nội" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Tìm" }));

    expect(await screen.findByRole("heading", { name: "Hà Nội" })).toBeTruthy();
    expect(window.localStorage.getItem("betterme.widgets.v1")).toContain("Hà Nội");
  });
});
