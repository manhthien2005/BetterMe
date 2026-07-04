import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tracker", label: "Tracker" },
  { href: "/calendar", label: "Calendar" },
  { href: "/habits", label: "Habits" },
  { href: "/settings", label: "Settings" }
] as const;

export function AppNavigation() {
  return (
    <nav aria-label="Primary" className="app-navigation">
      {NAV_ITEMS.map((item) => (
        <Link className="app-navigation__link" href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
