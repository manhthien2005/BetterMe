import type { TimeOfDay, TrackingType } from "@/components/dashboard/habit-model";

export type HabitTemplate = {
  key: string;
  /** Chip label in the editor. */
  label: string;
  icon: string;
  /** What the habit is actually called once created. */
  name: string;
  trackingType: TrackingType;
  target: number;
  unit: string | null;
  timesOfDay: TimeOfDay[];
};

/** One-tap starters (spec §5.1). */
export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  {
    key: "water",
    label: "Uống nước",
    icon: "💧",
    name: "Uống đủ nước",
    trackingType: "count",
    target: 8,
    unit: "ly",
    timesOfDay: ["anytime"]
  },
  {
    key: "read",
    label: "Đọc sách",
    icon: "📖",
    name: "Đọc sách",
    trackingType: "duration",
    target: 20,
    unit: null,
    timesOfDay: ["evening"]
  },
  {
    key: "exercise",
    label: "Thể dục",
    icon: "🏃",
    name: "Vận động",
    trackingType: "duration",
    target: 30,
    unit: null,
    timesOfDay: ["morning"]
  },
  {
    key: "meditate",
    label: "Thiền",
    icon: "🧘",
    name: "Thiền",
    trackingType: "duration",
    target: 10,
    unit: null,
    timesOfDay: ["morning"]
  },
  {
    key: "sleep",
    label: "Ngủ sớm",
    icon: "😴",
    name: "Ngủ sớm",
    trackingType: "check",
    target: 1,
    unit: null,
    timesOfDay: ["evening"]
  }
];

export const COUNT_UNITS: readonly string[] = ["ly", "trang", "lần", "phần", "km", "bài"];

/** Vietnamese keyword → emoji. Keys are diacritic-free so both spellings hit. */
const ICON_HINTS: ReadonlyArray<{ match: string[]; icons: string[] }> = [
  { match: ["nuoc", "uong"], icons: ["💧", "🚰", "🥤"] },
  { match: ["doc", "sach"], icons: ["📖", "📚", "🔖"] },
  { match: ["chay", "the duc", "van dong", "gym", "tap"], icons: ["🏃", "💪", "🏋️"] },
  { match: ["thien", "hit tho"], icons: ["🧘", "🌸", "☁️"] },
  { match: ["ngu", "day"], icons: ["😴", "🛌", "⏰"] },
  { match: ["hoc", "tieng anh"], icons: ["🗣️", "📝", "🎧"] },
  { match: ["code", "du an", "lam viec"], icons: ["💻", "🚀", "🛠️"] },
  { match: ["nhat ky", "viet", "ghi"], icons: ["✍️", "📓", "🖊️"] },
  { match: ["don", "dep"], icons: ["🧹", "✨", "🧺"] },
  { match: ["an", "com"], icons: ["🍚", "🥗", "🍎"] }
];

const FALLBACK_ICONS = ["⭐", "🌱", "🎯"];

/** Strips Vietnamese diacritics so "Uống" and "uong" both match a hint. */
function plain(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

/** Up to three emoji suggested from the name being typed. Never empty. */
export function suggestIcons(name: string): string[] {
  const needle = plain(name);
  const hit = ICON_HINTS.find((hint) => hint.match.some((word) => needle.includes(word)));

  return [...new Set(hit ? hit.icons : FALLBACK_ICONS)].slice(0, 3);
}
