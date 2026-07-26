import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("app typography", () => {
  it("uses Be Vietnam Pro for body and Bricolage Grotesque for display", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain('font-family: var(--font-body), "Be Vietnam Pro", sans-serif;');
    expect(css).toContain(
      'font-family: var(--font-display), "Bricolage Grotesque", sans-serif;'
    );
    expect(css).not.toContain('"Inter"');
    expect(css).not.toContain('"Nunito"');
    expect(css).not.toContain('"Baloo 2"');
  });

  it("loads both faces with the vietnamese subset through next/font", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(layout).toContain("Bricolage_Grotesque");
    expect(layout).toContain("Be_Vietnam_Pro");
    expect(layout.match(/subsets: \["latin", "vietnamese"\]/g)?.length).toBe(2);
  });

  it("points the tailwind font utilities at the same two faces", () => {
    const tailwind = readFileSync("tailwind.config.ts", "utf8");
    const start = tailwind.indexOf("fontFamily: {");
    const fontFamily = tailwind.slice(start, tailwind.indexOf("}", start));

    expect(fontFamily).toContain('sans: ["var(--font-body)", "Be Vietnam Pro", "sans-serif"]');
    expect(fontFamily).toContain(
      'display: ["var(--font-display)", "Bricolage Grotesque", "sans-serif"]'
    );
    // A fallback that is not a valid unquoted identifier sequence invalidates
    // the whole declaration at computed-value time, so the utility silently
    // stops working. Keep the retired faces out of the stacks.
    expect(fontFamily).not.toContain("Baloo");
    expect(fontFamily).not.toContain("Nunito");
  });

  it("drops the retired rice-paper meadow background", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(css).not.toContain(".meadow");
    expect(layout).not.toContain("meadow");
  });
});
