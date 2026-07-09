import { beforeEach, describe, expect, it } from "vitest";

import type { BondTier, PetSpecies } from "@/components/dashboard/dashboard-data";
import {
  getGuestLine,
  getGuestVoicePool,
  getPetLine,
  getVoicePool,
  resetVoiceBags,
  type GuestEvent,
  type PetEvent
} from "@/components/dashboard/pet-voice";

const SPECIES: PetSpecies[] = ["dog", "cat"];
const TIERS: BondTier[] = [1, 2, 3, 4, 5];
const EVENTS: PetEvent[] = [
  "morning",
  "habitDone",
  "allDone",
  "feeding",
  "petting",
  "comeback",
  "night",
  "evolve",
  "idle",
  "friendVisit",
  "friendVisitGift",
  "fairLantern",
  "sharedRhythm"
];
const SOCIAL_EVENTS: PetEvent[] = [
  "friendVisit",
  "friendVisitGift",
  "fairLantern",
  "sharedRhythm"
];
const GUEST_EVENTS: GuestEvent[] = ["guestGreeting", "guestPet", "guestGift"];

// Invariant 1 (no guilt) — the original banned list, now checked across every pool.
const GUILT_PHRASES = [
  "thất vọng",
  "buồn vì cậu",
  "buồn vì Sếp",
  "tại cậu",
  "tại Sếp",
  "bỏ rơi",
  "đói lắm"
];

// Social invariant (spec §0.1) — no line may ever compare the user *down* to anyone.
const COMPARISON_PHRASES = [
  "thua",
  "kém hơn",
  "xếp cuối",
  "bét",
  "chậm hơn",
  "giỏi hơn Sếp",
  "giỏi hơn cậu"
];

function hostLines(species: PetSpecies): string[] {
  return TIERS.flatMap((tier) => EVENTS.flatMap((event) => getVoicePool(species, tier, event)));
}

function guestLines(species: PetSpecies): string[] {
  return GUEST_EVENTS.flatMap((event) => getGuestVoicePool(species, event));
}

function everyLine(): string[] {
  return SPECIES.flatMap((species) => [...hostLines(species), ...guestLines(species)]);
}

describe("pet voice packs", () => {
  beforeEach(() => {
    resetVoiceBags();
  });

  it("has a non-empty pool for every species, tier, and event", () => {
    SPECIES.forEach((species) => {
      TIERS.forEach((tier) => {
        EVENTS.forEach((event) => {
          const pool = getVoicePool(species, tier, event);

          expect(pool.length).toBeGreaterThanOrEqual(2);
          pool.forEach((line) => {
            expect(line.trim().length).toBeGreaterThan(0);
            expect(line.length).toBeLessThanOrEqual(80);
          });
        });
      });
    });
  });

  it("covers every new social and guest pool with at least 2 short lines", () => {
    SPECIES.forEach((species) => {
      TIERS.forEach((tier) => {
        SOCIAL_EVENTS.forEach((event) => {
          const pool = getVoicePool(species, tier, event);

          expect(pool.length).toBeGreaterThanOrEqual(2);
          pool.forEach((line) => {
            expect(line.trim().length).toBeGreaterThan(0);
            expect(line.length).toBeLessThanOrEqual(80);
          });
        });
      });

      GUEST_EVENTS.forEach((event) => {
        const pool = getGuestVoicePool(species, event);

        expect(pool.length).toBeGreaterThanOrEqual(2);
        pool.forEach((line) => {
          expect(line.trim().length).toBeGreaterThan(0);
          expect(line.length).toBeLessThanOrEqual(80);
        });
      });
    });
  });

  it("keeps the plain friendVisit pool gift-free — 🎁/quà only in friendVisitGift (§4.2.1)", () => {
    SPECIES.forEach((species) => {
      TIERS.forEach((tier) => {
        getVoicePool(species, tier, "friendVisit").forEach((line) => {
          expect(line).not.toContain("quà");
          expect(line).not.toContain("🎁");
        });
      });
    });
  });

  it("keeps the species voices distinct: dog says gâu, cat says meo", () => {
    const dogLines = TIERS.flatMap((tier) =>
      EVENTS.flatMap((event) => getVoicePool("dog", tier, event))
    ).join(" ");
    const catLines = TIERS.flatMap((tier) =>
      EVENTS.flatMap((event) => getVoicePool("cat", tier, event))
    ).join(" ");

    expect(dogLines.toLowerCase()).toContain("gâu");
    expect(catLines.toLowerCase()).toContain("meo");
    // The dog defers to "Sếp", the cat keeps its tsundere distance with "tôi".
    expect(dogLines).toContain("Sếp");
    expect(catLines).toContain("tôi");
    // Voices must never cross.
    expect(dogLines.toLowerCase()).not.toContain("meo");
    expect(catLines.toLowerCase()).not.toContain("gâu");
  });

  it("never guilts the user — in any pool, guest lines included", () => {
    const everything = everyLine().join(" ");

    GUILT_PHRASES.forEach((guiltPhrase) => {
      expect(everything.toLowerCase()).not.toContain(guiltPhrase.toLowerCase());
    });
  });

  it("never compares anyone down — social lines celebrate, they never rank", () => {
    const everything = everyLine().join(" ");

    COMPARISON_PHRASES.forEach((phrase) => {
      expect(everything.toLowerCase()).not.toContain(phrase.toLowerCase());
    });
  });

  it("cycles through the whole pool before repeating (shuffle bag)", () => {
    const pool = getVoicePool("dog", 1, "habitDone");
    const drawn = new Set(
      Array.from({ length: pool.length }, () => getPetLine("dog", 1, "habitDone"))
    );

    expect(drawn.size).toBe(pool.length);
  });

  it("cycles through a new social pool before repeating (shuffle bag)", () => {
    const pool = getVoicePool("cat", 3, "friendVisit");
    const drawn = new Set(
      Array.from({ length: pool.length }, () => getPetLine("cat", 3, "friendVisit"))
    );

    expect(drawn.size).toBe(pool.length);
  });

  it("returns lines from the matching pool", () => {
    const line = getPetLine("cat", 5, "comeback", () => 0.5);

    expect(getVoicePool("cat", 5, "comeback")).toContain(line);
  });
});

describe("guest voice packs", () => {
  beforeEach(() => {
    resetVoiceBags();
  });

  it("returns guest lines from the matching species pool", () => {
    SPECIES.forEach((species) => {
      GUEST_EVENTS.forEach((event) => {
        const line = getGuestLine(species, event, () => 0.5);

        expect(getGuestVoicePool(species, event)).toContain(line);
      });
    });
  });

  it("keeps guest voices in character: dog never meows, cat never barks", () => {
    const dogGuest = guestLines("dog").join(" ");
    const catGuest = guestLines("cat").join(" ");

    expect(dogGuest.toLowerCase()).toContain("gâu");
    expect(catGuest.toLowerCase()).toContain("meo");
    expect(dogGuest.toLowerCase()).not.toContain("meo");
    expect(catGuest.toLowerCase()).not.toContain("gâu");
  });

  it("cycles through the whole guest pool before repeating (shuffle bag)", () => {
    const pool = getGuestVoicePool("cat", "guestPet");
    const drawn = new Set(
      Array.from({ length: pool.length }, () => getGuestLine("cat", "guestPet"))
    );

    expect(drawn.size).toBe(pool.length);
  });
});
