import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const tailwind = readFileSync("tailwind.config.ts", "utf8");

/** Every `--token: value;` declared in the first `:root` block (no nested braces there). */
function readTokens(source: string): Record<string, string> {
  const start = source.indexOf(":root");
  const block = source.slice(start, source.indexOf("}", start));
  const tokens: Record<string, string> = {};

  for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }

  return tokens;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const linear = [0, 2, 4]
    .map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const [hi, lo] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a
  );

  return (hi + 0.05) / (lo + 0.05);
}

/** Text/background pairs the design actually ships (spec §2.1 + §9.5). */
const TEXT_PAIRS: Array<[string, string]> = [
  ["ink", "surface-page"],
  ["ink", "surface-card"],
  ["ink-mid", "surface-card"],
  ["ink-soft", "surface-page"],
  ["ink-soft", "surface-card"],
  ["ink-soft", "honey-from"],
  ["action", "surface-page"],
  ["action", "surface-card"],
  ["action-ink", "action"],
  ["action-hover", "honey-from"],
  ["action-hover", "surface-warm"],
  ["success-ink", "surface-success"],
  ["alert-ink", "alert"]
];

/** Non-text boundaries that must still be perceivable (WCAG 1.4.11 — 3:1). */
const CONTROL_PAIRS: Array<[string, string]> = [
  ["control-line", "surface-card"],
  ["control-line", "surface-page"],
  ["success", "surface-card"]
];

describe("design tokens", () => {
  const tokens = readTokens(css);

  it("declares every U0 token", () => {
    const required = [
      "surface-page",
      "surface-card",
      "surface-success",
      "surface-warm",
      "honey-from",
      "honey-to",
      "line",
      "line-strong",
      "line-success",
      "line-honey",
      "control-line",
      "ink",
      "ink-mid",
      "ink-soft",
      "action",
      "action-hover",
      "action-ink",
      "success",
      "success-ink",
      "alert",
      "alert-ink",
      "radius-card",
      "radius-control",
      "radius-pill",
      "shadow-card",
      "shadow-action"
    ];

    for (const name of required) {
      expect(tokens[name], `globals.css must declare --${name}`).toBeTruthy();
    }
  });

  it("keeps the spec's exact palette values", () => {
    expect(tokens["surface-page"]).toBe("#FEFBF3");
    expect(tokens["surface-card"]).toBe("#FFFDF9");
    expect(tokens.action).toBe("#B45309");
    expect(tokens.success).toBe("#16A34A");
    expect(tokens.alert).toBe("#E11D48");
    expect(tokens.ink).toBe("#1C1917");
    expect(tokens["ink-soft"]).toBe("#78716C");
    expect(tokens.line).toBe("#EFE7D8");
    expect(tokens["line-strong"]).toBe("#E7E0D2");
    expect(tokens["honey-from"]).toBe("#FFF9EC");
    expect(tokens["honey-to"]).toBe("#FFE9C2");
  });

  it("passes AA for every text pair the design ships", () => {
    for (const [foreground, background] of TEXT_PAIRS) {
      const ratio = contrastRatio(tokens[foreground], tokens[background]);

      expect(
        ratio,
        `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps control boundaries perceivable (3:1)", () => {
    for (const [foreground, background] of CONTROL_PAIRS) {
      const ratio = contrastRatio(tokens[foreground], tokens[background]);

      expect(
        ratio,
        `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("exposes every colour token through tailwind", () => {
    const colourTokens = Object.keys(tokens).filter((name) =>
      /^(surface|line|ink|action|success|alert|honey|control)/.test(name)
    );

    for (const name of colourTokens) {
      expect(tailwind, `tailwind.config.ts must expose --${name}`).toContain(`var(--${name})`);
    }
  });
});
