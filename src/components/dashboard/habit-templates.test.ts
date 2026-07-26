import { describe, expect, it } from "vitest";

import {
  COUNT_UNITS,
  HABIT_TEMPLATES,
  suggestIcons
} from "@/components/dashboard/habit-templates";

describe("HABIT_TEMPLATES", () => {
  it("offers the five starters from the spec", () => {
    expect(HABIT_TEMPLATES.map((template) => template.label)).toEqual([
      "Uống nước",
      "Đọc sách",
      "Thể dục",
      "Thiền",
      "Ngủ sớm"
    ]);
  });

  it("gives the water template a real daily count", () => {
    const water = HABIT_TEMPLATES[0];

    expect(water.icon).toBe("💧");
    expect(water.trackingType).toBe("count");
    expect(water.target).toBe(8);
    expect(water.unit).toBe("ly");
  });

  it("keeps every template's tracking type coherent with its target", () => {
    for (const template of HABIT_TEMPLATES) {
      if (template.trackingType === "check") expect(template.target).toBe(1);
      else expect(template.target).toBeGreaterThan(1);
      if (template.trackingType !== "count") expect(template.unit).toBeNull();
    }
  });
});

describe("suggestIcons", () => {
  it("reads Vietnamese habit names, with or without diacritics", () => {
    expect(suggestIcons("Uống đủ nước")[0]).toBe("💧");
    expect(suggestIcons("uong du nuoc")[0]).toBe("💧");
    expect(suggestIcons("Đọc sách trước khi ngủ")[0]).toBe("📖");
    expect(suggestIcons("Chạy bộ buổi sáng")[0]).toBe("🏃");
  });

  it("always offers something, never an empty picker", () => {
    expect(suggestIcons("").length).toBeGreaterThan(0);
    expect(suggestIcons("zzzz").length).toBeGreaterThan(0);
  });

  it("offers at most three, without duplicates", () => {
    const icons = suggestIcons("Uống nước");

    expect(icons.length).toBeLessThanOrEqual(3);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe("COUNT_UNITS", () => {
  it("starts with the unit a Vietnamese user reaches for first", () => {
    expect(COUNT_UNITS[0]).toBe("ly");
    expect(COUNT_UNITS).toContain("trang");
    expect(COUNT_UNITS).toContain("lần");
  });
});
