import type { ThemeDefinition, ThemeId } from "@/types";
import { cuteCatTheme } from "./cute-cat";
import { minimalCalmTheme } from "./minimal-calm";
import { modernFocusTheme } from "./modern-focus";
import { studyCornerTheme } from "./study-corner";

export const THEMES: Readonly<Record<ThemeId, ThemeDefinition>> = {
  "cute-cat": cuteCatTheme,
  "study-corner": studyCornerTheme,
  "modern-focus": modernFocusTheme,
  "minimal-calm": minimalCalmTheme
};

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES[id];
}

export { validateThemeDefinition } from "./validate-theme";
