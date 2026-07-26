import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider, useAppState } from "@/components/app/state-provider";

function Probe() {
  const app = useAppState();
  // Seed history already marks most of today done — always grab an OPEN habit,
  // or "tick" would untick and the progress assertions would run backwards.
  const first =
    app.viewModel.habits.find((habit) => !habit.completed) ?? app.viewModel.habits[0];

  return (
    <div>
      <span data-testid="progress">
        {app.viewModel.today.completedHabits}/{app.viewModel.today.totalHabits}
      </span>
      <span data-testid="email">{app.userEmail}</span>
      <span data-testid="sync">{app.syncStatus}</span>
      <button onClick={() => app.toggleHabit(first.id)} type="button">
        tick
      </button>
      <button onClick={() => app.addHabit("Thiền 5 phút", "Reflection")} type="button">
        add
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <StateProvider userEmail="dev@betterme.local">
      <Probe />
    </StateProvider>
  );
}

describe("StateProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("throws when a consumer sits outside the provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/StateProvider/);

    quiet.mockRestore();
  });

  it("exposes the account email and starts with sync disabled", () => {
    renderProbe();

    expect(screen.getByTestId("email").textContent).toBe("dev@betterme.local");
    expect(screen.getByTestId("sync").textContent).toBe("disabled");
  });

  it("ticks a habit and advances the day's progress", () => {
    renderProbe();

    const [done, total] = screen.getByTestId("progress").textContent!.split("/").map(Number);

    fireEvent.click(screen.getByRole("button", { name: "tick" }));

    expect(screen.getByTestId("progress").textContent).toBe(`${done + 1}/${total}`);
  });

  it("unticking is a valid action and goes straight back down", () => {
    renderProbe();

    const before = screen.getByTestId("progress").textContent;

    fireEvent.click(screen.getByRole("button", { name: "tick" }));
    fireEvent.click(screen.getByRole("button", { name: "tick" }));

    expect(screen.getByTestId("progress").textContent).toBe(before);
  });

  it("persists every mutation under the v2 storage key", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    const saved = JSON.parse(window.localStorage.getItem("betterme.dashboard.v2")!);

    expect(saved.habits.some((habit: { name: string }) => habit.name === "Thiền 5 phút")).toBe(
      true
    );
  });
});
