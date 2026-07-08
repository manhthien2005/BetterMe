"use client";

import type { InitialUploadMode } from "@/lib/sync/importer";
import { getLocalStorage } from "@/lib/sync/storage";

/**
 * One-time sync onboarding (spec §2.5): shown when a Supabase session exists
 * and the user hasn't chosen how to bring their garden to the cloud yet.
 * Neither choice ever touches on-device data — localStorage stays the source
 * of truth for rendering; this only decides what the FIRST upload contains.
 *
 * Flags (raw strings, not JSON):
 *   - betterme.syncoptin.v1: "fresh" | "memories" — the chosen upload mode.
 *   - betterme.syncask.v1:   YYYY-MM-DD of the last "Để sau nhé" — re-ask on a
 *     later day, never nag twice the same day.
 */

export const SYNC_OPT_IN_STORAGE_KEY = "betterme.syncoptin.v1";
export const SYNC_ASK_STORAGE_KEY = "betterme.syncask.v1";

export function loadSyncOptIn(): InitialUploadMode | null {
  const value = getLocalStorage()?.getItem(SYNC_OPT_IN_STORAGE_KEY);

  return value === "fresh" || value === "memories" ? value : null;
}

export function saveSyncOptIn(mode: InitialUploadMode): void {
  try {
    getLocalStorage()?.setItem(SYNC_OPT_IN_STORAGE_KEY, mode);
  } catch {
    // Quota/private mode: the user will simply be asked again next session.
  }
}

/** True when the user hasn't opted in yet and wasn't already asked today. */
export function shouldAskSyncOptIn(today: string): boolean {
  if (loadSyncOptIn()) return false;

  return getLocalStorage()?.getItem(SYNC_ASK_STORAGE_KEY) !== today;
}

export function snoozeSyncAsk(today: string): void {
  try {
    getLocalStorage()?.setItem(SYNC_ASK_STORAGE_KEY, today);
  } catch {
    // ignore — worst case we ask again this session
  }
}

export function SyncOnboarding({
  onChoose,
  onDismiss
}: {
  onChoose: (mode: InitialUploadMode) => void;
  onDismiss: () => void;
}) {
  return (
    <div
      aria-labelledby="sync-onboarding-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-3xl border border-wafer bg-mochi p-6 shadow-mochi">
        <h2
          className="font-display text-xl font-bold text-plum"
          id="sync-onboarding-title"
        >
          Đưa vườn lên mây? ☁️
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-mauve">
          Dữ liệu trên máy không bị đụng tới — đây chỉ là bản sao lên mây.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            className="squishy rounded-3xl border border-matcha/50 bg-white/80 p-4 text-left shadow-mochi transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
            onClick={() => onChoose("fresh")}
            type="button"
          >
            <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-plum">
              Vườn mây mới tinh 🌱
              <span className="rounded-full bg-matcha/15 px-2 py-0.5 text-[10px] font-bold text-matcha-deep">
                Gợi ý
              </span>
            </span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-mauve">
              Vườn trên mây bắt đầu từ hôm nay — mọi kỷ niệm trên máy vẫn nguyên vẹn 🌱
            </span>
          </button>

          <button
            className="squishy rounded-3xl border border-wafer bg-white/80 p-4 text-left shadow-mochi transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
            onClick={() => onChoose("memories")}
            type="button"
          >
            <span className="block text-sm font-bold text-plum">
              Đem kỷ niệm lên mây ☁️
            </span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-mauve">
              Những ngày đã chăm vườn gần đây sẽ cùng bạn lên mây.
            </span>
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            className="squishy rounded-full px-3 py-1.5 text-xs font-bold text-mauve transition hover:bg-rice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            onClick={onDismiss}
            type="button"
          >
            Để sau nhé
          </button>
        </div>
      </div>
    </div>
  );
}
