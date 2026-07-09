"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import type { BondTier, PetStage } from "@/components/dashboard/dashboard-data";
import { Pet } from "@/components/dashboard/pet";
import { getGuestLine } from "@/components/dashboard/pet-voice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getFriendSummary,
  visitGarden,
  type PublishedSummary
} from "@/lib/server/social-actions";
import { cn } from "@/lib/utils";

/**
 * "Sang vườn" overlay (Phase 2 spec §4.3) — an Animal Crossing style visit to
 * a friend's garden. Shows the host's pet at its REAL growth stage (re-uses
 * <Pet>), display name, and milestone chips. Actions: vuốt ve (heart animation
 * + guestPet line), tặng món ăn (gift-box arc + guestGift line, needs >=1
 * food), and one cheer per milestone per visitor. Phase 2 boundary: ZERO
 * habit/completion data is shown — only the positive projection (no streak, no
 * last-active). Milestone labels come from a FIXED kind(+detail) dictionary —
 * never host-supplied text. Every host-controlled string (display name, pet
 * name) renders as a plain React text node, never markup (spec §8).
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep";

/** Quiet, never-alarming line for transport hiccups — no blame, no red. */
const QUIET_NETWORK_NOTE = "Mạng hơi chập chờn — Sếp thử lại sau chút nha ☁️";

type MilestoneEntry = PublishedSummary["milestones"][number];

/** Kind → emoji for the milestone chip (spec §4.3). */
const MILESTONE_EMOJI: Record<MilestoneEntry["kind"], string> = {
  evolve: "🌟",
  bond_tier: "💗",
  bloom_week: "🌸",
  new_pet: "🐾"
};

/** Vietnamese growth-stage names — mirrors dashboard-data.ts PetStage order. */
const STAGE_LABEL_VI: Record<PetStage, string> = {
  baby: "sơ sinh",
  kid: "bé con",
  junior: "thiếu nhi",
  teen: "thiếu niên",
  adult: "trưởng thành"
};

/**
 * The milestone chip label — composed from a FIXED kind(+detail) dictionary,
 * never from host-supplied text (spec §0.3/§4.1: positive-only is structural).
 * `detail` is an enum-ish token (species / stage / tier), validated on parse.
 */
function milestoneLabel(milestone: MilestoneEntry): string {
  const { detail } = milestone;

  switch (milestone.kind) {
    case "new_pet":
      return detail === "cat" ? "Bé mèo mới về nhà" : "Bé cún mới về nhà";
    case "evolve":
      return `Lớn thành ${
        detail === "baby" ||
        detail === "kid" ||
        detail === "junior" ||
        detail === "teen" ||
        detail === "adult"
          ? STAGE_LABEL_VI[detail]
          : "một bậc mới"
      }`;
    case "bond_tier":
      return `Thân thiết cấp ${detail ?? "mới"}`;
    case "bloom_week":
      return "Tuần nở hoa";
  }
}

type HostPet = {
  species: "dog" | "cat";
  name: string;
  stage: PetStage;
  bondTier: BondTier;
};

function hostPetFromSummary(summary: PublishedSummary): HostPet | null {
  if (!summary.petSpecies || !summary.petStage) return null;

  return {
    species: summary.petSpecies,
    name: summary.petName || (summary.petSpecies === "dog" ? "Bé cún" : "Bé mèo"),
    stage: summary.petStage,
    bondTier: (summary.petBondTier ?? 1) as BondTier
  };
}

type LoadPhase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "closed" } // host isn't sharing (silent opt-out) — a gently closed gate
  | { kind: "ready"; summary: PublishedSummary };

export function GardenVisitOverlay({
  hostUserId,
  myFood,
  onClose,
  onGiftSent
}: {
  hostUserId: string;
  myFood: number;
  onClose: () => void;
  /** Called after a successful gift so the owner mirrors the spend locally. */
  onGiftSent?: () => void;
}) {
  const [phase, setPhase] = useState<LoadPhase>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [giftArc, setGiftArc] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [giftSent, setGiftSent] = useState(false);
  const [cheeredIds, setCheeredIds] = useState<readonly string[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getFriendSummary(hostUserId);

      if (cancelled) return;

      if (!result.ok) {
        setPhase({ kind: "error" });
      } else if (result.summary === null) {
        setPhase({ kind: "closed" });
      } else {
        setPhase({ kind: "ready", summary: result.summary });

        const pet = hostPetFromSummary(result.summary);

        // The host's pet greets the VISITOR in its own personality. Guest-side
        // voice is species-keyed only — a visitor has no bond with this pet
        // (spec §7), and it addresses them as a guest, never as its owner.
        if (pet) setBubble(getGuestLine(pet.species, "guestGreeting"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hostUserId]);

  const summary = phase.kind === "ready" ? phase.summary : null;
  const hostPet = summary ? hostPetFromSummary(summary) : null;
  const hostLabel = summary?.displayName || "bạn ấy";

  async function handlePet() {
    if (busy || !hostPet) return;

    setBusy(true);
    setHearts(true);
    window.setTimeout(() => setHearts(false), 1300);

    const result = await visitGarden(hostUserId, false, null);

    setBusy(false);

    if (result.ok) {
      // ok also covers the over-cap case: the server returns ok with
      // petRecorded=false (§4.2 mirrors PETTING_CAP_PER_DAY) — affection is
      // never an error, the animation + thoại always play.
      setBubble(getGuestLine(hostPet.species, "guestPet"));
    } else if (result.reason === "no-active-pet") {
      toast("Sếp nhận nuôi một bé cưng trước rồi mình sang chơi nha 🥚");
    } else {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  async function handleGift() {
    if (busy || giftSent || myFood < 1 || !hostPet) return;

    setBusy(true);

    const result = await visitGarden(hostUserId, true, null);

    setBusy(false);

    if (result.ok && result.giftDelivered) {
      setGiftSent(true);
      setGiftArc(true);
      window.setTimeout(() => setGiftArc(false), 1300);
      setBubble(getGuestLine(hostPet.species, "guestGift"));
      onGiftSent?.();
    } else if (!result.ok && result.reason === "gift-cap-reached") {
      // Already gifted this host today (1/day cap) — settle into the sent
      // state, no error toast (spec §4.2).
      setGiftSent(true);
    } else if (!result.ok && result.reason === "insufficient-food") {
      toast("Giỏ đồ ăn của Sếp đang trống — chăm vườn mình chút rồi quay lại nha 🌱");
    } else if (!result.ok && result.reason === "no-active-pet") {
      toast("Sếp nhận nuôi một bé cưng trước rồi mình sang chơi nha 🥚");
    } else if (!result.ok) {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  async function handleCheer(milestoneId: string) {
    if (busy || cheeredIds.includes(milestoneId)) return;

    setBusy(true);

    const result = await visitGarden(hostUserId, false, milestoneId);

    setBusy(false);

    if (result.ok && result.cheerDelivered) {
      setCheeredIds((current) => [...current, milestoneId]);
      toast.success(`Đã gửi lời chúc mừng tới vườn của ${hostLabel} 🤗`);
    } else if (!result.ok && result.reason === "already-cheered") {
      // Server: 1 cheer per milestone per (visitor, host). This only fires on
      // a genuine same-visitor retry (e.g. a second device) — treat as done.
      setCheeredIds((current) => [...current, milestoneId]);
    } else if (!result.ok && result.reason === "milestone-not-found") {
      toast("Khoảnh khắc này vừa được cất vào kệ kỷ niệm rồi 🌸");
    } else if (!result.ok) {
      toast(QUIET_NETWORK_NOTE);
    }
  }

  return (
    <div
      aria-label={summary ? `Vườn của ${hostLabel}` : "Sang vườn bạn"}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/35 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="soft-panel relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-gradient-to-b from-mochi to-rice p-5 shadow-mochi sm:p-6">
        <button
          aria-label="Về vườn mình"
          className={cn(
            "squishy absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-wafer bg-white/85 text-mauve transition hover:bg-white",
            FOCUS_RING
          )}
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {phase.kind === "loading" ? (
          <div className="grid gap-3">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="mx-auto h-32 w-40 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <p className="py-8 text-center text-sm font-semibold text-mauve">
            Đường sang vườn hơi mù sương — Sếp thử lại sau chút nha ☁️
          </p>
        ) : null}

        {phase.kind === "closed" ? (
          <p className="py-8 text-center text-sm font-semibold text-mauve">
            Vườn đang khép cổng nghỉ ngơi — mình ghé lại lần sau nha 🌿
          </p>
        ) : null}

        {summary ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div>
              {/* Plain text node — host-controlled string, never markup (spec §8). */}
              <h2 className="font-display text-xl font-bold text-plum">
                Vườn của {summary.displayName || "một người bạn"}
              </h2>
            </div>

            {hostPet ? (
              <>
                {bubble ? (
                  <div
                    className="bubble-in relative max-w-[260px] rounded-2xl border border-wafer bg-white/90 px-4 py-2 text-sm font-semibold leading-5 text-plum shadow-mochi"
                    key={bubble}
                  >
                    {bubble}
                  </div>
                ) : null}

                <Pet
                  bondTier={hostPet.bondTier}
                  celebrate={hearts}
                  completedCount={1}
                  eating={giftArc}
                  name={hostPet.name}
                  species={hostPet.species}
                  stage={hostPet.stage}
                  totalCount={2}
                />

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    disabled={busy}
                    onClick={() => void handlePet()}
                    type="button"
                    variant="outline"
                  >
                    Vuốt ve 💗
                  </Button>
                  <Button
                    disabled={busy || giftSent || myFood < 1}
                    onClick={() => void handleGift()}
                    title={
                      myFood < 1
                        ? "Giỏ đồ ăn đang trống — chăm vườn mình để kiếm thêm nha"
                        : undefined
                    }
                    type="button"
                  >
                    {giftSent
                      ? "Đã tặng hôm nay 🎁"
                      : `Tặng món ăn ${hostPet.species === "dog" ? "🦴" : "🐟"}`}
                  </Button>
                </div>
                {myFood < 1 && !giftSent ? (
                  <p className="text-xs font-semibold text-mauve">
                    Giỏ đồ ăn đang trống — chăm vườn mình chút là có quà mang sang liền 🌱
                  </p>
                ) : null}
              </>
            ) : (
              <p className="py-4 text-sm font-semibold text-mauve">
                Khu vườn này chưa có bé cưng nào ra chào — ghé lại sau nha 🌷
              </p>
            )}

            {summary.milestones.length > 0 ? (
              <div className="w-full rounded-2xl border border-wafer bg-white/75 p-3 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                  Khoảnh khắc đáng mừng
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {summary.milestones.map((milestone) => {
                    const cheered = cheeredIds.includes(milestone.id);
                    const label = milestoneLabel(milestone);

                    return (
                      <li key={milestone.id}>
                        <button
                          aria-label={
                            cheered ? `Đã chúc mừng: ${label}` : `Chúc mừng: ${label}`
                          }
                          aria-pressed={cheered}
                          className={cn(
                            "squishy inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition",
                            FOCUS_RING,
                            cheered
                              ? "border-sakura/60 bg-sakura/25 text-sakura-deep"
                              : "border-wafer bg-white/85 text-plum hover:bg-white"
                          )}
                          disabled={busy || cheered}
                          onClick={() => void handleCheer(milestone.id)}
                          type="button"
                        >
                          <span aria-hidden="true">{MILESTONE_EMOJI[milestone.kind]}</span>
                          <span className="max-w-[140px] truncate">{label}</span>
                          <span className="font-semibold text-mauve">{milestone.at}</span>
                          <span aria-hidden="true">{cheered ? "🤗" : "＋"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[10px] font-semibold text-mauve">
                  Chạm để gửi một lời chúc mừng — mỗi khoảnh khắc một lần thôi nè.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
