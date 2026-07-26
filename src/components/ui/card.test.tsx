import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("is a cream surface with a warm hairline by default", () => {
    render(<Card data-testid="card">nội dung</Card>);

    const card = screen.getByTestId("card");

    expect(card.className).toContain("bg-surface-card");
    expect(card.className).toContain("border-line");
    expect(card.className).toContain("rounded-card");
  });

  it("wears the honey gradient in the warm tone", () => {
    render(
      <Card data-testid="card" tone="warm">
        chuỗi
      </Card>
    );

    const card = screen.getByTestId("card");

    expect(card.className).toContain("from-honey-from");
    expect(card.className).toContain("to-honey-to");
  });

  it("wears the green wash in the done tone", () => {
    render(
      <Card data-testid="card" tone="done">
        xong
      </Card>
    );

    expect(screen.getByTestId("card").className).toContain("bg-surface-success");
  });

  it("keeps caller classes", () => {
    render(
      <Card className="mt-4" data-testid="card">
        x
      </Card>
    );

    expect(screen.getByTestId("card").className).toContain("mt-4");
  });
});
