import Link from "next/link";

import { withLocaleInPathname } from "../../i18n/locale";
import { useI18n } from "../i18n/locale-provider";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/tracker", labelKey: "tracker" },
  { href: "/calendar", labelKey: "calendar" },
  { href: "/habits", labelKey: "habits" },
  { href: "/settings", labelKey: "settings" }
] as const;

export function AppNavigation() {
  const { dictionary, locale } = useI18n();

  return (
    <nav aria-label="Primary" className="app-navigation">
      {NAV_ITEMS.map((item) => (
        <Link className="app-navigation__link" href={withLocaleInPathname(item.href, locale)} key={item.href}>
          {dictionary.nav[item.labelKey]}
        </Link>
      ))}
    </nav>
  );
}
