import type { FairGarden, GardenFair } from "@/lib/server/social-actions";

/**
 * Pure derivation for the weekend Hội chợ vườn (Garden Fair, spec §5.2).
 *
 * This is the invariant guardrail for the fair — no React/Next/persistence
 * imports, fully unit-tested. The rules it enforces are STRUCTURAL, not tonal:
 * - Rank-free ordering: gardens keep the server's accepted_at order (my own
 *   garden first). Score NEVER reorders anything.
 * - Week-0 silence: a garden with 0 good days this week is dropped entirely —
 *   the fair is "im lặng tuyệt đối" about it (no grey tile, no "0/7").
 * - Self-verifying lanterns: a previous-week score is only trusted when the
 *   stored week label matches M-1, so a stale row (absent >= 2 weeks) can never
 *   be honored. At most 3 lanterns, for the highest positive prev-week scores.
 * - Bloom band: every garden with >= 4 good days blooms — many winners at once.
 *
 * No streak / last-active data is ever consumed here (§0.3): the only numbers
 * are positive weekly counts.
 */

/** Locked decision §11: a garden blooms at >= 4 good days out of 7. */
export const FAIR_BLOOM_THRESHOLD = 4;

/** Locked decision §11: at most the top 3 previous-week gardens get a lantern. */
export const FAIR_MAX_LANTERNS = 3;

export type FairGardenView = FairGarden & {
  /** True for the viewer's own garden (rendered first, labelled distinctly). */
  isMe: boolean;
  /** Top-3 previous-week honor (spec §5.2). Decoration only — never a filter. */
  hasLantern: boolean;
  /** weekly_good_days >= FAIR_BLOOM_THRESHOLD. */
  hasBloom: boolean;
};

function isoShift(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + deltaDays);

  return date.toISOString().slice(0, 10);
}

/** Monday (ISO week start, Monday-based) of the week containing `isoDate`. */
export function mondayOf(isoDate: string): string {
  const dow = new Date(`${isoDate}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7; // Mon=0 .. Sun=6

  return isoShift(isoDate, -daysSinceMonday);
}

/** M-1: the Monday that starts the week BEFORE today's week (spec §5.2). */
export function previousWeekMonday(todayIso: string): string {
  return isoShift(mondayOf(todayIso), -7);
}

/**
 * The self-verifying previous-week score (spec §5.2). Returns the garden's
 * last-completed-week good-days count ONLY when its stored week label matches
 * M-1 — never guesses. Returns null when there is no trustworthy previous week
 * (a first fair week, or absent >= 2 weeks so the row is stale).
 */
export function lanternScore(garden: FairGarden, m1: string): number | null {
  // Row hasn't rolled over yet (last write was in the M-1 week): the current
  // weekly count IS the previous week's completed count.
  if (garden.weekStart === m1) return garden.weeklyGoodDays;

  // Rolled over: trust prev_week_* only when it points exactly at M-1.
  if (garden.prevWeekStart === m1) return garden.prevWeekGoodDays;

  return null;
}

/**
 * Derive the rank-free, decorated fair view (spec §5.2). Order = my garden
 * first, then friends in the server's accepted_at order; score never reorders.
 * Week-0 gardens are dropped (silence). Bloom for >= 4 good days; up to 3
 * lanterns for the highest positive self-verifying previous-week scores.
 */
export function deriveFairView(fair: GardenFair, todayIso: string): FairGardenView[] {
  const m1 = previousWeekMonday(todayIso);

  const ordered: Array<{ garden: FairGarden; isMe: boolean }> = [];

  if (fair.me) ordered.push({ garden: fair.me, isMe: true });
  for (const g of fair.gardens) ordered.push({ garden: g, isMe: false });

  // Week-0 silence: a garden with no good days this week is not shown at all.
  const shown = ordered.filter((entry) => entry.garden.weeklyGoodDays >= 1);

  // Lanterns: pick by score (positive prev-week only), stable tiebreak = the
  // display order. This selection NEVER changes the display order below.
  const scored = shown
    .map((entry, index) => ({
      userId: entry.garden.userId,
      score: lanternScore(entry.garden, m1),
      index
    }))
    .filter(
      (entry): entry is { userId: string; score: number; index: number } =>
        entry.score !== null && entry.score > 0
    )
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const lanternIds = new Set(scored.slice(0, FAIR_MAX_LANTERNS).map((entry) => entry.userId));

  return shown.map((entry) => ({
    ...entry.garden,
    isMe: entry.isMe,
    hasLantern: lanternIds.has(entry.garden.userId),
    hasBloom: entry.garden.weeklyGoodDays >= FAIR_BLOOM_THRESHOLD
  }));
}
