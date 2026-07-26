import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardHabit } from "@/components/dashboard/dashboard-data";
import { HabitEditorSheet } from "@/components/dashboard/habit-editor-sheet";
import { migrateHabitFields } from "@/components/dashboard/habit-migration";

function existingHabit(overrides: Partial<DashboardHabit> = {}): DashboardHabit {
  return migrateHabitFields({
    id: "water",
    key: "water",
    name: "Uống đủ nước",
    category: "Health",
    maxScore: 1,
    description: "",
    iconName: "Star",
    icon: "💧",
    trackingType: "count",
    target: 8,
    unit: "ly",
    timesOfDay: ["morning"],
    ...overrides
  }) as DashboardHabit;
}

function setup(habit: DashboardHabit | null = null) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const onPause = vi.fn();
  const onArchive = vi.fn();

  render(
    <HabitEditorSheet
      habit={habit}
      onArchive={onArchive}
      onClose={onClose}
      onPause={onPause}
      onSubmit={onSubmit}
    />
  );

  return { onSubmit, onClose, onPause, onArchive };
}

function openAdvanced() {
  fireEvent.click(screen.getByRole("button", { name: /Tinh chỉnh thêm/ }));
}

describe("HabitEditorSheet — shell", () => {
  it("is a modal dialog that closes on Escape", () => {
    const { onClose } = setup();
    const dialog = screen.getByRole("dialog");

    expect(dialog.getAttribute("aria-modal")).toBe("true");

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers the starter templates when creating", () => {
    setup();

    expect(screen.getByText("BẮT ĐẦU TỪ MẪU CÓ SẴN")).toBeTruthy();
    expect(screen.getByRole("button", { name: /💧 Uống nước/ })).toBeTruthy();
  });

  it("hides the templates in edit mode and titles the sheet with the habit", () => {
    setup(existingHabit());

    expect(screen.queryByText("BẮT ĐẦU TỪ MẪU CÓ SẴN")).toBeNull();
    expect(screen.getByRole("heading", { name: "Uống đủ nước" })).toBeTruthy();
  });
});

describe("HabitEditorSheet — quick create", () => {
  it("a template fills the whole form in one tap", () => {
    const { onSubmit } = setup();

    fireEvent.click(screen.getByRole("button", { name: /💧 Uống nước/ }));

    expect((screen.getByLabelText("Tên thói quen") as HTMLInputElement).value).toBe(
      "Uống đủ nước"
    );
    expect((screen.getByLabelText("Mục tiêu mỗi ngày") as HTMLInputElement).value).toBe("8");

    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: "Uống đủ nước",
      icon: "💧",
      trackingType: "count",
      target: 8,
      unit: "ly"
    });
  });

  it("suggests an icon from the name being typed", () => {
    setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), {
      target: { value: "Chạy bộ buổi sáng" }
    });

    const suggestions = screen.getByLabelText("Biểu tượng gợi ý");

    expect(within(suggestions).getAllByRole("button")[0].textContent).toBe("🏃");
  });

  it("adopts a suggested icon when tapped", () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Đọc sách" } });

    const suggestions = screen.getByLabelText("Biểu tượng gợi ý");

    fireEvent.click(within(suggestions).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    expect(onSubmit.mock.calls[0][0].icon).toBe("📖");
  });

  it("shows a target only for the types that have one", () => {
    setup();

    expect(screen.queryByLabelText("Mục tiêu mỗi ngày")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Đếm số lượng" }));
    expect(screen.getByLabelText("Mục tiêu mỗi ngày")).toBeTruthy();
    expect(screen.getByLabelText("Đơn vị")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Thời lượng" }));
    expect(screen.getByLabelText("Mục tiêu mỗi ngày")).toBeTruthy();
    // Minutes are the unit — there is nothing to pick.
    expect(screen.queryByLabelText("Đơn vị")).toBeNull();
  });

  it("keeps a checklist between two and seven steps", () => {
    setup();

    fireEvent.click(screen.getByRole("radio", { name: "Checklist" }));

    // Starts at the minimum of two.
    expect(screen.getAllByLabelText(/^Bước \d$/)).toHaveLength(2);

    for (let index = 0; index < 8; index += 1) {
      const add = screen.queryByRole("button", { name: "Thêm bước" });

      if (add) fireEvent.click(add);
    }

    expect(screen.getAllByLabelText(/^Bước \d$/)).toHaveLength(7);
    expect(screen.queryByRole("button", { name: "Thêm bước" })).toBeNull();
  });

  it("refuses to submit without a name", () => {
    setup();

    expect(
      (screen.getByRole("button", { name: /Trồng thói quen/ }) as HTMLButtonElement).disabled
    ).toBe(true);

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Thiền" } });

    expect(
      (screen.getByRole("button", { name: /Trồng thói quen/ }) as HTMLButtonElement).disabled
    ).toBe(false);
  });
});

describe("HabitEditorSheet — refine", () => {
  it("keeps the extra settings out of the way until asked for", () => {
    setup();

    const toggle = screen.getByRole("button", { name: /Tinh chỉnh thêm/ });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByLabelText("Thứ Hai")).toBeNull();

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: /Tinh chỉnh thêm/ }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.getByLabelText("Thứ Hai")).toBeTruthy();
  });

  it("never lets a habit end up with no day at all", () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Thiền" } });
    openAdvanced();

    for (const day of ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]) {
      fireEvent.click(screen.getByLabelText(day));
    }

    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    // The seventh press is refused: Sunday stays on. Silently re-checking all
    // seven behind the user's back would be worse than simply not moving.
    expect(onSubmit.mock.calls[0][0].repeatDays).toEqual([7]);
  });

  it("a habit can sit in two parts of the day", () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Uống thuốc" } });
    openAdvanced();

    fireEvent.click(screen.getByRole("checkbox", { name: /Sáng/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Tối/ }));
    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    expect(onSubmit.mock.calls[0][0].timesOfDay).toEqual(["morning", "evening"]);
  });

  it("'Cả ngày' clears the individual parts", () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Uống thuốc" } });
    openAdvanced();

    fireEvent.click(screen.getByRole("checkbox", { name: /Sáng/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Cả ngày/ }));
    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    expect(onSubmit.mock.calls[0][0].timesOfDay).toEqual(["anytime"]);
  });

  it("carries the motivation note and the card colour through", () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Tên thói quen"), { target: { value: "Thiền" } });
    openAdvanced();
    fireEvent.change(screen.getByLabelText("Vì sao mình làm việc này?"), {
      target: { value: "Để đầu óc nhẹ hơn" }
    });
    fireEvent.click(screen.getByRole("radio", { name: "Màu thẻ sky" }));
    fireEvent.click(screen.getByRole("button", { name: /Trồng thói quen/ }));

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      motivation: "Để đầu óc nhẹ hơn",
      color: "sky"
    });
  });
});

describe("HabitEditorSheet — edit mode", () => {
  it("opens with the habit's own values", () => {
    setup(existingHabit());

    expect((screen.getByLabelText("Tên thói quen") as HTMLInputElement).value).toBe(
      "Uống đủ nước"
    );
    expect((screen.getByLabelText("Mục tiêu mỗi ngày") as HTMLInputElement).value).toBe("8");
    expect(screen.getByRole("button", { name: /Lưu thay đổi/ })).toBeTruthy();
  });

  it("offers pause and archive, which creating does not", () => {
    const { onPause, onArchive } = setup(existingHabit());

    openAdvanced();
    fireEvent.click(screen.getByRole("button", { name: /Tạm dừng/ }));
    expect(onPause).toHaveBeenCalledWith("water", true);

    fireEvent.click(screen.getByRole("button", { name: /Lưu trữ/ }));
    expect(onArchive).toHaveBeenCalledWith("water", true);
  });

  it("a paused habit offers to resume instead", () => {
    const { onPause } = setup(existingHabit({ pausedAt: "2026-07-20" }));

    openAdvanced();
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/ }));

    expect(onPause).toHaveBeenCalledWith("water", false);
  });
});
