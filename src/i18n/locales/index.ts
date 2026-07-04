import type { Dictionary } from "../dictionary";
import type { Locale } from "../locale";
import { DEFAULT_LOCALE } from "../locale";
import { en } from "./en";
import { vi } from "./vi";

export const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { en, vi };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
