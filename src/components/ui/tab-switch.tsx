"use client";

import { cn } from "@/lib/utils";

/**
 * Two or three views, one visible at a time (spec §4.2). Implements the ARIA
 * tabs pattern properly: arrow keys move between tabs and only the selected
 * one stays in the tab order, so Tab steps past the whole group rather than
 * through every option.
 *
 * The panel itself is the caller's business — this switch owns no content.
 */
export function TabSwitch<T extends string>({
  className,
  idPrefix,
  label,
  onChange,
  options,
  value
}: {
  className?: string;
  /**
   * Shared stem for the tab and panel ids: tab `${idPrefix}-tab-${value}`
   * controls panel `${idPrefix}-panel-${value}`. Required rather than
   * defaulted — two switches on one page with the same stem would quietly
   * duplicate ids, and the caller is the only one who can tell them apart.
   */
  idPrefix: string;
  /** Accessible name for the group, e.g. "Chế độ xem". */
  label: string;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  value: T;
}) {
  const index = options.findIndex((option) => option.value === value);

  /** Wraps at both ends — the pattern expects a ring, not a dead stop. */
  function move(delta: number) {
    const next = (index + delta + options.length) % options.length;

    onChange(options[next].value);
  }

  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-line bg-surface-card p-1",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            aria-controls={`${idPrefix}-panel-${option.value}`}
            aria-selected={selected}
            className={cn(
              "squishy min-h-[44px] rounded-pill px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
              selected
                ? "bg-action text-action-ink shadow-action"
                : "text-ink-mid hover:bg-surface-warm"
            )}
            id={`${idPrefix}-tab-${option.value}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                move(1);
              }

              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                move(-1);
              }
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
