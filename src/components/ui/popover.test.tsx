import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

function renderPopover(contentClassName?: string) {
  return render(
    <Popover>
      <PopoverTrigger>Chi tiết</PopoverTrigger>
      <PopoverContent className={contentClassName}>
        <p>Sài Gòn, 31°C</p>
      </PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  it("says whether it is open, so a screen reader is not left guessing", () => {
    renderPopover();

    const trigger = screen.getByRole("button", { name: "Chi tiết" });

    // Radix owns aria-expanded, but only if the trigger is wired to the root —
    // a hand-rolled trigger is exactly where this attribute goes missing.
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Sài Gòn, 31°C")).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Sài Gòn, 31°C")).toBeTruthy();
  });

  it("closes on Escape without the caller wiring a key handler", () => {
    renderPopover();

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết" }));
    expect(screen.getByText("Sài Gòn, 31°C")).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

    expect(screen.queryByText("Sài Gòn, 31°C")).toBeNull();
  });

  it("keeps its own token classes when the caller adds more", () => {
    // A primitive that drops its base classes on merge is a primitive every
    // caller has to re-style — the whole point is one look in one place.
    renderPopover("w-72");

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết" }));

    const content = screen.getByText("Sài Gòn, 31°C").parentElement!;

    expect(content.className).toContain("w-72");
    expect(content.className).toContain("bg-surface-card");
  });

  it("speaks tokens, not the v2 palette", () => {
    const { baseElement } = renderPopover();

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết" }));

    expect(baseElement.innerHTML).not.toMatch(/matcha|sakura|plum|wafer|mauve|butter|mochi/);
  });
});
