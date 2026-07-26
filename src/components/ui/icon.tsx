import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Line-icons are the UI layer (spec §2.4): nav, actions, controls. Emoji stay
 * reserved for objects of the world (🐌 🌾 🍃 🔥). Unlabelled icons are
 * decorative and hidden from assistive tech.
 */
export function Icon({
  as: Glyph,
  className,
  label,
  size = "md"
}: {
  as: LucideIcon;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <Glyph
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]", className)}
      role={label ? "img" : undefined}
      strokeWidth={2}
    />
  );
}
