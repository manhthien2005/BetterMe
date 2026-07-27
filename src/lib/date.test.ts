import { describe, expect, it } from "vitest";

import { addDaysIso, getDayLabel, getWeekEndIso, getWeekStartIso } from "@/lib/date";

/**
 * Anchors for every case below. 2026-07-27 is a Monday, so 2026-07-26 is the
 * Sunday that closes the *previous* week — the pair the week grid gets wrong
 * most often.
 */
const MONDAY = "2026-07-27";
const SUNDAY_BEFORE = "2026-07-26";

describe("getWeekStartIso", () => {
  it("lands on the same Monday from every day of that week", () => {
    // Mon 27 Jul → Sun 2 Aug all belong to one week.
    for (let offset = 0; offset < 7; offset += 1) {
      expect(getWeekStartIso(addDaysIso(MONDAY, offset))).toBe(MONDAY);
    }
  });

  it("sends Sunday back six days, to the Monday whose week it closes", () => {
    // The trap: Sunday is day 0 in JS, so a naive `1 - day` would jump
    // *forward* to the next Monday and shift the whole grid by a week.
    expect(getWeekStartIso(SUNDAY_BEFORE)).toBe("2026-07-20");
    expect(getWeekStartIso(SUNDAY_BEFORE)).not.toBe(MONDAY);
  });

  it("is idempotent, so a grid can re-normalize its own anchor safely", () => {
    expect(getWeekStartIso(getWeekStartIso("2026-07-30"))).toBe(MONDAY);
    expect(getWeekStartIso(MONDAY)).toBe(MONDAY);
  });

  it("reaches back across a month boundary", () => {
    // Sat 1 Aug still belongs to the week that started in July.
    expect(getWeekStartIso("2026-08-01")).toBe("2026-07-27");
  });

  it("reaches back across a year boundary", () => {
    // Thu 1 Jan 2026 belongs to a week that started in December 2025.
    expect(getWeekStartIso("2026-01-01")).toBe("2025-12-29");
    expect(getWeekStartIso("2026-01-04")).toBe("2025-12-29");
  });
});

describe("getWeekEndIso", () => {
  it("closes the week on Sunday", () => {
    expect(getWeekEndIso(MONDAY)).toBe("2026-08-02");
    expect(getDayLabel(getWeekEndIso(MONDAY))).toBe("Sun");
  });

  it("returns the same Sunday no matter which day of the week is asked", () => {
    for (let offset = 0; offset < 7; offset += 1) {
      expect(getWeekEndIso(addDaysIso(MONDAY, offset))).toBe("2026-08-02");
    }
  });

  it("spans exactly seven days from the week start", () => {
    // The grid renders 7 cells; start + 6 must equal end, or a day is dropped
    // or doubled.
    const samples = ["2026-07-27", "2026-07-26", "2026-08-01", "2026-01-01", "2026-02-28"];

    for (const sample of samples) {
      const start = getWeekStartIso(sample);
      expect(addDaysIso(start, 6)).toBe(getWeekEndIso(sample));
    }
  });

  it("carries the week over a month boundary", () => {
    expect(getWeekEndIso("2026-07-30")).toBe("2026-08-02");
  });

  it("carries the week over a year boundary", () => {
    expect(getWeekEndIso("2025-12-31")).toBe("2026-01-04");
    expect(getWeekStartIso("2025-12-31")).toBe("2025-12-29");
  });
});

describe("getDayLabel", () => {
  it("labels Monday through Sunday in week-grid order", () => {
    const labels = Array.from({ length: 7 }, (_, offset) =>
      getDayLabel(addDaysIso(MONDAY, offset))
    );

    expect(labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("labels Sunday 'Sun', the branch the array lookup can't cover", () => {
    // day === 0 is handled before the array, so an off-by-one there would
    // silently print "Sat" or undefined.
    expect(getDayLabel(SUNDAY_BEFORE)).toBe("Sun");
    expect(getDayLabel("2026-08-02")).toBe("Sun");
  });

  it("never returns undefined for any day of a week", () => {
    for (let offset = 0; offset < 7; offset += 1) {
      expect(getDayLabel(addDaysIso(MONDAY, offset))).toBeTruthy();
    }
  });
});

describe("purity of the week helpers", () => {
  it("does not leak the internal setDate mutation between calls", () => {
    // Each helper parses a fresh Date and mutates it; if that Date were ever
    // shared, the second call would drift.
    expect(getWeekStartIso(SUNDAY_BEFORE)).toBe(getWeekStartIso(SUNDAY_BEFORE));
    expect(getWeekEndIso(SUNDAY_BEFORE)).toBe(getWeekEndIso(SUNDAY_BEFORE));
    expect(getDayLabel(SUNDAY_BEFORE)).toBe(getDayLabel(SUNDAY_BEFORE));
  });

  it("leaves the caller's string untouched", () => {
    const input = MONDAY;

    getWeekStartIso(input);
    getWeekEndIso(input);
    addDaysIso(input, 6);

    expect(input).toBe("2026-07-27");
  });
});

describe("addDaysIso around week boundaries", () => {
  it("steps from Sunday into the next Monday, and back", () => {
    expect(addDaysIso(SUNDAY_BEFORE, 1)).toBe(MONDAY);
    expect(addDaysIso(MONDAY, -1)).toBe(SUNDAY_BEFORE);
  });

  it("keeps a full week's stride aligned on Monday", () => {
    expect(addDaysIso(MONDAY, 7)).toBe("2026-08-03");
    expect(getWeekStartIso(addDaysIso(MONDAY, 7))).toBe("2026-08-03");
    expect(addDaysIso(MONDAY, -7)).toBe("2026-07-20");
  });

  it("rolls over month and year ends without an invalid date", () => {
    expect(addDaysIso("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysIso("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysIso("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles February in a non-leap year", () => {
    // 2026 is not a leap year, so 28 Feb is followed by 1 Mar.
    expect(addDaysIso("2026-02-28", 1)).toBe("2026-03-01");
  });
});
