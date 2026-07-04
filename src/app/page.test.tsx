import { describe, expect, it, vi } from "vitest";

import HomePage from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

describe("HomePage", () => {
  it("routes the app entry to the dashboard", () => {
    HomePage();

    expect(redirect).toHaveBeenCalledWith("/en/dashboard");
  });
});
