/**
 * The hero's sky (spec §4.1) — pure, no React, and no clock of its own. The
 * hour is handed in so a test can put the sun anywhere it likes.
 */

export type SkyPhase = "morning" | "afternoon" | "evening";

/**
 * Boundaries match `TimeOfDay` in habit-model on purpose: a habit filed under
 * 🌙 Tối and the evening sky must not disagree about when evening starts.
 *
 * Anything outside 05:00–17:59 — the small hours included, and any junk
 * number — is evening, because 02:00 is someone still awake rather than
 * someone up early.
 */
export function skyPhaseAt(hour: number): SkyPhase {
  if (!Number.isFinite(hour)) return "evening";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";

  return "evening";
}

/**
 * Tailwind class sets per phase, written out in full rather than assembled
 * from a template string: Tailwind scans source TEXT, and a class it cannot
 * see literally is a class it never generates.
 */
export const SKY_STYLES: Record<
  SkyPhase,
  { panel: string; ink: string; inkSoft: string; hairline: string }
> = {
  morning: {
    panel: "bg-gradient-to-br from-sky-morning-from to-sky-morning-to",
    ink: "text-sky-morning-ink",
    inkSoft: "text-sky-morning-ink-soft",
    hairline: "border-sky-morning-to"
  },
  afternoon: {
    panel: "bg-gradient-to-br from-sky-afternoon-from to-sky-afternoon-to",
    ink: "text-sky-afternoon-ink",
    inkSoft: "text-sky-afternoon-ink-soft",
    hairline: "border-sky-afternoon-to"
  },
  evening: {
    panel: "bg-gradient-to-br from-sky-evening-from to-sky-evening-to",
    ink: "text-sky-evening-ink",
    inkSoft: "text-sky-evening-ink-soft",
    hairline: "border-sky-evening-to"
  }
};

export const SKY_GREETINGS: Record<SkyPhase, string> = {
  morning: "Chào buổi sáng",
  afternoon: "Chào buổi chiều",
  evening: "Chào buổi tối"
};
