import { describe, expect, it } from "vitest";

import type { ThemeDefinition } from "@/types";
import { THEMES } from "./index";
import { validateThemeDefinition } from "./validate-theme";

describe("theme contract", () => {
  it("registers four complete valid themes", () => {
    expect(Object.keys(THEMES)).toEqual(["cute-cat", "study-corner", "modern-focus", "minimal-calm"]);
    for (const theme of Object.values(THEMES)) {
      expect(validateThemeDefinition(theme)).toEqual({ valid: true, errors: [] });
    }
  });

  it("rejects missing raw tokens", () => {
    const theme = structuredClone(THEMES["cute-cat"]) as ThemeDefinition;
    delete (theme.raw.colors as Partial<ThemeDefinition["raw"]["colors"]>)["neutral-900"];
    const result = validateThemeDefinition(theme);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("neutral-900");
  });

  it("rejects insufficient text contrast", () => {
    const theme = structuredClone(THEMES["minimal-calm"]);
    theme.raw.colors["neutral-900"] = theme.raw.colors["neutral-0"];
    expect(validateThemeDefinition(theme).errors.join(" ")).toContain("contrast");
  });
});
