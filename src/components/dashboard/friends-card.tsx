"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getFriendsOverview,
  respondFriendRequest,
  sendFriendRequest,
  unfriend,
  updateMyProfile,
  type AvatarKind,
  type FriendEntry,
  type FriendsOverview,
  type SendFriendRequestResult
} from "@/lib/server/social-actions";
import { cn } from "@/lib/utils";

/**
 * "Bạn vườn 🏡" — Social Garden Phase 1 bento card (spec §3.3).
 *
 * Mounted by dashboard-client ONLY while the sync engine is enabled (a live
 * Supabase session + sync opt-in) — the social layer rides on sync. Phase 1
 * boundary: friends are identity only (avatar + display name); ZERO habit,
 * streak, or pet data crosses between users, and every display name renders
 * as a plain React text node — never markup (spec §8).
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep";

/** Avatar = mascot/pet, never an upload (spec §3.1). */
const AVATAR_OPTIONS: Array<{ kind: AvatarKind; emoji: string; label: string }> = [
  { kind: "nep", emoji: "🍡", label: "Nếp" },
  { kind: "dog", emoji: "🐶", label: "cún" },
  { kind: "cat", emoji: "🐱", label: "mèo" }
];

const AVATAR_EMOJI: Record<AvatarKind, string> = { nep: "🍡", dog: "🐶", cat: "🐱" };

/** Quiet, never-alarming line for transport hiccups — no blame, no red. */
const QUIET_NETWORK_NOTE = "Mạng hơi chập chờn — Sếp thử lại sau chút nha ☁️";

const SIMPLE_STATUS_COPY: Record<
  "already-friends" | "rate-limited" | "not-found" | "self" | "cap-reached" | "their-cap-reached",
  string
> = {
  "already-friends": "Hai vườn đã là bạn rồi 🌸",
  "rate-limited": "Hôm nay gửi nhiều lời mời rồi, mai gửi tiếp nha ☁️",
  "not-found": "Không tìm thấy vườn với mã này — Sếp kiểm tra lại nha",
  self: "Đây là mã của chính Sếp mà 😄",
  "cap-reached": "Vườn của Sếp đã đông vui lắm rồi — kín sân 50 bạn nè 🌼",
  "their-cap-reached": "Vườn bạn ấy đang đông khách lắm — mình ghé lại sau nha 🌼"
};

/**
 * Maps a sendFriendRequest outcome to its cozy Vietnamese line. Pure and
 * exported so the no-guilt copy contract is unit-testable on its own.
 */
export function friendRequestResultCopy(result: SendFriendRequestResult): string {
  if (!result.ok) {
    return result.reason === "empty-code"
      ? "Sếp nhập mã vườn của bạn trước đã nha ✨"
      : QUIET_NETWORK_NOTE;
  }

  const outcome = result.result;

  if (outcome.status === "sent") {
    return `Đã gửi lời mời tới vườn của ${outcome.displayName || "bạn ấy"} 🌱`;
  }

  if (outcome.status === "already-pending") {
    // Direction matters: my own pending invite vs one already waiting for me.
    return outcome.direction === "received"
      ? "Bạn ấy đã mời Sếp trước rồi — kéo xuống xác nhận nè!"
      : "Lời mời đang chờ bạn ấy mở cửa vườn";
  }

  return SIMPLE_STATUS_COPY[outcome.status];
}

/** Groups the 16-char invite code 4-4-4-4: "3F9A1B2C4D5E6C7D" → "3F9A 1B2C 4D5E 6C7D". */
export function formatInviteCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1 ");
}

/** Uppercased 16-hex codes only — pasted spaces/dashes just fall away. */
function normalizeCodeInput(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 16);
}

function friendLabel(entry: FriendEntry): string {
  return entry.displayName || "Một vườn chưa đặt tên";
}

type LoadPhase = "loading" | "ready" | "error";

export function FriendsCard() {
  const [overview, setOverview] = useState<FriendsOverview | null>(null);
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendNote, setSendNote] = useState<string | null>(null);
  const [busyFriendId, setBusyFriendId] = useState<string | null>(null);
  const [confirmingUnfriendId, setConfirmingUnfriendId] = useState<string | null>(null);
  const codeChipRef = useRef<HTMLElement | null>(null);

  const refresh = useCallback(async () => {
    const result = await getFriendsOverview();

    if (result.ok) {
      setOverview(result.overview);
      setPhase("ready");
    } else {
      // Quiet failure: keep whatever we already show; only the very first
      // fetch falls through to the soft retry line.
      setPhase((current) => (current === "ready" ? "ready" : "error"));
    }
  }, []);

  // Fetched AFTER mount — the dashboard's first paint never waits on this.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function copyInviteCode() {
    const code = overview?.me.inviteCode;

    if (!code) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard-unavailable");

      await navigator.clipboard.writeText(code);
      toast.success("Đã chép mã vườn ☁️");
    } catch {
      // No clipboard API (old browser / blocked permission): select the chip
      // text so a plain Ctrl+C finishes the job.
      const chip = codeChipRef.current;
      const selection = window.getSelection();

      if (chip && selection) {
        const range = document.createRange();

        range.selectNodeContents(chip);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      toast("Sếp bấm Ctrl+C để chép mã nè 📋");
    }
  }

  async function saveProfile(displayName: string, avatarKind: AvatarKind) {
    if (!overview || savingProfile) return;

    setSavingProfile(true);

    const result = await updateMyProfile(displayName, avatarKind);

    setSavingProfile(false);

    if (result.ok) {
      // Optimistic-ish: show the new identity right away, then re-fetch.
      setOverview({
        ...overview,
        me: { ...overview.me, displayName: displayName.trim(), avatarKind }
      });
      setEditingName(false);
      void refresh();
    } else {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  async function handleSendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending) return;

    setSending(true);
    setSendNote(null);

    const result = await sendFriendRequest(codeDraft);

    setSending(false);
    setSendNote(friendRequestResultCopy(result));

    if (result.ok && result.result.status === "sent") {
      setCodeDraft("");
      void refresh();
    }
  }

  async function respond(entry: FriendEntry, accept: boolean) {
    if (busyFriendId) return;

    setBusyFriendId(entry.otherUserId);

    const result = await respondFriendRequest(entry.otherUserId, accept);

    setBusyFriendId(null);

    if (result.ok) {
      if (result.result.status === "accepted") {
        toast.success(`Đã đón ${friendLabel(entry)} vào vườn 🤗`);
      }

      void refresh();
    } else {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  async function handleUnfriend(entry: FriendEntry) {
    if (busyFriendId) return;

    setBusyFriendId(entry.otherUserId);

    const result = await unfriend(entry.otherUserId);

    setBusyFriendId(null);
    setConfirmingUnfriendId(null);

    // Silent by design (spec §3.3, Finch model): no toast, no notification —
    // the list simply updates.
    if (result.ok) {
      void refresh();
    } else {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  const friends = overview?.friends ?? [];
  const incoming = friends.filter((f) => f.status === "pending" && !f.requestedByMe);
  const outgoing = friends.filter((f) => f.status === "pending" && f.requestedByMe);
  const accepted = friends.filter((f) => f.status === "accepted");
  const showNameForm = editingName || overview?.me.displayName === "";

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:4/1/5/19]">
      <div>
        <h2 className="font-display text-lg font-bold text-plum">Bạn vườn 🏡</h2>
        <p className="mt-1 text-sm font-semibold text-mauve">
          Kết bạn bằng mã vườn — chỉ tên và avatar được chia sẻ, vườn ai người nấy chăm.
        </p>
      </div>

      {phase === "loading" ? <FriendsCardSkeleton /> : null}

      {phase === "error" ? (
        <p className="mt-4 text-sm font-semibold text-mauve">
          Góc bạn bè chưa ghé được mây.{" "}
          <button
            className={cn(
              "squishy rounded-full font-bold text-matcha-deep underline underline-offset-4 transition hover:text-plum",
              FOCUS_RING
            )}
            onClick={() => {
              setPhase("loading");
              void refresh();
            }}
            type="button"
          >
            Thử lại nha ☁️
          </button>
        </p>
      ) : null}

      {phase === "ready" && overview ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="grid content-start gap-3">
            <div className="rounded-2xl border border-wafer bg-white/75 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                Mã vườn của Sếp
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code
                  className="rounded-xl border border-wafer bg-rice px-3 py-2 font-mono text-sm font-bold tracking-widest text-plum"
                  ref={codeChipRef}
                >
                  {formatInviteCode(overview.me.inviteCode)}
                </code>
                <button
                  aria-label="Chép mã vườn"
                  className={cn(
                    "squishy flex h-9 w-9 items-center justify-center rounded-full border border-wafer bg-white/85 text-base shadow-mochi transition hover:bg-white",
                    FOCUS_RING
                  )}
                  onClick={() => void copyInviteCode()}
                  title="Chép mã vườn"
                  type="button"
                >
                  📋
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-mauve">
                Gửi mã này cho bạn để hai vườn tìm thấy nhau.
              </p>
            </div>

            <div className="rounded-2xl border border-wafer bg-white/75 p-3">
              {showNameForm ? (
                <>
                  <p className="text-sm font-semibold text-mauve">
                    {overview.me.displayName === ""
                      ? "Đặt tên hiển thị để bạn bè nhận ra vườn của Sếp nè"
                      : "Đổi tên hiển thị của vườn"}
                  </p>
                  <form
                    className="mt-2 flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveProfile(nameDraft, overview.me.avatarKind);
                    }}
                  >
                    <label className="sr-only" htmlFor="friends-display-name">
                      Tên hiển thị
                    </label>
                    <input
                      className={cn(
                        "h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60",
                        FOCUS_RING
                      )}
                      id="friends-display-name"
                      maxLength={30}
                      onChange={(event) => setNameDraft(event.target.value)}
                      placeholder="Ví dụ: Thiên"
                      value={nameDraft}
                    />
                    <Button
                      disabled={savingProfile || nameDraft.trim() === ""}
                      size="sm"
                      type="submit"
                    >
                      Lưu tên 🌸
                    </Button>
                    {editingName ? (
                      <Button
                        onClick={() => setEditingName(false)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Thôi
                      </Button>
                    ) : null}
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-bold text-plum">
                    <span aria-hidden="true">{AVATAR_EMOJI[overview.me.avatarKind]}</span>{" "}
                    {overview.me.displayName}
                  </p>
                  <button
                    aria-label="Đổi tên hiển thị"
                    className={cn(
                      "squishy shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-mauve transition hover:bg-rice",
                      FOCUS_RING
                    )}
                    onClick={() => {
                      setNameDraft(overview.me.displayName);
                      setEditingName(true);
                    }}
                    type="button"
                  >
                    ✏️ Sửa
                  </button>
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                  Avatar của vườn
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {AVATAR_OPTIONS.map((option) => {
                    const isActive = option.kind === overview.me.avatarKind;

                    return (
                      <button
                        aria-label={`Chọn avatar ${option.label}`}
                        aria-pressed={isActive}
                        className={cn(
                          "squishy flex h-9 w-9 items-center justify-center rounded-full text-lg transition",
                          FOCUS_RING,
                          isActive ? "bg-matcha/20 ring-1 ring-matcha/50" : "hover:bg-rice"
                        )}
                        disabled={savingProfile}
                        key={option.kind}
                        onClick={() => void saveProfile(overview.me.displayName, option.kind)}
                        title={option.label}
                        type="button"
                      >
                        {option.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div className="rounded-2xl border border-wafer bg-white/75 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                Thêm bạn vườn
              </p>
              <form
                className="mt-2 flex flex-wrap items-center gap-2"
                onSubmit={(event) => void handleSendRequest(event)}
              >
                <label className="sr-only" htmlFor="friends-code-input">
                  Nhập mã vườn của bạn
                </label>
                <input
                  autoComplete="off"
                  className={cn(
                    "h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 font-mono text-sm font-bold tracking-widest text-plum placeholder:font-body placeholder:font-semibold placeholder:tracking-normal placeholder:text-mauve/60",
                    FOCUS_RING
                  )}
                  id="friends-code-input"
                  onChange={(event) => setCodeDraft(normalizeCodeInput(event.target.value))}
                  placeholder="Nhập mã vườn của bạn"
                  spellCheck={false}
                  value={codeDraft}
                />
                <Button disabled={sending || codeDraft.length === 0} size="sm" type="submit">
                  Kết bạn 🌱
                </Button>
              </form>
              {sendNote ? (
                <p className="mt-2 text-sm font-semibold text-mauve" role="status">
                  {sendNote}
                </p>
              ) : null}
            </div>

            {incoming.length > 0 || outgoing.length > 0 ? (
              <div className="rounded-2xl border border-wafer bg-white/75 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-mauve">Lời mời</p>
                <ul className="mt-2 grid gap-2">
                  {incoming.map((entry) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sakura/60 bg-sakura/10 p-2.5"
                      key={entry.otherUserId}
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-plum">
                        <span aria-hidden="true" className="text-lg">
                          {AVATAR_EMOJI[entry.avatarKind]}
                        </span>
                        <span className="truncate">{friendLabel(entry)}</span>
                        <span className="shrink-0 rounded-full bg-sakura/40 px-2 py-0.5 text-[10px] font-bold text-sakura-deep">
                          muốn làm bạn vườn
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <button
                          aria-label={`Đón ${friendLabel(entry)} vào vườn`}
                          className={cn(
                            "squishy flex h-9 w-9 items-center justify-center rounded-full border border-matcha/50 bg-matcha/15 text-base shadow-mochi transition hover:bg-matcha/25",
                            FOCUS_RING
                          )}
                          disabled={busyFriendId !== null}
                          onClick={() => void respond(entry, true)}
                          title="Đồng ý kết bạn"
                          type="button"
                        >
                          🤗
                        </button>
                        <button
                          className={cn(
                            "squishy rounded-full px-3 py-1.5 text-xs font-bold text-mauve transition hover:bg-rice",
                            FOCUS_RING
                          )}
                          disabled={busyFriendId !== null}
                          onClick={() => void respond(entry, false)}
                          type="button"
                        >
                          Để sau
                        </button>
                      </span>
                    </li>
                  ))}
                  {outgoing.map((entry) => (
                    <li
                      className="flex items-center gap-2 px-2.5 py-1 text-sm font-semibold text-mauve"
                      key={entry.otherUserId}
                    >
                      <span aria-hidden="true">{AVATAR_EMOJI[entry.avatarKind]}</span>
                      <span className="truncate">{friendLabel(entry)}</span>
                      <span className="shrink-0 text-xs">— đang chờ bạn ấy mở cửa vườn…</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border border-wafer bg-white/75 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                Bạn vườn của Sếp
              </p>
              {accepted.length === 0 ? (
                <p className="mt-2 text-sm font-semibold text-mauve">
                  Chưa có bạn vườn nào — gửi mã cho một người bạn để bắt đầu nha 🌱
                </p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {accepted.map((entry) => {
                    const isConfirming = confirmingUnfriendId === entry.otherUserId;

                    return (
                      <li
                        className="rounded-2xl border border-wafer bg-white/80 p-2.5"
                        key={entry.otherUserId}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-plum">
                            <span aria-hidden="true" className="text-lg">
                              {AVATAR_EMOJI[entry.avatarKind]}
                            </span>
                            {/* Plain text node — never markup (spec §8). */}
                            <span className="truncate">{friendLabel(entry)}</span>
                          </span>
                          <button
                            aria-expanded={isConfirming}
                            aria-label={`Tùy chọn với ${friendLabel(entry)}`}
                            className={cn(
                              "squishy flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mauve transition hover:bg-rice",
                              FOCUS_RING
                            )}
                            onClick={() =>
                              setConfirmingUnfriendId(isConfirming ? null : entry.otherUserId)
                            }
                            type="button"
                          >
                            ⋯
                          </button>
                        </div>
                        {isConfirming ? (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rice/70 p-2.5">
                            <p className="text-xs font-semibold text-mauve">
                              Rời vườn của nhau? Hai bên sẽ không thấy nhau nữa.
                            </p>
                            <span className="flex items-center gap-1.5">
                              <button
                                className={cn(
                                  "squishy rounded-full border border-wafer bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-rice",
                                  FOCUS_RING
                                )}
                                disabled={busyFriendId !== null}
                                onClick={() => void handleUnfriend(entry)}
                                type="button"
                              >
                                Rời vườn
                              </button>
                              <button
                                className={cn(
                                  "squishy rounded-full px-3 py-1.5 text-xs font-bold text-mauve transition hover:bg-white",
                                  FOCUS_RING
                                )}
                                onClick={() => setConfirmingUnfriendId(null)}
                                type="button"
                              >
                                Ở lại
                              </button>
                            </span>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Soft shimmer while the overview loads — same idiom as dashboard-skeleton. */
function FriendsCardSkeleton() {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="grid content-start gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid content-start gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
