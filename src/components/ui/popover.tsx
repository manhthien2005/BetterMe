"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

/**
 * The one popover in the app (spec §4.3 — the widget chips open theirs).
 *
 * Borrowed from Radix rather than hand-rolled: focus trapping, Escape, click
 * outside and viewport-aware positioning are four things a hand-rolled popover
 * gets subtly wrong, and each one is invisible until someone uses a keyboard.
 * Same shape as `tooltip.tsx` so the two primitives read alike.
 */
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      className={cn(
        // Width is capped against the viewport, not just the design width: on a
        // narrow phone a fixed 20rem panel would hang off the edge.
        "z-50 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line bg-surface-card p-4 text-ink shadow-card focus-visible:outline-none",
        className
      )}
      ref={ref}
      sideOffset={sideOffset}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
