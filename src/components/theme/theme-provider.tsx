import type { ThemeId } from "@/types";

export interface ThemeProviderProps {
  themeId: ThemeId;
  children: unknown;
}

// TODO: Resolve semantic tokens and provide theme state during T-010.
export function ThemeProvider(_props: ThemeProviderProps) {
  return null;
}
