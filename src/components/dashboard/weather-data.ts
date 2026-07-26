import type { WeatherPlace } from "@/components/dashboard/widget-settings";

/**
 * Live weather qua Open-Meteo (miễn phí, không cần API key). Phần thuần ở đây
 * (map mã WMO → mô tả VN, parse response) tách khỏi component để test thẳng.
 */

export type WeatherSnapshot = {
  temperature: string;
  feelsLike: string;
  humidity: string;
  wind: string;
  rainChance: string;
  uvIndex: string;
  condition: string;
  planningNote: string;
  emoji: string;
  emojiLabel: string;
};

type WmoEntry = {
  label: string;
  dayEmoji: string;
  nightEmoji: string;
  note: string;
};

// WMO weather interpretation codes, gom theo nhóm hiển thị.
const WMO: Array<{ codes: number[]; entry: WmoEntry }> = [
  {
    codes: [0],
    entry: {
      label: "Trời quang",
      dayEmoji: "☀️",
      nightEmoji: "🌙",
      note: "Trời đẹp — hợp một cữ đi dạo nhẹ giữa các thói quen."
    }
  },
  {
    codes: [1, 2],
    entry: {
      label: "Ít mây",
      dayEmoji: "🌤️",
      nightEmoji: "🌙",
      note: "Dễ chịu — mở cửa sổ đón gió trong lúc tập trung nhé."
    }
  },
  {
    codes: [3],
    entry: {
      label: "Nhiều mây",
      dayEmoji: "☁️",
      nightEmoji: "☁️",
      note: "Trời dịu — ánh sáng đều, hợp giờ đọc và làm việc sâu."
    }
  },
  {
    codes: [45, 48],
    entry: {
      label: "Sương mù",
      dayEmoji: "🌫️",
      nightEmoji: "🌫️",
      note: "Sương giăng — ra đường nhớ đi chậm, còn ở nhà thì pha gì ấm ấm."
    }
  },
  {
    codes: [51, 53, 55, 56, 57],
    entry: {
      label: "Mưa phùn",
      dayEmoji: "🌦️",
      nightEmoji: "🌧️",
      note: "Mưa lất phất — mang theo áo mưa mỏng nếu phải ra ngoài."
    }
  },
  {
    codes: [61, 63, 65, 66, 67, 80, 81, 82],
    entry: {
      label: "Có mưa",
      dayEmoji: "🌧️",
      nightEmoji: "🌧️",
      note: "Trời mưa — hôm nay hợp các thói quen trong nhà."
    }
  },
  {
    codes: [71, 73, 75, 77, 85, 86],
    entry: {
      label: "Có tuyết",
      dayEmoji: "🌨️",
      nightEmoji: "🌨️",
      note: "Tuyết rơi — giữ ấm là thói quen quan trọng nhất hôm nay."
    }
  },
  {
    codes: [95, 96, 99],
    entry: {
      label: "Dông",
      dayEmoji: "⛈️",
      nightEmoji: "⛈️",
      note: "Có dông — ở nhà chăm vườn là hợp lý nhất."
    }
  }
];

export function describeWeatherCode(code: number, isDay: boolean): WmoEntry & { emoji: string } {
  const found = WMO.find((group) => group.codes.includes(code))?.entry ?? WMO[2].entry;

  return { ...found, emoji: isDay ? found.dayEmoji : found.nightEmoji };
}

function describeUv(uv: number): string {
  if (uv < 3) return "Thấp";
  if (uv < 6) return "Vừa";
  if (uv < 8) return "Cao";
  return "Rất cao";
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    uv_index_max?: number[];
    precipitation_probability_max?: number[];
  };
};

export function forecastUrl(place: WeatherPlace): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily: "uv_index_max,precipitation_probability_max",
    forecast_days: "1",
    timezone: "auto"
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function parseForecast(payload: unknown): WeatherSnapshot | null {
  if (payload === null || typeof payload !== "object") return null;

  const { current, daily } = payload as OpenMeteoResponse;

  if (!current || typeof current.temperature_2m !== "number") return null;

  const description = describeWeatherCode(current.weather_code ?? 3, current.is_day !== 0);
  const uv = daily?.uv_index_max?.[0];
  const rain = daily?.precipitation_probability_max?.[0];

  return {
    temperature: `${Math.round(current.temperature_2m)}°C`,
    feelsLike: `${Math.round(current.apparent_temperature ?? current.temperature_2m)}°C`,
    humidity: typeof current.relative_humidity_2m === "number" ? `${current.relative_humidity_2m}%` : "–",
    wind: typeof current.wind_speed_10m === "number" ? `${Math.round(current.wind_speed_10m)} km/h` : "–",
    rainChance: typeof rain === "number" ? `${rain}%` : "–",
    uvIndex: typeof uv === "number" ? describeUv(uv) : "–",
    condition: description.label,
    planningNote: description.note,
    emoji: description.emoji,
    emojiLabel: description.label
  };
}

export async function fetchWeather(
  place: WeatherPlace,
  signal?: AbortSignal
): Promise<WeatherSnapshot | null> {
  const response = await fetch(forecastUrl(place), { signal });

  if (!response.ok) return null;

  return parseForecast(await response.json());
}

type GeocodeResult = {
  name?: string;
  admin1?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
};

/** Tìm tọa độ theo tên thành phố (Open-Meteo geocoding, ưu tiên tiếng Việt). */
export async function searchPlace(
  query: string,
  signal?: AbortSignal
): Promise<WeatherPlace | null> {
  const trimmed = query.trim();

  if (!trimmed) return null;

  const params = new URLSearchParams({ name: trimmed, count: "1", language: "vi" });
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    { signal }
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as { results?: GeocodeResult[] };
  const result = payload.results?.[0];

  if (
    !result ||
    typeof result.name !== "string" ||
    typeof result.latitude !== "number" ||
    typeof result.longitude !== "number"
  ) {
    return null;
  }

  return { name: result.name, latitude: result.latitude, longitude: result.longitude };
}
