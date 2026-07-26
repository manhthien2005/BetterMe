import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "squishy inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-pill px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Tier 1 — at most ONE per region (spec §2.3).
        primary: "bg-action text-action-ink shadow-action hover:bg-action-hover",
        // Tier 2 — cream card surface with a warm hairline.
        secondary:
          "border border-line-strong bg-surface-card text-ink shadow-card hover:bg-surface-warm",
        // Tier 3 — no chrome at all.
        ghost: "text-action hover:bg-surface-warm",
        link: "h-auto px-0 text-action underline-offset-4 hover:underline",
        // Destructive lives only behind a confirm (spec §5.1).
        destructive: "bg-alert text-alert-ink hover:brightness-95"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-12 px-5",
        icon: "h-11 w-11 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
