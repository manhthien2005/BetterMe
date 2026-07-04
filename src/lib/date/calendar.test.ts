import { describe, expect, it } from "vitest";

import type { TrackerSettings } from "@/types";
import {
  addDays,
  buildMonthGrid,
  buildTrackingRange,
  getWeekEnd,
  getWeekStart,
  getZonedToday
} from "./calendar";

const settings: TrackerSettings = {
  timezone: "Asia/Ho_Chi_Minh",
  startDate: "2026-01-01",
  selectedDate: "2026-01-15",
  trackerDays: 30,
  targetCompletionRate: 0.8,
  themeId: "cute-cat"
};

describe("calendar primitives", () => {
  it("derives today in an IANA timezone across a date boundary", () => {
    const instant = new Date("2026-01-01T18:30:00.000Z");
    expect(getZonedToday(instant, "Asia/Ho_Chi_Minh")).toBe("2026-01-02");
    expect(getZonedToday(instant, "America/New_York")).toBe("2026-01-01");
  });

  it("adds calendar days safely across DST and year boundaries", () => {
    expect(addDays("2024-03-09", 2)).toBe("2024-03-11");
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("uses Monday through Sunday week boundaries", () => {
    expect(getWeekStart("2026-01-01")).toBe("2025-12-29");
    expect(getWeekStart("2026-01-04")).toBe("2025-12-29");
    expect(getWeekEnd("2026-01-01")).toBe("2026-01-04");
  });

  it("builds a stable six-week month grid", () => {
    const grid = buildMonthGrid("2026-02-18");
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-01-26");
    expect(grid.at(-1)).toBe("2026-03-08");
  });

  it("covers configured, current, and selected weeks in the tracking range", () => {
    const range = buildTrackingRange(settings, new Date("2026-01-10T12:00:00.000Z"));
    expect(range[0]).toBe("2025-12-29");
    expect(range.at(-1)).toBe("2026-01-30");
    expect(range).toHaveLength(33);
  });
});
