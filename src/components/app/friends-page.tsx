"use client";

import { useEffect } from "react";

import { useAppState } from "@/components/app/state-provider";
import { FriendsCard } from "@/components/dashboard/friends-card";
import { GardenFairCard } from "@/components/dashboard/garden-fair";
import { Card } from "@/components/ui/card";

/**
 * 🏡 Bạn vườn — the social layer rides on sync (social spec §3.3), so signed
 * out or under the dev bypass the space stays in the nav and explains itself
 * instead of disappearing (spec §3).
 */
export function FriendsPage() {
  const app = useAppState();
  const { clearSocialBadge, newSocialCount } = app;

  // Having this space open IS reading the mail (spec §3). It watches the count
  // rather than firing once on mount, because the mailbox pass resolves
  // asynchronously and may land AFTER this page mounted.
  useEffect(() => {
    if (newSocialCount > 0) clearSocialBadge();
  }, [clearSocialBadge, newSocialCount]);

  if (app.syncStatus === "disabled") {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-lg font-bold text-ink">Vườn của bạn bè</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink-soft">
          Khu vườn của bạn đang được giữ ngay trên máy này. Khi bạn đăng nhập và{" "}
          <strong className="font-semibold text-ink">bật đồng bộ</strong>, Nếp sẽ mở lối sang
          vườn của bạn bè — để cùng ghé thăm, cổ vũ và giữ nhịp chung.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <FriendsCard onVisitFriend={app.visitFriend} />
      <GardenFairCard onOwnLantern={app.speakFairLantern} />
    </div>
  );
}
