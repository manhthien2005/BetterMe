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

  it("drops the retired rice-paper meadow background", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(css).not.toContain(".meadow");
    expect(layout).not.toContain("meadow");
  });
});
