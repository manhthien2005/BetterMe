export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "betterme_locale";

export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  const language = normalized.split("-")[0];
  return isLocale(language) ? language : null;
}

export function resolveLocale(inputs: readonly (string | null | undefined)[]): Locale {
  for (const input of inputs) {
    const locale = normalizeLocale(input);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

export function isLocale(input: string | null | undefined): input is Locale {
  return SUPPORTED_LOCALES.includes(input as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = firstPathSegment(pathname);
  return normalizeLocale(segment);
}

export function withoutLocaleInPathname(pathname: string): string {
  const normalized = ensureLeadingSlash(pathname);
  const locale = getLocaleFromPathname(normalized);
  if (!locale) return normalized;
  const withoutLocale = normalized.slice(locale.length + 1);
  return withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
}

export function withLocaleInPathname(pathname: string, locale: Locale): string {
  const withoutLocale = withoutLocaleInPathname(pathname);
  if (withoutLocale === "/") return `/${locale}`;
  return `/${locale}${withoutLocale}`;
}

export function localeToIntl(locale: Locale): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}

function firstPathSegment(pathname: string) {
  return ensureLeadingSlash(pathname).split("/").filter(Boolean)[0] ?? "";
}

function ensureLeadingSlash(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
