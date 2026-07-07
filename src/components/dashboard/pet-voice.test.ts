import { beforeEach, describe, expect, it } from "vitest";

import type { BondTier, PetSpecies } from "@/components/dashboard/dashboard-data";
import {
  getPetLine,
  getVoicePool,
  resetVoiceBags,
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
  "idle"
];

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

  it("never guilts the user", () => {
    const everything = SPECIES.flatMap((species) =>
      TIERS.flatMap((tier) => EVENTS.flatMap((event) => getVoicePool(species, tier, event)))
    ).join(" ");

    ["thất vọng", "buồn vì cậu", "buồn vì Sếp", "tại cậu", "tại Sếp", "bỏ rơi", "đói lắm"].forEach(
      (guiltPhrase) => {
        expect(everything.toLowerCase()).not.toContain(guiltPhrase.toLowerCase());
      }
    );
  });

  it("cycles through the whole pool before repeating (shuffle bag)", () => {
    const pool = getVoicePool("dog", 1, "habitDone");
    const drawn = new Set(
      Array.from({ length: pool.length }, () => getPetLine("dog", 1, "habitDone"))
    );

    expect(drawn.size).toBe(pool.length);
  });

  it("returns lines from the matching pool", () => {
    const line = getPetLine("cat", 5, "comeback", () => 0.5);

    expect(getVoicePool("cat", 5, "comeback")).toContain(line);
  });
});
