"use client";

import { useAppState } from "@/components/app/state-provider";
import { CompanionPanel } from "@/components/dashboard/companion-panel";

/** 🐌 Nhà của Nếp — the companion's own space (spec §3, §6). */
export function NepPage() {
  const app = useAppState();

  return (
    <div className="flex justify-center">
      <CompanionPanel
        bubble={app.bubble}
        celebrate={app.celebrate}
        eating={app.eating}
        onAdopt={app.adoptPet}
        onFeed={app.feedPet}
        onOpenGift={app.openGift}
        onPet={app.petThePet}
        onSwitch={app.switchPet}
        viewModel={app.viewModel}
      />
    </div>
  );
}
