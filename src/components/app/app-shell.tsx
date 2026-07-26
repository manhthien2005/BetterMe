"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { activeNavKey } from "@/components/app/nav-items";
import { useAppState } from "@/components/app/state-provider";
import { SyncStatusDot } from "@/components/app/sync-status-dot";
import { HABIT_CATEGORIES } from "@/components/dashboard/dashboard-data";
import { GardenVisitOverlay } from "@/components/dashboard/garden-visit-overlay";
import { HabitDetailOverlay } from "@/components/dashboard/habit-detail-overlay";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { SyncOnboarding } from "@/components/dashboard/sync-onboarding";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { NavRail } from "@/components/ui/nav-rail";

/**
 * The frame every space lives in (spec §3): a fixed rail on desktop, a bottom
 * tab bar on mobile, and every global overlay. Spaces themselves render only
 * their own content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const app = useAppState();
  const activeKey = activeNavKey(usePathname() ?? "");

  const accountMenu = (
    <ProfileMenu
      email={app.userEmail}
      onOpenProfile={app.openProfile}
      onOpenSettings={app.openSettings}
      onSignOut={app.signOut}
    />
  );

  return (
    <div className="flex min-h-screen">
      <NavRail activeKey={activeKey} badgeCount={app.newSocialCount} footer={accountMenu} />

      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface-page/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <span className="font-display text-base font-extrabold text-ink">
            🌾 Nếp&apos;s Garden
          </span>
          {accountMenu}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>

        <div className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-0">
          <SiteFooter />
        </div>
      </div>

      <BottomTabBar activeKey={activeKey} badgeCount={app.newSocialCount} />

      <SyncStatusDot status={app.syncStatus} />

      {app.showSyncOnboarding ? (
        <SyncOnboarding onChoose={app.chooseSync} onDismiss={app.dismissSync} />
      ) : null}

      {app.habitDetail ? (
        <HabitDetailOverlay
          categories={[...HABIT_CATEGORIES]}
          detail={app.habitDetail}
          onClose={app.closeHabitDetail}
          onRemove={(habitId) => {
            app.removeHabit(habitId);
            app.closeHabitDetail();
          }}
          onSave={app.saveHabitEdit}
        />
      ) : null}

      {app.visitingFriendId ? (
        <GardenVisitOverlay
          hostUserId={app.visitingFriendId}
          myFood={app.viewModel.companion.food}
          onClose={app.closeFriendVisit}
          // The gift RPC already appended the spend event server-side with an
          // id only the server knows — mirroring locally with a NEW id would
          // double-spend after union-merge. Re-hydrate instead: the merged
          // ledger carries the server's spend event (spec §4.2 + §2.3).
          onGiftSent={app.onGiftSent}
        />
      ) : null}
    </div>
  );
}
