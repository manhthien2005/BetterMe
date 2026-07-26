import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardDayRecord, DashboardHabit } from "@/components/dashboard/dashboard-data";
import { HabitDayList } from "@/components/dashboard/habit-day-list";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";
import type { TimeOfDay } from "@/components/dashboard/habit-model";

function habit(
  id: string,
  name: string,
  overrides: Partial<DashboardHabit> = {}
): DashboardHabit {
  return migrateHabitFields({
    id,
    key: id,
    name,
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Star",
    ...overrides
  }) as DashboardHabit;
}

function record(completions: Record<string, boolean> = {}): DashboardDayRecord {
  return {
    date: "2026-07-27",
    entries: Object.fromEntries(
      Object.entries(completions).map(([key, done]) => [key, { value: done ? 1 : 0 }])
    ),
    completions
  };
}

function setup(habits: DashboardHabit[], dayRecord = record()) {
  const onSetEntry = vi.fn();
  const onOpenEditor = vi.fn();
  const onOpenDetail = vi.fn();
  const onCreate = vi.fn();
  const onMove = vi.fn();

  render(
    <HabitDayList
      habits={habits}
      onAdjustEntry={vi.fn()}
      onCreate={onCreate}
      onMove={onMove}
      onOpenDetail={onOpenDetail}
      onOpenEditor={onOpenEditor}
      onSetEntry={onSetEntry}
      record={dayRecord}
      streaks={{}}
    />
  );

  return { onSetEntry, onOpenEditor, onOpenDetail, onCreate, onMove };
}

const morning: TimeOfDay[] = ["morning"];
const evening: TimeOfDay[] = ["evening"];

describe("HabitDayList — grouping", () => {
  it("orders the groups morning → afternoon → evening → all day", () => {
    setup([
      habit("c", "Đọc sách", { timesOfDay: evening }),
      habit("a", "Chạy bộ", { timesOfDay: morning }),
      habit("d", "Uống nước", { timesOfDay: ["anytime"] }),
      habit("b", "Ăn trưa", { timesOfDay: ["afternoon"] })
    ]);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);

    expect(headings).toEqual(["☀️ Sáng", "🌤 Chiều", "🌙 Tối", "Cả ngày"]);
  });

  it("never renders an empty group", () => {
    setup([habit("a", "Chạy bộ", { timesOfDay: morning })]);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(screen.queryByText("🌙 Tối")).toBeNull();
  });

  it("a habit in two parts of the day shows in both, as one and the same cell", () => {
    const { onSetEntry } = setup([
      habit("pill", "Uống thuốc", { timesOfDay: ["morning", "evening"] })
    ]);

    const rows = screen.getAllByRole("listitem");

    expect(rows).toHaveLength(2);
    // The repeat is marked so it does not read as a second, different task.
    expect(screen.getByText(/cũng ở 🌙 Tối/)).toBeTruthy();
    expect(screen.getByText(/cũng ở ☀️ Sáng/)).toBeTruthy();

    fireEvent.click(within(rows[1]).getByRole("checkbox"));
    expect(onSetEntry).toHaveBeenCalledWith("pill", 1);
  });
});

describe("HabitDayList — rows", () => {
  it("tints the icon bubble with the habit's own colour", () => {
    setup([habit("a", "Chạy bộ", { timesOfDay: morning, color: "sky", icon: "🏃" })]);

    expect(screen.getByText("🏃").className).toContain("bg-habit-sky-soft");
  });

  it("marks a finished row as done and credits the grain", () => {
    setup([habit("a", "Chạy bộ", { timesOfDay: morning })], record({ a: true }));

    const row = screen.getByRole("listitem");

    expect(within(row).getByText("+1 🌾")).toBeTruthy();
    expect(within(row).getByText("Chạy bộ").className).toContain("line-through");
  });

  it("a count habit at its target is just as finished as a ticked box", () => {
    const counter = habit("w", "Uống nước", {
      timesOfDay: morning,
      trackingType: "count",
      target: 8,
      unit: "ly"
    });

    render(
      <HabitDayList
        habits={[counter]}
        onAdjustEntry={vi.fn()}
        onCreate={vi.fn()}
        onMove={vi.fn()}
        onOpenDetail={vi.fn()}
        onOpenEditor={vi.fn()}
        onSetEntry={vi.fn()}
        record={{
          date: "2026-07-27",
          entries: { w: { value: 8 } },
          completions: { w: true }
        }}
        streaks={{}}
      />
    );

    const row = screen.getByRole("listitem");

    expect(within(row).getByText("+1 🌾")).toBeTruthy();
    expect(within(row).getByText("Uống nước").className).toContain("line-through");
  });

  it("opens the editor from the habit's name", () => {
    const { onOpenEditor } = setup([habit("a", "Chạy bộ", { timesOfDay: morning })]);

    fireEvent.click(screen.getByRole("button", { name: /Sửa Chạy bộ/ }));
    expect(onOpenEditor).toHaveBeenCalledWith("a");
  });

  it("keeps a way through to the habit's own detail view", () => {
    const { onOpenDetail } = setup([habit("a", "Chạy bộ", { timesOfDay: morning })]);

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết thói quen Chạy bộ" }));
    expect(onOpenDetail).toHaveBeenCalledWith("a");
  });

  it("shows the planned time when the habit has one", () => {
    setup([habit("a", "Chạy bộ", { timesOfDay: morning, scheduledAt: "06:30" })]);

    expect(screen.getByText(/06:30/)).toBeTruthy();
  });
});

describe("HabitDayList — a busy day", () => {
  it("mentions a heavy day gently, never as blame", () => {
    const habits = Array.from({ length: 8 }, (_, index) =>
      habit(`h${index}`, `Việc ${index}`, { timesOfDay: morning })
    );

    setup(habits);

    const note = screen.getByRole("status").textContent ?? "";

    expect(note).toContain("8 việc");
    for (const blame of ["thua", "kém", "lười", "thất bại", "tệ"]) {
      expect(note.toLowerCase()).not.toContain(blame);
    }
  });

  it("stays quiet at seven or fewer", () => {
    const habits = Array.from({ length: 7 }, (_, index) =>
      habit(`h${index}`, `Việc ${index}`, { timesOfDay: morning })
    );

    setup(habits);

    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("HabitDayList — reordering", () => {
  it("offers a keyboard path behind a sort toggle", () => {
    const { onMove } = setup([
      habit("a", "Chạy bộ", { timesOfDay: morning }),
      habit("b", "Thiền", { timesOfDay: morning })
    ]);

    expect(screen.queryByRole("button", { name: /Đưa Thiền lên/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Sắp xếp/ }));
    fireEvent.click(screen.getByRole("button", { name: /Đưa Thiền lên/ }));

    expect(onMove).toHaveBeenCalledWith("b", -1);
  });

  it("lets a new habit be planted from the list", () => {
    const { onCreate } = setup([habit("a", "Chạy bộ", { timesOfDay: morning })]);

    fireEvent.click(screen.getByRole("button", { name: /Thêm thói quen/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
