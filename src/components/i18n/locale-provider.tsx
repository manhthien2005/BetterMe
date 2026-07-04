"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Dictionary } from "../../i18n/dictionary";
import type { Locale } from "../../i18n/locale";
import { getDictionary } from "../../i18n/locales";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, getLocaleFromPathname, resolveLocale, withLocaleInPathname } from "../../i18n/locale";

export interface LocaleContextValue {
  locale: Locale;
  dictionary: Dictionary;
  setLocale(locale: Locale): void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  settingsLocale,
  onLocaleChange
}: {
  children: ReactNode;
  settingsLocale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveLocale([readPathLocale(), settingsLocale, readCookieLocale(), readBrowserLocale()]));

  useEffect(() => {
    const nextLocale = resolveLocale([readPathLocale(), settingsLocale, readCookieLocale(), readBrowserLocale()]);
    setLocaleState(nextLocale);
    persistLocaleCookie(nextLocale);
    document.documentElement.lang = nextLocale;
  }, [settingsLocale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocaleCookie(nextLocale);
    document.documentElement.lang = nextLocale;
    onLocaleChange?.(nextLocale);

    if (typeof window !== "undefined") {
      const nextPathname = withLocaleInPathname(window.location.pathname, nextLocale);
      const nextUrl = `${nextPathname}${window.location.search}${window.location.hash}`;
      window.setTimeout(() => window.location.assign(nextUrl), 0);
    }
  }, [onLocaleChange]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    dictionary: getDictionary(locale),
    setLocale
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext) ?? {
    locale: DEFAULT_LOCALE,
    dictionary: getDictionary(DEFAULT_LOCALE),
    setLocale: () => undefined
  };
}

function readPathLocale(): string | null {
  if (typeof window === "undefined") return null;
  return getLocaleFromPathname(window.location.pathname);
}

function readBrowserLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  return navigator.languages?.[0] ?? navigator.language ?? null;
}

function readCookieLocale(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1] ?? null;
}

function persistLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
