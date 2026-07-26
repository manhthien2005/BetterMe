import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-16 w-16 text-base"
} as const;

/**
 * A ring that fills as progress is made. The fill is a conic-gradient punched
 * through by a radial one — no SVG and no library, and it reads its colours
 * straight from the tokens.
 *
 * `target <= 0` renders full rather than dividing by zero: a habit with
 * nothing to reach has nothing left to do.
 */
export function ProgressRing({
  children,
  className,
  label,
  size = "sm",
  target,
  tone = "action",
  value
}: {
  children?: React.ReactNode;
  className?: string;
  /** Accessible name — required. A bare ring tells a screen reader nothing. */
  label: string;
  size?: keyof typeof SIZES;
  target: number;
  tone?: "action" | "success";
  value: number;
}) {
  const ratio = target <= 0 ? 1 : Math.min(1, Math.max(0, value / target));
  const percent = Math.round(ratio * 100);

  return (
    <span
      aria-label={label}
      aria-valuemax={target}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        SIZES[size],
        className
      )}
      data-ratio={percent}
      role="progressbar"
      style={{
        background: `radial-gradient(circle at center, var(--surface-card) 68%, transparent 69%), conic-gradient(var(--${tone}) ${percent}%, var(--line-strong) 0)`
      }}
    >
      {children}
    </span>
  );
}
