import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders the local-first app frame with navigation, theme runtime, and children", async () => {
    render(<AppShell><p>Daily corner</p></AppShell>);

    expect(screen.getByText("Daily corner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.getByRole("link", { name: "Tracker" }).getAttribute("href")).toBe("/tracker");
    expect(screen.getByRole("link", { name: "Calendar" }).getAttribute("href")).toBe("/calendar");
    expect(screen.getByRole("link", { name: "Habits" }).getAttribute("href")).toBe("/habits");
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
    expect(screen.getByTestId("themed-toaster")).toBeTruthy();
    expect(await screen.findByLabelText("Theme")).toBeTruthy();
  });
});
