import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider } from "@/components/app/state-provider";
import { WidgetChips } from "@/components/dashboard/widget-chips";

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
 * The chips read weather from StateProvider like `WeatherCard` does — one fetch
 * for the whole app — so the provider is part of the unit under test. The chip
 * for Spotify has no network state of its own: the embed is an iframe Spotify
 * owns.
 */
function renderChips() {
  return render(
    <StateProvider userEmail="thien@example.com">
      <WidgetChips />
    </StateProvider>
  );
}

function okResponse(payload: unknown) {
  return { ok: true, json: async () => payload };
}

describe("WidgetChips", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the reading on the weather chip once it lands", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(FORECAST)));

    renderChips();

    const chip = await screen.findByRole("button", { name: /^Thời tiết: 31°C, Trời quang/ });

    expect(chip.textContent).toContain("31°C");
    expect(chip.textContent).toContain("Sài Gòn");
  });

  it("says it is looking while the reading is in flight", () => {
    // A fetch that never settles: the chip must have something to say in the
    // gap, not an empty pill.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    renderChips();

    const chip = screen.getByRole("button", { name: /^Thời tiết: đang tải/ });

    expect(chip.textContent).toContain("Đang ngó trời…");
  });

  it("degrades to plain words when the network fails, never to undefined", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));

    renderChips();

    const chip = await screen.findByRole("button", { name: /^Thời tiết: chưa lấy được/ });

    expect(chip.textContent).toContain("Chưa lấy được");
    expect(chip.textContent).not.toMatch(/undefined|NaN|null/);
  });

  it("opens the full weather card in a popover", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(FORECAST)));

    renderChips();

    const chip = await screen.findByRole("button", { name: /^Thời tiết:/ });

    expect(screen.queryByRole("heading", { name: "Sài Gòn" })).toBeNull();

    fireEvent.click(chip);

    expect(await screen.findByRole("heading", { name: "Sài Gòn" })).toBeTruthy();
    expect(screen.getByText("Độ ẩm")).toBeTruthy();
  });

  it("opens the playlist in a popover and keeps it playing after closing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(FORECAST)));

    renderChips();

    const chip = screen.getByRole("button", { name: /^Nhạc tập trung/ });

    fireEvent.click(chip);

    const frame = await screen.findByTitle("Playlist Spotify của Sếp");
    const panel = frame.closest("[data-state]")!;

    expect(panel.getAttribute("aria-hidden")).toBeNull();

    fireEvent.click(chip);

    // forceMount keeps the iframe alive so the music survives a close (owner's
    // call). The trade is that a hidden region must be hidden from a screen
    // reader too, or it reads a playlist nobody can see.
    await waitFor(() => expect(panel.getAttribute("data-state")).toBe("closed"));
    // The same iframe node, not merely an iframe: a remounted embed would start
    // the playlist over, which is the thing forceMount exists to prevent.
    expect(panel.contains(frame)).toBe(true);
    expect(frame.isConnected).toBe(true);
    expect(panel.getAttribute("aria-hidden")).toBe("true");
    expect(panel.hasAttribute("hidden")).toBe(true);
  });

  it("gives both chips a real touch target and no v2 palette", () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(FORECAST)));

    renderChips();

    // The two chips by name, not every button on screen: the force-mounted
    // playlist panel carries buttons of its own, and a blanket getAllByRole
    // would only be passing here because that panel happens to be hidden.
    const chips = [
      screen.getByRole("button", { name: /^Thời tiết:/ }),
      screen.getByRole("button", { name: /^Nhạc tập trung/ })
    ];

    for (const chip of chips) {
      expect(chip.className).toContain("min-h-[44px]");
      expect(chip.className).not.toMatch(/matcha|sakura|plum|wafer|mauve|butter|rice|mochi/);
    }
  });
});
