import type { RawColorToken, ThemeDefinition } from "@/types";

export interface ThemeValidationResult { valid: boolean; errors: string[] }

const COLOR_TOKENS: RawColorToken[] = ["neutral-0", "neutral-50", "neutral-100", "neutral-300", "neutral-600", "neutral-900", "primary-100", "primary-500", "primary-700", "accent-100", "accent-500", "good-100", "good-700", "okay-100", "okay-700", "bad-100", "bad-700", "planned-100", "planned-700"];

export function validateThemeDefinition(theme: ThemeDefinition): ThemeValidationResult {
  const errors: string[] = [];
  for (const token of COLOR_TOKENS) {
    const value = theme.raw.colors?.[token];
    if (!value) errors.push(`Missing color token ${token}`);
    else if (!/^#[0-9a-f]{6}$/i.test(value)) errors.push(`Invalid color token ${token}`);
  }
  const colors = theme.semantic.colors;
  const pairs: Array<[RawColorToken, RawColorToken, string]> = [
    [colors.text, colors.background, "text/background"], [colors.text, colors.surface, "text/surface"],
    [colors.textMuted, colors.background, "muted/background"], [colors.textOnPrimary, colors.primary, "primary text"],
    [colors.statusGoodText, colors.statusGoodSurface, "Good"], [colors.statusOkayText, colors.statusOkaySurface, "Okay"],
    [colors.statusBadText, colors.statusBadSurface, "Bad"], [colors.statusPlannedText, colors.statusPlannedSurface, "Planned"]
  ];
  for (const [foreground, background, label] of pairs) {
    const fg = theme.raw.colors?.[foreground];
    const bg = theme.raw.colors?.[background];
    if (fg && bg && contrast(fg, bg) < 4.5) errors.push(`Insufficient contrast for ${label}`);
  }
  return { valid: errors.length === 0, errors };
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a); const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
