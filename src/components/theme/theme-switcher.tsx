"use client";

import type { ThemeId } from "@/types";
import { THEMES } from "../../themes";
import { useTheme } from "./theme-provider";

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();
  return <label className="theme-field"><span>Theme</span><select aria-label="Theme" value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>{Object.values(THEMES).map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>;
}
