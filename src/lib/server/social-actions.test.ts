import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getFriendsOverview,
  respondFriendRequest,
  sendFriendRequest,
  setSharingEnabled,
  unfriend,
  updateMyProfile
} from "@/lib/server/social-actions";

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: supabaseMocks.getUser },
    rpc: supabaseMocks.rpc,
    from: supabaseMocks.from
  }))
}));

// SELF > OTHER lexicographically — canonical friendship pair is (OTHER, SELF).
const SELF_ID = "bbbbbbbb-0000-4000-8000-000000000000";
const OTHER_ID = "aaaaaaaa-0000-4000-8000-000000000000";

function signIn(id: string = SELF_ID) {
  supabaseMocks.getUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function signOut() {
  supabaseMocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
}

function mockDeleteChain(result: { error: { message: string } | null }) {
  const eqUserB = vi.fn().mockResolvedValue(result);
  const eqUserA = vi.fn(() => ({ eq: eqUserB }));
  const del = vi.fn(() => ({ eq: eqUserA }));

  supabaseMocks.from.mockReturnValue({ delete: del });

  return { del, eqUserA, eqUserB };
}

beforeEach(() => {
  vi.clearAllMocks();
  signIn();
});

describe("no-session behavior (dev bypass)", () => {
  it("every action no-ops with { ok: false, reason: 'no-session' }", async () => {
    signOut();

    expect(await sendFriendRequest("3F9AC2D400000000")).toEqual({
      ok: false,
      reason: "no-session"
    });
    expect(await respondFriendRequest(OTHER_ID, true)).toEqual({
      ok: false,
      reason: "no-session"
    });
    expect(await unfriend(OTHER_ID)).toEqual({ ok: false, reason: "no-session" });
    expect(await getFriendsOverview()).toEqual({ ok: false, reason: "no-session" });
    expect(await updateMyProfile("Thiên", "nep")).toEqual({ ok: false, reason: "no-session" });

    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });
});

describe("sendFriendRequest", () => {
  it("guards ONLY the empty string locally", async () => {
    expect(await sendFriendRequest("")).toEqual({ ok: false, reason: "empty-code" });
    expect(await sendFriendRequest("   ")).toEqual({ ok: false, reason: "empty-code" });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("passes short/garbage codes through to the server — quota is server-owned", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "not-found" }, error: null });

    const result = await sendFriendRequest("xy");

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("send_friend_request", { p_code: "XY" });
    expect(result).toEqual({ ok: true, result: { status: "not-found" } });
  });

  it("trims and uppercases the code before the RPC call", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "not-found" }, error: null });

    await sendFriendRequest("  3f9ac2d4e1b0a798  ");

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("send_friend_request", {
      p_code: "3F9AC2D4E1B0A798"
    });
  });

  it("parses the 'sent' status with displayName and otherUserId", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: { status: "sent", displayName: "Lan", otherUserId: OTHER_ID },
      error: null
    });

    expect(await sendFriendRequest("3F9AC2D4E1B0A798")).toEqual({
      ok: true,
      result: { status: "sent", displayName: "Lan", otherUserId: OTHER_ID }
    });
  });

  it("parses 'already-pending' with its direction", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: { status: "already-pending", direction: "received" },
      error: null
    });

    expect(await sendFriendRequest("3F9AC2D4E1B0A798")).toEqual({
      ok: true,
      result: { status: "already-pending", direction: "received" }
    });
  });

  it.each(["rate-limited", "self", "cap-reached", "their-cap-reached", "already-friends"])(
    "passes through the '%s' status",
    async (status) => {
      supabaseMocks.rpc.mockResolvedValue({ data: { status }, error: null });

      expect(await sendFriendRequest("3F9AC2D4E1B0A798")).toEqual({
        ok: true,
        result: { status }
      });
    }
  );

  it("rejects unknown statuses and malformed payloads as bad-response", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "???" }, error: null });
    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "bad-response" });

    supabaseMocks.rpc.mockResolvedValue({ data: null, error: null });
    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "bad-response" });

    // 'sent' without an otherUserId is unusable by the UI.
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "sent" }, error: null });
    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "bad-response" });
  });

  it("maps RPC errors to failures (P0001 becomes no-session)", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "not-authenticated" }
    });
    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "no-session" });

    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "boom" }
    });
    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "boom" });
  });

  it("returns network on a thrown transport error", async () => {
    supabaseMocks.rpc.mockRejectedValue(new Error("fetch failed"));

    expect(await sendFriendRequest("AB")).toEqual({ ok: false, reason: "network" });
  });
});

describe("respondFriendRequest", () => {
  it("rejects a non-uuid other user id locally", async () => {
    expect(await respondFriendRequest("", true)).toEqual({ ok: false, reason: "invalid-args" });
    expect(await respondFriendRequest("not-a-uuid", true)).toEqual({
      ok: false,
      reason: "invalid-args"
    });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("parses 'accepted' and forwards accept=true", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: { status: "accepted", displayName: "Lan" },
      error: null
    });

    expect(await respondFriendRequest(OTHER_ID, true)).toEqual({
      ok: true,
      result: { status: "accepted", displayName: "Lan" }
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("respond_friend_request", {
      p_other: OTHER_ID,
      p_accept: true
    });
  });

  it("parses 'declined' and forwards accept=false", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "declined" }, error: null });

    expect(await respondFriendRequest(OTHER_ID, false)).toEqual({
      ok: true,
      result: { status: "declined" }
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("respond_friend_request", {
      p_other: OTHER_ID,
      p_accept: false
    });
  });

  it("surfaces P0004 business errors by message", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0004", message: "cannot-respond-to-own-request" }
    });

    expect(await respondFriendRequest(OTHER_ID, true)).toEqual({
      ok: false,
      reason: "cannot-respond-to-own-request"
    });
  });
});

describe("unfriend", () => {
  it("deletes the canonical pair when self is the greater uuid", async () => {
    const chain = mockDeleteChain({ error: null });

    expect(await unfriend(OTHER_ID)).toEqual({ ok: true });

    expect(supabaseMocks.from).toHaveBeenCalledWith("friendships");
    expect(chain.eqUserA).toHaveBeenCalledWith("user_a", OTHER_ID);
    expect(chain.eqUserB).toHaveBeenCalledWith("user_b", SELF_ID);
  });

  it("deletes the canonical pair when self is the lesser uuid", async () => {
    signIn(OTHER_ID);
    const chain = mockDeleteChain({ error: null });

    expect(await unfriend(SELF_ID)).toEqual({ ok: true });

    expect(chain.eqUserA).toHaveBeenCalledWith("user_a", OTHER_ID);
    expect(chain.eqUserB).toHaveBeenCalledWith("user_b", SELF_ID);
  });

  it("rejects invalid or self-targeting ids locally", async () => {
    expect(await unfriend("not-a-uuid")).toEqual({ ok: false, reason: "invalid-args" });
    expect(await unfriend(SELF_ID)).toEqual({ ok: false, reason: "invalid-args" });
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("surfaces delete errors", async () => {
    mockDeleteChain({ error: { message: "permission denied" } });

    expect(await unfriend(OTHER_ID)).toEqual({ ok: false, reason: "permission denied" });
  });
});

describe("getFriendsOverview", () => {
  it("parses the full overview shape", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        me: {
          displayName: "Thiên",
          avatarKind: "dog",
          inviteCode: "3F9AC2D4E1B0A798",
          sharingEnabled: false
        },
        friends: [
          {
            otherUserId: OTHER_ID,
            displayName: "Lan",
            avatarKind: "cat",
            status: "accepted",
            requestedByMe: true,
            acceptedAt: "2026-07-08T03:00:00Z"
          },
          {
            otherUserId: SELF_ID,
            displayName: "Minh",
            avatarKind: "nep",
            status: "pending",
            requestedByMe: false,
            acceptedAt: null
          }
        ]
      },
      error: null
    });

    expect(await getFriendsOverview()).toEqual({
      ok: true,
      overview: {
        me: {
          displayName: "Thiên",
          avatarKind: "dog",
          inviteCode: "3F9AC2D4E1B0A798",
          sharingEnabled: false
        },
        friends: [
          {
            otherUserId: OTHER_ID,
            displayName: "Lan",
            avatarKind: "cat",
            status: "accepted",
            requestedByMe: true,
            acceptedAt: "2026-07-08T03:00:00Z"
          },
          {
            otherUserId: SELF_ID,
            displayName: "Minh",
            avatarKind: "nep",
            status: "pending",
            requestedByMe: false,
            acceptedAt: null
          }
        ]
      }
    });
  });

  it("drops malformed friend entries and defaults unknown avatar kinds to nep", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        me: { displayName: "", avatarKind: "alien", inviteCode: "AB12", sharingEnabled: true },
        friends: [
          "not-an-object",
          { displayName: "Ẩn danh" }, // no otherUserId
          { otherUserId: OTHER_ID, status: "blocked" }, // unknown status
          { otherUserId: OTHER_ID, status: "pending", avatarKind: "dragon" }
        ]
      },
      error: null
    });

    expect(await getFriendsOverview()).toEqual({
      ok: true,
      overview: {
        me: { displayName: "", avatarKind: "nep", inviteCode: "AB12", sharingEnabled: true },
        friends: [
          {
            otherUserId: OTHER_ID,
            displayName: "",
            avatarKind: "nep",
            status: "pending",
            requestedByMe: false,
            acceptedAt: null
          }
        ]
      }
    });
  });

  it("treats a missing me / invite code as bad-response", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { me: null, friends: [] }, error: null });
    expect(await getFriendsOverview()).toEqual({ ok: false, reason: "bad-response" });

    supabaseMocks.rpc.mockResolvedValue({
      data: { me: { displayName: "Thiên" }, friends: [] },
      error: null
    });
    expect(await getFriendsOverview()).toEqual({ ok: false, reason: "bad-response" });
  });
});

describe("updateMyProfile", () => {
  it("rejects names over 30 chars (after trim) locally, without an RPC roundtrip", async () => {
    expect(await updateMyProfile("a".repeat(31), "nep")).toEqual({
      ok: false,
      reason: "display-name-too-long"
    });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects an invalid avatar kind at runtime", async () => {
    expect(await updateMyProfile("Thiên", "unicorn" as never)).toEqual({
      ok: false,
      reason: "invalid-avatar-kind"
    });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("trims the name (30 chars after trim is fine) and calls the RPC", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "ok" }, error: null });

    expect(await updateMyProfile(`  ${"a".repeat(30)}  `, "cat")).toEqual({ ok: true });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("update_my_profile", {
      p_display_name: "a".repeat(30),
      p_avatar_kind: "cat"
    });
  });

  it("allows the empty name (clears to default) and surfaces server P0004", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "ok" }, error: null });
    expect(await updateMyProfile("   ", "nep")).toEqual({ ok: true });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("update_my_profile", {
      p_display_name: "",
      p_avatar_kind: "nep"
    });

    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0004", message: "display-name-too-long" }
    });
    expect(await updateMyProfile("Thiên", "nep")).toEqual({
      ok: false,
      reason: "display-name-too-long"
    });
  });
});



describe("setSharingEnabled", () => {
  it("no-ops with no-session under the dev bypass", async () => {
    signOut();

    expect(await setSharingEnabled(true)).toEqual({ ok: false, reason: "no-session" });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("calls set_sharing_enabled and parses the returned flag (enable)", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: { status: "ok", sharingEnabled: true },
      error: null
    });

    expect(await setSharingEnabled(true)).toEqual({ ok: true, sharingEnabled: true });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("set_sharing_enabled", { p_enabled: true });
  });

  it("coerces the arg to a strict boolean and reflects a disable", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: { status: "ok", sharingEnabled: false },
      error: null
    });

    expect(await setSharingEnabled(false)).toEqual({ ok: true, sharingEnabled: false });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("set_sharing_enabled", { p_enabled: false });
  });

  it("treats a malformed payload as bad-response", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { status: "???" }, error: null });
    expect(await setSharingEnabled(true)).toEqual({ ok: false, reason: "bad-response" });

    supabaseMocks.rpc.mockResolvedValue({ data: null, error: null });
    expect(await setSharingEnabled(true)).toEqual({ ok: false, reason: "bad-response" });
  });

  it("maps P0001 to no-session and a thrown transport to network", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "not-authenticated" }
    });
    expect(await setSharingEnabled(true)).toEqual({ ok: false, reason: "no-session" });

    supabaseMocks.rpc.mockRejectedValue(new Error("fetch failed"));
    expect(await setSharingEnabled(true)).toEqual({ ok: false, reason: "network" });
  });
});
