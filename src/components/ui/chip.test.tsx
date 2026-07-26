import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "@/components/ui/chip";

describe("Chip", () => {
  it("is a neutral pill by default", () => {
    render(<Chip data-testid="chip">⛅ 31°</Chip>);

    const chip = screen.getByTestId("chip");

    expect(chip.className).toContain("rounded-pill");
    expect(chip.className).toContain("text-ink-soft");
  });

  it("uses success INK, never the success fill, for text", () => {
    render(
      <Chip data-testid="chip" tone="success">
        +1 🌾
      </Chip>
    );

    const chip = screen.getByTestId("chip");

    expect(chip.className).toContain("text-success-ink");
    expect(chip.className).not.toContain("text-success ");
  });

  it("renders the streak tone on honey", () => {
    render(
      <Chip data-testid="chip" tone="warm">
        🔥 26
      </Chip>
    );

    expect(screen.getByTestId("chip").className).toContain("bg-surface-warm");
  });

  it("renders the action tone", () => {
    render(
      <Chip data-testid="chip" tone="action">
        Mới
      </Chip>
    );

    expect(screen.getByTestId("chip").className).toContain("text-action");
  });
});
