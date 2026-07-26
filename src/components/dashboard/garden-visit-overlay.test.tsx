import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyGiftToState,
  createInitialDashboardState,
  deriveFoodBalance,
  FOOD_CAP,
  GIFT_OVERFLOW_BOND_PER_DAY,
  adoptPet,
  type DashboardState
} from "@/components/dashboard/dashboard-data";
import { GardenVisitOverlay } from "@/components/dashboard/garden-visit-overlay";
import type { PublishedSummary } from "@/lib/server/social-actions";

// The server-action module is mocked wholesale ("use server" + Supabase);
// the overlay only ever touches getFriendSummary + visitGarden.
const socialMocks = vi.hoisted(() => ({
  getFriendSummary: vi.fn(),
  visitGarden: vi.fn(),
  ackGardenVisits: vi.fn()
}));

vi.mock("@/lib/server/social-actions", () => socialMocks);

const LAN_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const TODAY = "2026-07-08";

function makeSummary(overrides: Partial<PublishedSummary> = {}): PublishedSummary {
  return {
    userId: LAN_ID,
    displayName: "Lan",
    petName: "Xoài",
    petSpecies: "dog",
    petStage: "junior",
    petBondTier: 3,
    milestones: [
      { id: "evolve:junior", kind: "evolve", at: "2026-07-06", detail: "junior" },
      { id: "new_pet:dog", kind: "new_pet", at: "2026-07-04", detail: "dog" }
    ],
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  socialMocks.getFriendSummary.mockResolvedValue({ ok: true, summary: makeSummary() });
  socialMocks.visitGarden.mockResolvedValue({
    ok: true,
    petCount: 1,
    petRecorded: true,
    giftDelivered: false,
    cheerDelivered: false
  });
});

describe("GardenVisitOverlay", () => {
  it("renders the host's pet at its real stage plus milestone chips", async () => {
    render(<GardenVisitOverlay hostUserId={LAN_ID} myFood={3} onClose={() => undefined} />);

    // Host identity.
    expect(await screen.findByText("Vườn của Lan")).toBeTruthy();

    // Structural §0.3: no streak / last-active surface may ever render.
    expect(screen.queryByText(/🔥/)).toBeNull();
    expect(screen.queryByText(/ngày liền tay/)).toBeNull();

    // The re-used <Pet> SVG carries the species/stage in its aria-label.
    expect(
      screen.getByRole("img", { name: /Bé cún Xoài, giai đoạn thiếu nhi/ })
    ).toBeTruthy();

    // Milestone chips: FIXED kind(+detail) labels, one cheer button each.
    expect(
      screen.getByRole("button", { name: "Chúc mừng: Lớn thành thiếu nhi" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Chúc mừng: Bé cún mới về nhà" })
    ).toBeTruthy();
    expect(screen.getByText("2026-07-06")).toBeTruthy();

    expect(socialMocks.getFriendSummary).toHaveBeenCalledWith(LAN_ID);
  });

  it("disables the gift button when the visitor has zero food", async () => {
    render(<GardenVisitOverlay hostUserId={LAN_ID} myFood={0} onClose={() => undefined} />);

    const giftButton = (await screen.findByRole("button", {
      name: /Tặng món ăn/
    })) as HTMLButtonElement;

    expect(giftButton.disabled).toBe(true);

    fireEvent.click(giftButton);
    expect(socialMocks.visitGarden).not.toHaveBeenCalled();
  });

  it("gifting calls visitGarden(host, true, null) and disables further gifts", async () => {
    socialMocks.visitGarden.mockResolvedValue({
      ok: true,
      petCount: 1,
      petRecorded: false,
      giftDelivered: true,
      cheerDelivered: false
    });

    const onGiftSent = vi.fn();

    render(
      <GardenVisitOverlay
        hostUserId={LAN_ID}
        myFood={5}
        onClose={() => undefined}
        onGiftSent={onGiftSent}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: /Tặng món ăn/ }));

    await waitFor(() => {
      expect(socialMocks.visitGarden).toHaveBeenCalledWith(LAN_ID, true, null);
    });
    expect(onGiftSent).toHaveBeenCalledTimes(1);

    const spent = (await screen.findByRole("button", {
      name: /Đã tặng hôm nay/
    })) as HTMLButtonElement;

    expect(spent.disabled).toBe(true);
  });

  it("settles into the sent state on gift-cap-reached, no error toast", async () => {
    socialMocks.visitGarden.mockResolvedValue({ ok: false, reason: "gift-cap-reached" });

    render(<GardenVisitOverlay hostUserId={LAN_ID} myFood={5} onClose={() => undefined} />);

    fireEvent.click(await screen.findByRole("button", { name: /Tặng món ăn/ }));

    const spent = (await screen.findByRole("button", {
      name: /Đã tặng hôm nay/
    })) as HTMLButtonElement;

    expect(spent.disabled).toBe(true);
  });

  it("cheering a milestone calls visitGarden with the milestone id, once ever", async () => {
    socialMocks.visitGarden.mockResolvedValue({
      ok: true,
      petCount: 1,
      petRecorded: false,
      giftDelivered: false,
      cheerDelivered: true
    });

    render(<GardenVisitOverlay hostUserId={LAN_ID} myFood={1} onClose={() => undefined} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Chúc mừng: Lớn thành thiếu nhi" })
    );

    await waitFor(() => {
      expect(socialMocks.visitGarden).toHaveBeenCalledWith(LAN_ID, false, "evolve:junior");
    });

    const cheered = (await screen.findByRole("button", {
      name: "Đã chúc mừng: Lớn thành thiếu nhi"
    })) as HTMLButtonElement;

    expect(cheered.disabled).toBe(true);
  });

  it("shows a gently closed gate when the host is not sharing", async () => {
    socialMocks.getFriendSummary.mockResolvedValue({ ok: true, summary: null });

    render(<GardenVisitOverlay hostUserId={LAN_ID} myFood={3} onClose={() => undefined} />);

    expect(
      await screen.findByText("Vườn đang khép cổng nghỉ ngơi — mình ghé lại lần sau nha 🌿")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Tặng món ăn/ })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Mailbox delivery — applyGiftToState (spec §4.2.1)
// ---------------------------------------------------------------------------

function stateWithPet(): DashboardState {
  return adoptPet(createInitialDashboardState(TODAY), "dog", "Xoài", TODAY);
}

const VISIT = { visitId: "v-1", visitDate: TODAY, giftedFood: 1 };

describe("applyGiftToState (mailbox, spec §4.2.1)", () => {
  it("absorbs a gift into the foodGiftsReceived ledger keyed date:visitId", () => {
    const state = stateWithPet();
    const before = deriveFoodBalance(state.companion);
    const { state: next, applied } = applyGiftToState(state, VISIT, TODAY);

    expect(applied).toBe(true);
    expect(next.companion.foodGiftsReceived[`${TODAY}:v-1`]).toBe(1);
    expect(deriveFoodBalance(next.companion)).toBe(before + 1);
    expect(next.companion.food).toBe(before + 1);
  });

  it("is idempotent: the same visit_id applied twice is a no-op (re-ack only)", () => {
    const state = stateWithPet();
    const first = applyGiftToState(state, VISIT, TODAY);
    const second = applyGiftToState(first.state, VISIT, TODAY);

    expect(second.applied).toBe(true);
    expect(second.state).toBe(first.state);
    expect(deriveFoodBalance(second.state.companion)).toBe(
      deriveFoodBalance(first.state.companion)
    );
  });

  it("visits without food (pure pet/cheer) apply as ack-only no-ops", () => {
    const state = stateWithPet();
    const { state: next, applied } = applyGiftToState(
      state,
      { visitId: "v-pet", visitDate: TODAY, giftedFood: 0 },
      TODAY
    );

    expect(applied).toBe(true);
    expect(next).toBe(state);
  });

  it("overflows to +1 bond when the pantry is full, capped at 2/day, then waits", () => {
    let state = stateWithPet();

    // Fill the pantry to FOOD_CAP via a granted-ledger day.
    state = {
      ...state,
      companion: {
        ...state.companion,
        foodGrantedByDate: { [TODAY]: FOOD_CAP },
        food: FOOD_CAP
      }
    };

    const bondBefore = state.companion.pets.dog!.bond;

    const g1 = applyGiftToState(state, { ...VISIT, visitId: "v-a" }, TODAY);
    const g2 = applyGiftToState(g1.state, { ...VISIT, visitId: "v-b" }, TODAY);
    const g3 = applyGiftToState(g2.state, { ...VISIT, visitId: "v-c" }, TODAY);

    // First two gifts: +1 bond each (cap GIFT_OVERFLOW_BOND_PER_DAY = 2)…
    expect(g1.applied).toBe(true);
    expect(g2.applied).toBe(true);
    expect(g2.state.companion.pets.dog!.bond).toBe(bondBefore + GIFT_OVERFLOW_BOND_PER_DAY);
    expect(g2.state.companion.giftOverflowBondByDate[TODAY]).toBe(2);
    // …their ledger keys mark them absorbed without adding food…
    expect(g2.state.companion.foodGiftsReceived[`${TODAY}:v-a`]).toBe(0);
    expect(deriveFoodBalance(g2.state.companion)).toBe(FOOD_CAP);

    // …the third finds no room: NOT applied, stays in the mailbox, unchanged.
    expect(g3.applied).toBe(false);
    expect(g3.state).toBe(g2.state);
  });
});
