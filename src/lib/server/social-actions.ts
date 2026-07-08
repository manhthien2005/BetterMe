"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";

/**
 * Social Garden Phase 1 — friending server actions (spec §3, §8).
 * Same conventions as src/lib/server/sync-actions.ts: these NEVER redirect or
 * throw — every failure comes back as { ok: false, reason }, and under the dev
 * auth bypass (no Supabase session) every action no-ops with
 * { ok: false, reason: "no-session" }.
 *
 * Security posture:
 * - profiles RLS stays owner-only; every cross-user lookup goes through the
 *   SECURITY DEFINER RPCs added in supabase/schema.sql Phase 1.
 * - sendFriendRequest does NOT pre-validate code shape locally (beyond the
 *   empty string): every lookup attempt — including garbage codes — must burn
 *   rate-limit quota SERVER-side, so quota semantics stay server-owned.
 * - unfriend is the one direct table write: the friendships DELETE RLS policy
 *   covers it (spec: "Unfriend = delete row, im lặng").
 */

// ---------------------------------------------------------------------------
// Exported types (UI contract)
// ---------------------------------------------------------------------------

export type AvatarKind = "nep" | "dog" | "cat";

export type FriendshipStatus = "pending" | "accepted";

/** Parsed union of send_friend_request's jsonb "status" contract. */
export type SendFriendRequestStatus =
  | { status: "sent"; displayName: string; otherUserId: string }
  | { status: "already-pending"; direction: "sent" | "received" }
  | { status: "already-friends" }
  | { status: "rate-limited" }
  | { status: "not-found" }
  | { status: "self" }
  | { status: "cap-reached" }
  | { status: "their-cap-reached" };

/** Parsed union of respond_friend_request's jsonb "status" contract. */
export type RespondFriendRequestStatus =
  | { status: "accepted"; displayName: string }
  | { status: "declined" };

export type FriendEntry = {
  otherUserId: string;
  displayName: string;
  avatarKind: AvatarKind;
  status: FriendshipStatus;
  /** true = I sent this request; false = I received it. */
  requestedByMe: boolean;
  /** ISO timestamp, null while pending. */
  acceptedAt: string | null;
};

export type FriendsOverviewMe = {
  displayName: string;
  avatarKind: AvatarKind;
  /** 16 hex chars (64-bit), the "Mã vườn của Sếp" the UI shows + copies. */
  inviteCode: string;
  sharingEnabled: boolean;
};

export type FriendsOverview = {
  me: FriendsOverviewMe;
  /** Pending + accepted, ordered by accepted_at (nulls last) then created_at. */
  friends: FriendEntry[];
};

/**
 * Failure reasons: "no-session" (dev bypass / signed out), "empty-code",
 * "invalid-args", "display-name-too-long", "invalid-avatar-kind",
 * "bad-response" (malformed RPC jsonb), "network", or a server error message.
 */
export type SocialActionFailure = { ok: false; reason: "no-session" | string };

export type SendFriendRequestResult =
  | { ok: true; result: SendFriendRequestStatus }
  | SocialActionFailure;

export type RespondFriendRequestResult =
  | { ok: true; result: RespondFriendRequestStatus }
  | SocialActionFailure;

export type UnfriendResult = { ok: true } | SocialActionFailure;

export type FriendsOverviewResult = { ok: true; overview: FriendsOverview } | SocialActionFailure;

export type UpdateMyProfileResult = { ok: true } | SocialActionFailure;

// ---------------------------------------------------------------------------
// Session helper (mirror of sync-actions, but unfriend also needs the uid)
// ---------------------------------------------------------------------------

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AuthedContext = { supabase: SupabaseServerClient; userId: string };

async function getAuthedContext(): Promise<AuthedContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return { supabase, userId: user.id };
  } catch {
    // Missing env vars (dev bypass) or cookie store unavailable — no session.
    return null;
  }
}

function rpcFailure(error: { code?: string | null; message?: string | null }): SocialActionFailure {
  // P0001 = not-authenticated raised inside the RPC (session expired between
  // our check and the call) — surface it the same way as no session at all.
  if (error.code === "P0001") return { ok: false, reason: "no-session" };

  return { ok: false, reason: error.message || "rpc-failed" };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Look up a friend's invite code and create a pending friendship.
 * Normalizes (trim + uppercase) before the RPC call, but deliberately does NOT
 * reject short/garbage codes locally — every lookup attempt burns quota
 * server-side (spec §3.3). The ONLY local guard is the empty string.
 */
export async function sendFriendRequest(rawCode: string): Promise<SendFriendRequestResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";

  if (code === "") return { ok: false, reason: "empty-code" };

  try {
    const { data, error } = await ctx.supabase.rpc("send_friend_request", { p_code: code });

    if (error) return rpcFailure(error);

    const parsed = parseSendFriendRequestStatus(data ?? null);

    return parsed ? { ok: true, result: parsed } : { ok: false, reason: "bad-response" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** Accept (accept=true) or silently decline (accept=false) a pending request. */
export async function respondFriendRequest(
  otherUserId: string,
  accept: boolean
): Promise<RespondFriendRequestResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };
  if (typeof otherUserId !== "string" || !UUID_RE.test(otherUserId)) {
    return { ok: false, reason: "invalid-args" };
  }

  try {
    const { data, error } = await ctx.supabase.rpc("respond_friend_request", {
      p_other: otherUserId,
      p_accept: accept === true
    });

    if (error) return rpcFailure(error);

    const parsed = parseRespondFriendRequestStatus(data ?? null);

    return parsed ? { ok: true, result: parsed } : { ok: false, reason: "bad-response" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Unfriend = delete the friendship row, silently (spec §3.3 — Finch model, no
 * notification). Direct table delete through the friendships DELETE RLS
 * policy; deleting an already-gone row is still a success (idempotent).
 */
export async function unfriend(otherUserId: string): Promise<UnfriendResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };
  if (typeof otherUserId !== "string" || !UUID_RE.test(otherUserId)) {
    return { ok: false, reason: "invalid-args" };
  }

  // Canonical pair (friendships CHECK user_a < user_b). Postgres compares
  // uuids bytewise, which for the canonical lowercase-hex text form is plain
  // lexicographic order — so least/greatest is safe to compute client-side.
  const self = ctx.userId.toLowerCase();
  const other = otherUserId.toLowerCase();

  if (self === other) return { ok: false, reason: "invalid-args" };

  const [userA, userB] = self < other ? [self, other] : [other, self];

  try {
    const { error } = await ctx.supabase
      .from("friendships")
      .delete()
      .eq("user_a", userA)
      .eq("user_b", userB);

    if (error) return { ok: false, reason: error.message || "delete-failed" };

    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Fetch my profile card (display name, avatar, invite code, sharing flag) and
 * my friend list (pending + accepted). The RPC is the ONLY sanctioned path
 * that cross-reads profiles (SECURITY DEFINER) — friends' entries carry
 * identity fields only, ZERO habit/pet data in Phase 1.
 */
export async function getFriendsOverview(): Promise<FriendsOverviewResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  try {
    const { data, error } = await ctx.supabase.rpc("get_friends_overview");

    if (error) return rpcFailure(error);

    const overview = parseFriendsOverview(data ?? null);

    return overview ? { ok: true, overview } : { ok: false, reason: "bad-response" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Update display name (<= 30 chars after trim; empty allowed = clears) and
 * avatar kind. Validated locally for fast feedback, but the RPC re-validates —
 * the server stays the source of truth.
 */
export async function updateMyProfile(
  displayName: string,
  avatarKind: AvatarKind
): Promise<UpdateMyProfileResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  const name = typeof displayName === "string" ? displayName.trim() : null;

  if (name === null) return { ok: false, reason: "invalid-args" };
  // Count code points (closer to Postgres char_length than UTF-16 .length).
  if ([...name].length > 30) return { ok: false, reason: "display-name-too-long" };
  // Runtime guard too — server actions are network-callable endpoints.
  if (avatarKind !== "nep" && avatarKind !== "dog" && avatarKind !== "cat") {
    return { ok: false, reason: "invalid-avatar-kind" };
  }

  try {
    const { data, error } = await ctx.supabase.rpc("update_my_profile", {
      p_display_name: name,
      p_avatar_kind: avatarKind
    });

    if (error) return rpcFailure(error);

    return asObject(data ?? null)?.status === "ok"
      ? { ok: true }
      : { ok: false, reason: "bad-response" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// ---------------------------------------------------------------------------
// Defensive jsonb parsing (the RPC shapes are ours, but never trust the wire)
// ---------------------------------------------------------------------------

type JsonObject = { [key: string]: Json | undefined };

function asObject(value: Json | null | undefined): JsonObject | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) return value;

  return null;
}

function asString(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: Json | undefined, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseAvatarKind(value: Json | undefined): AvatarKind {
  return value === "dog" || value === "cat" || value === "nep" ? value : "nep";
}

function parseSendFriendRequestStatus(value: Json | null): SendFriendRequestStatus | null {
  const obj = asObject(value);
  const status = asString(obj?.status);

  switch (status) {
    case "sent": {
      const otherUserId = asString(obj?.otherUserId);

      if (otherUserId === null) return null;

      return { status, displayName: asString(obj?.displayName) ?? "", otherUserId };
    }
    case "already-pending":
      return {
        status,
        direction: asString(obj?.direction) === "received" ? "received" : "sent"
      };
    case "already-friends":
    case "rate-limited":
    case "not-found":
    case "self":
    case "cap-reached":
    case "their-cap-reached":
      return { status };
    default:
      return null;
  }
}

function parseRespondFriendRequestStatus(value: Json | null): RespondFriendRequestStatus | null {
  const obj = asObject(value);
  const status = asString(obj?.status);

  switch (status) {
    case "accepted":
      return { status, displayName: asString(obj?.displayName) ?? "" };
    case "declined":
      return { status };
    default:
      return null;
  }
}

function parseFriendEntry(value: Json): FriendEntry | null {
  const obj = asObject(value);

  if (!obj) return null;

  const otherUserId = asString(obj.otherUserId);
  const status = asString(obj.status);

  if (otherUserId === null || (status !== "pending" && status !== "accepted")) return null;

  return {
    otherUserId,
    displayName: asString(obj.displayName) ?? "",
    avatarKind: parseAvatarKind(obj.avatarKind),
    status,
    requestedByMe: asBoolean(obj.requestedByMe, false),
    acceptedAt: asString(obj.acceptedAt)
  };
}

function parseFriendsOverview(value: Json | null): FriendsOverview | null {
  const obj = asObject(value);
  const me = asObject(obj?.me ?? null);

  if (!me) return null;

  const inviteCode = asString(me.inviteCode);

  // Without an invite code there is nothing to render on the "Bạn vườn" card —
  // treat as malformed rather than inventing one.
  if (inviteCode === null) return null;

  const friendsRaw = obj?.friends;

  return {
    me: {
      displayName: asString(me.displayName) ?? "",
      avatarKind: parseAvatarKind(me.avatarKind),
      inviteCode,
      sharingEnabled: asBoolean(me.sharingEnabled, false)
    },
    friends: Array.isArray(friendsRaw)
      ? friendsRaw.map(parseFriendEntry).filter((entry): entry is FriendEntry => entry !== null)
      : []
  };
}
