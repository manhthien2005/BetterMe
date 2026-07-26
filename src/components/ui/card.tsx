import * as React from "react";

import { cn } from "@/lib/utils";

export type CardTone = "plain" | "warm" | "done";

/**
 * The one card surface (spec §2.1). `warm` is the honey accent — at most ONE
 * per list; `done` is the completed-row wash.
 */
export function Card({
  className,
  tone = "plain",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  return (
    <div
      className={cn(
        "rounded-card border p-4 sm:p-5",
        tone === "plain" && "border-line bg-surface-card shadow-card",
        tone === "warm" && "border-line-honey bg-gradient-to-br from-honey-from to-honey-to",
        tone === "done" && "border-line-success bg-surface-success",
        className
      )}
      {...props}
    />
  );
}
