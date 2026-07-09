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

// ---------------------------------------------------------------------------
// Phase 2: Garden visits & cheers (spec §4)
// ---------------------------------------------------------------------------

/**
 * The friend-visible projection (spec §4.1). AS-BUILT vocab, kept in lockstep
 * with dashboard-data.ts (PetStage / BondTier). Structurally positive-only:
 * NO streak counter or last_active-shaped field (§0.3), and milestones carry
 * NO free text — content is server-derived, the client renders it from a fixed
 * kind(+detail) dictionary.
 */
export type PublishedSummary = {
  userId: string;
  displayName: string | null;
  petName: string | null;
  petSpecies: "dog" | "cat" | null;
  petStage: "baby" | "kid" | "junior" | "teen" | "adult" | null;
  petBondTier: number | null; // integer 1..5 (validated on parse)
  milestones: Array<{
    id: string;
    kind: "evolve" | "bond_tier" | "bloom_week" | "new_pet";
    at: string; // ISO date (YYYY-MM-DD)
    detail?: string; // stage / tier / species — enum-ish, never free text
  }>;
};

export type VisitEntry = {
  visitId: string;
  visitorUserId: string;
  visitorPetName: string | null;
  visitorPetSpecies: "dog" | "cat" | null;
  visitDate: string;
  giftedFood: number;
  cheeredMilestoneId: string | null;
  appliedAt: string | null;
};

export type RefreshMySummaryResult =
  | { ok: true; sharingEnabled: boolean }
  | SocialActionFailure;

export type SetSharingEnabledResult =
  | { ok: true; sharingEnabled: boolean }
  | SocialActionFailure;

export type VisitGardenResult =
  | {
      ok: true;
      petCount: number;
      petRecorded: boolean;
      giftDelivered: boolean;
      cheerDelivered: boolean;
    }
  | SocialActionFailure;

export type AckGardenVisitsResult = { ok: true } | SocialActionFailure;

export type GetMyGardenFeedResult = { ok: true; feed: VisitEntry[] } | SocialActionFailure;

/** summary=null: friend exists but isn't sharing (no row) — render a closed garden. */
export type GetFriendSummaryResult =
  | { ok: true; summary: PublishedSummary | null }
  | SocialActionFailure;

export type GetPendingGardenVisitsResult =
  | { ok: true; visits: VisitEntry[] }
  | SocialActionFailure;

/**
 * Recompute and publish my habit/pet summary for friends to see. If
 * sharing_enabled=false in profiles, this deletes the summary row (opt-out).
 * Returns { ok: true, sharingEnabled: bool } or { ok: false, reason }.
 */
export async function refreshMySummary(): Promise<RefreshMySummaryResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  try {
    const { data, error } = await ctx.supabase.rpc("refresh_my_summary");

    if (error) return rpcFailure(error);

    const obj = asObject(data ?? null);

    if (obj?.status !== "ok") return { ok: false, reason: "bad-response" };

    return { ok: true, sharingEnabled: asBoolean(obj.sharingEnabled, false) };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * The explicit sharing opt-in write path (spec §0.4 — "chia sẻ là opt-in
 * riêng"). Flips profiles.sharing_enabled and publishes/deletes the summary in
 * the SAME transaction server-side (enable -> row appears; disable -> silent
 * delete). Returns { ok: true, sharingEnabled } mirroring refreshMySummary.
 */
export async function setSharingEnabled(enabled: boolean): Promise<SetSharingEnabledResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  try {
    const { data, error } = await ctx.supabase.rpc("set_sharing_enabled", {
      p_enabled: enabled === true
    });

    if (error) return rpcFailure(error);

    const obj = asObject(data ?? null);

    if (obj?.status !== "ok") return { ok: false, reason: "bad-response" };

    return { ok: true, sharingEnabled: asBoolean(obj.sharingEnabled, false) };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Visit a friend's garden, optionally gift food and/or cheer a milestone.
 * Returns { ok: true, petCount, petRecorded, giftDelivered, cheerDelivered } or
 * a failure. Typed errors: "invalid-host", "not-friends", "host-not-sharing",
 * "no-active-pet", "insufficient-food", "milestone-not-found",
 * "already-cheered", "gift-cap-reached". Over-cap petting is NOT an error — the
 * RPC returns ok with petRecorded=false (animation + voice, no record, §4.2).
 */
export async function visitGarden(
  hostUserId: string,
  giftFood: boolean,
  cheerMilestoneId: string | null
): Promise<VisitGardenResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };
  if (typeof hostUserId !== "string" || !UUID_RE.test(hostUserId)) {
    return { ok: false, reason: "invalid-args" };
  }

  try {
    const { data, error } = await ctx.supabase.rpc("visit_garden", {
      p_host_user_id: hostUserId,
      p_gift_food: giftFood === true,
      p_cheer_milestone_id: cheerMilestoneId
    });

    if (error) return rpcFailure(error);

    const obj = asObject(data ?? null);

    if (obj?.status !== "ok") return { ok: false, reason: "bad-response" };

    const petCount = typeof obj.petCount === "number" ? obj.petCount : 0;
    const petRecorded = asBoolean(obj.petRecorded, false);
    const giftDelivered = asBoolean(obj.giftDelivered, false);
    const cheerDelivered = asBoolean(obj.cheerDelivered, false);

    return { ok: true, petCount, petRecorded, giftDelivered, cheerDelivered };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Host acknowledges visits (sets applied_at = now()). The client merges the
 * ledger changes to local state; this RPC is just the ack. Also prunes applied
 * visits older than 72h. Returns { ok: true } or failure.
 */
export async function ackGardenVisits(visitIds: string[]): Promise<AckGardenVisitsResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };
  if (!Array.isArray(visitIds) || visitIds.length === 0) {
    return { ok: false, reason: "invalid-args" };
  }
  // Validate all IDs are UUIDs.
  if (!visitIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return { ok: false, reason: "invalid-args" };
  }

  try {
    const { error } = await ctx.supabase.rpc("ack_garden_visits", { p_visit_ids: visitIds });

    if (error) return rpcFailure(error);

    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Fetch my recent applied garden visits (visitor names, species, gifts, cheers).
 * Returns { ok: true, feed: VisitEntry[] } or failure. Default limit 20.
 */
export async function getMyGardenFeed(limit = 20): Promise<GetMyGardenFeedResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  const safeLimit = typeof limit === "number" && limit > 0 ? limit : 20;

  try {
    const { data, error } = await ctx.supabase.rpc("get_my_garden_feed", { p_limit: safeLimit });

    if (error) return rpcFailure(error);

    const feed = parseFeed(data ?? null);

    return feed !== null ? { ok: true, feed } : { ok: false, reason: "bad-response" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Read a friend's published summary — the ONLY projection friends can see
 * (spec §4.1). Direct RLS-guarded SELECT (friends-only policy), same idiom as
 * unfriend's direct DELETE. A missing row is NOT an error: it means the host
 * isn't sharing (opt-out is silent) — the UI shows a gently closed garden.
 */
export async function getFriendSummary(hostUserId: string): Promise<GetFriendSummaryResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };
  if (typeof hostUserId !== "string" || !UUID_RE.test(hostUserId)) {
    return { ok: false, reason: "invalid-args" };
  }

  try {
    const { data, error } = await ctx.supabase
      .from("published_summaries")
      .select(
        "user_id, display_name, pet_name, pet_species, pet_stage, pet_bond_tier, milestones"
      )
      .eq("user_id", hostUserId)
      .maybeSingle();

    if (error) return { ok: false, reason: error.message || "select-failed" };
    if (!data) return { ok: true, summary: null };

    return { ok: true, summary: parsePublishedSummary(data) };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * Mailbox fetch (spec §4.2.1): my garden_visits still waiting to be applied
 * (applied_at IS NULL). Direct RLS-guarded SELECT — the host-or-visitor policy
 * covers it; get_my_garden_feed only returns *applied* visits, so the pending
 * mailbox needs this separate read. Ordered oldest-first so gifts apply in
 * arrival order (earlier gifts get first claim on the overflow-bond cap).
 */
export async function getPendingGardenVisits(): Promise<GetPendingGardenVisitsResult> {
  const ctx = await getAuthedContext();

  if (!ctx) return { ok: false, reason: "no-session" };

  try {
    const { data, error } = await ctx.supabase
      .from("garden_visits")
      .select(
        "visit_id, visitor_user_id, visit_date, visitor_pet_species, visitor_pet_name, gifted_food, cheered_milestone_id, applied_at"
      )
      .eq("host_user_id", ctx.userId)
      .is("applied_at", null)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, reason: error.message || "select-failed" };

    const visits = (data ?? []).map((row): VisitEntry => {
      const species = row.visitor_pet_species;

      return {
        visitId: row.visit_id,
        visitorUserId: row.visitor_user_id,
        visitorPetName: row.visitor_pet_name,
        visitorPetSpecies: species === "dog" || species === "cat" ? species : null,
        visitDate: row.visit_date,
        giftedFood: typeof row.gifted_food === "number" ? row.gifted_food : 0,
        cheeredMilestoneId: row.cheered_milestone_id,
        appliedAt: row.applied_at
      };
    });

    return { ok: true, visits };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// ---------------------------------------------------------------------------
// Phase 2 parsing helpers
// ---------------------------------------------------------------------------

type PublishedSummaryRow = {
  user_id: string;
  display_name: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_stage: string | null;
  pet_bond_tier: number | null;
  milestones: Json;
};

function parseMilestone(value: Json): PublishedSummary["milestones"][number] | null {
  const obj = asObject(value);

  if (!obj) return null;

  const id = asString(obj.id);
  const kind = asString(obj.kind);
  const at = asString(obj.at);

  if (id === null || at === null) return null;
  if (kind !== "evolve" && kind !== "bond_tier" && kind !== "bloom_week" && kind !== "new_pet") {
    return null;
  }

  const detail = asString(obj.detail);

  // Keep `detail` optional (never set it to undefined) so the shape stays
  // clean under exactOptionalPropertyTypes.
  return detail === null ? { id, kind, at } : { id, kind, at, detail };
}

function parsePublishedSummary(row: PublishedSummaryRow): PublishedSummary {
  const species = row.pet_species;
  const stage = row.pet_stage;
  const tier = row.pet_bond_tier;
  const milestonesRaw = row.milestones;

  return {
    userId: row.user_id,
    displayName: row.display_name,
    petName: row.pet_name,
    petSpecies: species === "dog" || species === "cat" ? species : null,
    petStage:
      stage === "baby" ||
      stage === "kid" ||
      stage === "junior" ||
      stage === "teen" ||
      stage === "adult"
        ? stage
        : null,
    petBondTier:
      typeof tier === "number" && Number.isInteger(tier) && tier >= 1 && tier <= 5 ? tier : null,
    milestones: Array.isArray(milestonesRaw)
      ? milestonesRaw
          .map(parseMilestone)
          .filter((entry): entry is PublishedSummary["milestones"][number] => entry !== null)
      : []
  };
}

function parseVisitEntry(value: Json): VisitEntry | null {
  const obj = asObject(value);

  if (!obj) return null;

  const visitId = asString(obj.visitId);
  const visitorUserId = asString(obj.visitorUserId);
  const visitDate = asString(obj.visitDate);

  if (visitId === null || visitorUserId === null || visitDate === null) return null;

  const petSpecies = asString(obj.visitorPetSpecies);
  const giftedFood = typeof obj.giftedFood === "number" ? obj.giftedFood : 0;

  return {
    visitId,
    visitorUserId,
    visitorPetName: asString(obj.visitorPetName),
    visitorPetSpecies: petSpecies === "dog" || petSpecies === "cat" ? petSpecies : null,
    visitDate,
    giftedFood,
    cheeredMilestoneId: asString(obj.cheeredMilestoneId),
    appliedAt: asString(obj.appliedAt)
  };
}

function parseFeed(value: Json | null): VisitEntry[] | null {
  if (!Array.isArray(value)) return null;

  const entries = value.map(parseVisitEntry).filter((entry): entry is VisitEntry => entry !== null);

  return entries;
}
