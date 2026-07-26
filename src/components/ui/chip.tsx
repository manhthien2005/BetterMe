import * as React from "react";

import { cn } from "@/lib/utils";

export type ChipTone = "plain" | "warm" | "success" | "action";

/** A one-line pill: weather, streak, "+1 🌾", section metadata. */
export function Chip({
  className,
  tone = "plain",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold",
        tone === "plain" && "border border-line bg-surface-card text-ink-soft",
        tone === "warm" && "bg-surface-warm text-action-hover",
        // Text is --success-ink; --success is a fill colour and fails AA as text.
        tone === "success" && "bg-surface-success text-success-ink",
        tone === "action" && "bg-surface-warm text-action",
        className
      )}
      {...props}
    />
  );
}
