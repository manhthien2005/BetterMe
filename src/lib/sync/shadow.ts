import { addDaysIso } from "@/lib/date";
import { getDashboardToday } from "@/components/dashboard/dashboard-data";

import { readJson, writeJson } from "./storage";
import { compareTs } from "./time";
import type { ShadowMap } from "./types";

/**
 * Shadow map (spec §2.1): per-cell LWW stamps for completions, kept in
 * localStorage betterme.syncmeta.v1 — OUTSIDE DashboardState so the pure
 * dashboard functions never change shape. A missing stamp = epoch (the cell
 * was never locally mutated since sync began, so any server write wins).
 */

export const SYNC_SHADOW_STORAGE_KEY = "betterme.syncmeta.v1";
export const SHADOW_RETENTION_DAYS = 90;

export function loadShadowMap(): ShadowMap {
  const raw = readJson<unknown>(SYNC_SHADOW_STORAGE_KEY);

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const map: ShadowMap = {};

  Object.entries(raw as Record<string, unknown>).forEach(([date, cells]) => {
    if (!cells || typeof cells !== "object" || Array.isArray(cells)) return;

    const cleaned: Record<string, string> = {};

    Object.entries(cells as Record<string, unknown>).forEach(([habitKey, stamp]) => {
      if (typeof stamp === "string") cleaned[habitKey] = stamp;
    });

    if (Object.keys(cleaned).length > 0) map[date] = cleaned;
  });

  return map;
}

export function saveShadowMap(map: ShadowMap): void {
  writeJson(SYNC_SHADOW_STORAGE_KEY, map);
}

/** Pure: returns a map with the cell stamped. Stamps are monotonic per cell (keeps the newer). */
export function withCellStamp(
  map: ShadowMap,
  date: string,
  habitKey: string,
  mutatedAtIso: string
): ShadowMap {
  const existing = map[date]?.[habitKey] ?? null;

  if (compareTs(existing, mutatedAtIso) >= 0) return map;

  return {
    ...map,
    [date]: { ...map[date], [habitKey]: mutatedAtIso }
  };
}

export function applyShadowUpdates(
  map: ShadowMap,
  updates: ReadonlyArray<{ date: string; habitKey: string; mutatedAt: string }>
): ShadowMap {
  return updates.reduce(
    (next, update) => withCellStamp(next, update.date, update.habitKey, update.mutatedAt),
    map
  );
}

/** Load → stamp → save. Returns the new map. */
export function stampCell(date: string, habitKey: string, mutatedAtIso: string): ShadowMap {
  const map = withCellStamp(loadShadowMap(), date, habitKey, mutatedAtIso);

  saveShadowMap(map);

  return map;
}

export function getCellStamp(date: string, habitKey: string): string | null {
  return loadShadowMap()[date]?.[habitKey] ?? null;
}

/** Drops stamp entries for dates older than SHADOW_RETENTION_DAYS. */
export function pruneShadowMap(map: ShadowMap, today = getDashboardToday()): ShadowMap {
  const cutoff = addDaysIso(today, -SHADOW_RETENTION_DAYS);
  const expired = Object.keys(map).filter((date) => date < cutoff);

  if (expired.length === 0) return map;

  const pruned: ShadowMap = {};

  Object.keys(map).forEach((date) => {
    if (date >= cutoff) pruned[date] = map[date];
  });

  return pruned;
}

/** Moves every stamp under oldKey to newKey (slug-collision re-key, spec §2.2). */
export function rekeyShadowCells(map: ShadowMap, oldKey: string, newKey: string): ShadowMap {
  let changed = false;
  const next: ShadowMap = {};

  Object.keys(map).forEach((date) => {
    const cells = map[date];

    if (!(oldKey in cells)) {
      next[date] = cells;
      return;
    }

    const { [oldKey]: stamp, ...rest } = cells;

    next[date] = { ...rest, [newKey]: stamp };
    changed = true;
  });

  return changed ? next : map;
}
