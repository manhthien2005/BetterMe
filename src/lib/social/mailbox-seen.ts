/**
 * Mailbox celebration dedupe (social spec §4.2.1): which garden-visit ids have
 * already been celebrated, so a stuck/unacked visit never re-fires the toast +
 * bubble on the next mount. Map visitId -> visitDate, pruned to a 30-day window
 * to match the other ledger horizons.
 */
export const MAILBOX_SEEN_KEY = "betterme.mailboxseen.v1";

const RETENTION_DAYS = 30;

export type MailboxSeen = Record<string, string>;

/** today − days as an ISO YYYY-MM-DD (UTC arithmetic; lexicographically ordered). */
function isoDaysBefore(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}

/** Load the celebrated-visit map, dropping entries older than the window. */
export function loadMailboxSeen(today: string): MailboxSeen {
  try {
    const raw = window.localStorage.getItem(MAILBOX_SEEN_KEY);

    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cutoff = isoDaysBefore(today, RETENTION_DAYS);
    const seen: MailboxSeen = {};

    for (const [visitId, visitDate] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof visitDate === "string" && visitDate >= cutoff) seen[visitId] = visitDate;
    }

    return seen;
  } catch {
    return {};
  }
}

export function saveMailboxSeen(seen: MailboxSeen): void {
  try {
    window.localStorage.setItem(MAILBOX_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Best-effort: a full/blocked store just means we might re-celebrate later.
  }
}

/** How many of these visits have never been celebrated yet. */
export function countUnseen(
  visits: ReadonlyArray<{ visitId: string }>,
  seen: MailboxSeen
): number {
  return visits.filter((visit) => seen[visit.visitId] === undefined).length;
}
