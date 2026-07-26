import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileMenu } from "@/components/dashboard/profile-menu";

function setup() {
  const onSignOut = vi.fn();
  const onOpenProfile = vi.fn();
  const onOpenSettings = vi.fn();

  render(
    <ProfileMenu
      email="dev@betterme.local"
      onOpenProfile={onOpenProfile}
      onOpenSettings={onOpenSettings}
      onSignOut={onSignOut}
    />
  );

  return { onSignOut, onOpenProfile, onOpenSettings };
}

describe("ProfileMenu", () => {
  it("renders a collapsed account trigger naming the email", () => {
    setup();

    const trigger = screen.getByRole("button", { name: /dev@betterme\.local/i });

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // The menu is not mounted until opened.
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the menu with the three account actions and focuses the first item", () => {
    setup();

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));

    const menu = screen.getByRole("menu");

    expect(within(menu).getByRole("menuitem", { name: /Hồ sơ/ })).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: /Cài đặt/ })).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: /Đăng xuất/ })).toBeTruthy();
    expect(document.activeElement).toBe(within(menu).getByRole("menuitem", { name: /Hồ sơ/ }));
  });

  it("invokes the matching handler and closes when an item is chosen", () => {
    const { onSignOut, onOpenProfile, onOpenSettings } = setup();

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Đăng xuất/ }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(onOpenProfile).not.toHaveBeenCalled();
    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("routes Hồ sơ and Cài đặt to their own handlers", () => {
    const { onOpenProfile, onOpenSettings } = setup();

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Hồ sơ/ }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cài đặt/ }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and returns focus to the trigger", () => {
    setup();

    const trigger = screen.getByRole("button", { name: /dev@betterme\.local/i });

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when clicking outside the control", () => {
    setup();

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("moves focus with ArrowDown/ArrowUp roving navigation", () => {
    setup();

    fireEvent.click(screen.getByRole("button", { name: /dev@betterme\.local/i }));
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Cài đặt/ }));

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Hồ sơ/ }));

    // Wraps to the last item.
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Đăng xuất/ }));
  });
});
