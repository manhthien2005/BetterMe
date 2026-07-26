import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CI has no database, so nothing here executes SQL — this reads schema.sql as
 * text and guards the two mistakes that only ever show up on the real
 * instance: a widened function silently becoming an OVERLOAD of its old self
 * (PostgREST then fails every named-argument call with 42725), and a grant
 * still naming the old signature (so the new function keeps Postgres' default
 * EXECUTE-to-PUBLIC and stays reachable by `anon`).
 */

// Resolved from the repo root, not from import.meta.url: the jsdom
// environment does not give this module a file:// URL.
const SCHEMA = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");

/**
 * "p_key text, p_days jsonb default '[1,2,3]'::jsonb" -> ["text", "jsonb"]
 *
 * String literals are blanked BEFORE splitting: a default like '[1,2,3]' has
 * commas inside it, and a naive split would read each digit as a parameter.
 */
function parameterTypes(params: string): string[] {
  return params
    .replace(/'[^']*'/g, "''")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => part.split(/\s+/)[1]);
}

/** Every `create or replace function public.NAME(...)` with its parameter types. */
function definedFunctions(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const pattern = /create or replace function public\.(\w+)\s*\(([\s\S]*?)\)\s*returns/g;

  for (const match of SCHEMA.matchAll(pattern)) {
    out.set(match[1], parameterTypes(match[2]));
  }

  return out;
}

describe("schema.sql — habit sync columns", () => {
  it("adds the v3 log detail columns idempotently", () => {
    expect(SCHEMA).toMatch(
      /alter table public\.habit_logs add column if not exists value integer/
    );
    expect(SCHEMA).toMatch(
      /alter table public\.habit_logs add column if not exists completed_at text/
    );
  });

  it("adds every v3 habit definition column idempotently", () => {
    const columns = [
      "icon",
      "tracking_type",
      "target",
      "unit",
      "steps",
      "repeat_days",
      "times_of_day",
      "scheduled_at",
      "color",
      "motivation",
      "paused_at",
      "archived_at"
    ];

    columns.forEach((column) => {
      expect(
        new RegExp(`alter table public\\.habits add column if not exists ${column}\\b`).test(SCHEMA),
        `habits.${column} must be added with "add column if not exists"`
      ).toBe(true);
    });
  });
});

describe("schema.sql — function signature hygiene", () => {
  it("drops the old signature before re-creating a widened function", () => {
    // `create or replace` with a different argument list OVERLOADS instead of
    // replacing. Two overloads + a named-argument call = 42725.
    const widened = [
      "public.apply_habit_log(text, date, boolean, timestamptz)",
      "public.upsert_habit(text, text, text, numeric, boolean, text, integer, timestamptz, boolean)"
    ];

    // A long drop wraps across lines in the file, so both sides are compared
    // with whitespace removed entirely rather than merely collapsed.
    const squashed = SCHEMA.replace(/\s+/g, "");

    widened.forEach((signature) => {
      const name = signature.slice("public.".length, signature.indexOf("("));
      const dropIndex = squashed.indexOf(`dropfunctionifexists${signature.replace(/\s+/g, "")}`);
      const createIndex = squashed.indexOf(`createorreplacefunctionpublic.${name}(`);

      expect(dropIndex, `missing "drop function if exists ${signature};"`).toBeGreaterThan(-1);
      expect(dropIndex, `the drop of ${signature} must come before its create`).toBeLessThan(
        createIndex
      );
    });
  });

  it("every granted signature matches the function actually defined", () => {
    const defined = definedFunctions();
    const grants = SCHEMA.matchAll(/grant execute on function public\.(\w+)\s*\(([^)]*)\)/g);
    let checked = 0;

    for (const grant of grants) {
      const name = grant[1];
      const granted = grant[2]
        .split(",")
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
      const actual = defined.get(name);

      if (!actual) continue; // granted on a function defined outside this file

      expect(granted, `the grant for ${name}() names a signature that no longer exists`).toEqual(
        actual
      );
      checked += 1;
    }

    expect(checked).toBeGreaterThan(4);
  });

  it("every sync RPC is revoked from public and anon", () => {
    // Revoking from anon alone is a no-op: functions are EXECUTE-granted to
    // PUBLIC by default and anon inherits that.
    ["apply_habit_log", "upsert_habit", "delete_habit", "get_sync_snapshot"].forEach((name) => {
      expect(
        new RegExp(
          `revoke execute on function public\\.${name}\\([^)]*\\) from public, anon`
        ).test(SCHEMA),
        `${name}() must be revoked from public, anon`
      ).toBe(true);
    });
  });
});
