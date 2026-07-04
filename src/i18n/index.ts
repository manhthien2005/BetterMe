export type { Dictionary } from "./dictionary";
export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  getLocaleFromPathname,
  isLocale,
  localeToIntl,
  normalizeLocale,
  resolveLocale,
  withoutLocaleInPathname,
  withLocaleInPathname,
  type Locale
} from "./locale";
export { getDictionary } from "./locales";
