import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CalendarPage from "@/app/calendar/page";
import HabitsPage from "@/app/habits/page";
import SettingsPage from "@/app/settings/page";
import TrackerPage from "@/app/tracker/page";

describe("static app pages", () => {
  it("renders the tracker page instead of a blank route", () => {
    render(<TrackerPage />);

    expect(screen.getByRole("heading", { name: "Weekly tracker" })).toBeTruthy();
  });

  it("renders the settings page instead of a blank route", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
  });

  it("renders the calendar page instead of a blank route", () => {
    render(<CalendarPage />);

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
  });

  it("renders the habits page instead of a blank route", () => {
    render(<HabitsPage />);

    expect(screen.getByRole("heading", { name: "Habit settings" })).toBeTruthy();
  });
});
