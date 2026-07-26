import { beforeEach, describe, expect, it } from "vitest";

import {
  loadWidgetSettings,
  parseSpotifyPlaylistId,
  saveWidgetSettings,
  spotifyEmbedUrl
} from "@/components/dashboard/widget-settings";

describe("widget settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips weather place and playlist through localStorage", () => {
    saveWidgetSettings({
      weather: { name: "Đà Lạt", latitude: 11.94, longitude: 108.44 },
      spotifyPlaylistUrl: "https://open.spotify.com/playlist/abc123"
    });

    const loaded = loadWidgetSettings();

    expect(loaded.weather?.name).toBe("Đà Lạt");
    expect(loaded.spotifyPlaylistUrl).toBe("https://open.spotify.com/playlist/abc123");
  });

  it("falls back safely on junk storage", () => {
    window.localStorage.setItem("betterme.widgets.v1", "not-json{");
    expect(loadWidgetSettings()).toEqual({ weather: null, spotifyPlaylistUrl: null });

    window.localStorage.setItem(
      "betterme.widgets.v1",
      JSON.stringify({ weather: { name: 5, latitude: "x" }, spotifyPlaylistUrl: 9 })
    );
    expect(loadWidgetSettings()).toEqual({ weather: null, spotifyPlaylistUrl: null });
  });

  it("parses playlist links strictly", () => {
    expect(
      parseSpotifyPlaylistId("https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ?si=x")
    ).toBe("37i9dQZF1DWZeKCadgRdKQ");
    expect(
      parseSpotifyPlaylistId("https://open.spotify.com/intl-vi/playlist/37i9dQZF1DWZeKCadgRdKQ")
    ).toBe("37i9dQZF1DWZeKCadgRdKQ");
    expect(parseSpotifyPlaylistId("https://open.spotify.com/track/xyz")).toBeNull();
    expect(parseSpotifyPlaylistId("https://evil.example.com/playlist/abc")).toBeNull();
    expect(parseSpotifyPlaylistId("random text")).toBeNull();
  });

  it("builds the embed URL from the id only", () => {
    expect(spotifyEmbedUrl("abc123")).toBe(
      "https://open.spotify.com/embed/playlist/abc123?utm_source=generator&theme=0"
    );
  });
});
