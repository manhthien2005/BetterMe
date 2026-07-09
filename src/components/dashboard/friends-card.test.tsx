import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatInviteCode,
  FriendsCard,
  friendRequestResultCopy
} from "@/components/dashboard/friends-card";
import type {
  FriendEntry,
  FriendsOverview,
  SendFriendRequestResult
} from "@/lib/server/social-actions";

// The server-action module is mocked wholesale (it's "use server" + Supabase);
// the card only ever sees these seven functions.
const socialMocks = vi.hoisted(() => ({
  getFriendsOverview: vi.fn(),
  getMyGardenFeed: vi.fn(),
  refreshMySummary: vi.fn(),
  respondFriendRequest: vi.fn(),
  sendFriendRequest: vi.fn(),
  setSharingEnabled: vi.fn(),
  unfriend: vi.fn(),
  updateMyProfile: vi.fn()
}));

vi.mock("@/lib/server/social-actions", () => socialMocks);

const LAN_ID = "aaaaaaaa-0000-4000-8000-000000000001";

function makeOverview(
  friends: FriendEntry[] = [],
  me: Partial<FriendsOverview["me"]> = {}
): FriendsOverview {
  return {
    me: {
      displayName: "Thiên",
      avatarKind: "nep",
      inviteCode: "3F9A1B2C4D5E6C7D",
      sharingEnabled: false,
      ...me
    },
    friends
  };
}

function incomingRequest(): FriendEntry {
  return {
    otherUserId: LAN_ID,
    displayName: "Lan",
    avatarKind: "cat",
    status: "pending",
    requestedByMe: false,
    acceptedAt: null
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  socialMocks.getFriendsOverview.mockResolvedValue({ ok: true, overview: makeOverview() });
  socialMocks.getMyGardenFeed.mockResolvedValue({ ok: true, feed: [] });
  socialMocks.refreshMySummary.mockResolvedValue({ ok: true, sharingEnabled: true });
  socialMocks.setSharingEnabled.mockResolvedValue({ ok: true, sharingEnabled: true });
});

describe("FriendsCard", () => {
  it("renders the invite code grouped 4-4-4-4 with a copy affordance", async () => {
    render(<FriendsCard />);

    expect(await screen.findByText("3F9A 1B2C 4D5E 6C7D")).toBeTruthy();
    expect(screen.getByLabelText("Chép mã vườn")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Bạn vườn 🏡" })).toBeTruthy();
  });

  it("auto-uppercases the code input and shows the gentle not-found copy", async () => {
    socialMocks.sendFriendRequest.mockResolvedValue({
      ok: true,
      result: { status: "not-found" }
    });

    render(<FriendsCard />);

    const input = (await screen.findByLabelText(
      "Nhập mã vườn của bạn"
    )) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "1234abcd-1234 abcd" } });
    expect(input.value).toBe("1234ABCD1234ABCD");

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn 🌱" }));

    expect(
      await screen.findByText("Không tìm thấy vườn với mã này — Sếp kiểm tra lại nha")
    ).toBeTruthy();
    expect(socialMocks.sendFriendRequest).toHaveBeenCalledWith("1234ABCD1234ABCD");
  });

  it("prompts for a display name when none is set yet", async () => {
    socialMocks.getFriendsOverview.mockResolvedValue({
      ok: true,
      overview: makeOverview([], { displayName: "" })
    });

    render(<FriendsCard />);

    expect(
      await screen.findByText("Đặt tên hiển thị để bạn bè nhận ra vườn của Sếp nè")
    ).toBeTruthy();
    expect(screen.getByLabelText("Tên hiển thị")).toBeTruthy();
  });

  it("accepting an incoming request calls respondFriendRequest(id, true)", async () => {
    socialMocks.getFriendsOverview.mockResolvedValue({
      ok: true,
      overview: makeOverview([incomingRequest()])
    });
    socialMocks.respondFriendRequest.mockResolvedValue({
      ok: true,
      result: { status: "accepted", displayName: "Lan" }
    });

    render(<FriendsCard />);

    fireEvent.click(await screen.findByRole("button", { name: "Đón Lan vào vườn" }));

    await waitFor(() => {
      expect(socialMocks.respondFriendRequest).toHaveBeenCalledWith(LAN_ID, true);
    });
    // Flush the post-accept refresh so no state update lands after the test.
    await waitFor(() => {
      expect(socialMocks.getFriendsOverview).toHaveBeenCalledTimes(2);
    });
  });

  it("shows the sharing toggle as on when the garden is already shared", async () => {
    socialMocks.getFriendsOverview.mockResolvedValue({
      ok: true,
      overview: makeOverview([], { sharingEnabled: true })
    });

    render(<FriendsCard />);

    const toggle = (await screen.findByRole("switch", {
      name: "Mở cổng vườn cho bạn ghé thăm"
    })) as HTMLButtonElement;

    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("flips sharing on via setSharingEnabled and reflects the returned state", async () => {
    socialMocks.getFriendsOverview
      .mockResolvedValueOnce({
        ok: true,
        overview: makeOverview([], { sharingEnabled: false })
      })
      .mockResolvedValue({ ok: true, overview: makeOverview([], { sharingEnabled: true }) });
    socialMocks.setSharingEnabled.mockResolvedValue({ ok: true, sharingEnabled: true });

    render(<FriendsCard />);

    const toggle = (await screen.findByRole("switch", {
      name: "Mở cổng vườn cho bạn ghé thăm"
    })) as HTMLButtonElement;

    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(socialMocks.setSharingEnabled).toHaveBeenCalledWith(true);
    });
    await waitFor(() => {
      expect(
        (
          screen.getByRole("switch", {
            name: "Mở cổng vườn cho bạn ghé thăm"
          }) as HTMLButtonElement
        ).getAttribute("aria-checked")
      ).toBe("true");
    });
  });

  it("reverts the toggle and stays quiet when setSharingEnabled fails", async () => {
    socialMocks.getFriendsOverview.mockResolvedValue({
      ok: true,
      overview: makeOverview([], { sharingEnabled: false })
    });
    socialMocks.setSharingEnabled.mockResolvedValue({ ok: false, reason: "network" });

    render(<FriendsCard />);

    const toggle = (await screen.findByRole("switch", {
      name: "Mở cổng vườn cho bạn ghé thăm"
    })) as HTMLButtonElement;

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(socialMocks.setSharingEnabled).toHaveBeenCalledWith(true);
    });
    // Optimistic flip rolls back to off; no refresh() on failure.
    await waitFor(() => {
      expect(
        (
          screen.getByRole("switch", {
            name: "Mở cổng vườn cho bạn ghé thăm"
          }) as HTMLButtonElement
        ).getAttribute("aria-checked")
      ).toBe("false");
    });
  });
});

describe("friendRequestResultCopy", () => {
  it("distinguishes already-pending by direction", () => {
    expect(
      friendRequestResultCopy({
        ok: true,
        result: { status: "already-pending", direction: "sent" }
      })
    ).toBe("Lời mời đang chờ bạn ấy mở cửa vườn");
    expect(
      friendRequestResultCopy({
        ok: true,
        result: { status: "already-pending", direction: "received" }
      })
    ).toBe("Bạn ấy đã mời Sếp trước rồi — kéo xuống xác nhận nè!");
  });

  it("covers every status with cozy copy and falls back for the sent name", () => {
    expect(
      friendRequestResultCopy({
        ok: true,
        result: { status: "sent", displayName: "Lan", otherUserId: LAN_ID }
      })
    ).toBe("Đã gửi lời mời tới vườn của Lan 🌱");
    expect(
      friendRequestResultCopy({
        ok: true,
        result: { status: "sent", displayName: "", otherUserId: LAN_ID }
      })
    ).toBe("Đã gửi lời mời tới vườn của bạn ấy 🌱");
    expect(
      friendRequestResultCopy({ ok: true, result: { status: "self" } })
    ).toBe("Đây là mã của chính Sếp mà 😄");
    expect(
      friendRequestResultCopy({ ok: true, result: { status: "already-friends" } })
    ).toBe("Hai vườn đã là bạn rồi 🌸");
    expect(
      friendRequestResultCopy({ ok: true, result: { status: "rate-limited" } })
    ).toBe("Hôm nay gửi nhiều lời mời rồi, mai gửi tiếp nha ☁️");
  });

  it("never blames — no status copy contains 'sai' or 'lỗi'", () => {
    const results: SendFriendRequestResult[] = [
      { ok: true, result: { status: "sent", displayName: "Lan", otherUserId: LAN_ID } },
      { ok: true, result: { status: "already-pending", direction: "sent" } },
      { ok: true, result: { status: "already-pending", direction: "received" } },
      { ok: true, result: { status: "already-friends" } },
      { ok: true, result: { status: "rate-limited" } },
      { ok: true, result: { status: "not-found" } },
      { ok: true, result: { status: "self" } },
      { ok: true, result: { status: "cap-reached" } },
      { ok: true, result: { status: "their-cap-reached" } },
      { ok: false, reason: "empty-code" },
      { ok: false, reason: "network" }
    ];

    results.forEach((result) => {
      const copy = friendRequestResultCopy(result);

      expect(copy.trim().length).toBeGreaterThan(0);
      expect(copy.toLowerCase()).not.toMatch(/\bsai\b|lỗi/);
    });
  });
});

describe("formatInviteCode", () => {
  it("groups 16 chars as 4-4-4-4", () => {
    expect(formatInviteCode("3F9A1B2C4D5E6C7D")).toBe("3F9A 1B2C 4D5E 6C7D");
  });
});
