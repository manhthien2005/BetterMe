/**
 * Guarded localStorage access for the sync layer. Sync must degrade silently —
 * SSR, private-mode quota errors, or corrupt JSON must never break the app
 * (localStorage stays the render source of truth; sync is background-only).
 */

export function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string): T | null {
  const storage = getLocalStorage();

  if (!storage) return null;

  try {
    const raw = storage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  const storage = getLocalStorage();

  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode: sync degrades, the app must not.
  }
}

export function removeKey(key: string): void {
  const storage = getLocalStorage();

  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}
