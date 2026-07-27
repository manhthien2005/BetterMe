import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CompanionPetView } from "@/components/dashboard/dashboard-data";
import { NepMiniCard } from "@/components/dashboard/nep-mini-card";

const PET: CompanionPetView = {
  species: "dog",
  name: "Nếp",
  stage: "kid",
  bondTier: 3,
  bond: 42,
  bondTierLabel: "Bạn thân",
  bondProgress: 0.4,
  growthDays: 12,
  daysToNextStage: 3,
  isActive: true,
  canPetToday: true
};

/** The words the no-guilt invariant keeps out of the pet's corner. */
const GUILT_WORDS = ["quên", "bỏ mặc", "chưa cho ăn", "tệ", "kém", "thua", "lười"];

function renderCard(overrides: Partial<React.ComponentProps<typeof NepMiniCard>> = {}) {
  const props = {
    bubble: null,
    food: 2,
    onFeed: vi.fn(),
    onPet: vi.fn(),
    pet: PET,
    ...overrides
  };

  return { ...render(<NepMiniCard {...props} />), props };
}

describe("NepMiniCard", () => {
  it("names the pet and says how the bond is doing", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: /Nếp/ })).toBeTruthy();

    const bar = screen.getByRole("progressbar");

    expect(bar.getAttribute("aria-valuenow")).toBe("3");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
    // The tier label is the readable part — a lone number is not a bond.
    expect(bar.getAttribute("aria-label")).toContain("Bạn thân");
    expect(screen.getByText("Bạn thân")).toBeTruthy();
  });

  it("wires the two actions to the handlers the pet's home already uses", () => {
    const { props } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: /Cho ăn/ }));
    fireEvent.click(screen.getByRole("button", { name: /Vuốt ve/ }));

    expect(props.onFeed).toHaveBeenCalledTimes(1);
    expect(props.onPet).toHaveBeenCalledTimes(1);
  });

  it("keeps exactly one primary button in the region", () => {
    renderCard();

    // Spec §2.3: at most one tier-1 button per region. Here that is "Cho ăn";
    // "Vuốt ve" has to be secondary or the eye has two things to obey.
    expect(screen.getByRole("button", { name: /Cho ăn/ }).className).toContain("bg-action");
    expect(screen.getByRole("button", { name: /Vuốt ve/ }).className).not.toContain("bg-action");
  });

  it("dims feeding when the tray is empty without a word of blame", () => {
    const { container } = renderCard({ food: 0 });

    expect(screen.getByRole("button", { name: /Cho ăn/ }).hasAttribute("disabled")).toBe(true);

    const text = container.textContent!.toLowerCase();

    for (const word of GUILT_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("points home to /nep", () => {
    renderCard();

    expect(screen.getByRole("link", { name: /Nếp/ }).getAttribute("href")).toBe("/nep");
  });

  it("invites adoption instead of showing an empty bond bar", () => {
    const { container } = renderCard({ pet: null });

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("button", { name: /Cho ăn/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Nếp/ }).getAttribute("href")).toBe("/nep");

    const text = container.textContent!.toLowerCase();

    for (const word of GUILT_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("passes the pet's line along when there is one", () => {
    renderCard({ bubble: "Hôm nay trời đẹp ghê!" });

    expect(screen.getByText("Hôm nay trời đẹp ghê!")).toBeTruthy();
  });

  it("uses tokens, not the v2 palette", () => {
    const { container } = renderCard();

    expect(container.innerHTML).not.toMatch(/matcha|sakura|plum|wafer|mauve|butter|rice|mochi/);
  });
});
