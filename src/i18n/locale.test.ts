import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  normalizeLocale,
  resolveLocale,
  withoutLocaleInPathname,
  withLocaleInPathname
} from "./locale";

describe("locale utilities", () => {
  it("normalizes BCP 47 language tags to supported locales", () => {
    expect(normalizeLocale("vi")).toBe("vi");
    expect(normalizeLocale("vi-VN")).toBe("vi");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("EN-gb")).toBe("en");
    expect(normalizeLocale("fr-FR")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });

  it("resolves the first supported locale and falls back to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(resolveLocale(["fr-FR", "vi-VN", "en-US"])).toBe("vi");
    expect(resolveLocale([undefined, "de-DE"])).toBe("en");
  });

  it("reads, removes, and applies locale pathname prefixes", () => {
    expect(getLocaleFromPathname("/vi/dashboard")).toBe("vi");
    expect(getLocaleFromPathname("/en")).toBe("en");
    expect(getLocaleFromPathname("/dashboard")).toBeNull();

    expect(withoutLocaleInPathname("/vi/dashboard")).toBe("/dashboard");
    expect(withoutLocaleInPathname("/en")).toBe("/");
    expect(withoutLocaleInPathname("/dashboard")).toBe("/dashboard");

    expect(withLocaleInPathname("/dashboard", "vi")).toBe("/vi/dashboard");
    expect(withLocaleInPathname("/en/settings", "vi")).toBe("/vi/settings");
    expect(withLocaleInPathname("/", "en")).toBe("/en");
  });
});
