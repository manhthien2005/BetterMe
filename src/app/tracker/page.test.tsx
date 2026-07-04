import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TrackerPage from "./page";

vi.mock("../../components/tracker/weekly-quest-board", () => ({
  WeeklyQuestBoard: () => <section>Local weekly tracker</section>
}));

describe("TrackerPage", () => {
  it("renders the local weekly tracker board", () => {
    render(<TrackerPage />);

    expect(screen.getByText("Local weekly tracker")).toBeTruthy();
  });
});
