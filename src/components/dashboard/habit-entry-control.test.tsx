import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardHabit } from "@/components/dashboard/dashboard-data";
import { HabitEntryControl } from "@/components/dashboard/habit-entry-control";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";

function habit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "h",
    key: "h",
    name: "Uống đủ nước",
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Star",
    ...overrides
  }) as DashboardHabit;
}

describe("HabitEntryControl — check", () => {
  it("ticks and unticks", () => {
    const onSet = vi.fn();
    const { rerender } = render(
      <HabitEntryControl entry={undefined} habit={habit()} onSet={onSet} />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Uống đủ nước/ }));
    expect(onSet).toHaveBeenCalledWith(1);

    rerender(<HabitEntryControl entry={{ value: 1 }} habit={habit()} onSet={onSet} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Uống đủ nước/ }));
    expect(onSet).toHaveBeenLastCalledWith(0);
  });

  it("reports its state to assistive tech", () => {
    render(<HabitEntryControl entry={{ value: 1 }} habit={habit()} onSet={vi.fn()} />);

    expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
  });

  it("keeps a 44px touch target", () => {
    render(<HabitEntryControl entry={undefined} habit={habit()} onSet={vi.fn()} />);

    expect(screen.getByRole("checkbox").className).toContain("min-h-[44px]");
  });
});

describe("HabitEntryControl — count", () => {
  const counter = habit({ trackingType: "count", target: 8, unit: "ly" });

  it("adds one unit per press and names the unit", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 5 }} habit={counter} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: "+1 ly" }));
    expect(onSet).toHaveBeenCalledWith(6);
  });

  it("shows progress without punishing a partial day", () => {
    render(<HabitEntryControl entry={{ value: 5 }} habit={counter} onSet={vi.fn()} />);

    expect(screen.getByText("5/8")).toBeTruthy();
  });

  it("turns into a done state at the target and clears on a second press", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 8 }} habit={counter} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: /Bỏ đánh dấu/ }));
    expect(onSet).toHaveBeenCalledWith(0);
  });

  it("starts from nothing when the day has no entry yet", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={undefined} habit={counter} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: "+1 ly" }));
    expect(onSet).toHaveBeenCalledWith(1);
  });
});

describe("HabitEntryControl — duration", () => {
  it("counts in minutes, five at a time", () => {
    const onSet = vi.fn();
    const timed = habit({ trackingType: "duration", target: 20 });

    render(<HabitEntryControl entry={{ value: 10 }} habit={timed} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: "+5 phút" }));
    expect(onSet).toHaveBeenCalledWith(15);
    expect(screen.getByText("10/20")).toBeTruthy();
  });
});

describe("HabitEntryControl — checklist", () => {
  const list = habit({
    trackingType: "checklist",
    target: 3,
    steps: ["Trải chiếu", "Ngồi 5 phút", "Ghi một dòng"]
  });

  it("expands the steps and flips one without touching the others", () => {
    const onSet = vi.fn();

    render(<HabitEntryControl entry={{ value: 0b001 }} habit={list} onSet={onSet} />);

    fireEvent.click(screen.getByRole("button", { name: /Mở các bước/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Ngồi 5 phút" }));

    expect(onSet).toHaveBeenCalledWith(0b011);
  });

  it("reports progress in steps", () => {
    render(<HabitEntryControl entry={{ value: 0b011 }} habit={list} onSet={vi.fn()} />);

    expect(screen.getByText("2/3")).toBeTruthy();
  });

  it("marks the expander's state for assistive tech", () => {
    render(<HabitEntryControl entry={{ value: 0 }} habit={list} onSet={vi.fn()} />);

    const expander = screen.getByRole("button", { name: /Mở các bước/ });

    expect(expander.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expander);
    expect(screen.getByRole("button", { name: /bước/ }).getAttribute("aria-expanded")).toBe("true");
  });
});
