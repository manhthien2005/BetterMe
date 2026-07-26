/**
 * Local-only widget preferences (weather location + Spotify playlist), stored
 * under their own localStorage key so the synced dashboard state
 * (`betterme.dashboard.v2`) never grows fields the sync engine must ignore.
 */

export type WeatherPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

export type WidgetSettings = {
  weather: WeatherPlace | null;
  spotifyPlaylistUrl: string | null;
};

const STORAGE_KEY = "betterme.widgets.v1";

/** Sài Gòn — khớp DEFAULT_TIMEZONE (Asia/Ho_Chi_Minh). */
export const DEFAULT_WEATHER_PLACE: WeatherPlace = {
  name: "Sài Gòn",
  latitude: 10.7769,
  longitude: 106.7009
};

export const DEFAULT_SPOTIFY_PLAYLIST_URL =
  "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ";

export function loadWidgetSettings(): WidgetSettings {
  const fallback: WidgetSettings = { weather: null, spotifyPlaylistUrl: null };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object") return fallback;

    const candidate = parsed as Partial<WidgetSettings>;
    const weather = candidate.weather;
    const validWeather =
      weather &&
      typeof weather === "object" &&
      typeof weather.name === "string" &&
      Number.isFinite(weather.latitude) &&
      Number.isFinite(weather.longitude)
        ? { name: weather.name, latitude: weather.latitude, longitude: weather.longitude }
        : null;

    return {
      weather: validWeather,
      spotifyPlaylistUrl:
        typeof candidate.spotifyPlaylistUrl === "string" ? candidate.spotifyPlaylistUrl : null
    };
  } catch {
    return fallback;
  }
}

export function saveWidgetSettings(settings: WidgetSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Best-effort — a blocked store only means the preference resets next visit.
  }
}

/**
 * Chấp nhận link playlist Spotify dạng open.spotify.com/playlist/<id> (kèm
 * query tùy ý). Trả về id hoặc null nếu link không hợp lệ.
 */
export function parseSpotifyPlaylistId(url: string): string | null {
  const match = url
    .trim()
    .match(/^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]+)/);

  return match ? match[1] : null;
}

export function spotifyEmbedUrl(playlistId: string): string {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
}

export function spotifyPlaylistUrl(playlistId: string): string {
  return `https://open.spotify.com/playlist/${playlistId}`;
}
