"use client";

import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";

import type { ThemeDefinition, ThemeId } from "@/types";
import { getTheme } from "../../themes";

export interface ThemeProviderProps {
  themeId: ThemeId;
  onThemeChange?: (themeId: ThemeId) => void;
  children: ReactNode;
}

export interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setThemeId(themeId: ThemeId): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ themeId, onThemeChange, children }: ThemeProviderProps) {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeId;
    document.documentElement.style.colorScheme = "light";
  }, [themeId]);
  const value = useMemo(() => ({ themeId, theme: getTheme(themeId), setThemeId: (next: ThemeId) => onThemeChange?.(next) }), [onThemeChange, themeId]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
