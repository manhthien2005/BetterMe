import type { HabitConfig } from "@/types";
import type { Locale } from "../i18n/locale";
import { DEFAULT_LOCALE } from "../i18n/locale";

export const DEFAULT_HABIT_CONFIGS: readonly HabitConfig[] = [
  { key: "wake-on-time", name: "Wake up on time", category: "discipline", maxScore: 1, active: true, description: "Start the day when you planned to.", sortOrder: 0 },
  { key: "study-english", name: "Study English", category: "learning", maxScore: 1, active: true, description: "Practice English with focused attention.", sortOrder: 1 },
  { key: "code-project", name: "Code or project work", category: "learning", maxScore: 1, active: true, description: "Move a meaningful project forward.", sortOrder: 2 },
  { key: "exercise", name: "Exercise or sports", category: "health", maxScore: 1, active: true, description: "Move your body intentionally.", sortOrder: 3 },
  { key: "avoid-time-waste", name: "Avoid wasting time", category: "focus", maxScore: 1, active: true, description: "Protect attention from low-value distractions.", sortOrder: 4 },
  { key: "clean-up", name: "Clean up", category: "discipline", maxScore: 1, active: true, description: "Restore order to your space and routines.", sortOrder: 5 },
  { key: "daily-review", name: "End-of-day review", category: "reflection", maxScore: 1, active: true, description: "Pause, notice, and prepare for tomorrow.", sortOrder: 6 }
] as const;

const DEFAULT_HABIT_CONFIGS_BY_LOCALE: Readonly<Record<Locale, readonly HabitConfig[]>> = {
  en: DEFAULT_HABIT_CONFIGS,
  vi: [
    { key: "wake-on-time", name: "Dậy đúng giờ", category: "discipline", maxScore: 1, active: true, description: "Bắt đầu ngày mới đúng như đã hẹn với bản thân.", sortOrder: 0 },
    { key: "study-english", name: "Học tiếng Anh", category: "learning", maxScore: 1, active: true, description: "Luyện tiếng Anh với sự tập trung rõ ràng.", sortOrder: 1 },
    { key: "code-project", name: "Code hoặc làm dự án", category: "learning", maxScore: 1, active: true, description: "Đẩy một dự án có ý nghĩa tiến lên một chút.", sortOrder: 2 },
    { key: "exercise", name: "Tập thể dục hoặc chơi thể thao", category: "health", maxScore: 1, active: true, description: "Chủ động vận động cơ thể.", sortOrder: 3 },
    { key: "avoid-time-waste", name: "Tránh lãng phí thời gian", category: "focus", maxScore: 1, active: true, description: "Bảo vệ sự chú ý khỏi những thứ ít giá trị.", sortOrder: 4 },
    { key: "clean-up", name: "Dọn dẹp", category: "discipline", maxScore: 1, active: true, description: "Khôi phục trật tự cho không gian và nếp sinh hoạt.", sortOrder: 5 },
    { key: "daily-review", name: "Tổng kết cuối ngày", category: "reflection", maxScore: 1, active: true, description: "Dừng lại, quan sát và chuẩn bị cho ngày mai.", sortOrder: 6 }
  ]
};

export function getDefaultHabitConfigs(locale: Locale = DEFAULT_LOCALE): readonly HabitConfig[] {
  return DEFAULT_HABIT_CONFIGS_BY_LOCALE[locale] ?? DEFAULT_HABIT_CONFIGS_BY_LOCALE[DEFAULT_LOCALE];
}
