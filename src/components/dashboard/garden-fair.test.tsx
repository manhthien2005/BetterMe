import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GardenFairCard } from "@/components/dashboard/garden-fair";
import type { FairGarden } from "@/lib/server/social-actions";

// "use server" + Supabase — mock the module wholesale. The card only touches
// these three actions; deriveFairView + getDashboardToday run for real.
const socialMocks = vi.hoisted(() => ({
  getGardenFair: vi.fn(),
  getSharedRhythms: vi.fn(),
  setFairOptIn: vi.fn()
}));

vi.mock("@/lib/server/social-actions", () => socialMocks);

function fairGarden(userId: string, overrides: Partial<FairGarden> = {}): FairGarden {
  return {
    userId,
    displayName: `Vườn ${userId}`,
    avatarKind: "nep",
    petSpecies: "dog",
    weeklyGoodDays: 3,
    // A long-past week so lanternScore never matches M-1 in these date-agnostic
    // tests (lantern logic is covered exhaustively in garden-fair.test.ts).
    weekStart: "2020-01-06",
    prevWeekGoodDays: null,
    prevWeekStart: null,
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  socialMocks.getGardenFair.mockResolvedValue({
    ok: true,
    fairOptIn: true,
    fair: { me: null, gardens: [] }
  });
  socialMocks.getSharedRhythms.mockResolvedValue({ ok: true, rhythms: [] });
  socialMocks.setFairOptIn.mockResolvedValue({ ok: true, sharingEnabled: true, fairOptIn: true });
});

describe("GardenFairCard", () => {
  it("renders gardens in the given (accepted_at) order, blooms >= 4, silent on week-0", async () => {
    socialMocks.getGardenFair.mockResolvedValue({
      ok: true,
      fairOptIn: true,
      fair: {
        me: fairGarden("me", { weeklyGoodDays: 6 }),
        gardens: [
          fairGarden("a", { weeklyGoodDays: 4 }),
          fairGarden("z", { weeklyGoodDays: 0 }), // week-0 -> absolute silence
          fairGarden("b", { weeklyGoodDays: 2 })
        ]
      }
    });

    render(<GardenFairCard />);

    const list = await screen.findByRole("list", { name: "Vườn ở hội chợ" });
    const items = within(list).getAllByRole("listitem");

    // me, a, b — z is silently dropped.
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain("Vườn của Sếp");
    expect(items[1].textContent).toContain("Vườn a");
    expect(items[2].textContent).toContain("Vườn b");
    expect(within(list).queryByText(/Vườn z/)).toBeNull();

    // Bloom band: me (6) and a (4) bloom; b (2) does not — no greying, no rank.
    expect(within(items[0]).getByLabelText("Vườn nở hoa")).toBeTruthy();
    expect(within(items[1]).getByLabelText("Vườn nở hoa")).toBeTruthy();
    expect(within(items[2]).queryByLabelText("Vườn nở hoa")).toBeNull();
  });

  it("shows the opt-in hint (no gardens) when the fair is off", async () => {
    socialMocks.getGardenFair.mockResolvedValue({
      ok: true,
      fairOptIn: false,
      fair: { me: null, gardens: [] }
    });

    render(<GardenFairCard />);

    expect(await screen.findByText(/Bật hội chợ để cùng bạn bè/)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Vườn ở hội chợ" })).toBeNull();
  });

  it("reflects fairOptIn and flips it via setFairOptIn", async () => {
    socialMocks.getGardenFair
      .mockResolvedValueOnce({ ok: true, fairOptIn: false, fair: { me: null, gardens: [] } })
      .mockResolvedValue({ ok: true, fairOptIn: true, fair: { me: null, gardens: [] } });

    render(<GardenFairCard />);

    const toggle = (await screen.findByRole("switch", {
      name: "Mang vườn ra hội chợ cuối tuần"
    })) as HTMLButtonElement;

    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(socialMocks.setFairOptIn).toHaveBeenCalledWith(true);
    });
    await waitFor(() => {
      expect(
        (
          screen.getByRole("switch", {
            name: "Mang vườn ra hội chợ cuối tuần"
          }) as HTMLButtonElement
        ).getAttribute("aria-checked")
      ).toBe("true");
    });
  });

  it("renders shared rhythms as positive, per-friend, never a ranked board", async () => {
    socialMocks.getSharedRhythms.mockResolvedValue({
      ok: true,
      rhythms: [
        { otherUserId: "a", displayName: "Lan", avatarKind: "cat", rhythmDays: 5 },
        { otherUserId: "b", displayName: "Minh", avatarKind: "dog", rhythmDays: 12 }
      ]
    });

    render(<GardenFairCard />);

    expect(await screen.findByText(/Nhịp chung với Lan/)).toBeTruthy();
    expect(screen.getByText(/Nhịp chung với Minh/)).toBeTruthy();
  });

  it("never renders a rank, streak, or downward-comparison surface", async () => {
    socialMocks.getGardenFair.mockResolvedValue({
      ok: true,
      fairOptIn: true,
      fair: {
        me: fairGarden("me", { weeklyGoodDays: 6 }),
        gardens: [fairGarden("a", { weeklyGoodDays: 2 })]
      }
    });
    socialMocks.getSharedRhythms.mockResolvedValue({
      ok: true,
      rhythms: [{ otherUserId: "a", displayName: "Lan", avatarKind: "cat", rhythmDays: 3 }]
    });

    const { container } = render(<GardenFairCard />);

    await screen.findByRole("list", { name: "Vườn ở hội chợ" });

    const text = container.textContent ?? "";

    expect(text).not.toContain("🔥");
    expect(text).not.toMatch(/\bthua\b|kém|xếp cuối|hạng \d|hạng nhất|top \d|#\d|còn \d+ ngày/i);
  });
});
