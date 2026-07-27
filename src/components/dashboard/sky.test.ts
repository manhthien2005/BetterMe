import { describe, expect, it } from "vitest";

import { SKY_GREETINGS, SKY_STYLES, skyPhaseAt } from "./sky";

describe("skyPhaseAt", () => {
  it("splits the day the same way habit buổi does", () => {
    // Deliberately the same boundaries as TimeOfDay in habit-model: a habit
    // filed under 🌙 Tối and the evening sky must not disagree about when
    // evening starts.
    expect(skyPhaseAt(5)).toBe("morning");
    expect(skyPhaseAt(11)).toBe("morning");
    expect(skyPhaseAt(12)).toBe("afternoon");
    expect(skyPhaseAt(17)).toBe("afternoon");
    expect(skyPhaseAt(18)).toBe("evening");
    expect(skyPhaseAt(23)).toBe("evening");
  });

  it("the small hours are still last night, not tomorrow morning", () => {
    // 02:00 is someone still awake, not someone up early.
    expect(skyPhaseAt(0)).toBe("evening");
    expect(skyPhaseAt(4)).toBe("evening");
  });

  it("survives a junk hour instead of rendering an undefined sky", () => {
    expect(skyPhaseAt(-1)).toBe("evening");
    expect(skyPhaseAt(99)).toBe("evening");
    expect(skyPhaseAt(Number.NaN)).toBe("evening");
  });
});

describe("SKY_STYLES", () => {
  it("names a class set for every phase", () => {
    (["morning", "afternoon", "evening"] as const).forEach((phase) => {
      expect(SKY_STYLES[phase].panel).toContain(`sky-${phase}-from`);
      expect(SKY_STYLES[phase].panel).toContain(`sky-${phase}-to`);
      expect(SKY_STYLES[phase].ink).toBe(`text-sky-${phase}-ink`);
      expect(SKY_STYLES[phase].inkSoft).toBe(`text-sky-${phase}-ink-soft`);
    });
  });

  it("spells every class out in full, so Tailwind can actually see it", () => {
    // Tailwind scans source TEXT. A class assembled from a template string at
    // runtime is a class it never generates, and the panel renders unstyled.
    Object.values(SKY_STYLES).forEach((style) => {
      Object.values(style).forEach((value) => {
        expect(value).not.toContain("${");
      });
    });
  });

  it("greets in Vietnamese, one per phase", () => {
    expect(SKY_GREETINGS.morning).toBe("Chào buổi sáng");
    expect(SKY_GREETINGS.afternoon).toBe("Chào buổi chiều");
    expect(SKY_GREETINGS.evening).toBe("Chào buổi tối");
  });
});
