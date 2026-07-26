import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildHabitDetail,
  createInitialDashboardState
} from "@/components/dashboard/dashboard-data";
import { HabitDetailOverlay } from "@/components/dashboard/habit-detail-overlay";

const today = "2026-07-04";
const CATEGORIES = ["Discipline", "Learning", "Work", "Health", "Reflection"];

function detailFor(habitId = "wake_up") {
  return buildHabitDetail(createInitialDashboardState(today), habitId, today)!;
}

function renderOverlay() {
  const handlers = { onClose: vi.fn(), onRemove: vi.fn(), onSave: vi.fn() };

  const view = render(
    <HabitDetailOverlay
      categories={CATEGORIES}
      detail={detailFor()}
      onClose={handlers.onClose}
      onRemove={handlers.onRemove}
      onSave={handlers.onSave}
    />
  );

  return { handlers, view };
}

describe("HabitDetailOverlay", () => {
  it("shows the habit name, the three stats, and a 35-cell heatmap", () => {
    const { view } = renderOverlay();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Dậy đúng giờ" })).toBeTruthy();
    expect(screen.getByText("Chuỗi ngày")).toBeTruthy();
    expect(screen.getByText("Nhịp 7 ngày")).toBeTruthy();
    expect(screen.getByText("Nhịp 30 ngày")).toBeTruthy();

    const cells = screen
      .getAllByRole("img")
      .filter((cell) => /đã xong|để trống|chưa tới/.test(cell.getAttribute("aria-label") ?? ""));

    expect(cells).toHaveLength(35);

    // No-guilt: missed days are neutral copy, never blame words.
    const text = (view.container.textContent ?? "").toLowerCase();
    for (const banned of ["thua", "kém", "xếp cuối", "bỏ lỡ", "thất bại"]) {
      expect(text).not.toContain(banned);
    }
  });

  it("saves edits with the trimmed name and the picked category", () => {
    const { handlers } = renderOverlay();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), {
      target: { value: "  Dậy thật sớm  " }
    });
    fireEvent.change(screen.getByLabelText("Nhóm"), { target: { value: "Health" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(handlers.onSave).toHaveBeenCalledWith("wake_up", "Dậy thật sớm", "Health");
  });

  it("disables save without changes and asks before removing", () => {
    const { handlers } = renderOverlay();

    expect(
      (screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement).disabled
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Xóa thói quen này" }));
    expect(handlers.onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Xóa luôn" }));
    expect(handlers.onRemove).toHaveBeenCalledWith("wake_up");
  });

  it("closes on Escape and on a backdrop click", () => {
    const { handlers } = renderOverlay();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handlers.onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("dialog"));
    expect(handlers.onClose).toHaveBeenCalledTimes(2);
  });
});
