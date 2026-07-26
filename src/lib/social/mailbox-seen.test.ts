import { beforeEach, describe, expect, it } from "vitest";

import {
  countUnseen,
  loadMailboxSeen,
  MAILBOX_SEEN_KEY,
  saveMailboxSeen
} from "@/lib/social/mailbox-seen";

describe("mailbox seen ledger", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a map of celebrated visits", () => {
    saveMailboxSeen({ "visit-1": "2026-07-20" });

    expect(loadMailboxSeen("2026-07-26")).toEqual({ "visit-1": "2026-07-20" });
  });

  it("prunes entries older than the 30-day window", () => {
    window.localStorage.setItem(
      MAILBOX_SEEN_KEY,
      JSON.stringify({ old: "2026-06-01", fresh: "2026-07-20" })
    );

    expect(loadMailboxSeen("2026-07-26")).toEqual({ fresh: "2026-07-20" });
  });

  it("keeps an entry sitting exactly on the cutoff", () => {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify({ edge: "2026-06-26" }));

    expect(loadMailboxSeen("2026-07-26")).toEqual({ edge: "2026-06-26" });
  });

  it("survives junk in storage", () => {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, "not json");
    expect(loadMailboxSeen("2026-07-26")).toEqual({});

    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify(["a"]));
    expect(loadMailboxSeen("2026-07-26")).toEqual({});

    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify({ a: 7 }));
    expect(loadMailboxSeen("2026-07-26")).toEqual({});
  });

  it("returns an empty map when nothing was ever saved", () => {
    expect(loadMailboxSeen("2026-07-26")).toEqual({});
  });

  it("counts only visits that were never celebrated", () => {
    const seen = { "visit-1": "2026-07-20" };

    expect(
      countUnseen([{ visitId: "visit-1" }, { visitId: "visit-2" }, { visitId: "visit-3" }], seen)
    ).toBe(2);
    expect(countUnseen([], seen)).toBe(0);
  });
});
