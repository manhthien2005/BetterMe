import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StateProvider, useAppState } from "@/components/app/state-provider";
import {
  adoptPet,
  createInitialDashboardState,
  getDashboardToday
} from "@/components/dashboard/dashboard-data";

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
      <span data-testid="food">{app.viewModel.companion.food}</span>
      <button onClick={() => app.setHabitEntry(first.id, 1)} type="button">
        set
      </button>
      <span data-testid="value">
        {app.todayRecord?.entries[app.viewModel.habits[0].id]?.value ?? 0}
      </span>
      <button
        onClick={() => {
          // Two presses inside ONE React batch — exactly what a fast
          // double-tap on "+1 ly" produces.
          app.adjustHabitEntry(app.viewModel.habits[0].id, 1);
          app.adjustHabitEntry(app.viewModel.habits[0].id, 1);
        }}
        type="button"
      >
        bump twice
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

  it("persists every mutation under the v3 storage key", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    const saved = JSON.parse(window.localStorage.getItem("betterme.dashboard.v3")!);

    expect(saved.habits.some((habit: { name: string }) => habit.name === "Thiền 5 phút")).toBe(
      true
    );
  });
});

describe("StateProvider storage v3", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("persists under the v3 key and leaves the v2 snapshot untouched", () => {
    const v2 = JSON.stringify({
      habits: [
        {
          id: "wake_up",
          key: "wake_up",
          name: "Dậy đúng giờ",
          category: "Discipline",
          maxScore: 1,
          description: "",
          iconName: "AlarmClock"
        }
      ],
      records: { "2026-07-26": { date: "2026-07-26", completions: { wake_up: true } } }
    });

    window.localStorage.setItem("betterme.dashboard.v2", v2);

    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    expect(window.localStorage.getItem("betterme.dashboard.v2")).toBe(v2);

    const saved = JSON.parse(window.localStorage.getItem("betterme.dashboard.v3")!);

    expect(saved.habits[0].trackingType).toBe("check");
    expect(saved.records["2026-07-26"].entries.wake_up).toEqual({ value: 1 });
  });

  it("prefers an existing v3 snapshot over the v2 one", () => {
    window.localStorage.setItem(
      "betterme.dashboard.v2",
      JSON.stringify({ habits: [], records: {} })
    );
    window.localStorage.setItem(
      "betterme.dashboard.v3",
      JSON.stringify({
        habits: [
          {
            id: "solo",
            key: "solo",
            name: "Chỉ một việc",
            category: "Health",
            maxScore: 1,
            description: "",
            iconName: "Star",
            trackingType: "check",
            target: 1,
            repeatDays: [1, 2, 3, 4, 5, 6, 7],
            timesOfDay: ["anytime"]
          }
        ],
        records: {}
      })
    );

    renderProbe();

    expect(screen.getByTestId("progress").textContent).toBe("0/1");
  });

  it("a direct entry write feeds the companion exactly like a tick does", () => {
    const day = getDashboardToday();

    window.localStorage.setItem(
      "betterme.dashboard.v3",
      JSON.stringify(adoptPet(createInitialDashboardState(day), "cat", "Mochi", day))
    );

    renderProbe();

    expect(screen.getByTestId("food").textContent).toBe("0");

    // The Probe writes value 1 on the first OPEN habit — the seed sits at 6/7,
    // so this completes the day: one treat plus the perfect-day bonus.
    fireEvent.click(screen.getByRole("button", { name: "set" }));

    expect(screen.getByTestId("food").textContent).toBe("2");
  });
});

describe("adjustHabitEntry", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
  });

  it("two presses in the same React batch both land", () => {
    renderProbe();

    const before = Number(screen.getByTestId("value").textContent);

    fireEvent.click(screen.getByRole("button", { name: "bump twice" }));

    // Reading the rendered state instead of the ref would drop one press.
    expect(Number(screen.getByTestId("value").textContent)).toBe(before + 2);
  });
});
