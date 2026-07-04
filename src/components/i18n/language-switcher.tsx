"use client";

import type { Locale } from "../../i18n/locale";
import { SUPPORTED_LOCALES } from "../../i18n/locale";
import { useI18n } from "./locale-provider";

export function LanguageSwitcher() {
  const { dictionary, locale, setLocale } = useI18n();

  return (
    <label className="theme-field">
      <span>{dictionary.settings.language}</span>
      <select
        aria-label={dictionary.settings.language}
        data-testid="language-switcher"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {dictionary.languageNames[supportedLocale]}
          </option>
        ))}
      </select>
    </label>
  );
}
