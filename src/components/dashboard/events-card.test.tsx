import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  addEventToState,
  createInitialDashboardState,
  formatEventTime,
  removeEventFromState,
  buildDashboardViewModel
} from "@/components/dashboard/dashboard-data";
import { EventsCard } from "@/components/dashboard/events-card";

const today = "2026-07-04";

describe("event state", () => {
  it("adds, sorts, filters past events, and removes", () => {
    let state = createInitialDashboardState(today);

    expect(state.events).toEqual([]);

    state = addEventToState(state, { title: "Ôn lại tuần", at: `${today}T20:30`, category: "reflection" });
    state = addEventToState(state, { title: "Cà phê", at: `${today}T08:00`, category: "personal" });
    state = addEventToState(state, { title: "Đã qua", at: "2026-07-01T09:00", category: "planning" });
    state = addEventToState(state, { title: "  ", at: `${today}T09:00`, category: "habit" });
    state = addEventToState(state, { title: "Giờ rác", at: "hôm nào đó", category: "habit" });

    expect(state.events).toHaveLength(3);

    const viewModel = buildDashboardViewModel(state, today);

    // Past events hidden, remainder sorted ascending.
    expect(viewModel.events.map((event) => event.title)).toEqual(["Cà phê", "Ôn lại tuần"]);

    const removed = removeEventFromState(state, state.events[0].id);

    expect(removed.events).toHaveLength(2);
    expect(removeEventFromState(removed, "ghost")).toBe(removed);
  });

  it("formats event times relative to today in Vietnamese", () => {
    expect(formatEventTime(`${today}T20:30`, today)).toBe("Hôm nay · 20:30");
    expect(formatEventTime("2026-07-05T07:45", today)).toBe("Ngày mai · 07:45");
    // 2026-07-06 is a Monday.
    expect(formatEventTime("2026-07-06T19:15", today)).toBe("T2 06/07 · 19:15");
  });
});

describe("EventsCard", () => {
  it("shows the empty state and adds an event through the form", () => {
    const onAdd = vi.fn();

    render(<EventsCard events={[]} onAdd={onAdd} onRemove={vi.fn()} today={today} />);

    expect(screen.getByText(/Chưa có sự kiện nào/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Thêm/ }));
    fireEvent.change(screen.getByLabelText("Tên sự kiện"), {
      target: { value: "Hẹn nha sĩ" }
    });
    fireEvent.change(screen.getByLabelText("Thời gian"), {
      target: { value: "2026-07-05T09:30" }
    });
    fireEvent.change(screen.getByLabelText("Nhóm sự kiện"), {
      target: { value: "personal" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu sự kiện" }));

    expect(onAdd).toHaveBeenCalledWith({
      title: "Hẹn nha sĩ",
      at: "2026-07-05T09:30",
      category: "personal"
    });
  });

  it("renders events with Vietnamese time labels and a delete control", () => {
    const onRemove = vi.fn();

    render(
      <EventsCard
        events={[
          { id: "e1", title: "Ôn lại tuần", at: `${today}T20:30`, category: "reflection" }
        ]}
        onAdd={vi.fn()}
        onRemove={onRemove}
        today={today}
      />
    );

    expect(screen.getByText("Ôn lại tuần")).toBeTruthy();
    expect(screen.getByText("Hôm nay · 20:30")).toBeTruthy();
    expect(screen.getByText("suy ngẫm")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Xóa sự kiện Ôn lại tuần" }));
    expect(onRemove).toHaveBeenCalledWith("e1");
  });
});
