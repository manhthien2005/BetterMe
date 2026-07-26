import type { SyncStatus } from "@/lib/sync/types";
import { cn } from "@/lib/utils";

/** Vietnamese tooltip + emoji per sync status (spec §2.1 — discreet dot). */
const SYNC_DOT: Record<Exclude<SyncStatus, "disabled">, { emoji: string; label: string }> = {
  idle: { emoji: "☁️", label: "Đã lưu trên mây" },
  pending: { emoji: "⏳", label: "Đang đồng bộ…" },
  error: { emoji: "⚠️", label: "Chưa đồng bộ được — sẽ thử lại" }
};

/**
 * Discreet sync indicator (spec §2.1), pinned to the footer corner. Hidden
 * entirely while sync is disabled (logged out / dev bypass); fixed positioning
 * means it never shifts the layout, appearing or changing state.
 */
export function SyncStatusDot({ status }: { status: SyncStatus }) {
  if (status === "disabled") return null;

  const dot = SYNC_DOT[status];

  return (
    <span
      aria-label={dot.label}
      className={cn(
        "fixed bottom-3 right-3 z-40 flex h-8 w-8 select-none items-center justify-center rounded-full border border-wafer bg-mochi text-sm leading-none shadow-mochi",
        status === "idle" && "opacity-60"
      )}
      role="status"
      title={dot.label}
    >
      {dot.emoji}
    </span>
  );
}
