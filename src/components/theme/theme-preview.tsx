import type { ThemeId } from "@/types";
import { getTheme } from "../../themes";

export function ThemePreview({ themeId }: { themeId: ThemeId }) {
  const theme = getTheme(themeId);

  return (
    <aside aria-label="Theme preview" data-theme-preview={theme.id}>
      <p>{theme.name}</p>
      <p>{theme.semantic.illustration.style}</p>
    </aside>
  );
}
