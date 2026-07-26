import type { Habit } from "@/lib/types";

export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_TRACKER_DAYS = 90;
export const DEFAULT_TARGET_COMPLETION_RATE = 0.8;

export const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

// Category values stay English keys (stored in state + DB and used for icon
// lookups); the UI renders them through CATEGORY_LABELS in dashboard-data.
export const DEFAULT_HABITS = [
  {
    key: "wake_up",
    name: "Dậy đúng giờ",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Thức dậy đúng giờ mình đã hẹn."
  },
  {
    key: "english",
    name: "Học tiếng Anh",
    category: "Learning",
    maxScore: 1,
    active: true,
    description: "Dành thời gian tập trung luyện tiếng Anh."
  },
  {
    key: "coding",
    name: "Code / làm dự án",
    category: "Work",
    maxScore: 2,
    active: true,
    description: "Viết code, luyện tập hoặc đẩy dự án tiến thêm một bước."
  },
  {
    key: "exercise",
    name: "Vận động / thể thao",
    category: "Health",
    maxScore: 1,
    active: true,
    description: "Cho cơ thể vận động: tập luyện, đi bộ, giãn cơ, chơi thể thao."
  },
  {
    key: "focus",
    name: "Không lãng phí thời gian",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Giữ tập trung, hạn chế xao nhãng."
  },
  {
    key: "clean",
    name: "Dọn dẹp / nếp sống gọn gàng",
    category: "Discipline",
    maxScore: 1,
    active: true,
    description: "Giữ không gian và nếp sinh hoạt gọn gàng."
  },
  {
    key: "review",
    name: "Nhìn lại cuối ngày",
    category: "Reflection",
    maxScore: 1,
    active: true,
    description: "Nhìn lại một ngày và lên kế hoạch cho ngày mai."
  }
] as const;

export const PALETTES = [
  {
    name: "Forest",
    primary: "#14532D",
    secondary: "#DCFCE7",
    accent: "#22C55E",
    soft: "#F0FDF4",
    text: "#14532D"
  },
  {
    name: "Ocean",
    primary: "#0C4A6E",
    secondary: "#E0F2FE",
    accent: "#0284C7",
    soft: "#F0F9FF",
    text: "#075985"
  },
  {
    name: "Lavender",
    primary: "#4C1D95",
    secondary: "#F3E8FF",
    accent: "#8B5CF6",
    soft: "#FAF5FF",
    text: "#581C87"
  },
  {
    name: "Sunset",
    primary: "#7C2D12",
    secondary: "#FFEDD5",
    accent: "#F97316",
    soft: "#FFF7ED",
    text: "#9A3412"
  }
] as const;

export function habitIcon(key: string, category?: string) {
  const byKey: Record<string, string> = {
    wake_up: "AlarmClock",
    english: "Languages",
    coding: "Code2",
    exercise: "Dumbbell",
    focus: "Target",
    clean: "Sparkles",
    review: "NotebookPen"
  };

  const byCategory: Record<string, string> = {
    Discipline: "ShieldCheck",
    Learning: "BookOpen",
    Work: "Laptop",
    Health: "HeartPulse",
    Reflection: "Moon"
  };

  return byKey[key] || byCategory[category || ""] || "Star";
}

export function makeSeedHabit(
  userId: string,
  item: (typeof DEFAULT_HABITS)[number],
  index: number
): Omit<Habit, "id"> {
  return {
    userId,
    key: item.key,
    name: item.name,
    category: item.category,
    maxScore: item.maxScore,
    active: item.active,
    description: item.description,
    sortOrder: index
  };
}
