import { redirect } from "next/navigation";

import type { Locale } from "../../i18n";
import { DEFAULT_LOCALE, isLocale } from "../../i18n";

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  redirect(`/${safeLocale}/dashboard`);
}
