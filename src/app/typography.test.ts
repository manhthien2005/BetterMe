import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("app typography", () => {
  it("uses the rounded Nunito body face with Baloo 2 display headings", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain('font-family: var(--font-body), "Nunito", sans-serif;');
    expect(css).toContain('font-family: var(--font-display), "Baloo 2", sans-serif;');
    expect(css).not.toContain('"Inter"');
  });
});
