"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getDashboardToday } from "@/components/dashboard/dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGardenFair,
  getSharedRhythms,
  setFairOptIn,
  type AvatarKind,
  type SharedRhythm
} from "@/lib/server/social-actions";
import { deriveFairView, type FairGardenView } from "@/lib/social/garden-fair";
import { cn } from "@/lib/utils";

/**
 * "Hội chợ vườn 🏮" — Phase 3 weekend garden fair + Nhịp Chung (spec §5).
 *
 * Nếp is the keeper here. Rank-free by construction: gardens render in the
 * server's accepted_at order (my own first), decorated with 🏮 (top-3 previous
 * week) and 🌸 (>= 4 good days) but NEVER sorted, greyed, or captioned with a
 * deadline. A week-0 garden is silently omitted (deriveFairView). Only positive
 * weekly counts and shared-rhythm days cross — no streak, no last-active (§0.3).
 * Mounted only while sync is enabled (a live session + opt-in), same as the
 * friends card.
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep";

const QUIET_NETWORK_NOTE = "Mạng hơi chập chờn — Sếp thử lại sau chút nha ☁️";

const AVATAR_EMOJI: Record<AvatarKind, string> = { nep: "🍡", dog: "🐶", cat: "🐱" };

type LoadPhase = "loading" | "ready" | "error";

export function GardenFairCard({ onOwnLantern }: { onOwnLantern?: () => void } = {}) {
  const today = useMemo(() => getDashboardToday(), []);
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [fairOptIn, setFairOptInState] = useState(false);
  const [gardens, setGardens] = useState<FairGardenView[]>([]);
  const [rhythms, setRhythms] = useState<SharedRhythm[]>([]);
  const [savingFair, setSavingFair] = useState(false);

  // Keep the latest callback in a ref so `refresh` needn't depend on it (an
  // inline parent callback would otherwise churn the fetch effect).
  const onOwnLanternRef = useRef(onOwnLantern);
  const lanternFiredRef = useRef(false);

  useEffect(() => {
    onOwnLanternRef.current = onOwnLantern;
  }, [onOwnLantern]);

  const refresh = useCallback(async () => {
    const [fairResult, rhythmResult] = await Promise.all([getGardenFair(), getSharedRhythms()]);

    if (fairResult.ok) {
      setFairOptInState(fairResult.fairOptIn);

      const derived = deriveFairView(fairResult.fair, today);

      setGardens(derived);
      setPhase("ready");

      // Own-garden lantern -> a one-time fairLantern voice cue on the host pet
      // (spec §5.2). Fired once per mount so a refresh never repeats it.
      if (!lanternFiredRef.current && derived.some((g) => g.isMe && g.hasLantern)) {
        lanternFiredRef.current = true;
        onOwnLanternRef.current?.();
      }
    } else {
      // Quiet failure: keep whatever we already show; only a first-load miss
      // falls through to the soft retry line.
      setPhase((current) => (current === "ready" ? "ready" : "error"));
    }

    if (rhythmResult.ok) setRhythms(rhythmResult.rhythms);
  }, [today]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleToggleFair(nextEnabled: boolean) {
    if (savingFair) return;

    const previous = fairOptIn;

    setSavingFair(true);
    setFairOptInState(nextEnabled); // optimistic

    const result = await setFairOptIn(nextEnabled);

    setSavingFair(false);

    if (result.ok) {
      setFairOptInState(result.fairOptIn);
      void refresh();
    } else {
      setFairOptInState(previous); // revert — quiet, no blame
      toast(QUIET_NETWORK_NOTE);
    }
  }

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:5/1/6/19]">
      <div>
        <h2 className="font-display text-lg font-bold text-plum">Hội chợ vườn 🏮</h2>
        <p className="mt-1 text-sm font-semibold text-mauve">
          Nếp mở hội chợ cuối tuần — khoe những ngày xanh, không thứ hạng, không so đo.
        </p>
      </div>

      {phase === "loading" ? (
        <div className="mt-4 grid gap-2">
          <Skeleton className="h-10 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : null}

      {phase === "error" ? (
        <p className="mt-4 text-sm font-semibold text-mauve">
          Hội chợ chưa ghé được mây.{" "}
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

      {phase === "ready" ? (
        <div className="mt-4 grid gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-wafer bg-white/75 p-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-plum">Mang vườn ra hội chợ cuối tuần 🏮</p>
              <p className="mt-0.5 text-xs font-semibold text-mauve">
                Chỉ bạn bè cùng bật mới thấy nhau — đếm ngày xanh, cap 7/tuần.
              </p>
            </div>
            <button
              aria-checked={fairOptIn}
              aria-label="Mang vườn ra hội chợ cuối tuần"
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition",
                FOCUS_RING,
                fairOptIn ? "border-matcha/50 bg-matcha/70" : "border-wafer bg-wafer"
              )}
              disabled={savingFair}
              onClick={() => void handleToggleFair(!fairOptIn)}
              role="switch"
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-mochi transition",
                  fairOptIn ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {!fairOptIn ? (
            <p className="rounded-2xl border border-dashed border-wafer bg-rice/40 p-3 text-sm font-semibold text-mauve">
              Bật hội chợ để cùng bạn bè khoe vườn mỗi cuối tuần — chỉ ngày xanh, không thứ
              hạng 🌿
            </p>
          ) : gardens.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-wafer bg-rice/40 p-3 text-sm font-semibold text-mauve">
              Hội chợ đang chờ những ngày xanh đầu tiên của tuần này 🌱
            </p>
          ) : (
            <ul aria-label="Vườn ở hội chợ" className="grid gap-2">
              {gardens.map((garden) => (
                <li
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-2xl border bg-white/80 p-2.5",
                    garden.hasBloom ? "border-sakura/50 bg-sakura/10" : "border-wafer"
                  )}
                  key={garden.userId}
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-plum">
                    <span aria-hidden="true" className="text-lg">
                      {AVATAR_EMOJI[garden.avatarKind]}
                    </span>
                    {/* Plain text node — host-controlled string, never markup (spec §8). */}
                    <span className="truncate">
                      {garden.isMe ? "Vườn của Sếp" : garden.displayName || "Một vườn thân"}
                    </span>
                    {garden.hasLantern ? (
                      <span aria-label="Lồng đèn tuần trước" title="Lồng đèn tuần trước">
                        🏮
                      </span>
                    ) : null}
                    {garden.hasBloom ? (
                      <span aria-label="Vườn nở hoa" title="Vườn nở hoa">
                        🌸
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 rounded-full bg-matcha/15 px-2.5 py-1 text-xs font-bold text-matcha-deep">
                    🌿 {garden.weeklyGoodDays} ngày xanh
                  </span>
                </li>
              ))}
            </ul>
          )}

          {rhythms.length > 0 ? (
            <div className="rounded-2xl border border-wafer bg-white/75 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">Nhịp chung 🎐</p>
              <ul className="mt-2 grid gap-1.5">
                {rhythms.map((rhythm) => (
                  <li
                    className="flex items-center gap-2 text-sm font-semibold text-plum"
                    key={rhythm.otherUserId}
                  >
                    <span aria-hidden="true" className="text-lg">
                      {AVATAR_EMOJI[rhythm.avatarKind]}
                    </span>
                    <span className="truncate">
                      Nhịp chung với {rhythm.displayName || "một người bạn"}
                    </span>
                    <span className="shrink-0 font-bold text-matcha-deep">
                      {rhythm.rhythmDays} ngày 🌿
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
