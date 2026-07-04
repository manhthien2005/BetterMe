import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { ThemeId } from "@/types";
import { ThemeProvider, useTheme } from "./theme-provider";

describe("ThemeProvider", () => {
  it("applies and switches the semantic theme contract", () => {
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe("cute-cat");
    fireEvent.click(screen.getByRole("button", { name: "switch theme" }));
    expect(document.documentElement.dataset.theme).toBe("modern-focus");
    expect(screen.getByTestId("theme").textContent).toBe("Modern Focus");
  });
});

function Harness() {
  const [themeId, setThemeId] = useState<ThemeId>("cute-cat");
  return <ThemeProvider themeId={themeId} onThemeChange={setThemeId}><Probe /></ThemeProvider>;
}

function Probe() {
  const { theme, setThemeId } = useTheme();
  return <><span data-testid="theme">{theme.name}</span><button onClick={() => setThemeId("modern-focus")}>switch theme</button></>;
}
