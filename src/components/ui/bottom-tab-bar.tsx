import Link from "next/link";

import { NAV_ITEMS, type NavItemKey } from "@/components/app/nav-items";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** The mobile tab bar (spec §3). Fixed; the shell pads content to clear it. */
export function BottomTabBar({
  activeKey,
  badgeCount
}: {
  activeKey: NavItemKey | null;
  badgeCount: number;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.key === activeKey;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action",
              active ? "text-action" : "text-ink-soft"
            )}
            href={item.href}
            key={item.key}
          >
            <Icon as={item.icon} />
            {item.label}
            {item.badge && badgeCount > 0 ? (
              <span
                aria-label={`${badgeCount} tin mới từ bạn vườn`}
                className="absolute right-[22%] top-1 rounded-pill bg-alert px-1.5 py-0.5 text-[10px] font-bold leading-none text-alert-ink"
                role="status"
              >
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
