/**
 * Timestamp comparison for LWW merges. ISO stamps come in TWO formats that do
 * NOT compare lexicographically: client stamps end in "Z"
 * ("2026-07-08T03:14:15.926Z") while Postgres timestamptz serializes with an
 * offset and microseconds ("2026-07-08T03:14:15.926535+00:00"). Always compare
 * through epoch milliseconds.
 */

/** null/undefined/unparseable = epoch (-Infinity): always loses to a real stamp. */
export function tsToMs(iso: string | null | undefined): number {
  if (!iso) return Number.NEGATIVE_INFINITY;

  const ms = Date.parse(iso);

  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

/** -1 when a < b, 0 when equal (millisecond precision), 1 when a > b. */
export function compareTs(a: string | null | undefined, b: string | null | undefined): number {
  const am = tsToMs(a);
  const bm = tsToMs(b);

  if (am === bm) return 0;

  return am < bm ? -1 : 1;
}
