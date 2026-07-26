import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/app-shell";
import { FriendsPage } from "@/components/app/friends-page";
import { StateProvider } from "@/components/app/state-provider";
import { TodayPage } from "@/components/app/today-page";

const routeMock = vi.hoisted(() => ({ pathname: "/dashboard" }));
const socialMocks = vi.hoisted(() => ({
  getPendingGardenVisits: vi.fn(),
  ackGardenVisits: vi.fn(async () => ({ ok: true as const })),
  bumpSharedRhythms: vi.fn(async () => ({ ok: true as const, advanced: 0 })),
  refreshMySummary: vi.fn(async () => ({ ok: true as const }))
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routeMock.pathname,
  redirect: vi.fn()
}));

vi.mock("@/lib/server/social-actions", () => socialMocks);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "u1" } } } }),
      signOut: async () => ({})
    }
  })
}));

vi.mock("@/lib/sync/engine", () => ({
  createSyncEngine: () => ({
    hydrate: async () => {},
    markDirty: () => {},
    getStatus: () => "idle",
    dispose: () => {}
  })
}));

// With sync alive, Bạn vườn renders the two social cards — and they call server
// actions this file deliberately does not mock. Stub them: what's under test is
// the badge, not their content (they have their own tests).
vi.mock("@/components/dashboard/friends-card", () => ({
  FriendsCard: () => <div data-testid="friends-card" />
}));

vi.mock("@/components/dashboard/garden-fair", () => ({
  GardenFairCard: () => <div data-testid="garden-fair" />
}));

/** A full VisitEntry (src/lib/server/social-actions.ts) — no gift, so the
    mailbox pass changes no state and only the badge is under test. */
function visit(visitId: string) {
  return {
    visitId,
    visitorUserId: `visitor-${visitId}`,
    visitorPetName: null,
    visitorPetSpecies: null,
    visitDate: "2026-07-26",
    giftedFood: 0,
    cheeredMilestoneId: null,
    appliedAt: null
  };
}

describe("new-mail badge", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // A prior opt-in is what lets the engine (and the mailbox) come alive.
    window.localStorage.setItem("betterme.syncoptin.v1", "fresh");
    routeMock.pathname = "/dashboard";
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    socialMocks.getPendingGardenVisits.mockResolvedValue({
      ok: true,
      visits: [visit("v1"), visit("v2")]
    });
  });

  it("counts visits that were never celebrated", async () => {
    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <TodayPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByLabelText("2 tin mới từ bạn vườn").length).toBeGreaterThan(0);
    });
  });

  it("stays silent when every visit was already celebrated", async () => {
    window.localStorage.setItem(
      "betterme.mailboxseen.v1",
      JSON.stringify({ v1: "2026-07-26", v2: "2026-07-26" })
    );

    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <TodayPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(socialMocks.getPendingGardenVisits).toHaveBeenCalled();
    });
    expect(screen.queryByLabelText(/tin mới/)).toBeNull();
  });

  it("never shows the badge while Bạn vườn is the open space", async () => {
    // The mailbox lands after mount — the badge must not flash into existence
    // on the very page that counts as reading it.
    routeMock.pathname = "/friends";

    render(
      <StateProvider userEmail="thien@example.com">
        <AppShell>
          <FriendsPage />
        </AppShell>
      </StateProvider>
    );

    await waitFor(() => {
      expect(socialMocks.getPendingGardenVisits).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByLabelText(/tin mới/)).toBeNull();
    });
  });
});
