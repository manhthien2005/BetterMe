/**
 * Presentational lookups for habit rows + the habit detail overlay: emoji and
 * icon-bubble gradient per habit key, falling back per category. Pure string
 * maps — shared so the row and the overlay never drift apart.
 */

export function habitEmoji(key: string, category?: string) {
  const byKey: Record<string, string> = {
    wake_up: "⏰",
    english: "🗣️",
    coding: "💻",
    exercise: "💪",
    focus: "🎯",
    clean: "✨",
    review: "📝"
  };

  const byCategory: Record<string, string> = {
    Discipline: "🛡️",
    Learning: "📚",
    Work: "🚀",
    Health: "💚",
    Reflection: "🌙"
  };

  return byKey[key] || byCategory[category || ""] || "⭐";
}

export function habitIconBubbleClass(key: string, category?: string) {
  const bubbleByKey: Record<string, string> = {
    wake_up: "border-butter/70 bg-gradient-to-br from-butter/30 via-sakura/20 to-white",
    english: "border-dawn/70 bg-gradient-to-br from-dawn/30 via-white to-white",
    coding: "border-mauve/20 bg-gradient-to-br from-wafer via-white to-white",
    exercise: "border-matcha/50 bg-gradient-to-br from-matcha/25 via-white to-white",
    focus: "border-sakura bg-gradient-to-br from-sakura/40 via-white to-white",
    clean: "border-butter/70 bg-gradient-to-br from-butter/35 via-white to-white",
    review: "border-dawn/60 bg-gradient-to-br from-dawn/25 via-sakura/15 to-white"
  };

  const bubbleByCategory: Record<string, string> = {
    Discipline: "border-matcha/50 bg-gradient-to-br from-matcha/20 via-white to-white",
    Learning: "border-dawn/70 bg-gradient-to-br from-dawn/25 via-white to-white",
    Work: "border-mauve/20 bg-gradient-to-br from-wafer via-white to-white",
    Health: "border-matcha/50 bg-gradient-to-br from-matcha/25 via-white to-white",
    Reflection: "border-sakura bg-gradient-to-br from-sakura/30 via-white to-white"
  };

  return (
    bubbleByKey[key] ||
    bubbleByCategory[category || ""] ||
    "border-wafer bg-gradient-to-br from-white via-rice to-white"
  );
}
