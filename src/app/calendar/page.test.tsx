import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CalendarPage from "./page";

vi.mock("../../components/calendar/calendar-view", () => ({
  CalendarView: () => <section>Local calendar view</section>
}));

describe("CalendarPage", () => {
  it("renders the local calendar screen", () => {
    render(<CalendarPage />);

    expect(screen.getByText("Local calendar view")).toBeTruthy();
  });
});
