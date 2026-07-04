"use client";

import type { ThemeId } from "@/types";
import { THEMES } from "../../themes";
import { useI18n } from "../i18n/locale-provider";
import { useTheme } from "./theme-provider";

const THEME_LABEL_KEYS: Record<ThemeId, "cuteCat" | "studyCorner" | "modernFocus" | "minimalCalm"> = {
  "cute-cat": "cuteCat",
  "study-corner": "studyCorner",
  "modern-focus": "modernFocus",
  "minimal-calm": "minimalCalm"
};

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();
  const { dictionary } = useI18n();
  return <label className="theme-field"><span>{dictionary.settings.theme}</span><select aria-label={dictionary.settings.theme} value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>{Object.values(THEMES).map((theme) => <option key={theme.id} value={theme.id}>{dictionary.theme[THEME_LABEL_KEYS[theme.id]]}</option>)}</select></label>;
}
