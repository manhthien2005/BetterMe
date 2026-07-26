import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("defaults to the primary tier — terracotta fill, white ink", () => {
    render(<Button>Lưu</Button>);

    const button = screen.getByRole("button", { name: "Lưu" });

    expect(button.className).toContain("bg-action");
    expect(button.className).toContain("text-action-ink");
  });

  it("renders the secondary tier as cream with a warm hairline", () => {
    render(<Button variant="secondary">Để sau</Button>);

    const button = screen.getByRole("button", { name: "Để sau" });

    expect(button.className).toContain("bg-surface-card");
    expect(button.className).toContain("border-line-strong");
    expect(button.className).not.toContain("bg-action ");
  });

  it("renders the ghost tier as bare action-coloured text", () => {
    render(<Button variant="ghost">Ghé thăm</Button>);

    const button = screen.getByRole("button", { name: "Ghé thăm" });

    expect(button.className).toContain("text-action");
    expect(button.className).not.toContain("border");
  });

  it("keeps every tier at a 44px-tall touch target", () => {
    render(
      <>
        <Button>A</Button>
        <Button variant="secondary">B</Button>
        <Button variant="ghost">C</Button>
      </>
    );

    for (const name of ["A", "B", "C"]) {
      expect(screen.getByRole("button", { name }).className).toContain("h-11");
    }
  });

  it("token-ises the focus ring", () => {
    render(<Button>Focus</Button>);

    expect(screen.getByRole("button", { name: "Focus" }).className).toContain(
      "focus-visible:ring-action"
    );
  });
});
