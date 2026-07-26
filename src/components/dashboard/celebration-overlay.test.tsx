import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CelebrationOverlay } from "@/components/dashboard/celebration-overlay";

describe("CelebrationOverlay", () => {
  it("renders nothing decorative and stays silent when not celebrating", () => {
    const { container } = render(<CelebrationOverlay show={false} />);

    expect(container.querySelectorAll(".firework").length).toBe(0);
    expect(container.querySelector('[data-testid="celebration-fireworks"]')).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("blooms decorative fireworks and announces a no-guilt message when all done", () => {
    const { container } = render(<CelebrationOverlay show />);

    // 3 bursts × 10 particles, plus one soft glow per burst.
    expect(container.querySelectorAll(".firework").length).toBe(30);
    expect(container.querySelectorAll(".firework-glow").length).toBe(3);

    const layer = container.querySelector('[data-testid="celebration-fireworks"]');
    expect(layer?.getAttribute("aria-hidden")).toBe("true");

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("khu vườn");
    // No-guilt: never a word about what's missing/undone.
    expect(status.textContent?.toLowerCase()).not.toContain("thua");
    expect(status.textContent).not.toContain("chưa");
  });

  it("gives each firework particle its own trajectory + color custom properties", () => {
    const { container } = render(<CelebrationOverlay show />);

    const particle = container.querySelector<HTMLElement>(".firework");
    expect(particle).toBeTruthy();

    const style = particle!.getAttribute("style") ?? "";
    expect(style).toContain("--fw-dx");
    expect(style).toContain("--fw-dy");
    expect(style).toContain("--fw-clr");
  });
});
