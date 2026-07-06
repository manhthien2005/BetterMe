import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("app typography", () => {
  it("uses Inter as the global interface font", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain('font-family: "Inter", sans-serif;');
  });
});
