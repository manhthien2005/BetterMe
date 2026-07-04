import type { ThemeId } from "@/types";
import { getTheme } from "../../themes";
import { useI18n } from "../i18n/locale-provider";

const THEME_LABEL_KEYS: Record<ThemeId, "cuteCat" | "studyCorner" | "modernFocus" | "minimalCalm"> = {
  "cute-cat": "cuteCat",
  "study-corner": "studyCorner",
  "modern-focus": "modernFocus",
  "minimal-calm": "minimalCalm"
};

export function ThemePreview({ themeId }: { themeId: ThemeId }) {
  const theme = getTheme(themeId);
  const { dictionary } = useI18n();

  return (
    <aside aria-label="Theme preview" data-theme-preview={theme.id}>
      <p>{dictionary.theme[THEME_LABEL_KEYS[theme.id]]}</p>
      <p>{theme.semantic.illustration.style}</p>
    </aside>
  );
}
