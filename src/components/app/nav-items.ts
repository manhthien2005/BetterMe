import { CalendarDays, Home, Snail, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemKey = "today" | "calendar" | "nep" | "friends";

export type NavItem = {
  key: NavItemKey;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only this item may wear the red badge — --alert is unique (spec §2.1). */
  badge?: boolean;
};

/** The four spaces (spec §3). Order is the same on the rail and the tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "today", href: "/dashboard", label: "Hôm nay", icon: Home },
  { key: "calendar", href: "/calendar", label: "Lịch & nhịp", icon: CalendarDays },
  { key: "nep", href: "/nep", label: "Nhà của Nếp", icon: Snail },
  { key: "friends", href: "/friends", label: "Bạn vườn", icon: Users, badge: true }
];

/** Which space owns a pathname. `/nep/album` is still Nếp; `/nepal` is not. */
export function activeNavKey(pathname: string): NavItemKey | null {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return match?.key ?? null;
}
