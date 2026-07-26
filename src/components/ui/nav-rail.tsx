import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_ITEMS, type NavItemKey } from "@/components/app/nav-items";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * The desktop rail (spec §3): wordmark, the four spaces, then whatever the
 * shell puts in `footer` — today the account menu. Mobile gets BottomTabBar.
 */
export function NavRail({
  activeKey,
  badgeCount,
  footer
}: {
  activeKey: NavItemKey | null;
  badgeCount: number;
  footer?: ReactNode;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden w-[200px] shrink-0 flex-col gap-0.5 border-r border-line px-3.5 py-5 lg:flex"
    >
      <span className="mx-3 mb-4 font-display text-base font-extrabold text-ink">
        🌾 Nếp&apos;s Garden
      </span>

      {NAV_ITEMS.map((item) => {
        const active = item.key === activeKey;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-2.5 rounded-control px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
              active
                ? "bg-surface-warm text-action-hover"
                : "text-ink-soft hover:bg-surface-warm hover:text-action-hover"
            )}
            href={item.href}
            key={item.key}
          >
            <Icon as={item.icon} />
            {item.label}
            {item.badge && badgeCount > 0 ? (
              <span
                aria-label={`${badgeCount} tin mới từ bạn vườn`}
                className="ml-auto rounded-pill bg-alert px-1.5 py-0.5 text-[10px] font-bold leading-none text-alert-ink"
                role="status"
              >
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}

      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </nav>
  );
}
