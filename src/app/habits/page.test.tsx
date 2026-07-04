import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HabitsPage from "./page";

vi.mock("../../components/habits/habit-config-panel", () => ({
  HabitConfigPanel: () => <section>Local habits panel</section>
}));

describe("HabitsPage", () => {
  it("renders the local habit configuration panel", () => {
    render(<HabitsPage />);

    expect(screen.getByText("Local habits panel")).toBeTruthy();
  });
});
