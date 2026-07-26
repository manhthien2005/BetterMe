import { describe, expect, it } from "vitest";

import { activeNavKey, NAV_ITEMS } from "@/components/app/nav-items";

describe("nav model", () => {
  it("has exactly the four spaces, in reading order", () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      "today",
      "calendar",
      "nep",
      "friends"
    ]);
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/dashboard",
      "/calendar",
      "/nep",
      "/friends"
    ]);
  });

  it("labels every space in Vietnamese", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Hôm nay",
      "Lịch & nhịp",
      "Nhà của Nếp",
      "Bạn vườn"
    ]);
  });

  it("gives the alert badge to Bạn vườn and nobody else (spec §2.1)", () => {
    expect(NAV_ITEMS.filter((item) => item.badge).map((item) => item.key)).toEqual([
      "friends"
    ]);
  });

  it("uses line-icons, never emoji, for navigation (spec §2.4)", () => {
    for (const item of NAV_ITEMS) {
      expect(typeof item.icon).not.toBe("string");
      expect(item.label).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("resolves the active space from the pathname", () => {
    expect(activeNavKey("/dashboard")).toBe("today");
    expect(activeNavKey("/calendar")).toBe("calendar");
    expect(activeNavKey("/nep")).toBe("nep");
    expect(activeNavKey("/friends")).toBe("friends");
  });

  it("matches nested paths but not unrelated ones", () => {
    expect(activeNavKey("/nep/album")).toBe("nep");
    expect(activeNavKey("/login")).toBeNull();
    expect(activeNavKey("/nepal")).toBeNull();
  });
});
