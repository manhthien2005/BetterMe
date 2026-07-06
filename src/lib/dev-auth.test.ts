import { describe, expect, it } from "vitest";

import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

describe("isDevAuthBypassEnabled", () => {
  it("enables bypass only outside production when flag is true", () => {
    expect(
      isDevAuthBypassEnabled({
        BETTERME_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "development"
      } as NodeJS.ProcessEnv)
    ).toBe(true);
  });

  it("stays disabled without the flag", () => {
    expect(
      isDevAuthBypassEnabled({
        NODE_ENV: "development"
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });

  it("stays disabled in production even when flag is true", () => {
    expect(
      isDevAuthBypassEnabled({
        BETTERME_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "production"
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});
