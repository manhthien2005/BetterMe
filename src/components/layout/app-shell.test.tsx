import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders the local-first app frame with navigation, theme runtime, and children", async () => {
    render(<AppShell><p>Daily corner</p></AppShell>);

    expect(screen.getByText("Daily corner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/en/dashboard");
    expect(screen.getByRole("link", { name: "Tracker" }).getAttribute("href")).toBe("/en/tracker");
    expect(screen.getByRole("link", { name: "Calendar" }).getAttribute("href")).toBe("/en/calendar");
    expect(screen.getByRole("link", { name: "Habits" }).getAttribute("href")).toBe("/en/habits");
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/en/settings");
    expect(screen.getByTestId("themed-toaster")).toBeTruthy();
    expect(await screen.findByLabelText("Theme")).toBeTruthy();
    expect(await screen.findByLabelText("Language")).toBeTruthy();
  });
});
